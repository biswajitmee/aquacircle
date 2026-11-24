"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LocateFixed, LoaderCircle, X } from "lucide-react";
import { trapDialogFocus } from "@/lib/focus-trap";
import { coordinatesSchema, locationError, type AddressDetails, type CapturedLocation, type Coordinates, type GpsPosition } from "@/lib/service-location";
import LocationMap from "./location-map";
import { LocationDetails } from "./location-details";
import "./location-picker.css";

export type PickerStart = {
  position: GpsPosition;
  gps: GpsPosition | null;
  address?: string;
  geocoded?: boolean;
  details?: AddressDetails;
};

export default function LocationPicker({ id, start, pin, onConfirm, onCancel }: {
  id: string;
  start: PickerStart;
  pin: string;
  onConfirm: (location: CapturedLocation) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [candidate, setCandidate] = useState<Coordinates>({ latitude: start.position.latitude, longitude: start.position.longitude });
  const [gps, setGps] = useState(start.gps);
  const [recenter, setRecenter] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState(start.address || "");
  const [geocoded, setGeocoded] = useState(!!start.geocoded);
  const [details, setDetails] = useState<AddressDetails>(start.details || {});
  const [moving, setMoving] = useState(false);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");
  const lookup = useRef<AbortController | null>(null);
  const lookupVersion = useRef(0);
  const gpsVersion = useRef(0);
  const lastLookup = useRef(0);
  const edited = useRef(!!start.address);
  const closed = useRef(false);

  function invalidateLookup() { lookupVersion.current++; lookup.current?.abort(); }
  function cancel() {
    closed.current = true; invalidateLookup(); gpsVersion.current++;
    onCancel();
  }
  useLayoutEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const parent = element.parentElement?.closest("dialog");
    const bodyOverflow = document.body.style.overflow;
    const parentOverflow = parent?.style.overflow || "";
    closed.current = false;
    document.body.style.overflow = "hidden";
    if (parent) parent.style.overflow = "hidden";
    element.showModal();
    return () => {
      // The closed flag also rejects callbacks from non-abortable geolocation.
      closed.current = true; lookup.current?.abort();
      element.close();
      document.body.style.overflow = bodyOverflow;
      if (parent) parent.style.overflow = parentOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (moving || edited.current) return;
    const version = ++lookupVersion.current;
    const controller = new AbortController();
    lookup.current = controller;
    setLookupMessage("Looking up the selected address…");
    // Wait until movement settles and keep requests at least 1.1 seconds apart.
    const delay = Math.max(600, lastLookup.current + 1100 - Date.now());
    const timer = window.setTimeout(async () => {
      lastLookup.current = Date.now();
      const timeout = window.setTimeout(() => controller.abort(), 6500);
      let result: string | null = null;
      try {
        const response = await fetch("/api/location/reverse", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidate), signal: controller.signal, cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.provider === "geoapify" && typeof data.address === "string" && data.address.trim() && data.address.length <= 500) result = data.address.trim();
        }
      } catch { /* Keep the pin usable without logging precise location data. */ }
      finally { window.clearTimeout(timeout); }
      if (closed.current || version !== lookupVersion.current) return;
      setAddress(result || "");
      setGeocoded(!!result);
      setLookupMessage(result ? "Check the address and add any missing details. The pin sets the destination." : "An address could not be found. You can type one or confirm the selected pin without it.");
    }, delay);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [candidate, moving]);

  function select(coordinates: Coordinates) {
    setMoving(false);
    if (coordinates.latitude === candidate.latitude && coordinates.longitude === candidate.longitude) {
      // A zoom/resize may have interrupted the first lookup without changing the pin.
      if (!edited.current && !address) setCandidate({ ...coordinates });
      return;
    }
    invalidateLookup(); edited.current = false;
    setAddress(""); setGeocoded(false); setCandidate(coordinates);
  }
  function currentLocation() {
    if (locating) return;
    if (!navigator.geolocation) { setGpsMessage(locationError(2)); return; }
    const version = ++gpsVersion.current;
    setLocating(true); setGpsMessage("Detecting a fresh location…");
    const fail = (code: number) => {
      if (closed.current || version !== gpsVersion.current) return;
      setLocating(false); setGpsMessage(locationError(code));
    };
    try {
      navigator.geolocation.getCurrentPosition(position => {
        if (closed.current || version !== gpsVersion.current) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (!coordinatesSchema.safeParse({ latitude, longitude }).success || !Number.isFinite(accuracy) || accuracy < 0) { fail(2); return; }
        const fresh = { latitude, longitude, accuracy };
        setGps(fresh); select({ latitude, longitude }); setRecenter({ latitude, longitude });
        setLocating(false); setGpsMessage("Map recentered. Check your building entrance before confirming.");
      }, error => fail(error.code), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    } catch { fail(2); }
  }
  function confirm() {
    if (closed.current || moving || locating || !ready) return;
    closed.current = true; invalidateLookup(); gpsVersion.current++;
    onConfirm({ source: "map", ...candidate, accuracy: gps?.accuracy ?? start.position.accuracy,
      address: address.trim() || `Map pin ${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}`,
      details, pin, confirmed: true, geocoded });
  }
  return <dialog ref={dialog} className="location-picker" aria-labelledby={`${id}-title`}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); cancel(); }}
    onClick={event => event.stopPropagation()}
    onKeyDown={event => {
      event.stopPropagation(); trapDialogFocus(event);
      // Inputs belong to the booking form; Enter must not submit behind the dialog.
      if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
    }}>
    <header className="location-picker-header">
      <div><p className="location-kicker">AQUACIRCLE · SERVICE VISIT</p><h2 id={`${id}-title`}>Confirm Your Service Location</h2></div>
      <button className="icon-button" type="button" aria-label="Close location picker" onClick={cancel} autoFocus><X size={22} /></button>
    </header>
    <div className="location-picker-body">
      <p id="location-map-instructions" className="location-map-instructions">Move the map beneath the pin to your building or entrance. Pinch or use + / − to zoom. With the map focused, use the arrow keys to move.</p>
      <LocationMap initial={start.position} recenter={recenter} gps={gps} onReady={setReady}
        onMoveStart={() => { invalidateLookup(); setMoving(true); }} onSelect={select} />
      <p className="location-map-attribution">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></p>
      <div className="location-map-toolbar">
        <button type="button" className="location-recenter" onClick={currentLocation} disabled={locating}>
          {locating ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />} Use Current Location
        </button>
        <p className="location-coordinates" aria-live="polite">Selected pin: <span>{candidate.latitude.toFixed(6)}, {candidate.longitude.toFixed(6)}</span></p>
      </div>
      {!ready && <p className="location-map-notice" role="status">Waiting for the map. If it cannot load, cancel and enter your address manually.</p>}
      <p className="location-accuracy">GPS reported accuracy radius: <strong>{gps?.accuracy ?? start.position.accuracy} metres</strong>. {gps ? "The shaded circle shows this device estimate. " : ""}Check the pin yourself; GPS and map data may be approximate.</p>
      {gpsMessage && <p className="location-help" role="status">{gpsMessage}</p>}
      <div className="field">
        <label htmlFor={`${id}-address`}>Selected address <span>(editable)</span></label>
        <textarea id={`${id}-address`} value={address} rows={2} maxLength={500}
          placeholder="Add an address, or use the selected pin" aria-describedby={`${id}-lookup`}
          onChange={event => { invalidateLookup(); edited.current = true; setAddress(event.target.value); setGeocoded(false); setLookupMessage("Check that your edited address matches the pin before confirming."); }} />
        <p id={`${id}-lookup`} className="location-help" role="status">{lookupMessage}</p>
      </div>
      <LocationDetails id={`${id}-details`} value={details} onChange={setDetails} />
    </div>
    <footer className="location-picker-footer">
      <button type="button" className="text-button" onClick={cancel}>Cancel</button>
      <button type="button" className="button" onClick={confirm} disabled={moving || locating || !ready}>Confirm Pin Location</button>
    </footer>
  </dialog>;
}
