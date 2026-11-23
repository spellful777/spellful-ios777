import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth/auth-client';

interface LessonProgress {
  topicSlug: string;
  lessonSlug: string;
  completed: boolean;
  quizScore: number | null;
}

interface Bookmark {
  topicSlug: string;
  lessonSlug: string;
}

interface AcademyState {
  progress: LessonProgress[];
  bookmarks: Bookmark[];
  loading: boolean;
}

export function useAcademy() {
  const { data: sessionData } = authClient.useSession();
  const [state, setState] = useState<AcademyState>({ progress: [], bookmarks: [], loading: true });

  useEffect(() => {
    if (!sessionData?.session) {
      setState({ progress: [], bookmarks: [], loading: false });
      return;
    }
    fetch('/api/academy/progress')
      .then((r) => r.json())
      .then((data: { progress: LessonProgress[]; bookmarks: Bookmark[] }) => {
        setState({ progress: data.progress ?? [], bookmarks: data.bookmarks ?? [], loading: false });
      })
      .catch(() => setState({ progress: [], bookmarks: [], loading: false }));
  }, [sessionData?.session]);

  const markViewed = useCallback(async (topicSlug: string, lessonSlug: string) => {
    if (!sessionData?.session) return;
    await fetch('/api/academy/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicSlug, lessonSlug, completed: false }),
    });
  }, [sessionData?.session]);

  const markComplete = useCallback(async (topicSlug: string, lessonSlug: string, quizScore?: number) => {
    if (!sessionData?.session) return;
    await fetch('/api/academy/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicSlug, lessonSlug, completed: true, quizScore }),
    });
    setState((prev) => {
      const existing = prev.progress.find((p) => p.topicSlug === topicSlug && p.lessonSlug === lessonSlug);
      if (existing) {
        return { ...prev, progress: prev.progress.map((p) => p.topicSlug === topicSlug && p.lessonSlug === lessonSlug ? { ...p, completed: true, quizScore: quizScore ?? p.quizScore } : p) };
      }
      return { ...prev, progress: [...prev.progress, { topicSlug, lessonSlug, completed: true, quizScore: quizScore ?? null }] };
    });
  }, [sessionData?.session]);

  const toggleBookmark = useCallback(async (topicSlug: string, lessonSlug: string) => {
    if (!sessionData?.session) return;
    const isBookmarked = state.bookmarks.some((b) => b.topicSlug === topicSlug && b.lessonSlug === lessonSlug);
    const action = isBookmarked ? 'remove' : 'add';
    await fetch('/api/academy/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicSlug, lessonSlug, action }),
    });
    setState((prev) => ({
      ...prev,
      bookmarks: action === 'add'
        ? [...prev.bookmarks, { topicSlug, lessonSlug }]
        : prev.bookmarks.filter((b) => !(b.topicSlug === topicSlug && b.lessonSlug === lessonSlug)),
    }));
  }, [sessionData?.session, state.bookmarks]);

  const isCompleted = (topicSlug: string, lessonSlug: string) =>
    state.progress.some((p) => p.topicSlug === topicSlug && p.lessonSlug === lessonSlug && p.completed);

  const isBookmarked = (topicSlug: string, lessonSlug: string) =>
    state.bookmarks.some((b) => b.topicSlug === topicSlug && b.lessonSlug === lessonSlug);

  const topicProgress = (topicSlug: string, totalLessons: number) => {
    const done = state.progress.filter((p) => p.topicSlug === topicSlug && p.completed).length;
    return totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
  };

  return { ...state, markViewed, markComplete, toggleBookmark, isCompleted, isBookmarked, topicProgress, isSignedIn: !!sessionData?.session };
}
