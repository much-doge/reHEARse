import {describe,it,expect} from "vitest";
import {workshopGroups} from "./preparation";
import {preparationSchema} from "../../domain/workshop/content";
describe("source-independent preparation cards",()=>{
 it("contains five detailed bilingual cards mapped to the reviewed Longman Part A skills",()=>{
  expect(workshopGroups.map(g=>g.skill)).toEqual(["restatement","inference","negatives","functional-expressions","idioms"]);
  const skillRanges=["Skills 1–3","Skills 4–6","Skills 7–10","Skills 11–13","Skills 16–17"];
  for(const [index,group] of workshopGroups.entries()){
   expect(preparationSchema.safeParse(group.preparation).success).toBe(true);
   expect(group.preparation.procedure).toHaveLength(5);
   expect(group.preparation.distractorPatterns.length).toBeGreaterThanOrEqual(5);
   expect(group.preparation.longmanReference.en).toContain(skillRanges[index]);
   expect(group.preparation.longmanReference.en).toContain("Adapted from Longman");
   expect(group.preparation.languageNotes.length).toBeGreaterThanOrEqual(3);
   expect(group.preparation.extensionActivities).toHaveLength(3);
   expect("example" in group.preparation).toBe(false);
   expect(JSON.stringify(group.preparation)).not.toMatch(/\b(dialogue|question stem|transcript)\b/i);
   for(const value of [group.preparation.questionTask,group.preparation.listeningTarget,group.preparation.longmanReference,...group.preparation.procedure,...group.preparation.distractorPatterns,...group.preparation.languageNotes]){
    expect(value.en.length).toBeGreaterThan(20);expect(value.id.length).toBeGreaterThan(20);
   }
  }
 });
});
