/**
 * /admin/community-admin — Community Admin Console
 * Manage forum settings, pin/unpin posts, and assign/remove local moderators
 * for forums the signed-in user administers.
 * Visible to admin+ roles.
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Navigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Globe, Users, Pin, PinOff, RefreshCw, Plus, Trash2, Shield,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/auth-client';
import { admin_community_admin } from 'virtual:content';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

interface Assignment {
  id: number;
  userId: string;
  forumSlug: string;
  role: string;
  createdAt: string;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
  assignedByName: string | null;
}

interface Post {
  id: number;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  createdAt: string;
  categoryId: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ago(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CommunityAdminConsolePage() {
  const { session, isPending } = useSession();

  const platformRole = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? 'member';
  const isAdmin = ['admin', 'owner'].includes(platformRole);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedForum, setSelectedForum] = useState<Category | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Assign moderator form
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<'moderator' | 'community_admin'>('moderator');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadCategories = useCallback(() => {
    setLoadingCats(true);
    fetch('/api/admin/community/categories', { credentials: 'include' })
      .then((r) => r.json() as Promise<{ categories: Category[] }>)
      .then((d) => { setCategories(d.categories ?? []); setLoadingCats(false); })
      .catch(() => setLoadingCats(false));
  }, []);

  const loadForumData = useCallback((forum: Category) => {
    setLoadingAssignments(true);
    setLoadingPosts(true);
    // Load assignments for this forum
    fetch(`/api/admin/moderator/assignments?forumSlug=${forum.slug}`, { credentials: 'include' })
      .then((r) => r.json() as Promise<{ assignments: Assignment[] }>)
      .then((d) => { setAssignments(d.assignments ?? []); setLoadingAssignments(false); })
      .catch(() => setLoadingAssignments(false));
    // Load pinned/recent posts for this forum
    fetch(`/api/community/posts?categorySlug=${forum.slug}&limit=20`, { credentials: 'include' })
      .then((r) => r.json() as Promise<{ posts: Post[] }>)
      .then((d) => { setPosts(d.posts ?? []); setLoadingPosts(false); })
      .catch(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    if (!isPending && isAdmin) loadCategories();
    else if (!isPending) setLoadingCats(false);
  }, [isPending, isAdmin, loadCategories]);

  function selectForum(cat: Category) {
    setSelectedForum(cat);
    setAssignments([]);
    setPosts([]);
    setMsg('');
    loadForumData(cat);
  }

  async function togglePin(post: Post) {
    setMsg('');
    const r = await fetch(`/api/admin/community/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    if (r.ok) {
      setMsg(`Post ${post.isPinned ? 'unpinned' : 'pinned'}.`);
      if (selectedForum) loadForumData(selectedForum);
    }
  }

  async function assignModerator() {
    if (!selectedForum || !assignUserId.trim()) return;
    setAssignLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/moderator/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: assignUserId.trim(), forumSlug: selectedForum.slug, role: assignRole }),
      });
      if (!r.ok) {
        const d = await r.json() as { error?: string };
        throw new Error(d.error ?? `${r.status}`);
      }
      setMsg('Moderator assigned.');
      setAssignUserId('');
      loadForumData(selectedForum);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setAssignLoading(false);
    }
  }

  async function removeAssignment(id: number) {
    setMsg('');
    const r = await fetch(`/api/admin/moderator/assignments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (r.ok) {
      setMsg('Assignment removed.');
      if (selectedForum) loadForumData(selectedForum);
    }
  }

  if (!isPending && !isAdmin) return <Navigate to="/account" replace />;

  return (
    <>
      <Helmet>
        <title>{admin_community_admin.meta.title}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={admin_community_admin.meta.description} />
      </Helmet>

      <main className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
            <Globe className="w-5 h-5" style={{ color: 'hsl(var(--secondary))' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Community Admin Console
            </h1>
            <p className="text-sm text-muted-foreground">Manage forums, moderators, and pinned content</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Forum list */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Forums</p>
            {loadingCats ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
            ) : (
              categories.map((cat) => (
                <button key={cat.id}
                  onClick={() => selectForum(cat)}
                  className="w-full text-left p-3 rounded-xl border transition-colors"
                  style={{
                    borderColor: selectedForum?.id === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: selectedForum?.id === cat.id ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
                  }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.slug}</p>
                    </div>
                    {!cat.isActive && (
                      <span className="text-xs text-muted-foreground">inactive</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Forum detail */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedForum ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-card text-center">
                <Globe className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select a forum to manage</p>
              </div>
            ) : (
              <>
                {msg && (
                  <p className="text-sm text-success">{msg}</p>
                )}

                {/* Moderator assignments */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                    <h2 className="text-sm font-semibold text-foreground">
                      Moderators — {selectedForum.name}
                    </h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {loadingAssignments ? (
                      <Skeleton className="h-12 w-full rounded-lg" />
                    ) : assignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No moderators assigned to this forum.</p>
                    ) : (
                      assignments.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                            {a.userImage
                              ? <img src={a.userImage} alt="" className="w-full h-full object-cover" />
                              : <Users className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {a.userName ?? a.userUsername ?? a.userId}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{a.role} · {ago(a.createdAt)}</p>
                          </div>
                          <Button size="sm" variant="ghost"
                            onClick={() => removeAssignment(a.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}

                    {/* Assign form */}
                    <div className="pt-2 border-t border-border space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Assign moderator by user ID</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="User ID (UUID)"
                          value={assignUserId}
                          onChange={(e) => setAssignUserId(e.target.value)}
                          className="bg-muted border-border text-sm flex-1"
                        />
                        <select
                          value={assignRole}
                          onChange={(e) => setAssignRole(e.target.value as 'moderator' | 'community_admin')}
                          className="px-2 py-1 rounded-md border border-border bg-muted text-sm text-foreground">
                          <option value="moderator">Moderator</option>
                          <option value="community_admin">Community Admin</option>
                        </select>
                        <Button size="sm" disabled={assignLoading || !assignUserId.trim()}
                          onClick={assignModerator}
                          className="bg-primary text-primary-foreground">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {assignLoading ? '…' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts — pin/unpin */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Pin className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                    <h2 className="text-sm font-semibold text-foreground">
                      Posts — {selectedForum.name}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => loadForumData(selectedForum)}
                      className="ml-auto text-muted-foreground">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {loadingPosts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3"><Skeleton className="h-8 w-full rounded" /></div>
                      ))
                    ) : posts.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">No posts in this forum</p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <motion.div key={post.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-3 p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{ago(post.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {post.isPinned && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary">Pinned</span>
                            )}
                            {post.isLocked && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-warning/15 text-warning">Locked</span>
                            )}
                            {post.isHidden && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">Hidden</span>
                            )}
                            <Button size="sm" variant="ghost"
                              onClick={() => togglePin(post)}
                              className="text-muted-foreground hover:text-foreground">
                              {post.isPinned
                                ? <PinOff className="w-3.5 h-3.5" />
                                : <Pin className="w-3.5 h-3.5" />
                              }
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
