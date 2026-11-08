#!/usr/bin/env python3
"""Verify the tracked ETS package hashes and source-derived structural metadata."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "package-manifest.json").read_text())
for record in manifest["sourceFiles"]:
    path = root / record["path"]
    data = path.read_bytes()
    assert len(data) == record["bytes"], f"size mismatch: {record['path']}"
    assert hashlib.sha256(data).hexdigest() == record["sha256"], f"hash mismatch: {record['path']}"

keys = json.loads((root / "metadata/answer-key-practice-test-a-v1.json").read_text())["sections"]
assert {key: len(value) for key, value in keys.items()} == {"listening": 50, "structure": 40, "reading": 50}

pauses = json.loads((root / "metadata/listening-pauses-v1.json").read_text())["pauses"]
assert len(pauses) == 50 and [row["question"] for row in pauses] == list(range(1, 51))
assert all(10_000 <= row["durationMs"] <= 13_000 for row in pauses)

page_index = json.loads((root / "metadata/page-index-v1.json").read_text())
assert {key: len(value) for key, value in page_index["questionPages"].items()} == {"listening": 50, "structure": 40, "reading": 50}
assert len(page_index["readingPassages"]) == 5

question_map = json.loads((root / "metadata/listening-question-map-v1.json").read_text())["questions"]
assert len(question_map) == 50
assert [item["question"] for item in question_map] == list(range(1, 51))
assert all(item["answerWindowStartMs"] == pauses[item["question"] - 1]["answerWindowStartMs"] for item in question_map)
assert [(start, end, group) for start, end, group in [(31, 34, "part-b-1"), (35, 37, "part-b-2"), (38, 41, "part-c-1"), (42, 46, "part-c-2"), (47, 50, "part-c-3")]] == [
    (next(item["question"] for item in question_map if item["groupId"] == group),
     max(item["question"] for item in question_map if item["groupId"] == group), group)
    for group in ["part-b-1", "part-b-2", "part-c-1", "part-c-2", "part-c-3"]
]

alignment = json.loads((root / "metadata/listening-alignment-audit-v1.json").read_text())
assert alignment["quietWindowCount"] == len(pauses) == 50
assert all(abs(row["mappedStartMs"] - question_map[row["question"] - 1]["questionAudioStartMs"]) <= 1 for row in alignment["transcriptAnchors"])
assert max(abs(row["differenceMs"]) for row in alignment["transcriptAnchors"]) <= 1_100
for row in alignment["groupTransitions"]:
    members = [item for item in question_map if item["groupId"] == row["groupId"]]
    assert [members[0]["question"], members[-1]["question"]] == row["questions"]
    assert all(item["contextStartMs"] == row["contextStartMs"] for item in members)

items = json.loads((root / "metadata/questions-practice-test-a-v1.json").read_text())
assert len(items["listening"]) == 50
assert len(items["structure"]["completion"]) == 15
assert len(items["structure"]["errorIdentification"]) == 25
assert len(items["reading"]["passages"]) == 5
assert len(items["reading"]["questions"]) == 50
for item in items["listening"] + items["structure"]["completion"] + items["structure"]["errorIdentification"] + items["reading"]["questions"]:
    assert list(item["options"]) == ["A", "B", "C", "D"], item["number"]
for item in items["structure"]["completion"]:
    assert item["prompt"].count("_____") == 1, item["number"]
for item in items["structure"]["errorIdentification"]:
    choices = [token["choice"] for token in item["tokens"] if "choice" in token]
    assert list(dict.fromkeys(choices)) == ["A", "B", "C", "D"], item["number"]
assert [passage["questions"] for passage in items["reading"]["passages"]] == [[1, 10], [11, 21], [22, 32], [33, 42], [43, 50]]
assert all(any(line["line"] == 5 for line in passage["lines"]) for passage in items["reading"]["passages"])

score = json.loads((root / "metadata/score-conversion-practice-test-a-v1.json").read_text())
assert len(score["ranges"]) == 15
# The guide's worked example: raw 28 / 30 / 39 -> 537-550.
def converted(section, raw):
    for row in score["ranges"]:
        if row["raw"][0] <= raw <= row["raw"][1]:
            return row[section]
    raise AssertionError("raw score not covered")
example = [converted("section1", 28), converted("section2", 30), converted("section3", 39)]
low = round(sum(pair[0] for pair in example) * 10 / 3)
high = round(sum(pair[1] for pair in example) * 10 / 3)
assert (low, high) == (537, 550), (low, high)
assert converted("section2", 39) is None and converted("section2", 40) is None

rendered = set(page_index["renderedPages"]["listening"] + page_index["renderedPages"]["structure"] + page_index["renderedPages"]["readingDirections"] + page_index["renderedPages"]["reading"])
assert rendered == {int(path.stem.removeprefix("page-")) for path in (root / "pages").glob("*.jpg")}

print("ETS package verified: hashes, 140 keys, 140 structured items, 5 line-marked passages, 50 quiet answer windows, transcript/group audio alignment, score example, and retained source-page allowlist")
