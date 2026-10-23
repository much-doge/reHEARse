import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { workshopSchema, type WorkshopContent } from "../../domain/workshop/content";
const run=promisify(execFile);
export async function validatePrivatePackage(manifest:string):Promise<WorkshopContent>{
 const source=await stat(manifest);if((source.mode&0o077)!==0)throw new Error("private_manifest_permissions");
 const content=workshopSchema.parse(JSON.parse(await readFile(manifest,"utf8")));
 const assets=[...content.groups.flatMap(group=>group.passageMedia?[group.passageMedia]:[]),...content.items.map(item=>item.media)];
 for(const media of assets){
  if(media.storageKey||media.publicUrl)throw new Error("fresh_import_requires_local_media");
  const file=await stat(media.localFile);if(!file.isFile()||file.size!==media.sizeBytes)throw new Error("media_size_mismatch");
  const bytes=await readFile(media.localFile);if(createHash("sha256").update(bytes).digest("hex")!==media.sha256)throw new Error("media_hash_mismatch");
  const {stdout}=await run("ffprobe",["-v","error","-show_entries","format=duration:stream=codec_name,codec_type","-of","json",media.localFile],{maxBuffer:16384});
  const audio=JSON.parse(stdout);if(audio.streams?.length!==1||audio.streams[0].codec_name!=="mp3"||audio.streams[0].codec_type!=="audio")throw new Error("invalid_audio_type");
  const duration=Math.ceil(Number(audio.format?.duration)*1000);if(!Number.isFinite(duration)||duration!==media.durationMs)throw new Error("media_duration_mismatch");
 }
 return content;
}
