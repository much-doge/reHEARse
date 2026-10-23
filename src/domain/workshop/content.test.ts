import {describe,it,expect} from "vitest";
import {workshopSchema} from "./content";
import {fixture,partBcFixture} from "./fixture.test-support";
describe("immutable thirty-item workshop input",()=>{
 it("requires thirty reviewed unique clips, valid skill groups and four options",()=>{
  expect(workshopSchema.safeParse(fixture()).success).toBe(true);
  const content=fixture();content.items.pop();expect(workshopSchema.safeParse(content).success).toBe(false);
  const duplicate=fixture();duplicate.items[1].media.sha256=duplicate.items[0].media.sha256;expect(workshopSchema.safeParse(duplicate).success).toBe(false);
  const group=fixture();group.items[0].groupId="not-present";expect(workshopSchema.safeParse(group).success).toBe(false);
  const wrong=fixture();wrong.items[0].primarySkill="idioms";expect(workshopSchema.safeParse(wrong).success).toBe(false);
 });
 it("rejects unreviewed inputs and missing item-specific pedagogy",()=>{
  const content=fixture();const draft=structuredClone(content) as unknown as {items:Array<{review:{verified:boolean}}>};draft.items[0].review.verified=false;expect(workshopSchema.safeParse(draft).success).toBe(false);
  content.items[0].tips[1].id="";expect(workshopSchema.safeParse(content).success).toBe(false);
  const prep=fixture();prep.groups[0].preparation.inquiryPrompts.pop();expect(workshopSchema.safeParse(prep).success).toBe(false);
 });
});
describe("Part B/C workshop source contract",()=>{
 it("accepts five passage groups and the original 31–50 question sequence",()=>{
  const content=partBcFixture();expect(content.items).toHaveLength(20);expect(content.groups).toHaveLength(5);
  expect(workshopSchema.safeParse(content).success).toBe(true);
 });
 it("rejects a written stem, altered numbering, or a missing shared passage",()=>{
  const stem=structuredClone(partBcFixture());stem.items[0].prompt={en:"private stem",id:"private stem"};expect(workshopSchema.safeParse(stem).success).toBe(false);
  const order=structuredClone(partBcFixture());order.items[0].questionNumber=32;expect(workshopSchema.safeParse(order).success).toBe(false);
  const media=structuredClone(partBcFixture());delete media.groups[0].passageMedia;expect(workshopSchema.safeParse(media).success).toBe(false);
 });
});
