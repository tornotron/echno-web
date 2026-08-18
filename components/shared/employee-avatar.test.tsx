import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { EmployeeAvatar, employeeInitials } from './employee-avatar';

afterEach(cleanup);

describe('employeeInitials', () => {
  test('takes the first letter of the first two words, uppercased', () => {
    expect(employeeInitials('Anjali Nair')).toBe('AN');
  });

  test('handles a single name', () => {
    expect(employeeInitials('cher')).toBe('C');
  });

  test('collapses extra whitespace and caps at two letters', () => {
    expect(employeeInitials('  ravi   kumar  singh ')).toBe('RK');
  });
});

describe('EmployeeAvatar', () => {
  test('renders the initials in the fallback', async () => {
    const { findByText } = render(
      <EmployeeAvatar employee={{ name: 'Anjali Nair', profilePicture: undefined }} />,
    );
    expect(await findByText('AN')).toBeInTheDocument();
  });
});
