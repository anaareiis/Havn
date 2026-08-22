import { supabase } from './supabase';

export async function ensureSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw error ?? new Error('Failed to create an anonymous Supabase session');
  }

  return data.session.user.id;
}
