import { KeycloakResourcePermission } from './keycloak-resource-permission';

/**
 * Decoded Keycloak Token Interface
 *
 * Represents the decoded structure of a Keycloak JWT token,
 * including standard claims and Keycloak-specific claims.
 *
 * @example
 * {
 *   "sub": "12345678-1234-1234-1234-123456789012",
 *   "exp": 1625247600,
 *   "iat": 1625244000,
 *   "jti": "unique-token-id",
 *   "aud": "echno-backend-client",
 *   "groups": ["/management", "/engineering"],
 *   "realm_access": {
 *     "roles": ["user", "admin"]
 *   },
 *   "resource_access": {
 *     "my-client": {
 *       "roles": ["client-role1", "client-role2"]
 *     }
 *   },
 *   "authorization": {
 *     "permissions": [
 *       {
 *         "rsname": "organization",
 *         "rsid": "org-123",
 *         "scopes": ["create", "read", "update", "delete"]
 *       }
 *     ]
 *   }
 * }
 */
export interface DecodedKeycloakToken {
  // Standard JWT claims
  jti?: string; // JWT ID
  sub?: string; // Subject (user ID)
  exp?: number; // Expiration time
  iat?: number; // Issued at
  aud?: string | string[]; // Audience
  typ?: string; // Token type (e.g., "Bearer")
  azp?: string; // Authorized party (client ID)
  acr?: string; // Authentication context class reference

  // Session claims
  sid?: string; // Session ID (for frontchannel logout)
  session_state?: string; // Legacy session state

  // User identity claims
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  scope?: string;

  // Keycloak Groups claim
  // Groups are hierarchical paths like "/management", "/engineering/frontend"
  groups?: string[];

  // Keycloak realm-level roles
  realm_access?: {
    roles?: string[];
  };

  // Keycloak client-specific roles
  resource_access?: Record<string, { roles?: string[] }>;

  // Keycloak Authorization Services claim
  // Contains fine-grained resource permissions with scopes
  authorization?: {
    permissions?: KeycloakResourcePermission[];
  };

  // Allowed origins for CORS
  'allowed-origins'?: string[];

  // Allow additional custom claims
  [key: string]: unknown;
}
