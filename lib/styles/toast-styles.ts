import { toast as sonnerToast } from 'sonner'

const toastStyles = {
  success: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#ffffff',
    border: '1px solid #16a34a',
  },
  error: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    border: '1px solid #dc2626',
  },
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    border: '1px solid #d97706',
  },
  info: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: '1px solid #2563eb',
  },
} as const

/**
 * Options forwarded to sonner.
 *
 * `id` and `duration` exist for toasts the app has to manage rather than fire
 * and forget: an idle warning has to stay up until it is acted on, and has to
 * be dismissable the moment the user proves they are still there.
 */
export interface ToastOptions {
  description?: string
  action?: { label: string; onClick: () => void }
  duration?: number
  id?: string | number
}

// Custom toast wrapper functions
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      style: toastStyles.success,
    })
  },
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      ...options,
      style: toastStyles.error,
    })
  },
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      ...options,
      style: toastStyles.warning,
    })
  },
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      style: toastStyles.info,
    })
  },
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
