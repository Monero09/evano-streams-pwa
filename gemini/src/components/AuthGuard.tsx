import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface AuthGuardProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return <div style={{ color: 'white', padding: 20 }}>Unauthorized: You do not have permission to view this page.</div>;
    }

    return <>{children}</>;
}
