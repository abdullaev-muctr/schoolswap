import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useListing, useSaveListing } from '../api/listings';
import { uploadPhoto } from '../api/storage';
import { useAuth } from '../auth/AuthProvider';
import { ListingCard } from '../components/market/ListingCard';
import { PhotoPicker, photoSrc, type PhotoItem } from '../components/market/PhotoPicker';
import { Button, ButtonLink } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { useFeedback } from '../components/ui/feedback';
import { EmptyState, Loading, Page, PageHead } from '../components/ui/misc';
import { SITE } from '../config';
import { CATEGORIES, CONDITIONS, MAX_PHOTOS, type Category, type Condition } from '../lib/constants';
import type { Listing } from '../types';

interface Draft {
  title: string;
  description: string;
  price: string;
  category: Category | '';
  condition: Condition | '';
  photos: PhotoItem[];
}

type Errors = Partial<Record<keyof Draft, string>>;

const toDraft = (l?: Listing | null): Draft => ({
  title: l?.title ?? '',
  description: l?.description ?? '',
  price: l ? String(l.price) : '',
  category: l?.category ?? '',
  condition: l?.condition ?? '',
  photos: l?.photos.map((url) => ({ kind: 'saved', url })) ?? [],
});

function validate(d: Draft): Errors {
  const price = Number(d.price);
  const errors: Errors = {
    photos: d.photos.length ? undefined : 'Add at least one photo.',
    title: d.title.trim().length >= 3 ? undefined : 'Add a title (at least 3 characters).',
    description: d.description.trim().length >= 10 ? undefined : 'Add a short description (at least 10 characters).',
    price: d.price !== '' && Number.isFinite(price) && price >= 0 ? undefined : 'Enter a price. Use 0 to give it away.',
    category: d.category ? undefined : 'Choose a category.',
    condition: d.condition ? undefined : 'Choose the condition.',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Errors;
}

/** Create a listing (/sell) or edit one (/market/:id/edit). */
export function SellPage() {
  const { id } = useParams();
  const { data: listing, isPending } = useListing(id);
  const { profile } = useAuth();

  if (id && isPending) return <Loading />;
  if (id && (!listing || listing.seller_id !== profile?.id)) {
    return (
      <Page>
        <EmptyState icon="lock" title="You can only edit your own listings">
          <ButtonLink to="/market">Back to marketplace</ButtonLink>
        </EmptyState>
      </Page>
    );
  }
  return <SellForm key={id ?? 'new'} listing={listing ?? null} />;
}

function SellForm({ listing }: { listing: Listing | null }) {
  const { profile } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const save = useSaveListing();
  const [draft, setDraft] = useState<Draft>(() => toDraft(listing));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const editing = !!listing;
  const backTo = editing ? `/market/${listing.id}` : '/market';
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector('.field--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setBusy(true);
    try {
      const photos = await Promise.all(
        draft.photos.map((p) => (p.kind === 'saved' ? p.url : uploadPhoto(profile!.id, p.file))),
      );
      const removed = (listing?.photos ?? []).filter((url) => !photos.includes(url));
      const savedId = await save.mutateAsync({
        id: listing?.id,
        removed,
        input: {
          title: draft.title.trim(),
          description: draft.description.trim(),
          price: Math.round(Number(draft.price)),
          category: draft.category as Category,
          condition: draft.condition as Condition,
          photos,
        },
      });
      toast(editing ? 'Changes saved' : 'Listing published');
      navigate(`/market/${savedId}`, { replace: true });
    } catch (err) {
      toast((err as Error).message, 'error');
      setBusy(false);
    }
  };

  return (
    <Page>
      <Link className="back" to={backTo}>
        <Icon name="back" />
        {editing ? 'Back to listing' : 'Marketplace'}
      </Link>
      <PageHead
        title={editing ? 'Edit listing' : 'Sell an item'}
        text={editing ? 'Changes show up for everyone straight away.' : 'Clear photos and an honest condition help it sell faster.'}
      />

      <div className="sell">
        <form className="form form--wide" onSubmit={submit} noValidate>
          <Field
            label={
              <>
                Photos <small>· up to {MAX_PHOTOS}, the first one is the cover</small>
              </>
            }
            error={errors.photos}
          >
            <PhotoPicker photos={draft.photos} onChange={(photos) => set('photos', photos)} />
          </Field>

          <Field label="Title" htmlFor="title" error={errors.title}>
            <input
              className="input"
              id="title"
              maxLength={70}
              placeholder="e.g. Biology textbook, Year 9"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <textarea
              className="input"
              id="description"
              rows={5}
              maxLength={2000}
              placeholder="Edition, size, what’s included, any marks or damage"
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <div className="grid-2">
            <Field label="Price" htmlFor="price" error={errors.price}>
              <div className="input-wrap">
                <span className="input-wrap__prefix">{SITE.currency}</span>
                <input
                  className="input"
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={draft.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Category" htmlFor="category" error={errors.category}>
              <select
                className="input"
                id="category"
                value={draft.category}
                onChange={(e) => set('category', e.target.value as Category)}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Condition" error={errors.condition}>
            <div className="segmented" role="radiogroup" aria-label="Condition">
              {CONDITIONS.map((c) => (
                <label key={c}>
                  <input
                    type="radio"
                    name="condition"
                    value={c}
                    checked={draft.condition === c}
                    onChange={() => set('condition', c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="row">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
            </Button>
            <ButtonLink to={backTo}>Cancel</ButtonLink>
          </div>
        </form>

        <aside className="sell__preview">
          <span className="label">Preview</span>
          <ListingCard
            listing={{
              title: draft.title || 'Your item title',
              price: Number(draft.price) || 0,
              condition: (draft.condition || 'Condition') as Condition,
              category: (draft.category || 'Category') as Category,
              status: 'active',
              photos: draft.photos.length ? [photoSrc(draft.photos[0])] : [],
              seller: profile,
            }}
          />
          <p className="small dim">Seller: {profile?.name}. Your name is added automatically.</p>
        </aside>
      </div>
    </Page>
  );
}
