/**
 * The outside service AI reading sends tender text to. The backend's
 * disclosure sentence says that text is sent and that the service states it
 * does not keep or train on it; it does not name the service, so the screen
 * names it here, from the endpoint the backend is configured with
 * (`inference.do-ai.run`, DigitalOcean's hosted models).
 */
export const AI_SERVICE = {
  name: 'DigitalOcean hosted AI models (Gradient inference)',
  privacyUrl:
    'https://docs.digitalocean.com/products/inference/details/data-privacy/',
} as const;
