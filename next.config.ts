import type { NextConfig } from "next";
import { diagnosticPackageCodes, diagnosticPackage } from "./apps/protefl-center/src/application/diagnostic-package";

const registeredDiagnosticPackages = diagnosticPackageCodes()
  .map((code) => diagnosticPackage(code))
  .filter((descriptor): descriptor is NonNullable<typeof descriptor> => Boolean(descriptor));
const diagnosticPackageAssets = registeredDiagnosticPackages.flatMap((descriptor) =>
  Object.values(descriptor.files).map((file) => `./apps/protefl-center/content/${descriptor.directory}/${file}`),
);
const diagnosticPrivateSourceFiles = registeredDiagnosticPackages.flatMap((descriptor) =>
  descriptor.privateSourceFiles.map((file) => `./apps/protefl-center/content/${descriptor.directory}/${file}`),
);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/test-center/diagnostic/*": diagnosticPackageAssets,
    "/api/test-center/diagnostic/**/*": diagnosticPackageAssets,
  },
  outputFileTracingExcludes: {
    "/test-center/diagnostic/*": diagnosticPrivateSourceFiles,
    "/api/test-center/diagnostic/**/*": diagnosticPrivateSourceFiles,
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
