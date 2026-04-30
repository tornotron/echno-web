'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

// Re-export primitives unchanged from shadcn base
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/shadcn/dialog';

// Extended overlay — add blur variants here, never edit components/shadcn/dialog.tsx
const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
  {
    variants: {
      blur: {
        none: '',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        xl: 'backdrop-blur-xl',
      },
    },
    defaultVariants: {
      blur: 'none',
    },
  }
);

export interface DialogOverlayProps
  extends React.ComponentProps<typeof DialogPrimitive.Overlay>,
    VariantProps<typeof dialogOverlayVariants> {}

function DialogOverlay({ className, blur, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(dialogOverlayVariants({ blur }), className)}
      {...props}
    />
  );
}

// Extended content — add size/animation variants here, never edit components/shadcn/dialog.tsx
const dialogContentVariants = cva(
  'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none',
  {
    variants: {
      size: {
        default: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'max-w-4xl sm:max-w-4xl',
        full: 'max-w-[95vw] sm:max-w-[95vw]',
      },
      animation: {
        default:
          'duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'slide-up': 'dialog-slide-up',
      },
    },
    defaultVariants: {
      size: 'default',
      animation: 'default',
    },
  }
);

export interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  showCloseButton?: boolean;
  overlayBlur?: VariantProps<typeof dialogOverlayVariants>['blur'];
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size,
  animation,
  overlayBlur,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DialogOverlay blur={overlayBlur} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ size, animation }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  DialogOverlay,
  dialogOverlayVariants,
  DialogContent,
  dialogContentVariants,
};
