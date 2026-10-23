/** Operator-only import. Dry-run reads private files but uses no network/credentials. */
import { createHash,randomUUID,randomBytes } from "node:crypto";
import pg from "pg";
import { validatePrivatePackage } from "../src/adapters/workshop/import-validation";
import { S3CompatibleMediaStore } from "../src/adapters/media/s3-media-store";
import { readS3MediaConfig } from "../src/adapters/media/s3-config";
async function main(){
 const [manifest,mode]=process.argv.slice(2);if(!manifest||!["--dry-run","--publish"].includes(mode))throw new Error("manifest and explicit mode required");
 const content=await validatePrivatePackage(manifest),canonical=structuredClone(content);
 for(const item of canonical.items){item.media.localFile="operator-private";item.review.privateSourceReference="operator-private-review";}
 const digest=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 if(mode==="--dry-run"){console.log("PASS: 30 private items, skill groups, preparation, original option order, all local hashes/sizes/MP3 types/durations. No network or credentials used.");return;}
 if(process.env.ALLOW_WORKSHOP_IMPORT!=="true")throw new Error("explicit_operator_import_required");
 const config=readS3MediaConfig();if(config.deliveryMode!=="public"||!config.prefix||!config.publicBaseUrl)throw new Error("direct_public_media_required");
 const media=new S3CompatibleMediaStore(config),pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1}),c=await pool.connect();
 try{
  await c.query("BEGIN");await c.query("SELECT pg_advisory_xact_lock(817240223)");
  const exists=(await c.query("SELECT digest FROM workshop_content WHERE version=$1",[content.version])).rows[0];
  if(exists){if(exists.digest!==digest)throw new Error("immutable_version_conflict");await c.query("ROLLBACK");console.log("Identical immutable workshop version already published; no upload.");return;}
  const id=randomUUID(),lineage=[];
  for(const item of content.items){
   const key=`${config.prefix}/activities/${id}/workshop-v2/${randomBytes(16).toString("hex")}.mp3`;
   await media.uploadFile({path:item.media.localFile,storageKey:key,contentType:"audio/mpeg",sizeBytes:item.media.sizeBytes,sha256:item.media.sha256,activitySlug:content.id});
   const url=(await media.createDownloadUrl(key)).url,publicUrl=new URL(url),base=new URL(config.publicBaseUrl);
   if(publicUrl.protocol!=="https:"||publicUrl.origin!==base.origin||!publicUrl.pathname.startsWith(base.pathname.replace(/\/$/,"")+"/"))throw new Error("media_delivery_not_direct_public");
   const full=await fetch(url,{signal:AbortSignal.timeout(30000)});
   if(full.status!==200||!full.headers.get("content-type")?.startsWith("audio/mpeg"))throw new Error("public_media_type_failed");
   const bytes=Buffer.from(await full.arrayBuffer());if(bytes.length!==item.media.sizeBytes||createHash("sha256").update(bytes).digest("hex")!==item.media.sha256)throw new Error("public_media_integrity_failed");
   const range=await fetch(url,{headers:{Range:"bytes=0-1023"},signal:AbortSignal.timeout(20000)});
   if(range.status!==206||(await range.arrayBuffer()).byteLength!==Math.min(1024,item.media.sizeBytes)||!range.headers.get("content-range")?.endsWith(`/${item.media.sizeBytes}`))throw new Error("public_media_range_failed");
   lineage.push({itemId:item.id,sha256:item.media.sha256,sizeBytes:item.media.sizeBytes,durationMs:item.media.durationMs,storageKey:key,publicUrl:url});
   item.media.storageKey=key;item.media.publicUrl=url;item.media.localFile="operator-private";
  }
  // Never persist raw source URLs, local paths or working transcripts in the runtime content.
  for(const item of content.items)item.review.privateSourceReference="operator-private-review";
  await c.query("INSERT INTO workshop_content(id,version,activity_id,grouping_version,pedagogy_version,digest,content_json,media_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,content.version,content.id,content.groupingVersion,content.pedagogyVersion,digest,JSON.stringify(content),JSON.stringify(lineage)]);
  await c.query("COMMIT");console.log("Published one immutable workshop version with 30 direct public recording objects.");
 }catch{await c.query("ROLLBACK");throw new Error("workshop_import_failed_unpublished_objects_may_require_reconciliation");}
 finally{c.release();await pool.end();}
}
// Keep raw validation/provider exceptions and private payloads out of logs.
main().catch(()=>{console.error("Workshop import did not publish; inspect private inputs/configuration without logging source or credentials.");process.exitCode=1;});
