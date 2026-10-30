import type { NextConfig } from 'next';
const config: NextConfig = {
  transpilePackages: ['@gluons/runtime'],
  serverExternalPackages: ['twilio', 'tesseract.js', 'tesseract.js-core', '@tesseract.js-data/eng'],
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
