import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    X,
    Home,
    Search,
    Video as VideoIcon,
    ShieldAlert,
    Crown,
    LogOut
} from 'lucide-react';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const menuItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Search', path: '/search' },
        ...(role === 'creator' || role === 'admin' ? [{ icon: VideoIcon, label: 'Studio', path: '/creator' }] : []),
        ...(role === 'admin' ? [{ icon: ShieldAlert, label: 'Admin', path: '/admin' }] : []),
        { icon: Crown, label: 'Premium', path: '/premium' }
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        window.location.reload();
    };

    return (
        <>
            {/* Hamburger Button (Fixed Top-Left) */}
            <button
                onClick={toggleSidebar}
                style={{
                    position: 'fixed',
                    top: 15,
                    left: 20,
                    zIndex: 2000,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Drawer Overly */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 1400,
                        backdropFilter: 'blur(3px)'
                    }}
                />
            )}

            {/* Slide-out Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '260px',
                    background: '#0B0F19', // Dark bg
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    zIndex: 1500,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '80px 20px 20px 20px',
                    boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
                }}
            >
                {/* Navigation Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: isActive(item.path)
                                    ? 'linear-gradient(to right, #581c87, #db2777)' // Purple Gradient
                                    : 'transparent',
                                color: isActive(item.path) ? 'white' : '#B0B8C1',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: isActive(item.path) ? 600 : 400,
                                transition: 'all 0.2s ease',
                                textAlign: 'left'
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* User Section / Logout */}
                {user && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                        <div style={{ padding: '0 10px 15px', fontSize: 13, color: '#666' }}>
                            Signed in as <br />
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{user.email?.split('@')[0]}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                width: '100%',
                                borderRadius: '12px',
                                background: 'rgba(255, 68, 68, 0.1)',
                                color: '#ff4444',
                                border: '1px solid rgba(255, 68, 68, 0.2)',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
