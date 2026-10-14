import { useEffect, useRef } from 'react';
import { MAX_PHOTOS } from '../../lib/constants';
import { Icon } from '../ui/Icon';
import { Photo } from '../ui/Photo';

/** A photo already on the server (url) or a new file waiting to be uploaded (preview). */
export type PhotoItem = { kind: 'saved'; url: string } | { kind: 'new'; file: File; preview: string };

export const photoSrc = (p: PhotoItem) => (p.kind === 'saved' ? p.url : p.preview);

interface Props {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

export function PhotoPicker({ photos, onChange }: Props) {
  // Free preview object URLs when the picker unmounts.
  const latest = useRef(photos);
  latest.current = photos;
  useEffect(() => () => latest.current.forEach((p) => p.kind === 'new' && URL.revokeObjectURL(p.preview)), []);

  const add = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const added = [...files]
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, room)
      .map((file): PhotoItem => ({ kind: 'new', file, preview: URL.createObjectURL(file) }));
    onChange([...photos, ...added]);
  };

  const remove = (index: number) => {
    const item = photos[index];
    if (item.kind === 'new') URL.revokeObjectURL(item.preview);
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="photo-picker">
      {photos.map((p, i) => (
        <div className="photo-picker__slot" key={photoSrc(p)}>
          <Photo src={photoSrc(p)} square />
          <button type="button" className="photo-picker__remove" onClick={() => remove(i)} aria-label="Remove photo">
            <Icon name="x" />
          </button>
          {i === 0 && <span className="photo-picker__cover">COVER</span>}
        </div>
      ))}

      {photos.length < MAX_PHOTOS && (
        <label className="photo-picker__slot photo-picker__add">
          <Icon name="camera" />
          <span>Add photo</span>
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              add(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
