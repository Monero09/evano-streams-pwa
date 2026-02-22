import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVideos, addToWatchLater, removeFromWatchLater, checkInWatchLater, addToHistory } from './lib/api';
import type { Video } from './lib/types';
import { useAuth } from './components/AuthProvider';

// ==========================================
// CUSTOM VIDEO PLAYER COMPONENT
// ==========================================

type PlayerProps = {
    videoSrc: string;
    poster?: string;
};

function CustomVideoPlayer({ videoSrc, poster }: PlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showBannerAd, setShowBannerAd] = useState(false);

    const hideTimerRef = useRef<number | null>(null);

    // Auto-hide controls
    useEffect(() => {
        const resetHide = () => {
            setShowControls(true);
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = window.setTimeout(() => {
                if (isPlaying) setShowControls(false);
            }, 3000);
        };

        const node = containerRef.current;
        node?.addEventListener('mousemove', resetHide);
        node?.addEventListener('touchstart', resetHide);

        resetHide();
        return () => {
            node?.removeEventListener('mousemove', resetHide);
            node?.removeEventListener('touchstart', resetHide);
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        };
    }, [isPlaying]);

    // Show banner ad 5 seconds after playback starts
    useEffect(() => {
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            setShowBannerAd(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [isPlaying]);

    // Update time and duration
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    // Click-to-pause functionality
    const handleVideoClick = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }

        // Show play/pause icon animation
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 600);
    };

    const togglePlay = () => {
        handleVideoClick();
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progressBar = progressBarRef.current;
        if (!video || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            await container.requestFullscreen().catch(() => { });
        } else {
            await document.exitFullscreen().catch(() => { });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className="custom-player-container"
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1280px',
                margin: '0 auto',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#000'
            }}
        >
            {/* Video Element */}
            <div
                onClick={handleVideoClick}
                style={{
                    position: 'relative',
                    paddingTop: '56.25%', // 16:9 aspect ratio
                    cursor: 'pointer',
                    backgroundColor: '#000'
                }}
            >
                <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={poster}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                    playsInline
                />

                {/* Center Play/Pause Icon Animation */}
                {showPlayIcon && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '80px',
                            color: 'white',
                            opacity: 0.9,
                            animation: 'fadeOut 0.6s ease-out',
                            pointerEvents: 'none',
                            zIndex: 10
                        }}
                    >
                        {isPlaying ? '▶' : '❚❚'}
                    </div>
                )}

                {/* Banner Ad (Lower Third) */}
                {showBannerAd && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            left: '20px',
                            background: 'linear-gradient(90deg, rgba(88, 28, 135, 0.95), rgba(219, 39, 119, 0.95))',
                            padding: '15px 20px',
                            borderRadius: '8px',
                            color: 'white',
                            maxWidth: '400px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(214, 0, 116, 0.3)',
                            animation: 'slideInLeft 0.5s ease-out',
                            zIndex: 5,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowBannerAd(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>
                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '5px' }}>SPONSORED</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Premium Content Awaits</div>
                        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                            Upgrade to Premium for ad-free streaming
                        </div>
                    </div>
                )}

                {/* Custom Controls */}
                <div
                    className={`custom-controls ${showControls ? 'visible' : 'hidden'}`}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
                        padding: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: showControls ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        zIndex: 4
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Bar */}
                    <div
                        ref={progressBarRef}
                        onClick={handleSeek}
                        style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <div
                            style={{
                                width: `${(currentTime / duration) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #D60074, #db2777)',
                                borderRadius: '3px',
                                transition: 'width 0.1s linear'
                            }}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                onClick={togglePlay}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {isPlaying ? '❚❚' : '▶'}
                            </button>
                            <div style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace' }}>
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        <button
                            onClick={toggleFullscreen}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            ⛶
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeOut {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
                }
                @keyframes slideInLeft {
                    0% { transform: translateX(-100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ==========================================
// WATCH PAGE COMPONENT
// ==========================================

export default function WatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, tier } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [inMyList, setInMyList] = useState(false);

    useEffect(() => {
        fetchVideos().then(data => {
            setVideos(data);
            setLoading(false);
        });
    }, []);

    const video = videos.find(v => v.id === id);

    // Effect for Views, History, and Ads
    useEffect(() => {
        if (video) {
            import('./lib/api').then(mod => mod.incrementView(video.id));

            // 1. History & Check List (if logged in)
            if (user) {
                addToHistory(user.id, video.id);
                checkInWatchLater(user.id, video.id).then(setInMyList);
            }

            // 2. Load pre-roll ad (disabled for now - using banner instead)
            // if (tier === 'free' && video.ads_enabled && video.preroll_ad_id) {
            //     getAdById(video.preroll_ad_id).then(ad => {
            //         if (ad && ad.type === 'video') {
            //             setAdUrl(ad.url);
            //         }
            //     });
            // }
        }
    }, [video, tier, user]);

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    if (!video) {
        return <div style={{ color: 'white', padding: 20 }}>Video not found.</div>;
    }

    const recommended = videos.filter(v => v.id !== video.id).slice(0, 8);

    const toggleMyList = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            if (inMyList) {
                await removeFromWatchLater(user.id, video.id);
                setInMyList(false);
            } else {
                await addToWatchLater(user.id, video.id);
                setInMyList(true);
            }
        } catch (e) {
            console.error('List toggle failed', e);
        }
    };

    return (
        <>
            <main className="watch-root">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="nav-icon-btn"
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        zIndex: 100
                    }}
                >
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>

                {/* Video Player Section */}
                <section className="watch-hero">
                    <CustomVideoPlayer
                        videoSrc={video.video_url}
                        poster={video.thumbnail_url}
                    />
                </section>

                {/* Video Metadata */}
                <section className="watch-meta">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="watch-title">{video.title}</h1>
                            <div className="watch-sub">{video.category} • {new Date(video.created_at).toLocaleDateString()}</div>
                        </div>
                        <button
                            onClick={toggleMyList}
                            style={{
                                background: inMyList ? '#D60074' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                marginTop: 10,
                                transition: 'all 0.2s',
                                color: 'white'
                            }}
                            title={inMyList ? 'Remove from My List' : 'Add to My List'}
                        >
                            {inMyList ? (
                                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                        </button>
                    </div>
                    <p className="watch-desc">{video.description}</p>
                </section>

                {/* Recommended Videos */}
                <aside className="watch-recs">
                    <h3 className="recs-header">Recommended</h3>
                    <div className="recs-grid">
                        {recommended.map((r) => (
                            <div key={r.id} className="rec-card" role="button" tabIndex={0} onClick={() => navigate(`/watch/${r.id}`)}>
                                <img src={r.thumbnail_url} alt={r.title} className="rec-thumb" />
                                <div style={{ padding: 8 }}>
                                    <div style={{ fontSize: 14, fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>
        </>
    );
}