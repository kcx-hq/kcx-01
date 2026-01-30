// src/flow.js
export const FLOW = [
  {
    id: "welcome",
    question:
      "Hi! I’m here to gather your project requirements. First—what’s your name and company?",
    field: "client.identity",
    type: "text",
    mode: "strict",
    help: "Example: Rahul (Acme Corp) / John Smith, Acme Corp",
    validationPolicy: { kind: "identity" },
    acknowledgements: [
      "Nice to meet you!",
      "Great — thanks!",
      "Perfect, thank you.",
    ],
  },
  {
    id: "project_type",
    question:
      "What type of project do you need? (dashboard, mobile app, website, automation, API, etc.)",
    field: "project.type",
    type: "text",
    mode: "strict",
    help: "Common types: dashboard, mobile app, website, web platform, automation tool, API service, desktop app",
    validationPolicy: { kind: "project_type" },
    acknowledgements: ["Nice, that makes sense.", "Cool — noted.", "Perfect."],
  },
  {
    id: "problem",
    question: "What problem are you trying to solve? (1–2 lines is enough)",
    field: "project.problem",
    type: "text",
    mode: "ai_assist",
    ambiguityPolicy: {
      minWords: 5,
      vagueWords: [
        "monitoring",
        "tracking",
        "analytics",
        "dashboard",
        "automation",
      ],
    },
    help: "Example: We need to monitor AWS billing anomalies to avoid cost overruns",
    acknowledgements: ["Understood.", "Got it — that helps."],
  },
  {
    id: "users",
    question: "Who will use it? (roles like admin, finance, manager, customer)",
    field: "project.users",
    type: "text",
    mode: "ai_assist",
    help: "Example: HR Manager, Finance Lead, Employee, Admin",
    acknowledgements: ["Nice, noted.", "Perfect.", "Got it — thanks."],
  },
  {
    id: "features",
    question:
      "List the top features you want. (Comma-separated is fine — e.g., login, reports, alerts.)",
    field: "project.features",
    type: "list",
    mode: "ai_assist",
    help: "Separate each feature by a comma. Example: user login, dashboard, reports, email notifications, file uploads",
    acknowledgements: [
      "Great list — noted.",
      "Awesome, captured those.",
      "Perfect — got those down.",
    ],
    confirmationTemplate: "I’ve noted these features: {value}",
  },
  {
    id: "integrations",
    question:
      "Any integrations needed? (AWS/GCP/Azure, ERP, billing, SSO, etc.) If none, type 'none'.",
    field: "project.integrations",
    type: "text",
    mode: "ai_assist",
    help: "Example: AWS CUR, Slack alerts, Email reports, Stripe payments",
    acknowledgements: ["Got it.", "Nice — captured.", "Understood."],
    confirmationTemplate: "Integrations noted: {value}",
  },
  {
    id: "timeline",
    question:
      "What’s your expected timeline/go-live date? (e.g., 4 weeks, March 15)",
    field: "constraints.timeline",
    type: "text",
    mode: "strict",
    help: "Example: 6 weeks, Q2 2026, March 15, 2026, ASAP, 3 months",
    validationPolicy: { kind: "timeline" },
    acknowledgements: ["Great — thanks.", "Understood.", "Perfect."],
  },
  {
    id: "budget",
    question:
      "What’s your budget range? (e.g., <5L, 5–15L, 15–30L, 30L+). If unknown, type 'not sure'.",
    field: "constraints.budget",
    type: "text",
    mode: "strict",
    help: "Estimate: <5L, 5–15L, 15–30L, 30–50L, 50L+, or 'not sure'",
    validationPolicy: { kind: "budget_or_not_sure" },
    acknowledgements: ["Perfect, saved.", "Thanks — noted.", "Got it."],
  },
  {
    id: "review",
    type: "review",
    mode: "review",
    field: null,
    question:
      "Here’s a quick recap. Type `summary` to review, `confirm` to finalize, or `back` to edit the last answer.",
    help: "Commands: summary / confirm / back / restart",
  },
  {
    id: "done",
    question:
      "✅ Thanks! I’ve captured everything. Type 'confirm' to finalize, 'summary' to review, or 'restart' to start over.",
    field: null,
    type: "done",
    mode: "strict",
    help: "Commands: confirm / summary / restart",
  },
];
