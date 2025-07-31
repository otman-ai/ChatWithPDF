// next.config.ts
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import rehypePrettyCode from 'rehype-pretty-code';

const withMDX = createMDX({
  extension: /\.mdx?$/,

  options: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'one-dark-pro',
          },
          tokensMap: {
            fn: 'entity.name.function',
            variable: 'variable.other',
          },
          keepBackground: false,
        },
      ],
    ],
  },
});

const nextConfig = {
  experimental: {
    appDir: true,
    mdxRs: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withMDX(nextConfig);
