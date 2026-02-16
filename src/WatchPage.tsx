import React, { useEffect, useRef, useState } from "react";


// ==========================================
// 2. VIDEO PLAYER COMPONENT
// ==========================================

type PlayerProps = {
    videoSrc: string;
    preRollSrc?: string;
    poster?: string;
};

function VideoPlayer({ videoSrc, preRollSrc, poster }: PlayerProps) {
    const adRef = useRef<HTMLVideoElement | null>(null);
    const mainRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [isAdPlaying, setIsAdPlaying] = useState(!!preRollSrc);
    const [canSkipAd, setCanSkipAd] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [lowerThirdVisible, setLowerThirdVisible] = useState(false);
    const hideTimerRef = useRef<number | null>(null);
    const lowerThirdTimerRef = useRef<number | null>(null);

    // Auto-hide controls
    useEffect(() => {
        const resetHide = () => {
            setShowControls(true);
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = window.setTimeout(() => {
                if (playing) setShowControls(false);
            }, 2500);
        };

        const node = containerRef.current;
        node?.addEventListener("mousemove", resetHide);
        node?.addEventListener("touchstart", resetHide);

        resetHide();
        return () => {
            node?.removeEventListener("mousemove", resetHide);
            node?.removeEventListener("touchstart", resetHide);
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        };
    }, [playing]);

    // Lower-third intermittent ad scheduler
    useEffect(() => {
        const schedule = () => {
            const ms = 8000 + Math.random() * 15000; // 8–23s intervals
            lowerThirdTimerRef.current = window.setTimeout(() => {
                setLowerThirdVisible(true);
                setTimeout(() => setLowerThirdVisible(false), 4000); // visible 4s
                schedule();
            }, ms);
        };
        schedule();
        return () => {
            if (lowerThirdTimerRef.current) window.clearTimeout(lowerThirdTimerRef.current);
        };
    }, []);

    // Init volumes
    useEffect(() => {
        if (adRef.current) adRef.current.volume = volume;
        if (mainRef.current) mainRef.current.volume = volume;
    }, [volume]);

    // Start ad on mount if present; allow skip after 5s
    useEffect(() => {
        if (!preRollSrc) return;
        const ad = adRef.current!;
        const onTime = () => {
            if (ad.currentTime >= 5 && !canSkipAd) setCanSkipAd(true);
        };
        const onEnded = () => {
            setIsAdPlaying(false);
            mainRef.current?.play();
            setPlaying(true);
        };
        ad.addEventListener("timeupdate", onTime);
        ad.addEventListener("ended", onEnded);
        ad.play().catch(() => { });
        setPlaying(true);
        return () => {
            ad.removeEventListener("timeupdate", onTime);
            ad.removeEventListener("ended", onEnded);
        };
    }, [preRollSrc]);

    // Progress handler for main video
    useEffect(() => {
        const v = mainRef.current;
        if (!v) return;
        const onTime = () => {
            setProgress((v.currentTime / v.duration) || 0);
        };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        v.addEventListener("timeupdate", onTime);
        v.addEventListener("play", onPlay);
        v.addEventListener("pause", onPause);
        return () => {
            v.removeEventListener("timeupdate", onTime);
            v.removeEventListener("play", onPlay);
            v.removeEventListener("pause", onPause);
        };
    }, []);

    const togglePlay = () => {
        const v = isAdPlaying ? adRef.current! : mainRef.current!;
        if (!v) return;
        if (v.paused) v.play();
        else v.pause();
        setPlaying(!v.paused);
    };

    const skipAd = () => {
        if (!isAdPlaying) return;
        adRef.current!.pause();
        setIsAdPlaying(false);
        mainRef.current?.play();
        setPlaying(true);
    };

    const seek = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const v = mainRef.current!;
        v.currentTime = (v.duration || 0) * pct;
        setProgress(pct);
    };

    const toggleFull = async () => {
        const el = containerRef.current!;
        if (!document.fullscreenElement) await el.requestFullscreen().catch(() => { });
        else await document.exitFullscreen().catch(() => { });
    };

    return (
        <div className="player-wrap" ref={containerRef}>
            <div className="video-stage">
                {isAdPlaying && preRollSrc ? (
                    <video
                        ref={adRef}
                        className="video-element"
                        src={preRollSrc}
                        poster={poster}
                        playsInline
                        preload="auto"
                    // controls intentionally hidden; we present skip & minimal UX
                    />
                ) : (
                    <video
                        ref={mainRef}
                        className="video-element"
                        src={videoSrc}
                        poster={poster}
                        playsInline
                        preload="metadata"
                    />
                )}

                {/* Large center play/pause */}
                {showControls && (
                    <button
                        className={`center-play ${playing ? "hidden-sm" : ""}`}
                        onClick={togglePlay}
                        aria-label={playing ? "Pause" : "Play"}
                    >
                        {playing ? "❚❚" : "►"}
                    </button>
                )}

                {/* Top-left pre-roll badge */}
                {isAdPlaying && (
                    <div className="ad-badge">Ad — Sponsored</div>
                )}

                {/* Skip button */}
                {isAdPlaying && canSkipAd && (
                    <button className="skip-ad" onClick={skipAd}>
                        Skip Ad
                    </button>
                )}

                {/* Lower-third ad overlay (non-blocking) */}
                <div
                    className={`lower-third ${lowerThirdVisible ? "visible" : ""}`}
                    aria-hidden
                >
                    <div className="lt-inner">
                        <div className="lt-brand">Sponsor</div>
                        <div className="lt-text">Discover more. Visit sponsor.example</div>
                    </div>
                </div>

                {/* Controls (auto-hide) */}
                <div className={`controls ${showControls ? "visible" : "hidden"}`}>
                    <div className="controls-left">
                        <button className="ctrl-btn" onClick={togglePlay}>
                            {playing ? "❚❚" : "►"}
                        </button>

                        <div className="volume">
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setVolume(v);
                                    if (adRef.current) adRef.current.volume = v;
                                    if (mainRef.current) mainRef.current.volume = v;
                                }}
                                aria-label="Volume"
                            />
                        </div>
                    </div>

                    <div className="progress" onClick={seek} role="progressbar" aria-valuenow={Math.round(progress * 100)}>
                        <div className="progress-bar">
                            <div className="progress-filled" style={{ transform: `scaleX(${progress})` }} />
                        </div>
                    </div>

                    <div className="controls-right">
                        <button className="ctrl-btn" onClick={toggleFull}>⤢</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. PAGE COMPONENT & DATA
// ==========================================

import { useParams, useNavigate } from 'react-router-dom';
import { fetchVideos, getAdById, addToWatchLater, removeFromWatchLater, checkInWatchLater, addToHistory, type Video } from './lib/api';
import { useAuth } from './components/AuthProvider';

export default function WatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, tier } = useAuth(); // Get user
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [adUrl, setAdUrl] = useState<string | undefined>(undefined);
    const [inMyList, setInMyList] = useState(false); // State for My List

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

            // 2. Load pre-roll ad
            if (tier === 'free' && video.ads_enabled && video.preroll_ad_id) {
                getAdById(video.preroll_ad_id).then(ad => {
                    if (ad && ad.type === 'video') {
                        setAdUrl(ad.url);
                    }
                });
            }
        }
    }, [video, tier, user]);

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    if (!video) {
        return <div style={{ color: 'white', padding: 20 }}>Video not found.</div>;
    }

    const recommended = videos.filter(v => v.id !== video.id);

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
            console.error("List toggle failed", e);
        }
    };

    return (
        <>
            <main className="watch-root">
                {/* ... (navigation button) ... */}
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
                <section className="watch-hero">
                    <VideoPlayer
                        videoSrc={video.video_url}
                        poster={video.thumbnail_url}
                        preRollSrc={adUrl}
                    />
                </section>

                <section className="watch-meta">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="watch-title">{video.title}</h1>
                            <div className="watch-sub">{video.category} • {new Date(video.created_at).toLocaleDateString()}</div>
                        </div>
                        <button
                            onClick={toggleMyList}
                            style={{
                                background: inMyList ? '#FF6A00' : 'rgba(255,255,255,0.1)',
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
                            title={inMyList ? "Remove from My List" : "Add to My List"}
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