import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVideos, type Video } from './lib/api';

export default function SearchPage() {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const chipsRef = useRef<HTMLDivElement>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    // Auto focus input on load & fetch videos
    useEffect(() => {
        inputRef.current?.focus();
        fetchVideos().then(data => {
            setVideos(data);
            setLoading(false);
        });
    }, []);

    // Horizontal scroll handler
    const handleWheel = (e: React.WheelEvent) => {
        if (chipsRef.current) {
            chipsRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleClose = () => {
        navigate(-1); // Go back
    };

    const goToWatch = (id: string) => {
        navigate(`/watch/${id}`);
    };

    const categories = ['All', 'Action', 'African Movies', 'Comedy', 'Documentaries', 'Sci-Fi', 'Drama', 'Tech'];

    const filteredItems = videos.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory || (selectedCategory === 'African Movies' && item.category === 'African');
        // Simple mapping for demo categories if needed
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="search-body">
            {/* HEADER */}
            <header>
                <div className="logo">
                    <img src="/logo.png" alt="Evano Streams Logo" className="logo-icon" />
                    <span>EVANO STREAMS</span>
                </div>
                <button className="close-btn" onClick={handleClose}>
                    <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </header>

            {/* MAIN CONTENT */}
            <main className="search-main">
                {/* SEARCH BAR */}
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-input"
                            placeholder="Search movies, series, podcasts…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="search-action">→</span>
                    </div>
                </div>

                {/* CATEGORY CHIPS */}
                <div
                    className="chips-container"
                    ref={chipsRef}
                    onWheel={handleWheel}
                >
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* SECTION TITLE */}
                <h2 className="section-title">
                    {searchQuery ? `Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Popular searches' : `${selectedCategory} Movies`)}
                </h2>

                {/* SEARCH RESULTS */}
                <div className="results-list">
                    {loading ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Loading...</div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <div key={item.id} className="result-card" onClick={() => goToWatch(item.id)}>
                                <div className="result-thumbnail">
                                    <img src={item.thumbnail_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div className="result-content">
                                    <div className="result-header">
                                        <span className="result-title">{item.title}</span>
                                        <span className="result-duration">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="result-meta">
                                        <span className="result-studio">{item.category}</span>
                                        <span className="result-category">{item.views || 0} views</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                            No results found.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}