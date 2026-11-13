#!/usr/bin/env python3
"""Build the contextual vocabulary v5 package after a POS/context audit.

The v4 package remains immutable for existing assignments and attempts. This
builder starts from that package and applies only the reviewed contextual
corrections recorded below, so new invites can use v5 without rewriting
learner evidence pinned to v4.
"""
from __future__ import annotations

import hashlib
import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/vocabulary/toefl-itp-full-frequency.v4.json"
TARGET = ROOT / "content/vocabulary/toefl-itp-full-frequency.v5.json"

CORRECTIONS = [
    {
        "headword": "combat",
        "targetPart": "Noun",
        "correctedHeadword": "combat",
        "sentence": "The army prepared for combat near the border.",
        "reason": "The previous sentence used combat as a verb after to. This sentence presents combat as a noun after the preposition for.",
    },
    {
        "headword": "condense",
        "targetPart": "Noun",
        "correctedHeadword": "condensation",
        "sentence": "Condensation formed on the cold glass of the greenhouse.",
        "reason": "Condense is a verb, not a standard contemporary noun. The corrected noun condensation preserves the intended concept and aligns the highlighted word with the sentence.",
    },
]

PARTS = {"Noun", "Verb", "Adjective", "Adverb"}


def exact_span(sentence: str, headword: str) -> tuple[int, int]:
    match = re.search(r"(?<!\w)" + re.escape(headword) + r"(?!\w)", sentence, re.I)
    if not match:
        raise ValueError(f"missing exact headword {headword!r} in {sentence!r}")
    start = len(sentence[: match.start()].encode("utf-16-le")) // 2
    length = len(sentence[match.start() : match.end()].encode("utf-16-le")) // 2
    return start, length


def content_id(headword: str, part: str) -> str:
    key = " ".join(headword.casefold().split())
    digest = hashlib.sha256(f"{key}\0{part}".encode()).hexdigest()[:16]
    return f"v4-{digest}"


def main() -> None:
    package = json.loads(SOURCE.read_text(encoding="utf-8"))
    if package.get("contractVersion") != "toefl-vocabulary-package.v4" or package.get("version") != 4:
        raise ValueError("Expected the immutable v4 package as the source")
    cards = deepcopy(package["cards"])
    applied = []
    for correction in CORRECTIONS:
        matches = [
            card for card in cards
            if card["headword"].casefold() == correction["headword"].casefold()
            and card["targetPart"] == correction["targetPart"]
        ]
        if len(matches) != 1:
            raise ValueError(f"Expected one correction target, found {len(matches)}: {correction}")
        card = matches[0]
        card["headword"] = correction["correctedHeadword"]
        card["id"] = content_id(card["headword"], card["targetPart"])
        start, length = exact_span(correction["sentence"], card["headword"])
        card["example"] = {
            "sentence": correction["sentence"],
            "highlightStart": start,
            "highlightLength": length,
            "source": "rehearse-authored",
        }
        card["sourceProvenance"] = [
            *card.get("sourceProvenance", []),
            {
                "disposition": "context-corrected",
                "sourceHeadword": correction["headword"],
                "sourceTargetPart": correction["targetPart"],
                "correctedHeadword": correction["correctedHeadword"],
                "reviewReason": correction["reason"],
            },
        ]
        applied.append(correction)

    identities = set()
    for card in cards:
        if card["targetPart"] not in PARTS or card["partsOfSpeech"] != [card["targetPart"]]:
            raise ValueError(f"Invalid single-role card: {card['headword']}")
        start, length = exact_span(card["example"]["sentence"], card["headword"])
        if (start, length) != (card["example"]["highlightStart"], card["example"]["highlightLength"]):
            raise ValueError(f"UTF-16 highlight mismatch: {card['headword']}")
        identity = (card["headword"].casefold(), card["targetPart"])
        if identity in identities:
            raise ValueError(f"Duplicate contextual identity: {identity}")
        identities.add(identity)

    package.update({
        "contractVersion": "toefl-vocabulary-package.v5",
        "version": 5,
        "sourceNote": (
            "Version 5 preserves the v4 contextual deck and applies a reviewed POS/context audit. "
            "Existing v4 assignments and attempts remain pinned; the corrected examples are used for new invites."
        ),
        "cardCount": len(cards),
        "cards": cards,
        "contextAudit": {
            "reviewedCardCount": len(cards),
            "correctionCount": len(applied),
            "corrections": applied,
            "method": "Exact-highlight validation plus contextual review of parser disagreements and source-labelled examples.",
        },
    })
    TARGET.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built v5: {len(cards)} cards; applied {len(applied)} contextual corrections.")


if __name__ == "__main__":
    main()
