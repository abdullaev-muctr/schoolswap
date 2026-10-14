import { useEffect, useState } from 'react';
import { SITE, TEAM } from '../../config';

const DURATION_MS = 4600;
const SEEN_KEY = 'schoolswap:intro-seen';

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Opening titles: "A Student Production" → team name → school crest → why we built it. Once per visit. */
export function Intro() {
  const [done, setDone] = useState(alreadySeen);

  useEffect(() => {
    if (done) return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: the intro simply plays again next time */
    }
    const timer = window.setTimeout(() => setDone(true), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className={`intro${done ? ' intro--done' : ''}`} aria-hidden="true">
      <button className="intro__skip" onClick={() => setDone(true)} tabIndex={done ? -1 : 0}>
        Skip
      </button>
      <div className="intro__stack">
        <div className="intro__step">
          <div className="intro__kicker">A Student Production</div>
          <div className="intro__team">{TEAM.name}</div>
        </div>
        <div className="intro__step">
          <img className="crest intro__crest" src="/crest.webp" alt="" />
          <p className="intro__line">{SITE.tagline}</p>
        </div>
      </div>
    </div>
  );
}
