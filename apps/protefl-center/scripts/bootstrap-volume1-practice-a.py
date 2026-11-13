#!/usr/bin/env python3
"""Build the structured ETS Volume 1 Practice Test A package.

This importer is intentionally source-driven: it reads the owner-supplied PDF,
keeps the source pages private, and emits editable Test Center JSON rather than
serving page images or a PDF to candidates.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PDF = Path("/home/miko/Downloads/toefl-itp-practice-tests-level-1-volume-1.pdf")
AUDIO = Path("/media/miko/nextcloud-transit/TEMP/data g/PPB UNY/2013/AUDIO/2016 - 1062.mp3")
OUT = ROOT / "apps/protefl-center/content/ets-volume1-practice-test-a-v1"


def text_page(page: int) -> str:
    return subprocess.check_output(["pdftotext", "-layout", "-f", str(page), "-l", str(page), str(PDF), "-"], text=True)


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", value).replace("\u00ad", "").strip()


def parse_column(lines: list[str], source_page: int) -> list[dict]:
    items: list[dict] = []
    current: dict | None = None
    target = "prompt"
    for raw in lines:
        line = norm(raw)
        if not line or line.isdigit():
            continue
        match = re.match(r"^(\d+)\.\s+(.*)$", line)
        if match:
            rest = match.group(2)
            inline = re.match(r"^\(([A-D])\)\s*(.*)$", rest)
            current = {"number": int(match.group(1)), "prompt": "" if inline else rest, "options": {}, "sourcePage": source_page}
            items.append(current)
            if inline:
                target = inline.group(1)
                current["options"][target] = inline.group(2)
            else:
                target = "prompt"
            continue
        option = re.match(r"^\(([A-D])\)\s*(.*)$", line)
        if option and current:
            target = option.group(1)
            current["options"][target] = option.group(2)
            continue
        if current:
            if target == "prompt":
                current["prompt"] = norm(current["prompt"] + " " + line)
            else:
                current["options"][target] = norm(current["options"].get(target, "") + " " + line)
    return items


def parse_two_columns(page: int, split: int = 42) -> list[dict]:
    value = text_page(page)
    left = [line[:split] for line in value.splitlines()]
    right = [line[split:] for line in value.splitlines()]
    return parse_column(left, page) + parse_column(right, page)


def parse_standard_questions(pages: list[int], low: int, high: int, split: int = 42) -> list[dict]:
    values: list[dict] = []
    for page in pages:
        values.extend(parse_two_columns(page, split))
    values = [item for item in values if low <= item["number"] <= high]
    values.sort(key=lambda item: item["number"])
    expected = list(range(low, high + 1))
    if [item["number"] for item in values] != expected:
        raise ValueError(f"Question numbering mismatch {low}-{high}: {[item['number'] for item in values]}")
    for item in values:
        item["options"] = {choice: norm(item["options"].get(choice, "")) for choice in "ABCD"}
        if any(not item["options"][choice] for choice in "ABCD"):
            raise ValueError(f"Missing option in Q{item['number']}: {item}")
    return values


LISTENING_PROMPTS = [
    "What does the woman mean?", "What does the woman imply about the apples?", "What does the man imply?",
    "What does the woman mean?", "What will the woman probably be doing at 6:45?", "What does the woman suggest the man do?",
    "What does the man imply?", "What will the speakers probably do?", "What does the man imply?", "What does the woman mean?",
    "What does the man mean?", "What is the woman doing?", "What does the woman mean?", "What does the man imply about Professor Thomson?",
    "What does the woman mean?", "What does the man mean?", "What does the woman mean?", "What can be inferred from the conversation?",
    "What does the woman mean?", "What does the man mean?", "What does the man mean?", "What does the man mean?",
    "What does the woman imply?", "What can be inferred from the conversation?", "What does the woman mean?", "What does the woman imply?",
    "What will the man do?", "What does the man imply?", "What does the man imply?", "What does the woman suggest the man do?",
    "Why does Steve visit the counselor?", "What is the one possible problem the counselor points out to Steve?",
    "What is Steve’s main problem in adjusting to his college?", "Where will Steve probably go to get his problem solved?",
    "Why does the man congratulate the woman?", "Who is the main character in Tales of Deception?",
    "Why does the man ask the woman about her work habits?", "Why does the woman carry a notebook?",
    "What is the talk mainly about?", "What organization provided the information for the announcement?",
    "What should people do before hurricane season begins?", "According to the announcement, why should people fill their cars with fuel before a hurricane?",
    "What does the speaker mainly discuss?", "What is true of mail delivery in the early nineteenth century?",
    "According to the speaker, what problem did farmers face with early mail service?", "How did many city residents react when farmers first requested mail delivery?",
    "What is the lecture mainly about?", "What aspect of a mineral is the Mohs’ scale used to identify?",
    "What does the teacher ask the class to do?", "According to the teacher, when might the hardness of the same mineral seem to vary?",
]


def listening_questions() -> list[dict]:
    values = parse_standard_questions([20, 21, 22, 23, 25, 27, 28], 1, 50)
    for item in values:
        item["prompt"] = LISTENING_PROMPTS[item["number"] - 1]
        item["part"] = "A" if item["number"] <= 30 else ("B" if item["number"] <= 38 else "C")
    return values


def parse_passage(page: int, first: int, last: int) -> dict:
    rows = []
    paragraph_start = True
    for raw in text_page(page).splitlines():
        raw_indent = len(raw) - len(raw.lstrip())
        if not raw.strip() or raw.strip().startswith("Questions") or raw.strip().isdigit():
            if rows and not raw.strip():
                paragraph_start = True
            continue
        if raw.strip() in {"Line", "Section 3 continues. Turn the page and read the next passage."}:
            continue
        if raw.lstrip().startswith("Line"):
            raw = raw[4:]
        line_number = None
        match = re.match(r"^\s*(5|10|15|20|25)\s+(.*)$", raw)
        if match:
            line_number = int(match.group(1))
            body = match.group(2)
        else:
            body = raw.strip()
        if not body:
            continue
        if body.startswith("This is the end"):
            break
        rows.append({"text": norm(body), "line": line_number, "paragraphStart": paragraph_start or raw_indent >= 16})
        paragraph_start = False
    return {"id": f"reading-{first}-{last}", "questions": [first, last], "sourcePage": page, "lines": rows}


def mark_tokens(sentence: str, spans: list[str]) -> list[dict]:
    tokens = re.findall(r"[A-Za-z0-9’'-]+|[^A-Za-z0-9\s]", sentence)
    normalized = [token.lower() for token in tokens]
    used: set[int] = set()
    result = [{"text": token} for token in tokens]
    for choice, span in zip("ABCD", spans):
        phrase = re.findall(r"[A-Za-z0-9’'-]+", span.lower())
        if not phrase:
            continue
        for start in range(len(tokens) - len(phrase) + 1):
            if start in used:
                continue
            if normalized[start:start + len(phrase)] == phrase:
                result[start]["choice"] = choice
                for index in range(start + 1, start + len(phrase)):
                    result[index]["choice"] = choice
                used.add(start)
                break
    for choice in "ABCD":
        if not any(token.get("choice") == choice for token in result):
            raise ValueError(f"Unable to mark {choice} in {sentence!r} using {spans!r}")
    return result


ERROR_SENTENCES = [
    (16, "While attempting to fly hers plane around the world in 1937, Amelia Earhart mysteriously disappeared.", ["hers", "around", "1937", "mysteriously"]),
    (17, "Richard Wright’s Uncle Tom’s Children, a collection of short stories, were a critical success when it appeared in 1938.", ["short stories", "were", "critical success", "appeared"]),
    (18, "The principle on which the boat called a hydrofoil is designed is identically to that demonstrated by an airplane wing moving through air.", ["identically", "that demonstrated", "airplane wing", "air"]),
    (19, "Migrating butterflies can travel long distant over water.", ["butterflies", "travel", "distant", "over"]),
    (20, "During a early period in the settlement of the western United States, pioneers claimed parts of the wilderness by marking trees to establish a boundary.", ["a early", "parts", "marking", "establish"]),
    (21, "All digital computers use binary, or two-valued, digits instead than decimal, or ten-valued, digits to represent and store data.", ["All", "use", "instead", "to represent"]),
    (22, "An ambassador serves as a nation’s highest-ranking diplomacy in another country.", ["An ambassador", "serves", "diplomacy", "country"]),
    (23, "Early adolescence is a developmental phase consisting of rapid changes in behavior, psychological, and hormones.", ["Early", "developmental", "rapid", "psychological"]),
    (24, "Knowledge from the frontiers of research genetic will increasingly pose difficult problems for policy makers and for society in general.", ["Knowledge", "research genetic", "difficult", "in general"]),
    (25, "Pictures called glass mosaics are made by setting small pieces of colors glass into fresh plaster.", ["called glass mosaics", "setting", "colors", "into"]),
    (26, "Approximately every nineteen month Venus and the Sun reach their greatest angular separation in the solar system.", ["every nineteen month", "their", "separation", "in"]),
    (27, "Anthropologists recently have found evidence that, centuries ago, Inuits used to entering their subterranean homes through tunnels, which helped keep the cold out and the heat in.", ["found evidence", "used to entering", "helped keep", "the heat"]),
    (28, "The tree porcupine is found in wooded areas throughout most from North America.", ["The", "found", "areas", "from"]),
    (29, "To date, only a small percentage of all glass manufactured in the United States is recycled, but markets for recycled glass that are growing steadily.", ["manufactured", "is recycled", "that are", "growing steadily"]),
    (30, "The oceans are the major source of the atmospheric moisture that is obtained through evaporator.", ["oceans", "major source", "atmospheric", "evaporator"]),
    (31, "Only those insects with high developed, multilensed eyes have good color vision.", ["Only", "high developed", "have", "color"]),
    (32, "The Earth’s atmosphere functions much like a giant greenhouse, admitting sunlight between outer space but preventing heat from escaping.", ["functions", "between", "but", "escaping"]),
    (33, "The almond tree which produces the oldest species of nut and is the most widely grown of all nut trees.", ["which produces", "oldest", "widely grown", "nut trees"]),
    (34, "Fran Tannenbaum, a paleontology student doing summer fieldwork, found a completely seventy-five-million-year-old fossil egg near Chateau, Montana.", ["doing", "found", "completely", "fossil egg"]),
    (35, "Fencing, originally developed as a sport in fourteenth century, was included in the first modern Olympic Games of 1896.", ["in fourteenth century", "included in", "first modern", "of 1896"]),
    (36, "Depth within ancient tombs, 3,000-year-old peanuts have been found alongside mummies.", ["Depth", "ancient", "have been found", "alongside"]),
    (37, "Art Nouveau developed in the 1890’s when artists did a conscious effort to break with what they regarded as worn-out formulas of the past.", ["in", "did a", "conscious", "the past"]),
    (38, "The most widely cultivated all of fruit trees, the apple is second only to the grape in its importance as a temperate-zone fruit.", ["all of", "only", "importance", "as"]),
    (39, "Pawnbroking, or making loans to customers who pledge personal or household goods as security, is one of the oldest trade known.", ["making loans", "pledge", "personal or", "oldest trade"]),
    (40, "Of 1901 to 1914, acclaimed actor Douglas Fairbanks appeared on stage in a series of light comedies.", ["Of", "stage", "a series", "light comedies"]),
]


def audio_windows() -> tuple[list[dict], float]:
    result = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(AUDIO), "-af", "silencedetect=noise=-42dB:d=4", "-f", "null", "-"], capture_output=True, text=True)
    starts = [float(value) for value in re.findall(r"silence_start: ([0-9.]+)", result.stderr)]
    ends = [float(value) for value in re.findall(r"silence_end: ([0-9.]+)", result.stderr)]
    if len(starts) < 50 or len(ends) < 50:
        raise ValueError(f"Expected 50 response windows, got {len(starts)} starts/{len(ends)} ends")
    starts, ends = starts[:50], ends[:50]
    duration = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(AUDIO)], text=True).strip())
    ms = lambda value: round(value * 1000)
    pauses = [{"question": index + 1, "answerWindowStartMs": ms(start), "answerWindowEndMs": ms(end), "durationMs": ms(end - start)} for index, (start, end) in enumerate(zip(starts, ends))]
    return pauses, duration


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "metadata").mkdir(exist_ok=True)
    (OUT / "source").mkdir(exist_ok=True)
    shutil.copy2(PDF, OUT / "source/ets-toefl-itp-level1-volume1.pdf")
    shutil.copy2(AUDIO, OUT / "source/practice-test-a-listening.mp3")
    (OUT / "source/ets-toefl-itp-level1-volume1-layout.txt").write_text(subprocess.check_output(["pdftotext", "-layout", str(PDF), "-"], text=True))

    listening = listening_questions()
    completion = parse_standard_questions([31, 32], 1, 15, split=38)
    completion_prompts = [
        "Since the early 1950’s, _____ throughout the world has more than doubled.",
        "Even though he did not attend school until he was twelve, Dr. Samuel C.C. Ting was _____ the Nobel Prize in Physics in 1976.",
        "Gas particles move _____ when the gas is hot than when it is cold.",
        "The different colors of _____ the different temperatures of the stars’ surfaces.",
        "As a country develops from an agricultural to an industrial economy, the attitudes, values, structures, and functions of the family _____.",
        "Only a few sounds produced by insects are heard by humans _____ most of the sounds are pitched either too low or too high.",
        "The ordinary chair _____ in countless shapes, sizes, styles, and materials.",
        "For 125 years after _____ initial use at Harvard in 1642, the Bachelor of Arts degree was the only degree awarded by colleges in the United States.",
        "Since the Sun illuminates half the surface of the Moon, only half the surface _____ can be seen from the Earth.",
        "The novels of Constance Fenimore Woolson, _____, have special interest for their regional settings.",
        "_____ Oklahoma is important as a farming state, it is even more important for its rich oil deposits.",
        "No animal seems _____ on a diet of peat moss.",
        "The upper part in a harmonic arrangement _____ by mixed voices is usually written for a soprano voice.",
        "The first school _____ the state of Washington was opened at old Fort Vancouver in 1832.",
        "Radio, _____, developed from the theories and experiments of many people.",
    ]
    for item, prompt in zip(completion, completion_prompts):
        item["prompt"] = prompt
    errors = []
    for number, sentence, spans in ERROR_SENTENCES:
        tokens = mark_tokens(sentence, spans)
        options = {choice: norm(" ".join(token["text"] for token in tokens if token.get("choice") == choice)) for choice in "ABCD"}
        errors.append({"number": number, "tokens": tokens, "options": options, "sourcePage": 34 if number <= 24 else (35 if number <= 33 else 36)})
    reading_questions = parse_standard_questions([41, 42, 45, 46, 49, 50, 53, 54, 57, 58], 1, 50, split=38)
    passages = [parse_passage(40, 1, 10), parse_passage(44, 11, 20), parse_passage(48, 21, 30), parse_passage(52, 31, 39), parse_passage(56, 40, 50)]

    listening_key = list("DCDD DABAA DADAC CB CDAA CCBB BDBBB CDDCB CDBCB DBCBA DC BDBAC".replace(" ", ""))
    # The source key is kept in the same section order as the book's Practice Test A table.
    listening_key = list("DCDD DABAA DADAC C B?".replace(" ", "")) if False else ["D","C","D","D","D","A","B","A","A","D","A","D","A","C","C","B","C","D","A","A","C","C","B","B","B","D","D","B","B","C","C","D","D","C","B","D","B","C","B","A","D","C","B","D","B","C","A","C","D","B"]
    structure_key = ["A","C","B","A","C","B","A","A","D","B","B","D","A","D","B","B","B","A","C","A","C","C","D","B","C","A","B","D","C","D","B","B","A","D","A","A","B","A","D","A"]
    reading_key = ["D","C","C","A","A","B","D","C","B","A","C","C","B","D","D","B","C","D","B","A","D","C","A","D","C","D","C","C","C","B","B","B","D","A","A","C","C","A","D","A","D","C","A","D","D","C","B","D","A","A"]

    pauses, duration = audio_windows()
    groups = [(31, 34, "part-b-1", "conversation"), (35, 38, "part-b-2", "conversation"), (39, 42, "part-c-1", "talk"), (43, 46, "part-c-2", "talk"), (47, 50, "part-c-3", "talk")]
    first_cue_ms = 142_000
    mapping = []
    for index, pause in enumerate(pauses):
        number = index + 1
        group = next((row for row in groups if row[0] <= number <= row[1]), None)
        context_start = first_cue_ms if not group or group[0] == 1 else pauses[group[0] - 2]["answerWindowEndMs"]
        mapping.append({"question": number, "groupId": group[2] if group else "part-a", "groupType": group[3] if group else "question", "questionAudioStartMs": first_cue_ms if number == 1 else pauses[index - 1]["answerWindowEndMs"], "questionAudioEndMs": pause["answerWindowStartMs"], "contextStartMs": context_start, "answerWindowStartMs": pause["answerWindowStartMs"], "answerWindowEndMs": pause["answerWindowEndMs"]})

    questions = {"listening": listening, "structure": {"completion": completion, "errorIdentification": errors}, "reading": {"passages": passages, "questions": reading_questions}}
    instructions = {
        "schemaVersion": "1.0.0", "source": "ETS TOEFL ITP Level 1 Practice Tests Volume 1, Practice Test A",
        "listening": {"overview": "This section measures your ability to understand spoken English. The audio is played in sequence and the conversations and talks are not repeated.", "partA": "You will hear short conversations. After each conversation, you will hear a question. Read the four answers and choose the best answer.", "partB": "You will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated.", "partC": "You will hear several short talks. After each talk, you will hear some questions. The talks and questions will not be repeated."},
        "structure": {"overview": "This section is designed to measure your ability to recognize language that is appropriate for standard written English. There are two types of questions in this section, with special directions for each type.", "time": "25 minutes, including the reading of directions.", "partA": "Questions 1–15 are incomplete sentences. Beneath each sentence you will see four words or phrases, marked (A), (B), (C) and (D). Choose the word or phrase that best completes the sentence.", "partB": "In questions 16–40, each sentence has four underlined words or phrases. The underlined parts of the sentence are marked (A), (B), (C) and (D). Identify the underlined word or phrase that must be changed in order for the sentence to be correct."},
        "reading": {"overview": "In this section you will read several passages. Each passage is followed by several questions about it. For questions 1–50, choose the best answer, (A), (B), (C) or (D), to each question.", "time": "55 minutes, including the reading of the directions.", "basis": "Answer all questions following a passage on the basis of what is stated or implied in that passage."}
    }
    score = {"schemaVersion": "1.0.0", "source": "ETS Volume 1 Practice Test A converted score chart, printed page 124", "sections": {"listening": {"48-50": "64-68", "45-47": "59-62", "42-44": "56-58", "39-41": "54-56", "36-38": "52-54", "33-35": "51-52", "30-32": "49-50", "27-29": "48-49", "24-26": "46-47", "21-23": "45-46", "18-20": "43-44", "15-17": "40-42", "12-14": "36-39", "9-11": "32-33", "6-8": "29-31", "3-5": "27-28", "0-2": "24-26"}, "structure": {"36-40": "63-68", "33-35": "59-61", "30-32": "56-58", "27-29": "53-55", "24-26": "50-52", "21-23": "48-49", "18-20": "45-47", "15-17": "42-44", "12-14": "38-40", "9-11": "32-36", "6-8": "26-29", "3-5": "23-25", "0-2": "20-22"}, "reading": {"48-50": "65-67", "45-47": "62-64", "42-44": "59-61", "39-41": "57-58", "36-38": "55-56", "33-35": "53-54", "30-32": "51-52", "27-29": "49-50", "24-26": "47-48", "21-23": "44-46", "18-20": "41-43", "15-17": "37-40", "12-14": "31-35", "9-11": "28-29", "6-8": "25-27", "3-5": "23-24", "0-2": "20-22"}}, "totalFormula": "Multiply the lower and upper ends of the sum of the three converted score ranges by 10/3 and round to the nearest whole number as described in the source."}
    pauses_doc = {"schemaVersion": "1.0.0", "source": "Owner-supplied Volume 1 Practice Test A audio", "detection": "ffmpeg silencedetect noise=-42dB duration=4s", "audioDurationMs": round(duration * 1000), "nativeAnswerWindowsPreserved": True, "pauses": pauses}
    map_doc = {"schemaVersion": "1.0.0", "source": "Volume 1 Practice Test A listening recording", "notes": ["The 50 native answer windows are preserved from the supplied recording.", "The first question cue is anchored at 142000ms pending classroom playback confirmation.", "Part B groups are 31–34 and 35–38; Part C talks are 39–42, 43–46, and 47–50."], "questions": mapping}
    audit = {"version": 1, "method": "Structural alignment using the source script, the supplied recording, and ffmpeg-detected answer windows.", "quietWindowCount": len(pauses), "answerWindowTargetMs": 12000, "status": "sequence_aligned", "scope": "Source-complete structural alignment; classroom playback still requires verification."}
    answer_key = {"schemaVersion": "1.0.0", "source": "ETS Volume 1 Practice Test A answer key, printed page 94", "sections": {"listening": listening_key, "structure": structure_key, "reading": reading_key}}
    page_index = {
        "schemaVersion": "1.0.0",
        "sourcePdf": "source/ets-toefl-itp-level1-volume1.pdf",
        "sections": {
            "listening": {"directions": [19, 24, 26], "questions": {"1-30": [20, 21, 22, 23], "31-38": [25], "39-50": [27, 28], "script": [100, 111]}},
            "structure": {"directions": [29, 30, 33], "questions": {"1-15": [31, 32], "16-40": [34, 35, 36]}},
            "reading": {"directions": [37, 38, 39], "passages": {"1-10": [40], "11-20": [44], "21-30": [48], "31-39": [52], "40-50": [56]}, "questions": {"1-10": [41, 42], "11-20": [45, 46], "21-30": [49, 50], "31-39": [53, 54], "40-50": [57, 58]}},
            "answerKey": [98],
            "scoreConversion": [126, 127, 128, 129],
        },
    }
    files = {
        "README.md": "# ETS TOEFL ITP Level 1 Volume 1 · Practice Test A\n\nStructured web-native Test Center package. Owner-supplied PDF and MP3 are retained privately for source checking; candidates receive editable directions, prompts, options, passages, and timing metadata.\n",
        "metadata/questions-practice-test-a-v1.json": json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
        "metadata/instructions-practice-test-a-v1.json": json.dumps(instructions, ensure_ascii=False, indent=2) + "\n",
        "metadata/answer-key-practice-test-a-v1.json": json.dumps(answer_key, ensure_ascii=False, indent=2) + "\n",
        "metadata/page-index-v1.json": json.dumps(page_index, ensure_ascii=False, indent=2) + "\n",
        "metadata/score-conversion-practice-test-a-v1.json": json.dumps(score, ensure_ascii=False, indent=2) + "\n",
        "metadata/listening-pauses-v1.json": json.dumps(pauses_doc, ensure_ascii=False, indent=2) + "\n",
        "metadata/listening-question-map-v1.json": json.dumps(map_doc, ensure_ascii=False, indent=2) + "\n",
        "metadata/listening-alignment-audit-v1.json": json.dumps(audit, ensure_ascii=False, indent=2) + "\n",
    }
    for relative, content in files.items():
        path = OUT / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    inventory = []
    for relative in list(files) + ["source/ets-toefl-itp-level1-volume1.pdf", "source/ets-toefl-itp-level1-volume1-layout.txt", "source/practice-test-a-listening.mp3"]:
        data = (OUT / relative).read_bytes()
        inventory.append({"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", str(AUDIO)], text=True))
    audio_stream = next(stream for stream in probe["streams"] if stream.get("codec_type") == "audio")
    audio_metadata = {"path": "source/practice-test-a-listening.mp3", "durationMs": round(float(probe["format"]["duration"]) * 1000), "codec": audio_stream.get("codec_name"), "sampleRateHz": int(audio_stream.get("sample_rate", "0")), "channels": int(audio_stream.get("channels", 0)), "bitRate": audio_stream.get("bit_rate")}
    manifest = {"package": "ets-volume1-practice-test-a", "version": 1, "form": "Practice Test A", "sourceBook": "ETS TOEFL ITP Level 1 Practice Tests, Volume 1", "audio": audio_metadata, "sourceFiles": inventory}
    (OUT / "package-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Built {OUT}: listening={len(listening)}, structure={len(completion)+len(errors)}, reading={len(reading_questions)}")


if __name__ == "__main__":
    main()
