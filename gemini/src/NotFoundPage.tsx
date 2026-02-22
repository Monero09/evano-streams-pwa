import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '72px', color: '#D60074', margin: '0 0 20px 0' }}>404</h1>
            <h2 style={{ marginBottom: '20px' }}>Page Not Found</h2>
            <p style={{ color: '#B0B8C1', marginBottom: '30px' }}>The page you are looking for doesn't exist or has been moved.</p>
            <button
                onClick={() => navigate('/')}
                style={{
                    background: 'linear-gradient(to right, #581c87, #db2777)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Go Home
            </button>
        </div>
    );
}
