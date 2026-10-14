import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../api/news';
import { useAuth } from '../auth/AuthProvider';
import { Masthead, NewsShell, Story } from '../components/news/NewsShell';
import { ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Loading } from '../components/ui/misc';
import { NEWS_SECTIONS, type NewsSection } from '../lib/constants';
import { dateShort, timeAgo } from '../lib/format';

export function News() {
  const { profile, isAdmin } = useAuth();
  const { data: articles = [], isPending } = useArticles();
  const [section, setSection] = useState<NewsSection | 'All'>('All');

  const notice = section === 'All' ? articles.find((a) => a.is_notice) : undefined;
  const stories = articles.filter((a) => a !== notice && (section === 'All' || a.section === section));
  const [lead, ...rest] = stories;
  const side = rest.slice(0, 3);
  const row = rest.slice(3, 7);

  return (
    <NewsShell showDemoFlag={articles.some((a) => a.is_demo)}>
      <Masthead />

      <div className="sections" role="group" aria-label="Sections">
        {(['All', ...NEWS_SECTIONS] as const).map((s) => (
          <button key={s} aria-pressed={section === s} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="admin-bar">
          <span>
            Signed in as <b>{profile?.name}</b> · you can publish and edit articles
          </span>
          <ButtonLink to="/news/new" variant="news">
            <Icon name="plus" />
            New article
          </ButtonLink>
        </div>
      )}

      {notice && (
        <Link className="notice" to={`/news/${notice.id}`}>
          <Icon name="alert" />
          <div>
            <small>Important notice · {timeAgo(notice.published_at)}</small>
            <b>{notice.title}</b>
            <span>{notice.summary}</span>
          </div>
        </Link>
      )}

      {isPending ? (
        <Loading />
      ) : lead ? (
        <div className="front">
          <div className="front__lead">
            <Story article={lead} layout="lead" />
          </div>
          <div className="front__side">
            {side.map((a) => (
              <Story key={a.id} article={a} layout="side" />
            ))}
          </div>
        </div>
      ) : (
        <p className="news-empty">No stories in this section yet.</p>
      )}

      {row.length > 0 && (
        <div className="story-row" style={{ '--n': row.length } as CSSProperties}>
          {row.map((a) => (
            <Story key={a.id} article={a} layout="row" />
          ))}
        </div>
      )}

      <div className="latest">
        <h4>LATEST</h4>
        <ol>
          {articles.map((a) => (
            <li key={a.id}>
              <Link to={`/news/${a.id}`}>
                <time dateTime={a.published_at}>{dateShort(a.published_at)}</time>
                <b>{a.title}</b>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </NewsShell>
  );
}
