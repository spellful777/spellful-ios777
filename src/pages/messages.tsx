import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { OnlineDot } from '@/components/OnlineDot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send, Lock, MessageCircle, ArrowLeft, ShieldCheck,
  Trash2, FileText, Inbox, MoreVertical, RotateCcw, PenSquare, Sparkles,
  Search, X as XIcon, Users, Check, CheckCheck,
  CornerUpLeft, Pencil, Palette, UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { getOrCreateKeyPair, encryptMessage, decryptMessage } from '@/lib/dm-crypto';
import { messages as pageContent } from 'virtual:content';
import { usePwa } from '@/hooks/usePwa';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallBanner } from '@/components/InstallSpellful';
import MessengerWallpaperPicker, { MESSENGER_THEMES, type WallpaperPrefs } from '@/components/MessengerWallpaperPicker';
import MessengerSearchPanel from '@/components/MessengerSearchPanel';

// ── Horoscope types ───────────────────────────────────────────────────────────
interface DailyHoroscope {
  sign: string;
  date: string;
  headline: string;
  body: string;
  planetNote: string;
  do: string[];
  dont: string[];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageStatus = 'sent' | 'draft' | 'trashed' | 'deleted';
type Folder = 'inbox' | 'requests' | 'drafts' | 'trash';
type CovenStatus = 'accepted' | 'pending_sent' | 'pending_received' | 'declined' | null;

interface OtherUser {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
}

interface ConversationSummary {
  id: number;
  updatedAt: string;
  otherUser: OtherUser | null;
  lastMessage: { ciphertext: string; iv: string; senderId: string; createdAt: string; systemMessage?: string | null } | null;
  unreadCount: number;
  requestStatus?: string | null;
  requesterId?: string | null;
}

interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  ciphertext: string;
  iv: string;
  status: MessageStatus;
  readAt: string | null;
  createdAt: string;
  plaintext?: string;
  systemMessage?: string | null; // plaintext for Spellful Team system messages
  replyToId?: number | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  reactions?: Reaction[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 44 }: { user: OtherUser | null; size?: number }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)',
        border: '2px solid hsl(var(--border))',
      }}
    >
      {user?.image ? (
        <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <span className="font-serif font-semibold text-sm" style={{ color: 'hsl(var(--primary-foreground))' }}>
          {initials}
        </span>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Desktop thread sub-component ──────────────────────────────────────────────

interface DesktopThreadProps {
  activeOtherUser: OtherUser | null;
  messages: Message[];
  loadingMsgs: boolean;
  folder: Folder;
  switchFolder: (f: Folder) => Promise<void>;
  myId: string;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  handleSend: () => Promise<void>;
  otherUserPublicKey: string | null;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  updateMessageStatus: (id: number, status: MessageStatus) => Promise<void>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  otherIsTyping: boolean;
  lastReadMsgId: number | null;
  replyTo: Message | null;
  setReplyTo: (m: Message | null) => void;
  editingMsg: Message | null;
  setEditingMsg: (m: Message | null) => void;
  reactionPickerMsgId: number | null;
  setReactionPickerMsgId: (id: number | null) => void;
  toggleReaction: (msgId: number, emoji: string) => Promise<void>;
  softDeleteMessage: (msgId: number) => Promise<void>;
  wallpaper: WallpaperPrefs;
  isCoven: boolean;
  covenStatus: CovenStatus;
  covenConnectionId: number | null;
  onCovenAction: (action: 'send' | 'accept' | 'decline') => Promise<void>;
  onOpenWallpaperPicker: () => void;
  onSaveWallpaper: (prefs: WallpaperPrefs) => void;
  activeConvId: number | null;
  showSearch: boolean;
  onToggleSearch: () => void;
  onSearchJump: (messageId: number) => void;
}

function DesktopThread({
  activeOtherUser, messages, loadingMsgs, folder, switchFolder, myId,
  draft, setDraft, sending, handleSend, otherUserPublicKey,
  openMenuId, setOpenMenuId, updateMessageStatus, bottomRef, inputRef,
  otherIsTyping, lastReadMsgId,
  replyTo, setReplyTo, editingMsg, setEditingMsg,
  reactionPickerMsgId, setReactionPickerMsgId, toggleReaction,
  softDeleteMessage, wallpaper, isCoven, covenStatus, covenConnectionId, onCovenAction,
  onOpenWallpaperPicker, onSaveWallpaper, activeConvId,
  showSearch, onToggleSearch, onSearchJump,
}: DesktopThreadProps) {
  const [showWallpaperInline, setShowWallpaperInline] = React.useState(false);
  return (
    <>
      {/* Thread header */}
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <a
          href={activeOtherUser?.username ? `/profile/${activeOtherUser.username}` : undefined}
          className="relative flex-shrink-0 cursor-pointer"
          aria-label={activeOtherUser?.username ? `View ${activeOtherUser.name ?? activeOtherUser.username}'s profile` : undefined}>
          <Avatar user={activeOtherUser} size={36} />
          {activeOtherUser && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineDot userId={activeOtherUser.id} size={9} />
            </div>
          )}
        </a>
        <a
          href={activeOtherUser?.username ? `/profile/${activeOtherUser.username}` : undefined}
          className="flex-1 min-w-0 cursor-pointer"
          aria-label={activeOtherUser?.username ? `View ${activeOtherUser.name ?? activeOtherUser.username}'s profile` : undefined}>
          <p className="font-medium text-sm truncate hover:underline" style={{ color: 'hsl(var(--foreground))' }}>
            {activeOtherUser?.name ?? activeOtherUser?.username ?? 'Unknown'}
          </p>
          <AnimatePresence mode="wait">
            {otherIsTyping ? (
              <motion.p key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs" style={{ color: 'hsl(var(--primary))' }}>
                typing…
              </motion.p>
            ) : activeOtherUser?.username ? (
              <motion.p key="username" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                @{activeOtherUser.username}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </a>
        <div className="ml-auto flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <button
            onClick={onToggleSearch}
            className="w-7 h-7 rounded-full flex items-center justify-center mr-0.5"
            style={{
              background: showSearch ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
              color: showSearch ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
            aria-label="Search messages">
            <Search className="w-3.5 h-3.5" />
          </button>
          {isCoven && (
            <button
              onClick={() => setShowWallpaperInline(v => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center mr-1 transition-all"
              style={{
                background: showWallpaperInline ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                color: showWallpaperInline ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}
              aria-label="Chat appearance">
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}
          <Lock className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
          <span>{pageContent.encryptedShort}</span>
        </div>
      </div>

      {/* ── Phase 5: Search panel ── */}
      <AnimatePresence>
        {showSearch && (
          <MessengerSearchPanel
            messages={messages}
            myId={myId}
            otherUserName={activeOtherUser?.name ?? activeOtherUser?.username ?? 'Them'}
            onClose={onToggleSearch}
            onJumpTo={onSearchJump}
          />
        )}
      </AnimatePresence>

      {/* ── Inline wallpaper/appearance panel ── */}
      <AnimatePresence>
        {showWallpaperInline && (
          <motion.div
            key="wallpaper-inline"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <MessengerWallpaperPicker
              conversationId={activeConvId ?? 0}
              current={wallpaper}
              onClose={() => setShowWallpaperInline(false)}
              onSave={(prefs) => { onSaveWallpaper(prefs); setShowWallpaperInline(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        {([
          { id: 'inbox', label: 'Inbox', icon: Inbox },
          { id: 'requests', label: 'Requests', icon: UserCheck },
          { id: 'drafts', label: 'Drafts', icon: FileText },
          { id: 'trash', label: 'Trash', icon: Trash2 },
        ] as { id: Folder; label: string; icon: LucideIcon }[]).map(tab => (
          <button key={tab.id} onClick={() => void switchFolder(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg transition-colors"
            style={{
              color: folder === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              borderBottom: folder === tab.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            }}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative" onClick={() => setOpenMenuId(null)}>
        {/* Wallpaper background */}
        {(() => {
          const theme = MESSENGER_THEMES.find(t => t.id === wallpaper.themeId);
          const bgStyle: React.CSSProperties = wallpaper.themeId === 'custom' && wallpaper.customImageUrl
            ? { backgroundImage: `url(${wallpaper.customImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'local' }
            : theme?.backgroundStyle
              ? { background: theme.backgroundStyle }
              : {};
          return Object.keys(bgStyle).length > 0 ? (
            <>
              <div className="absolute inset-0 pointer-events-none" style={{
                ...bgStyle,
                ...(wallpaper.blurAmount > 0 ? { filter: `blur(${wallpaper.blurAmount}px)`, transform: 'scale(1.05)' } : {}),
              }} />
              {wallpaper.dimAmount > 0 && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `hsl(var(--background) / ${wallpaper.dimAmount / 100})` }} />
              )}
            </>
          ) : null;
        })()}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {folder === 'inbox' && (
            <><Lock className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Private conversation</span></>
          )}
          {folder === 'drafts' && (
            <><FileText className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Drafts — only visible to you</span></>
          )}
          {folder === 'trash' && (
            <><Trash2 className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Trash — only visible to you</span></>
          )}
        </div>

        {loadingMsgs ? (
          <div className="text-center text-sm py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.decryptingLabel}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {folder === 'drafts' ? 'No drafts.' : folder === 'trash' ? 'Trash is empty.' : pageContent.emptyMessages}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === myId;
              const isSystem = !!msg.systemMessage;
              const prevMsg: Message | undefined = idx > 0 ? messages[idx - 1] : undefined;
              const showDateSep = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
              const isLastMine = isMine && !isSystem && messages.slice(idx + 1).every(m => m.senderId !== myId || !!m.systemMessage);
              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}>{formatDateLabel(msg.createdAt)}</span>
                      <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                    </div>
                  )}
                  <motion.div
                    id={`msg-${msg.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                  <div className={isSystem ? 'w-full max-w-[90%]' : 'max-w-[75%]'} style={{ marginLeft: isSystem ? 'auto' : undefined, marginRight: isSystem ? 'auto' : undefined }}>
                    <div className="relative group">
                      {isSystem ? (
                        <div className="rounded-2xl overflow-hidden"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                          <img
                            src="/airo-assets/images/logo/official-white"
                            alt="Welcome to Spellful"
                            className="w-full object-cover"
                            style={{ maxHeight: 180 }}
                            loading="eager"
                          />
                          <div className="px-5 py-4 text-sm whitespace-pre-line"
                            style={{ color: 'hsl(var(--foreground))', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                            {msg.plaintext}
                          </div>
                          <div className="px-5 pb-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      ) : (
                      <div>
                        {/* Reply-to quote */}
                        {msg.replyToId && (() => {
                          const quoted = messages.find(m => m.id === msg.replyToId);
                          return quoted ? (
                            <div className="mb-1 px-3 py-1.5 rounded-xl text-xs opacity-70 border-l-2"
                              style={{
                                background: isMine ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--card))',
                                borderLeftColor: 'hsl(var(--accent))',
                                color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                              }}>
                              <span className="font-medium mr-1">{quoted.senderId === myId ? 'You' : (activeOtherUser?.name ?? activeOtherUser?.username ?? 'Them')}:</span>
                              <span className="line-clamp-1">{quoted.deletedAt ? 'Message deleted' : (quoted.plaintext ?? '🔒')}</span>
                            </div>
                          ) : null;
                        })()}
                        {/* Bubble */}
                        <div className="px-4 py-2.5 text-sm"
                          style={{
                            background: msg.deletedAt ? 'transparent' : msg.status === 'draft' ? 'hsl(var(--muted))' : isMine ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                            color: msg.deletedAt ? 'hsl(var(--muted-foreground))' : msg.status === 'draft' ? 'hsl(var(--muted-foreground))' : isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            opacity: msg.status === 'draft' ? 0.75 : 1,
                            border: msg.deletedAt ? '1px dashed hsl(var(--border))' : msg.status === 'draft' ? '1px dashed hsl(var(--border))' : undefined,
                            fontStyle: msg.deletedAt ? 'italic' : undefined,
                          }}>
                          {msg.deletedAt ? 'Message deleted' : (msg.plaintext ?? '🔒 Encrypted')}
                          {msg.status === 'draft' && !msg.deletedAt && (
                            <span className="ml-2 text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>Draft</span>
                          )}
                        </div>
                      </div>
                      )}
                      {/* Hover action bar — reaction + reply + menu */}
                      {!isSystem && !msg.deletedAt && (
                        <div className={'absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ' + (isMine ? '-left-24' : '-right-24')}>
                          {/* Reaction picker trigger */}
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id); }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-sm hover:scale-110 transition-transform"
                              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                              aria-label="React">
                              😊
                            </button>
                            <AnimatePresence>
                              {reactionPickerMsgId === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-9 left-0 flex gap-1 px-2 py-1.5 rounded-2xl shadow-xl z-30"
                                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                  onClick={e => e.stopPropagation()}>
                                  {['👍', '❤️', '✨', '🌙'].map(emoji => {
                                    const myReaction = msg.reactions?.find(r => r.emoji === emoji && r.userIds.includes(myId));
                                    return (
                                      <button key={emoji} onClick={() => void toggleReaction(msg.id, emoji)}
                                        className="text-lg hover:scale-125 transition-transform rounded-full w-8 h-8 flex items-center justify-center"
                                        style={{ background: myReaction ? 'hsl(var(--primary) / 0.2)' : 'transparent' }}
                                        aria-label={emoji}>
                                        {emoji}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {/* Reply */}
                          <button
                            onClick={() => { setReplyTo(msg); setReactionPickerMsgId(null); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                            aria-label="Reply">
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          {/* Menu (own messages only) */}
                          {isMine && (
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Message options">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {openMenuId === msg.id && (
                                <div className="absolute bottom-9 left-0 z-20 rounded-xl shadow-xl py-1 min-w-[150px]"
                                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                  onClick={e => e.stopPropagation()}>
                                  {msg.status === 'sent' && (
                                    <button onClick={() => { setEditingMsg(msg); setDraft(msg.plaintext ?? ''); setOpenMenuId(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80"
                                      style={{ color: 'hsl(var(--foreground))' }}>
                                      <Pencil className="w-3.5 h-3.5" />Edit
                                    </button>
                                  )}
                                  {msg.status === 'draft' && (
                                    <button onClick={() => void updateMessageStatus(msg.id, 'sent')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80"
                                      style={{ color: 'hsl(var(--success))' }}>
                                      <Send className="w-3.5 h-3.5" />Send now
                                    </button>
                                  )}
                                  {msg.status === 'trashed' && (
                                    <button onClick={() => void updateMessageStatus(msg.id, 'sent')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80"
                                      style={{ color: 'hsl(var(--foreground))' }}>
                                      <RotateCcw className="w-3.5 h-3.5" />Restore
                                    </button>
                                  )}
                                  {msg.status !== 'trashed' && (
                                    <button onClick={() => void updateMessageStatus(msg.id, 'trashed')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80"
                                      style={{ color: 'hsl(var(--warning))' }}>
                                      <Trash2 className="w-3.5 h-3.5" />Move to trash
                                    </button>
                                  )}
                                  <button onClick={() => void softDeleteMessage(msg.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80"
                                    style={{ color: 'hsl(var(--destructive))' }}>
                                    <Trash2 className="w-3.5 h-3.5" />Delete for everyone
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Reactions row */}
                    {!isSystem && (msg.reactions?.length ?? 0) > 0 && (
                      <div className={'flex flex-wrap gap-1 mt-1 ' + (isMine ? 'justify-end' : 'justify-start')}>
                        {(msg.reactions ?? []).map(r => (
                          <button key={r.emoji} onClick={() => void toggleReaction(msg.id, r.emoji)}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                            style={{
                              background: r.userIds.includes(myId) ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                              border: r.userIds.includes(myId) ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}>
                            <span>{r.emoji}</span>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!isSystem && (
                    <div className={'flex items-center gap-1.5 text-xs px-1 ' + (isMine ? 'justify-end' : 'justify-start')}
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {formatTime(msg.createdAt)}
                      {msg.editedAt && !msg.deletedAt && <span className="italic">· edited</span>}
                      {isMine && isLastMine && (
                        <span className="flex items-center gap-0.5">
                          {(lastReadMsgId !== null && msg.id <= lastReadMsgId) || msg.readAt
                            ? <><CheckCheck className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} /><span style={{ color: 'hsl(var(--success))' }}>Read</span></>
                            : <><Check className="w-3 h-3" /><span>Sent</span></>
                          }
                        </span>
                      )}
                    </div>
                    )}
                  </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            {otherIsTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-[18px_18px_18px_4px]"
                  style={{ background: 'hsl(var(--muted))', maxWidth: '80px' }}>
                  <span className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: 'hsl(var(--muted-foreground))', animationDelay: i * 0.15 + 's' }} />
                    ))}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        {/* Coven accepted notification */}
        {covenStatus === 'accepted' && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1 py-6 px-4 text-center">
            <span className="text-2xl">✨</span>
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>
              You're now Coven friends with {activeOtherUser?.name ?? activeOtherUser?.username ?? 'them'}!
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Send your first message.</p>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Coven connection banner — shown when not yet accepted friends */}
      {folder === 'inbox' && covenStatus !== 'accepted' && (
        <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
          {covenStatus === null && (
            <>
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                You're not Coven friends yet. Send a request to unlock full messaging.
              </p>
              <button
                onClick={() => void onCovenAction('send')}
                className="w-full py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                Send Coven Request
              </button>
            </>
          )}
          {covenStatus === 'pending_sent' && (
            <p className="text-xs text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              ✨ Coven request sent — waiting for {activeOtherUser?.name ?? activeOtherUser?.username ?? 'them'} to accept.
            </p>
          )}
          {covenStatus === 'pending_received' && (
            <>
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {activeOtherUser?.name ?? activeOtherUser?.username ?? 'They'} sent you a Coven request.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => void onCovenAction('accept')}
                  className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Accept
                </button>
                <button
                  onClick={() => void onCovenAction('decline')}
                  className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(var(--muted-foreground) / 0.2)', color: 'hsl(var(--foreground))' }}>
                  Decline
                </button>
              </div>
            </>
          )}
          {covenStatus === 'declined' && (
            <p className="text-xs text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Coven request was declined.
            </p>
          )}
        </div>
      )}

      {/* Send bar — always shown in inbox regardless of Coven status */}
      {folder === 'inbox' && (
        <div className="p-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <>
              {/* Reply-to context bar */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                    <CornerUpLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                    <span className="text-xs flex-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {replyTo.senderId === myId ? 'You' : (activeOtherUser?.name ?? activeOtherUser?.username ?? 'Them')}:
                      </span>{' '}
                      {replyTo.plaintext ?? '🔒'}
                    </span>
                    <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"
                      className="flex-shrink-0 hover:opacity-70" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
                {/* Edit context bar */}
                {editingMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                    style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                    <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-xs flex-1" style={{ color: 'hsl(var(--primary))' }}>Editing message</span>
                    <button onClick={() => { setEditingMsg(null); setDraft(''); }} aria-label="Cancel edit"
                      className="flex-shrink-0 hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={editingMsg ? 'Edit your message…' : 'Write a message…'}
                  className="flex-1 rounded-full bg-muted border-border"
                  maxLength={2000}
                  autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={!draft.trim() || sending || !otherUserPublicKey}
                  className="rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  {editingMsg ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <Lock className="w-2.5 h-2.5" style={{ color: 'hsl(var(--success))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Private conversation</span>
              </div>
            </>
        </div>
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeOtherUser, setActiveOtherUser] = useState<OtherUser | null>(null);
  const [otherUserPublicKey, setOtherUserPublicKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [keyReady, setKeyReady] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [folder, setFolder] = useState<Folder>('inbox');
  type MsgRequest = { id: number; conversationId: number; requesterId: string; status: string; createdAt: string | null; requesterName: string | null; requesterUsername: string | null; requesterImage: string | null };
  const [msgRequests, setMsgRequests] = useState<MsgRequest[]>([]);
  const [msgRequestsLoaded, setMsgRequestsLoaded] = useState(false);
  const [requestActionId, setRequestActionId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  // Install state managed by shared InstallBanner component
  const [testNotifStatus, setTestNotifStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // ── Inbox search + filter ─────────────────────────────────────────────────
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread'>('all');

  // ── Realtime: typing + receipts ───────────────────────────────────────────
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [lastReadMsgId, setLastReadMsgId] = useState<number | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgTimestampRef = useRef<string | null>(null);

  // ── Phase 3: reply-to, edit, reactions ───────────────────────────────────
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);

  // ── Phase 4: wallpaper / theme ────────────────────────────────────────────
  const defaultWallpaper: WallpaperPrefs = { themeId: 'default', customImageUrl: null, dimAmount: 40, blurAmount: 0 };
  const [wallpaper, setWallpaper] = useState<WallpaperPrefs>(defaultWallpaper);
  const [isCoven, setIsCoven] = useState(false);
  const [covenStatus, setCovenStatus] = useState<CovenStatus>(null);
  const [covenConnectionId, setCovenConnectionId] = useState<number | null>(null);
  // showWallpaperPicker removed — wallpaper now inline

  // ── Phase 5: message search ───────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [showWallpaperMobile, setShowWallpaperMobile] = useState(false);

  // ── New message compose sheet ─────────────────────────────────────────────
  const [showCompose, setShowCompose] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [composeResults, setComposeResults] = useState<OtherUser[]>([]);
  const [composeSearching, setComposeSearching] = useState(false);
  const [composeStarting, setComposeStarting] = useState<string | null>(null);

  // ── Daily horoscope popup ─────────────────────────────────────────────────
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  // showHoroscope removed — horoscope popup replaced with inline strip
  const bottomRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myId = (session?.user as { id?: string } | undefined)?.id ?? '';

  // Register SW + request push permission once signed in
  usePwa(!!session);
  const { isInstalled } = usePWAInstall();

  // ── Fetch daily horoscope (inline strip, not popup) ─────────────────────
  useEffect(() => {
    if (!session) return;
    fetch('/api/horoscope/today', { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<DailyHoroscope> : null)
      .then(data => { if (data) setHoroscope(data); })
      .catch(() => undefined);
  }, [session]);

  // dismissHoroscope removed — horoscope popup replaced with inline strip

  // ── Compose: search users ─────────────────────────────────────────────────
  useEffect(() => {
    if (!showCompose) return;
    if (composeQuery.length < 2) { setComposeResults([]); return; }
    const timer = setTimeout(async () => {
      setComposeSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(composeQuery)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json() as { users: OtherUser[] };
          setComposeResults(data.users);
        }
      } finally {
        setComposeSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [composeQuery, showCompose]);

  async function startConversationWith(recipient: OtherUser) {
    setComposeStarting(recipient.id);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: recipient.id }),
      });
      if (!res.ok) return;
      const { id } = await res.json() as { id: number };
      await loadConversations();
      void openConversation(id, recipient);
      setShowCompose(false);
      setComposeQuery('');
      setComposeResults([]);
    } finally {
      setComposeStarting(null);
    }
  }

  // ── PWA install prompt — handled by shared InstallBanner component ─────────

  async function sendTestNotification() {
    setTestNotifStatus('sending');
    try {
      const res = await fetch('/api/push/test', { method: 'POST', credentials: 'include' });
      setTestNotifStatus(res.ok ? 'sent' : 'error');
    } catch {
      setTestNotifStatus('error');
    }
    setTimeout(() => setTestNotifStatus('idle'), 4000);
  }


  // ── Presence heartbeat ────────────────────────────────────────────────────

  useEffect(() => {
    if (!myId) return;
    const ping = () => { void fetch('/api/presence', { method: 'POST', credentials: 'include' }); };
    ping();
    heartbeatRef.current = setInterval(ping, 30_000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [myId]);

  // ── Key setup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!myId) return;
    async function setup() {
      const { publicKeyJwk } = await getOrCreateKeyPair();
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ publicKey: publicKeyJwk }),
      });
      setKeyReady(true);
    }
    void setup();
  }, [myId]);

  // ── Load conversations ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations?limit=50', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { conversations?: ConversationSummary[]; hasMore?: boolean } | ConversationSummary[];
        // Handle both plain-array and { conversations, hasMore } shapes
        const convList = Array.isArray(data) ? data : (data.conversations ?? []);
        setConversations(convList);
      }
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (!myId) return;
    void loadConversations();
    const interval = setInterval(() => { void loadConversations(); }, 10_000);
    return () => clearInterval(interval);
  }, [myId, loadConversations]);

  // ── Handle ?with=username deep-link ──────────────────────────────────────

  useEffect(() => {
    const withUsername = searchParams.get('with');
    if (!withUsername || !myId || !keyReady) return;

    async function openOrCreate() {
      const profileRes = await fetch(`/api/profile/${withUsername}`, { credentials: 'include' });
      if (!profileRes.ok) return;
      const profile = await profileRes.json() as { id?: string };
      if (!profile.id) return;

      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: profile.id }),
      });
      if (!convRes.ok) return;
      const { id } = await convRes.json() as { id: number };
      await loadConversations();
      void openConversation(id, { id: profile.id, name: withUsername, image: null, username: withUsername });
    }

    void openOrCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, myId, keyReady]);

  // ── Decrypt helper ────────────────────────────────────────────────────────

  async function decryptAll(raw: Message[], theirKey: string | null): Promise<Message[]> {
    return Promise.all(raw.map(async (m) => {
      // System messages are stored as plaintext — skip decryption
      if (m.systemMessage) return { ...m, plaintext: m.systemMessage };
      if (!theirKey) return { ...m, plaintext: '🔒 Encrypted' };
      const pt = await decryptMessage(m.ciphertext, m.iv, theirKey);
      return { ...m, plaintext: pt ?? '🔒 Encrypted' };
    }));
  }

  // ── Open a conversation ───────────────────────────────────────────────────

  async function openConversation(convId: number, other: OtherUser) {
    setActiveConvId(convId);
    setActiveOtherUser(other);
    setMobileView('thread');
    setLoadingMsgs(true);
    setMessages([]);
    setDraft('');
    setFolder('inbox');
    setOtherIsTyping(false);
    setLastReadMsgId(null);
    lastMsgTimestampRef.current = null;
    // Reset Phase 3 state
    setReplyTo(null);
    setEditingMsg(null);
    setReactionPickerMsgId(null);
    // Reset Phase 5 state
    setShowSearch(false);

    const [keyRes, wallpaperRes, covenRes] = await Promise.all([
      fetch(`/api/keys?userId=${other.id}`, { credentials: 'include' }),
      fetch(`/api/conversations/${convId}/wallpaper`, { credentials: 'include' }),
      fetch(`/api/coven/status/${other.id}`, { credentials: 'include' }),
    ]);
    const theirKey = keyRes.ok ? ((await keyRes.json() as { publicKey?: string }).publicKey ?? null) : null;
    setOtherUserPublicKey(theirKey);
    if (wallpaperRes.ok) {
      const wp = await wallpaperRes.json() as WallpaperPrefs;
      setWallpaper(wp);
    } else {
      setWallpaper(defaultWallpaper);
    }
    if (covenRes.ok) {
      const cs = await covenRes.json() as { status: CovenStatus; connectionId: number | null };
      setCovenStatus(cs.status);
      setCovenConnectionId(cs.connectionId);
      setIsCoven(cs.status === 'accepted');
    } else {
      setCovenStatus(null);
      setCovenConnectionId(null);
      setIsCoven(false);
    }

    await loadFolder('inbox', convId, theirKey);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  // ── Coven action handler ─────────────────────────────────────────────────
  async function handleCovenAction(action: 'send' | 'accept' | 'decline') {
    if (!activeOtherUser) return;
    if (action === 'send') {
      const res = await fetch('/api/coven/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiverId: activeOtherUser.id }),
      });
      if (res.ok) {
        setCovenStatus('pending_sent');
      }
    } else if ((action === 'accept' || action === 'decline') && covenConnectionId !== null) {
      const res = await fetch('/api/coven/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId: covenConnectionId, action }),
      });
      if (res.ok) {
        if (action === 'accept') {
          setCovenStatus('accepted');
          setIsCoven(true);
        } else {
          setCovenStatus('declined');
        }
      }
    }
  }

  // ── Phase 5: scroll to a message by id ───────────────────────────────────
  function scrollToMessage(messageId: number) {
    setShowSearch(false);
    // Give the panel time to close, then scroll the element into view
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('msg-highlight');
        setTimeout(() => el.classList.remove('msg-highlight'), 1800);
      }
    }, 120);
  }

  // ── Load folder messages ──────────────────────────────────────────────────

  async function loadFolder(f: Folder, convId: number, theirKey: string | null) {
    setLoadingMsgs(true);
    const statusParam = f === 'drafts' ? 'draft' : f === 'trash' ? 'trashed' : '';
    const url = `/api/conversations/${convId}/messages${statusParam ? `?status=${statusParam}` : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) { setLoadingMsgs(false); return; }
    const responseData = await res.json() as { messages?: Message[]; hasMore?: boolean; oldestId?: number | null } | Message[];
    // Handle both old array format and new { messages, hasMore, oldestId } format
    const raw = Array.isArray(responseData) ? responseData : (responseData.messages ?? []);
    const decrypted = await decryptAll(raw, theirKey);
    setMessages(decrypted);
    // Seed the since-pointer so polling only fetches new messages
    if (decrypted.length && f === 'inbox') {
      const latest = decrypted[decrypted.length - 1];
      lastMsgTimestampRef.current = latest.createdAt;
    }
    setLoadingMsgs(false);
  }

  // ── Switch folder ─────────────────────────────────────────────────────────

  async function switchFolder(f: Folder) {
    setFolder(f);
    if (activeConvId !== null) {
      await loadFolder(f, activeConvId, otherUserPublicKey);
    }
  }

  // ── Poll for new messages (since-based, efficient) ─────────────────────────

  useEffect(() => {
    if (!activeConvId || !otherUserPublicKey || folder !== 'inbox') return;
    const poll = async () => {
      const after = lastMsgTimestampRef.current ?? new Date(0).toISOString();
      const res = await fetch(`/api/conversations/${activeConvId}/messages/since?after=${encodeURIComponent(after)}`, { credentials: 'include' });
      if (!res.ok) return;
      const raw = await res.json() as Message[];
      if (!raw.length) return;
      const decrypted = await decryptAll(raw, otherUserPublicKey);
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOnes = decrypted.filter(m => !existingIds.has(m.id));
        if (!newOnes.length) return prev;
        const merged = [...prev, ...newOnes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const latest = merged[merged.length - 1];
        if (latest) lastMsgTimestampRef.current = latest.createdAt;
        return merged;
      });
      // Update unread count in sidebar
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
    };
    const interval = setInterval(() => { void poll(); }, 3_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, otherUserPublicKey, folder]);

  // ── Poll typing indicator ─────────────────────────────────────────────────

  useEffect(() => {
    if (!activeConvId || folder !== 'inbox') return;
    const poll = async () => {
      const res = await fetch(`/api/conversations/${activeConvId}/typing`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json() as { typing: boolean };
      setOtherIsTyping(data.typing);
    };
    const interval = setInterval(() => { void poll(); }, 2_000);
    return () => clearInterval(interval);
  }, [activeConvId, folder]);

  // ── Poll read receipts ────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeConvId || folder !== 'inbox') return;
    const poll = async () => {
      const res = await fetch(`/api/conversations/${activeConvId}/receipts`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json() as { lastReadMessageId: number | null };
      setLastReadMsgId(data.lastReadMessageId);
    };
    void poll(); // immediate on open
    const interval = setInterval(() => { void poll(); }, 5_000);
    return () => clearInterval(interval);
  }, [activeConvId, folder]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Auto-save draft after 2s of inactivity ───────────────────────────────

  useEffect(() => {
    if (!draft.trim() || !activeConvId || !otherUserPublicKey) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => { void saveDraft(); }, 2000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // ── Typing signal: debounced POST when draft changes ─────────────────────

  useEffect(() => {
    if (!draft.trim() || !activeConvId || folder !== 'inbox') return;
    // Fire immediately, then debounce further signals
    void fetch(`/api/conversations/${activeConvId}/typing`, { method: 'POST', credentials: 'include' });
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      // No further action needed — server TTL handles expiry
    }, 3000);
    return () => { if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // ── Save draft ────────────────────────────────────────────────────────────

  async function saveDraft() {
    if (!draft.trim() || !activeConvId || !otherUserPublicKey) return;
    const { ciphertext, iv } = await encryptMessage(draft.trim(), otherUserPublicKey);
    await fetch(`/api/conversations/${activeConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ciphertext, iv, status: 'draft' }),
    });
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend() {
    // If in edit mode, submit the edit instead
    if (editingMsg) { await submitEdit(); return; }
    if (!draft.trim() || !activeConvId || !otherUserPublicKey || sending) return;
    setSending(true);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    const replyToId = replyTo?.id ?? undefined;
    try {
      const { ciphertext, iv } = await encryptMessage(draft.trim(), otherUserPublicKey);
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ciphertext, iv, ...(replyToId ? { replyToId } : {}) }),
      });
      if (res.ok) {
        const { id } = await res.json() as { id: number };
        const text = draft.trim();
        setDraft('');
        setReplyTo(null);
        setMessages(prev => [...prev, {
          id,
          conversationId: activeConvId,
          senderId: myId,
          ciphertext,
          iv,
          status: 'sent',
          readAt: null,
          createdAt: new Date().toISOString(),
          plaintext: text,
          replyToId: replyToId ?? null,
          reactions: [],
        }]);
        void loadConversations();
      }
    } finally {
      setSending(false);
    }
  }

  // ── Message actions ───────────────────────────────────────────────────────

  async function updateMessageStatus(msgId: number, status: MessageStatus) {
    setOpenMenuId(null);
    const res = await fetch(`/api/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    }
  }

  async function softDeleteMessage(msgId: number) {
    setOpenMenuId(null);
    const res = await fetch(`/api/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ softDelete: true }),
    });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId
        ? { ...m, deletedAt: new Date().toISOString(), plaintext: undefined, ciphertext: '', iv: '' }
        : m));
    }
  }

  async function submitEdit() {
    if (!editingMsg || !draft.trim() || !otherUserPublicKey) return;
    const { ciphertext, iv } = await encryptMessage(draft.trim(), otherUserPublicKey);
    const res = await fetch(`/api/messages/${editingMsg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ciphertext, iv }),
    });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === editingMsg.id
        ? { ...m, plaintext: draft.trim(), editedAt: new Date().toISOString() }
        : m));
      setEditingMsg(null);
      setDraft('');
    }
  }

  async function toggleReaction(msgId: number, emoji: string) {
    setReactionPickerMsgId(null);
    const res = await fetch(`/api/messages/${msgId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) return;
    const data = await res.json() as { action: 'added' | 'removed'; emoji: string };
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions ?? [];
      if (data.action === 'added') {
        const idx = existing.findIndex(r => r.emoji === emoji);
        if (idx >= 0) {
          const updated = [...existing];
          updated[idx] = { ...updated[idx], count: updated[idx].count + 1, userIds: [...updated[idx].userIds, myId] };
          return { ...m, reactions: updated };
        }
        return { ...m, reactions: [...existing, { emoji, count: 1, userIds: [myId] }] };
      } else {
        return { ...m, reactions: existing.map(r => r.emoji === emoji
          ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== myId) }
          : r).filter(r => r.count > 0) };
      }
    }));
  }

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (!isPending && !session) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageCircle className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.signInPrompt}</p>
          <Button onClick={() => navigate('/login')} className="bg-primary text-primary-foreground">
            {pageContent.signInButton}
          </Button>
        </div>
      </main>
    );
  }

  const totalUnread = (Array.isArray(conversations) ? conversations : []).reduce((n, c) => n + c.unreadCount, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !inboxSearch || (
      (conv.otherUser?.name ?? '').toLowerCase().includes(inboxSearch.toLowerCase()) ||
      (conv.otherUser?.username ?? '').toLowerCase().includes(inboxSearch.toLowerCase())
    );
    const matchesFilter = inboxFilter === 'all' || conv.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Helmet>
        <title>{pageContent.title} — Spellful</title>
        <meta name="description" content="Private encrypted messages between Spellful members." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Horoscope popup removed — now shown as inline strip in sidebar */}

      {/* ── Mobile: full-screen native-feel stack ── Desktop: two-panel card ── */}
      <div className="md:max-w-5xl md:mx-auto md:px-4 md:py-8">

        {/* ════════════════════════════════════════════════
            MOBILE CONVERSATION LIST
        ════════════════════════════════════════════════ */}
        <div className={`flex flex-col md:hidden ${mobileView === 'thread' ? 'hidden' : ''}`}
          style={{ minHeight: 'calc(100dvh - 4rem)' }}>

          {/* List header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div>
              <h1 className="font-serif text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Messages
                {totalUnread > 0 && (
                  <span className="ml-2 text-xs font-sans px-2 py-0.5 rounded-full align-middle"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    {totalUnread}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Private conversation</span>
              </div>
            </div>
            <button
              onClick={() => { setShowCompose(v => !v); setComposeQuery(''); setComposeResults([]); }}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{
                background: showCompose ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                color: showCompose ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
                border: showCompose ? '1px solid hsl(var(--border))' : 'none',
              }}
              aria-label={showCompose ? 'Cancel' : 'New message'}>
              {showCompose ? <XIcon className="w-4 h-4" /> : <PenSquare className="w-4 h-4" />}
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                type="search"
                value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-2xl outline-none transition-colors"
                style={{
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              {inboxSearch && (
                <button
                  onClick={() => setInboxSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
                  aria-label="Clear search">
                  <XIcon className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 pb-2">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setInboxFilter(f)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: inboxFilter === f ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  color: inboxFilter === f ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  border: inboxFilter === f ? 'none' : '1px solid hsl(var(--border))',
                }}>
                {f === 'all' ? 'All' : 'Unread' + (totalUnread > 0 ? ' (' + totalUnread + ')' : '')}
              </button>
            ))}
          </div>

          {/* ── Horoscope inline strip (mobile) ── */}
          {horoscope && (
            <div className="mx-4 mb-2 px-3 py-2.5 rounded-2xl flex items-center gap-2.5"
              style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--primary))' }}>
                  {horoscope.sign} · {horoscope.headline}
                </p>
              </div>
              <button
                onClick={() => navigate('/horoscope')}
                className="text-xs flex-shrink-0 transition-opacity hover:opacity-70"
                style={{ color: 'hsl(var(--primary))' }}>
                View
              </button>
            </div>
          )}

          {/* ── Inline compose panel (mobile) ── */}
          <AnimatePresence>
            {showCompose && (
              <motion.div
                key="inline-compose-mobile"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mx-4 mb-2 rounded-2xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>New Message</p>
                    <button
                      onClick={() => setShowCompose(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                      aria-label="Close">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search by name or @username…"
                      value={composeQuery}
                      onChange={e => setComposeQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: 'hsl(var(--muted))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                    {composeSearching && (
                      <p className="text-sm text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Searching…</p>
                    )}
                    {!composeSearching && composeQuery.length >= 2 && composeResults.length === 0 && (
                      <p className="text-sm text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>No members found</p>
                    )}
                    {!composeSearching && composeQuery.length < 2 && (
                      <p className="text-sm text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Type 2+ characters to search</p>
                    )}
                    {composeResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => void startConversationWith(u)}
                        disabled={composeStarting === u.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                        style={{ opacity: composeStarting === u.id ? 0.6 : 1 }}>
                        <Avatar user={u} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {u.name ?? u.username ?? 'Unknown'}
                          </p>
                          {u.username && (
                            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>@{u.username}</p>
                          )}
                        </div>
                        {composeStarting === u.id ? (
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Opening…</span>
                        ) : (
                          <Send className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowCompose(false); navigate('/community/discover'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-80"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Users className="w-4 h-4" />
                    Browse member directory
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation rows */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex flex-col gap-0 px-0 pt-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3.5 px-5 py-3.5 animate-pulse"
                    style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                    <div className="w-13 h-13 rounded-full flex-shrink-0" style={{ width: 52, height: 52, background: 'hsl(var(--muted))' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full w-1/3" style={{ background: 'hsl(var(--muted))' }} />
                      <div className="h-2.5 rounded-full w-2/3" style={{ background: 'hsl(var(--muted))' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-8 pt-16 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--muted))' }}>
                  <MessageCircle className="w-9 h-9" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <p className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>No messages yet</p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Visit the Community to find members and start a conversation.
                </p>
                <button
                  onClick={() => navigate('/community')}
                  className="mt-2 px-6 py-2.5 rounded-full text-sm font-medium transition-opacity active:opacity-70"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Go to Community
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
                <MessageCircle className="w-10 h-10 opacity-30" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  {inboxSearch ? 'No conversations match your search' : 'No unread messages'}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {inboxSearch ? 'Try a different name or username' : 'You’re all caught up'}
                </p>
                {inboxFilter === 'unread' && (
                  <button onClick={() => setInboxFilter('all')} className="text-xs underline mt-1" style={{ color: 'hsl(var(--primary))' }}>
                    Show all conversations
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv, idx) => (
                  <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => conv.otherUser && void openConversation(conv.id, conv.otherUser)}
                  className="w-full flex items-center gap-3.5 px-5 py-4 text-left active:opacity-60 transition-opacity"
                  style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                  <a
                    href={conv.otherUser?.username ? `/profile/${conv.otherUser.username}` : undefined}
                    onClick={e => e.stopPropagation()}
                    className="relative flex-shrink-0"
                    aria-label={conv.otherUser?.username ? `View ${conv.otherUser.name ?? conv.otherUser.username}'s profile` : undefined}>
                    <Avatar user={conv.otherUser} size={52} />
                    {conv.otherUser && (
                      <div className="absolute bottom-0 right-0">
                        <OnlineDot userId={conv.otherUser.id} size={12} />
                      </div>
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={'text-sm truncate ' + (conv.unreadCount > 0 ? 'font-semibold' : 'font-medium')}
                        style={{ color: 'hsl(var(--foreground))' }}>
                        {conv.otherUser?.name ?? conv.otherUser?.username ?? 'Unknown'}
                      </span>
                      {conv.lastMessage && (
                        <span className={'text-xs flex-shrink-0 ' + (conv.unreadCount > 0 ? 'font-semibold' : '')}
                          style={{ color: conv.unreadCount > 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5 gap-2">
                      <span className={'text-xs truncate ' + (conv.unreadCount > 0 ? 'font-medium' : '')}
                        style={{ color: conv.unreadCount > 0 ? 'hsl(var(--foreground) / 0.85)' : 'hsl(var(--muted-foreground))' }}>
                        {conv.lastMessage ? (conv.lastMessage.systemMessage ? '✨ Welcome to Spellful!' : '🔒 Encrypted message') : 'No messages yet'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-semibold"
                          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* Install banner — shared component */}
          <div className="mx-4 mb-2">
            <InstallBanner />
          </div>

          {/* Test notification button — shown when notifications are granted */}
          {isInstalled && typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
            <div className="px-4 pb-2">
              <button
                onClick={() => void sendTestNotification()}
                disabled={testNotifStatus === 'sending'}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-medium transition-opacity active:opacity-70 disabled:opacity-50"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                {testNotifStatus === 'sending' && '⏳ Sending…'}
                {testNotifStatus === 'sent' && '✅ Alert sent — check your notifications!'}
                {testNotifStatus === 'error' && '❌ Failed — make sure you\'re subscribed'}
                {testNotifStatus === 'idle' && '🔔 Test push notification'}
              </button>
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex gap-2 px-4 py-3"
            style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <button
              onClick={() => { setShowCompose(v => !v); setComposeQuery(''); setComposeResults([]); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-opacity active:opacity-70"
              style={{
                background: showCompose ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                color: showCompose ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
                border: showCompose ? '1px solid hsl(var(--border))' : 'none',
              }}>
              {showCompose ? <XIcon className="w-4 h-4" /> : <PenSquare className="w-4 h-4" />}
              {showCompose ? 'Cancel' : 'New Message'}
            </button>
            <button
              onClick={() => {
                if (activeConvId) {
                  void switchFolder('drafts');
                  setMobileView('thread');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-opacity active:opacity-70"
              style={{
                background: 'hsl(var(--muted))',
                color: activeConvId ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
                opacity: activeConvId ? 1 : 0.5,
              }}>
              <FileText className="w-4 h-4" />
              Drafts
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            MOBILE THREAD VIEW (full-screen slide-in)
        ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {mobileView === 'thread' && (
            <motion.div
              key="thread"
              className="md:hidden fixed inset-0 flex flex-col"
              style={{ background: 'hsl(var(--background))', zIndex: 50 }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }}>

              {/* Thread top bar */}
              <div className="flex items-center gap-2 px-4 pb-3"
                style={{
                  paddingTop: '12px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}>
                <button
                  onClick={() => setMobileView('list')}
                  className="flex items-center gap-0.5 -ml-1 py-1 pr-2 rounded-lg active:opacity-60 transition-opacity"
                  aria-label="Back">
                  <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>Back</span>
                </button>
                <a
                  href={activeOtherUser?.username ? `/profile/${activeOtherUser.username}` : undefined}
                  className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer"
                  aria-label={activeOtherUser?.username ? `View ${activeOtherUser.name ?? activeOtherUser.username}'s profile` : undefined}>
                  <Avatar user={activeOtherUser} size={32} />
                  <p className="text-sm font-semibold leading-tight hover:underline" style={{ color: 'hsl(var(--foreground))' }}>
                    {activeOtherUser?.name ?? activeOtherUser?.username ?? 'Unknown'}
                  </p>
                  <AnimatePresence mode="wait">
                    {otherIsTyping ? (
                      <motion.p key="typing-m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs leading-tight" style={{ color: 'hsl(var(--primary))' }}>
                        typing…
                      </motion.p>
                    ) : activeOtherUser?.username ? (
                      <motion.p key="username-m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        @{activeOtherUser.username}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </a>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSearch(v => !v)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: showSearch ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                      color: showSearch ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}
                    aria-label="Search messages">
                    <Search className="w-4 h-4" />
                  </button>
                  {isCoven && (
                    <button
                      onClick={() => setShowWallpaperMobile(v => !v)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: showWallpaperMobile ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                        color: showWallpaperMobile ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      }}
                      aria-label="Chat appearance">
                      <Palette className="w-4 h-4" />
                    </button>
                  )}
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--success))' }} />
                </div>
              </div>

              {/* ── Phase 5: Mobile search panel ── */}
              <AnimatePresence>
                {showSearch && (
                  <MessengerSearchPanel
                    messages={messages}
                    myId={myId}
                    otherUserName={activeOtherUser?.name ?? activeOtherUser?.username ?? 'Them'}
                    onClose={() => setShowSearch(false)}
                    onJumpTo={scrollToMessage}
                  />
                )}
              </AnimatePresence>

              {/* ── Mobile inline wallpaper panel ── */}
              <AnimatePresence>
                {showWallpaperMobile && activeConvId !== null && (
                  <motion.div
                    key="wallpaper-mobile-inline"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <MessengerWallpaperPicker
                      conversationId={activeConvId}
                      current={wallpaper}
                      onClose={() => setShowWallpaperMobile(false)}
                      onSave={(prefs) => { setWallpaper(prefs); setShowWallpaperMobile(false); void fetch(`/api/conversations/${activeConvId}/wallpaper`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(prefs) }); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Folder tabs */}
              <div className="flex items-center gap-1 px-4 pt-2 pb-0"
                style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                {([
                  { id: 'inbox', label: 'Inbox', icon: Inbox },
                  { id: 'requests', label: 'Requests', icon: UserCheck },
                  { id: 'drafts', label: 'Drafts', icon: FileText },
                  { id: 'trash', label: 'Trash', icon: Trash2 },
                ] as { id: Folder; label: string; icon: LucideIcon }[]).map(tab => (
                  <button key={tab.id} onClick={() => void switchFolder(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg transition-colors"
                    style={{
                      color: folder === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      borderBottom: folder === tab.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    }}>
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative" onClick={() => setOpenMenuId(null)}>
                {/* Wallpaper background */}
                {(() => {
                  const theme = MESSENGER_THEMES.find(t => t.id === wallpaper.themeId);
                  const bgStyle: React.CSSProperties = wallpaper.themeId === 'custom' && wallpaper.customImageUrl
                    ? { backgroundImage: `url(${wallpaper.customImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'local' }
                    : theme?.backgroundStyle
                      ? { background: theme.backgroundStyle }
                      : {};
                  return Object.keys(bgStyle).length > 0 ? (
                    <>
                      <div className="absolute inset-0 pointer-events-none" style={{
                        ...bgStyle,
                        ...(wallpaper.blurAmount > 0 ? { filter: `blur(${wallpaper.blurAmount}px)`, transform: 'scale(1.05)' } : {}),
                      }} />
                      {wallpaper.dimAmount > 0 && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ background: `hsl(var(--background) / ${wallpaper.dimAmount / 100})` }} />
                      )}
                    </>
                  ) : null;
                })()}
                <div className="flex items-center justify-center gap-1.5 py-1 mb-1">
                  {folder === 'inbox' && (
                    <><Lock className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Private conversation</span></>
                  )}
                  {folder === 'requests' && (
                    <><UserCheck className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Message requests — review before accepting</span></>
                  )}
                  {folder === 'drafts' && (
                    <><FileText className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Drafts — only visible to you</span></>
                  )}
                  {folder === 'trash' && (
                    <><Trash2 className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Trash — only visible to you</span></>
                  )}
                </div>

                {loadingMsgs ? (
                  <div className="flex flex-col gap-3 pt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
                        <div className="h-10 rounded-3xl" style={{ width: `${40 + i * 15}%`, background: 'hsl(var(--muted))' }} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {folder === 'drafts' ? 'No drafts.' : folder === 'trash' ? 'Trash is empty.' : pageContent.emptyMessages}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === myId;
                      const isSystem = !!msg.systemMessage;
                      const prevMsgM: Message | undefined = idx > 0 ? messages[idx - 1] : undefined;
                      const showDateSepM = !prevMsgM || new Date(msg.createdAt).toDateString() !== new Date(prevMsgM.createdAt).toDateString();
                      const isLastMineM = isMine && !isSystem && messages.slice(idx + 1).every(m => m.senderId !== myId || !!m.systemMessage);
                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSepM && (
                            <div className="flex items-center gap-3 py-2">
                              <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}>{formatDateLabel(msg.createdAt)}</span>
                              <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.18 }}
                            id={`msg-${msg.id}`}
                            className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                          <div className={isSystem ? 'w-full' : 'max-w-[78%]'} style={{ marginLeft: isSystem ? 'auto' : undefined, marginRight: isSystem ? 'auto' : undefined }}>
                            <div className="relative group">
                              {isSystem ? (
                                <div className="rounded-2xl overflow-hidden"
                                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                                  <img
                                    src="/airo-assets/images/logo/official-white"
                                    alt="Welcome to Spellful"
                                    className="w-full object-cover"
                                    style={{ maxHeight: 160 }}
                                    loading="eager"
                                  />
                                  <div className="px-4 py-3 text-sm whitespace-pre-line"
                                    style={{ color: 'hsl(var(--foreground))', lineHeight: 1.7, fontFamily: 'var(--font-sans)' }}>
                                    {msg.plaintext}
                                  </div>
                                  <div className="px-4 pb-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {formatTime(msg.createdAt)}
                                  </div>
                                </div>
                              ) : (
                              <div>
                                {/* Reply-to quote */}
                                {msg.replyToId && (() => {
                                  const quoted = messages.find(m => m.id === msg.replyToId);
                                  return quoted ? (
                                    <div className="mb-1 px-3 py-1.5 rounded-xl text-xs opacity-70 border-l-2"
                                      style={{
                                        background: isMine ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--card))',
                                        borderLeftColor: 'hsl(var(--accent))',
                                        color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                      }}>
                                      <span className="font-medium mr-1">{quoted.senderId === myId ? 'You' : 'Them'}:</span>
                                      <span className="line-clamp-1">{quoted.deletedAt ? 'Message deleted' : (quoted.plaintext ?? '🔒')}</span>
                                    </div>
                                  ) : null;
                                })()}
                                {/* Bubble */}
                                <div className="px-4 py-2.5 text-sm leading-relaxed"
                                  style={{
                                    background: msg.deletedAt ? 'transparent' : msg.status === 'draft' ? 'hsl(var(--muted))' : isMine ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                                    color: msg.deletedAt ? 'hsl(var(--muted-foreground))' : msg.status === 'draft' ? 'hsl(var(--muted-foreground))' : isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                                    borderRadius: isMine ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                    opacity: msg.status === 'draft' ? 0.8 : 1,
                                    border: msg.deletedAt ? '1px dashed hsl(var(--border))' : msg.status === 'draft' ? '1px dashed hsl(var(--border))' : isMine ? 'none' : '1px solid hsl(var(--border))',
                                    boxShadow: msg.deletedAt ? 'none' : '0 1px 4px hsl(var(--background) / 0.4)',
                                    fontStyle: msg.deletedAt ? 'italic' : undefined,
                                  }}>
                                  {msg.deletedAt ? 'Message deleted' : (msg.plaintext ?? '🔒 Encrypted')}
                                  {msg.status === 'draft' && !msg.deletedAt && (
                                    <span className="ml-2 text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>Draft</span>
                                  )}
                                </div>
                              </div>
                              )}
                              {/* Long-press / hover action row */}
                              {!isSystem && !msg.deletedAt && (
                                <div className={'absolute -top-8 flex items-center gap-1 ' + (isMine ? 'right-0' : 'left-0') + ' opacity-0 group-hover:opacity-100 transition-opacity z-10'}>
                                  {/* Reaction picker */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id); }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                      aria-label="React">
                                      😊
                                    </button>
                                    <AnimatePresence>
                                      {reactionPickerMsgId === msg.id && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.85 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.85 }}
                                          className={'absolute bottom-9 flex gap-1 px-2 py-1.5 rounded-2xl shadow-xl z-30 ' + (isMine ? 'right-0' : 'left-0')}
                                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                          onClick={e => e.stopPropagation()}>
                                          {['👍', '❤️', '✨', '🌙'].map(emoji => {
                                            const myReaction = msg.reactions?.find(r => r.emoji === emoji && r.userIds.includes(myId));
                                            return (
                                              <button key={emoji} onClick={() => void toggleReaction(msg.id, emoji)}
                                                className="text-lg w-8 h-8 flex items-center justify-center rounded-full"
                                                style={{ background: myReaction ? 'hsl(var(--primary) / 0.2)' : 'transparent' }}
                                                aria-label={emoji}>
                                                {emoji}
                                              </button>
                                            );
                                          })}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  {/* Reply */}
                                  <button
                                    onClick={() => { setReplyTo(msg); setReactionPickerMsgId(null); }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                    aria-label="Reply">
                                    <CornerUpLeft className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Menu (own messages) */}
                                  {isMine && (
                                    <div className="relative">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                                        className="w-7 h-7 rounded-full flex items-center justify-center"
                                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                        aria-label="Message options">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>
                                      {openMenuId === msg.id && (
                                        <div className={'absolute bottom-9 z-20 rounded-2xl shadow-xl py-1 min-w-[160px] ' + (isMine ? 'right-0' : 'left-0')}
                                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                          onClick={e => e.stopPropagation()}>
                                          {msg.status === 'sent' && (
                                            <button onClick={() => { setEditingMsg(msg); setDraft(msg.plaintext ?? ''); setOpenMenuId(null); }}
                                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80"
                                              style={{ color: 'hsl(var(--foreground))' }}>
                                              <Pencil className="w-3.5 h-3.5" />Edit
                                            </button>
                                          )}
                                          {msg.status === 'draft' && (
                                            <button onClick={() => void updateMessageStatus(msg.id, 'sent')}
                                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80"
                                              style={{ color: 'hsl(var(--success))' }}>
                                              <Send className="w-3.5 h-3.5" />Send now
                                            </button>
                                          )}
                                          {msg.status === 'trashed' && (
                                            <button onClick={() => void updateMessageStatus(msg.id, 'sent')}
                                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80"
                                              style={{ color: 'hsl(var(--foreground))' }}>
                                              <RotateCcw className="w-3.5 h-3.5" />Restore
                                            </button>
                                          )}
                                          {msg.status !== 'trashed' && (
                                            <button onClick={() => void updateMessageStatus(msg.id, 'trashed')}
                                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80"
                                              style={{ color: 'hsl(var(--warning))' }}>
                                              <Trash2 className="w-3.5 h-3.5" />Move to trash
                                            </button>
                                          )}
                                          <button onClick={() => void softDeleteMessage(msg.id)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80"
                                            style={{ color: 'hsl(var(--destructive))' }}>
                                            <Trash2 className="w-3.5 h-3.5" />Delete for everyone
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Reactions row */}
                            {!isSystem && (msg.reactions?.length ?? 0) > 0 && (
                              <div className={'flex flex-wrap gap-1 mt-1 ' + (isMine ? 'justify-end' : 'justify-start')}>
                                {(msg.reactions ?? []).map(r => (
                                  <button key={r.emoji} onClick={() => void toggleReaction(msg.id, r.emoji)}
                                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs"
                                    style={{
                                      background: r.userIds.includes(myId) ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                                      border: r.userIds.includes(myId) ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                                      color: 'hsl(var(--foreground))',
                                    }}>
                                    <span>{r.emoji}</span>
                                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {!isSystem && (
                            <div className={'flex items-center gap-1.5 text-xs px-1 ' + (isMine ? 'justify-end' : 'justify-start')}
                              style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {formatTime(msg.createdAt)}
                              {msg.editedAt && !msg.deletedAt && <span className="italic">· edited</span>}
                              {isMine && isLastMineM && (
                                <span className="flex items-center gap-0.5">
                                  {(lastReadMsgId !== null && msg.id <= lastReadMsgId) || msg.readAt
                                    ? <><CheckCheck className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} /><span style={{ color: 'hsl(var(--success))' }}>Read</span></>
                                    : <><Check className="w-3 h-3" /><span>Sent</span></>
                                  }
                                </span>
                              )}
                            </div>
                            )}
                          </div>
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                    {otherIsTyping && (
                      <motion.div
                        key="typing-mobile"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="flex justify-start">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[20px_20px_20px_5px]"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', maxWidth: '80px' }}>
                          <span className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{ background: 'hsl(var(--muted-foreground))', animationDelay: i * 0.15 + 's' }} />
                            ))}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                {/* Coven accepted notification */}
                {covenStatus === 'accepted' && messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-1 py-6 px-4 text-center">
                    <span className="text-2xl">✨</span>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>
                      You're now Coven friends with {activeOtherUser?.name ?? activeOtherUser?.username ?? 'them'}!
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Send your first message.</p>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Coven connection banner — shown when not yet accepted friends */}
              {folder === 'inbox' && covenStatus !== 'accepted' && (
                <div className="px-4 py-3 flex flex-col gap-2"
                  style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                  {covenStatus === null && (
                    <>
                      <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        You're not Coven friends yet. Send a request to unlock full messaging.
                      </p>
                      <button
                        onClick={() => void handleCovenAction('send')}
                        className="w-full py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        Send Coven Request
                      </button>
                    </>
                  )}
                  {covenStatus === 'pending_sent' && (
                    <p className="text-xs text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ✨ Coven request sent — waiting for {activeOtherUser?.name ?? activeOtherUser?.username ?? 'them'} to accept.
                    </p>
                  )}
                  {covenStatus === 'pending_received' && (
                    <>
                      <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {activeOtherUser?.name ?? activeOtherUser?.username ?? 'They'} sent you a Coven request.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleCovenAction('accept')}
                          className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          Accept
                        </button>
                        <button
                          onClick={() => void handleCovenAction('decline')}
                          className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'hsl(var(--muted-foreground) / 0.2)', color: 'hsl(var(--foreground))' }}>
                          Decline
                        </button>
                      </div>
                    </>
                  )}
                  {covenStatus === 'declined' && (
                    <p className="text-xs text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Coven request was declined.
                    </p>
                  )}
                </div>
              )}

              {/* Sticky input bar — always shown in inbox regardless of Coven status */}
              {folder === 'inbox' && (
                <div className="px-4 py-3"
                  style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <>
                      {/* Reply/edit context bar */}
                      <AnimatePresence>
                        {replyTo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
                            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                            <CornerUpLeft className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                            <span className="text-xs flex-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                {replyTo.senderId === myId ? 'You' : (activeOtherUser?.name ?? 'Them')}:
                              </span>{' '}{replyTo.plaintext ?? '🔒'}
                            </span>
                            <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"
                              style={{ color: 'hsl(var(--muted-foreground))' }}>
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                        {editingMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
                            style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                            <Pencil className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-xs flex-1" style={{ color: 'hsl(var(--primary))' }}>Editing message</span>
                            <button onClick={() => { setEditingMsg(null); setDraft(''); }} aria-label="Cancel edit"
                              style={{ color: 'hsl(var(--primary))' }}>
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }}
                        className="flex items-center gap-2">
                        <input
                          ref={inputRef}
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          placeholder={editingMsg ? 'Edit your message…' : 'Message…'}
                          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                          style={{
                            background: 'hsl(var(--muted))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                          }}
                          maxLength={2000}
                          autoComplete="off"
                        />
                        <motion.button
                          type="submit"
                          disabled={!draft.trim() || sending || !otherUserPublicKey}
                          whileTap={{ scale: 0.88 }}
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          {editingMsg ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </motion.button>
                      </form>
                    </>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════
            DESKTOP TWO-PANEL LAYOUT
        ════════════════════════════════════════════════ */}
        <div className="hidden md:flex rounded-2xl overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', minHeight: 560 }}>

          {/* Desktop sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <p className="font-serif text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Messages
                  {totalUnread > 0 && (
                    <span className="ml-2 text-xs font-sans px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      {totalUnread}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Encrypted</span>
                </div>
              </div>
              <button
                onClick={() => { setShowCompose(v => !v); setComposeQuery(''); setComposeResults([]); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                style={{
                  background: showCompose ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                  color: showCompose ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
                  border: showCompose ? '1px solid hsl(var(--border))' : 'none',
                }}
                aria-label={showCompose ? 'Cancel' : 'New message'}>
                {showCompose ? <XIcon className="w-3.5 h-3.5" /> : <PenSquare className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* ── Inline compose panel (desktop) ── */}
            <AnimatePresence>
              {showCompose && (
                <motion.div
                  key="inline-compose-desktop"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium px-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      New direct message
                    </p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                        style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search by name or @username…"
                        value={composeQuery}
                        onChange={e => setComposeQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                        style={{
                          background: 'hsl(var(--muted))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                      {composeSearching && (
                        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Searching…</p>
                      )}
                      {!composeSearching && composeQuery.length >= 2 && composeResults.length === 0 && (
                        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>No members found</p>
                      )}
                      {!composeSearching && composeQuery.length < 2 && (
                        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Type 2+ characters to search</p>
                      )}
                      {composeResults.map(u => (
                        <button
                          key={u.id}
                          onClick={() => void startConversationWith(u)}
                          disabled={composeStarting === u.id}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors"
                          style={{ opacity: composeStarting === u.id ? 0.6 : 1, background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <Avatar user={u} size={30} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                              {u.name ?? u.username ?? 'Unknown'}
                            </p>
                            {u.username && (
                              <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>@{u.username}</p>
                            )}
                          </div>
                          {composeStarting === u.id ? (
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>…</span>
                          ) : (
                            <Send className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { setShowCompose(false); navigate('/community/discover'); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Users className="w-3.5 h-3.5" />
                      Browse member directory
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Desktop sidebar folder tabs ── */}
            <div className="flex items-center gap-0 px-3 pt-2 pb-0"
              style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {([
                { id: 'inbox' as Folder, label: 'Chats' },
                { id: 'requests' as Folder, label: 'Requests', badge: msgRequests.length },
                { id: 'drafts' as Folder, label: 'More' },
              ]).map(tab => (
                <button key={tab.id} onClick={() => void switchFolder(tab.id)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative"
                  style={{
                    color: folder === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    borderBottom: folder === tab.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  }}>
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
                      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Horoscope strip (desktop sidebar) ── */}
            {horoscope && (
              <div className="mx-3 mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: 'hsl(var(--primary) / 0.07)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
                <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                <p className="text-xs flex-1 truncate" style={{ color: 'hsl(var(--primary))' }}>
                  {horoscope.sign} · {horoscope.headline}
                </p>
                <button onClick={() => navigate('/horoscope')}
                  className="text-xs flex-shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(var(--primary))' }}>
                  View
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {/* Message Requests panel */}
              {folder === 'requests' && (
                <div className="p-4 space-y-3">
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    These members want to message you. Accept to move them to your inbox, or decline to remove the request.
                  </p>
                  {!msgRequestsLoaded ? (
                    <button
                      className="text-xs underline"
                      style={{ color: 'hsl(var(--primary))' }}
                      onClick={() => {
                        setMsgRequestsLoaded(true);
                        fetch('/api/message-requests', { credentials: 'include' })
                          .then(r => r.ok ? r.json() : null)
                          .then((d: { requests?: MsgRequest[] } | null) => { if (d?.requests) setMsgRequests(d.requests); })
                          .catch(() => undefined);
                      }}
                    >
                      Load requests
                    </button>
                  ) : msgRequests.length === 0 ? (
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No pending message requests.</p>
                  ) : (
                    msgRequests.map(req => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'hsl(var(--muted))' }}>
                          {req.requesterImage ? (
                            <img src={req.requesterImage} alt={req.requesterName ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {(req.requesterName ?? req.requesterUsername ?? '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {req.requesterName ?? req.requesterUsername ?? 'Unknown member'}
                          </p>
                          {req.requesterUsername && (
                            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>@{req.requesterUsername}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button size="sm" disabled={requestActionId === req.id}
                            className="h-7 text-xs"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                            onClick={async () => {
                              setRequestActionId(req.id);
                              try {
                                const r = await fetch(`/api/message-requests/${req.id}/accept`, { method: 'POST', credentials: 'include' });
                                if (r.ok) {
                                  setMsgRequests(prev => prev.filter(x => x.id !== req.id));
                                  void switchFolder('inbox');
                                }
                              } finally { setRequestActionId(null); }
                            }}>
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" disabled={requestActionId === req.id}
                            className="h-7 text-xs"
                            onClick={async () => {
                              setRequestActionId(req.id);
                              try {
                                await fetch(`/api/message-requests/${req.id}/decline`, { method: 'POST', credentials: 'include' });
                                setMsgRequests(prev => prev.filter(x => x.id !== req.id));
                              } finally { setRequestActionId(null); }
                            }}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {folder !== 'requests' && loadingConvs ? (
                <div className="p-6 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
              ) : folder !== 'requests' && conversations.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.emptyConversations}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.emptyConversationsHint}</p>
                </div>
              ) : folder === 'requests' ? null : (
                conversations.map(conv => (
                  <button key={conv.id}
                    onClick={() => conv.otherUser && void openConversation(conv.id, conv.otherUser)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
                    style={{
                      background: activeConvId === conv.id ? 'hsl(var(--muted))' : 'transparent',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}>
                    <a
                      href={conv.otherUser?.username ? `/profile/${conv.otherUser.username}` : undefined}
                      onClick={e => e.stopPropagation()}
                      className="relative flex-shrink-0"
                      aria-label={conv.otherUser?.username ? `View ${conv.otherUser.name ?? conv.otherUser.username}'s profile` : undefined}>
                      <Avatar user={conv.otherUser} size={40} />
                      {conv.otherUser && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <OnlineDot userId={conv.otherUser.id} size={10} />
                        </div>
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : ''}`}
                          style={{ color: 'hsl(var(--foreground))' }}>
                          {conv.otherUser?.name ?? conv.otherUser?.username ?? 'Unknown'}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs flex-shrink-0 ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {conv.lastMessage ? (conv.lastMessage.systemMessage ? '✨ Welcome to Spellful!' : '🔒 Encrypted message') : 'No messages yet'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="ml-1 flex-shrink-0 text-xs w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Desktop footer bar */}
            <div className="flex gap-2 p-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <button
                onClick={() => { setShowCompose(v => !v); setComposeQuery(''); setComposeResults([]); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-90"
                style={{
                  background: showCompose ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--primary))',
                  color: showCompose ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground))',
                  border: showCompose ? '1px solid hsl(var(--primary) / 0.4)' : 'none',
                }}>
                <PenSquare className="w-3.5 h-3.5" />
                {showCompose ? 'Cancel' : 'New Message'}
              </button>
              <button
                onClick={() => { if (activeConvId) void switchFolder('drafts'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                <FileText className="w-3.5 h-3.5" />
                Drafts
              </button>
            </div>
          </div>

          {/* Desktop thread panel */}
          <div className="flex-1 flex flex-col">
            {!activeConvId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--muted))' }}>
                  <Lock className="w-7 h-7" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
                <p className="font-serif text-lg" style={{ color: 'hsl(var(--foreground))' }}>{pageContent.emptyThread}</p>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pageContent.emptyThreadHint}</p>
              </div>
            ) : (
              <DesktopThread
                activeOtherUser={activeOtherUser}
                messages={messages}
                loadingMsgs={loadingMsgs}
                folder={folder}
                switchFolder={switchFolder}
                myId={myId}
                draft={draft}
                setDraft={setDraft}
                sending={sending}
                handleSend={handleSend}
                otherUserPublicKey={otherUserPublicKey}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                updateMessageStatus={updateMessageStatus}
                bottomRef={bottomRef}
                inputRef={inputRef}
                otherIsTyping={otherIsTyping}
                lastReadMsgId={lastReadMsgId}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                editingMsg={editingMsg}
                setEditingMsg={setEditingMsg}
                reactionPickerMsgId={reactionPickerMsgId}
                setReactionPickerMsgId={setReactionPickerMsgId}
                toggleReaction={toggleReaction}
                softDeleteMessage={softDeleteMessage}
                wallpaper={wallpaper}
                isCoven={isCoven}
                covenStatus={covenStatus}
                covenConnectionId={covenConnectionId}
                onCovenAction={handleCovenAction}
                onOpenWallpaperPicker={() => { /* inline only */ }}
                onSaveWallpaper={(prefs) => { setWallpaper(prefs); void fetch(`/api/conversations/${activeConvId}/wallpaper`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(prefs) }); }}
                activeConvId={activeConvId}
                showSearch={showSearch}
                onToggleSearch={() => setShowSearch(v => !v)}
                onSearchJump={scrollToMessage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Compose modal removed — inline compose is now in the sidebar */}

      {/* Visit Site button removed per UX brief — was obstructing composer */}

      {/* Wallpaper picker modal removed — now inline in thread header */}
    </>
  );
}
