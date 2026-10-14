import type { ReactNode } from 'react';
import { initials } from '../../lib/format';
import { Icon, type IconName } from './Icon';

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span className={`av${large ? ' av--lg' : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="badge" aria-label={`${count} unread`}>
      {count}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}

/** Page container with the standard paddings. */
export function Page({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  return (
    <div className={`page${tight ? ' page--tight' : ''}`}>
      <div className="wrap">{children}</div>
    </div>
  );
}

export function PageHead({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}
