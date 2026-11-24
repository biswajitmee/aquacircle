"use client";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, LoaderCircle } from "lucide-react";
import { coordinatesSchema, locationError, mapsLink, type CapturedLocation, type ServiceLocation } from "@/lib/service-location";

type Draft = Omit<CapturedLocation, "confirmed"> & { geocoded: boolean };

export function ServiceLocationField({ id, pin, value, onChange, disabled, error }: {
  id: string;
  pin: string;
  value?: ServiceLocation | null;
  onChange: (value: ServiceLocation | null) => void;
  disabled: boolean;
  error?: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [phase, setPhase] = useState<"idle" | "locating" | "address">("idle");
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  const pending = useRef(false);
  const lookup = useRef<AbortController | null>(null);
  const lastPin = useRef(pin);
  const input = useRef<HTMLInputElement>(null);

  function cancelRequest() {
    generation.current++;
    pending.current = false;
    lookup.current?.abort();
    lookup.current = null;
  }
  useEffect(() => () => {
    generation.current++;
    lookup.current?.abort();
  }, []);
  useEffect(() => {
    if (lastPin.current === pin) return;
    lastPin.current = pin;
    const hadLocation = draft || value || pending.current;
    cancelRequest();
    setPhase("idle");
    if (hadLocation) {
      setDraft(null);
      onChange(null);
      setMessage("PIN code changed. Please enter or capture your service location again.");
    }
  }, [pin, draft, value, onChange]);
  useEffect(() => {
    if (!disabled) return;
    cancelRequest();
    setPhase("idle");
    setDraft(null);
  }, [disabled]);

  function edit(address: string) {
    const wasDetected = !!draft || value?.source === "browser" || pending.current;
    cancelRequest();
    setPhase("idle");
    setDraft(null);
    onChange(address.trim() ? { source: "manual", address, geocoded: draft?.geocoded || value?.geocoded } : null);
    if (wasDetected) setMessage("Address edited. Previous GPS coordinates were removed; Maps will use this address.");
  }
  function clear() {
    cancelRequest();
    setPhase("idle");
    setDraft(null);
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
    setDraft(null);
    if (value?.source === "browser") onChange(null);
    setPhase("locating");
    setMessage("Detecting your location…");
    const fail = (code: number) => {
      if (request !== generation.current) return;
      pending.current = false;
      setPhase("idle");
      setMessage(locationError(code));
    };
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        if (request !== generation.current) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (!coordinatesSchema.safeParse({ latitude, longitude }).success || !Number.isFinite(accuracy) || accuracy < 0) {
          fail(2);
          return;
        }
        const captured: Draft = {
          source: "browser", latitude, longitude, accuracy, pin, geocoded: false,
          address: `GPS ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        };
        onChange(null);
        setDraft(captured);
        setPhase("address");
        setMessage("Location detected. Looking up the address…");
        const controller = new AbortController();
        lookup.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 6500);
        let address: string | null = null;
        try {
          const response = await fetch("/api/location/reverse", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
            signal: controller.signal, cache: "no-store",
          });
          if (response.ok) {
            const data = await response.json();
            if (data.provider === "geoapify" && typeof data.address === "string" && data.address.trim() && data.address.length <= 500) address = data.address.trim();
          }
        } catch {
          // Keep the position; do not log customer data or provider responses.
        } finally {
          window.clearTimeout(timeout);
        }
        if (request !== generation.current) return;
        lookup.current = null;
        pending.current = false;
        setPhase("idle");
        setDraft({ ...captured, address: address || captured.address, geocoded: !!address });
        setMessage(address
          ? "Please check the detected address and confirm the location for your visit."
          : "Location detected, but an address could not be found. Confirm this position or enter your address manually.");
      }, (error) => fail(error.code), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    } catch {
      fail(2);
    }
  }
  function confirm() {
    if (!draft || pending.current || disabled) return;
    onChange({ ...draft, confirmed: true });
    setDraft(null);
    setMessage("Location confirmed for this visit. You can still edit or clear it.");
  }
  const captured = draft || (value?.source === "browser" ? value : null);
  const accuracy = captured ? Math.max(1, Math.round(captured.accuracy)) : null;
  const helpId = `${id}-help`;
  const statusId = `${id}-status`;
  return (
    <div className="field service-location-field">
      <label htmlFor={id}>Service Location <span>(Optional)</span></label>
      <div className="location-input">
        <input
          ref={input} id={id} name="serviceLocation" type="text"
          value={draft?.address ?? value?.address ?? ""}
          onChange={(event) => edit(event.target.value)}
          placeholder="Enter your address or use current location"
          autoComplete="street-address" maxLength={500} disabled={disabled}
          aria-invalid={!!error} aria-describedby={`${helpId} ${statusId}${error ? ` ${id}-error` : ""}`}
        />
        <button type="button" className="location-detect" onClick={detect}
          aria-label="Use current location" title="Use current location"
          disabled={disabled || phase !== "idle"} aria-busy={phase !== "idle"}>
          {phase === "idle" ? <LocateFixed size={20} aria-hidden="true" /> : <LoaderCircle className="spin" size={20} aria-hidden="true" />}
        </button>
      </div>
      <p id={helpId} className="location-help">Use your current location for easier technician navigation.</p>
      <p className="location-help">With your permission, coordinates are used to look up an address. Confirm them below to include them with your request.</p>
      <div id={statusId} className="location-status" role="status" aria-live="polite">
        {message && <p>{message}</p>}
        {accuracy !== null && <p>Location detected — accuracy approximately {accuracy} metres. Please check your address and building entrance.</p>}
      </div>
      {(draft?.geocoded || value?.geocoded) && <p className="location-attribution">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></p>}
      {(draft || value || phase !== "idle") && <div className="location-actions">
        {draft && <button className="text-button" type="button" disabled={disabled || phase !== "idle"} onClick={confirm}>Confirm this location</button>}
        {value && <a href={mapsLink(value)} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Check in Google Maps</a>}
        <button className="text-button" type="button" onClick={clear} disabled={disabled}>Clear location</button>
      </div>}
      {draft && <p className="location-help">This detected location will not be included in your service request until you confirm it.</p>}
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  );
}
