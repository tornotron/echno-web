import type { Material } from '@tornotron/echno-core/materials/types';

interface MaterialSkuMoqProps {
  /** The material picked in the form, if any. */
  material?: Pick<Material, 'sku' | 'moq' | 'unit'>;
}

/**
 * The picked material's SKU and minimum order quantity, shown under its select.
 * Both are optional on the record, so only what is set is shown. An MOQ of 0 is
 * how the material form records no minimum, so it is left out too.
 */
export function MaterialSkuMoq({ material }: MaterialSkuMoqProps) {
  if (!material) return null;
  const parts: string[] = [];
  if (material.sku) parts.push(`SKU: ${material.sku}`);
  if (material.moq) {
    const unit = material.unit ? ` ${material.unit}` : '';
    parts.push(`MOQ: ${material.moq}${unit}`);
  }
  if (parts.length === 0) return null;
  return <p className="text-muted-foreground text-xs">{parts.join(' · ')}</p>;
}
