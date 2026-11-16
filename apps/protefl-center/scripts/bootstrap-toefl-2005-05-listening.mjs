import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "../../..");
const output = join(repository, "apps/protefl-center/content/ets-toefl-pbt-2005-05-listening-v1");
const audioInput = process.argv[2];
if (!audioInput) throw new Error("Usage: node bootstrap-toefl-2005-05-listening.mjs /path/to/2005-05.mp3");

// Each row is prompt, then source options A-D. Part A prompts were checked
// against the supplied recording; Part B/C prompts were also checked against
// the public transcript cited in the package receipt.
const rows = [
  ["What does the woman imply?", "The man should go to the museum by shuttle bus.", "The next train leaves in 25 minutes.", "The train will arrive at the museum before 10:30.", "The man just missed the shuttle bus to the museum."],
  ["What does the woman mean?", "She forgot to study for the exam.", "She had planned to go to the movie.", "The man should have invited her to the movies.", "The man should have studied for the exam."],
  ["What are the speakers talking about?", "A new building", "Directions to the gym", "Going to the library", "New library hours"],
  ["What does the man imply the woman should do?", "Take a different history course", "Use a computer in the lab", "Help him write his paper", "Return his computer as soon as possible"],
  ["What does the woman imply?", "She got her watch where her sister works.", "She will help the man buy a watch.", "She had to work hard to buy a watch.", "The man should not buy a watch at her sister's store."],
  ["What does the man suggest the woman do?", "Find out if classes are cancelled", "Not go to classes tomorrow", "Turn on the radio", "Look to see if the storm has stopped"],
  ["What can be inferred about Gloria?", "No one has recently seen her", "She is spending a lot of time in the library.", "She is avoiding the man.", "She went home for vacation."],
  ["What will the man do?", "Try to fix what is wrong with the computer", "Ask someone else for help with the computer", "Turn on another computer", "Let the woman use his computer"],
  ["What does the woman mean?", "She thinks the man should order the fish.", "She wants the man to choose quickly.", "She prefers the chicken.", "She cannot decide what to eat."],
  ["What does the man imply about the woman?", "She should go home now to get the CD.", "She can return the CD to Tom later.", "She can borrow a CD from Tom when she sees him in class.", "She should not have taken Tom's CD home with her."],
  ["What does the man suggest the woman do?", "Cancel her appointment at the clinic", "Make an appointment at the clinic soon", "Begin practicing for the German test next week", "Arrange to take the German test at a later date"],
  ["What will the woman probably do?", "Rent the apartment she saw first", "Visit her new neighbors", "Look at other apartments before deciding", "Write a check for the rent"],
  ["What does the man imply?", "He likes to play basketball", "He is proud of his ability as a basketball player.", "He does not want to watch the basketball game.", "He is not on the basketball team."],
  ["What does the woman imply the man should do?", "Buy both shirts today", "Buy the green shirt", "Return the shirt he bought last week", "Not buy any shirts"],
  ["What can be inferred from the conversation?", "The woman did not accept the job offer.", "The woman does not like her new job.", "The woman is planning to start a new job.", "The woman is looking for a job at a different bank."],
  ["What will the woman probably do?", "Go to the party with the man", "Take her aunt to the party", "Invite the man to the play", "See a play with her aunt"],
  ["What can be inferred about the woman?", "She is looking for another job", "She will apply for financial aid next year.", "She thinks she will not need financial aid.", "She thinks she is not taking enough classes."],
  ["What does the man say about the cake?", "It is the only kind the restaurant has left.", "The woman does not have to pay extra for it.", "It is a specialty of the restaurant.", "He will replace it with a different dessert."],
  ["What does the man mean?", "A small town can have negative qualities.", "It can be difficult to run a business in a small town.", "His family owns a business in his hometown.", "He would like to visit the woman's hometown."],
  ["What does the man mean?", "He would like more time to prepare next time.", "He will not be able to attend the open house.", "He enjoyed working as a volunteer.", "He will not be able to coordinate the program again."],
  ["What can be inferred about Peter?", "He will meet the man and woman before his psychology class.", "He is in the same class as the man and woman.", "He is late for an appointment with the man and woman.", "He forgot to do his assignment for today's class."],
  ["What does the woman mean?", "She is looking for a job on campus.", "She can get the materials they gave out at the meeting.", "She went to the meeting with her roommate.", "She is too busy to help the man."],
  ["What does the man mean?", "He probably will not be able to follow the professor's advice.", "He has not finished doing the research for his presentation.", "He does not understand what the professor means.", "He would like the professor to listen to him rehearse his presentation."],
  ["What does the man mean?", "He knows who will be performing in the musical.", "He doubts that the theater group will perform a musical next year.", "The theater group needs to select a new director.", "The director has probably chosen the musical."],
  ["What does the man imply?", "He has been sick recently.", "He is tired of looking for an apartment.", "He wants an apartment near his work.", "He has been looking for a new job for a long time."],
  ["What had the man assumed?", "The woman would not vote in the elections.", "Ben would be elected class president.", "Ben would not run for class president.", "The elections would be held later."],
  ["What does the man mean?", "He did not recommend the lecture.", "He did not speak to the woman yesterday.", "He is eager to go to the lecture.", "He started to like astronomy only recently."],
  ["What does the woman mean?", "She needs to continue studying.", "She did not read the reviews.", "She has already seen the movie.", "She intends to go see the movie."],
  ["What does the man mean?", "He thinks the dry weather will change.", "He is already conserving water.", "Ways should be found to use less water.", "The dry weather will be worse than last summer."],
  ["What does the man imply?", "Everyone should already have the new manual.", "The old manual should not be used anymore.", "The new manual has not been completed yet.", "The old manual will not be changed."],
  ["What is the conversation mainly about?", "The class reading list", "Books about New York City", "A book by Theodore Dreiser", "A critical review of Sister Carrie"],
  ["According to the woman, how is Sister Carrie different from other novels of its time?", "It is set in the city instead of the country.", "It does not try to teach a moral lesson.", "It is about a woman working in a traditionally male role.", "The main character gets into trouble."],
  ["How did Sister Carrie eventually gain recognition?", "Some British reviewers wrote favorably about it.", "Dreiser published it himself.", "An editor revised it.", "Dreiser rewrote it using a different style."],
  ["What is the class mainly discussing?", "How to learn a second language", "The importance of early childhood education", "Phases of language development in young children", "Methods to help children develop their vocabularies"],
  ["Why does the student mention the sounds k and g?", "They are difficult for children to pronounce.", "They occur in all languages.", "They are among the first sounds babies make.", "They are sometimes used to refer to house pets."],
  ["According to the student, why are newborns not able to make language-like sounds?", "Their voice box is not positioned correctly yet.", "Their hearing is not good enough yet.", "They do not yet have the muscle control needed.", "Their brains are not yet adequately developed."],
  ["According to the discussion, when does vocabulary growth first start to increase dramatically?", "When children learn to say whole sentences", "In the first month of life", "When children start to go to school", "When children learn to associate sounds with meaning"],
  ["According to the discussion, what do linguists still not know?", "Until what age vocabulary growth continues", "How children are able to learn language", "When the best time to start a foreign language is", "How to identify children with language disorders"],
  ["What is the main topic of the talk?", "The use of beads in Native American monetary systems", "Communication over long distances in North America", "Difficulties encountered by native couriers", "Alliances between the Iroquois and the Algonquin"],
  ["What would cause a letter to be expensive to receive?", "Adverse traveling conditions delayed the courier.", "The courier needed to hire a guide.", "The fees of several couriers were included in the charge.", "The letter contained a valuable item."],
  ["What event would probably have been symbolized by a purple wampum bead?", "The signing of a treaty", "A wedding feast", "The birth of a child", "A funeral"],
  ["What is the talk mainly about?", "Planning a garden", "Feeding pets", "Attracting birds", "Preserving eggs"],
  ["Why are birds attracted to eggshells?", "They use them in making nests.", "They like to eat them.", "They use them when mating.", "They drink water from them."],
  ["How are the eggshells prepared?", "They are dried in the sun.", "They are soaked in water.", "They are cooled in the refrigerator.", "They are baked in the oven."],
  ["How does the preparation process affect the eggshells?", "It makes them clean and free of germs.", "It makes them more visible for the birds.", "It makes them more nutritious.", "It makes them softer."],
  ["What can be inferred about the woman?", "She is a good cook.", "She collects birds' nests.", "She likes to have birds visit her garden.", "She is a professional gardener."],
  ["What does the professor mainly discuss?", "How to prevent landslides in populated areas", "How to repair damage to houses caused by heavy rains", "How geologists study landslides", "Three materials needed for stable construction"],
  ["According to the professor, why is it important to perform geological surveys?", "They can determine the cost of construction.", "They can reveal unsafe conditions for building.", "They can show where landslides have occurred.", "They can measure the rate of water drainage."],
  ["What does the professor say about vegetation on a slope?", "It often interferes with construction.", "It helps keep the soil in place.", "It grows quickly after heavy rains.", "It makes slopes unstable."],
  ["According to the professor, what might cause a buildup of water on a slope?", "Frequent landslides", "Too much vegetation", "Water draining from another slope", "A wall that stops water from draining"],
];

const answerKey = ["ADABA", "ABABB", "BCDBC", "DCBAD", "CBADC", "DADCC", "CBACC", "ADBBC", "DCBDA", "CABBD"].join("");
if (rows.length !== 50 || answerKey.length !== 50) throw new Error("Expected exactly 50 listening questions and keys");
const questions = rows.map(([prompt, A, B, C, D], index) => ({
  number: index + 1,
  prompt,
  options: { A, B, C, D },
  sourcePage: Math.min(7, Math.floor(index / 7) + 1),
  part: index < 30 ? "A" : index < 38 ? "B" : "C",
}));

const silenceScan = spawnSync("ffmpeg", ["-hide_banner", "-i", audioInput, "-af", "silencedetect=noise=-32dB:d=4", "-f", "null", "-"], { encoding: "utf8" });
if (silenceScan.status !== 0) throw new Error(silenceScan.stderr || "ffmpeg silence detection failed");
const silenceLines = silenceScan.stderr.split("\n");
const pauses = [];
let pendingStart = null;
for (const line of silenceLines) {
  const start = line.match(/silence_start: ([0-9.]+)/);
  if (start) pendingStart = Number(start[1]);
  const end = line.match(/silence_end: ([0-9.]+).*silence_duration: ([0-9.]+)/);
  if (end && pendingStart !== null) {
    pauses.push({ start: pendingStart, end: Number(end[1]), duration: Number(end[2]) });
    pendingStart = null;
  }
}
if (pauses.length < 51) throw new Error(`Expected 50 response windows and terminal tail; found ${pauses.length}`);
const selectedPauses = pauses.slice(0, 50);
const durationMs = Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", audioInput], { encoding: "utf8" }).trim()) * 1000);
const ms = (seconds) => Math.round(seconds * 1000);
const pauseRows = selectedPauses.map((pause, index) => ({ question: index + 1, answerWindowStartMs: ms(pause.start), answerWindowEndMs: ms(pause.end), durationMs: ms(pause.duration) }));
const groups = [
  { id: "part-b-conversation-31-33", type: "conversation", part: "B", first: 31, last: 33, contextStartMs: 934500 },
  { id: "part-b-class-discussion-34-38", type: "conversation", part: "B", first: 34, last: 38, contextStartMs: 1083460 },
  { id: "part-c-canadian-history-39-41", type: "talk", part: "C", first: 39, last: 41, contextStartMs: 1478650 },
  { id: "part-c-birdwatching-42-46", type: "talk", part: "C", first: 42, last: 46, contextStartMs: 1640550 },
  { id: "part-c-geology-47-50", type: "talk", part: "C", first: 47, last: 50, contextStartMs: 1788420 },
];
const questionMap = pauseRows.map((pause, index) => {
  const number = index + 1;
  const group = groups.find((candidate) => number >= candidate.first && number <= candidate.last);
  const fallbackStartMs = number === 1 ? 17150 : pauseRows[index - 1].answerWindowEndMs;
  const contextStartMs = group?.contextStartMs ?? fallbackStartMs;
  const questionAudioStartMs = number === 1 ? 17150
    : group && number === group.first ? contextStartMs
      : pauseRows[index - 1].answerWindowEndMs;
  return { question: number, groupId: group?.id ?? `part-a-${number}`, groupType: group?.type ?? "question", questionAudioStartMs, questionAudioEndMs: pause.answerWindowStartMs, contextStartMs, answerWindowStartMs: pause.answerWindowStartMs, answerWindowEndMs: pause.answerWindowEndMs };
});
for (const group of groups) {
  const lead = questionMap.find((item) => item.question === group.first);
  if (!lead || lead.questionAudioStartMs !== lead.contextStartMs)
    throw new Error(`First playback for ${group.id} must begin at its mapped context`);
}

const instructions = {
  schemaVersion: "1.0.0",
  source: "May 2005 TOEFL PBT Section I directions, checked against the supplied recording where audible; Part A text is the standard printed direction because the supplied recording starts with its transition into Part A.",
  listening: {
    overview: "This section contains 50 questions in three parts. Answer on the basis of what is stated or implied by the speakers.",
    partA: "In Part A, you will hear short conversations between two people. After each conversation, you will hear a question about the conversation. The conversations and questions will not be repeated. After you hear a question, read the four possible answers and choose the best answer.",
    partB: "In this part of the test, you will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer. Then, on your answer sheet, find the number of the question and fill in the space that corresponds to the letter of the answer you have chosen. Remember, you are not allowed to take notes or write in your test book.",
    partC: "In this part of the test, you will hear several short talks. After each talk, you will hear some questions. The talks and the questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer. Then, on your answer sheet, find the number of the question and fill in the space that corresponds to the letter of the answer you have chosen.",
  },
};

const alignment = {
  version: 1,
  status: "sequence_aligned",
  scope: "Local recording, transcript match, and acoustic-window alignment; not classroom playback verification.",
  method: "Matched the supplied recording to the May 2005 transcript using independent spoken anchors, then detected quiet response windows with ffmpeg silencedetect at -32 dB for at least four seconds. Whisper small.en ran locally to locate spoken directions, cues, and transitions; its full working transcript is not retained in the package.",
  audioAnchorEvidence: [
    { cue: "Museum of Fine Arts", timeMs: 17150, part: "A", item: 1 },
    { cue: "accepted the bank job offer", timeMs: 400120, part: "A", item: 15 },
    { cue: "Hi Mike and instructor's manual", timeMs: 814210, part: "A", item: 30 },
    { cue: "Sister Carrie conversation", timeMs: 934500, part: "B", questions: [31, 33] },
    { cue: "child language class discussion", timeMs: 1083460, part: "B", questions: [34, 38] },
    { cue: "Canadian history talk", timeMs: 1478650, part: "C", questions: [39, 41] },
    { cue: "birdwatching and eggshells talk", timeMs: 1640550, part: "C", questions: [42, 46] },
    { cue: "geology class talk", timeMs: 1788420, part: "C", questions: [47, 50] },
  ],
  directionsAndTransitions: [
    { label: "Part A recording introduction", startMs: 0, endMs: 15550, scored: false },
    { label: "Part A first conversation", startMs: 17150, endMs: pauseRows[0].answerWindowStartMs, scored: true },
    { label: "Part A end marker", startMs: 829830, endMs: 845310, scored: false },
    { label: "Part B directions lead-in", startMs: 858500, endMs: 862700, scored: false },
    { label: "Part B spoken directions", startMs: 879780, endMs: 918450, scored: false },
    { label: "Part B question 31-33 introduction", startMs: 929720, endMs: 940400, scored: false },
    { label: "Part B questions 31-33 context", startMs: 934500, endMs: pauseRows[30].answerWindowStartMs, scored: true },
    { label: "Part B questions 34-38 context", startMs: 1083460, endMs: pauseRows[37].answerWindowStartMs, scored: true },
    { label: "Part B end marker", startMs: 1268940, endMs: 1273000, scored: false },
    { label: "Part C directions lead-in and spoken directions", startMs: 1284080, endMs: 1324940, scored: false },
    { label: "Part C sample demonstration", startMs: 1324940, endMs: 1474930, scored: false },
    { label: "Part C questions 39-41 context", startMs: 1478650, endMs: pauseRows[38].answerWindowStartMs, scored: true },
    { label: "Part C questions 42-46 context", startMs: 1640550, endMs: pauseRows[41].answerWindowStartMs, scored: true },
    { label: "Part C questions 47-50 context", startMs: 1788420, endMs: pauseRows[46].answerWindowStartMs, scored: true },
    { label: "Listening section-end instructions", startMs: 1965540, endMs: 1987840, scored: false },
  ],
  groups: groups.map((group) => ({ groupId: group.id, part: group.part, type: group.type, questions: [group.first, group.last], contextStartMs: group.contextStartMs })),
  answerWindowTargetMs: 12000,
  exceptions: pauseRows.filter((pause) => pause.durationMs < 10000).map((pause) => ({ question: pause.question, observedMs: pause.durationMs })),
  quietWindowCount: pauseRows.length,
};

await mkdir(join(output, "metadata"), { recursive: true });
await mkdir(join(output, "source"), { recursive: true });
await copyFile(audioInput, join(output, "source/listening.mp3"));
const documents = [
  ["README.md", `# May 2005 TOEFL PBT · Listening-only\n\nOwner-authorized Listening-only package for the TOEFL-like Test Center. It contains 50 editable prompts and choices, server-only keys, the supplied recording, a source-backed directions file, and exact acoustic question/group timing.\n\nThe source copy and key reference are identified in the LFL-111 receipt. No page images, PDF scan, full dialogue transcript, or score-conversion table is included. The result reports source-supported raw counts and post-completion item review.\n`],
  ["metadata/questions-2005-05-listening-v1.json", JSON.stringify({ schemaVersion: "1.0.0", form: "May 2005 TOEFL PBT", listening: questions, structure: { completion: [], errorIdentification: [] }, reading: { passages: [], questions: [] } }, null, 2) + "\n"],
  ["metadata/answer-key-2005-05-listening-v1.json", JSON.stringify({ schemaVersion: "1.0.0", source: "May 2005 reference-answer list posted at the cited Gter forum; first 50 entries correspond to Section I Listening. Questions 24 and 32 were adjudicated against the supplied recording, the matching transcript, and the printed options because the forum letters conflict with the evidence. No ETS-issued answer key was located.", reviewedDiscrepancies: [{ question: 24, referenceLetter: "B", selectedLetter: "D", basis: "The speaker says the director has already picked the musical; option D states this directly." }, { question: 32, referenceLetter: "D", selectedLetter: "B", basis: "The woman contrasts Dreiser's ending with other authors' moral punishment; option B states that contrast." }], sections: { listening: [...answerKey] } }, null, 2) + "\n"],
  ["metadata/instructions-2005-05-listening-v1.json", JSON.stringify(instructions, null, 2) + "\n"],
  ["metadata/score-conversion-2005-05-v1.json", JSON.stringify({ schemaVersion: "1.0.0", source: "No May 2005 Listening score-conversion table was present in the owner-supplied recording or the checked question/key references.", ranges: [] }, null, 2) + "\n"],
  ["metadata/listening-pauses-v1.json", JSON.stringify({ schemaVersion: "1.0.0", source: "May 2005 TOEFL PBT Listening recording supplied by the owner", detection: "ffmpeg silencedetect noise=-32dB duration=4s", audioDurationMs: durationMs, nativeAnswerWindowsPreserved: true, pauses: pauseRows }, null, 2) + "\n"],
  ["metadata/listening-question-map-v1.json", JSON.stringify({ schemaVersion: "1.0.0", source: "May 2005 TOEFL PBT Listening recording aligned to the public transcript and spoken cues", notes: ["The first question starts at the audible Part A cue at 17.150s; introductory directions are shown in the Test Center instructions.", "Part B contains dialogue groups 31-33 and 34-38.", "Part C contains talk groups 39-41, 42-46, and 47-50. The sample demonstration before question 39 is unscored and excluded from candidate question mapping.", "Question audio starts after the previous answer window except for each group lead-in; contextStartMs returns a focused Part B/C retry to the full dialogue or talk.", "50 response windows were identified. A further short terminal silence after the end-of-section announcement is not a question window."], questions: questionMap }, null, 2) + "\n"],
  ["metadata/listening-alignment-audit-v1.json", JSON.stringify(alignment, null, 2) + "\n"],
  ["metadata/page-index-v1.json", JSON.stringify({ schemaVersion: "1.0.0", source: "May 2005 TOEFL PBT question scan, printed Listening pages 1-7; private audit reference only", pages: Array.from({ length: 7 }, (_, i) => ({ page: i + 1, questions: [i * 7 + 1, Math.min(50, (i + 1) * 7)] })) }, null, 2) + "\n"],
];
for (const [path, content] of documents) await writeFile(join(output, path), content);

const audioBuffer = await readFile(join(output, "source/listening.mp3"));
const audioProbe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels,bit_rate", "-of", "json", join(output, "source/listening.mp3")], { encoding: "utf8" }));
const audioStream = audioProbe.streams[0];
const inventoryPaths = [...new Set(["README.md", ...documents.map(([path]) => path), "source/listening.mp3"])];
const sourceFiles = await Promise.all(inventoryPaths.map(async (path) => {
  const content = await readFile(join(output, path));
  return { path, bytes: content.byteLength, sha256: createHash("sha256").update(content).digest("hex") };
}));
const contentHash = createHash("sha256").update(sourceFiles.map((row) => `${row.path}:${row.sha256}`).join("\n")).digest("hex");
const answerKeyHash = sourceFiles.find((row) => row.path.includes("answer-key-")).sha256;
const scoreTableHash = sourceFiles.find((row) => row.path.includes("score-conversion-")).sha256;
const timingMapHash = createHash("sha256").update(sourceFiles.filter((row) => /listening-(?:pauses|question-map)-/.test(row.path)).map((row) => `${row.path}:${row.sha256}`).join("\n")).digest("hex");
await writeFile(join(output, "package-manifest.json"), JSON.stringify({
  package: "ets-toefl-pbt-2005-05-listening",
  version: 1,
  form: "May 2005 TOEFL PBT · Listening",
  sourceOwnerAuthorization: "Owner confirmed permission to digitize and deliver the complete Listening form in the LFL-111 request.",
  scope: "listening",
  questionCount: 50,
  audio: { path: "source/listening.mp3", durationMs, codec: audioStream.codec_name, sampleRateHz: Number(audioStream.sample_rate), channels: Number(audioStream.channels), bitRate: audioStream.bit_rate, sha256: createHash("sha256").update(audioBuffer).digest("hex") },
  integrity: { contentHash, answerKeyHash, scoreTableHash, timingMapHash },
  sourceFiles,
}, null, 2) + "\n");
console.log(`Bootstrapped ${questions.length} questions and ${pauseRows.length} response windows from ${basename(audioInput)}.`);
