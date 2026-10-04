import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // The CLI checker emits unparsable captured output in this host runtime.
    // `pnpm typecheck` remains an explicit gate; the API checker also runs here.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
