import {describe,it,expect} from "vitest";
import {workshopGroups} from "./preparation";
import {preparationSchema} from "../../domain/workshop/content";
describe("source-independent preparation cards",()=>{
 it("contains five substantive bilingual cards with Longman references and optional extension activities",()=>{
  expect(workshopGroups.map(g=>g.skill)).toEqual(["restatement","inference","negatives","functional-expressions","idioms"]);
  for(const group of workshopGroups){expect(preparationSchema.safeParse(group.preparation).success).toBe(true);expect(group.preparation.procedure.length).toBeGreaterThanOrEqual(3);expect(group.preparation.longmanReference.en).toContain("Skills");expect(group.preparation.extensionActivities).toHaveLength(3);expect("example" in group.preparation).toBe(false);}
 });
});
