import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, unwrap } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  /** True until the stored session has been checked. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Turns Supabase auth errors into messages a student understands. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Wrong email or password. Try again.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'This email already has an account. Log in instead.';
  if (m.includes('email not confirmed'))
    return 'Email confirmation is switched on in Supabase. Turn it off: Authentication → Sign In / Providers → Email.';
  if (m.includes('validate email')) return 'This email address looks wrong. Check it and try again.';
  if (m.includes('rate limit')) return 'Too many attempts from this network. Wait a minute and try again.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap<Profile>(await supabase.from('profiles').select('id, name, role').eq('id', userId!).single()),
  });

  const value: AuthState = {
    loading: !checked || (!!userId && profileQuery.isPending),
    session,
    profile: profileQuery.data ?? null,
    isAdmin: profileQuery.data?.role === 'admin',

    async signUp(name, email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw new Error(friendlyAuthError(error.message));
      // With email confirmation on, Supabase returns no session (and hides duplicate emails).
      if (!data.session) throw new Error(friendlyAuthError('email not confirmed'));
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendlyAuthError(error.message));
    },

    async signOut() {
      await supabase.auth.signOut();
      qc.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
