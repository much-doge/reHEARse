import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    const privateNoStore = [
      { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
      { key: "Pragma", value: "no-cache" },
      { key: "Vary", value: "Cookie" },
    ];
    return [
      ...["/dashboard", "/test-center", "/legacy"]
        .map((source) => ({ source, headers: privateNoStore })),
      ...["/dashboard/:path*", "/test-center/:path*", "/legacy/:path*"]
        .map((source) => ({ source, headers: privateNoStore })),
      { source: "/api/:path*", headers: privateNoStore },
    ];
  },
  experimental: {
    // The CLI checker emits unparsable captured output in this host runtime.
    // `pnpm typecheck` remains an explicit gate; the API checker also runs here.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
