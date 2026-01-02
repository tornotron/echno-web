'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

/**
 * Global Error Page
 *
 * Catches errors in the root layout (layout.tsx)
 * This is a last-resort error boundary
 * Note: Must re-render the entire HTML document
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (logger might not be available)
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '4rem',
                  height: '4rem',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fef2f2',
                  borderRadius: '50%',
                }}
              >
                <AlertTriangle
                  style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                />
              </div>
              <h1
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#111827',
                }}
              >
                Critical Error
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                A critical error occurred. The application needs to reload.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#dc2626',
                    marginBottom: '0.5rem',
                  }}
                >
                  Error Details (Development Only):
                </p>
                <pre
                  style={{
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '8rem',
                    color: '#6b7280',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                </pre>
                {error.digest && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.5rem',
                    }}
                  >
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <Button
                onClick={reset}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw style={{ width: '1rem', height: '1rem' }} />
                Reload Application
              </Button>

              <button
                onClick={() => {
                  globalThis.location.href = '/users/dashboard';
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
                Go to Dashboard
              </button>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#6b7280',
              }}
            >
              <p>
                If this problem persists, contact{' '}
                <a
                  href="mailto:support@echno.com"
                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                >
                  support@echno.com
                </a>
              </p>
              {error.digest && (
                <p style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  Reference: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
