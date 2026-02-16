
// Ad Types
export interface Ad {
    id: string;
    title: string;
    type: 'video' | 'banner';
    url: string; // Video URL or Image URL
    created_at: string;
}

// Updated Video interface to include ad management
export interface Video {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    views?: number;
    created_by?: string;
    ads_enabled?: boolean;
    preroll_ad_id?: string | null;
}

export interface VideoUploadData {
    title: string;
    description: string;
    category: string;
    videoFile: File;
    thumbnailFile: File;
}

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://iecoiaxzerndjxisxbju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY29pYXh6ZXJuZGp4aXN4Ymp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MzUwOTIsImV4cCI6MjA4NDUxMTA5Mn0.4BLuTIYdtgqhHLdbt2Q-cC_0FdmTdW_6G1B3LxBlbdM';

// --- HELPERS ---
async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    try {
        const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'x-upsert': 'true'
            },
            body: file
        });

        if (!response.ok) {
            console.error(`Upload failed: ${response.statusText}`);
            return null;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    } catch (e) {
        console.error("Upload error:", e);
        return null;
    }
}

// --- 1. FETCH VIDEOS (VIEWER) ---
export async function fetchVideos() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*&status=eq.approved&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) return [];
        const data = await response.json();
        return data as Video[];
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
    const thumbnailUrl = await uploadFile('thumbnails', thumbPath, thumbnailFile);
    if (!thumbnailUrl) throw new Error("Failed to upload thumbnail");

    // B. Upload Video
    const videoPath = `${userId}/${timestamp}_vid_${videoFile.name.replace(/\s+/g, '_')}`;
    const videoUrl = await uploadFile('videos', videoPath, videoFile);
    if (!videoUrl) throw new Error("Failed to upload video");

    // C. Insert Metadata
    const response = await fetch(`${SUPABASE_URL}/rest/v1/videos`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            title,
            description,
            category,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            status: 'pending',
            created_by: userId,
            views: 0,
            ads_enabled: true // Default: ads enabled
        })
    });

    if (!response.ok) throw new Error("Failed to save video metadata");
    const data = await response.json();
    return data[0];
}

// --- 3. GET PENDING VIDEOS (ADMIN) ---
export async function getPendingVideos() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*&status=eq.pending`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) return [];
        return await response.json() as Video[];
    } catch (e) {
        return [];
    }
}

// --- 4. UPDATE STATUS (ADMIN) ---
export async function updateVideoStatus(id: string, status: 'approved' | 'rejected') {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error("Failed to update status");
    return await response.json();
}

// --- 5. GET MY VIDEOS (CREATOR) ---
export async function getMyVideos(userId: string) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*&created_by=eq.${userId}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) return [];
        return await response.json() as Video[];
    } catch (e) {
        return [];
    }
}

// --- 6. SEARCH ---
export async function searchVideos(query: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*&status=eq.approved&title=ilike.*${query}*`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!response.ok) return [];
    return await response.json() as Video[];
}

// --- 7. INCREMENT VIEWS ---
export async function incrementView(videoId: string) {
    try {
        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}&select=views`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const current = await getRes.json();
        const newViews = (current[0]?.views || 0) + 1;

        await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ views: newViews })
        });
    } catch (e) {
        console.error("View increment failed", e);
    }
}

// --- 8. AD MANAGEMENT (ADMIN) ---

export async function uploadAd(title: string, type: 'video' | 'banner', file: File) {
    const timestamp = Date.now();
    const bucket = type === 'video' ? 'ads_videos' : 'ads_banners';
    const path = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;

    const url = await uploadFile(bucket, path, file);
    if (!url) throw new Error("Failed to upload ad file");

    const response = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ title, type, url })
    });

    if (!response.ok) throw new Error("Failed to save ad metadata");
    return await response.json();
}

export async function getAds(type?: 'video' | 'banner') {
    try {
        const filter = type ? `&type=eq.${type}` : '';
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ads?select=*${filter}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) return [];
        return await response.json() as Ad[];
    } catch (e) {
        return [];
    }
}

export async function assignAdToVideo(videoId: string, adId: string | null) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preroll_ad_id: adId })
    });
    if (!response.ok) throw new Error("Failed to assign ad");
    return await response.json();
}

export async function toggleVideoAds(videoId: string, enabled: boolean) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ads_enabled: enabled })
    });
    if (!response.ok) throw new Error("Failed to toggle ads");
    return await response.json();
}

export async function getAdById(adId: string) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${adId}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data[0] as Ad;
    } catch (e) {
        return null;
    }
}

// --- 9. PREMIUM / TIER UPDATE (Using Secure RPC) ---
export async function updateUserTier(userId: string, tier: 'free' | 'premium') {
    console.log(`Calling RPC to upgrade user ${userId} to ${tier}...`);

    // Import supabase client
    const { supabase } = await import('./supabase');

    // Use the secure server function we created in Supabase
    const { error } = await supabase.rpc('upgrade_to_premium', {
        target_user_id: userId
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    }

    console.log("Upgrade successful!");
}
