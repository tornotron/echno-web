/**
 * Utility functions for generating sequential document numbers.
 *
 * Format: {PREFIX}-{YEAR}-{SEQUENCE}
 * Sequence is zero-padded to at least 6 digits (e.g. 000001, 000012, 000123, 001234).
 */

const SEQUENCE_PADDING = 6;

/**
 * Extracts the numeric sequence from a document number string.
 * Returns 0 if the number doesn't match the expected format.
 */
function extractSequence(docNumber: string, prefix: string): number {
  const year = new Date().getFullYear();
  const regex = new RegExp(String.raw`^${prefix}-${year}-(\d+)$`);
  const match = docNumber.match(regex);
  return match ? Number.parseInt(match[1], 10) : 0;
}

/**
 * Generates the next document number given a prefix and the existing
 * document numbers for the current year.
 *
 * @param prefix - e.g. "IND", "PO", "TRF", "GRN"
 * @param existingNumbers - all existing document numbers of this type for the year
 */
function generateDocumentNumber(
  prefix: string,
  existingNumbers: string[]
): string {
  const year = new Date().getFullYear();

  let maxSequence = 0;
  for (const num of existingNumbers) {
    const seq = extractSequence(num, prefix);
    if (seq > maxSequence) maxSequence = seq;
  }

  const next = (maxSequence + 1).toString().padStart(SEQUENCE_PADDING, '0');
  return `${prefix}-${year}-${next}`;
}

/**
 * Generates the next indent number.
 * Format: IND-{YEAR}-{000001...}
 *
 * @param existingIndentNumbers - all existing indent numbers for the current year
 */
export function generateIndentNumber(existingIndentNumbers: string[]): string {
  return generateDocumentNumber('IND', existingIndentNumbers);
}

/**
 * Generates the next purchase order number.
 * Format: PO-{YEAR}-{000001...}
 *
 * @param existingPoNumbers - all existing PO numbers for the current year
 */
export function generatePoNumber(existingPoNumbers: string[]): string {
  return generateDocumentNumber('PO', existingPoNumbers);
}

/**
 * Generates the next transfer number.
 * Format: TRF-{YEAR}-{000001...}
 *
 * @param existingTransferNumbers - all existing transfer numbers for the current year
 */
export function generateTransferNumber(
  existingTransferNumbers: string[]
): string {
  return generateDocumentNumber('TRF', existingTransferNumbers);
}

/**
 * Generates the next GRN number.
 * Format: GRN-{YEAR}-{000001...}
 *
 * @param existingGrnNumbers - all existing GRN numbers for the current year
 */
export function generateGrnNumber(existingGrnNumbers: string[]): string {
  return generateDocumentNumber('GRN', existingGrnNumbers);
}
