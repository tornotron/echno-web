/**
 * Builds the href that opens a project's BIM viewer focused on one element.
 *
 * Lives in `lib` so both the BIM feature and the shared "show in model" link
 * (rendered from the inspections screens) can reach it without a
 * feature-to-feature import. The viewer reads `element` (an IFC GlobalId) and
 * the optional `storey` (the storey's GlobalId, which saves it a lookup) from
 * the query string.
 */

export const BIM_ELEMENT_PARAM = 'element';
export const BIM_STOREY_PARAM = 'storey';
export const BIM_MODEL_PARAM = 'model';

export interface BimViewerTarget {
  /** IFC GlobalId of the element to focus. */
  element?: string;
  /** GlobalId of the storey that holds it, when known. */
  storey?: string;
  /** A specific model, when the project has more than one. */
  model?: string;
}

export function bimViewerHref(
  projectId: number | string,
  target: BimViewerTarget = {}
): string {
  const base = `/users/dashboard/projects/all-projects/${projectId}/bim`;
  const params = new URLSearchParams();
  if (target.model) params.set(BIM_MODEL_PARAM, target.model);
  if (target.element) params.set(BIM_ELEMENT_PARAM, target.element);
  if (target.storey) params.set(BIM_STOREY_PARAM, target.storey);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
