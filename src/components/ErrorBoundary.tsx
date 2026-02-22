import React from 'react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error);
        console.error('Error info:', errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
        // Optionally reload the page
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0B0F19 0%, #1A1F2E 100%)',
                    padding: 20
                }}>
                    <div style={{
                        background: '#1A1F2E',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        borderRadius: 12,
                        padding: 40,
                        maxWidth: 500,
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <div style={{
                            fontSize: 60,
                            marginBottom: 20
                        }}>
                            ⚠️
                        </div>

                        <h1 style={{
                            fontSize: 28,
                            fontWeight: 800,
                            marginBottom: 10,
                            color: '#fff'
                        }}>
                            Oops! Something went wrong
                        </h1>

                        <p style={{
                            color: '#B0B8C1',
                            fontSize: 14,
                            marginBottom: 20,
                            lineHeight: 1.6
                        }}>
                            We're sorry, but something unexpected happened.
                            The error has been logged and our team will look into it.
                        </p>

                        {this.state.error && (
                            <div style={{
                                background: 'rgba(255, 68, 68, 0.1)',
                                border: '1px solid rgba(255, 68, 68, 0.2)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 20,
                                textAlign: 'left',
                                fontSize: 12,
                                color: '#ff9999',
                                fontFamily: 'monospace',
                                maxHeight: 150,
                                overflowY: 'auto'
                            }}>
                                {this.state.error.message}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: 12,
                            flexDirection: 'column'
                        }}>
                            <button
                                onClick={this.resetError}
                                style={{
                                    background: 'linear-gradient(to right, #581c87, #db2777)',
                                    color: 'white',
                                    border: 'none',
                                    padding: 12,
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(214, 0, 116, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                Go Home
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#B0B8C1',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: 12,
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
