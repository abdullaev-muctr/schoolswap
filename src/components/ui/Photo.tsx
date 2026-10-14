import type { CSSProperties } from 'react';

/** Illustrations (64×64) used for demo items and empty photo slots. Static strings only. */
const ART = {
  book: '<path d="M8 10h22a6 6 0 0 1 6 6v32a5 5 0 0 0-5-5H8z"/><path d="M56 10H42a6 6 0 0 0-6 6v32a5 5 0 0 1 5-5h15z"/>',
  calc: '<rect x="16" y="6" width="32" height="52" rx="4"/><rect x="22" y="12" width="20" height="10"/><path d="M24 30h0M32 30h0M40 30h0M24 38h0M32 38h0M40 38h0M24 46h0M32 46h0M40 46h0" stroke-width="4"/>',
  hoodie: '<path d="M22 8c2 6 6 9 10 9s8-3 10-9l12 6 6 16-8 4-3-7v29H15V27l-3 7-8-4 6-16z"/><path d="M26 12c1 6 3 10 6 10s5-4 6-10M28 40h8"/>',
  headphones: '<path d="M10 40v-6a22 22 0 0 1 44 0v6"/><rect x="8" y="38" width="12" height="18" rx="3"/><rect x="44" y="38" width="12" height="18" rx="3"/>',
  guitar: '<path d="M40 8l16 16M46 10l8 8"/><path d="M44 20 30 34"/><path d="M30 26c-6-2-10 2-10 6-6 0-12 4-12 12s6 14 14 14 12-6 12-12c4 0 8-4 6-10z"/><circle cx="24" cy="40" r="3"/>',
  ball: '<circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c8 7 8 41 0 48M32 8c-8 7-8 41 0 48"/>',
  pencil: '<path d="M14 50l4-14 26-26 10 10-26 26z"/><path d="M38 16l10 10M14 50l10-4"/>',
  bag: '<path d="M18 22h28l4 34H14z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4"/><path d="M22 34h20"/>',
  laptop: '<rect x="12" y="14" width="40" height="26" rx="2"/><path d="M6 46h52l-4 6H10z"/>',
  trophy: '<path d="M20 10h24v14a12 12 0 0 1-24 0z"/><path d="M20 14H10c0 8 4 12 10 12M44 14h10c0 8-4 12-10 12M32 36v10M22 54h20l-2-8H24z"/>',
  stairs: '<path d="M8 54h12V42h12V30h12V18h12"/><path d="M10 12l44 40M54 12 10 52" stroke-width="2.5"/>',
  megaphone: '<path d="M8 26h10l26-12v36L18 38H8z"/><path d="M18 38l4 14h8l-4-14M52 24c3 3 3 9 0 12"/>',
  flask: '<path d="M26 8h12M28 8v16L14 52a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4L36 24V8"/><path d="M20 42h24"/>',
  music: '<path d="M24 46V14l28-6v32"/><circle cx="18" cy="46" r="6"/><circle cx="46" cy="40" r="6"/>',
  calendar: '<rect x="8" y="12" width="48" height="44"/><path d="M8 24h48M20 6v10M44 6v10M18 34h8M30 34h8M42 34h4M18 44h8M30 44h8"/>',
  ruler: '<path d="M6 42 42 6l16 16-36 36z"/><path d="M16 32l5 5M22 26l3 3M28 20l5 5M34 14l3 3"/>',
  camera: '<path d="M8 20h12l4-6h16l4 6h12v30H8z"/><circle cx="32" cy="34" r="9"/>',
  tag: '<path d="M6 30V8h22l28 28-22 22z"/><circle cx="18" cy="20" r="4"/>',
} as const;

type ArtName = keyof typeof ART;

/** Demo photos are stored as "art:<icon>:<tint>[:<x>]", e.g. "art:book:#0a3a6c:35%". */
function parseArt(src: string | null | undefined) {
  if (!src?.startsWith('art:')) return null;
  const [, icon, tint, x] = src.split(':');
  return { icon: (icon in ART ? icon : 'tag') as ArtName, tint, x };
}

function Art({ name }: { name: ArtName }) {
  return <svg className="art" viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[name] }} />;
}

interface PhotoProps {
  src: string | null | undefined;
  alt?: string;
  /** "listing": 4:3 radial navy frame. "news": 3:2 newspaper frame. */
  variant?: 'listing' | 'news';
  square?: boolean;
  /** Illustration shown when there is no photo. */
  fallback?: ArtName;
}

export function Photo({ src, alt = '', variant = 'listing', square = false, fallback = 'camera' }: PhotoProps) {
  const art = parseArt(src);
  const className = [variant === 'news' ? 'news-photo' : 'photo', square && 'photo--square'].filter(Boolean).join(' ');
  const style = art ? ({ '--t': art.tint, '--x': art.x } as CSSProperties) : undefined;

  return (
    <div className={className} style={style}>
      {src && !art ? <img src={src} alt={alt} loading="lazy" /> : <Art name={art?.icon ?? fallback} />}
    </div>
  );
}
