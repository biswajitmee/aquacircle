export const policies = {
  "privacy-policy": {
    title: "Privacy policy",
    description:
      "How AquaCircle handles information shared through service enquiry forms.",
    sections: [
      {
        title: "Information you choose to share",
        text: "When you request service, we collect your name, mobile number, PIN code and selected service. You may also provide an email address, purifier details, address, preferred visit details and a description of the issue. Please include only information relevant to your service request.",
      },
      {
        title: "How your information is used",
        text: "We use your details to review the enquiry, contact you, check service availability and arrange the requested work. Website requests are stored using Netlify Forms and included in business email notifications when configured. Appointment preferences do not create a confirmed booking.",
      },
      {
        title: "Optional service location",
        text: "You can type a service address or choose to share your current location. We request browser location permission only after you select the location button; we do not continuously track you. When address lookup is enabled, the captured coordinates are sent securely to our server and Geoapify to resolve an address, even if you later choose not to submit the enquiry. You can review, correct or clear the result. Detected coordinates and accuracy are included with your request only after you select Confirm this location and submit the form. Editing an address removes the previous GPS destination; changing the PIN code clears the service location. Confirmed locations, manual addresses and Maps links are handled as customer information in Netlify Forms and business email for authorised staff arranging technician visits. Location is not saved in browser localStorage or sent to analytics. Opening a Google Maps link shares the selected destination with Google. Location may be approximate and may not identify the building entrance. You can request service without sharing a location.",
      },
      {
        title: "Service providers and access",
        text: "The website’s hosting, database and configured email providers process information needed to operate the enquiry service. Access is intended for authorised personnel handling enquiries and maintaining the service. The site does not include advertising trackers or sell enquiry information.",
      },
      {
        title: "Security and spam prevention",
        text: "The form checks required contact details, service selection and consent before submission. Netlify applies its own spam filtering and processes requests using its hosting infrastructure. No email passwords or private API keys are included in the browser form. Access to stored requests and notifications is restricted through the hosting and email accounts.",
      },
      {
        title: "Retention",
        text: "Requests and email notifications remain in the hosting and business email accounts until they are removed through those services. You can request correction or deletion using the contact form. Copies retained by service providers follow their retention arrangements.",
      },
      {
        title: "Your enquiries and privacy requests",
        text: "To ask about, correct or request deletion of information you have shared, use the contact form and mention “Privacy request”, with your enquiry reference if available. We may need to verify that the request relates to your information. Avoid including sensitive documents in the form.",
      },
      {
        title: "Cookies and changes",
        text: "The website does not use advertising or analytics cookies. Essential hosting security features may operate independently. This page should be updated when the business changes its data-handling arrangements.",
      },
    ],
  },
  terms: {
    title: "Terms & conditions",
    description:
      "Information about using the AquaCircle website and requesting water purifier care.",
    sections: [
      {
        title: "Using this website",
        text: "This website lets you explore water purifier services and submit an enquiry to AquaCircle. Please provide accurate contact and service information, and use the forms only for genuine enquiries.",
      },
      {
        title: "Requests and appointment confirmation",
        text: "Submitting a form records a service request. It does not confirm an appointment, service availability or a price. We contact you to discuss your address, purifier, the required work and scheduling before a visit is agreed.",
      },
      {
        title: "Service scope and pricing",
        text: "Work and charges are agreed separately for your visit. Replacement parts, additional repairs, plumbing or electrical work are included only when explicitly agreed. We do not publish a universal service price or promise compatibility with every model.",
      },
      {
        title: "Information on the website",
        text: "Service descriptions explain the kinds of work you can enquire about. The suitable approach depends on the purifier, installation conditions and inspection. Manufacturer-specific advice and instructions remain relevant to your appliance.",
      },
      {
        title: "Availability and website interruptions",
        text: "Website availability may be interrupted by maintenance or technical problems. If a form reports an error, keep your details and retry. A reference number indicates that an enquiry has been saved; it does not indicate that a visit has been confirmed.",
      },
      {
        title: "Questions about these terms",
        text: "Please use the contact page for questions about a request or these terms. Any specific visit terms should be explained and agreed before the work begins. These website terms do not remove applicable consumer rights.",
      },
    ],
  },
  "service-policy": {
    title: "Service policy",
    description:
      "How AquaCircle handles visit requests, service scope, parts and changes to an appointment.",
    sections: [
      {
        title: "Before a visit",
        text: "Share your contact details, PIN code and the service you need. Brand and model information is helpful but optional. We confirm service support, your location and availability before agreeing to a visit.",
      },
      {
        title: "During the visit",
        text: "The purifier is checked and the recommended work explained. The visit covers the agreed scope. Parts, additional repairs and any change to the work should be discussed and approved before proceeding.",
      },
      {
        title: "Replacement parts",
        text: "Replacement parts must be suitable for the purifier. Compatibility, availability, price and any applicable manufacturer terms should be confirmed before fitting. No claim of universal brand support or manufacturer authorisation is made on this site.",
      },
      {
        title: "After the work",
        text: "Operation is checked and the service details shared. Keep your service record and any part-related documentation. If an issue remains, contact us with the enquiry reference and explain what you have noticed.",
      },
      {
        title: "Changing a visit",
        id: "changing-a-visit",
        text: "If you need to change or cancel a requested visit, contact us as soon as possible through the contact page or the confirmed contact channel used to arrange it. A new date remains subject to availability. Any cancellation terms or charges must be explained before you agree to the visit.",
      },
      {
        title: "Revisits and warranty",
        text: "A general revisit guarantee or warranty period is not published here. Any applicable terms for work or supplied parts should be provided in the agreed quote or service record. Ask for clarification before approval.",
      },
      {
        title: "Care plans",
        text: "Annual care plan prices and inclusions are not currently published. A request for ongoing care starts a conversation; it does not enrol you in a plan or recurring payment.",
      },
    ],
  },
} as const;
