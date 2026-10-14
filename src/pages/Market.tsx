import { useMemo, useState } from 'react';
import { useListings } from '../api/listings';
import { ListingGrid } from '../components/market/ListingCard';
import { ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { EmptyState, Loading, Page, PageHead } from '../components/ui/misc';
import { SITE } from '../config';
import { CATEGORIES, type Category } from '../lib/constants';
import { plural } from '../lib/format';
import type { Listing } from '../types';

type Sort = 'new' | 'low' | 'high';

const SORTERS: Record<Sort, (a: Listing, b: Listing) => number> = {
  // Newest first, sold items at the end.
  new: (a, b) => Number(a.status === 'sold') - Number(b.status === 'sold') || b.created_at.localeCompare(a.created_at),
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
};

export function Market() {
  const { data: listings, isPending, error } = useListings();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [sort, setSort] = useState<Sort>('new');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (listings ?? [])
      .filter((l) => category === 'All' || l.category === category)
      .filter((l) => !q || `${l.title} ${l.description}`.toLowerCase().includes(q))
      .sort(SORTERS[sort]);
  }, [listings, query, category, sort]);

  const countIn = (c: Category | 'All') => (listings ?? []).filter((l) => c === 'All' || l.category === c).length;

  return (
    <Page>
      <PageHead title="Marketplace" text={`Everything students at ${SITE.school} are selling right now.`} />

      <div className="toolbar">
        <label className="searchbar">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Search listings"
            aria-label="Search listings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="new">Newest first</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      <div className="pills" role="group" aria-label="Categories">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
            <span className="n">{countIn(c)}</span>
          </button>
        ))}
      </div>

      {isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState icon="alert" title="Could not load listings">
          <p>{error.message}</p>
        </EmptyState>
      ) : results.length ? (
        <>
          <p className="count">
            {plural(results.length, 'listing')}
            {query && ` for “${query}”`}
          </p>
          <ListingGrid listings={results} />
        </>
      ) : (
        <EmptyState icon="search" title="Nothing found">
          <p>Try another word or category, or be the first to sell it.</p>
          <ButtonLink to="/sell" variant="primary">
            Sell an item
          </ButtonLink>
        </EmptyState>
      )}
    </Page>
  );
}
