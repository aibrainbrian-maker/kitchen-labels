import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The label PDF generator reads TrueType fonts from public/fonts at runtime.
  // On serverless hosts (Vercel) static public/ files aren't on the function
  // filesystem unless explicitly traced into the bundle, so include them for
  // the PDF route (and anything else that renders labels server-side).
  outputFileTracingIncludes: {
    "/api/print/[runId]/pdf": ["./public/fonts/**/*"],
    "/products/[id]/preview": ["./public/fonts/**/*"],
    "/labels/template": ["./public/fonts/**/*"],
  },
};

export default nextConfig;
