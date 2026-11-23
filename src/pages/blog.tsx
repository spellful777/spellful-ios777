import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { blog } from 'virtual:content';

const POST_IMAGES: Record<string, string> = {
  '1': '/airo-assets/images/pages/blog/post-moon-ritual',
  '2': '/airo-assets/images/pages/blog/post-tarot',
  '3': '/airo-assets/images/pages/blog/post-herbalism',
  '4': '/airo-assets/images/pages/blog/post-shadow-work',
  '5': '/airo-assets/images/pages/blog/post-crystals',
  '6': '/airo-assets/images/pages/home/resource-spells',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Moon Magic': 'hsl(var(--accent))',
  'Tarot': 'hsl(var(--primary))',
  'Herbalism': 'hsl(var(--astro-taurus))',
  'Sabbats': 'hsl(var(--primary))',
  'Shadow Work': 'hsl(var(--accent))',
  'Crystals': 'hsl(var(--accent))',
  'Spells': 'hsl(var(--primary))',
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const siteUrl = 'https://spellful.com';
  const pageUrl = `${siteUrl}/blog`;



  return (
    <>
      <Helmet>
        <title>The Grimoire — Witchcraft Writings | Spellful</title>
        <meta name="description" content="Writings on the old ways — moon magic, shadow work, herbalism, tarot, and the sacred rhythms that bind us to the earth." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="The Grimoire — Witchcraft Writings | Spellful" />
        <meta property="og:description" content="Writings on the old ways — moon magic, shadow work, herbalism, tarot, and the sacred rhythms that bind us to the earth." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{`{"@context":"https://schema.org","@type":"Blog","@id":"${pageUrl}#webpage","name":"The Grimoire — Spellful","url":"${pageUrl}","isPartOf":{"@id":"${siteUrl}/#website"},"about":{"@id":"${siteUrl}/#organization"}}`}</script>
      </Helmet>

      <main>
        {/* HERO */}
        <section className="relative min-h-[60vh] flex items-end overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/airo-assets/images/pages/blog/hero"
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: 0.4 }}
              loading="eager"
              fetchPriority="high"
              width={1920}
              height={800}
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, hsl(var(--background) / 0.2) 0%, hsl(var(--background) / 0.6) 60%, hsl(var(--background) / 1) 100%)' }} />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 pb-16 pt-40">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {blog.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {blog.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg max-w-2xl leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {blog.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* FEATURED POST */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <div className="relative h-[420px] md:h-[520px]">
                <img
                  src="/airo-assets/images/pages/blog/post-moon-ritual"
                  alt={blog.featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  width={1200}
                  height={520}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.6) 50%, hsl(var(--background) / 0.1) 100%)' }} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em' }}>
                    {blog.featured.tag}
                  </span>
                  <span className="text-xs" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                    {blog.featured.category}
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {blog.featured.title}
                </h2>
                <p className="text-base md:text-lg mb-6 max-w-2xl leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {blog.featured.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  <span>{blog.featured.author}</span>
                  <span style={{ color: 'hsl(var(--border))' }}>·</span>
                  <span>{blog.featured.date}</span>
                  <span style={{ color: 'hsl(var(--border))' }}>·</span>
                  <span>{blog.featured.readTime}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <section style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10 pb-10">
            <div className="flex flex-wrap gap-3" role="group" aria-label="Filter by category">
              {blog.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className="text-xs px-4 py-2 rounded-full transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.08em',
                    background: activeCategory === cat.name ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    color: activeCategory === cat.name ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${activeCategory === cat.name ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* POST GRID */}
        <section className="pb-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
              {blog.posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group cursor-pointer rounded-xl overflow-hidden flex flex-col"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    display: activeCategory === 'All' || activeCategory === post.category ? 'flex' : 'none',
                  }}
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={POST_IMAGES[post.id] ?? '/airo-assets/images/pages/blog/hero'}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      width={600}
                      height={208}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'hsl(var(--background) / 0.3)' }} />
                    <span
                      className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full"
                      style={{ background: 'hsl(var(--background) / 0.85)', color: CATEGORY_COLORS[post.category] ?? 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
                    >
                      {post.tag}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-xs mb-2" style={{ color: CATEGORY_COLORS[post.category] ?? 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em' }}>
                      {post.category}
                    </p>
                    <h3 className="text-xl mb-3 leading-snug group-hover:opacity-80 transition-opacity" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs pt-4" style={{ borderTop: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
