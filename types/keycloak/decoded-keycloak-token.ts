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
  sid?: string;
  session_state?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  azp?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  // Keycloak Authorization Services claim
  authorization?: {
    permissions?: KeycloakResourcePermission[];
  };
  [key: string]: unknown;
}
