import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useToast } from './Toast';

// Constants
const PROFILE_CREATE_DELAY = 1000; // 1 second
const LOGOUT_TIMEOUT = 2000; // 2 seconds

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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { showToast } = useToast();
    const profileFetchInProgressRef = useRef<boolean>(false);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                setCurrentUserId(session.user.id);
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
                setCurrentUserId(session.user.id);
            } else {
                setProfile(null);
                setCurrentUserId(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch profile only when userId changes
    useEffect(() => {
        if (!currentUserId) return;
        fetchProfile(currentUserId);
    }, [currentUserId]);

    const fetchProfile = async (userId: string) => {
        // Prevent duplicate fetches
        if (profileFetchInProgressRef.current) return;
        profileFetchInProgressRef.current = true;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error.message);
                return;
            }

            setProfile(data as UserProfile);
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {
            setLoading(false);
            profileFetchInProgressRef.current = false;
        }
    };

    const login = async (email: string, password?: string) => {
        if (!password) {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            showToast('Check your email for the login link!', 'info');
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
            await new Promise(resolve => setTimeout(resolve, PROFILE_CREATE_DELAY));

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
            // If the network is unstable, we still want to log the user out locally
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, LOGOUT_TIMEOUT));
            await Promise.race([signOutPromise, timeoutPromise]);
        } catch (e) {
            console.error("Supabase signOut failed (proceeding with local logout):", e);
        }

        // Force clear local state
        setUser(null);
        setSession(null);
        setProfile(null);
        setCurrentUserId(null);

        // Clear only Supabase auth tokens, not all localStorage
        // Supabase stores auth in localStorage with key pattern: sb-${url}-auth-token
        const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('sb-') && key.includes('auth-token'));
        supabaseKeys.forEach(key => localStorage.removeItem(key));
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
