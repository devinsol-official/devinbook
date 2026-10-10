import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // If the API URL already ends with /api, we might need to strip it to get the raw domain for .well-known
    // But since the backend serves /.well-known, we should point there.
    const backendHost = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;

    return [
      {
        source: '/api/mcp',
        destination: `${apiBase}/mcp`,
      },
      {
        source: '/.well-known/oauth-authorization-server',
        destination: `${backendHost}/.well-known/oauth-authorization-server`,
      },
      {
        source: '/api/mcp/.well-known/oauth-authorization-server',
        destination: `${backendHost}/.well-known/oauth-authorization-server`,
      },
      {
        source: '/api/oauth/:path*',
        destination: `${apiBase}/oauth/:path*`,
      }
    ];
  },
};

export default withPWA(nextConfig);
