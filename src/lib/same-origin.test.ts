import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "./same-origin";

describe("isSameOriginRequest", () => {
  it("accepts a browser origin that matches the request host", () => {
    const request = new Request("http://0.0.0.0:3000/api/attempts", {
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("uses the forwarded host when a reverse proxy supplies one", () => {
    const request = new Request("http://app:3000/api/attempts", {
      headers: {
        host: "app:3000",
        "x-forwarded-host": "listen.example.test",
        origin: "https://listen.example.test",
      },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects missing, malformed, and cross-site origins", () => {
    expect(isSameOriginRequest(new Request("http://app:3000/api/attempts"))).toBe(false);
    expect(isSameOriginRequest(new Request("http://app:3000/api/attempts", {
      headers: { host: "app:3000", origin: "not-a-url" },
    }))).toBe(false);
    expect(isSameOriginRequest(new Request("http://app:3000/api/attempts", {
      headers: { host: "app:3000", origin: "https://elsewhere.example" },
    }))).toBe(false);
  });
});

 it("requires the configured HTTPS origin despite forged forwarded hosts", () => {
   const configured = "https://rehearse.najala.org";
   expect(isSameOriginRequest(new Request("http://app:3000/api/attempts", {headers:{host:"app:3000",origin:configured}}),configured)).toBe(true);
   expect(isSameOriginRequest(new Request("http://app:3000/api/attempts", {headers:{host:"evil.test","x-forwarded-host":"evil.test",origin:"https://evil.test"}}),configured)).toBe(false);
   expect(isSameOriginRequest(new Request("http://app:3000/api/attempts", {headers:{host:"rehearse.najala.org",origin:"http://rehearse.najala.org"}}),configured)).toBe(false);
 });
