import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

export const MATERIAL_UNITS: {
  group: string;
  units: { value: string; label: string }[];
}[] = [
  {
    group: 'Weight',
    units: [
      { value: 'Kg', label: 'Kilogram (Kg)' },
      { value: 'g', label: 'Gram (g)' },
      { value: 'MT', label: 'Metric Ton (MT)' },
      { value: 'Quintal', label: 'Quintal' },
      { value: 'lb', label: 'Pound (lb)' },
    ],
  },
  {
    group: 'Volume',
    units: [
      { value: 'L', label: 'Litre (L)' },
      { value: 'mL', label: 'Millilitre (mL)' },
      { value: 'cum', label: 'Cubic Meter (cum)' },
      { value: 'cft', label: 'Cubic Feet (cft)' },
      { value: 'Gallon', label: 'Gallon' },
    ],
  },
  {
    group: 'Length',
    units: [
      { value: 'm', label: 'Meter (m)' },
      { value: 'cm', label: 'Centimeter (cm)' },
      { value: 'mm', label: 'Millimeter (mm)' },
      { value: 'ft', label: 'Feet (ft)' },
      { value: 'inch', label: 'Inch' },
      { value: 'Rmt', label: 'Running Meter (Rmt)' },
    ],
  },
  {
    group: 'Area',
    units: [
      { value: 'sqm', label: 'Square Meter (sqm)' },
      { value: 'sqft', label: 'Square Feet (sqft)' },
    ],
  },
  {
    group: 'Count',
    units: [
      { value: 'Nos', label: 'Numbers (Nos)' },
      { value: 'Pcs', label: 'Pieces (Pcs)' },
      { value: 'Set', label: 'Set' },
      { value: 'Pair', label: 'Pair' },
      { value: 'Box', label: 'Box' },
      { value: 'Bag', label: 'Bag' },
      { value: 'Bundle', label: 'Bundle' },
      { value: 'Roll', label: 'Roll' },
      { value: 'Sheet', label: 'Sheet' },
      { value: 'Drum', label: 'Drum' },
      { value: 'Can', label: 'Can' },
      { value: 'Packet', label: 'Packet' },
    ],
  },
  {
    group: 'Time & Work',
    units: [
      { value: 'Hr', label: 'Hour (Hr)' },
      { value: 'Day', label: 'Day' },
      { value: 'LS', label: 'Lump Sum (LS)' },
    ],
  },
];

interface MaterialUnitSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
}

export function MaterialUnitSelector({
  value,
  onValueChange,
  id,
  required,
  className,
}: MaterialUnitSelectorProps) {
  // Normalise to the canonical casing stored in MATERIAL_UNITS so the Select
  // pre-selects correctly when the backend returns a differently-cased string.
  const allUnits = MATERIAL_UNITS.flatMap((g) => g.units);
  const matched = allUnits.find(
    (u) => u.value.toLowerCase() === value?.toLowerCase()
  );
  const normalised = matched ? matched.value : value;

  return (
    <Select
      value={normalised}
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder="Select unit" />
      </SelectTrigger>
      <SelectContent>
        {MATERIAL_UNITS.map((group) => (
          <SelectGroup key={group.group}>
            <SelectLabel>{group.group}</SelectLabel>
            {group.units.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
