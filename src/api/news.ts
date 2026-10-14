import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FALLBACK_POLL_MS } from '../lib/constants';
import { supabase, unwrap } from '../lib/supabase';
import type { Article, ArticleInput } from '../types';

export const newsKeys = {
  all: ['articles'] as const,
  one: (id: string) => ['articles', 'one', id] as const,
};

export function useArticles() {
  return useQuery({
    queryKey: newsKeys.all,
    refetchInterval: FALLBACK_POLL_MS,
    queryFn: async () =>
      unwrap<Article[]>(await supabase.from('articles').select('*').order('published_at', { ascending: false })),
  });
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: newsKeys.one(id ?? ''),
    enabled: !!id,
    queryFn: async () => unwrap<Article | null>(await supabase.from('articles').select('*').eq('id', id!).maybeSingle()),
  });
}

export function useSaveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ArticleInput & { author_name?: string } }) => {
      // Only one pinned notice at a time.
      if (input.is_notice) {
        let unpin = supabase.from('articles').update({ is_notice: false }).eq('is_notice', true);
        if (id) unpin = unpin.neq('id', id);
        unwrap(await unpin);
      }
      const query = id ? supabase.from('articles').update(input).eq('id', id) : supabase.from('articles').insert(input);
      return unwrap<{ id: string }>(await query.select('id').single()).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: newsKeys.all }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('articles').delete().eq('id', id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: newsKeys.all }),
  });
}
