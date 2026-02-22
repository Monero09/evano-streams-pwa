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
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: colors[type],
            color: 'white',
            padding: '16px 24px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 10000,
            minWidth: 300,
            animation: 'slideIn 0.3s ease'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15 }}>
                <span style={{ fontSize: 15 }}>{message}</span>
                <button onClick={onClose} style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1
                }}>×</button>
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
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
