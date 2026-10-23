/** Private authoring assembly only; no network and no publication. */
import { readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { workshopSchema } from "../src/domain/workshop/content";
import { workshopGroups } from "../src/adapters/workshop/preparation";
async function main(){
 const [itemsPath,output]=process.argv.slice(2);if(!itemsPath||!output)throw new Error("private paths required");
 if(!path.resolve(output).includes(`${path.sep}.secrets${path.sep}`))throw new Error("private output required");
 const items=JSON.parse(await readFile(itemsPath,"utf8"));
 const content=workshopSchema.parse({contractVersion:"part-a-workshop.v2",id:"short-conversation-workshop",version:"short-conversation-workshop-v2",title:{en:"Short-conversation workshop",id:"Lokakarya percakapan singkat"},groupingVersion:"longman-part-a-v1",pedagogyVersion:"audio-only-enrichment-v1",groups:workshopGroups,items:items.map((item:Record<string,unknown>)=>{const copy={...item};delete copy.prompt;delete copy.questionTask;return copy;})});
 await writeFile(output,JSON.stringify(content,null,2),{mode:0o600});await chmod(output,0o600);console.log("Validated private workshop package: 30 items, 5 groups; no publication.");
}
main().catch(()=>{console.error("Private workshop package validation failed; inspect private inputs without logging them.");process.exitCode=1;});
