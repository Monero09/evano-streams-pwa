import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Toast notification component (internal to app)
export const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: '#52c41a',
        error: '#ff4d4f',
        info: '#FF6A00'
    };

    return (
        <div className="toast" style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: colors[type],
            color: 'white',
            padding: '16px 24px',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 10000,
            minWidth: 300,
            fontWeight: 500,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
                <button onClick={onClose} style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>×</button>
            </div>
        </div>
    );
};

// Toast Context
interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
