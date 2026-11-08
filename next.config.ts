import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/test-center/diagnostic/*": [
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/pages/**/*",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/practice-test-a-listening.m4a",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/package-manifest.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/answer-key-practice-test-a-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/instructions-practice-test-a-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/listening-pauses-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/listening-question-map-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/page-index-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/score-conversion-practice-test-a-v1.json",
    ],
    "/api/test-center/diagnostic/**/*": [
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/pages/**/*",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/practice-test-a-listening.m4a",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/package-manifest.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/answer-key-practice-test-a-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/instructions-practice-test-a-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/listening-pauses-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/listening-question-map-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/page-index-v1.json",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/score-conversion-practice-test-a-v1.json",
    ],
  },
  outputFileTracingExcludes: {
    "/test-center/diagnostic/*": [
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/ets-toefl-itp-volume-3.pdf",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/ets-toefl-itp-volume-3-layout.txt",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/page-texts-v1.json",
    ],
    "/api/test-center/diagnostic/**/*": [
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/ets-toefl-itp-volume-3.pdf",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/source/ets-toefl-itp-volume-3-layout.txt",
      "./apps/protefl-center/content/ets-volume3-practice-test-a-v1/metadata/page-texts-v1.json",
    ],
  },
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
