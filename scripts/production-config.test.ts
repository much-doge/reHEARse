import { describe, expect, it } from "vitest";
// @ts-expect-error The standalone deployment guard intentionally runs without transpilation.
import { validateProductionConfig } from "./production-config.mjs";
const valid = { NODE_ENV: "production", POSTGRES_PASSWORD: "a".repeat(64), SESSION_SECRET: "b".repeat(96), SESSION_COOKIE_SECURE: "true", PUBLIC_APP_ORIGIN: "https://rehearse.najala.org", FEEDBACK_PROVIDER: "openai", OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-5-nano" };
describe("production startup guard", () => {
  it("accepts explicit production configuration", () => expect(() => validateProductionConfig(valid)).not.toThrow());
  it.each([{POSTGRES_PASSWORD:"listening"}, {SESSION_SECRET:"local-development-secret-change-before-deploying"}, {SESSION_COOKIE_SECURE:"false"}, {PUBLIC_APP_ORIGIN:"http://localhost:3000"}, {OPENAI_MODEL:""}, {OPENAI_API_KEY:""}])("refuses unsafe production configuration", (override) => expect(() => validateProductionConfig({...valid,...override})).toThrow());
});
