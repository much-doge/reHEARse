import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const repository = resolve(import.meta.dirname, "../../..");
const sourcePackage = join(repository, "apps/protefl-center/content/ets-volume3-practice-test-a-v1");
const output = join(repository, "apps/protefl-center/content/ets-volume3-practice-test-b-listening-v1");
const pdf = join(sourcePackage, "source/ets-toefl-itp-volume-3.pdf");
const audioInput = process.argv[2];

if (!audioInput) throw new Error("Usage: node import-volume3-test-b-listening.mjs /path/to/practice-test-b-audio.m4a");

const pages = [
  { physical: 67, split: 38 }, { physical: 68, split: 44 },
  { physical: 69, split: 39 }, { physical: 70, split: 43 },
  { physical: 72, split: 43 }, { physical: 74, split: 44 },
  { physical: 75, split: 39 }, { physical: 76, split: 41 },
];

function normalize(value) {
  return value.replace(/\s+/g, " ").replace(/\s+([.,?!;:])/g, "$1").trim();
}

function parseColumn(lines, sourcePage) {
  const items = [];
  let current = null;
  let target = "prompt";
  for (const raw of lines) {
    const line = normalize(raw);
    if (!line || /^\d+$/.test(line)) continue;
    const question = line.match(/^(\d+)\.\s+(.*)$/);
    if (question) {
      current = { number: Number(question[1]), prompt: question[2], options: {}, sourcePage };
      items.push(current);
      target = "prompt";
      continue;
    }
    const option = line.match(/^\(([A-D])\)\s*(.*)$/);
    if (option && current) {
      current.options[option[1]] = option[2];
      target = option[1];
      continue;
    }
    if (!current) continue;
    if (target === "prompt") current.prompt = normalize(current.prompt + " " + line);
    else current.options[target] = normalize((current.options[target] ?? "") + " " + line);
  }
  return items;
}

const questions = [];
for (const page of pages) {
  const text = execFileSync("pdftotext", ["-f", String(page.physical), "-l", String(page.physical), "-layout", pdf, "-"], { encoding: "utf8" });
  const left = [], right = [];
  for (const line of text.split("\n")) {
    if (line.includes("This is the end of Section 1")) break;
    left.push(line.slice(0, page.split));
    right.push(line.slice(page.split));
  }
  questions.push(...parseColumn(left, page.physical - 4), ...parseColumn(right, page.physical - 4));
}
questions.sort((a, b) => a.number - b.number);
for (let index = 0; index < 50; index += 1) {
  const item = questions[index];
  if (item?.number !== index + 1) throw new Error(`Missing or duplicate question ${index + 1}`);
  for (const choice of ["A", "B", "C", "D"]) if (!item.options[choice]) throw new Error(`Question ${item.number} is missing option ${choice}`);
  item.part = item.number <= 30 ? "A" : item.number <= 37 ? "B" : "C";
}

const answerKey = [
  "A", "C", "B", "D", "C", "D", "D", "B", "B", "D",
  "B", "B", "D", "A", "D", "B", "C", "C", "A", "D",
  "D", "D", "A", "A", "A", "B", "C", "C", "A", "A",
  "A", "D", "B", "B", "B", "C", "B", "A", "D", "C",
  "B", "D", "B", "C", "A", "C", "C", "D", "A", "B",
];

const silenceScan = spawnSync("ffmpeg", ["-hide_banner", "-i", audioInput, "-af", "silencedetect=noise=-42dB:d=4", "-f", "null", "-"], { encoding: "utf8" });
if (silenceScan.status !== 0) throw new Error(silenceScan.stderr || "ffmpeg silence detection failed");
const silenceOutput = silenceScan.stderr;
const silenceLines = silenceOutput.split("\n");
const starts = silenceLines.flatMap((line) => line.match(/silence_start: ([0-9.]+)/)?.[1] ? [Number(line.match(/silence_start: ([0-9.]+)/)[1])] : []);
const ends = silenceLines.flatMap((line) => line.match(/silence_end: ([0-9.]+)/)?.[1] ? [Number(line.match(/silence_end: ([0-9.]+)/)[1])] : []);
if (starts.length !== 50 || ends.length !== 50) throw new Error(`Expected 50 answer windows; found ${starts.length} starts and ${ends.length} ends`);
const durationSeconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", audioInput], { encoding: "utf8" }).trim());
const ms = (seconds) => Math.round(seconds * 1000);
const pauses = starts.map((start, index) => ({ question: index + 1, answerWindowStartMs: ms(start), answerWindowEndMs: ms(ends[index]), durationMs: ms(ends[index] - start) }));

const groups = [
  { first: 31, last: 34, id: "part-b-1", type: "conversation" },
  { first: 35, last: 37, id: "part-b-2", type: "conversation" },
  { first: 38, last: 41, id: "part-c-1", type: "talk" },
  { first: 42, last: 46, id: "part-c-2", type: "talk" },
  { first: 47, last: 50, id: "part-c-3", type: "talk" },
];
const firstCueMs = 142_670;
const timingQuestions = pauses.map((pause, index) => {
  const number = index + 1;
  const group = groups.find((candidate) => number >= candidate.first && number <= candidate.last);
  const groupStart = group ? (group.first === 1 ? firstCueMs : pauses[group.first - 2].answerWindowEndMs) : firstCueMs;
  return {
    question: number,
    groupId: group?.id ?? "part-a",
    groupType: group?.type ?? "question",
    questionAudioStartMs: number === 1 ? firstCueMs : pauses[index - 1].answerWindowEndMs,
    questionAudioEndMs: pause.answerWindowStartMs,
    contextStartMs: groupStart,
    answerWindowStartMs: pause.answerWindowStartMs,
    answerWindowEndMs: pause.answerWindowEndMs,
  };
});

await mkdir(join(output, "metadata"), { recursive: true });
await mkdir(join(output, "source"), { recursive: true });
const structuredQuestions = { listening: questions, structure: { completion: [], errorIdentification: [] }, reading: { passages: [], questions: [] } };
const keys = { schemaVersion: "1.0.0", form: "Practice Test B", sourcePage: 105, sections: { listening: answerKey, structure: [], reading: [] } };
const pausesDocument = { schemaVersion: "1.0.0", source: "Practice Test B, Section 1", detection: "ffmpeg silencedetect noise=-42dB duration=4s", audioDurationMs: ms(durationSeconds), nativeAnswerWindowsPreserved: true, pauses };
const mapDocument = {
  schemaVersion: "1.0.0",
  source: "ETS Volume 3 Practice Test B full Listening audio aligned to the source script and 50 native answer windows",
  notes: [
    "Question boundaries use the 50 acoustic answer windows in listening-pauses-v1.json; playback starts after the previous response window.",
    "The first Part A recording cue begins at 142670ms in the matched source audio.",
    "Part B groups: 31-34 and 35-37. Part C talks: 38-41, 42-46, and 47-50.",
  ],
  questions: timingQuestions,
};
const audit = {
  version: 1,
  method: "Matched the source script against the candidate recording transcript, then aligned each response window to the following long quiet interval detected by ffmpeg silencedetect at -42 dB for at least 4 seconds.",
  quietWindowCount: pauses.length,
  answerWindowTargetMs: 12000,
  transcriptEvidence: [
    { cue: "first Part A conversation", transcript: "Hey, you look like you could use a study break", audioStartMs: 144420 },
    { cue: "Part B baryton conversation", transcript: "baryton", groupId: "part-b-1" },
    { cue: "Part B polarized-light conversation", transcript: "polarized light", groupId: "part-b-2" },
  ],
  groupTransitions: groups.map((group) => ({ groupId: group.id, type: group.type, questions: [group.first, group.last], contextStartMs: timingQuestions[group.first - 1].contextStartMs })),
  status: "sequence_aligned",
  scope: "Structural alignment from the source script, matched recording transcript, detected quiet windows, and group boundaries; not a classroom playback observation.",
};

const sourceInstructions = JSON.parse(await readFile(join(sourcePackage, "metadata/instructions-practice-test-a-v1.json"), "utf8"));
const sourceScoreConversion = JSON.parse(await readFile(join(sourcePackage, "metadata/score-conversion-practice-test-a-v1.json"), "utf8"));
sourceInstructions.source = "ETS Volume 3 Practice Test B source directions";

await Promise.all([
  writeFile(join(output, "metadata/questions-practice-test-b-listening-v1.json"), JSON.stringify(structuredQuestions, null, 2) + "\n"),
  writeFile(join(output, "metadata/answer-key-practice-test-b-listening-v1.json"), JSON.stringify(keys, null, 2) + "\n"),
  writeFile(join(output, "metadata/listening-pauses-v1.json"), JSON.stringify(pausesDocument, null, 2) + "\n"),
  writeFile(join(output, "metadata/listening-question-map-v1.json"), JSON.stringify(mapDocument, null, 2) + "\n"),
  writeFile(join(output, "metadata/listening-alignment-audit-v1.json"), JSON.stringify(audit, null, 2) + "\n"),
  writeFile(join(output, "metadata/instructions-practice-test-b-v1.json"), JSON.stringify(sourceInstructions, null, 2) + "\n"),
  writeFile(join(output, "metadata/score-conversion-practice-test-b-v1.json"), JSON.stringify(sourceScoreConversion, null, 2) + "\n"),
  writeFile(join(output, "source/practice-test-b-listening.m4a"), await readFile(audioInput)),
]);

const inventory = [];
for (const path of [
  "README.md",
  "metadata/questions-practice-test-b-listening-v1.json",
  "metadata/answer-key-practice-test-b-listening-v1.json",
  "metadata/listening-pauses-v1.json",
  "metadata/listening-question-map-v1.json",
  "metadata/listening-alignment-audit-v1.json",
  "metadata/instructions-practice-test-b-v1.json",
  "metadata/score-conversion-practice-test-b-v1.json",
  "source/practice-test-b-listening.m4a",
]) {
  const content = await readFile(join(output, path));
  inventory.push({ path, bytes: content.byteLength, sha256: createHash("sha256").update(content).digest("hex") });
}
await writeFile(join(output, "package-manifest.json"), JSON.stringify({
  package: "ets-volume3-practice-test-b-listening",
  version: 1,
  form: "Practice Test B · Listening",
  sourceBook: "ETS TOEFL ITP Level 1 Practice Tests, Volume 3",
  audioLookup: { matchedVideoId: "FGSAKtHwjXc", matchedTitle: "TOEFL ITP TEST 4 Section 1", matchEvidence: ["study break/library item", "baryton conversation", "polarized-light conversation"] },
  sourceFiles: inventory,
}, null, 2) + "\n");

console.log(`Imported ${questions.length} questions and ${pauses.length} answer windows from ${basename(audioInput)}.`);
