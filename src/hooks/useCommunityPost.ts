/**
 * Community post & reply types, plus data hooks for the thread page.
 */
import { useState, useEffect, useCallback } from 'react';

export interface CommunityPoll {
  id: number;
  postId: number;
  question: string;
  choices: string[];
  closeAt: string | null;
  tallies: number[];
  totalVotes: number;
  myVote: number | null;
}

export interface CommunityReply {
  id: number;
  postId: number;
  parentId: number | null;
  body: string;
  likeCount: number;
  depth: number | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  authorName: string | null;
  authorImage: string | null;
  authorUsername: string | null;
  authorLocation: string | null;
  liked: boolean;
}

export interface CommunityPostDetail {
  id: number;
  type: 'discussion' | 'question';
  title: string;
  body: string;
  imageUrl: string | null;
  tags: string | null;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  acceptedReplyId: number | null;
  likeCount: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId: number;
  authorName: string | null;
  authorImage: string | null;
  authorUsername: string | null;
  authorLocation: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  poll: CommunityPoll | null;
  liked: boolean;
  bookmarked: boolean;
  muted: boolean;
}

export function usePostDetail(postId: number | null) {
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/community/posts/${postId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: CommunityPostDetail) => setPost(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { load(); }, [load]);
  return { post, loading, error, reload: load, setPost };
}

export function useReplies(postId: number | null, sort: 'chrono' | 'liked' = 'chrono') {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!postId) return;
    setLoading(true);
    fetch(`/api/community/posts/${postId}/replies?sort=${sort}`)
      .then((r) => r.ok ? r.json() : Promise.resolve([]))
      .then((data: CommunityReply[]) => { if (Array.isArray(data)) setReplies(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, sort]);

  useEffect(() => { load(); }, [load]);
  return { replies, loading, reload: load, setReplies };
}
