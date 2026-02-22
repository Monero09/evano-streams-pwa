import React, { useState, useEffect } from 'react';
import { uploadVideo, getMyVideos } from './lib/api';
import type { Video } from './lib/types';
import { useAuth } from './components/AuthProvider';
import { useToast } from './components/Toast';
import { useNavigate } from 'react-router-dom';

export default function CreatorDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Movies');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Stats state
    const [myVideos, setMyVideos] = useState<Video[]>([]);
    const [totalViews, setTotalViews] = useState(0);

    useEffect(() => {
        if (user) {
            getMyVideos(user.id).then(videos => {
                setMyVideos(videos);
                const views = videos.reduce((acc, curr) => acc + (curr.views || 0), 0);
                setTotalViews(views);
            });
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumb') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'video') setVideoFile(e.target.files[0]);
            else setThumbnailFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !videoFile || !thumbnailFile || !title) {
            showToast('Please fill in all fields and select files.', 'error');
            return;
        }

        try {
            setUploading(true);
            await uploadVideo({
                title,
                description,
                category,
                videoFile,
                thumbnailFile
            }, user.id);

            showToast('Video uploaded successfully! It is now pending approval.', 'success');
            navigate('/');
        } catch (error: any) {
            console.error(error);
            showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: 20, maxWidth: 800, margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Creator Dashboard</h1>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #555', color: 'white', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
                    Back to Home
                </button>
            </div>

            <div className="stats" style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
                <div style={{ background: '#1A1F2E', padding: 20, borderRadius: 10, flex: 1 }}>
                    <h3>Total Views</h3>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#D60074' }}>{totalViews.toLocaleString()}</p>
                </div>
                <div style={{ background: '#1A1F2E', padding: 20, borderRadius: 10, flex: 1 }}>
                    <h3>Total Videos</h3>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: '#D60074' }}>{myVideos.length}</p>
                </div>
            </div>

            <h2>Upload New Video</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input
                    placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, background: '#1A1F2E', border: '1px solid #333', color: 'white' }}
                />
                <textarea
                    placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, background: '#1A1F2E', border: '1px solid #333', color: 'white', minHeight: 100 }}
                />

                <div style={{ background: '#1A1F2E', padding: 12, borderRadius: 8, border: '1px solid #333' }}>
                    <label style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: 13 }}>Thumbnail Image</label>
                    <input
                        type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'thumb')}
                        style={{ color: 'white' }}
                    />
                </div>

                <div style={{ background: '#1A1F2E', padding: 12, borderRadius: 8, border: '1px solid #333' }}>
                    <label style={{ display: 'block', marginBottom: 8, color: '#aaa', fontSize: 13 }}>Video File (MP4)</label>
                    <input
                        type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')}
                        style={{ color: 'white' }}
                    />
                </div>

                <select
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, background: '#1A1F2E', border: '1px solid #333', color: 'white' }}
                >
                    <option value="Movies">Movies</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Music">Music</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Skit video">Skit video</option>
                </select>

                <button
                    type="submit"
                    disabled={uploading}
                    style={{
                        padding: 14,
                        background: uploading ? '#555' : '#D60074',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 'bold',
                        cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
            </form>
        </div>
    );
}
