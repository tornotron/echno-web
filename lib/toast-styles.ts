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

// Custom toast wrapper functions
export const toast = {
  success: (message: string, options?: { description?: string }) => {
    return sonnerToast.success(message, {
      ...options,
      style: toastStyles.success,
    })
  },
  error: (message: string, options?: { description?: string }) => {
    return sonnerToast.error(message, {
      ...options,
      style: toastStyles.error,
    })
  },
  warning: (message: string, options?: { description?: string }) => {
    return sonnerToast.warning(message, {
      ...options,
      style: toastStyles.warning,
    })
  },
  info: (message: string, options?: { description?: string }) => {
    return sonnerToast.info(message, {
      ...options,
      style: toastStyles.info,
    })
  },
}

