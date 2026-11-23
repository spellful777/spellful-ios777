import { Helmet } from '@dr.pogodin/react-helmet';
import { SeoGuideShell, SeoGuideCtaButton } from '@/components/SeoGuideTemplate';
import { seo_guide_sun_moon_rising } from 'virtual:content';
import { ContentListContext } from '@airo/content';

const SLUG = 'sun-moon-rising-signs-explained';
const CANONICAL = 'https://spellful.com/seo-guides/sun-moon-rising-signs-explained/';
const SITE_URL = 'https://spellful.com';
const ARTICLE_TITLE = "Sun, Moon, and Rising Signs Explained | Spellful";
const ARTICLE_DESCRIPTION = "Understand what the big three mean in astrology, how they differ, and why an accurate birth time matters.";
const ARTICLE_JSON_LD = `{"@context":"https://schema.org","@type":"Article","@id":"https://spellful.com/seo-guides/sun-moon-rising-signs-explained/#article","headline":"Sun, Moon, and Rising Signs Explained","description":"Understand what the big three mean in astrology, how they differ, and why an accurate birth time matters.","url":"https://spellful.com/seo-guides/sun-moon-rising-signs-explained/","datePublished":"2026-11-20","dateModified":"2026-11-20","author":{"@type":"Organization","name":"Spellful","url":"https://spellful.com"},"publisher":{"@type":"Organization","name":"Spellful","url":"https://spellful.com","logo":{"@type":"ImageObject","url":"https://spellful.com/airo-assets/images/logo/horizontal"}},"isPartOf":{"@id":"https://spellful.com/#website"}}`;

export default function SunMoonRisingSignsPage() {
  return (
    <>
      <Helmet>
        <title>{ARTICLE_TITLE}</title>
        <meta name="description" content={ARTICLE_DESCRIPTION} />
        <meta property="og:title" content={ARTICLE_TITLE} />
        <meta property="og:description" content={ARTICLE_DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={`${SITE_URL}/airo-assets/images/pages/og-image`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ARTICLE_TITLE} />
        <meta name="twitter:description" content={ARTICLE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/airo-assets/images/pages/og-image`} />
        <script type="application/ld+json">{ARTICLE_JSON_LD}</script>
      </Helmet>
      <SeoGuideShell canonicalUrl={CANONICAL} slug={SLUG}>
        <div className="spellful-seo-guide__hero">
          <p className="spellful-seo-guide__eyebrow">THE SPELLFUL GUIDEBOOK</p>
          <h1 className="spellful-seo-guide__h1" id="article-h1">{seo_guide_sun_moon_rising.h1}</h1>
        </div>
        <article className="spellful-seo-guide__article" aria-labelledby="article-h1">
          <p className="spellful-seo-guide__intro">{seo_guide_sun_moon_rising.intro}</p>
          <SeoGuideCtaButton position="intro" slug={SLUG} />
          <hr className="spellful-seo-guide__sep" aria-hidden="true" />
          <ContentListContext field="seo_guide_sun_moon_rising.sections">
            {seo_guide_sun_moon_rising.sections.map((section) => (
              <section key={section.id}>
                <h2 className="spellful-seo-guide__section-heading">{section.heading}</h2>
                <p className="spellful-seo-guide__section-body">{section.body}</p>
              </section>
            ))}
          </ContentListContext>
        </article>
      </SeoGuideShell>
    </>
  );
}