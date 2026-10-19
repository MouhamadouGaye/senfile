// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   output: "standalone", // build minimal auto-suffisant, idéal pour une image Docker légère
//   images: {
//     remotePatterns: [{ protocol: "https", hostname: "0.0.0.0" }],
//   },
// };

// module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.avecsonko.org",
      },
    ],
  },
};

module.exports = nextConfig;
