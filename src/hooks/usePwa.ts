/**
 * usePwa — registers the service worker and requests push permission
 * once the user is confirmed signed-in. Call once from the messages page.
 */
import { useEffect, useRef } from 'react';
import { registerServiceWorker, requestPushPermission } from '@/lib/pwa';

export function usePwa(isSignedIn: boolean) {
  const done = useRef(false);

  useEffect(() => {
    if (!isSignedIn || done.current) return;
    done.current = true;

    async function setup() {
      const reg = await registerServiceWorker();
      if (!reg) return;

      // Small delay so the page feels settled before the permission prompt
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      await requestPushPermission(reg);
    }

    void setup();
  }, [isSignedIn]);
}
