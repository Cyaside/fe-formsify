import type { NextConfig } from "next";

const unwrapEnvString = (value?: string) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const normalizeBaseUrl = (value?: string) => unwrapEnvString(value)?.replace(/\/+$/, "");

const assertNoSensitivePublicEnv = () => {
  const allowedPublicKeys = new Set(["NEXT_PUBLIC_API_BASE_URL"]);
  const sensitivePublicKeys = Object.keys(process.env).filter((key) => {
    if (!key.startsWith("NEXT_PUBLIC_")) return false;
    if (allowedPublicKeys.has(key)) return false;
    return /(SECRET|PASSWORD|PRIVATE|TOKEN|API_KEY)/i.test(key);
  });

  if (sensitivePublicKeys.length > 0) {
    throw new Error(
      `Sensitive env vars must not be exposed to the client: ${sensitivePublicKeys.join(", ")}`,
    );
  }
};

assertNoSensitivePublicEnv();

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (!apiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
