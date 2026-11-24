"use client";
import type { AddressDetails } from "@/lib/service-location";

const fields = [
  ["flat", "Flat / House Number", 100],
  ["building", "Building / Apartment Name", 150],
  ["floor", "Floor", 40],
  ["landmark", "Nearby Landmark", 200],
  ["entrance", "Entrance / Access Instructions", 500],
] as const;

export function LocationDetails({ id, value = {}, onChange, disabled = false }: {
  id: string;
  value?: AddressDetails;
  onChange: (details: AddressDetails) => void;
  disabled?: boolean;
}) {
  return <details className="location-details">
    <summary>Add flat, building & entrance details <span>(optional)</span></summary>
    <p className="location-help">These details describe the same service address and keep your selected pin.</p>
    <div className="location-details-grid">
      {fields.map(([key, label, maxLength]) => <div className="field" key={key}>
        <label htmlFor={`${id}-${key}`}>{label}</label>
        <input id={`${id}-${key}`} value={value[key] || ""} maxLength={maxLength} disabled={disabled}
          onChange={event => onChange({ ...value, [key]: event.target.value })} />
      </div>)}
    </div>
  </details>;
}
