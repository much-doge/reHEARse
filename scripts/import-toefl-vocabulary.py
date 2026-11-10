#!/usr/bin/env python3
"""Build a compact, stable vocabulary package from the reviewed CSV."""

import csv
import hashlib
import json
import re
import sys
import unicodedata
from collections import OrderedDict

if len(sys.argv) != 3:
    raise SystemExit("usage: import-toefl-vocabulary.py INPUT.csv OUTPUT.json")

source_path, output_path = sys.argv[1:]
items = OrderedDict()

def clean(value):
    return " ".join((value or "").strip().split())

def number(row, key):
    value = clean(row.get(key))
    if not value:
        return None
    try:
        parsed = int(value.replace(",", ""))
        return parsed if parsed >= 0 else None
    except ValueError:
        return None

def add_unique(target, value):
    value = clean(value)
    if value and value not in target:
        target.append(value)

with open(source_path, newline="", encoding="utf-8-sig") as source:
    for row in csv.DictReader(source):
        headword = clean(row.get("word"))
        part = clean(row.get("type"))
        if not headword or part not in {"Noun", "Verb", "Adjective", "Adverb"}:
            continue
        key = unicodedata.normalize("NFKC", headword).casefold()
        entry = items.setdefault(key, {
            "headword": headword,
            "partsOfSpeech": [],
            "classifications": [],
            "teachingFocus": [],
            "priorities": [],
            "frequencyBands": [],
            "frequencyReferences": [],
            "wordForms": [],
            "bookOccurrences": [],
            "bookTestCoverage": [],
            "skillOccurrences": {"listening": [], "structure": [], "reading": []},
            "sourceRows": 0,
        })
        entry["sourceRows"] += 1
        add_unique(entry["partsOfSpeech"], part)
        for field, column in (("classifications", "classification"), ("teachingFocus", "teaching_focus"), ("priorities", "priority"), ("frequencyBands", "estimated_3000_8000_band"), ("frequencyReferences", "frequency_reference")):
            add_unique(entry[field], row.get(column))
        for part_form in re.split(r"\s*;\s*", clean(row.get("word_forms_in_books"))):
            match = re.match(r"(.+?)\s*\(\s*\d+\s*\)\s*$", part_form)
            add_unique(entry["wordForms"], match.group(1) if match else part_form)
        for field, column in (("bookOccurrences", "book_occurrences"), ("bookTestCoverage", "book_test_coverage")):
            value = number(row, column)
            if value is not None and value not in entry[field]:
                entry[field].append(value)
        for skill in ("listening", "structure", "reading"):
            value = number(row, f"occurrences_{skill}")
            if value is not None and value not in entry["skillOccurrences"][skill]:
                entry["skillOccurrences"][skill].append(value)

cards = []
for key, entry in items.items():
    card = {
        "id": "word-" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:16],
        "headword": entry["headword"],
        "partsOfSpeech": entry["partsOfSpeech"],
        "classification": entry["classifications"],
        "teachingFocus": entry["teachingFocus"],
        "priority": entry["priorities"],
        "frequencyBand": entry["frequencyBands"],
        "frequencyReference": entry["frequencyReferences"],
        "wordForms": entry["wordForms"],
        "bookOccurrences": max(entry["bookOccurrences"], default=None),
        "bookTestCoverage": max(entry["bookTestCoverage"], default=None),
        "skillOccurrences": {skill: max(values, default=0) for skill, values in entry["skillOccurrences"].items()},
        "sourceRows": entry["sourceRows"],
    }
    cards.append(card)

package = {
    "contractVersion": "toefl-vocabulary-package.v1",
    "version": 1,
    "id": "toefl-itp-full-frequency",
    "title": "TOEFL ITP Vocabulary · Frequency Review",
    "prompt": "Which part(s) of speech does this frequency list associate with this word form? Select every listed role.",
    "sourceNote": "Reviewed frequency list; classifications are machine-extracted and may need teacher review. The source does not include definitions or example sentences.",
    "cardCount": len(cards),
    "cards": cards,
}

with open(output_path, "w", encoding="utf-8", newline="\n") as target:
    json.dump(package, target, ensure_ascii=False, separators=(",", ":"))
    target.write("\n")
