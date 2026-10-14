import { Link } from 'react-router-dom';
import { firstName, price } from '../../lib/format';
import type { Listing } from '../../types';
import { Photo } from '../ui/Photo';

type CardData = Pick<Listing, 'title' | 'price' | 'condition' | 'category' | 'status' | 'photos'> & {
  id?: string;
  seller?: { name: string } | null;
};

/** Listing tile for grids. Without an id it renders as a static preview (sell form). */
export function ListingCard({ listing }: { listing: CardData }) {
  const sold = listing.status === 'sold';
  const content = (
    <>
      <div className="card__media">
        <Photo src={listing.photos[0]} />
        <span className="card__tag">{listing.category}</span>
        {sold && <span className="sold-stamp">SOLD</span>}
      </div>
      <div className="card__body">
        <div className="card__top">
          <h3 className="card__title">{listing.title}</h3>
          <span className="card__price price">{price(listing.price)}</span>
        </div>
        <div className="card__meta">
          {listing.condition}
          {listing.seller && ` · ${firstName(listing.seller.name)}`}
        </div>
      </div>
    </>
  );

  const className = `card${sold ? ' card--sold' : ''}`;
  return listing.id ? (
    <Link className={className} to={`/market/${listing.id}`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="listing-grid">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
