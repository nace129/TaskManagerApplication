import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: profile?.role || 'user'
        }
      });
    }
  },
  signUp: async (email, password) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: 'user'
        }
      });
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        set({
          user: {
            id: user.id,
            email: user.email!,
            role: profile?.role || 'user'
          }
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  }
}));