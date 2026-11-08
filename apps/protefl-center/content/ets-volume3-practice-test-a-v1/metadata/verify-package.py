#!/usr/bin/env python3
"""Verify source package hashes and structural metadata without printing content."""
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
score = json.loads((root / "metadata/score-conversion-practice-test-a-v1.json").read_text())
assert len(score["ranges"]) == 15
# Check the source book's worked example: raw 28 / 30 / 39 -> 537-550.
def converted(section, raw):
    for row in score["ranges"]:
        if row["raw"][0] <= raw <= row["raw"][1]:
            return row[section]
    raise AssertionError("raw score not covered")
example = [converted("section1", 28), converted("section2", 30), converted("section3", 39)]
low = round(sum(pair[0] for pair in example) * 10 / 3)
high = round(sum(pair[1] for pair in example) * 10 / 3)
assert (low, high) == (537, 550), (low, high)
print("package source hashes, 140 answer keys, 50 10-13 second audio windows, 140 page references, 5 passages, 15 score ranges, and ETS worked score example verified")
