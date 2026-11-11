"""Build a private, teacher-facing Listening attempt analysis PDF.

The export and package files are supplied at runtime so that learner data and
answer records never enter the repository. The report uses the latest answer
event for a question within each attempt, counts focused retakes as separate
attempts, and preserves the distinction between answered and omitted items.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


PAPER = colors.HexColor("#F3F0E8")
SURFACE = colors.HexColor("#FFFDF7")
INK = colors.HexColor("#17202A")
MUTED = colors.HexColor("#62706F")
BLUE = colors.HexColor("#3164F4")
LEAF = colors.HexColor("#1F7A5A")
CLAY = colors.HexColor("#B25F3F")
LINE = colors.HexColor("#D9D7CF")
PALE_GREEN = colors.HexColor("#E8F4EB")
PALE_BLUE = colors.HexColor("#EAF0FF")
PALE_CLAY = colors.HexColor("#FBEAE3")


@dataclass
class AttemptView:
    participant: dict[str, Any]
    attempt: dict[str, Any]
    selected: set[int]
    answers: dict[int, dict[str, Any]]


def esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def pct(numerator: int, denominator: int) -> str:
    if not denominator:
        return "—"
    return f"{numerator / denominator * 100:.1f}%"


def latest_answers(events: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    result: dict[int, dict[str, Any]] = {}
    for event in events:
        if event.get("section") != "listening" or event.get("event_type") != "answer":
            continue
        question = event.get("question_number")
        choice = event.get("answer_choice")
        if not isinstance(question, int) or not 1 <= question <= 50:
            continue
        if choice not in {"A", "B", "C", "D"}:
            continue
        result[question] = event
    return result


def build_attempts(export: dict[str, Any]) -> list[AttemptView]:
    attempts: list[AttemptView] = []
    for participant in export.get("participants", []):
        for assignment in participant.get("assignments", []):
            for attempt in assignment.get("attempts", []):
                events = attempt.get("events", [])
                has_listening_event = any(event.get("section") == "listening" for event in events)
                if attempt.get("scope") not in {"full", "listening"} and not has_listening_event:
                    continue
                selected = attempt.get("selectedQuestions")
                if isinstance(selected, list) and selected:
                    selected_set = {int(value) for value in selected if 1 <= int(value) <= 50}
                else:
                    selected_set = set(range(1, 51))
                attempts.append(AttemptView(participant, attempt, selected_set, latest_answers(events)))
    return attempts


def classify_question(question: dict[str, Any], group_id: str) -> tuple[str, str]:
    number = int(question["number"])
    prompt = question.get("prompt", "").lower()
    if number <= 30:
        if re.search(r"suggest|probably do next", prompt):
            return "Suggestions, responses and intentions", "Part A · Skills 11–13"
        if "inferred" in prompt:
            return "Supported inference", "Part A · Skills 4–6"
        return "Restatement and sequence", "Part A · Skills 1–3"
    if number <= 37 or group_id.startswith("part-b"):
        return "Dialogue comprehension and supported inference", "Part B · Skills 18–22"
    return "Talk comprehension, purpose and detail", "Part C · Skills 23–27"


def make_stats(attempts: list[AttemptView], questions: list[dict[str, Any]], keys: list[str], group_map: dict[int, str]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    question_stats: list[dict[str, Any]] = []
    family_stats: dict[str, dict[str, Any]] = {}
    for question in questions:
        number = int(question["number"])
        family, reference = classify_question(question, group_map.get(number, ""))
        row = {
            "number": number,
            "prompt": question.get("prompt", ""),
            "key": keys[number - 1],
            "family": family,
            "reference": reference,
            "eligible": 0,
            "answered": 0,
            "correct": 0,
            "wrong": 0,
            "omitted": 0,
            "wrong_details": [],
        }
        for attempt in attempts:
            if number not in attempt.selected:
                continue
            row["eligible"] += 1
            answer = attempt.answers.get(number)
            if answer is None:
                row["omitted"] += 1
                continue
            row["answered"] += 1
            choice = answer["answer_choice"]
            if choice == row["key"]:
                row["correct"] += 1
            else:
                row["wrong"] += 1
                requested_name = attempt.participant.get("requestedName") or attempt.participant.get("matchedAccount", {}).get("displayName") or "Unknown participant"
                attempt_number = attempt.attempt.get("attemptNumber") or "?"
                scope = attempt.attempt.get("scope", "attempt")
                label = f"{requested_name} · {scope} {attempt_number} · {choice} (key {row['key']})"
                row["wrong_details"].append(label)
        question_stats.append(row)
        family = family_stats.setdefault(family, {"reference": reference, "questions": [], "eligible": 0, "answered": 0, "correct": 0, "wrong": 0, "omitted": 0})
        family["questions"].append(number)
        for field in ("eligible", "answered", "correct", "wrong", "omitted"):
            family[field] += row[field]
    return question_stats, family_stats


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=LEAF, spaceAfter=5),
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Times-Roman", fontSize=27, leading=29, textColor=INK, alignment=TA_LEFT, spaceAfter=8),
        "subtitle": ParagraphStyle("subtitle", parent=base["BodyText"], fontName="Helvetica", fontSize=10.2, leading=14, textColor=MUTED, spaceAfter=9),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Times-Roman", fontSize=19, leading=22, textColor=INK, spaceBefore=2, spaceAfter=8),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=INK, spaceBefore=4, spaceAfter=4),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=9, leading=13, textColor=INK, spaceAfter=6),
        "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica", fontSize=7.2, leading=9.5, textColor=MUTED, spaceAfter=4),
        "table": ParagraphStyle("table", parent=base["BodyText"], fontName="Helvetica", fontSize=7.1, leading=8.8, textColor=INK),
        "table_small": ParagraphStyle("table_small", parent=base["BodyText"], fontName="Helvetica", fontSize=6.3, leading=7.6, textColor=INK),
        "table_head": ParagraphStyle("table_head", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=6.8, leading=8.2, textColor=INK, alignment=TA_CENTER),
        "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.5, textColor=INK, leftIndent=7, rightIndent=7, spaceAfter=2),
    }


def callout(text: str, tone: colors.Color, s: dict[str, ParagraphStyle]) -> Table:
    table = Table([[Paragraph(text, s["callout"])]], colWidths=[174 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), tone),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("ROUNDEDCORNERS", [7, 7, 7, 7]),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(filename, pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=14 * mm, bottomMargin=14 * mm)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="body", frames=[frame])])


def table(data: list[list[Any]], widths: list[float], s: dict[str, ParagraphStyle], header_rows: int = 1, small: bool = False, alignments: dict[int, str] | None = None) -> LongTable:
    style_name = "table_small" if small else "table"
    converted = []
    for row_index, row in enumerate(data):
        converted.append([cell if isinstance(cell, Paragraph) else Paragraph(esc(cell), s["table_head"] if row_index < header_rows else s[style_name]) for cell in row])
    output = LongTable(converted, colWidths=widths, repeatRows=header_rows)
    commands: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), PALE_GREEN),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for row_index in range(header_rows, len(converted)):
        if row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#FAF9F3")))
    if alignments:
        for column, alignment in alignments.items():
            commands.append(("ALIGN", (column, 0), (column, -1), alignment))
    output.setStyle(TableStyle(commands))
    return output


def participant_summary(attempts: list[AttemptView], keys: list[str]) -> list[list[Any]]:
    rows = [["Participant", "Account match", "Attempts", "Final responses", "Correct", "Wrong", "Wrong %"]]
    grouped: dict[str, list[AttemptView]] = defaultdict(list)
    for attempt in attempts:
        name = attempt.participant.get("requestedName", "Unknown participant")
        grouped[name].append(attempt)
    for participant in sorted({item.participant.get("requestedName", "Unknown participant") for item in attempts}):
        items = grouped[participant]
        first = items[0].participant
        answered = correct = wrong = 0
        for item in items:
            for question, answer in item.answers.items():
                answered += 1
                if answer["answer_choice"] == keys[question - 1]:
                    correct += 1
                else:
                    wrong += 1
        match = first.get("accountMatch", "unknown")
        rows.append([participant, match, len(items), answered, correct, wrong, pct(wrong, answered)])
    return rows


def build_report(export_path: Path, question_path: Path, key_path: Path, map_path: Path, output_path: Path) -> None:
    export = json.loads(export_path.read_text(encoding="utf-8"))
    question_data = json.loads(question_path.read_text(encoding="utf-8"))
    key_data = json.loads(key_path.read_text(encoding="utf-8"))
    map_data = json.loads(map_path.read_text(encoding="utf-8"))
    questions = question_data["listening"]
    keys = key_data["sections"]["listening"]
    group_map = {int(item["question"]): item["groupId"] for item in map_data["questions"]}
    attempts = build_attempts(export)
    question_stats, family_stats = make_stats(attempts, questions, keys, group_map)
    s = styles()
    matched = [participant for participant in export.get("participants", []) if participant.get("matchedAccount")]
    not_found = [participant for participant in export.get("participants", []) if not participant.get("matchedAccount")]
    answer_attempts = [attempt for attempt in attempts if attempt.answers]
    total_answers = sum(len(attempt.answers) for attempt in attempts)
    total_wrong = sum(row["wrong"] for row in question_stats)
    total_correct = sum(row["correct"] for row in question_stats)

    story: list[Any] = [
        Paragraph("LISTENING ANALYSIS", s["kicker"]),
        Paragraph("Evening-class diagnostic review", s["title"]),
        Paragraph("TOEFL ITP Level 1 · Practice Test A · Listening questions 1–50", s["subtitle"]),
        HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=9),
        callout(
            f"Coverage: {len(export.get('participants', []))} requested participants, {len(matched)} matched accounts, {len(not_found)} not found; {len(attempts)} listening-bearing attempt records, {len(answer_attempts)} with saved responses, and {total_answers} final question responses.",
            PALE_BLUE,
            s,
        ),
        Spacer(1, 3 * mm),
        Paragraph("Executive summary", s["h2"]),
        Paragraph(
            f"Across the saved final responses, {total_wrong} were incorrect and {total_correct} were correct. The report counts the latest response for each question within each attempt, so repeated taps on the same question are not double-counted. Focused Listening retakes remain separate attempt records and are included in the totals.",
            s["body"],
        ),
        Paragraph("The percentages in the question tables use recorded responses for that question as the denominator. The omitted column shows eligible attempt records without a final answer for that question; a focused retake is eligible only for its selected question set.", s["body"]),
        Spacer(1, 2 * mm),
        Paragraph("Participant coverage", s["h2"]),
        table(
            [["Requested participant", "Requested email", "Account match", "Attempts"]]
            + [[
                participant.get("requestedName", "Unknown"),
                participant.get("requestedEmail", "—"),
                participant.get("accountMatch", "unknown"),
                sum(len(assignment.get("attempts", [])) for assignment in participant.get("assignments", [])),
            ] for participant in export.get("participants", [])],
            [47 * mm, 59 * mm, 31 * mm, 20 * mm],
            s,
            alignments={3: "CENTER"},
        ),
    ]
    if not_found:
        names = ", ".join(esc(participant.get("requestedName", "Unknown")) for participant in not_found)
        story += [Spacer(1, 2 * mm), callout(f"No matching account was found for: {names}. No attempt data is inferred or created for an unmatched participant.", PALE_CLAY, s)]

    story += [PageBreak(), Paragraph("Longman skill-family view", s["kicker"]), Paragraph("Where the errors cluster", s["h2"]), Paragraph("The categories below use the Longman Part A Short Dialogues map recorded in the project source register and the Part B/C preparation map. Part A labels are assigned from the question function (for example, inference or suggestion); Part B/C labels are assigned at the shared dialogue/talk group level. They are instructional groupings for discussion, not publisher-authenticated item tags.", s["body"])]
    family_rows = [["Instructional family", "Longman reference", "Questions", "Answered", "Wrong", "Wrong %", "Omitted"]]
    for family, data in family_stats.items():
        family_rows.append([family, data["reference"], ", ".join(map(str, data["questions"])), data["answered"], data["wrong"], pct(data["wrong"], data["answered"]), data["omitted"]])
    story += [table(family_rows, [47 * mm, 31 * mm, 35 * mm, 17 * mm, 16 * mm, 18 * mm, 16 * mm], s, alignments={3: "CENTER", 4: "CENTER", 5: "CENTER", 6: "CENTER"}), Spacer(1, 3 * mm), Paragraph("Interpretation notes", s["h3"]), Paragraph("Skills 14–15 (wishes and untrue conditions) are not forced into the analysis because the current report export does not contain reviewed item-level tags for those patterns. Negatives/near-negatives (Skills 7–10) and idioms/multiword expressions (Skills 16–17) likewise remain available in the Longman preparation material but are not claimed as separate item classifications here without a reviewed transcript-level mapping.", s["body"]), callout("Use the family table to choose a teaching focus, then open the individual question details below to inspect the exact response and key.", PALE_GREEN, s)]

    story += [PageBreak(), Paragraph("Question frequency", s["kicker"]), Paragraph("Questions 1–50", s["h2"]), Paragraph("Every listening question is listed. Questions with no recorded response are not silently treated as wrong; they appear in the omitted column.", s["body"])]
    q_rows = [["Q", "Part / Longman family", "Key", "Eligible", "Answered", "Wrong", "Wrong %", "Omitted"]]
    for row in question_stats:
        part = "A" if row["number"] <= 30 else "B" if row["number"] <= 37 else "C"
        q_rows.append([row["number"], f"{part} · {row['family']}", row["key"], row["eligible"], row["answered"], row["wrong"], pct(row["wrong"], row["answered"]), row["omitted"]])
    story += [table(q_rows, [10 * mm, 78 * mm, 13 * mm, 16 * mm, 19 * mm, 16 * mm, 19 * mm, 16 * mm], s, small=True, alignments={0: "CENTER", 2: "CENTER", 3: "CENTER", 4: "CENTER", 5: "CENTER", 6: "CENTER", 7: "CENTER"})]

    story += [PageBreak(), Paragraph("Wrong-response detail", s["kicker"]), Paragraph("Who missed which question", s["h2"]), Paragraph("The table includes every question with at least one incorrect final response. A participant can appear more than once when a full attempt and a focused retake both contain an incorrect final response.", s["body"])]
    wrong_rows = [["Q", "Prompt", "Key", "Wrong", "Wrong %", "Recorded wrong responses"]]
    for row in question_stats:
        if not row["wrong"]:
            continue
        details = "<br/>".join(esc(detail) for detail in row["wrong_details"])
        wrong_rows.append([row["number"], row["prompt"], row["key"], row["wrong"], pct(row["wrong"], row["answered"]), Paragraph(details, s["table_small"])])
    story += [table(wrong_rows, [9 * mm, 48 * mm, 11 * mm, 13 * mm, 17 * mm, 76 * mm], s, small=True, alignments={0: "CENTER", 2: "CENTER", 3: "CENTER", 4: "CENTER"})]

    story += [PageBreak(), Paragraph("Participant summary", s["kicker"]), Paragraph("Attempt-level comparison", s["h2"]), Paragraph("This table aggregates final responses across each participant's saved listening attempts, including focused retakes. It is intended for teacher discussion and answer review, not as a formal placement result.", s["body"]), table(participant_summary(attempts, keys), [49 * mm, 22 * mm, 18 * mm, 25 * mm, 19 * mm, 16 * mm, 19 * mm], s, alignments={2: "CENTER", 3: "CENTER", 4: "CENTER", 5: "CENTER", 6: "CENTER"}), Spacer(1, 4 * mm), Paragraph("Method and limits", s["h2"]), Paragraph("The source export is server-observed attempt/event data. It records saved choices and timestamps; it does not establish whether audio was audible at a particular instant or how a participant reasoned. The answer key is the current Practice Test A Listening key in the versioned package. Alias matches are retained in the coverage table as reported by the export; the unmatched Tiara account is not included in response totals.", s["body"]), callout("For the evening discussion, start with the highest wrong percentages in the Question frequency table, then open the corresponding attempts in the teacher workspace to review each learner's response and the answer key.", PALE_BLUE, s)]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ReportDocTemplate(str(output_path)).build(story)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export_json", type=Path)
    parser.add_argument("questions_json", type=Path)
    parser.add_argument("answer_key_json", type=Path)
    parser.add_argument("question_map_json", type=Path)
    parser.add_argument("output_pdf", type=Path)
    args = parser.parse_args()
    build_report(args.export_json, args.questions_json, args.answer_key_json, args.question_map_json, args.output_pdf)


if __name__ == "__main__":
    main()
