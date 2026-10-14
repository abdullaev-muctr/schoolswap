import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isUnread, useConversations } from '../../api/messages';
import { useRealtimeSync } from '../../api/realtime';
import { useAuth } from '../../auth/AuthProvider';
import { Loading } from '../ui/misc';
import { Header } from './Header';
import { TabBar } from './TabBar';

export function AppLayout() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { pathname } = useLocation();

  useRealtimeSync(userId);
  const { data: conversations = [] } = useConversations(!!userId);
  const unread = userId ? conversations.filter((c) => isUnread(c, userId)).length : 0;

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className={profile ? 'has-tabbar' : undefined}>
      <Header unread={unread} />
      <main>
        <Outlet />
      </main>
      {profile && <TabBar unread={unread} />}
    </div>
  );
}

/** Sends visitors to the login page and back again afterwards. */
export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { loading, profile, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <Navigate to="/news" replace />;
  return <Outlet />;
}
