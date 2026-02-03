// src/flow.js
export const FLOW = [
  // 1) Identity
  {
    id: "welcome",
    question:
      "Hi! 👋 I’ll collect a few details so our team can help you faster. How should I call you?",
    field: "client.identity",
    type: "text",
    mode: "strict",
    help: "Example: Rahul / John Smith",
    validationPolicy: { kind: "identity" },
    acknowledgements: ["Nice to meet you!", "Great — thanks!", "Perfect, thank you."],
  },
  
  // 2) Work Email
  {
    id: "company_name",
    question: "What’s your company name?",
    field: "client.company",
    type: "text",
    mode: "strict",
    help: "KCX",
    validationPolicy: { kind: "identity" },
    acknowledgements: ["Perfect — saved.", "Got it.", "Thanks!"],
  },

  // 3) Service selection (buttons)
  {
    id: "service",
    question: "What do you need help with?",
    field: "project.service",
    type: "choice",
    mode: "strict",
    options: [
      "Dashboard customization",
      "Cost optimization",
      "Cloud billing issues",
      "Alerts & monitoring",
      "FinOps consultation",
      "Other",
    ],
    help: "Pick one option.",
    acknowledgements: ["Cool — noted.", "Perfect.", "Got it."],
  },

  // 4) Optional qualifier: Cloud provider (buttons)
  {
    id: "provider",
    question: "Which cloud provider are you using?",
    field: "finops.provider",
    type: "choice",
    mode: "strict",
    options: ["AWS", "GCP", "Azure", "Multi-cloud", "Not sure"],
    help: "Pick one option.",
    acknowledgements: ["Got it.", "Nice — noted.", "Perfect."],
  },

  // 5) Optional qualifier: Spend (buttons)
  {
    id: "spend",
    question: "Approximate monthly cloud spend?",
    field: "finops.spend",
    type: "choice",
    mode: "strict",
    options: ["< $1k", "$1k–$10k", "$10k–$50k", "$50k+", "Not sure"],
    help: "Select the closest range.",
    acknowledgements: ["Thanks — captured.", "Perfect.", "Got it."],
  },

  // 6) Optional qualifier: Role (buttons)
  {
    id: "role",
    question: "What’s your role?",
    field: "client.role",
    type: "choice",
    mode: "strict",
    options: ["Finance", "Engineering", "Leadership", "Ops/Cloud", "Other"],
    help: "Pick one option.",
    acknowledgements: ["Noted.", "Perfect.", "Got it."],
  },

  // 7) Message / purpose
  {
    id: "message",
    question: "Tell us a bit more about your need (1–2 lines is enough).",
    field: "project.message",
    type: "text",
    mode: "ai_assist",
    help: "Example: We want billing anomaly alerts and a dashboard for AWS costs.",
    acknowledgements: ["Understood.", "Got it — that helps.", "Perfect."],
  },

  // 8) Meeting ask (buttons)
  {
    id: "schedule_meeting",
    question: "Would you like to schedule a meeting call now?",
    field: "meeting.want",
    type: "choice",
    mode: "strict",
    options: ["yes", "no"],
    help: "Tap yes to book a call, or no to finish.",
    acknowledgements: ["Cool.", "Got it.", "Perfect."],
    validationPolicy: { kind: "yes_no" },
  },

  // 9) Meeting email (only if yes)
  {
    id: "meeting_email",
    question: "What email should we send the meeting invite to?",
    field: "meeting.email",
    type: "text",
    mode: "strict",
    help: "Example: rahul@company.com",
    acknowledgements: ["Perfect — saved.", "Got it.", "Thanks!"],
    validationPolicy: { kind: "email" },
    skipIf: (state) => (state?.meeting?.want || "").toLowerCase() !== "yes",
  },

  // 10) Optional meeting note (only if yes)
  {
    id: "meeting_message",
    question: "Any message for our team before the call? (optional)",
    field: "meeting.message",
    type: "text",
    mode: "ai_assist",
    help: "Example: Please focus on AWS savings + RI/SP strategy.",
    acknowledgements: ["Nice — added.", "Got it.", "Perfect."],
    skipIf: (state) => (state?.meeting?.want || "").toLowerCase() !== "yes",
  },

  // 11) Redirect step (only if yes)
  {
    id: "redirect",
    type: "redirect",
    mode: "redirect",
    redirect: true,
    field: null,
    skipIf: (state) => (state?.meeting?.want || "").toLowerCase() !== "yes",
  },

  // 12) Done
  {
    id: "done",
    question:
      "✅ Thanks! Your details are captured. Click Summary for getting a recap.",
    field: null,
    type: "done",
    mode: "strict",
    help: "Commands: confirm / summary / restart",
  },
];
