'use client';

import { ErrorLayout } from '@/components/errors/error-layout';
import { AlertCircle } from 'lucide-react';

/**
 * 400 Bad Request Error Page
 *
 * Displayed when the server cannot process the request due to client error
 */
export default function BadRequestPage() {
  return (
    <ErrorLayout
      statusCode={400}
      title="Bad Request"
      description="The request could not be understood or was missing required parameters."
      icon={AlertCircle}
      iconColor="text-orange-500"
      reasons={[
        'Invalid or malformed request data',
        'Missing required parameters',
        'Request format is not supported',
        'Invalid query parameters or filters',
      ]}
    />
  );
}
