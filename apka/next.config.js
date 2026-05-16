/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js not to bundle these Node.js-only packages.
  // pdf-parse uses require() internally and must run as a native Node module.
  serverExternalPackages: ['pdf-parse', 'mammoth'],
}

module.exports = nextConfig
