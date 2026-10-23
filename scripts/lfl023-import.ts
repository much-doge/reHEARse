/** Operator-only import. Dry-run reads private files but uses no network/credentials. */
import { createHash,randomUUID,randomBytes } from "node:crypto";
import pg from "pg";
import { validatePrivatePackage } from "../src/adapters/workshop/import-validation";
import { S3CompatibleMediaStore } from "../src/adapters/media/s3-media-store";
import { readS3MediaConfig } from "../src/adapters/media/s3-config";
let stage="package_validation";
async function main(){
 const [manifest,mode]=process.argv.slice(2);if(!manifest||!["--dry-run","--publish"].includes(mode))throw new Error("manifest and explicit mode required");
 const content=await validatePrivatePackage(manifest),canonical=structuredClone(content);
 for(const item of canonical.items){item.media.localFile="operator-private";item.review.privateSourceReference="operator-private-review";}
 for(const group of canonical.groups)if(group.passageMedia)group.passageMedia.localFile="operator-private";
 const digest=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 if(mode==="--dry-run"){const assets=content.items.length+content.groups.filter(g=>g.passageMedia).length;console.log(`PASS: ${content.items.length} private items in ${content.groups.length} groups; ${assets} local hashes/sizes/MP3 types/durations, original option order and reviewed keys. No network or credentials used.`);return;}
 if(process.env.ALLOW_WORKSHOP_IMPORT!=="true")throw new Error("explicit_operator_import_required");
 stage="storage_configuration";const config=readS3MediaConfig();if(config.deliveryMode!=="public"||!config.prefix||!config.publicBaseUrl)throw new Error("direct_public_media_required");
 stage="database_connect";const media=new S3CompatibleMediaStore(config),pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1}),c=await pool.connect();
 try{
  stage="database_preflight";
  await c.query("BEGIN");await c.query("SELECT pg_advisory_xact_lock(817240223)");
  const exists=(await c.query("SELECT digest FROM workshop_content WHERE version=$1",[content.version])).rows[0];
  if(exists){if(exists.digest!==digest)throw new Error("immutable_version_conflict");await c.query("ROLLBACK");console.log("Identical immutable workshop version already published; no upload.");return;}
  const id=randomUUID(),lineage=[];
  const assets=[...content.groups.flatMap(group=>group.passageMedia?[{media:group.passageMedia,groupId:group.id}]:[]),...content.items.map(item=>({media:item.media,itemId:item.id}))];
  for(const asset of assets){
   const source=asset.media;
   const key=`${config.prefix}/activities/${id}/${content.version}/${randomBytes(16).toString("hex")}.mp3`;
   stage="object_upload";
   await media.uploadFile({path:source.localFile,storageKey:key,contentType:"audio/mpeg",sizeBytes:source.sizeBytes,sha256:source.sha256,activitySlug:content.id});
   const url=(await media.createDownloadUrl(key)).url,publicUrl=new URL(url),base=new URL(config.publicBaseUrl);
   if(publicUrl.protocol!=="https:"||publicUrl.origin!==base.origin||!publicUrl.pathname.startsWith(base.pathname.replace(/\/$/,"")+"/"))throw new Error("media_delivery_not_direct_public");
   stage="public_media_verification";
   const full=await fetch(url,{signal:AbortSignal.timeout(30000)});
   if(full.status!==200||!full.headers.get("content-type")?.startsWith("audio/mpeg"))throw new Error("public_media_type_failed");
   const bytes=Buffer.from(await full.arrayBuffer());if(bytes.length!==source.sizeBytes||createHash("sha256").update(bytes).digest("hex")!==source.sha256)throw new Error("public_media_integrity_failed");
   const range=await fetch(url,{headers:{Range:"bytes=0-1023"},signal:AbortSignal.timeout(20000)});
   if(range.status!==206||(await range.arrayBuffer()).byteLength!==Math.min(1024,source.sizeBytes)||!range.headers.get("content-range")?.endsWith(`/${source.sizeBytes}`))throw new Error("public_media_range_failed");
   lineage.push({...asset,sha256:source.sha256,sizeBytes:source.sizeBytes,durationMs:source.durationMs,storageKey:key,publicUrl:url});
   source.storageKey=key;source.publicUrl=url;source.localFile="operator-private";
  }
  // Never persist raw source URLs, local paths or working transcripts in the runtime content.
  for(const item of content.items)item.review.privateSourceReference="operator-private-review";
  stage="database_insert";
  await c.query("INSERT INTO workshop_content(id,version,activity_id,grouping_version,pedagogy_version,digest,content_json,media_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,content.version,content.id,content.groupingVersion,content.pedagogyVersion,digest,JSON.stringify(content),JSON.stringify(lineage)]);
  stage="database_commit";
  await c.query("COMMIT");console.log(`Published one immutable ${content.version} workshop version with ${lineage.length} direct public recording objects.`);
 }catch(error){await c.query("ROLLBACK");const message=error instanceof Error?error.message:"",name=error instanceof Error?error.name:"UnknownError",safe=/^[A-Za-z0-9_-]{1,64}$/.test(message)?message:/^[A-Za-z][A-Za-z0-9]*$/.test(name)?name:"redacted";throw new Error(`workshop_import_failed_${stage}_${safe}`);}
 finally{c.release();await pool.end();}
}
// Keep raw validation/provider exceptions and private payloads out of logs.
main().catch((error:unknown)=>{const message=error instanceof Error?error.message:"",safe=/^workshop_import_failed_[A-Za-z0-9_-]+$/.test(message)?message:`workshop_import_failed_${stage}_${error instanceof Error?error.name:"UnknownError"}`;console.error(safe);process.exitCode=1;});
