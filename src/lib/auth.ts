import { supabase } from './supabase';
import { User } from '../types/auth';
import { DeviceId } from './devices';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password, name }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;

    // Profile will be created automatically by database trigger
    // If trigger doesn't exist, we'll create it on first login

    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return { user: null, session: null, error };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error: any) {
    return { user: null, session: null, error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error: any) {
    return { session: null, error };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Fetch user profile from database
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      subscription: data.subscription || 'free',
      workoutsThisWeek: data.workouts_this_week || 0,
      selectedDevices: (data.selected_devices || ['garmin']) as DeviceId[],
      billingDate: data.billing_date ? new Date(data.billing_date) : undefined,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<User>) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subscription !== undefined) updateData.subscription = updates.subscription;
    if (updates.workoutsThisWeek !== undefined) updateData.workouts_this_week = updates.workoutsThisWeek;
    if (updates.selectedDevices !== undefined) updateData.selected_devices = updates.selectedDevices;
    if (updates.billingDate !== undefined) updateData.billing_date = updates.billingDate.toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Sign in with OAuth provider (Google, Apple, etc.)
 */
export async function signInWithOAuth(provider: 'google' | 'apple') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    });

    if (error) throw error;

    // The redirect will happen automatically
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error: any) {
    return { session: null, error };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

