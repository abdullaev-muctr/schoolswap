import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../config';
import { dateLong, timeAgo } from '../../lib/format';
import type { Article } from '../../types';
import { Footer } from '../layout/Footer';
import { Photo } from '../ui/Photo';

/** White newspaper page. Shows the demo banner while demo stories are published. */
export function NewsShell({ showDemoFlag, children }: { showDemoFlag: boolean; children: ReactNode }) {
  return (
    <div className="news">
      {showDemoFlag && (
        <div className="demo-flag">
          <b>DEMO CONTENT</b> · Stories marked DEMO are examples made for the presentation.
        </div>
      )}
      <div className="wrap">{children}</div>
      <Footer />
    </div>
  );
}

export function Masthead() {
  return (
    <div className="mast">
      <div className="mast__top">
        <b>{dateLong(Date.now())}</b>
        <span>{SITE.school} · Student edition</span>
      </div>
      <h1>School News</h1>
      <div className="mast__sub">
        <img src="/crest.webp" alt="" />
        Events, announcements and achievements from around the school
      </div>
    </div>
  );
}

export function Kicker({ article, notice = false }: { article: Article; notice?: boolean }) {
  return (
    <span className="kicker">
      {article.section}
      {notice && article.is_notice && ' · Important notice'}
      {article.is_demo && <span className="demo-tag">DEMO</span>}
    </span>
  );
}

type StoryLayout = 'lead' | 'side' | 'row';

/** A headline teaser in one of the three front-page layouts. */
export function Story({ article: a, layout }: { article: Article; layout: StoryLayout }) {
  const to = `/news/${a.id}`;

  if (layout === 'lead') {
    return (
      <Link className="story story--lead" to={to}>
        <div className="story__text">
          <Kicker article={a} />
          <h2>{a.title}</h2>
          <p>{a.summary}</p>
          <span className="story__when">
            {timeAgo(a.published_at)} · {a.author_name}
          </span>
        </div>
        <Photo src={a.photo_url} variant="news" fallback="megaphone" />
      </Link>
    );
  }

  if (layout === 'row') {
    return (
      <Link className="story" to={to}>
        <Photo src={a.photo_url} variant="news" fallback="megaphone" />
        <Kicker article={a} />
        <h3>{a.title}</h3>
        <span className="story__when">{timeAgo(a.published_at)}</span>
      </Link>
    );
  }

  return (
    <Link className="story" to={to}>
      <Kicker article={a} />
      <h3>{a.title}</h3>
      <p>{a.summary}</p>
      <span className="story__when">{timeAgo(a.published_at)}</span>
    </Link>
  );
}
