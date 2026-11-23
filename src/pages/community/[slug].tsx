import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  ArrowLeft, PenLine, MessageSquare, ThumbsUp, Eye,
  HelpCircle, Pin, Lock, Sparkles, ChevronRight,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { community_category } from 'virtual:content';
import { useCommunityCategories, useCommunityPosts, type PostFilter } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const FILTERS: { value: PostFilter; label: string }[] = [
  { value: 'latest',     label: community_category.filters.latest },
  { value: 'popular',    label: community_category.filters.popular },
  { value: 'unanswered', label: community_category.filters.unanswered },
];

function PostRow({ post }: { post: ReturnType<typeof useCommunityPosts>['posts'][number] }) {
  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const ago = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' as const }}
    >
      <Link
        to={`/community/post/${post.id}`}
        className="group flex items-start gap-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-[hsl(var(--card-mid))] transition-colors p-4"
      >
        {/* Avatar — links to profile */}
        <Link
          to={post.authorUsername ? `/u/${post.authorUsername}` : '#'}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-0.5"
        >
          {post.authorImage ? (
            <img src={post.authorImage} alt={post.authorName ?? ''} className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-primary/50 transition-all" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground hover:ring-2 hover:ring-primary/50 transition-all">
              {(post.authorName ?? '?')[0].toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mb-1">
            <Link
              to={post.authorUsername ? `/u/${post.authorUsername}` : '#'}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-foreground/70 hover:text-primary transition-colors"
            >{post.authorName ?? 'Unknown'}</Link>
            <span>·</span>
            <span>{ago}</span>
            {post.isPinned && <Pin className="w-3 h-3 text-primary" />}
            {post.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>

          {/* Title */}
          <div className="flex items-start gap-2">
            {post.type === 'question' && (
              <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            )}
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {post.title}
            </h3>
            {post.acceptedReplyId && (
              <Badge variant="outline" className="shrink-0 text-[10px] border-[hsl(var(--success))] text-[hsl(var(--success))] px-1.5 py-0">
                Solved
              </Badge>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likeCount}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.replyCount}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount}</span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
      </Link>
    </motion.div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PostFilter>('latest');
  const [page, setPage] = useState(1);

  const { categories, loading: catsLoading } = useCommunityCategories();
  const category = categories.find((c) => c.slug === slug);
  const { posts, total, pages, loading: postsLoading } = useCommunityPosts(filter, slug, page);

  if (!isPending && !session) {
    navigate('/login?redirect=/community');
    return null;
  }

  const handleFilter = (f: PostFilter) => { setFilter(f); setPage(1); };

  const title = category ? `${category.name} — Spellful Community` : 'Category — Spellful Community';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={category?.description ?? 'Browse community discussions.'} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen">
        {/* Header */}
        <section className="border-b border-border bg-[hsl(var(--card-deep))]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/community" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> {community_category.backLabel}
            </Link>

            {catsLoading ? (
              <Skeleton className="h-10 w-64" />
            ) : category ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
              >
                <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-1">{category.name}</h1>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{total} discussion{total !== 1 ? 's' : ''}</p>
              </motion.div>
            ) : (
              <h1 className="font-heading text-2xl text-foreground">Category not found</h1>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link to="/community/new">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <PenLine className="w-3.5 h-3.5" /> {community_category.newDiscussionLabel}
              </Button>
            </Link>
          </div>

          {/* Post list */}
          {postsLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{community_category.emptyText}</p>
              <Link to="/community/new">
                <Button size="sm" variant="outline" className="gap-2 mt-4">
                  <PenLine className="w-3.5 h-3.5" /> {community_category.startFirstLabel}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => <PostRow key={post.id} post={post} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
