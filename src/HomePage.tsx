import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { fetchVideos, type Video } from './lib/api';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, role, logout } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        const data = await fetchVideos();
        setVideos(data);
        setLoading(false);
    };

    // Separate hero video from list
    const heroVideo = videos.length > 0 ? videos[0] : null; // Just pick first as hero for now
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



    if (loading) return <div style={{ color: 'white', padding: 20, textAlign: 'center' }}>Loading videos...</div>;

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
                                background: '#222',
                                border: '1px solid #444',
                                borderRadius: 8,
                                width: 200,
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                            }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', fontSize: 12, color: '#aaa' }}>
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
                                            color: '#FF6A00',
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #333',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        ⭐ Go Premium
                                    </div>
                                )}

                                {(role === 'admin' || role === 'creator') && (
                                    <div
                                        onClick={() => role === 'admin' ? navigate('/admin') : navigate('/creator')}
                                        style={{ padding: '12px 16px', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Dashboard
                                    </div>
                                )}

                                <div
                                    onClick={handleLogout}
                                    style={{ padding: '12px 16px', cursor: 'pointer', color: '#ff4d4d', borderTop: '1px solid #333', transition: 'background 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Log Out
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
                        </div>
                    </div>
                )}

                {/* Feature Strip */}
                <div className="feature-strip"></div>

                {/* Videos Section */}
                <section className="videos-section">
                    <h2 className="section-title">Videos</h2>
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


        </div>
    );
}