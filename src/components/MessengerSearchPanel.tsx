/**
 * MessengerSearchPanel — Phase 5 message search
 * Keyword search across a conversation's decrypted messages.
 * Filters by sender (mine / theirs) and date range.
 * Highlights matches, shows context, and lets the user jump between results.
 * Session-only search history (no persistence).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ChevronUp, ChevronDown, Clock, User, Calendar } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchableMessage {
  id: number;
  senderId: string;
  plaintext?: string;
  createdAt: string;
  deletedAt?: string | null;
}

interface SearchResult {
  message: SearchableMessage;
  matchStart: number;
  matchEnd: number;
}

interface MessengerSearchPanelProps {
  messages: SearchableMessage[];
  myId: string;
  otherUserName: string;
  onClose: () => void;
  onJumpTo: (messageId: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function highlight(text: string, start: number, end: number): React.ReactNode {
  return (
    <>
      {text.slice(0, start)}
      <mark
        className="rounded-sm px-0.5"
        style={{ background: 'hsl(var(--primary) / 0.35)', color: 'hsl(var(--foreground))' }}>
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessengerSearchPanel({
  messages,
  myId,
  otherUserName,
  onClose,
  onJumpTo,
}: MessengerSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [senderFilter, setSenderFilter] = useState<'all' | 'me' | 'them'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Run search whenever query or filters change
  const runSearch = useCallback(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }

    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;

    const found: SearchResult[] = [];
    for (const msg of messages) {
      if (msg.deletedAt) continue;
      const text = msg.plaintext ?? '';
      if (!text) continue;

      // Sender filter
      if (senderFilter === 'me' && msg.senderId !== myId) continue;
      if (senderFilter === 'them' && msg.senderId === myId) continue;

      // Date filter
      const ts = new Date(msg.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) continue;
      if (toTs !== null && ts > toTs) continue;

      // Keyword match (case-insensitive)
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx === -1) continue;

      found.push({ message: msg, matchStart: idx, matchEnd: idx + q.length });
    }

    // Newest first
    found.sort((a, b) => new Date(b.message.createdAt).getTime() - new Date(a.message.createdAt).getTime());
    setResults(found);
    setCursor(0);
  }, [query, senderFilter, dateFrom, dateTo, messages, myId]);

  useEffect(() => { runSearch(); }, [runSearch]);

  // Save to session history on Enter / explicit search
  function commitHistory(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const deduped = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 8);
      return deduped;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { commitHistory(query); }
    if (e.key === 'Escape') { onClose(); }
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      const next = (cursor + 1) % results.length;
      setCursor(next);
      onJumpTo(results[next].message.id);
    }
    if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      const prev = (cursor - 1 + results.length) % results.length;
      setCursor(prev);
      onJumpTo(results[prev].message.id);
    }
  }

  function jumpTo(idx: number) {
    setCursor(idx);
    onJumpTo(results[idx].message.id);
    commitHistory(query);
  }

  function prevResult() {
    if (!results.length) return;
    const prev = (cursor - 1 + results.length) % results.length;
    setCursor(prev);
    onJumpTo(results[prev].message.id);
  }

  function nextResult() {
    if (!results.length) return;
    const next = (cursor + 1) % results.length;
    setCursor(next);
    onJumpTo(results[next].message.id);
  }

  const hasFilters = senderFilter !== 'all' || dateFrom || dateTo;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col"
      style={{
        background: 'hsl(var(--card))',
        borderBottom: '1px solid hsl(var(--border))',
        maxHeight: '420px',
      }}>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search messages…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          style={{ color: 'hsl(var(--foreground))' }}
          aria-label="Search messages"
        />
        {/* Result counter */}
        {query.trim() && (
          <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {results.length === 0 ? 'No results' : `${cursor + 1} / ${results.length}`}
          </span>
        )}
        {/* Prev / Next */}
        {results.length > 1 && (
          <div className="flex items-center gap-0.5">
            <button onClick={prevResult} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/60"
              aria-label="Previous result">
              <ChevronUp className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </button>
            <button onClick={nextResult} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/60"
              aria-label="Next result">
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </button>
          </div>
        )}
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: hasFilters ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
            color: hasFilters ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
          aria-label="Toggle filters">
          <Calendar className="w-3.5 h-3.5" />
        </button>
        {/* Close */}
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          aria-label="Close search">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 flex flex-wrap gap-2">
              {/* Sender filter */}
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                {(['all', 'me', 'them'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSenderFilter(opt)}
                    className="px-2.5 py-1 rounded-full text-xs transition-colors"
                    style={{
                      background: senderFilter === opt ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                      color: senderFilter === opt ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      border: senderFilter === opt ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid transparent',
                    }}>
                    {opt === 'all' ? 'All' : opt === 'me' ? 'Mine' : otherUserName}
                  </button>
                ))}
              </div>
              {/* Date range */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 outline-none"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    colorScheme: 'dark',
                  }}
                  aria-label="From date"
                />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 outline-none"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    colorScheme: 'dark',
                  }}
                  aria-label="To date"
                />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search history (shown when query is empty) ── */}
      <AnimatePresence>
        {!query.trim() && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-2">
            <p className="text-xs mb-1.5 flex items-center gap-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Clock className="w-3 h-3" /> Recent
            </p>
            <div className="flex flex-wrap gap-1.5">
              {history.map(h => (
                <button
                  key={h}
                  onClick={() => setQuery(h)}
                  className="px-2.5 py-1 rounded-full text-xs transition-opacity hover:opacity-80"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}>
                  {h}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results list ── */}
      {query.trim() && results.length > 0 && (
        <div className="overflow-y-auto flex-1" style={{ maxHeight: '260px' }}>
          {results.map((r, idx) => {
            const text = r.message.plaintext ?? '';
            const isMine = r.message.senderId === myId;
            const isActive = idx === cursor;
            return (
              <button
                key={r.message.id}
                onClick={() => jumpTo(idx)}
                className="w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors"
                style={{
                  background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium"
                    style={{ color: isMine ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}>
                    {isMine ? 'You' : otherUserName}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {formatDate(r.message.createdAt)} · {formatTime(r.message.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-snug line-clamp-2" style={{ color: 'hsl(var(--foreground))' }}>
                  {highlight(text, r.matchStart, r.matchEnd)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {query.trim() && results.length === 0 && (
        <div className="px-3 pb-3 text-center">
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            No messages match "{query.trim()}"
          </p>
        </div>
      )}
    </motion.div>
  );
}
