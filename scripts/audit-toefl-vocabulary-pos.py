#!/usr/bin/env python3
"""Audit contextual POS cards without touching learner history.

This is intentionally a package audit, not a runtime classifier. It checks the
editable card contract for every card and reports the small, human-reviewed
correction set used to build the next package version.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PARTS = {"Noun", "Verb", "Adjective", "Adverb"}


def exact_highlight(sentence: str, headword: str, start: int, length: int) -> bool:
    highlighted = sentence.encode("utf-16-le")[start * 2 : (start + length) * 2].decode("utf-16-le")
    return highlighted.casefold() == headword.casefold()


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("content/vocabulary/toefl-itp-full-frequency.v5.json")
    package = json.loads(path.read_text(encoding="utf-8"))
    cards = package.get("cards", [])
    errors: list[str] = []
    identities: set[tuple[str, str]] = set()
    for index, card in enumerate(cards, start=1):
        target = card.get("targetPart")
        example = card.get("example") or {}
        if target not in PARTS or card.get("partsOfSpeech") != [target]:
            errors.append(f"card {index}: invalid single contextual role")
        identity = (str(card.get("headword", "")).casefold(), str(target))
        if identity in identities:
            errors.append(f"card {index}: duplicate identity {identity}")
        identities.add(identity)
        sentence = str(example.get("sentence", ""))
        if not re.search(r"[.!?]$", sentence.strip()):
            errors.append(f"card {index}: incomplete sentence")
        try:
            if not exact_highlight(sentence, str(card.get("headword", "")), int(example["highlightStart"]), int(example["highlightLength"])):
                errors.append(f"card {index}: highlight does not match headword")
        except (KeyError, TypeError, ValueError, UnicodeError):
            errors.append(f"card {index}: invalid UTF-16 highlight")

    if package.get("contextAudit", {}).get("reviewedCardCount") != len(cards):
        errors.append("context audit count does not cover the complete package")
    print(json.dumps({"package": package.get("contractVersion"), "cards": len(cards), "identities": len(identities), "errors": errors}, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
