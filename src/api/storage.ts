import { compressImage } from '../lib/image';
import { supabase } from '../lib/supabase';

const BUCKET = 'photos';
const PUBLIC_MARKER = `/object/public/${BUCKET}/`;

/** Compresses and uploads a photo into the user's own folder. Returns its public URL. */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'jpg');
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: '31536000',
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort cleanup of uploaded photos. Ignores demo placeholders and foreign URLs. */
export async function removePhotos(urls: string[]): Promise<void> {
  const paths = urls
    .filter((url) => url.includes(PUBLIC_MARKER))
    .map((url) => decodeURIComponent(url.split(PUBLIC_MARKER)[1]));
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
