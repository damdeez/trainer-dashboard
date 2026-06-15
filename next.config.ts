import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler auto-memoizes components/hooks, so we don't hand-write
  // useMemo/useCallback/memo. Next applies it only to files with JSX/hooks.
  reactCompiler: true,
};

export default nextConfig;
