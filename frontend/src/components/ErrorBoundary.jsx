import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0e17 0%, #1a1a2e 100%)',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.5rem',
            padding: '3rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}>
              ⚠️
            </div>

            <h1 style={{
              color: '#f8f8f2',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
            }}>
              Oops! Terjadi Kesalahan
            </h1>

            <p style={{
              color: 'rgba(248,248,242,0.6)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '0.5rem',
            }}>
              Aplikasi mengalami error yang tidak terduga. Ini bisa terjadi karena
              koneksi ke server terputus atau ada masalah sementara.
            </p>

            {/* Error detail (hanya dev mode) */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '1rem',
                marginBottom: '1rem',
                textAlign: 'left',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
              }}>
                <summary style={{ color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Detail Error (Dev Mode)
                </summary>
                <pre style={{
                  color: '#fca5a5',
                  fontSize: '0.75rem',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReload}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              🔄 Muat Ulang Halaman
            </button>

            <p style={{
              color: 'rgba(248,248,242,0.35)',
              fontSize: '0.8rem',
              marginTop: '1.25rem',
            }}>
              Jika masalah terus berlanjut, hubungi tim pengembang.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
