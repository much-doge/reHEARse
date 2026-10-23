/** Sanitized original test-only content, never a classroom publication. */
import { workshopSchema, type WorkshopContent } from "./content";
export const t=(en:string)=>({en,id:`ID ${en}`});
export function fixture():WorkshopContent {
 const preparation={questionTask:t("Identify the intended meaning."),listeningTarget:t("Track the contrast between the two statements."),procedure:[t("Identify the speaker."),t("Compare meaning rather than repeated words.")],distractorPatterns:[t("An option reverses the action."),t("An option changes the speaker.")],example:{dialogue:t("A: Is the room free? B: It is booked until noon."),question:t("When can they use the room?"),discussion:t("The booking ends at noon.")},inquiryPrompts:[t("Who is acting?"),t("What changes?")] as [ReturnType<typeof t>,ReturnType<typeof t>],languageNotes:[]};
 return{contractVersion:"part-a-workshop.v1",id:"sample-workshop",version:"sample-workshop-v1",title:t("Sample workshop"),groupingVersion:"sample-groups-v1",pedagogyVersion:"sample-guide-v1",
 groups:[{id:"meaning-group",title:t("Compare meanings"),skill:"restatement",preparation},{id:"inference-group",title:t("Infer meaning"),skill:"inference",preparation}],
 items:Array.from({length:30},(_,index)=>({id:`sample-item-${index}`,title:t(`Clip ${index+1}`),groupId:index<15?"meaning-group":"inference-group",primarySkill:index<15?"restatement":"inference",secondarySkills:[],questionTask:t("Identify the meaning."),prompt:t("What does the speaker mean?"),options:["The room is booked.","The room is empty.","The room is locked.","The room is upstairs."],answer:"A",tips:[t("Track when the booking ends."),t("Compare being occupied with being locked.")],guidedComparison:t("The booking concerns use of the room, not its location."),media:{localFile:`sample-${index}.mp3`,durationMs:100,sizeBytes:100,sha256:index.toString(16).padStart(64,"0"),contentType:"audio/mpeg",publicUrl:`https://media.example.invalid/sample-${index}.mp3`},review:{verified:true,decisiveEvidence:"Original test fixture, room booked until noon.",optionReasons:["It preserves the booking.","It reverses the booking.","It adds a lock.","It changes location."],privateSourceReference:"sanitized original fixture"}}))};
}

export function partBcFixture():WorkshopContent {
 const base=fixture();
 const preparation={questionTask:t("Follow the talk and its details."),listeningTarget:t("Take short notes on paper."),procedure:[t("Predict the topic."),t("Track answers in order.")],
  distractorPatterns:[t("An option changes who acted."),t("An option changes the sequence.")],longmanReference:t("Apply Longman Skills 18–27."),
  extensionActivities:["cold-replay","focus-replay","delayed-replay"].map(id=>({id,title:t(`${id} activity`),instruction:t("Replay and compare the choices.")})),
  inquiryPrompts:[t("What is the main point?"),t("Which detail supports it?")] as [ReturnType<typeof t>,ReturnType<typeof t>],languageNotes:[]};
 const definitions=[
  ["dance-group","Dance interview","long-conversation",3],
  ["apartment-group","Apartment conversation","long-conversation",4],
  ["speech-group","Speaking lecture","academic-talk",5],
  ["mail-group","Mail history talk","academic-talk",4],
  ["astronomy-group","Astronomy talk","academic-talk",4],
 ] as const;
 const groups=definitions.map(([id,title,skill],index)=>({id,title:t(title),skill,preparation,
  passageMedia:{localFile:`passage-${index}.mp3`,durationMs:1000,sizeBytes:100,sha256:(index+40).toString(16).padStart(64,"0"),contentType:"audio/mpeg" as const,publicUrl:`https://media.example.invalid/passage-${index}.mp3`}}));
 let cursor=0;
 const items=definitions.flatMap((definition)=>Array.from({length:definition[3]},()=>{
  const groupId=definition[0],item=structuredClone(base.items[cursor]);
  item.id=`question-${cursor+31}`;item.title=t(`Question ${cursor+31}`);item.groupId=groupId;item.primarySkill=["main-idea","speaker-purpose","supported-detail","sequence","vocabulary-in-context"][cursor%5] as typeof item.primarySkill;
  delete item.prompt;delete item.questionTask;item.questionNumber=cursor+31;cursor++;return item;
 }));
 return workshopSchema.parse({contractVersion:"part-bc-workshop.v1",id:"sample-part-bc",version:"sample-part-bc-v1",title:t("Sample Parts B and C"),groupingVersion:"dialogue-order-v1",pedagogyVersion:"paper-notes-v1",groups,items});
}
