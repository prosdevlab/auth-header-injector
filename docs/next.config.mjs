import nextra from 'nextra';

const withNextra = nextra({});

export default withNextra({
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    basePath: '/auth-header-injector', // GitHub Pages serves from /repo-name
  }),
  images: {
    unoptimized: true, // Required for static export
  },
  experimental: {
    optimizePackageImports: ['nextra-theme-docs'],
  },
});
