#!/usr/bin/env python3
"""Build the web-native Practice Test A item package from the authorized PDF."""

from __future__ import annotations

import json
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "apps/protefl-center/content/ets-volume3-practice-test-a-v1"
PDF = PACKAGE / "source/ets-toefl-itp-volume-3.pdf"
OUT = PACKAGE / "metadata/questions-practice-test-a-v1.json"
NS = {"x": "http://www.w3.org/1999/xhtml"}
LETTERS = ("A", "B", "C", "D")


def block_text(block: ET.Element) -> str:
    return " ".join((word.text or "") for word in block.findall(".//x:word", NS))


def page_blocks(page_number: int, work: Path) -> list[dict]:
    target = work / f"page-{page_number}.html"
    subprocess.run(["pdftotext", "-f", str(page_number), "-l", str(page_number), "-bbox-layout", str(PDF), str(target)], check=True)
    page = ET.parse(target).getroot().find(".//x:page", NS)
    assert page is not None
    result = []
    for block in page.findall(".//x:block", NS):
        result.append({
            "x": float(block.attrib["xMin"]),
            "y": float(block.attrib["yMin"]),
            "text": block_text(block),
            "element": block,
        })
    return result


def ordered_columns(blocks: list[dict]) -> list[dict]:
    return sorted(blocks, key=lambda row: (0 if row["x"] < 210 else 1, row["y"]))


def options_from(text: str) -> dict[str, str]:
    matches = list(re.finditer(r"\(([ABCD])\)\s*", text))
    if len(matches) != 4:
        raise ValueError(f"Expected four choices, found {len(matches)}: {text}")
    values = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        values.append(text[match.end():end].strip())
    return dict(zip(LETTERS, values, strict=True))


def standard_questions(pages: list[int], expected: range, work: Path) -> list[dict]:
    items: dict[int, dict] = {}
    for page_number in pages:
        blocks = ordered_columns(page_blocks(page_number, work))
        for index, block in enumerate(blocks):
            match = re.match(r"^(\d+)\.\s+(.+)$", block["text"])
            if not match:
                continue
            number = int(match.group(1))
            if number not in expected:
                continue
            option_block = next((row for row in blocks[index + 1:] if re.match(r"^\([ABCD]\)", row["text"])), None)
            if not option_block:
                raise ValueError(f"Question {number} on page {page_number} has no choices")
            items[number] = {"number": number, "prompt": match.group(2).strip(), "options": options_from(option_block["text"]), "sourcePage": page_number}
    missing = sorted(set(expected) - set(items))
    if missing:
        raise ValueError(f"Missing questions: {missing}")
    return [items[number] for number in expected]


def line_words(block: ET.Element) -> list[dict]:
    words = []
    for line in block.findall(".//x:line", NS):
        for word in line.findall("x:word", NS):
            words.append({
                "text": word.text or "",
                "x0": float(word.attrib["xMin"]), "x1": float(word.attrib["xMax"]),
                "y0": float(word.attrib["yMin"]), "y1": float(word.attrib["yMax"]),
            })
    return words


def underline_paths(page_number: int, work: Path) -> list[dict]:
    prefix = work / f"page-{page_number}"
    subprocess.run(["pdftocairo", "-f", str(page_number), "-l", str(page_number), "-svg", str(PDF), str(prefix) + ".svg"], check=True)
    text = (prefix.with_suffix(".svg")).read_text()
    pattern = re.compile(r'<path fill="none" stroke-width="0\.5"[^>]+d="M [^ ]+ [^ ]+ L ([0-9.]+) [^ ]+ " transform="matrix\(1, 0, 0, -1, ([0-9.]+), ([0-9.]+)\)"/>')
    return [{"x0": float(x), "x1": float(x) + float(length), "y": float(y)} for length, x, y in pattern.findall(text)]


def structure_error_questions(work: Path) -> list[dict]:
    items = []
    for page_number in range(37, 41):
        paths = underline_paths(page_number, work)
        for block in page_blocks(page_number, work):
            match = re.match(r"^(\d+)\.\s+", block["text"])
            if not match or not 16 <= int(match.group(1)) <= 40:
                continue
            number = int(match.group(1))
            words = line_words(block["element"])
            labels = [word for word in words if word["text"] in LETTERS]
            segments: dict[str, str] = {}
            marked_words: dict[int, str] = {}
            for path in paths:
                if not (float(block["element"].attrib["yMin"]) <= path["y"] <= float(block["element"].attrib["yMax"])):
                    continue
                candidates = [(i, word) for i, word in enumerate(words) if word["text"] not in LETTERS and word["y0"] <= path["y"] <= word["y1"] and word["x1"] > path["x0"] and word["x0"] < path["x1"]]
                if not candidates:
                    continue
                label = min(labels, key=lambda word: abs(((word["x0"] + word["x1"]) / 2) - ((path["x0"] + path["x1"]) / 2)) + abs(word["y0"] - path["y"]) * 2)
                if label["text"] in segments:
                    continue
                segment_text = " ".join(word["text"] for _, word in candidates)
                segments[label["text"]] = segment_text
                for index, _word in candidates:
                    marked_words[index] = label["text"]
            if set(segments) != set(LETTERS):
                raise ValueError(f"Structure {number}: expected A-D underlines, got {segments}")
            tokens = []
            for index, word in enumerate(words):
                if word["text"] in LETTERS or (index == 0 and word["text"] == f"{number}."):
                    continue
                tokens.append({"text": word["text"], **({"choice": marked_words[index]} if index in marked_words else {})})
            items.append({"number": number, "tokens": tokens, "options": {letter: segments[letter] for letter in LETTERS}, "sourcePage": page_number})
    items.sort(key=lambda item: item["number"])
    if [item["number"] for item in items] != list(range(16, 41)):
        raise ValueError("Structure Part B item sequence is incomplete")
    return items


def reading_passages(work: Path) -> list[dict]:
    groups = [(1, 10, 44), (11, 21, 48), (22, 32, 52), (33, 42, 56), (43, 50, 60)]
    passages = []
    for start, end, page_number in groups:
        blocks = page_blocks(page_number, work)
        first_question_y = min((block["y"] for block in blocks if re.match(rf"^(?:{start}|{start + 1})\.\s", block["text"])), default=999)
        raw_lines: list[tuple[float, list[dict]]] = []
        for block in blocks:
            for line in block["element"].findall(".//x:line", NS):
                y = float(line.attrib["yMin"])
                if y >= first_question_y:
                    continue
                raw_lines.append((y, [{"text": word.text or "", "x": float(word.attrib["xMin"])} for word in line.findall("x:word", NS)]))
        source_lines: list[tuple[float, list[dict]]] = []
        for y, words in sorted(raw_lines):
            if source_lines and abs(source_lines[-1][0] - y) <= 2.1:
                source_lines[-1][1].extend(words)
            else:
                source_lines.append((y, words))
        candidate_lefts = [word["x"] for y, words in source_lines if y < 570 and not " ".join(item["text"] for item in words).startswith("Questions ") for word in words if word["text"] not in {"Line"} and not word["text"].isdigit() and word["x"] > 30]
        base_x = min(candidate_lefts)
        lines = []
        for y, words in source_lines:
            if y > 570:
                continue
            words = sorted(words, key=lambda word: word["x"])
            text = " ".join(word["text"] for word in words)
            if text.startswith("Questions ") or text == "Line" or all(word["x"] > 330 for word in words):
                continue
            words = [word for word in words if word["text"] != "Line"]
            line_number = None
            if words and words[0]["text"].isdigit() and words[0]["x"] < base_x:
                line_number = int(words.pop(0)["text"])
            words = [word for word in words if word["x"] >= base_x]
            if not words:
                continue
            lines.append({"text": " ".join(word["text"] for word in words), "line": line_number, "paragraphStart": words[0]["x"] >= base_x + 12})
        passages.append({"id": f"reading-{start}-{end}", "questions": [start, end], "sourcePage": page_number, "lines": lines})
    return passages


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="protefl-items-") as tmp:
        work = Path(tmp)
        listening = standard_questions(list(range(21, 26)) + [27, 29, 30, 31], range(1, 51), work)
        timing = json.loads((PACKAGE / "metadata/listening-question-map-v1.json").read_text())
        groups = {item["question"]: item["groupType"] for item in timing["questions"]}
        for item in listening:
            item["part"] = "A" if groups[item["number"]] == "question" else "B" if groups[item["number"]] == "conversation" else "C"
        structure_completion = standard_questions([34, 35], range(1, 16), work)
        reading = standard_questions([45, 46, 48, 49, 50, 53, 54, 57, 58, 61, 62], range(1, 51), work)
        payload = {
            "schemaVersion": "1.0.0",
            "source": "ETS TOEFL ITP Level 1 Practice Tests Volume 3, Practice Test A",
            "listening": listening,
            "structure": {"completion": structure_completion, "errorIdentification": structure_error_questions(work)},
            "reading": {"passages": reading_passages(work), "questions": reading},
        }
        OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        print(f"Wrote {OUT}: 50 Listening, 40 Structure, 5 passages, 50 Reading")


if __name__ == "__main__":
    main()
