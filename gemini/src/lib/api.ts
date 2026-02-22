import { supabase } from './supabase';
import type { Ad, Video, VideoUploadData } from './types';

export type { Ad, Video, VideoUploadData }; // Re-export for compatibility

// --- CONFIGURATION ---
// Configuration is now handled in supabase.ts

// --- CONSTANTS ---
const CATEGORY_MAP: Record<number, string> = {
    1: 'Movies',
    2: 'Music',
    3: 'Tech',
    4: 'Comedy',
    5: 'Drama',
    6: 'Action',
    7: 'Documentary',
    8: 'African',
};

// --- HELPERS ---
async function uploadFileToStorage(bucket: string, path: string, file: File): Promise<string | null> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error(`Upload failed: ${error.message}`);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Upload error:", e);
        return null;
    }
}

// --- 1. FETCH VIDEOS (VIEWER) ---
export async function fetchVideos(): Promise<Video[]> {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'approved')
            .order('is_featured', { ascending: false, nullsFirst: false }) // Featured videos first
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch error:", error.message);
            return [];
        }

        // Map database response to our interface
        return (data || []).map((video) => ({
            ...video,
            category: video.category || (video.category_id ? CATEGORY_MAP[video.category_id] || 'Other' : 'Other'),
            views: video.view_count || 0, // Map view_count to views for backward compatibility
        })) as Video[];
    } catch (e) {
        console.error("Fetch error:", e);
        return [];
    }
}

// --- 2. UPLOAD VIDEO (CREATOR) ---
export async function uploadVideo(uploadData: VideoUploadData, userId: string) {
    const timestamp = Date.now();
    const { title, description, category, videoFile, thumbnailFile } = uploadData;

    // A. Upload Thumbnail
    const thumbPath = `${userId}/${timestamp}_thumb_${thumbnailFile.name.replace(/\s+/g, '_')}`;
    const thumbnailUrl = await uploadFileToStorage('thumbnails', thumbPath, thumbnailFile);
    if (!thumbnailUrl) throw new Error("Failed to upload thumbnail");

    // B. Upload Video
    const videoPath = `${userId}/${timestamp}_vid_${videoFile.name.replace(/\s+/g, '_')}`;
    const videoUrl = await uploadFileToStorage('videos', videoPath, videoFile);
    if (!videoUrl) throw new Error("Failed to upload video");

    // C. Insert Metadata
    const { data, error } = await supabase
        .from('videos')
        .insert({
            title,
            description,
            category, // Note: Schema expects category_id or category string? API seems to save string 'category' in the 'category' column?
            // If the DB has a category column of type text, this is fine. If it expects category_id, we might need to map it.
            // Based on previous code: body: JSON.stringify({ ..., category, ... })
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            status: 'pending',
            created_by: userId,
            view_count: 0,
            ads_enabled: true
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to save video metadata: ${error.message}`);
    return data;
}

// --- 3. GET PENDING VIDEOS (ADMIN) ---
export async function getPendingVideos(): Promise<Video[]> {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'pending');

        if (error) {
            console.error("Fetch pending videos error:", error.message);
            return [];
        }
        return (data || []) as Video[];
    } catch (e) {
        console.error("Fetch pending videos error:", e);
        return [];
    }
}

// --- 4. UPDATE STATUS (ADMIN) ---
export async function updateVideoStatus(id: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabase
        .from('videos')
        .update({ status })
        .eq('id', id)
        .select();

    if (error) throw new Error(`Failed to update status: ${error.message}`);
    return data;
}

// --- 5. GET MY VIDEOS (CREATOR) ---
export async function getMyVideos(userId: string): Promise<Video[]> {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('created_by', userId);

        if (error) {
            console.error("Fetch my videos error:", error.message);
            return [];
        }
        return (data || []) as Video[];
    } catch (e) {
        console.error("Fetch my videos error:", e);
        return [];
    }
}

// --- 6. SEARCH ---
export async function searchVideos(query: string): Promise<Video[]> {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'approved')
            .ilike('title', `%${query}%`); // Supabase parameterizes this safely

        if (error) {
            console.error("Search error:", error.message);
            return [];
        }
        return (data || []) as Video[];
    } catch (e) {
        console.error("Search error:", e);
        return [];
    }
}

// --- 7. INCREMENT VIEWS ---
export async function incrementView(videoId: string): Promise<void> {
    try {
        // Use RPC if available for atomic increment, otherwise read-update (optimistic)
        // Ideally: await supabase.rpc('increment_view_count', { video_id: videoId });

        // Fallback to read-then-update pattern from previous code
        const { data: current } = await supabase
            .from('videos')
            .select('view_count')
            .eq('id', videoId)
            .single();

        const newViews = (current?.view_count || 0) + 1;

        await supabase
            .from('videos')
            .update({ view_count: newViews })
            .eq('id', videoId);

    } catch (e) {
        console.error("View increment failed:", e);
    }
}

// --- 8. AD MANAGEMENT (ADMIN) ---

export async function uploadAd(title: string, type: 'video' | 'banner', file: File) {
    const timestamp = Date.now();
    const bucket = type === 'video' ? 'ads_videos' : 'ads_banners';
    const path = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;

    const url = await uploadFileToStorage(bucket, path, file);
    if (!url) throw new Error("Failed to upload ad file");

    const { data, error } = await supabase
        .from('ads')
        .insert({ title, type, url })
        .select()
        .single();

    if (error) throw new Error(`Failed to save ad metadata: ${error.message}`);
    return data;
}

export async function getAds(type?: 'video' | 'banner'): Promise<Ad[]> {
    try {
        let query = supabase.from('ads').select('*');
        if (type) {
            query = query.eq('type', type);
        }
        const { data, error } = await query;

        if (error) {
            console.error("Fetch ads error:", error.message);
            return [];
        }
        return (data || []) as Ad[];
    } catch (e) {
        console.error("Fetch ads error:", e);
        return [];
    }
}

export async function assignAdToVideo(videoId: string, adId: string | null) {
    const { data, error } = await supabase
        .from('videos')
        .update({ preroll_ad_id: adId })
        .eq('id', videoId)
        .select();

    if (error) throw new Error("Failed to assign ad");
    return data;
}

export async function toggleVideoAds(videoId: string, enabled: boolean) {
    const { data, error } = await supabase
        .from('videos')
        .update({ ads_enabled: enabled })
        .eq('id', videoId)
        .select();

    if (error) throw new Error("Failed to toggle ads");
    return data;
}

export async function getAdById(adId: string): Promise<Ad | null> {
    try {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('id', adId)
            .single();

        if (error) {
            console.error("Fetch ad error:", error.message);
            return null;
        }
        return data as Ad;
    } catch (e) {
        console.error("Fetch ad error:", e);
        return null;
    }
}

// --- 9. PREMIUM / TIER UPDATE (Using Secure RPC) ---
export async function updateUserTier(userId: string, tier: 'free' | 'premium') {
    console.log(`Calling RPC to upgrade user ${userId} to ${tier}...`);

    // Use the secure server function we created in Supabase
    // Note: ensure 'upgrade_to_premium' RPC exists in your Supabase DB
    const { error } = await supabase.rpc('upgrade_to_premium', {
        target_user_id: userId
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    }

    console.log("Upgrade successful!");
}

// --- 10. WATCH LATER / MY LIST ---
export async function addToWatchLater(userId: string, videoId: string): Promise<void> {
    const { error } = await supabase
        .from('watch_later')
        .insert([{ user_id: userId, video_id: videoId }]);
    if (error) throw error;
}

export async function removeFromWatchLater(userId: string, videoId: string): Promise<void> {
    const { error } = await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', userId)
        .eq('video_id', videoId);
    if (error) throw error;
}

export async function getWatchLater(userId: string): Promise<Video[]> {
    const { data, error } = await supabase
        .from('watch_later')
        .select(`
            video_id,
            videos (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching watch later:", error.message);
        return [];
    }

    // Transform joined data back to Video[]
    return (data || [])
        .map((item: any) => {
            const video = Array.isArray(item.videos) ? item.videos[0] : item.videos;
            return video;
        })
        .filter(Boolean) as Video[];
}

export async function checkInWatchLater(userId: string, videoId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('watch_later')
        .select('video_id')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error checking watch later:", error.message);
        return false; // PGRST116 is "No rows found"
    }
    return !!data;
}

// --- 11. WATCH HISTORY ---
export async function addToHistory(userId: string, videoId: string): Promise<void> {
    // This will upsert (update if exists, insert if not) because we defined ON CONFLICT in SQL
    const { error } = await supabase
        .from('watch_history')
        .upsert([{ user_id: userId, video_id: videoId, last_watched_at: new Date().toISOString() }], { onConflict: 'user_id, video_id' });

    if (error) console.error("Error saving history:", error.message);
}

export async function getWatchHistory(userId: string): Promise<Video[]> {
    const { data, error } = await supabase
        .from('watch_history')
        .select(`
            video_id,
            videos (*)
        `)
        .eq('user_id', userId)
        .order('last_watched_at', { ascending: false })
        .limit(20); // Limit to last 20 videos

    if (error) {
        console.error("Error fetching history:", error.message);
        return [];
    }

    return (data || [])
        .map((item: any) => {
            const video = Array.isArray(item.videos) ? item.videos[0] : item.videos;
            return video;
        })
        .filter(Boolean) as Video[];
}

// --- 12. ACCOUNT DELETION ---
export async function deleteMyAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
}
