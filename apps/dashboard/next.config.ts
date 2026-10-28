import type { NextConfig } from 'next';
const config: NextConfig = {
  transpilePackages: ['@gluons/runtime'],
  serverExternalPackages: ['twilio'],
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
