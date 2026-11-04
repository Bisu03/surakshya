import createPWA from "next-pwa";

const withPWA = createPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
});

const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["nodemailer"],
  // ESLint is run explicitly because Next 15 cannot serialize this project's
  // ESLint 9 flat-config parser during `next build`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
