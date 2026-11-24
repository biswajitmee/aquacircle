"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CircleCheck, LocateFixed, LoaderCircle } from "lucide-react";
import { coordinatesSchema, locationError, mapsLink, type CapturedLocation, type GpsPosition, type ServiceLocation } from "@/lib/service-location";
import { LocationDetails } from "./location-details";
import type { PickerStart } from "./location-picker";

const LocationPicker = dynamic(() => import("./location-picker"), { ssr: false });

export function ServiceLocationField({ id, pin, value, onChange, disabled, error }: {
  id: string;
  pin: string;
  value?: ServiceLocation | null;
  onChange: (value: ServiceLocation | null) => void;
  disabled: boolean;
  error?: string;
}) {
  const [picker, setPicker] = useState<PickerStart | null>(null);
  const [previousPin, setPreviousPin] = useState<CapturedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  const pending = useRef(false);
  const lastPin = useRef(pin);
  const lastValue = useRef(value);
  const input = useRef<HTMLInputElement>(null);

  function cancelRequest() {
    generation.current++;
    pending.current = false;
    setLocating(false);
  }
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => {
    const previous = lastValue.current;
    lastValue.current = value;
    if (previous === value) return;
    cancelRequest();
    // The legacy Address field is kept in sync with this field by EnquiryForm.
    if (previous && previous.source !== "manual" && value?.source === "manual") {
      setPreviousPin(previous);
      setMessage("Address changed. Reconfirm your pin for this address, or submit with a manual address only.");
    }
  }, [value]);
  useEffect(() => {
    if (lastPin.current === pin) return;
    lastPin.current = pin;
    const hadLocation = picker || value || previousPin || pending.current;
    cancelRequest();
    if (hadLocation) {
      setPicker(null);
      setPreviousPin(null);
      onChange(null);
      setMessage("PIN code changed. Please enter or capture your service location again.");
    }
  }, [pin, picker, value, previousPin, onChange]);
  useEffect(() => {
    if (!disabled) return;
    cancelRequest();
    setPicker(null);
  }, [disabled]);

  function edit(address: string) {
    cancelRequest();
    if (value && value.source !== "manual") {
      setPreviousPin(value);
      setMessage("Address changed. Reconfirm your pin for this address, or submit with a manual address only.");
    }
    onChange(address.trim() ? { source: "manual", address, details: value?.details } : null);
  }
  function clear() {
    cancelRequest();
    setPicker(null);
    setPreviousPin(null);
    onChange(null);
    setMessage("Service location cleared. You can leave this field empty.");
    input.current?.focus();
  }
  function detect() {
    if (pending.current || disabled) return;
    if (!navigator.geolocation || !window.isSecureContext) {
      setMessage("Location is not supported in this browser. You can enter your address manually.");
      return;
    }
    cancelRequest();
    const request = generation.current;
    pending.current = true;
    setLocating(true);
    setMessage("Detecting your location…");
    const fail = (code: number) => {
      if (request !== generation.current) return;
      cancelRequest();
      setMessage(locationError(code));
    };
    try {
      // One fresh reading per click. No watcher continues after the picker closes.
      navigator.geolocation.getCurrentPosition(position => {
        if (request !== generation.current) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (!coordinatesSchema.safeParse({ latitude, longitude }).success || !Number.isFinite(accuracy) || accuracy < 0) {
          fail(2); return;
        }
        const gps: GpsPosition = { latitude, longitude, accuracy };
        cancelRequest();
        setPicker({ position: gps, gps, details: value?.details });
        setMessage("");
      }, error => fail(error.code), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    } catch { fail(2); }
  }
  function adjust() {
    const captured = value && value.source !== "manual" ? value : previousPin;
    if (!captured || disabled) return;
    cancelRequest();
    setPicker({ position: captured, gps: null, address: value?.address, geocoded: value?.geocoded, details: value?.details });
  }
  const captured = value && value.source !== "manual" ? value : null;
  return <div className="field service-location-field">
    <label htmlFor={id}>Service Location <span>(Optional)</span></label>
    <div className="location-input">
      <input ref={input} id={id} name="serviceLocation" type="text" value={value?.address ?? ""}
        onChange={event => edit(event.target.value)} placeholder="Enter your address or use current location"
        autoComplete="street-address" maxLength={500} disabled={disabled}
        aria-invalid={!!error} aria-describedby={`${id}-help ${id}-status${error ? ` ${id}-error` : ""}`} />
      <button type="button" className="location-detect" onClick={detect} aria-label="Use current location" title="Use current location"
        disabled={disabled || locating} aria-busy={locating}>
        {locating ? <LoaderCircle className="spin" size={20} aria-hidden="true" /> : <LocateFixed size={20} aria-hidden="true" />}
      </button>
    </div>
    <p id={`${id}-help`} className="location-help">Use your current location, then move the map pin to your building entrance. Location is optional.</p>
    <p className="location-help">Map areas and selected coordinates are sent to Geoapify for maps and address lookup. Only a pin you confirm is included with your request.</p>
    <div id={`${id}-status`} className="location-status" role="status" aria-live="polite">
      {message && <p>{message}</p>}
      {captured && <>
        <p className="location-confirmed"><CircleCheck size={18} aria-hidden="true" /> Location Confirmed</p>
        <p>GPS reported accuracy radius: {captured.accuracy} metres. Your confirmed pin is the navigation destination.</p>
      </>}
    </div>
    {value?.geocoded && <p className="location-attribution">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></p>}
    {(value || locating || previousPin) && <div className="location-actions">
      {(captured || previousPin) && <button className="text-button" type="button" onClick={adjust} disabled={disabled}>{captured ? "Adjust map pin" : "Reconfirm pin"}</button>}
      {value && <a href={mapsLink(value)} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Check in Google Maps</a>}
      <button className="text-button" type="button" onClick={clear} disabled={disabled}>Clear location</button>
    </div>}
    {value && <LocationDetails id={`${id}-details`} value={value.details} disabled={disabled}
      onChange={details => onChange({ ...value, details })} />}
    {picker && !disabled && <LocationPicker id={`${id}-picker`} start={picker} pin={pin}
      onCancel={() => { setPicker(null); setMessage("Map selection cancelled. Your previous service location is unchanged."); }}
      onConfirm={location => {
        cancelRequest(); onChange(location); setPicker(null); setPreviousPin(null);
        setMessage("Your selected pin is confirmed for this visit.");
      }} />}
    {error && <span id={`${id}-error`} className="field-error">{error}</span>}
  </div>;
}
