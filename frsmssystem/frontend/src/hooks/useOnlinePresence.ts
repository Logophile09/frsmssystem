import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface OnlineUser {
  id: string;
  full_name: string;
  role: string;
  online_at: string;
}

// A single shared Realtime channel that every signed-in browser tab joins.
// Presence is pushed live (join/leave/sync events) -- no polling needed.
// This is independent of the Express backend/CORS: it talks straight to
// Supabase Realtime over a websocket, so it keeps working even if the
// backend is unreachable and the rest of the app has fallen back to demo
// data (see api.ts's withFallback()).
const CHANNEL_NAME = 'frsms-online-users';

export function useOnlinePresence() {
  const { session, profile, demoMode } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    // Demo Mode has no real Supabase Auth session to authenticate the
    // realtime connection with, and there's no one else genuinely "online"
    // to show -- so we just show nobody rather than a fake presence list.
    if (demoMode || !session || !profile) {
      setOnlineUsers([]);
      return;
    }

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: profile.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>();
        const users = Object.values(state)
          .flat()
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: profile.id,
            full_name: profile.full_name,
            role: profile.role,
            online_at: new Date().toISOString(),
          } satisfies OnlineUser);
        }
      });

    // Leaving the page/tab (unmount) or the session/profile changing (e.g.
    // sign-out) drops this tab's presence key -- everyone else's synced
    // state updates automatically, no manual "mark offline" call needed.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode, session, profile]);

  return { onlineUsers, onlineCount: onlineUsers.length };
}
