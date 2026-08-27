/**
 * The 28 states and 8 union territories a project site can sit in, in the
 * canonical spelling the backend stores.
 *
 * Offered as a fixed list rather than a text box on purpose. The backend keys
 * its statutory compliance rules by state name and rejects anything that is not
 * one of these, so a free-text field would turn every typo and every "Tamilnadu"
 * into a failed save. Picking from the list makes that unreachable.
 *
 * The backend holds the same list in `IndianStateResolver`. Worth folding into
 * `@tornotron/echno-core` when it next changes, so the two cannot drift.
 */
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];
