import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata = {
  title: {
    default: 'Auth HI!',
    template: '%s | Auth HI!',
  },
  description:
    'Chrome extension for injecting authentication headers into requests. Say hi to hassle-free auth headers.',
};

const logo = (
  <span style={{ fontWeight: 'bold' }}>
    <span style={{ color: '#7c3aed' }}>Auth</span> <span style={{ color: '#10b981' }}>HI!</span>
  </span>
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap();

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="🔐" />
      <body>
        <Layout
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/prosdevlab/auth-header-injector/tree/main/docs/content"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          navbar={
            <Navbar logo={logo} projectLink="https://github.com/prosdevlab/auth-header-injector" />
          }
          footer={<Footer>MIT {new Date().getFullYear()} © prosdevlab</Footer>}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
