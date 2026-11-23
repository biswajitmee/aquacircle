"use client";
import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { pinSchema } from "@/lib/validation";
import { useBooking } from "./booking-provider";
export function AreaCheck() {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { openBooking } = useBooking();
  async function check(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!pinSchema.safeParse(pin).success) {
      setError("Enter a valid six-digit Indian PIN code.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/coverage?pin=${encodeURIComponent(pin)}`,
      );
      const result = await response.json();
      if (!response.ok) throw new Error("Please try again.");
      setMessage(result.message);
    } catch {
      setError("We couldn’t check right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="area-check">
      <form onSubmit={check} noValidate>
        <label htmlFor="area-pin">Your PIN code</label>
        <div className="area-controls">
          <div className="pin-input">
            <MapPin size={17} />
            <input
              id="area-pin"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setMessage("");
                setError("");
              }}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="Enter your PIN code"
              aria-invalid={!!error}
              aria-describedby={error ? "pin-error" : "pin-result"}
            />
          </div>
          <button className="button" disabled={busy}>
            {busy ? "Checking…" : "Check availability"}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
      {error && (
        <p id="pin-error" role="alert" className="field-error">
          {error}
        </p>
      )}
      <div id="pin-result" aria-live="polite">
        {message && (
          <div className="area-result">
            <p>{message}</p>
            <button
              className="text-link"
              onClick={() =>
                openBooking({
                  service: "availability",
                  pin,
                  source: "area-check",
                })
              }
            >
              Ask about this PIN
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
