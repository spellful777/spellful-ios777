import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactElement } from 'react';
import { ScrollRestoration } from 'react-router';
import { useSession } from '@/lib/auth/auth-client';

import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import Website from '@/layouts/Website';
import Breadcrumbs from '@/components/Breadcrumbs';
import BackToTop from '@/components/BackToTop';
import RecentlyVisited, { useRecentPages } from '@/components/RecentlyVisited';
import SolarReturnModal from '@/components/SolarReturnModal';

/**
 * Root layout component that wraps all pages with consistent header and footer.
 *
 * To customize the header or footer, directly edit the Header.tsx and Footer.tsx
 * files in the layouts/parts directory.
 *
 * Site-wide <title> and <meta> live in the <Helmet> below. Individual pages can
 * override them by rendering their own <Helmet> — last-mounted wins.
 */
interface RootLayoutProps {
  children: ReactElement;
}

function RootLayoutInner({ children }: RootLayoutProps) {
  useRecentPages();
  const { session, isPending } = useSession();
  // On mobile, the header hides itself when logged in (hidden md:block).
  // Only apply top padding when the header is actually visible.
  const headerVisibleOnMobile = isPending || !session;
  return (
    <Website>
      <Helmet>
        <title>Spellful — Witchcraft, Tarot &amp; Intuitive Resources</title>
        <meta name="description" content="Spellful is your sacred space for witchcraft wisdom, tarot readings, moon rituals, birth charts, spells, and the Spellful Academy — free guided lessons in astrology, tarot, numerology, and more." />
        {/* Site-wide social defaults — individual pages override with their own <Helmet> */}
        <meta property="og:site_name" content="Spellful" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Spellful — Witchcraft, Tarot &amp; Intuitive Resources" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@spellful" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Spellful — Witchcraft, Tarot &amp; Intuitive Resources" />
      </Helmet>
      <ScrollRestoration />
      <Header />
      {/* pt-16 md:pt-20 clears the fixed header (h-16 mobile / h-20 desktop).
          When logged in on mobile the header hides itself, so no top padding needed there.
          pb-16 on mobile so the fixed bottom nav never covers page content */}
      <div className={`${headerVisibleOnMobile ? 'pt-16' : ''} md:pt-20 pb-16 md:pb-0`}>
        <Breadcrumbs />
        {children}
      </div>
      <Footer />
      <MobileBottomNav />
      <BackToTop />
      <RecentlyVisited />
      <SolarReturnModal />
    </Website>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <RootLayoutInner>{children}</RootLayoutInner>;
}
