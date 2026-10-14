import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';
import { listingKeys } from './listings';
import { messageKeys } from './messages';
import { newsKeys } from './news';

/**
 * One Realtime channel for the whole app. Database changes are pushed over a WebSocket and
 * refresh the matching React Query caches, so every open screen updates instantly.
 * Row level security still applies: users only receive messages from their own conversations.
 */
export function useRealtimeSync(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`app-sync-${userId ?? 'guest'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        qc.invalidateQueries({ queryKey: listingKeys.all });
        // Inbox rows show the listing's price and sold status too.
        qc.invalidateQueries({ queryKey: messageKeys.conversations });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () =>
        qc.invalidateQueries({ queryKey: newsKeys.all }),
      );

    if (userId) {
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: row }) => {
          const message = row as Message;
          // Show the message right away, then let the inbox preview catch up.
          qc.setQueryData<Message[]>(messageKeys.thread(message.conversation_id), (list) =>
            list && !list.some((m) => m.id === message.id) ? [...list, message] : list,
          );
          qc.invalidateQueries({ queryKey: messageKeys.conversations });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () =>
          qc.invalidateQueries({ queryKey: messageKeys.conversations }),
        );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, userId]);
}
