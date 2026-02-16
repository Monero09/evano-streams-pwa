import { useState, useEffect } from 'react';
import { useAuth } from './components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import {
    uploadAd,
    getAds,
    getPendingVideos,
    assignAdToVideo,
    toggleVideoAds,
    type Ad,
    type Video
} from './lib/api';

export default function AdminAdsPage() {
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const [ads, setAds] = useState<Ad[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload states
    const [uploadType, setUploadType] = useState<'video' | 'banner'>('video');
    const [adTitle, setAdTitle] = useState('');
    const [adFile, setAdFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user && role === 'admin') {
            loadData();
        }
    }, [user, role]);

    const loadData = async () => {
        setLoading(true);
        const [adsData, videosData] = await Promise.all([
            getAds(),
            getPendingVideos()
        ]);
        setAds(adsData);
        setVideos(videosData);
        setLoading(false);
    };

    const handleUploadAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adFile || !adTitle) {
            alert('Please provide title and file');
            return;
        }

        setUploading(true);
        try {
            await uploadAd(adTitle, uploadType, adFile);
            alert('Ad uploaded successfully!');
            setAdTitle('');
            setAdFile(null);
            loadData();
        } catch (error) {
            alert('Failed to upload ad');
            console.error(error);
        }
        setUploading(false);
    };

    const handleAssignAd = async (videoId: string) => {
        const adId = prompt('Enter Ad ID to assign (or leave empty to remove):');
        try {
            await assignAdToVideo(videoId, adId || null);
            alert('Ad assignment updated!');
            loadData();
        } catch (error) {
            alert('Failed to assign ad');
        }
    };

    const handleToggleAds = async (videoId: string, currentState: boolean) => {
        try {
            await toggleVideoAds(videoId, !currentState);
            alert(`Ads ${!currentState ? 'enabled' : 'disabled'} for video`);
            loadData();
        } catch (error) {
            alert('Failed to toggle ads');
        }
    };

    if (!user || role !== 'admin') {
        return <div style={{ color: 'white', padding: 20 }}>Access Denied</div>;
    }

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    return (
        <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h1>Ad Management</h1>
                <button onClick={() => navigate('/admin')} className="auth-btn" style={{ width: 'auto', padding: '8px 16px' }}>
                    Back to Approvals
                </button>
            </div>

            {/* Upload Ad Section */}
            <div style={{ background: '#1A1F2E', padding: 30, borderRadius: 12, marginBottom: 30 }}>
                <h2 style={{ marginBottom: 20 }}>Upload New Ad</h2>
                <form onSubmit={handleUploadAd} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value as 'video' | 'banner')}
                        className="auth-input"
                    >
                        <option value="video">Pre-Roll Video Ad</option>
                        <option value="banner">Banner Image Ad</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Ad Title"
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                        className="auth-input"
                        required
                    />

                    <input
                        type="file"
                        accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                        onChange={(e) => setAdFile(e.target.files?.[0] || null)}
                        className="auth-input"
                        required
                    />

                    <button type="submit" className="auth-btn" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Ad'}
                    </button>
                </form>
            </div>

            {/* Existing Ads */}
            <div style={{ marginBottom: 40 }}>
                <h2 style={{ marginBottom: 20 }}>Existing Ads ({ads.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                    {ads.map(ad => (
                        <div key={ad.id} style={{ background: '#1A1F2E', padding: 15, borderRadius: 12 }}>
                            {ad.type === 'video' ? (
                                <video src={ad.url} controls style={{ width: '100%', borderRadius: 8 }} />
                            ) : (
                                <img src={ad.url} alt={ad.title} style={{ width: '100%', borderRadius: 8 }} />
                            )}
                            <h4 style={{ margin: '10px 0 5px' }}>{ad.title}</h4>
                            <p style={{ fontSize: 12, color: '#aaa' }}>Type: {ad.type}</p>
                            <p style={{ fontSize: 10, color: '#666', marginTop: 5 }}>ID: {ad.id}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Ad Management */}
            <div>
                <h2 style={{ marginBottom: 20 }}>Manage Video Ads</h2>
                <div style={{ display: 'grid', gap: 15 }}>
                    {videos.map(video => (
                        <div key={video.id} style={{
                            background: '#1A1F2E',
                            padding: 15,
                            borderRadius: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h4>{video.title}</h4>
                                <p style={{ fontSize: 12, color: '#aaa' }}>
                                    Ads: {video.ads_enabled ? '✅ Enabled' : '❌ Disabled'} |
                                    Pre-roll: {video.preroll_ad_id || 'None'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => handleAssignAd(video.id)}
                                    style={{
                                        background: '#FF6A00',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontSize: 12
                                    }}
                                >
                                    Assign Ad
                                </button>
                                <button
                                    onClick={() => handleToggleAds(video.id, video.ads_enabled || false)}
                                    style={{
                                        background: video.ads_enabled ? '#ff4d4f' : '#52c41a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontSize: 12
                                    }}
                                >
                                    {video.ads_enabled ? 'Disable Ads' : 'Enable Ads'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
