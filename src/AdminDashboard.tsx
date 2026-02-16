import { useEffect, useState } from 'react';
import { useAuth } from './components/AuthProvider';
import { getPendingVideos, updateVideoStatus, type Video } from './lib/api';

export default function AdminDashboard() {
    const { user, role, loading } = useAuth();
    const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (user && role === 'admin') {
            loadPendingVideos();
        }
    }, [user, role]);

    const loadPendingVideos = async () => {
        setIsLoadingData(true);
        const data = await getPendingVideos();
        setPendingVideos(data);
        setIsLoadingData(false);
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateVideoStatus(id, status);
            // Remove from list
            setPendingVideos(prev => prev.filter(v => v.id !== id));
            alert(`Video ${status}!`);
        } catch (error) {
            console.error(error);
            alert('Error updating status');
        }
    };

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    if (!user || role !== 'admin') {
        return <div style={{ color: 'white', padding: 20 }}>Access Denied</div>;
    }

    return (
        <div className="admin-container" style={{ padding: 20, maxWidth: 1000, margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Admin Dashboard - Approvals</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => window.location.href = '/admin/ads'} style={{ background: '#FF6A00', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                        Manage Ads
                    </button>
                    <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: '1px solid #555', color: 'white', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
                        Back to Home
                    </button>
                </div>
            </div>
            <p style={{ color: '#aaa', marginBottom: 20 }}>Review pending videos.</p>

            {isLoadingData ? (
                <p>Loading pending videos...</p>
            ) : pendingVideos.length === 0 ? (
                <div style={{ background: '#1A1F2E', padding: 40, borderRadius: 10, textAlign: 'center', color: '#aaa' }}>
                    No pending videos to review.
                </div>
            ) : (
                <div className="video-list">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {pendingVideos.map((vid) => (
                            <div key={vid.id} style={{ background: '#1A1F2E', padding: 15, borderRadius: 10, position: 'relative' }}>
                                <div style={{ position: 'relative', height: 160 }}>
                                    <img src={vid.thumbnail_url} alt={vid.title} style={{ width: '100%', borderRadius: 8, height: '100%', objectFit: 'cover' }} />
                                    <span style={{ position: 'absolute', top: 8, right: 8, background: '#FF6A00', color: 'black', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>
                                        PENDING
                                    </span>
                                </div>
                                <h3 style={{ margin: '10px 0 5px', fontSize: 16 }}>{vid.title}</h3>
                                <p style={{ fontSize: 12, color: '#aaa' }}>{vid.category}</p>
                                <p style={{ fontSize: 13, color: '#ccc', margin: '10px 0', height: 40, overflow: 'hidden' }}>{vid.description}</p>

                                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                                    <button
                                        onClick={() => handleStatusUpdate(vid.id, 'rejected')}
                                        style={{ flex: 1, background: '#ff4d4f', color: 'white', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(vid.id, 'approved')}
                                        style={{ flex: 1, background: '#52c41a', color: 'white', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Approve
                                    </button>
                                </div>
                                <div style={{ marginTop: 10, textAlign: 'center' }}>
                                    <a href={vid.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#FF6A00', fontSize: 12, textDecoration: 'none' }}>Preview Video</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
