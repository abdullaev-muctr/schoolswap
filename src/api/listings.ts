import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FALLBACK_POLL_MS } from '../lib/constants';
import { supabase, unwrap } from '../lib/supabase';
import type { Listing, ListingInput, ListingStatus } from '../types';
import { removePhotos } from './storage';

const SELECT = '*, seller:profiles(name)';

export const listingKeys = {
  all: ['listings'] as const,
  one: (id: string) => ['listings', 'one', id] as const,
};

/** All listings, newest first. A school marketplace is small, so search and filters run on the client. */
export function useListings() {
  return useQuery({
    queryKey: listingKeys.all,
    refetchInterval: FALLBACK_POLL_MS,
    queryFn: async () =>
      unwrap<Listing[]>(await supabase.from('listings').select(SELECT).order('created_at', { ascending: false })),
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.one(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap<Listing | null>(await supabase.from('listings').select(SELECT).eq('id', id!).maybeSingle()),
  });
}

function useInvalidateListings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: listingKeys.all });
}

export function useSaveListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async ({ id, input, removed = [] }: { id?: string; input: ListingInput; removed?: string[] }) => {
      const query = id
        ? supabase.from('listings').update(input).eq('id', id)
        : supabase.from('listings').insert(input);
      const saved = unwrap<{ id: string }>(await query.select('id').single());
      await removePhotos(removed);
      return saved.id;
    },
    onSuccess: invalidate,
  });
}

export function useSetListingStatus() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      unwrap(await supabase.from('listings').update({ status }).eq('id', id).select('id').single());
    },
    onSuccess: invalidate,
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: async (listing: Pick<Listing, 'id' | 'photos'>) => {
      unwrap(await supabase.from('listings').delete().eq('id', listing.id));
      await removePhotos(listing.photos);
    },
    onSuccess: invalidate,
  });
}
