export const services = [
  {
    id: "installation",
    number: "01",
    title: "Installation & setup",
    menuTitle: "Water purifier installation",
    slug: "water-purifier-installation",
    short: "Secure fitting, connection checks and a clear handover.",
    image: "/images/services/installation.webp",
    alt: "Technician fitting a wall-mounted water purifier in a sunlit kitchen",
    intro:
      "A considered start for your water purifier. Share your purifier details and installation location so we can plan the fitting and explain what is needed.",
    included: [
      "Review the proposed position and available connections",
      "Fit the purifier using suitable existing connections",
      "Check for leaks and explain everyday operation",
    ],
    extras:
      "New plumbing, electrical work, mounting accessories and additional parts are quoted separately where required.",
    question: "What should I have ready?",
    answer:
      "Share your brand and model if known, and let us know whether a water inlet, outlet and suitable power supply are available.",
  },
  {
    id: "routine",
    number: "02",
    title: "Routine service & cleaning",
    menuTitle: "Routine servicing & cleaning",
    slug: "routine-servicing",
    short: "A thorough check and the maintenance your purifier needs.",
    image: "/images/services/routine.webp",
    alt: "Gloved hand carefully cleaning a water purifier filter housing",
    intro:
      "Give your purifier a little regular attention. We inspect its condition and discuss the maintenance appropriate to your model, usage and service history.",
    included: [
      "Inspect the purifier and its visible connections",
      "Clean accessible components as appropriate for the model",
      "Check operation and explain any maintenance recommendations",
    ],
    extras:
      "Replacement filters, membranes and repairs are outside routine cleaning unless explicitly included in your approved quote.",
    question: "Does servicing always mean changing filters?",
    answer:
      "No. Replacement depends on your model, water conditions, usage and the condition of the parts. Any recommendation is explained before approval.",
  },
  {
    id: "repair",
    number: "03",
    title: "Diagnosis & repairs",
    menuTitle: "Diagnosis & repairs",
    slug: "water-purifier-repair",
    short: "Understand the issue and the work required.",
    image: "/images/services/repair.webp",
    alt: "Technician inspecting the internal components of a water purifier",
    intro:
      "A leak, unusual sound or interrupted water flow starts with understanding the cause. Request an inspection and receive an explanation of the proposed work.",
    included: [
      "Discuss the symptoms and inspect accessible components",
      "Identify the recommended next step",
      "Explain the scope and quote before approved repair work",
    ],
    extras:
      "Replacement components and additional labour depend on the diagnosis. Complex repairs may require a further visit or manufacturer support.",
    question: "Can you confirm a repair before visiting?",
    answer:
      "Photos and model details can help us prepare, but the diagnosis and parts compatibility may need an in-person inspection.",
  },
  {
    id: "filters",
    number: "04",
    title: "Filters & membranes",
    menuTitle: "Filter & membrane replacement",
    slug: "filter-replacement",
    short: "Replacement parts matched to your purifier.",
    image: "/images/services/filters.webp",
    alt: "Sediment filter, carbon cartridge and membrane housing",
    intro:
      "The right replacement starts with the right match. Share your purifier model so we can check compatible filter and membrane options before arranging the work.",
    included: [
      "Review the purifier model and replacement requirement",
      "Confirm compatible parts and their price",
      "Fit approved parts and check operation",
    ],
    extras:
      "Parts are quoted individually. A different component or additional repair will only be included after discussion and approval.",
    question: "How often should I replace a filter?",
    answer:
      "Follow the manufacturer’s guidance for your specific model. Water conditions, usage and inspection findings also matter; there is no single interval for every purifier.",
  },
  {
    id: "relocation",
    number: "05",
    title: "Uninstall & reinstall",
    menuTitle: "Uninstallation & reinstallation",
    slug: "uninstallation-reinstallation",
    short: "Removal and refitting for your next move.",
    image: "/images/services/reinstallation.webp",
    alt: "Technician positioning a purifier for reinstallation in a kitchen",
    intro:
      "Moving home or changing your kitchen? Plan the removal and refitting together, with a check of the new location and its connections.",
    included: [
      "Discuss the current and proposed installation locations",
      "Safely disconnect the purifier for an approved removal",
      "Refit at a suitable location and check connections when booked",
    ],
    extras:
      "Transport, new plumbing, electrical work, additional accessories and separate visits require an agreed scope and quote.",
    question: "Can I book only removal or only refitting?",
    answer:
      "Yes. Choose uninstallation or reinstallation in the request form and explain what you need. We will confirm availability and the scope.",
  },
  {
    id: "guidance",
    number: "06",
    title: "Help choosing a service",
    menuTitle: "Help choosing a service",
    slug: "help-choosing-a-service",
    short: "Tell us what is happening. We’ll help with the next step.",
    image: "/images/services/guidance.webp",
    alt: "A welcoming kitchen ready for a water purifier service visit",
    intro:
      "You do not need to know the name of a part or the cause of a problem. Tell us what you have noticed and we will help identify a sensible next step.",
    included: [
      "Review your description and available purifier details",
      "Discuss which type of visit may be suitable",
      "Confirm availability and explain the next step",
    ],
    extras:
      "Any inspection, service, repair or replacement will have its own confirmed scope and quote.",
    question: "What if I do not know my purifier model?",
    answer:
      "Choose “Not sure” or leave the model field blank. A description of the purifier and the issue is enough to start the conversation.",
  },
] as const;
export const serviceOptions = [
  ...services.map((s) => ({ value: s.id, label: s.title })),
  { value: "uninstallation", label: "Uninstallation only" },
  { value: "reinstallation", label: "Reinstallation only" },
  { value: "availability", label: "Check service availability" },
];
export const serviceIds = [
  "installation",
  "routine",
  "repair",
  "filters",
  "relocation",
  "guidance",
  "uninstallation",
  "reinstallation",
  "availability",
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const serviceLabel = (id: string) =>
  serviceOptions.find((s) => s.value === id)?.label ?? "Service enquiry";
export const faqs = [
  {
    question: "Which purifier brands do you service?",
    answer:
      "Share your brand and model. We’ll confirm service support and suitable parts before arranging the work.",
  },
  {
    question: "What is included in a service visit?",
    answer:
      "Your visit covers the work agreed in your booking. We inspect the purifier, explain the recommended work and share the service details. Replacement parts and additional repairs are quoted before approval.",
  },
  {
    question: "How often should filters be replaced?",
    answer:
      "The right interval depends on your model, water conditions and usage. Follow the manufacturer’s guidance and have the condition of your filters checked during a service.",
  },
  {
    question: "My purifier is leaking. What should I book?",
    answer:
      "Choose Diagnosis & repairs and describe where you see the leak. We’ll confirm the appropriate next step and service availability.",
    service: "repair" as ServiceId,
  },
  {
    question: "Can you uninstall and reinstall my purifier?",
    answer:
      "Yes, you can request removal, refitting or both. Share the current and new locations so we can confirm connections, availability and the scope of work.",
    service: "relocation" as ServiceId,
  },
  {
    question: "What does an annual care plan include?",
    answer:
      "Annual care plan coverage and pricing are not currently published. Please ask us about your maintenance needs; any proposed plan will have its scope and terms explained before you decide.",
    service: "guidance" as ServiceId,
  },
];
