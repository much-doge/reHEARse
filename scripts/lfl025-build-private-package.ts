import { createHash } from "node:crypto";
import { chmod, readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { workshopSchema } from "../src/domain/workshop/content";

const run = promisify(execFile);
const [sourceArg, outputArg, audioArg] = process.argv.slice(2);
if (!sourceArg || !outputArg || !audioArg) throw new Error("usage: lfl025-build-private-package <private-source.json> <private-import.json> <package-audio-directory>");
const sourcePath = resolve(sourceArg), outputPath = resolve(outputArg), audioRoot = resolve(audioArg);
const secureFile = async (path: string) => {
  const info = await stat(path);
  if (!info.isFile()) throw new Error("source_file_unavailable");
  return info;
};
const sourceStat = await secureFile(sourcePath);
if ((sourceStat.mode & 0o077) !== 0) throw new Error("private_source_permissions");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
for (const path of [source.source.transcriptFile, source.source.optionsAndReviewFile]) await secureFile(path);
const captureManifestPath=resolve(audioRoot,"..","manifest.json");
const captureManifest=JSON.parse(await readFile(captureManifestPath,"utf8"));
if(captureManifest.packageCode!=="1467")throw new Error("unexpected_audio_package");
const groups = [];
const items = [];
async function media(filename: string, expectedCategory:"shared-passage"|"question-prompt") {
  if (isAbsolute(filename) || filename.includes("..")) throw new Error("invalid_audio_reference");
  const path = resolve(audioRoot, filename), rel = relative(audioRoot, path);
  if (!rel || rel.startsWith("..")) throw new Error("invalid_audio_reference");
  const info = await secureFile(path), bytes = await readFile(path);
  const capture=captureManifest.files.find((entry:{localPath:string})=>entry.localPath===`package-audio/${filename}`);
  const sha256=createHash("sha256").update(bytes).digest("hex");
  if(!capture||capture.category!==expectedCategory||capture.bytes!==info.size||capture.sha256!==sha256)throw new Error("audio_capture_manifest_mismatch");
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type", "-of", "json", path], { maxBuffer: 16384 });
  const probe = JSON.parse(stdout);
  if (probe.streams?.length !== 1 || probe.streams[0].codec_name !== "mp3" || probe.streams[0].codec_type !== "audio") throw new Error("invalid_audio_type");
  const durationMs = Math.ceil(Number(probe.format?.duration) * 1000);
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0) throw new Error("invalid_audio_duration");
  if(Math.ceil(Number(capture.durationSeconds)*1000)!==durationMs)throw new Error("audio_capture_duration_mismatch");
  return { localFile: path, sha256, durationMs, sizeBytes: info.size, contentType: "audio/mpeg" as const };
}
for (const group of source.groups) {
  const { passageFile, ...publicFields } = group;
  groups.push({ ...publicFields, passageMedia: await media(passageFile,"shared-passage") });
}
const reviewSlides: Record<number, number> = {31:122,32:124,33:126,34:130,35:132,36:134,37:136,38:141,39:143,40:145,41:147,42:149,43:153,44:155,45:157,46:159,47:163,48:165,49:167,50:169};
const comparisonId: Record<number, string> = {
  31:"Wawancara membahas kelompok tari dan pertunjukannya secara umum. Opsi lain menambahkan klasifikasi, perbandingan, atau pelatihan yang tidak dibahas.",
  32:"Laporan seni itu memberi informasi kepada pendengar tentang pertunjukan. Ini bukan siaran penghargaan, pengumuman rapat, atau perayaan pembukaan teater.",
  33:"Pembicara menyebut kemungkinan perbedaan pemahaman antarkelompok. Persetujuan membantu memastikan tradisi ditampilkan dengan tepat, bukan untuk pendanaan atau pengalaman akting.",
  34:"Masalahnya bermula dari mesin pencuci piring, tetapi ketidakpuasan Paula berpusat pada tanggapan pemilik. Jarak, perbaikan umum, dan biaya teman sekamar bukan masalah yang disebutkan.",
  35:"Perbaikan sudah dilakukan. Ms. Connors keberatan karena Paula mengaturnya dan mengurangi biayanya dari sewa, bukan karena terlambat membayar atau tidak ada teknisi.",
  36:"Mereka berencana menemui pemilik, Ms. Connors. Perbaikan sudah dilakukan; mereka tidak menyebut rencana pindah atau membeli mesin pencuci piring.",
  37:"Sam memiliki sedikit latar belakang hukum yang dapat membantu pembicaraan. Mereka tidak mengatakan ia mengalami masalah serupa, mengenal pemilik, atau akan menggugat.",
  38:"Gagasan dosen membahas pengaruh kualitas suara terhadap pendengar. Volume, pitch, dan pace mendukung gagasan itu; alat bantu visual dan pengeras suara bukan pokoknya.",
  39:"Sarannya mencakup variasi pitch dan pace serta volume yang sesuai dengan pendengar dan ruangan. Berteriak atau menetapkan batas waktu bukan rekomendasinya.",
  40:"Dosen menyarankan suara yang kuat tanpa berteriak. Opsi lain mengubah saran itu menjadi kewajiban atau larangan yang tidak diberikan.",
  41:"Dosen menghubungkan jeda dengan peralihan topik dan antisipasi. Opsi lain menyebut tindakan vokal atau visual tanpa fungsi tersebut.",
  42:"Mahasiswa merekam bacaan mereka sendiri lalu menggunakannya untuk menilai suara. Perekam bukan untuk audio televisi atau pidato dosen.",
  43:"Topiknya adalah sejarah pengiriman surat. Perjalanan abad ke-19 dan kereta api hanya bagian dari pembahasan sejarah yang lebih luas.",
  44:"Kurir menunggu karena layanan feri tidak teratur. Pembicara tidak menyebut kapal penuh, arus deras, atau jembatan lemah sebagai penyebab.",
  45:"Pembicara memakai ungkapan itu untuk masa ketika kereta api mendominasi pengangkutan surat. Istilah itu tidak merujuk pada kuda, pos udara, atau seluruh pameran.",
  46:"Museum menjelaskan koleksi filateli yang berisi perangko. Opsi lain menyebut kendaraan pos atau gambar kereta yang tidak disebut sebagai isi koleksi.",
  47:"Pertanyaan merujuk pada gambaran umum yang disebut di awal. Pilihan tentang analisis data, tempat tinggal, atau teori tidak cocok dengan gambaran itu.",
  48:"Fotografi membuat gambar dapat dibagikan untuk dipelajari banyak orang. Dosen tidak menyebut pengurangan biaya, data, atau warna alami sebagai manfaat ini.",
  49:"Pelat merekam gambar teleskop dari objek jauh. Dosen tidak mengatakan pelat menggantikan teleskop, mempercepat proses, atau mempertajam warna.",
  50:"Paparan panjang membantu merekam cahaya redup dari objek jauh. Tujuannya bukan meniadakan teleskop, menambah jumlah foto, atau mengurangi waktu pengamatan."
};
for (const item of source.items) {
  const number = Number(item.number);
  const { evidence, reasons, tips, comparison, options, answer, groupId, primarySkill } = item;
  if (!Number.isInteger(number) || number < 31 || number > 50 || !reviewSlides[number]) throw new Error("invalid_source_question_number");
  items.push({
    id: `question-${number}`, title: { en: `Question ${number}`, id: `Soal ${number}` }, groupId,
    primarySkill, secondarySkills: [], questionNumber: number, options, answer, tips, guidedComparison: { en: comparison, id: comparisonId[number] },
    media: await media(`${number}.mp3`,"question-prompt"),
    review: { verified: true, decisiveEvidence: evidence, optionReasons: reasons, privateSourceReference: `Supplied transcript question ${number}; supplied review deck slide ${reviewSlides[number]}; package 1467 prompt ${number}.mp3` },
  });
}
const content = workshopSchema.parse({
  contractVersion: "part-bc-workshop.v1", id: "toefl-itp-part-bc-listening", version: "conversation-academic-talk-v1",
  title: { en: "TOEFL ITP Listening Parts B and C", id: "Menyimak TOEFL ITP Bagian B dan C" },
  groupingVersion: "dialogue-order-v1", pedagogyVersion: "longman-skills-18-27-paper-notes-v1", groups, items,
});
await writeFile(outputPath, JSON.stringify(content, null, 2), { mode: 0o600 });
await chmod(outputPath, 0o600);
console.log(`Built protected private package: ${content.items.length} items, ${content.groups.length} shared passages, ${content.items.length + content.groups.length} audio files.`);
