import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { useToast } from './components/Toast';
import { updateUserTier } from './lib/api';

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function PremiumPage() {
    const { user, tier } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Debug: Log current tier
    console.log('PremiumPage - Current tier:', tier, 'User:', user?.email);

    const handlePayment = () => {
        if (!user) {
            showToast('Please login first', 'error');
            navigate('/login');
            return;
        }

        setLoading(true);

        const handler = window.PaystackPop.setup({
            key: 'pk_test_e625a8d01c7ad96a54e08dec9c876e4b73443e29',
            email: user.email!,
            amount: 1500, // GHS 15.00 in pesewas
            currency: 'GHS',
            ref: `${Date.now()}_${user.id}`,
            callback: (response: any) => {
                // Payment successful
                console.log('Payment successful:', response);
                updateUserTier(user.id, 'premium')
                    .then(() => {
                        showToast('Welcome to Premium! Redirecting...', 'success');
                        setTimeout(() => {
                            // Force full page reload to refresh user profile
                            window.location.href = '/';
                        }, 1500);
                    })
                    .catch((e) => {
                        showToast('Payment received but failed to update account. Contact support.', 'error');
                        console.error(e);
                        setLoading(false);
                    });
            },
            onClose: () => {
                setLoading(false);
                showToast('Payment cancelled', 'info');
            }
        });

        handler.openIframe();
    };

    if (tier === 'premium') {
        return (
            <div className="auth-container">
                <div className="auth-box" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
                    <h1 className="auth-title">You're Premium!</h1>
                    <p style={{ color: '#aaa', marginBottom: 10, fontSize: 16 }}>
                        You have an active premium subscription
                    </p>
                    <p style={{ color: '#52c41a', marginBottom: 30, fontSize: 14 }}>
                        Enjoying ad-free streaming ✨
                    </p>

                    <div style={{
                        background: 'rgba(82, 196, 26, 0.1)',
                        border: '1px solid rgba(82, 196, 26, 0.3)',
                        borderRadius: 12,
                        padding: 20,
                        marginBottom: 20
                    }}>
                        <h3 style={{ fontSize: 16, marginBottom: 10, color: '#52c41a' }}>Active Benefits:</h3>
                        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
                            {['No Ads', 'Premium Support', 'Early Features'].map(benefit => (
                                <li key={benefit} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ color: '#52c41a' }}>✓</span>
                                    <span style={{ color: '#aaa' }}>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={() => navigate('/')} className="auth-btn">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        background: 'none',
                        border: 'none',
                        color: '#D60074',
                        fontSize: 24,
                        cursor: 'pointer',
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                    }}
                >
                    ← Back
                </button>

                <div className="auth-header">
                    <h1 className="auth-title">Go Premium</h1>
                    <p className="auth-subtitle">Unlock the ultimate streaming experience</p>
                </div>

                <div style={{ margin: '30px 0' }}>
                    <div style={{
                        background: 'rgba(214, 0, 116, 0.1)',
                        border: '1px solid rgba(214, 0, 116, 0.3)',
                        borderRadius: 12,
                        padding: 20
                    }}>
                        <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 10 }}>
                            GH₵15<span style={{ fontSize: 16, color: '#aaa' }}>/month</span>
                        </h2>
                    </div>

                    <div style={{ marginTop: 30 }}>
                        <h3 style={{ fontSize: 18, marginBottom: 15, color: '#D60074' }}>
                            ✨ Premium Benefits:
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {[
                                'No Pre-Roll Ads',
                                'No Mid-Roll Interruptions',
                                'No Banner Ads',
                                'Priority Support',
                                'Early Access to New Features'
                            ].map(benefit => (
                                <li key={benefit} style={{
                                    padding: '10px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10
                                }}>
                                    <span style={{ color: '#52c41a', fontSize: 20 }}>✓</span>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    className="auth-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Processing...' : 'Subscribe Now - GH₵15/month'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 15 }}>
                    Secure payment powered by Paystack
                </p>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#D60074',
                        marginTop: 20,
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Maybe Later
                </button>
            </div>

            {/* Load Paystack Script */}
            <script src="https://js.paystack.co/v1/inline.js"></script>
        </div>
    );
}
