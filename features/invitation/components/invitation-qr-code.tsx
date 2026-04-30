'use client';

import QRCodeSVG from 'react-qr-code';
import { Button } from '@/components/shadcn/button';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';

interface InvitationQRCodeProps {
  inviteCode: string;
  organizationName?: string;
  size?: number;
  showDownload?: boolean;
}

/**
 * QR Code component for invitations
 * Encodes the invite code in a scannable QR format
 */
export function InvitationQRCode({
  inviteCode,
  organizationName,
  size = 256,
  showDownload = true,
}: InvitationQRCodeProps) {
  // Generate the QR code value
  // This could be a deep link to your mobile app or a web URL
  const qrValue = JSON.stringify({
    type: 'INVITATION',
    code: inviteCode,
    organization: organizationName,
    timestamp: new Date().toISOString(),
  });

  // Alternative: Use a simple URL format
  // const qrValue = `https://yourapp.com/join?code=${inviteCode}`;

  const downloadQRCode = () => {
    const svg = document.querySelector(`#qr-code-${inviteCode}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.addEventListener('load', () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invitation-${inviteCode}.png`;
          document.body.append(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        }
      });
    });

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg border-4 border-white bg-white p-4 shadow-lg">
        <QRCodeSVG
          id={`qr-code-${inviteCode}`}
          value={qrValue}
          size={size}
          level="H" // High error correction
        />
      </div>

      {showDownload && (
        <Button onClick={downloadQRCode} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      )}

      <div className="text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Scan to join {organizationName || 'the organization'}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          Code: {inviteCode}
        </p>
      </div>
    </div>
  );
}

/**
 * QR Code Modal Dialog
 * Shows the QR code in a modal with download option
 */
export function InvitationQRCodeDialog({
  inviteCode,
  organizationName,
  trigger,
}: InvitationQRCodeProps & { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QRCodeSVG value={inviteCode} size={16} className="mr-2" />
            Show QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitation QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code with the mobile app to join the organization
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <InvitationQRCode
            inviteCode={inviteCode}
            organizationName={organizationName}
            size={300}
            showDownload={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
