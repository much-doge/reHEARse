#!/usr/bin/env python3
"""Build the immutable, single-role contextual TOEFL vocabulary v4 package."""
from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/vocabulary/toefl-itp-full-frequency.v3.json"
AUTHORING = ROOT / "content/vocabulary/authoring"
ADJUDICATION = AUTHORING / "v4-source-adjudications.json"
TARGET = ROOT / "content/vocabulary/toefl-itp-full-frequency.v4.json"
PARTS = {"Noun", "Verb", "Adjective", "Adverb"}
LEGACY_METADATA_FRAMES = (
    "appeared in the report", "remained important during the discussion",
    "helped the team understand the situation", "became part of the final presentation",
    "students found", "the teacher wrote", "the instructor used the word",
    "in an original example", "in class, the teacher", "the class practiced using",
)
SEGMENTS = (("A", 0, 948), ("B", 948, 1896), ("C", 1896, 2844))


def normalized(headword: str, part: str) -> tuple[str, str]:
    return (" ".join(headword.casefold().split()), part)


def exact_span(sentence: str, headword: str) -> tuple[int, int]:
    match = re.search(r"(?<!\w)" + re.escape(headword) + r"(?!\w)", sentence, re.I)
    if not match:
        raise ValueError(f"missing exact headword {headword!r} in {sentence!r}")
    start = len(sentence[: match.start()].encode("utf-16-le")) // 2
    length = len(sentence[match.start() : match.end()].encode("utf-16-le")) // 2
    return start, length


def validate_context(sentence: str, headword: str) -> None:
    if not isinstance(sentence, str) or not 4 <= len(sentence.split()) <= 30:
        raise ValueError(f"Context sentence must contain 4-30 words: {headword!r} {sentence!r}")
    if sentence[-1:] not in ".!?":
        raise ValueError(f"Context sentence is incomplete: {headword!r} {sentence!r}")
    if any(phrase in sentence.casefold() for phrase in LEGACY_METADATA_FRAMES):
        raise ValueError(f"Generic metadata example is prohibited: {headword!r} {sentence!r}")
    exact_span(sentence, headword)


def content_id(headword: str, part: str) -> str:
    digest = hashlib.sha256(f"{normalized(headword, part)[0]}\0{part}".encode()).hexdigest()[:16]
    return f"v4-{digest}"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    source = load_json(SOURCE)
    source_cards = source["cards"]
    if len(source_cards) != 2844:
        raise ValueError(f"Expected v3 to contain 2,844 cards; found {len(source_cards)}")

    source_rows = {}
    authored_rows = {}
    for segment, start, end in SEGMENTS:
        rows = load_json(AUTHORING / f"v4-segment-{segment.lower()}.json")
        expected = {}
        for card in source_cards[start:end]:
            for part in card["partsOfSpeech"]:
                expected[(card["id"], card["headword"], part)] = card
        actual = {}
        for row in rows:
            key = (row.get("cardId"), row.get("headword"), row.get("targetPart"))
            if key in actual:
                raise ValueError(f"Duplicate {segment} authoring row: {key}")
            actual[key] = row
        if set(actual) != set(expected):
            missing = sorted(set(expected) - set(actual))[:5]
            extra = sorted(set(actual) - set(expected))[:5]
            raise ValueError(f"Segment {segment} coverage mismatch; missing={missing}, extra={extra}")
        for key, row in actual.items():
            card = expected[key]
            source_rows[(segment, *key)] = card
            authored_rows[(segment, *key)] = row

    decisions = load_json(ADJUDICATION)
    if decisions.get("contractVersion") != "toefl-vocabulary-source-adjudications.v1":
        raise ValueError("Unexpected source-adjudication contract")
    adjudications = {}
    for item in decisions.get("items", []):
        key = (item.get("segment"), item.get("cardId"), item.get("headword"), item.get("targetPart"))
        if key in adjudications:
            raise ValueError(f"Duplicate source adjudication: {key}")
        if key not in authored_rows:
            raise ValueError(f"Adjudication does not refer to a source row: {key}")
        if authored_rows[key]["status"] != "invalid":
            raise ValueError(f"Adjudication is for a non-invalid row: {key}")
        if not item.get("sourceReason") or not item.get("reason"):
            raise ValueError(f"Adjudication lacks source or review rationale: {key}")
        if item.get("disposition") not in {"corrected", "excluded"}:
            raise ValueError(f"Unresolved source label: {key}")
        adjudications[key] = item

    invalid_keys = {key for key, row in authored_rows.items() if row["status"] == "invalid"}
    if invalid_keys != set(adjudications):
        raise ValueError(
            f"Invalid-label adjudication mismatch: unresolved={len(invalid_keys - set(adjudications))}, "
            f"stale={len(set(adjudications) - invalid_keys)}"
        )
    if len(adjudications) != 69:
        raise ValueError(f"Expected 69 reviewed invalid labels; found {len(adjudications)}")

    by_pair = {}

    def add(headword: str, part: str, sentence: str, example_source: str, original_card: dict,
            provenance: dict) -> None:
        if part not in PARTS:
            raise ValueError(f"Unsupported target role {part!r}")
        start, length = exact_span(sentence, headword)
        validate_context(sentence, headword)
        key = normalized(headword, part)
        item = by_pair.get(key)
        if item is None:
            item = {
                "id": content_id(headword, part),
                "headword": headword,
                "targetPart": part,
                "partsOfSpeech": [part],
                "classification": original_card["classification"],
                "teachingFocus": original_card["teachingFocus"],
                "priority": original_card["priority"],
                "frequencyBand": original_card["frequencyBand"],
                "frequencyReference": original_card["frequencyReference"],
                "wordForms": original_card["wordForms"],
                "bookOccurrences": original_card["bookOccurrences"],
                "bookTestCoverage": original_card["bookTestCoverage"],
                "skillOccurrences": original_card["skillOccurrences"],
                "sourceRows": original_card["sourceRows"],
                "example": {"sentence": sentence, "highlightStart": start, "highlightLength": length, "source": example_source},
                "sourceProvenance": [],
            }
            by_pair[key] = item
        elif not re.search(r"(?<!\w)" + re.escape(item["headword"]) + r"(?!\w)", item["example"]["sentence"], re.I):
            raise ValueError(f"Existing deduplicated item lost exact headword: {key}")
        if provenance not in item["sourceProvenance"]:
            item["sourceProvenance"].append(provenance)

    for key, row in authored_rows.items():
        if row["status"] != "authored":
            continue
        segment, card_id, source_headword, source_part = key
        card = source_rows[key]
        provenance = {
            "segment": segment,
            "cardId": card_id,
            "sourceHeadword": source_headword,
            "sourceTargetPart": source_part,
            "disposition": "accepted",
        }
        sentence = row.get("sentence", "")
        if row.get("source") not in {"wordnet-3.0", "rehearse-authored", "rehearse-original"}:
            raise ValueError(f"Unknown sentence provenance at {key}")
        add(source_headword, source_part, sentence, row["source"], card, provenance)

    for key, row in authored_rows.items():
        if row["status"] != "invalid":
            continue
        segment, card_id, source_headword, source_part = key
        card = source_rows[key]
        decision = adjudications[key]
        provenance = {
            "segment": segment,
            "cardId": card_id,
            "sourceHeadword": source_headword,
            "sourceTargetPart": source_part,
            "sourceReason": decision["sourceReason"],
            "disposition": decision["disposition"],
            "reviewReason": decision["reason"],
            "correctedHeadword": decision.get("correctedHeadword"),
            "correctedTargetPart": decision.get("correctedTargetPart"),
        }
        if decision["disposition"] == "excluded":
            continue
        corrected_headword = decision.get("correctedHeadword")
        corrected_part = decision.get("correctedTargetPart")
        sentence = decision.get("sentence")
        if not corrected_headword or corrected_part not in PARTS or not sentence:
            raise ValueError(f"Incomplete source correction at {key}")
        # Keep the best existing reviewed sentence when a correction resolves
        # to an already represented headword-role pair; provenance is merged.
        add(corrected_headword, corrected_part, sentence, "rehearse-authored", card, provenance)

    cards = sorted(by_pair.values(), key=lambda item: (item["headword"].casefold(), item["targetPart"]))
    seen_ids = set()
    for card in cards:
        if card["id"] in seen_ids:
            raise ValueError(f"Deterministic v4 content ID collision: {card['id']}")
        seen_ids.add(card["id"])
        start, length = exact_span(card["example"]["sentence"], card["headword"])
        if (start, length) != (card["example"]["highlightStart"], card["example"]["highlightLength"]):
            raise ValueError(f"UTF-16 highlight mismatch for {card['headword']} / {card['targetPart']}")
        if card["example"]["source"] == "wordnet-3.0":
            from nltk.corpus import wordnet as wn
            pos = {"Noun": "n", "Verb": "v", "Adjective": "a", "Adverb": "r"}[card["targetPart"]]
            target = " ".join(card["example"]["sentence"].casefold().split())
            corpus_examples = {
                re.sub(r"[.!?]+$", "", " ".join(" ".join(raw.strip().strip('"').split()).casefold().split()))
                for synset in wn.synsets(card["headword"].replace(" ", "_"), pos=pos)
                for raw in synset.examples()
            }
            if re.sub(r"[.!?]+$", "", target) not in corpus_examples:
                raise ValueError(f"WordNet example is not exact corpus evidence: {card['headword']} / {card['targetPart']}")

    package = {
        "contractVersion": "toefl-vocabulary-package.v4",
        "version": 4,
        "id": source["id"],
        "title": source["title"],
        "prompt": "Choose the part of speech used by the highlighted word in this sentence.",
        "sourceNote": "Version 4 has one contextual exposure per reviewed headword-role. Source corrections and exclusions retain their review provenance.",
        "cardCount": len(cards),
        "cards": cards,
    }
    TARGET.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    dispositions = Counter(item["disposition"] for item in adjudications.values())
    merged = sum(len(card["sourceProvenance"]) > 1 for card in cards)
    counts = Counter(card["targetPart"] for card in cards)
    unique_headwords = len({card["headword"].casefold() for card in cards})
    print(
        f"Built v4: {len(cards)} unique headword-role exposures across {unique_headwords} headwords; "
        f"roles={dict(counts)}; adjudications={dict(dispositions)}; merged provenance={merged}."
    )


if __name__ == "__main__":
    main()
