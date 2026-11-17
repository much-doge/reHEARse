#!/usr/bin/env python3
"""Build teacher-only transcript metadata from the authorized source scripts."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / "apps/protefl-center/content"
WEB_TRANSCRIPT = "https://tingroom.com/print_68978.html"


def clean_text(value: str) -> str:
    value = html.unescape(value).replace("\u00a0", " ").replace("\u0007", "")
    value = re.sub(r"[（(][^()（）]*[\u3400-\u9fff][^()（）]*[)）]", "", value)
    value = value.replace("#p#副标题#e#", "")
    return re.sub(r"\s+", " ", value).strip()


def speaker_name(value: str) -> str:
    return {"m": "Man", "w": "Woman", "man": "Man", "woman": "Woman", "narrator": "Narrator"}.get(value.lower(), "Speaker")


def speaker_segments(block: str) -> list[dict[str, str]]:
    block = block.replace("\f", "\n")
    block = re.sub(r"(?m)^\s*Listening Comprehension Script[^\n]*$", "", block)
    block = re.sub(r"(?m)^\s*\d{2,3}\s*$", "", block)
    segments: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for raw_line in block.splitlines():
        line = raw_line.rstrip()
        match = re.match(r"^\s*(?:\d+\.\s+)?\((man|woman|narrator)\)\s+(.*)$", line, re.I)
        if match:
            current = {"speaker": speaker_name(match.group(1)), "text": clean_text(match.group(2))}
            segments.append(current)
        elif current and clean_text(line):
            current["text"] = clean_text(current["text"] + " " + line)
    return [segment for segment in segments if segment["text"]]


def monologue_segment(block: str) -> list[dict[str, str]]:
    block = block.replace("\f", "\n")
    block = re.sub(r"(?m)^\s*Listening Comprehension Script[^\n]*$", "", block)
    block = re.sub(r"(?m)^\s*\d{2,3}\s*$", "", block)
    text = clean_text(" ".join(block.splitlines()))
    return [{"speaker": "Speaker", "text": text}] if text else []


def package_data(directory: Path) -> tuple[dict, dict, dict]:
    manifest = json.loads((directory / "package-manifest.json").read_text())
    question_file = next(item["path"] for item in manifest["sourceFiles"] if item["path"].startswith("metadata/questions-"))
    questions = json.loads((directory / question_file).read_text())
    map_data = json.loads((directory / "metadata/listening-question-map-v1.json").read_text())
    return manifest, questions, map_data


def write_transcript(directory: Path, source: dict, groups: list[dict], question_rows: list[dict]) -> None:
    output = {
        "schemaVersion": "teacher-listening-transcript.v1",
        "package": json.loads((directory / "package-manifest.json").read_text())["package"],
        "source": source,
        "groups": groups,
        "questions": question_rows,
    }
    target = directory / "teacher/listening-transcript-v1.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")


def build_book_package(directory_name: str, layout_name: str, source_label: str, printed_pages: str) -> None:
    directory = CONTENT / directory_name
    _, question_data, map_data = package_data(directory)
    prompts = {int(item["number"]): clean_text(item["prompt"]) for item in question_data["listening"]}
    map_rows = {int(item["question"]): item for item in map_data["questions"]}
    layout = (directory / "source" / layout_name).read_text()
    start = layout.index("Listening Comprehension Script–Practice Test A")
    end = layout.index("Listening Comprehension Script – Practice Test B", start + 1)
    script = layout[start:end]
    part_a = script[script.index("Part A"):script.index("Part B")]
    matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s+\((man|woman)\)\s+", part_a, re.I))
    groups: list[dict] = []
    question_rows: list[dict] = []
    for index, match in enumerate(matches):
        question = int(match.group(1))
        block = part_a[match.start():matches[index + 1].start() if index + 1 < len(matches) else len(part_a)]
        segments = [segment for segment in speaker_segments(block) if segment["speaker"] != "Narrator"]
        group_id = f"part-a-q{question}"
        groups.append({"id": group_id, "type": "question", "questions": [question, question], "segments": segments})
        question_rows.append({"question": question, "groupId": group_id, "questionCue": prompts[question]})

    grouped_script = script[script.index("Part B"):]
    headers = list(re.finditer(r"(?mi)^\s*Questions\s+(\d+)\s+through\s+(\d+):[^\n]*", grouped_script))
    for index, header in enumerate(headers):
        first, last = int(header.group(1)), int(header.group(2))
        block = grouped_script[header.end():headers[index + 1].start() if index + 1 < len(headers) else len(grouped_script)]
        question_start = re.search(rf"(?m)^\s*{first}\.\s+(?!\()", block)
        context = block[:question_start.start()] if question_start else block
        segments = speaker_segments(context)
        group_id = map_rows[first]["groupId"]
        group_type = map_rows[first]["groupType"]
        if group_type == "talk" and not segments:
            segments = monologue_segment(context)
        groups.append({"id": group_id, "type": group_type, "questions": [first, last], "segments": segments})
        for question in range(first, last + 1):
            question_rows.append({"question": question, "groupId": group_id, "questionCue": prompts[question]})

    write_transcript(directory, {
        "kind": "published-script",
        "label": source_label,
        "location": printed_pages,
        "note": "Published Listening Comprehension Script from the owner-authorized source book.",
    }, groups, sorted(question_rows, key=lambda row: row["question"]))


def build_may_2005() -> None:
    directory = CONTENT / "ets-toefl-pbt-2005-05-listening-v1"
    _, question_data, map_data = package_data(directory)
    prompts = {int(item["number"]): clean_text(item["prompt"]) for item in question_data["listening"]}
    map_rows = {int(item["question"]): item for item in map_data["questions"]}
    request = Request(WEB_TRANSCRIPT, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=30) as response:
        page = response.read().decode("utf-8")
    container = re.search(r'<div\s+id="enText"[^>]*>(.*?)</div>', page, re.I | re.S)
    if not container:
        raise RuntimeError("May 2005 transcript body not found")
    transcript_html = re.sub(r"<br\s*/?>", "\n", container.group(1), flags=re.I)
    transcript_html = re.sub(r"<[^>]+>", "", transcript_html)
    lines = [clean_text(line) for line in transcript_html.splitlines() if clean_text(line)]
    text = "\n".join(lines)
    part_a_start = text.index("Part A")
    part_b_start = text.index("Part B", part_a_start)
    part_a = text[part_a_start:part_b_start]
    item_matches = list(re.finditer(r"(?m)^(\d+)[.:]\s*([MW]):\s*(.*)$", part_a))
    groups: list[dict] = []
    question_rows: list[dict] = []
    for index, match in enumerate(item_matches):
        question = int(match.group(1))
        block = part_a[match.start():item_matches[index + 1].start() if index + 1 < len(item_matches) else len(part_a)]
        segments: list[dict[str, str]] = []
        for line in block.splitlines():
            speaker = re.match(r"^(?:\d+[.:]\s*)?([MW]):\s*(.*)$", line)
            if speaker:
                segments.append({"speaker": speaker_name(speaker.group(1)), "text": clean_text(speaker.group(2))})
        group_id = f"part-a-q{question}"
        groups.append({"id": group_id, "type": "question", "questions": [question, question], "segments": segments})
        question_rows.append({"question": question, "groupId": group_id, "questionCue": prompts[question]})

    grouped = text[part_b_start:]
    headers = list(re.finditer(r"(?mi)^Question\s*([0-9]+)\s*-\s*([0-9]+)\s*$", grouped))
    for index, header in enumerate(headers):
        first, last = int(header.group(1)), int(header.group(2))
        block = grouped[header.end():headers[index + 1].start() if index + 1 < len(headers) else len(grouped)]
        question_start = re.search(rf"(?m)^\s*{first}\.\s+", block)
        context = block[:question_start.start()] if question_start else block
        segments: list[dict[str, str]] = []
        if first < 39:
            current: dict[str, str] | None = None
            for line in context.splitlines():
                speaker = re.match(r"^([MW]):\s*(.*)$", line)
                if speaker:
                    current = {"speaker": speaker_name(speaker.group(1)), "text": clean_text(speaker.group(2))}
                    segments.append(current)
                elif current and clean_text(line):
                    current["text"] = clean_text(current["text"] + " " + line)
        else:
            monologue = clean_text(" ".join(context.splitlines()))
            if monologue:
                segments = [{"speaker": "Speaker", "text": monologue}]
        group_id = map_rows[first]["groupId"]
        group_type = map_rows[first]["groupType"]
        groups.append({"id": group_id, "type": group_type, "questions": [first, last], "segments": segments})
        for question in range(first, last + 1):
            question_rows.append({"question": question, "groupId": group_id, "questionCue": prompts[question]})

    write_transcript(directory, {
        "kind": "reviewed-unofficial-transcript",
        "label": "May 2005 Listening transcript",
        "url": WEB_TRANSCRIPT,
        "note": "Unofficial transcript aligned to the owner-supplied recording. Teachers should treat wording as a review aid, not an ETS-issued script.",
    }, groups, sorted(question_rows, key=lambda row: row["question"]))


def main() -> None:
    build_book_package(
        "ets-volume1-practice-test-a-v1",
        "ets-toefl-itp-level1-volume1-layout.txt",
        "ETS TOEFL ITP Level 1 Practice Tests, Volume 1 — Practice Test A Listening Comprehension Script",
        "printed pages 96–107",
    )
    build_book_package(
        "ets-volume3-practice-test-a-v1",
        "ets-toefl-itp-volume-3-layout.txt",
        "ETS TOEFL ITP Level 1 Practice Tests, Volume 3 — Practice Test A Listening Comprehension Script",
        "printed pages 106–121",
    )
    build_may_2005()


if __name__ == "__main__":
    main()
