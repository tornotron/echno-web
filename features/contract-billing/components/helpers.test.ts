import { describe, expect, test } from 'bun:test';
import {
  AttachmentType,
  type Attachment,
} from '@tornotron/echno-core/attachment/types';
import {
  BillLineStatus,
  BillingModel,
  type BillLine,
} from '@tornotron/echno-core/contract-billing/types';
import { billTitle } from '../lib/labels';
import { groupDocuments } from './BillDocuments';
import { lineCounts } from './BillQuantities';

function doc(id: number, documentType?: string): Attachment {
  return {
    id,
    fileName: `f${id}`,
    file: '',
    fileSize: 1,
    fileType: AttachmentType.other,
    contentType: 'application/pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
    documentType,
  };
}

describe('bill page helpers', () => {
  test('documents group by type and an unknown type files under others', () => {
    const groups = groupDocuments([
      doc(1, 'photo'),
      doc(2, 'test-report'),
      doc(3),
      doc(4, 'invoice'),
    ]);
    expect(groups.photo.map((d) => d.id)).toEqual([1]);
    expect(groups['test-report'].map((d) => d.id)).toEqual([2]);
    expect(groups.other.map((d) => d.id)).toEqual([3, 4]);
  });

  test('line counts consider only claimed items', () => {
    const l = (status: BillLineStatus, claimed: number) =>
      ({ status, claimedQuantity: claimed }) as BillLine;
    expect(
      lineCounts([
        l(BillLineStatus.NOT_CLAIMED, 0),
        l(BillLineStatus.VERIFIED, 5),
        l(BillLineStatus.PART_ACCEPTED, 5),
        l(BillLineStatus.UNDER_REVIEW, 5),
        l(BillLineStatus.REJECTED, 5),
      ])
    ).toEqual({
      claimed: 4,
      total: 5,
      verified: 2,
      underReview: 1,
      rejected: 1,
    });
  });

  test('the title follows the mockups', () => {
    expect(
      billTitle({
        billingModel: BillingModel.RUNNING_ACCOUNT,
        billNumber: 'RA-01',
      })
    ).toBe('Running Account Bill RA-01');
    expect(
      billTitle({
        billingModel: BillingModel.MILESTONE,
        billNumber: 'MB-01',
        milestoneName: 'M05 Structural Frame',
      })
    ).toBe('Milestone Bill MB-01 - M05 Structural Frame');
  });
});
