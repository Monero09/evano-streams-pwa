import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { useToast } from './components/Toast';
import { fetchVideos, getWatchLater, getWatchHistory, deleteMyAccount } from './lib/api';
import type { Video } from './lib/types';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, role, logout } = useAuth();
    const { showToast } = useToast();
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

        try {
            // fetchVideos now includes is_featured sorting
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
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Failed to load content. Please refresh the page.', 'error');
        } finally {
            setLoading(false);
        }
    };

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
                showToast('Account deleted.', 'success');
                setTimeout(() => window.location.reload(), 800);
            } catch (e) {
                console.error(e);
                showToast('Failed to delete account. Please try again.', 'error');
            }
        }
    };

    // Hero Banner: the single featured video (is_featured === true)
    const heroVideo = videos.find(v => v.is_featured === true) || (videos.length > 0 ? videos[0] : null);

    // Netflix-style rows: fetch once, filter in memory (no extra API calls)
    const movies = videos.filter(v => v.category === 'Movies');
    const music = videos.filter(v => v.category === 'Music');
    const podcast = videos.filter(v => v.category === 'Podcast');
    const documentary = videos.filter(v => v.category === 'Documentary');
    const skitVideo = videos.filter(v => v.category === 'Skit video');

    if (loading && !videos.length) return <div style={{ color: 'white', padding: 20, textAlign: 'center' }}>Loading...</div>;

    const VideoRow = ({ title, list }: { title: string, list: Video[] }) => {
        if (!list || list.length === 0) return null;
        return (
            <section className="videos-section">
                <h2 className="section-title">{title}</h2>
                <div className="videos-row">
                    {list.map((vid) => (
                        <div key={vid.id} className="video-card" onClick={() => handleWatch(String(vid.id))}>
                            <div className="video-thumbnail">
                                <img src={vid.thumbnail_url} alt={vid.title} />
                            </div>
                            <h3 className="video-title">{vid.title}</h3>
                            <p className="video-channel">{vid.category}</p>
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
                    <img src="/logo.png" alt="Evano" className="logo-img" />
                </div>
                <div className="navbar-actions">
                    <div className="search-icon-btn" onClick={handleSearch}>
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    </div>

                    {/* User Profile Menu - Only show when logged in */}
                    {user ? (
                        <div className="user-profile-wrapper">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUserMenu(!showUserMenu);
                            }}
                            className="nav-user-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {user.email?.split('@')[0] || 'User'}
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && user && (
                            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
                                <div className="user-menu-header">
                                    Signed in as <br />
                                    <strong>{user.email}</strong>
                                </div>

                                {/* Go Premium (for non-admin users) */}
                                {role && role !== 'admin' && (
                                    <div
                                        onClick={() => navigate('/premium')}
                                        className="menu-item premium-item"
                                    >
                                        <span>💎</span> Go Premium
                                    </div>
                                )}

                                {/* Admin/Dashboard Link Removed as per request */}

                                <div
                                    onClick={handleLogout}
                                    className="menu-item logout-item"
                                >
                                    🚪 Log Out
                                </div>

                                <div
                                    onClick={handleDeleteAccount}
                                    className="menu-item delete-item"
                                >
                                    ⚠️ Delete Account
                                </div>
                            </div>
                        )}
                    </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="nav-user-btn login-btn"
                        >
                            Sign In
                        </button>
                    )}
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

                {/* Category Rows */}
                <VideoRow title="Movies" list={movies} />
                <VideoRow title="Music" list={music} />
                <VideoRow title="Podcast" list={podcast} />
                <VideoRow title="Documentary" list={documentary} />
                <VideoRow title="Skit video" list={skitVideo} />

                {videos.length === 0 && !loading && (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No videos available.</p>
                )}
            </div>
        </div>
    );
}
