import { useDeleteListing, useSetListingStatus } from '../../api/listings';
import type { Listing } from '../../types';
import { useFeedback } from '../ui/feedback';

/** Owner actions shared by the item page and "My listings": mark sold / relist and delete. */
export function useListingActions() {
  const { toast, confirm } = useFeedback();
  const setStatus = useSetListingStatus();
  const deleteListing = useDeleteListing();

  const toggleSold = async (listing: Pick<Listing, 'id' | 'status'>) => {
    const status = listing.status === 'sold' ? 'active' : 'sold';
    try {
      await setStatus.mutateAsync({ id: listing.id, status });
      toast(status === 'sold' ? 'Marked as sold' : 'Listing is available again');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const remove = async (listing: Pick<Listing, 'id' | 'title' | 'photos'>, onDone?: () => void) => {
    const ok = await confirm({
      title: 'Delete listing?',
      text: `“${listing.title}” will be removed from the marketplace. Your conversations about it stay in Messages.`,
      okLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteListing.mutateAsync(listing);
      toast('Listing deleted');
      onDone?.();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return { toggleSold, remove };
}
