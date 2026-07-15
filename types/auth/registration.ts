import { UserRole } from '@tornotron/echno-core/user/types';

/**
 * Registration request payload sent to the backend.
 */
export interface RegistrationRequest {
  userName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // ISO date string
  role: UserRole | string;
  acceptTerms: boolean;
}

/**
 * Registration response from the backend.
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  userId?: number;
}

/**
 * Registration form data used in the UI.
 * Includes confirmPassword for client-side validation.
 */
export interface RegistrationFormData extends Omit<
  RegistrationRequest,
  'dateOfBirth'
> {
  confirmPassword: string;
  dateOfBirth: Date | null;
}

/**
 * Initial empty form state.
 */
export const initialRegistrationFormData: RegistrationFormData = {
  userName: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: 'Male',
  dateOfBirth: null,
  role: '',
  acceptTerms: false,
};

/**
 * Convert form data to API request payload.
 */
export function toRegistrationRequest(
  formData: RegistrationFormData
): RegistrationRequest {
  return {
    userName: formData.userName,
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    gender: formData.gender,
    dateOfBirth: formData.dateOfBirth?.toISOString() ?? '',
    role: formData.role,
    acceptTerms: formData.acceptTerms,
  };
}
