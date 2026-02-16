import { useEffect, useState } from 'react';

// Types
export interface User {
    id: string;
    username: string;
    role: 'user' | 'creator' | 'admin';
}

export interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    src: string;
    category: string;
    views: number;
    adsEnabled: boolean;
    isHero?: boolean;
}

// Initial Data
const INITIAL_USERS: User[] = [
    { id: '1', username: 'viewer', role: 'user' },
    { id: '2', username: 'creator', role: 'creator' },
    { id: '3', username: 'admin', role: 'admin' },
];

const INITIAL_VIDEOS: Video[] = [
    {
        id: 'hero-movie',
        title: 'NEW ACTION MOVIE',
        description: 'Now Streaming. Watch Now!',
        thumbnail: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
        src: '/media/main-demo.mp4', // Placeholder
        category: 'Action',
        views: 120500,
        adsEnabled: true,
        isHero: true,
    },
    {
        id: '1',
        title: 'Cosmic Legends',
        description: 'A journey through the stars.',
        thumbnail: 'https://images.unsplash.com/photo-1571847140471-1b11a07d8d53?w=400&q=80',
        src: '',
        category: 'Action',
        views: 4500,
        adsEnabled: false,
    },
    {
        id: '2',
        title: 'Night Riders',
        description: 'The streets never sleep.',
        thumbnail: 'https://images.unsplash.com/photo-1489599849228-bed2db80bd74?w=400&q=80',
        src: '',
        category: 'Thriller',
        views: 3200,
        adsEnabled: true,
    },
    {
        id: '3',
        title: 'Digital Dreams',
        description: 'Where reality meets code.',
        thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80',
        src: '',
        category: 'Sci-Fi',
        views: 8900,
        adsEnabled: true,
    },
    {
        id: '4',
        title: 'Urban Echoes',
        description: 'The sound of the city.',
        thumbnail: 'https://images.unsplash.com/photo-1477900461519-41d3d1ae3d1d?w=400&q=80',
        src: '',
        category: 'Drama',
        views: 1200,
        adsEnabled: false,
    },
];

// Store Logic
const DB_KEYS = {
    USERS: 'evano_users',
    VIDEOS: 'evano_videos',
    CURRENT_USER: 'evano_current_user',
};

class Store {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        }
        if (!localStorage.getItem(DB_KEYS.VIDEOS)) {
            localStorage.setItem(DB_KEYS.VIDEOS, JSON.stringify(INITIAL_VIDEOS));
        }
    }

    getUsers(): User[] {
        return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
    }

    getVideos(): Video[] {
        return JSON.parse(localStorage.getItem(DB_KEYS.VIDEOS) || '[]');
    }

    getCurrentUser(): User | null {
        const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    }

    login(username: string): User | null {
        const users = this.getUsers();
        const user = users.find((u) => u.username === username);
        if (user) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            return user;
        }
        return null; // Return null if user not found, don't auto-create
    }

    register(username: string, role: 'user' | 'creator'): User | null {
        const users = this.getUsers();
        if (users.find(u => u.username === username)) {
            return null; // Username exists
        }

        const user: User = {
            id: Date.now().toString(),
            username,
            role // Explicit role, no admin option here
        };
        users.push(user);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
    }

    logout() {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }

    addVideo(video: Omit<Video, 'id' | 'views' | 'adsEnabled'>) {
        const videos = this.getVideos();
        const newVideo: Video = {
            ...video,
            id: Date.now().toString(),
            views: 0,
            adsEnabled: true,
        };
        videos.unshift(newVideo);
        localStorage.setItem(DB_KEYS.VIDEOS, JSON.stringify(videos));
        return newVideo;
    }

    deleteVideo(id: string) {
        const videos = this.getVideos().filter((v) => v.id !== id);
        localStorage.setItem(DB_KEYS.VIDEOS, JSON.stringify(videos));
    }

    toggleAds(id: string) {
        const videos = this.getVideos().map((v) =>
            v.id === id ? { ...v, adsEnabled: !v.adsEnabled } : v
        );
        localStorage.setItem(DB_KEYS.VIDEOS, JSON.stringify(videos));
    }

    setHeroVideo(id: string) {
        const videos = this.getVideos().map(v => ({
            ...v,
            isHero: v.id === id
        }));
        localStorage.setItem(DB_KEYS.VIDEOS, JSON.stringify(videos));
    }
}

export const store = new Store();

// React Hook for Videos
export function useVideos() {
    const [videos, setVideos] = useState<Video[]>(store.getVideos());

    const refresh = () => {
        setVideos(store.getVideos());
    };

    useEffect(() => {
        // Listen for storage changes in other tabs
        const handler = () => refresh();
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return {
        videos,
        refresh,
        deleteVideo: (id: string) => { store.deleteVideo(id); refresh(); },
        toggleAds: (id: string) => { store.toggleAds(id); refresh(); },
        addVideo: (v: any) => { store.addVideo(v); refresh(); },
        setHeroVideo: (id: string) => { store.setHeroVideo(id); refresh(); }
    };
}

// React Hook for User
export function useUser() {
    const [user, setUser] = useState<User | null>(store.getCurrentUser());

    const login = (username: string) => {
        const u = store.login(username);
        if (u) setUser(u);
        return u;
    };

    const register = (username: string, role: 'user' | 'creator') => {
        const u = store.register(username, role);
        if (u) setUser(u);
        return u;
    };

    const logout = () => {
        store.logout();
        setUser(null);
    };

    return { user, login, register, logout };
}
