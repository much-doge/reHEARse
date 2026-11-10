#!/usr/bin/env python3
"""Add one boldable sentence example to every card in the reviewed package.

Requires NLTK plus its WordNet 3.0 corpus. WordNet examples are used only when
they contain the exact card headword and the matching part-of-speech synset.
Otherwise the script writes an original sentence that states the reviewed
list's word-class label, avoiding fabricated usage for unusual or ambiguous
forms.
"""

import json
import re
import sys
from pathlib import Path

try:
    from nltk.corpus import wordnet as wn
except ImportError as error:
    raise SystemExit("Install NLTK and download the WordNet 3.0 corpus first.") from error

POS = {"Noun": "n", "Verb": "v", "Adjective": "a", "Adverb": "r"}
SENSITIVE = re.compile(r"\b(jew|jews|negro|colored|narcotic|cocaine|heroin|porn|sexual|fuck|shit|damn)\b", re.I)


def normalized_sentence(sentence):
    sentence = " ".join(sentence.strip().strip('"').split())
    if sentence and sentence[-1] not in ".!?":
        sentence += "."
    if sentence:
        sentence = sentence[0].upper() + sentence[1:]
    return sentence


def example_match(sentence, word):
    return re.search(r"(?<!\w)" + re.escape(word) + r"(?!\w)", sentence, re.I)


def wordnet_example(word, part):
    candidates = []
    for synset in wn.synsets(word.replace(" ", "_"), pos=POS[part]):
        for sentence in synset.examples():
            sentence = normalized_sentence(sentence)
            match = example_match(sentence, word)
            if not match or SENSITIVE.search(sentence):
                continue
            count = len(sentence.split())
            if count < 5 or count > 26:
                continue
            # Prefer concise examples, with the first WordNet sense breaking ties.
            candidates.append((abs(count - 13), sentence.casefold(), sentence, match.start(), match.end() - match.start()))
    if not candidates:
        return None
    _, _, sentence, char_start, char_length = min(candidates)
    start = len(sentence[:char_start].encode("utf-16-le")) // 2
    end = len(sentence[:char_start + char_length].encode("utf-16-le")) // 2
    return sentence, start, end - start, "wordnet-3.0"


def authored_example(word, part):
    role = part.lower()
    article = "an" if role == "adverb" else "a"
    sentence = f'In the reviewed list, “{word}” is labeled as {article} {role}.'
    match = example_match(sentence, word)
    if not match:
        raise ValueError(f"Generated example did not preserve the headword: {word!r}")
    start = len(sentence[:match.start()].encode("utf-16-le")) // 2
    end = len(sentence[:match.end()].encode("utf-16-le")) // 2
    return sentence, start, end - start, "rehearse-original"


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: enrich-toefl-vocabulary-examples.py PACKAGE.json")
    path = Path(sys.argv[1])
    package = json.loads(path.read_text(encoding="utf-8"))
    generated = 0
    sourced = 0
    for card in package["cards"]:
        part = card["partsOfSpeech"][0]
        example = wordnet_example(card["headword"], part)
        if example:
            sourced += 1
        else:
            example = authored_example(card["headword"], part)
            generated += 1
        sentence, start, length, source = example
        card.pop("examples", None)
        card["example"] = {"sentence": sentence, "highlightStart": start, "highlightLength": length, "source": source}
    package["contractVersion"] = "toefl-vocabulary-package.v2"
    package["version"] = 2
    package["sourceNote"] = "Reviewed frequency list; POS labels are machine-extracted and may need teacher review. One sentence example appears after the learner checks a card. Matching WordNet 3.0 examples are attributed; where none is available, an original sentence states the reviewed list's part-of-speech label. Examples do not define every sense or establish that every machine-extracted label is correct."
    path.write_text(json.dumps(package, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Added {sourced} WordNet 3.0 and {generated} original examples across {sourced + generated} cards.")


if __name__ == "__main__":
    main()
