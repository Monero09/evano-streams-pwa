import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import SearchPage from './SearchPage';
import WatchPage from './WatchPage';
import NotFoundPage from './NotFoundPage';
import LoginPage from './LoginPage';
import PremiumPage from './PremiumPage';
import CreatorDashboard from './CreatorDashboard';
import AdminDashboard from './AdminDashboard';
import AdminAdsPage from './AdminAdsPage';
import AuthGuard from './components/AuthGuard';

// Simple transition wrapper (optional)
const PageTransition = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    // PWA Install Prompt Logic
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [showInstall, setShowInstall] = React.useState(false);

    React.useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt after 60s or on second visit (simplified to timer for V1)
            setTimeout(() => {
                setShowInstall(true);
            }, 60000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstall(false);
        }
        setDeferredPrompt(null);
    };

    return (
        <div key={location.pathname} style={{ animation: 'fadeIn 0.3s ease' }}>
            {children}
            {showInstall && (
                <div style={{
                    position: 'fixed', bottom: 20, left: 20, right: 20,
                    background: '#FF6A00', color: 'white', padding: 15,
                    borderRadius: 12, zIndex: 9999, display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <span>Install Evano Streams for better experience!</span>
                    <button onClick={handleInstall} style={{
                        background: 'white', color: '#FF6A00', border: 'none',
                        padding: '8px 16px', borderRadius: 20, fontWeight: 'bold'
                    }}>Install</button>
                    <button onClick={() => setShowInstall(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, marginLeft: 10 }}>×</button>
                </div>
            )}
            <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
        </div>
    );
};

export default function App() {
    return (
        <Router>
            <PageTransition>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/watch/:id" element={<WatchPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route
                        path="/creator"
                        element={
                            <AuthGuard allowedRoles={['creator', 'admin']}>
                                <CreatorDashboard />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AuthGuard allowedRoles={['admin']}>
                                <AdminDashboard />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/admin/ads"
                        element={
                            <AuthGuard allowedRoles={['admin']}>
                                <AdminAdsPage />
                            </AuthGuard>
                        }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </PageTransition>
        </Router>
    );
}