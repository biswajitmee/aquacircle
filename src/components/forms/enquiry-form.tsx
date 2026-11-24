"use client";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowRight, CircleCheck, LoaderCircle } from "lucide-react";
import {
  enquirySchema,
  todayInKolkata,
  type EnquiryInput,
  type EnquirySource,
} from "@/lib/validation";
import { serviceOptions, type ServiceId } from "@/content/services";
import { ServiceLocationField } from "./service-location-field";
import {
  NETLIFY_FORM_ENDPOINT,
  NETLIFY_FORM_NAME,
  SUBMISSION_ERROR,
  submitEnquiry,
  usesNetlifyForms,
} from "@/lib/enquiry-submission";
export function EnquiryForm({
  service,
  pin = "",
  source,
  expanded = false,
  onBusy,
  onCancel,
}: {
  service?: ServiceId;
  pin?: string;
  source: EnquirySource;
  expanded?: boolean;
  onBusy?: (busy: boolean) => void;
  onCancel?: () => void;
}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const completed = useRef(false);
  const attempt = useRef<{
    payload: string;
    key: string;
    submittedAt: Date;
  } | null>(null);
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (success) result.current?.focus();
  }, [success]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      mobile: "",
      pin,
      service,
      email: "",
      brand: "",
      model: "",
      address: "",
      location: null,
      preferredDate: "",
      preferredTime: "",
      problem: "",
      consent: false,
      website: "",
      source,
    },
  });
  const currentPin = useWatch({ control, name: "pin" });
  const id = `form-${source}-${expanded ? "modal" : "inline"}`;
  const fieldError = (field: keyof EnquiryInput) =>
    errors[field] ? (
      <span id={`${id}-${field}-error`} className="field-error">
        {errors[field]?.message}
      </span>
    ) : null;
  const accessibility = (field: keyof EnquiryInput) => ({
    id: `${id}-${field}`,
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
  });
  async function submit(values: EnquiryInput) {
    if (inFlight.current || completed.current) return;
    inFlight.current = true;
    setPending(true);
    setFailure("");
    onBusy?.(true);
    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), 25000);
    try {
      const payload = JSON.stringify(values);
      if (attempt.current?.payload !== payload) {
        attempt.current = {
          payload,
          key: crypto.randomUUID(),
          submittedAt: new Date(),
        };
      }
      const reference = await submitEnquiry(
        values,
        attempt.current.key,
        attempt.current.submittedAt,
        abort.signal,
      );
      completed.current = true;
      setSuccess(reference);
    } catch {
      setFailure(SUBMISSION_ERROR);
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
      setPending(false);
      onBusy?.(false);
    }
  }
  if (success)
    return (
      <div ref={result} className="form-success" role="status" tabIndex={-1}>
        <CircleCheck size={36} />
        <h3>Thank you!</h3>
        <p>
          Your service request has been received successfully. Our AquaCircle
          team will contact you shortly.
        </p>
        <p className="reference">
          Reference: <strong>{success}</strong>
        </p>
        <p className="fine-print">
          This is a request, not a confirmed appointment.
        </p>
        {onCancel && (
          <button className="button" onClick={onCancel}>
            Done
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    );
  return (
    <form
      name={NETLIFY_FORM_NAME}
      method="POST"
      action={usesNetlifyForms ? NETLIFY_FORM_ENDPOINT : "/api/enquiries"}
      onSubmit={handleSubmit(submit)}
      noValidate
      data-dirty={isDirty}
      aria-busy={isSubmitting || pending}
      className={`enquiry-form ${expanded ? "expanded" : ""}`}
    >
      <input type="hidden" name="form-name" value={NETLIFY_FORM_NAME} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${id}-name`}>
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            {...register("name")}
            {...accessibility("name")}
            autoComplete="name"
            placeholder="Your name"
            maxLength={100}
            required
          />
          {fieldError("name")}
        </div>
        <div className="field">
          <label htmlFor={`${id}-mobile`}>
            Mobile number <span aria-hidden="true">*</span>
          </label>
          <input
            {...register("mobile")}
            {...accessibility("mobile")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Your mobile number"
            maxLength={15}
            required
          />
          {fieldError("mobile")}
        </div>
        <div className="field">
          <label htmlFor={`${id}-pin`}>
            PIN code <span aria-hidden="true">*</span>
          </label>
          <input
            {...register("pin")}
            {...accessibility("pin")}
            autoComplete="postal-code"
            inputMode="numeric"
            placeholder="Six-digit PIN code"
            maxLength={6}
            required
          />
          {fieldError("pin")}
        </div>
        <div className="field">
          <label htmlFor={`${id}-service`}>
            Service <span aria-hidden="true">*</span>
          </label>
          <select
            {...register("service")}
            {...accessibility("service")}
            required
          >
            <option value="">Choose a service</option>
            {serviceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {fieldError("service")}
        </div>
      </div>
      <Controller
        name="location"
        control={control}
        render={({ field, fieldState }) => (
          <ServiceLocationField
            id={`${id}-location`}
            pin={currentPin}
            value={field.value}
            onChange={field.onChange}
            disabled={isSubmitting || pending}
            error={fieldState.error ? "Please check or clear your service location." : undefined}
          />
        )}
      />
      {expanded && (
        <details className="optional-details">
          <summary>
            Add purifier & visit details <span>(optional)</span>
          </summary>
          <div className="form-grid">
            <div className="field">
              <label htmlFor={`${id}-email`}>Email</label>
              <input
                {...register("email")}
                {...accessibility("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              {fieldError("email")}
            </div>
            <div className="field">
              <label htmlFor={`${id}-brand`}>Purifier brand</label>
              <input
                {...register("brand")}
                {...accessibility("brand")}
                placeholder="Brand, or Not sure"
                list={`${id}-brands`}
                maxLength={80}
              />
              <datalist id={`${id}-brands`}>
                <option value="Not sure" />
              </datalist>
              {fieldError("brand")}
            </div>
            <div className="field">
              <label htmlFor={`${id}-model`}>Purifier model</label>
              <input
                {...register("model")}
                {...accessibility("model")}
                placeholder="Model, or Not sure"
                maxLength={100}
              />
              {fieldError("model")}
            </div>
            <div className="field">
              <label htmlFor={`${id}-preferredDate`}>Preferred date</label>
              <input
                {...register("preferredDate")}
                {...accessibility("preferredDate")}
                type="date"
                min={todayInKolkata()}
              />
              {fieldError("preferredDate")}
            </div>
            <div className="field">
              <label htmlFor={`${id}-preferredTime`}>Preferred time</label>
              <select
                {...register("preferredTime")}
                {...accessibility("preferredTime")}
              >
                <option value="">No preference</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="flexible">Flexible</option>
              </select>
              {fieldError("preferredTime")}
            </div>
            <div className="field">
              <label htmlFor={`${id}-address`}>Address</label>
              <input
                {...register("address")}
                {...accessibility("address")}
                autoComplete="street-address"
                placeholder="Your service address"
                maxLength={500}
              />
              {fieldError("address")}
            </div>
          </div>
          <p className="fine-print">
            Preferred dates and times are subject to confirmation.
          </p>
        </details>
      )}
      {(expanded || source === "contact-form") && (
        <div className="field problem-field">
          <label htmlFor={`${id}-problem`}>
            What can we help with? <span>(optional)</span>
          </label>
          <textarea
            {...register("problem")}
            {...accessibility("problem")}
            rows={expanded ? 3 : 2}
            placeholder="Tell us a little about your purifier or the issue."
            maxLength={2000}
          />
          {fieldError("problem")}
        </div>
      )}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input
          {...register("website")}
          id={`${id}-website`}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label className="consent">
        <input
          type="checkbox"
          {...register("consent")}
          {...accessibility("consent")}
          required
        />
        <span>
          I agree to be contacted about this request.{" "}
          <Link href="/privacy-policy">Privacy policy</Link>
        </span>
      </label>
      {fieldError("consent")}
      {failure && (
        <p role="alert" className="submit-error">
          {failure} Your details are still here.
        </p>
      )}
      <div className="form-actions">
        <button className="button" type="submit" disabled={isSubmitting || pending}>
          {isSubmitting || pending ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Sending request…
            </>
          ) : (
            <>
              {expanded ? "Send service request" : "Request a visit"}
              <ArrowRight size={18} />
            </>
          )}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="text-button"
            onClick={onCancel}
            disabled={isSubmitting || pending}
          >
            Cancel
          </button>
        ) : (
          <p className="fine-print">Appointment subject to confirmation.</p>
        )}
      </div>
    </form>
  );
}
