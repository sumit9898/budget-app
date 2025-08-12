"use client";

import { SUPPORTED } from '@/lib/conversion/mappings';

type Props = {
  type: keyof typeof SUPPORTED;
  value: string | null;
  onChange: (v: string | null) => void;
  allowEmpty?: boolean;
};

export function OutputSelect({ type, value, onChange, allowEmpty }: Props) {
  const options = SUPPORTED[type];
  return (
    <select
      className="input"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Select output format"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
    >
      {allowEmpty && <option value="">Select format…</option>}
      {options.map((ext) => (
        <option key={ext} value={ext}>
          {ext}
        </option>
      ))}
    </select>
  );
}
