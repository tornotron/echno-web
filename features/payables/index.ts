export { PayablesView } from './components/payables-view';
export {
  AMOUNT_MAX,
  AMOUNT_SCALE,
  checkAmount,
  checkPayableDraft,
  checkPaymentAmount,
  CONTRACTOR_NAME_MAX_LENGTH,
  payablePaymentGate,
  PAYABLE_NUMBER_MAX_LENGTH,
} from './payable-action-gates';
export type {
  AmountCheck,
  PayableActionGate,
  PayableDraft,
  PayableDraftProblem,
} from './payable-action-gates';
