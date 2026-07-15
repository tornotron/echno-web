import { Payment, PayeeType } from '@/types/finance/payment';
import { Employee } from '@tornotron/echno-core/employee/types';
import { Labour } from '@tornotron/echno-core/labour/types';
import { Vendor } from '@tornotron/echno-core/vendor/types';
import type { SubContract } from '@/types/third-party/sub-contract';

export interface PayeeInfo {
  type: PayeeType;
  name: string;
  company?: string;
  details?: string;
}

export interface PayeeDatasets {
  vendors: Vendor[];
  employees: Employee[];
  subContracts: SubContract[];
  labour: Labour[];
}

/**
 * Derives payee information from a Payment object
 * Priority: labourId > subContractId > vendorId > employeeId > payeeType
 */
export function getPayeeInfo(
  payment: Payment,
  datasets: PayeeDatasets
): PayeeInfo {
  // Check labour
  if (payment.labourId) {
    const labour = datasets.labour.find((l) => l.id === payment.labourId);
    if (labour) {
      return {
        type: PayeeType.labour,
        name: labour.fullName ?? '',
        details: `${labour.specialization ?? ''} - ${labour.labourId ?? ''}`,
      };
    }
  }

  // Check sub-contractor
  if (payment.subContractId) {
    const contract = datasets.subContracts.find(
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
    const vendor = datasets.vendors.find((v) => v.id === payment.vendorId);
    if (vendor) {
      return {
        type: PayeeType.vendor,
        name: vendor.contactPerson || vendor.name,
        company: vendor.contactPerson ? vendor.name : undefined,
        details: vendor.address,
      };
    }
  }

  // Check employee
  if (payment.employeeId) {
    const employee = datasets.employees.find(
      (e) => e.id === payment.employeeId
    );
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
export function getPayeesByType(type: PayeeType, datasets: PayeeDatasets) {
  switch (type) {
    case PayeeType.employee: {
      return datasets.employees
        .filter((e): e is Employee & { id: number } => e.id != null)
        .map((e) => ({
          id: e.id,
          name: e.name,
          label: `${e.name} (${e.employeeId})`,
        }));
    }

    case PayeeType.vendor: {
      return datasets.vendors.map((v) => ({
        id: v.id,
        name: v.name,
        label: v.contactPerson ? `${v.name} - ${v.contactPerson}` : v.name,
      }));
    }

    case PayeeType.labour: {
      return datasets.labour.map((l) => ({
        id: l.id,
        name: l.fullName ?? '',
        label: `${l.fullName ?? ''} - ${l.specialization ?? ''}`,
      }));
    }

    case PayeeType.subContractor: {
      return datasets.subContracts.map((c) => ({
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
