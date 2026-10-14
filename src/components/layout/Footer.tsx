import { SITE, TEAM } from '../../config';

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>
          {SITE.name} · {SITE.school} · A {TEAM.name} production, {SITE.year}
        </span>
        <span>No online payments. Meet and pay in person at school.</span>
      </div>
    </footer>
  );
}
