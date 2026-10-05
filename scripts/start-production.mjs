import { validateProductionConfig } from "./production-config.mjs";
validateProductionConfig();
await import("../server.js");
