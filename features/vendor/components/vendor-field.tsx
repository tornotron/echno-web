interface VendorFieldProps {
  label: string;
  value: React.ReactNode;
}

export function VendorField({ label, value }: VendorFieldProps) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}
