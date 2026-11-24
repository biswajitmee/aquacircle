import nodemailer from "nodemailer";
import type { EnquiryInput } from "@/lib/validation";
import { serviceLabel } from "@/content/services";
import { serviceRequestSubject } from "@/lib/enquiry-submission";
import { locationFields } from "@/lib/service-location";
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function emailContent(
  reference: string,
  data: EnquiryInput,
  createdAt: Date,
) {
  const location = locationFields(data);
  const locationHtml = `<h2 style="font-size:18px;margin-top:24px">SERVICE LOCATION DETAILS</h2><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(location.serviceLocationDetails)}</p>${location.googleMaps ? `<p><a href="${escapeHtml(location.googleMaps)}" style="display:inline-block;background:#123f3b;color:#ffffff;padding:14px 18px;border-radius:6px;text-decoration:none">OPEN CUSTOMER LOCATION IN GOOGLE MAPS</a></p>` : ""}`;
  const fields = [
    ["Reference", reference],
    ["Name", data.name],
    ["Mobile", data.mobile],
    ["Email", data.email || "Not supplied"],
    ["Service", serviceLabel(data.service)],
    ["Brand", data.brand || "Not supplied"],
    ["Model", data.model || "Not supplied"],
    ["PIN code", data.pin],
    ["Address", data.address || "Not supplied"],
    ["Preferred date", data.preferredDate || "Not specified"],
    ["Preferred time", data.preferredTime || "Not specified"],
    ["Description", data.problem || "Not supplied"],
    [
      "Contact consent",
      data.consent ? "Agreed to be contacted about this request" : "Not agreed",
    ],
    ["Source", "AquaCircle.in Website"],
    ["Source location", data.source],
    [
      "Submitted",
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "long",
      }).format(createdAt),
    ],
  ];
  return {
    subject: serviceRequestSubject(data.name, data.service),
    text: `AquaCircle service enquiry\n\n${fields.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${location.serviceLocationDetails}\n\nAppointment requires confirmation.`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f7f2;font-family:Arial,sans-serif;color:#142b29"><div style="max-width:640px;margin:24px auto;padding:30px"><h1 style="font-size:28px;color:#123f3b">AquaCircle</h1><h2 style="font-size:21px">New service enquiry</h2><table role="presentation" style="width:100%;border-collapse:collapse">${fields.map(([k, v]) => `<tr><th style="text-align:left;vertical-align:top;padding:12px 10px;border-bottom:1px solid #dcefe9;font-size:13px;width:30%">${escapeHtml(k)}</th><td style="padding:12px 10px;border-bottom:1px solid #dcefe9;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(v)}</td></tr>`).join("")}</table>${locationHtml}<p style="font-size:12px;margin-top:24px">Preferred dates and times are requests. Please contact the customer to confirm availability.</p></div></body></html>`,
  };
}
export function mailConfigurationReady() {
  return (
    process.env.EMAIL_PROVIDER === "smtp" &&
    !!process.env.SMTP_HOST &&
    !!process.env.EMAIL_FROM &&
    !!process.env.BUSINESS_NOTIFICATION_EMAIL
  );
}
export function transport() {
  if (!mailConfigurationReady()) throw new Error("MAIL_NOT_CONFIGURED");
  const port = Number(process.env.SMTP_PORT || 587);
  const local = process.env.LOCAL_DEVELOPMENT === "1";
  const secure = process.env.SMTP_SECURE === "true";
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !local && !secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 10000,
  });
}
export async function sendBusinessEmail(
  reference: string,
  data: EnquiryInput,
  createdAt: Date,
) {
  const sender = transport();
  const result = await sender.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.BUSINESS_NOTIFICATION_EMAIL,
    ...emailContent(reference, data, createdAt),
    messageId: `<${reference.toLowerCase()}@aquacircle.in>`,
    ...(data.email ? { replyTo: data.email } : {}),
  });
  if (!result.accepted?.length) throw new Error("RECIPIENT_NOT_ACCEPTED");
}
export async function sendAcknowledgement(
  reference: string,
  data: EnquiryInput,
) {
  if (
    process.env.SEND_CUSTOMER_ACKNOWLEDGEMENT !== "true" ||
    !data.email ||
    !mailConfigurationReady()
  )
    return false;
  const result = await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: data.email,
    subject: `AquaCircle request received — ${reference}`,
    text: `Hello ${data.name},\n\nYour service request has been received.\nReference: ${reference}\n\nWe will contact you to confirm service availability and your appointment. This is not a confirmed appointment.\n\nAquaCircle — Pure Care. Full Circle.`,
    html: `<p>Hello ${escapeHtml(data.name)},</p><p>Your service request has been received.</p><p>Reference: <strong>${escapeHtml(reference)}</strong></p><p>We will contact you to confirm service availability and your appointment. This is not a confirmed appointment.</p><p>AquaCircle — Pure Care. Full Circle.</p>`,
    messageId: `<ack-${reference.toLowerCase()}@aquacircle.in>`,
  });
  return !!result.accepted?.length;
}
