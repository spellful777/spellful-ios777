/**
 * useCommunity — shared data hook for community pages.
 * Fetches categories, posts (with filter/page), and notification count.
 */
import { useState, useEffect, useCallback } from 'react';

export interface CommunityCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  postCount: number;
  isActive: boolean;
}

export interface CommunityPost {
  id: number;
  type: 'discussion' | 'question';
  title: string;
  tags: string | null;
  isPinned: boolean;
  isLocked: boolean;
  likeCount: number;
  replyCount: number;
  viewCount: number;
  acceptedReplyId: number | null;
  createdAt: string;
  categoryId: number;
  userId: string;
  authorName: string | null;
  authorImage: string | null;
  authorUsername: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  liked: boolean;
  bookmarked: boolean;
}

export type PostFilter = 'all' | 'latest' | 'popular' | 'unanswered' | 'following' | 'mine';

interface PostsResult {
  posts: CommunityPost[];
  total: number;
  page: number;
  pages: number;
}

export function useCommunityCategories() {
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/categories')
      .then((r) => r.ok ? r.json() : Promise.resolve([]))
      .then((data: CommunityCategory[]) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export function useCommunityPosts(filter: PostFilter, category?: string, page = 1) {
  const [result, setResult] = useState<PostsResult>({ posts: [], total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ filter, page: String(page), limit: '20' });
    if (category) params.set('category', category);
    fetch(`/api/community/posts?${params}`)
      .then((r) => r.ok ? r.json() : Promise.resolve({ posts: [], total: 0, page: 1, pages: 0 }))
      .then((data: PostsResult) => { if (Array.isArray(data?.posts)) setResult(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, category, page]);

  useEffect(() => { load(); }, [load]);

  return { ...result, loading, reload: load };
}

export function useCommunityNotifications() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/community/notifications?limit=1')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { unread?: number } | null) => { if (data?.unread) setUnread(data.unread); })
      .catch(() => {});
  }, []);

  return unread;
}
