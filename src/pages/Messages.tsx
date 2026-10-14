import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  isUnread,
  markConversationRead,
  messageKeys,
  otherParty,
  useConversations,
  useMessages,
  useSendMessage,
} from '../api/messages';
import { useAuth } from '../auth/AuthProvider';
import { Button, ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Photo } from '../components/ui/Photo';
import { useFeedback } from '../components/ui/feedback';
import { Avatar, Loading, Page } from '../components/ui/misc';
import { clock, dayLabel, firstName, price, timeAgo } from '../lib/format';
import type { Conversation } from '../types';

export function Messages() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { data: conversations, isPending } = useConversations(true);
  const current = conversations?.find((c) => c.id === id);

  return (
    <Page tight>
      <div className={`inbox${id ? ' inbox--open' : ''}`}>
        <aside className="convs">
          <div className="convs__head">
            <h2>Messages</h2>
          </div>
          {isPending ? (
            <Loading />
          ) : conversations?.length ? (
            conversations.map((c) => <ConversationRow key={c.id} conversation={c} userId={profile!.id} active={c.id === id} />)
          ) : (
            <div className="no-thread">
              <Icon name="chat" />
              <b>No conversations yet</b>
              <span>Open a listing and press Message seller to start one.</span>
              <ButtonLink to="/market" size="sm">
                Browse marketplace
              </ButtonLink>
            </div>
          )}
        </aside>

        <section className="thread">
          {current ? (
            <Thread key={current.id} conversation={current} userId={profile!.id} />
          ) : (
            <div className="no-thread">
              <Icon name="chat" />
              <span>{id && !isPending ? 'This conversation is not available.' : 'Choose a conversation'}</span>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}

function ConversationRow({ conversation: c, userId, active }: { conversation: Conversation; userId: string; active: boolean }) {
  const other = otherParty(c, userId);
  const unread = isUnread(c, userId);
  const preview = c.last_message_text
    ? `${c.last_message_sender === userId ? 'You: ' : ''}${c.last_message_text}`
    : 'New conversation';

  return (
    <Link className="conv" to={`/messages/${c.id}`} aria-current={active ? 'page' : undefined}>
      <Avatar name={other.name} />
      <div>
        <b>{other.name}</b>
        <span className="conv__item">{c.listing?.title ?? `${c.listing_title} (removed)`}</span>
        <div className="conv__last">{preview}</div>
      </div>
      <div className="conv__time">
        {c.last_message_at && timeAgo(c.last_message_at)}
        {unread && <span className="conv__unread" aria-label="Unread" />}
      </div>
    </Link>
  );
}

function Thread({ conversation: c, userId }: { conversation: Conversation; userId: string }) {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const location = useLocation();
  const { data: messages = [], isPending } = useMessages(c.id);
  const send = useSendMessage(c.id);
  const [text, setText] = useState(() => (location.state as { draft?: string } | null)?.draft ?? '');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const other = otherParty(c, userId);
  const unread = isUnread(c, userId);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Opening a thread (or receiving a message while it is open) marks it as read.
  useEffect(() => {
    if (!unread) return;
    markConversationRead(c.id).then(() => qc.invalidateQueries({ queryKey: messageKeys.conversations }));
  }, [unread, c.id, qc]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    try {
      await send.mutateAsync(body);
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  let lastDay = '';

  return (
    <>
      <div className="thread__head">
        <Link className="thread__back" to="/messages" aria-label="Back to conversations">
          <Icon name="back" />
        </Link>
        <Avatar name={other.name} />
        <div>
          <b>{other.name}</b>
          <small>{other.iAmBuyer ? 'Seller' : 'Wants to buy your item'}</small>
        </div>
      </div>

      {c.listing ? (
        <Link className="item-chip" to={`/market/${c.listing.id}`}>
          <Photo src={c.listing.photos[0]} square />
          <div>
            <b>{c.listing.title}</b>
            <small>
              {price(c.listing.price)} · {c.listing.status === 'sold' ? 'Sold' : c.listing.condition}
            </small>
          </div>
          <span className="item-chip__go">View item</span>
        </Link>
      ) : (
        <div className="item-chip">
          <div>
            <b>{c.listing_title}</b>
            <small>This listing was removed</small>
          </div>
        </div>
      )}

      <div className="msgs" ref={listRef}>
        <div className="msgs__privacy">
          <Icon name="lock" />
          Only you and {firstName(other.name)} can see this conversation.
        </div>
        {isPending && <Loading />}
        {messages.map((m) => {
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <Fragment key={m.id}>
              {showDay && <div className="msgs__day">{day}</div>}
              <div className={`bubble${m.sender_id === userId ? ' bubble--mine' : ''}`}>
                {m.body}
                <time dateTime={m.created_at}>{clock(m.created_at)}</time>
              </div>
            </Fragment>
          );
        })}
        {!isPending && !messages.length && (
          <p className="msgs__hint">Say hi and ask about the item. Agree on a time and place to meet at school.</p>
        )}
      </div>

      <form className="compose" onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows={1}
          maxLength={2000}
          placeholder="Write a message"
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" variant="primary" aria-label="Send" disabled={!text.trim() || send.isPending}>
          <Icon name="send" />
          <span className="hide-m">Send</span>
        </Button>
      </form>
    </>
  );
}
