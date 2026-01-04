import { Payment, PayeeType } from '@/types/finance/payment';
import {
  mockVendors,
  mockEmployees,
  mockSubContracts,
  mockLabour,
} from '@/components/shared/mock-data';

export interface PayeeInfo {
  type: PayeeType;
  name: string;
  company?: string;
  details?: string;
}

/**
 * Derives payee information from a Payment object
 * Priority: labourId > subContractId > vendorId > employeeId > payeeType
 */
export function getPayeeInfo(payment: Payment): PayeeInfo {
  // Check labour
  if (payment.labourId) {
    const labour = mockLabour.find((l) => l.id === payment.labourId);
    if (labour) {
      return {
        type: PayeeType.labour,
        name: labour.name,
        details: `${labour.trade} - ${labour.labourId}`,
      };
    }
  }

  // Check sub-contractor
  if (payment.subContractId) {
    const contract = mockSubContracts.find(
      (c) => c.id === payment.subContractId
    );
    if (contract) {
      return {
        type: PayeeType.subContractor,
        name: contract.contractorName,
        company: contract.contractorCompany,
        details: contract.contractId,
      };
    }
  }

  // Check vendor
  if (payment.vendorId) {
    const vendor = mockVendors.find((v) => v.id === payment.vendorId);
    if (vendor) {
      return {
        type: PayeeType.vendor,
        name: vendor.contactPerson,
        company: vendor.companyName,
        details: vendor.vendorId,
      };
    }
  }

  // Check employee
  if (payment.employeeId) {
    const employee = mockEmployees.find((e) => e.id === payment.employeeId);
    if (employee) {
      return {
        type: PayeeType.employee,
        name: employee.name,
        details: employee.employeeId,
      };
    }
  }

  // Check manual payee type
  if (payment.payeeType && payment.payeeName) {
    return {
      type: payment.payeeType,
      name: payment.payeeName,
      details: payment.payeeDetails,
    };
  }

  // Default fallback
  return {
    type: PayeeType.other,
    name: 'Unknown Payee',
  };
}

/**
 * Formats payee name for display (includes company if available)
 */
export function formatPayeeName(payeeInfo: PayeeInfo): string {
  if (payeeInfo.company) {
    return `${payeeInfo.name} (${payeeInfo.company})`;
  }
  return payeeInfo.name;
}

/**
 * Flexible amount search - searching "8500" matches 8500, 18500, 85000, etc.
 */
export function matchesAmountSearch(
  amount: number,
  searchQuery: string
): boolean {
  const amountStr = amount.toString();
  const searchStr = searchQuery.trim();

  // Remove commas and decimal points from search
  const cleanSearch = searchStr.replaceAll(/[,\.]/g, '');

  return amountStr.includes(cleanSearch);
}

/**
 * Gets all payees of a specific type
 */
export function getPayeesByType(type: PayeeType) {
  switch (type) {
    case PayeeType.employee: {
      return mockEmployees.map((e) => ({
        id: e.id!,
        name: e.name,
        label: `${e.name} (${e.employeeId})`,
      }));
    }

    case PayeeType.vendor: {
      return mockVendors.map((v) => ({
        id: v.id,
        name: v.companyName,
        label: `${v.companyName} - ${v.contactPerson}`,
      }));
    }

    case PayeeType.labour: {
      return mockLabour.map((l) => ({
        id: l.id,
        name: l.name,
        label: `${l.name} - ${l.trade}`,
      }));
    }

    case PayeeType.subContractor: {
      return mockSubContracts.map((c) => ({
        id: c.id,
        name: c.contractorName,
        label: `${c.contractorName} (${c.contractorCompany})`,
      }));
    }

    default: {
      return [];
    }
  }
}
