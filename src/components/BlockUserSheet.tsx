/**
 * BlockUserSheet — discreet confirmation sheet for blocking a member.
 * Never uses confrontational language. Never notifies the blocked member.
 */
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';

interface BlockUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display name of the member being blocked */
  displayName: string;
  /** User ID of the member being blocked */
  userId: string;
  /** Called after the block is successfully applied */
  onBlocked?: () => void;
}

export function BlockUserSheet({ open, onOpenChange, displayName, userId, onBlocked }: BlockUserSheetProps) {
  const [loading, setLoading] = useState(false);

  async function handleBlock() {
    setLoading(true);
    try {
      await fetch('/api/community/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      onOpenChange(false);
      onBlocked?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldOff className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <SheetTitle className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Restrict {displayName}
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Restricting this member will:
          </SheetDescription>
        </SheetHeader>

        <ul className="space-y-2 mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {[
            'Remove any existing Coven connection',
            'Prevent them from messaging you',
            'Hide their posts and activity from your view',
            'Keep your profile and content private from them',
            'They will not be notified',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'hsl(var(--muted-foreground))' }} />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleBlock}
            disabled={loading}
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
          >
            {loading ? 'Applying…' : 'Restrict Member'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
