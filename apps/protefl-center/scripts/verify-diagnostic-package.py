#!/usr/bin/env python3
"""Verify a structured TOEFL-like package without assuming Practice Test A."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def load(root: Path, path: str):
    return json.loads((root / path).read_text())


def first_metadata(root: Path, prefix: str) -> Path:
    matches = sorted((root / "metadata").glob(f"{prefix}*.json"))
    if not matches:
        raise AssertionError(f"missing metadata/{prefix}*.json")
    return matches[0]


def question_count(value) -> int:
    if isinstance(value, list):
        return len(value)
    if isinstance(value, dict):
        if isinstance(value.get("questions"), list):
            return len(value["questions"])
        return sum(len(value.get(name, [])) for name in ("completion", "errorIdentification"))
    return 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path, help="package directory")
    args = parser.parse_args()
    root = args.package.resolve()
    manifest = json.loads((root / "package-manifest.json").read_text())

    for record in manifest["sourceFiles"]:
        path = root / record["path"]
        assert path.is_file(), f"missing source file: {record['path']}"
        data = path.read_bytes()
        assert len(data) == record["bytes"], f"size mismatch: {record['path']}"
        assert hashlib.sha256(data).hexdigest() == record["sha256"], f"hash mismatch: {record['path']}"

    keys_path = first_metadata(root, "answer-key-")
    keys = load(root, str(keys_path.relative_to(root)))["sections"]
    counts = {section: len(value) if isinstance(value, list) else 0 for section, value in keys.items()}

    questions_path = first_metadata(root, "questions-")
    questions = load(root, str(questions_path.relative_to(root)))
    for section, expected in counts.items():
        actual = question_count(questions.get(section, []))
        assert actual == expected, f"{section}: expected {expected} structured questions, got {actual}"

    for section, items in questions.items():
        if isinstance(items, dict):
            iterable = [item for name in ("completion", "errorIdentification", "questions") for item in items.get(name, [])]
        elif isinstance(items, list):
            iterable = items
        else:
            continue
        for item in iterable:
            assert list(item["options"]) == ["A", "B", "C", "D"], f"{section} Q{item['number']}: options"
        if section == "structure" and isinstance(items, dict):
            for item in items.get("completion", []):
                assert item["prompt"].count("_____") == 1, f"structure Q{item['number']}: blank"
            for item in items.get("errorIdentification", []):
                choices = [token["choice"] for token in item["tokens"] if "choice" in token]
                assert list(dict.fromkeys(choices)) == ["A", "B", "C", "D"], f"structure Q{item['number']}: underlines"

    if counts.get("listening", 0):
        pauses_path = first_metadata(root, "listening-pauses-")
        pauses = load(root, str(pauses_path.relative_to(root)))["pauses"]
        assert len(pauses) == counts["listening"]
        assert [row["question"] for row in pauses] == list(range(1, counts["listening"] + 1))
        assert all(row["durationMs"] > 0 for row in pauses)

        map_path = first_metadata(root, "listening-question-map-")
        question_map = load(root, str(map_path.relative_to(root)))["questions"]
        assert len(question_map) == counts["listening"]
        assert [item["question"] for item in question_map] == list(range(1, counts["listening"] + 1))
        assert all(item["answerWindowStartMs"] == pauses[item["question"] - 1]["answerWindowStartMs"] for item in question_map)

        alignment_files = sorted((root / "metadata").glob("listening-alignment-audit-*.json"))
        if alignment_files:
            alignment = json.loads(alignment_files[0].read_text())
            assert alignment["quietWindowCount"] == counts["listening"]
            anchors = alignment.get("transcriptAnchors", [])
            if anchors:
                assert max(abs(row["differenceMs"]) for row in anchors) <= 1_100

    print(f"Diagnostic package verified: {manifest['package']} ({manifest['version']}), counts={counts}")


if __name__ == "__main__":
    main()
