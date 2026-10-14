import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useListings } from '../api/listings';
import { useAuth } from '../auth/AuthProvider';
import { useListingActions } from '../components/market/useListingActions';
import { Button, ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Photo } from '../components/ui/Photo';
import { Avatar, EmptyState, Loading, Page } from '../components/ui/misc';
import { price, timeAgo } from '../lib/format';
import type { ListingStatus } from '../types';

export function MyListings() {
  const { profile, session, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: listings, isPending } = useListings();
  const { toggleSold, remove } = useListingActions();
  const [tab, setTab] = useState<ListingStatus>('active');

  const mine = (listings ?? []).filter((l) => l.seller_id === profile?.id);
  const active = mine.filter((l) => l.status === 'active');
  const sold = mine.filter((l) => l.status === 'sold');
  const shown = tab === 'active' ? active : sold;

  const logOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Page>
      <div className="profile">
        <Avatar name={profile!.name} large />
        <div>
          <h1>{profile!.name}</h1>
          <p>
            {session?.user.email}
            {isAdmin && ' · School Office admin'}
          </p>
        </div>
        <div className="row ml-auto">
          <ButtonLink to="/sell" variant="primary">
            <Icon name="plus" />
            Sell an item
          </ButtonLink>
          <Button onClick={logOut}>
            <Icon name="logout" />
            Log out
          </Button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'active'} onClick={() => setTab('active')}>
          Active ({active.length})
        </button>
        <button role="tab" aria-selected={tab === 'sold'} onClick={() => setTab('sold')}>
          Sold ({sold.length})
        </button>
      </div>

      {isPending ? (
        <Loading />
      ) : shown.length ? (
        <div className="rows">
          {shown.map((l) => (
            <div className="lrow" key={l.id}>
              <Link to={`/market/${l.id}`} aria-label={`Open ${l.title}`}>
                <Photo src={l.photos[0]} />
              </Link>
              <Link className="lrow__text" to={`/market/${l.id}`}>
                <h3>{l.title}</h3>
                <div className="lrow__meta">
                  <span className="price">{price(l.price)}</span> · {l.condition} · listed {timeAgo(l.created_at)}
                </div>
              </Link>
              <div className="lrow__actions">
                <ButtonLink to={`/market/${l.id}/edit`} size="sm">
                  <Icon name="edit" />
                  Edit
                </ButtonLink>
                <Button size="sm" onClick={() => toggleSold(l)}>
                  {l.status === 'sold' ? 'Relist' : 'Mark sold'}
                </Button>
                <Button size="sm" variant="danger" aria-label="Delete" onClick={() => remove(l)}>
                  <Icon name="trash" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'active' ? (
        <EmptyState icon="tag" title="No active listings">
          <p>Post something you no longer need. It takes a minute.</p>
          <ButtonLink to="/sell" variant="primary">
            Sell an item
          </ButtonLink>
        </EmptyState>
      ) : (
        <EmptyState icon="tag" title="Nothing sold yet">
          <p>Items you mark as sold appear here.</p>
        </EmptyState>
      )}
    </Page>
  );
}
