/**
 * services/invitation-service.ts
 *
 * Typed client for invitation-related backend endpoints.
 *
 * This module wraps lower-level `api` calls and converts raw JSON into
 * strongly-typed domain objects (`Invitation`) via safe parsing helpers.
 * It centralizes parsing error handling (converted into `ApiError`) and
 * provides a small, intention-revealing surface used by hooks and UI
 * actions.
 *
 * Methods are documented for callers and follow enterprise standards for
 * explicit input/output typings and error semantics.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { Invitation, parseInvitation } from '@/types/invitation/invitation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse invitation data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseInvitation(data: ApiResponse): Invitation {
  try {
    return parseInvitation(data);
  } catch (error) {
    logger.error('Failed to parse invitation data:', error);
    throw new ApiError(
      'Failed to process invitation data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse invitation array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseInvitations(data: ApiResponse[]): Invitation[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseInvitation(item));
  } catch (error) {
    logger.error('Failed to parse invitations data:', error);
    throw new ApiError(
      'Failed to process invitations data. Please try again.',
      422
    );
  }
}

/**
 * Request payload for generating an invite code
 */
export interface GenerateInviteCodeRequest {
  designation: string;
  department: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;
  phone?: string;
  joiningDate?: Date;
  salary?: number;
  reportingManager?: string;
  shiftTiming?: string;
  status?: string;
  validityDays?: number;
  maxUses?: number;
}

/**
 * Request payload for validating an invite code
 */
export interface ValidateInviteCodeRequest {
  inviteCode: string;
}

/**
 * Response from validating an invite code
 */
export interface ValidateInviteCodeResponse {
  valid: boolean;
  invitation?: Invitation;
  message?: string;
}

/**
 * invitationService
 *
 * Thin wrapper around the backend invitation REST endpoints. Provides
 * typed, parse-safe convenience methods for managing organization invitations.
 *
 * Implementation notes:
 * - This module expects the backend to return JSON payloads compatible
 *   with `parseInvitation` and `invitationToJson` helpers.
 * - Network errors and non-2xx responses are propagated from the API
 *   client and should be handled by callers (e.g. via React Query
 *   mutation error handlers).
 * - Parsing errors are wrapped in ApiError for consistent error handling.
 */
export const invitationService = {
  /**
   * Generate a new invite code for an organization.
   *
   * @param {number} organizationId - Organization ID (passed in URL).
   * @param {GenerateInviteCodeRequest} request - Invitation details (without organizationId and organizationName).
   * @returns {Promise<Invitation>} The generated invitation with code.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async generateCode(
    organizationId: number,
    request: GenerateInviteCodeRequest
  ): Promise<Invitation> {
    // Build payload with only defined values
    const payload: Record<string, unknown> = {
      designation: request.designation,
      department: request.department,
      status: request.status || 'active', // Default to 'active' if not provided
    };

    // Add optional fields only if they have values
    if (request.employeeId) payload.employeeId = request.employeeId;
    if (request.employeeName) payload.employeeName = request.employeeName;
    if (request.email) payload.email = request.email;
    if (request.phone) payload.phone = request.phone;
    if (request.joiningDate)
      payload.joiningDate = request.joiningDate.toISOString();
    if (request.salary !== undefined) payload.salary = request.salary;
    if (request.reportingManager)
      payload.reportingManager = request.reportingManager;
    if (request.shiftTiming) payload.shiftTiming = request.shiftTiming;
    if (request.validityDays !== undefined)
      payload.validityDays = request.validityDays;
    if (request.maxUses !== undefined) payload.maxUses = request.maxUses;

    const data = await api.post<ApiResponse>(
      `/invitation/web/generateCode/organizationId/${organizationId}`,
      payload
    );
    return safeParseInvitation(data);
  },

  /**
   * Validate an invite code.
   *
   * @param {number} userId - User ID to validate the code for.
   * @param {string} inviteCode - The invite code to validate.
   * @returns {Promise<ValidateInviteCodeResponse>} Validation result with invitation details if valid.
   * @throws {ApiError} on network or server errors
   */
  async validateCode(
    userId: number,
    inviteCode: string
  ): Promise<ValidateInviteCodeResponse> {
    const payload: ValidateInviteCodeRequest = { inviteCode };

    try {
      const data = await api.post<ApiResponse>(
        `/invitation/web/validate/userId/${userId}`,
        payload
      );

      return {
        valid: data.valid ?? false,
        invitation: data.invitation
          ? safeParseInvitation(data.invitation)
          : undefined,
        message: data.message,
      };
    } catch (error) {
      // If the error is a 404 or validation error, return invalid
      if (
        error instanceof ApiError &&
        (error.isNotFound || error.status === 400)
      ) {
        return {
          valid: false,
          message: error.message || 'Invalid or expired invite code',
        };
      }
      throw error;
    }
  },

  /**
   * Get all invitations for an organization.
   *
   * @param {number} organizationId - Organization ID.
   * @returns {Promise<Invitation[]>} List of invitations for the organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getByOrganization(organizationId: number): Promise<Invitation[]> {
    const data = await api.get<ApiResponse[]>(
      `/invitation/web/organizationId/${organizationId}`
    );
    return safeParseInvitations(data);
  },
};
