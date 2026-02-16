import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { fetchVideos, getWatchLater, getWatchHistory, deleteMyAccount, type Video } from './lib/api';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, role, logout } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [watchLaterList, setWatchLaterList] = useState<Video[]>([]);
    const [historyList, setHistoryList] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        const allVideos = await fetchVideos();
        setVideos(allVideos);

        if (user) {
            const [wl, hist] = await Promise.all([
                getWatchLater(user.id),
                getWatchHistory(user.id)
            ]);
            setWatchLaterList(wl);
            setHistoryList(hist);
        }
        setLoading(false);
    };

    // Separate hero video from list
    const heroVideo = videos.length > 0 ? videos[0] : null;
    const videoList = videos.length > 0 ? videos.slice(1) : [];

    const handleWatch = (id: string) => {
        navigate(`/watch/${id}`);
    };

    const handleSearch = () => {
        navigate('/search');
    };

    const handleLogout = async () => {
        await logout();
        window.location.reload();
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await deleteMyAccount();
                await logout();
                alert("Account deleted.");
                window.location.reload();
            } catch (e) {
                console.error(e);
                alert("Failed to delete account. Please try again.");
            }
        }
    };

    if (loading && !videos.length) return <div style={{ color: 'white', padding: 20, textAlign: 'center' }}>Loading...</div>;

    const VideoRow = ({ title, list }: { title: string, list: Video[] }) => {
        if (!list || list.length === 0) return null;
        return (
            <section className="videos-section" style={{ marginBottom: 30 }}>
                <h2 className="section-title" style={{ fontSize: 18, marginBottom: 15, borderLeft: '4px solid #FF6A00', paddingLeft: 10 }}>{title}</h2>
                <div className="videos-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 15 }}>
                    {list.map((vid) => (
                        <div key={vid.id} className="video-card" onClick={() => handleWatch(String(vid.id))}>
                            <div className="video-thumbnail" style={{ height: 100 }}>
                                <img src={vid.thumbnail_url} alt={vid.title} style={{ objectFit: 'cover' }} />
                            </div>
                            <h3 className="video-title" style={{ fontSize: 13, marginTop: 8 }}>{vid.title}</h3>
                            <p className="video-channel" style={{ fontSize: 11 }}>{vid.category}</p>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    return (
        <div className="home-body" onClick={() => showUserMenu && setShowUserMenu(false)}>
            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <img src="/logo.png" alt="Evano Streams Logo" className="navbar-logo-icon" />
                    <span>EVANO STREAMS</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="search-icon-btn" onClick={handleSearch}>
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    </div>

                    {/* User Profile / Login Button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => {
                                if (user) {
                                    e.stopPropagation();
                                    setShowUserMenu(!showUserMenu);
                                } else {
                                    navigate('/login');
                                }
                            }}
                            className="nav-user-btn"
                            style={{
                                background: 'transparent',
                                color: '#FF6A00',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: 8,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: 15,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            {user && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            )}
                            {user ? (user.email?.split('@')[0] || 'User') : (
                                <span style={{
                                    border: '1px solid rgba(255, 106, 0, 0.3)',
                                    padding: '6px 16px',
                                    borderRadius: 20,
                                    fontSize: 14
                                }}>Login</span>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && user && (
                            <div style={{
                                position: 'absolute',
                                top: '120%',
                                right: 0,
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: 8,
                                width: 220,
                                zIndex: 1000,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                                overflow: 'hidden'
                            }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', fontSize: 12, color: '#aaa', background: '#1a1a1a' }}>
                                    Signed in as <br />
                                    <strong style={{ color: 'white', fontSize: 14 }}>{user.email}</strong>
                                </div>

                                {/* Go Premium (for non-admin users) */}
                                {role && role !== 'admin' && (
                                    <div
                                        onClick={() => navigate('/premium')}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            color: '#FFD700',
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #333',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                        className="menu-item"
                                    >
                                        <span>💎</span> Go Premium
                                    </div>
                                )}

                                {(role === 'admin' || role === 'creator') && (
                                    <div
                                        onClick={() => role === 'admin' ? navigate('/admin') : navigate('/creator')}
                                        style={{ padding: '12px 16px', cursor: 'pointer', color: 'white' }}
                                        className="menu-item"
                                    >
                                        📊 Dashboard
                                    </div>
                                )}

                                <div
                                    onClick={handleLogout}
                                    style={{ padding: '12px 16px', cursor: 'pointer', color: 'white', borderTop: '1px solid #333' }}
                                    className="menu-item"
                                >
                                    🚪 Log Out
                                </div>

                                <div
                                    onClick={handleDeleteAccount}
                                    style={{ padding: '12px 16px', cursor: 'pointer', color: '#ff4444', borderTop: '1px solid #333', fontSize: 12 }}
                                    className="menu-item"
                                >
                                    ⚠️ Delete Account
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container">
                {/* Hero Section */}
                {heroVideo && (
                    <div className="hero">
                        <div className="hero-background" style={{
                            backgroundImage: `linear-gradient(rgba(11, 15, 25, 0.4), rgba(11, 15, 25, 0.6)), url('${heroVideo.thumbnail_url}')`
                        }}></div>
                        <div className="hero-content">
                            <span className="hero-label">Featured</span>
                            <h1 className="hero-title">{heroVideo.title}</h1>
                            <p className="hero-subtitle">{heroVideo.description}</p>
                            <button className="hero-button" onClick={() => handleWatch(heroVideo.id)}>Watch Now</button>
                            {user && (
                                <button
                                    className="hero-button"
                                    style={{ background: 'rgba(255,255,255,0.2)', marginLeft: 10 }}
                                    onClick={() => handleWatch(heroVideo.id)}
                                >
                                    + My List
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Feature Strip */}
                <div className="feature-strip"></div>

                {/* My Lists */}
                {user && (
                    <>
                        <VideoRow title="Continue Watching" list={historyList} />
                        <VideoRow title="My List" list={watchLaterList} />
                    </>
                )}

                {/* Videos Section */}
                <section className="videos-section">
                    <h2 className="section-title">All Videos</h2>
                    {videoList.length === 0 && !heroVideo ? (
                        <p style={{ color: '#888' }}>No videos available.</p>
                    ) : (
                        <div className="videos-grid">
                            {videoList.map((vid) => (
                                <div key={vid.id} className="video-card" onClick={() => handleWatch(String(vid.id))}>
                                    <div className="video-thumbnail">
                                        <img src={vid.thumbnail_url} alt={vid.title} />
                                    </div>
                                    <h3 className="video-title">{vid.title}</h3>
                                    <p className="video-channel">{vid.category} • {vid.views || 0} views</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <style>{`
                .menu-item:hover {
                    background-color: #333;
                }
            `}</style>
        </div>
    );
}