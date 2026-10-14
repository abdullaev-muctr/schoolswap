import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useListing, useListings } from '../api/listings';
import { startConversation } from '../api/messages';
import { useAuth } from '../auth/AuthProvider';
import { useListingActions } from '../components/market/useListingActions';
import { Button, ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Photo } from '../components/ui/Photo';
import { useFeedback } from '../components/ui/feedback';
import { Avatar, EmptyState, Loading, Page } from '../components/ui/misc';
import { firstName, plural, price, timeAgo } from '../lib/format';

export function ListingPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const { data: listing, isPending } = useListing(id);
  const { data: all = [] } = useListings();
  const { toggleSold, remove } = useListingActions();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [contacting, setContacting] = useState(false);

  if (isPending) return <Loading />;
  if (!listing) {
    return (
      <Page>
        <EmptyState icon="tag" title="This listing was removed">
          <ButtonLink to="/market">Back to marketplace</ButtonLink>
        </EmptyState>
      </Page>
    );
  }

  const mine = profile?.id === listing.seller_id;
  const sold = listing.status === 'sold';
  const sellerName = listing.seller?.name ?? 'Student';
  const sellerActive = all.filter((l) => l.seller_id === listing.seller_id && l.status === 'active').length;

  const messageSeller = async () => {
    setContacting(true);
    try {
      const conversationId = await startConversation(listing.id);
      navigate(`/messages/${conversationId}`, {
        state: { draft: `Hi ${firstName(sellerName)}, is the ${listing.title.toLowerCase()} still available?` },
      });
    } catch (err) {
      toast((err as Error).message, 'error');
      setContacting(false);
    }
  };

  return (
    <Page>
      <Link className="back" to="/market">
        <Icon name="back" />
        Marketplace
      </Link>

      <div className="item">
        <div className="gallery">
          <div className="gallery__main">
            <Photo src={listing.photos[photoIndex] ?? listing.photos[0]} alt={listing.title} />
            {sold && <span className="sold-stamp">SOLD</span>}
          </div>
          {listing.photos.length > 1 && (
            <div className="thumbs">
              {listing.photos.map((src, i) => (
                <button key={src} aria-pressed={i === photoIndex} aria-label={`Photo ${i + 1}`} onClick={() => setPhotoIndex(i)}>
                  <Photo src={src} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="item__info">
          <div className="chips">
            <span className="chip">{listing.category}</span>
            <span className="chip">{listing.condition}</span>
            {sold && <span className="chip chip--solid">Sold</span>}
            <span className="chip">Listed {timeAgo(listing.created_at)}</span>
          </div>
          <h1>{listing.title}</h1>
          <div className="item__price price">{price(listing.price)}</div>
          <p className="item__desc">{listing.description}</p>

          <div className="seller">
            <Avatar name={sellerName} large />
            <div>
              <b>{sellerName}</b>
              <small>{plural(sellerActive, 'active listing')}</small>
            </div>
          </div>

          {mine ? (
            <div className="owner-actions">
              <ButtonLink to={`/market/${listing.id}/edit`} variant="primary">
                <Icon name="edit" />
                Edit listing
              </ButtonLink>
              <Button onClick={() => toggleSold(listing)}>
                <Icon name="check" />
                {sold ? 'Mark as available' : 'Mark as sold'}
              </Button>
              <Button variant="danger" onClick={() => remove(listing, () => navigate('/me'))}>
                <Icon name="trash" />
                Delete
              </Button>
            </div>
          ) : (
            <Button variant="primary" block disabled={sold || contacting} onClick={messageSeller}>
              <Icon name="chat" />
              {sold ? 'This item is sold' : 'Message seller'}
            </Button>
          )}

          <div className="note-box">
            <Icon name="handshake" />
            <span>
              Agree on the price and a place to meet at school in the chat. Pay in person when you get the item. There is
              no online payment.
            </span>
          </div>
        </div>
      </div>
    </Page>
  );
}
