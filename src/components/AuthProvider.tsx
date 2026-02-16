import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of the context
interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    role: 'viewer' | 'creator' | 'admin' | null;
    tier: 'free' | 'premium' | null;
    username: string | null;
    login: (email: string, password?: string) => Promise<void>;
    signUp: (email: string, password?: string, role?: 'viewer' | 'creator', username?: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Define the shape of the user profile from the DB
interface UserProfile {
    id: string;
    role: 'viewer' | 'creator' | 'admin';
    tier: 'free' | 'premium';
    username?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // If we already have a profile for this user, don't re-fetch unnecessarily unless needed?
                // For now, let's keep it safe and fetch, but ensure loading clears
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false); // Clear loading if no user
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // Using direct fetch because supabase-js client is experiencing timeouts in this environment
            const SUPABASE_URL = 'https://iecoiaxzerndjxisxbju.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY29pYXh6ZXJuZGp4aXN4Ymp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MzUwOTIsImV4cCI6MjA4NDUxMTA5Mn0.4BLuTIYdtgqhHLdbt2Q-cC_0FdmTdW_6G1B3LxBlbdM';

            const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                console.error('Error fetching profile (fetch):', response.statusText);
                return;
            }

            const data = await response.json();
            if (data && data.length > 0) {
                setProfile(data[0] as UserProfile);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password?: string) => {
        if (!password) {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            alert('Check your email for the login link!');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    };

    const signUp = async (email: string, password?: string, role: 'viewer' | 'creator' = 'viewer', username?: string) => {
        // 1. Sign up auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password: password || '',
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    username: username || email.split('@')[0],
                    role: role // Pass role in metadata so trigger can use it
                }
            }
        });

        if (error) {
            console.error('Signup error:', error);
            throw error;
        }

        console.log('Signup successful:', data);

        // 2. Wait for trigger to create profile, then check if it exists
        if (data.user) {
            // Wait for trigger
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if profile was created by trigger
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (!existingProfile) {
                // Trigger didn't work - manually create profile as fallback
                console.warn('Trigger failed, manually creating profile...');
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        role: role,
                        tier: 'free',
                        username: username || email.split('@')[0]
                    }]);

                if (profileError) {
                    console.error('Manual profile creation failed:', profileError);
                    throw profileError;
                }
                console.log('Profile created manually');
            } else {
                console.log('Profile created by trigger:', existingProfile);
            }

            // Fetch profile to update local state
            await fetchProfile(data.user.id);
        }
    };

    const logout = async () => {
        try {
            // Attempt to sign out from Supabase, but don't wait forever
            // If the network is borked (like the fetch timeouts), we still want to log the user out locally
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
            await Promise.race([signOutPromise, timeoutPromise]);
        } catch (e) {
            console.error("Supabase signOut failed (proceeding with local logout):", e);
        }

        // Force clear local state
        setUser(null);
        setSession(null);
        setProfile(null);

        // Setup for forceful cleanup if needed (Supabase usually uses localStorage with key `sb-${url}-auth-token`)
        // We can manually clear it if we knew the exact key, but clearing state and reloading logic in UI usually suffices
        // provided we don't re-hydrate the bad session instantly.
        localStorage.clear(); // Nuclear option for this PWA to ensure clean slate, or we could be more specific.
        // Being nuclear is safer for "nothing happens" bugs.
    };

    const value = {
        session,
        user,
        profile,
        loading,
        role: profile?.role ?? 'viewer', // default to viewer if undefined
        tier: profile?.tier ?? 'free',
        username: profile?.username ?? null,
        login,
        signUp,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the AuthContext
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
