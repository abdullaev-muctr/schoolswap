import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { SITE } from '../../config';
import { firstName } from '../../lib/format';
import { ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Avatar, Badge } from '../ui/misc';

export function Header({ unread }: { unread: number }) {
  const { profile, session } = useAuth();

  return (
    <header className="header">
      <div className="wrap header__inner">
        <Link className="brand" to="/" aria-label={`${SITE.name} home`}>
          <img src="/crest.webp" alt="" />
          School<b>Swap</b>
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLink to="/market">Marketplace</NavLink>
          <NavLink to="/news">School News</NavLink>
          {profile && (
            <NavLink to="/messages">
              Messages
              <Badge count={unread} />
            </NavLink>
          )}
        </nav>

        <div className="header__right">
          {profile ? (
            <>
              <ButtonLink to="/sell" variant="primary" size="sm" className="hide-m">
                <Icon name="plus" />
                Sell an item
              </ButtonLink>
              <UserMenu name={profile.name} email={session?.user.email ?? ''} />
            </>
          ) : (
            <>
              <ButtonLink to="/login" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink to="/signup" variant="primary" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const logOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div ref={ref}>
      <button className="me-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar name={name} />
        <span className="hide-m">{firstName(name)}</span>
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu__who">
            <b>{name}</b>
            {email}
            {isAdmin && ' · Admin'}
          </div>
          <Link className="menu__item" role="menuitem" to="/me">
            <Icon name="tag" />
            My listings
          </Link>
          <Link className="menu__item" role="menuitem" to="/messages">
            <Icon name="chat" />
            Messages
          </Link>
          {isAdmin && (
            <Link className="menu__item" role="menuitem" to="/news/new">
              <Icon name="edit" />
              Write news article
            </Link>
          )}
          <button className="menu__item" role="menuitem" onClick={logOut}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
