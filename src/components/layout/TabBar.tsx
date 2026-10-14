import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icon';
import { Badge } from '../ui/misc';

const TABS: { to: string; icon: IconName; label: string; className?: string }[] = [
  { to: '/market', icon: 'grid', label: 'Market' },
  { to: '/news', icon: 'news', label: 'News' },
  { to: '/sell', icon: 'plus', label: 'Sell', className: 'tabbar__sell' },
  { to: '/messages', icon: 'chat', label: 'Messages' },
  { to: '/me', icon: 'user', label: 'Me' },
];

/** Bottom navigation on phones (signed-in users only). */
export function TabBar({ unread }: { unread: number }) {
  return (
    <nav className="tabbar" aria-label="App sections">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={tab.className}>
          <Icon name={tab.icon} />
          {tab.label}
          {tab.to === '/messages' && <Badge count={unread} />}
        </NavLink>
      ))}
    </nav>
  );
}
