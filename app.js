const screens = {
  landing: { title: "Landing page", file: "1-contributor-landing-page-0c423b83.html" },
  login: { title: "Sign up / Login", file: "2-login-39f8c7c5.html" },
  "email-verify": { title: "Email verification", file: "4-email-verification-step-1-of-3-aa8a0ce6.html" },
  "onboarding-personal": { title: "Tell us about yourself", file: "3-contributor-onboarding-personal-details-dfb001fc.html" },
  "onboarding-language": { title: "Language profile", file: "3-contributor-onboarding-language-linguistic-profile-6a89ea0a.html" },
  "onboarding-assessment": { title: "Assessment selection", file: "3-contributor-onboarding-step-3-of-3-assessment-selection-358aad30.html" },
  dashboard: { title: "Contributor dashboard", file: "7-contributor-dashboard-55cd5882.html" },
  profile: { title: "Profile overview", file: "profile-overview-534974e9.html" },
  "personal-info": { title: "Personal information", file: "personal-information-02d039f5.html" },
  languages: { title: "Languages and skills", file: "languages-skills-95e400ba.html" },
  verification: { title: "Verification and documents", file: "verification-documents-26fff4f8.html" },
  settings: { title: "Account settings", file: "account-settings-74d3dfc0.html" },
  "assessment-center": { title: "A1 Assessment center", file: "11-assessment-center-streamlined-optimized-39c6c8e9.html" },
  "assessment-details": { title: "A2 Assessment details", file: "11b-assessment-details-hindi-speech-transcription-qualification-3e3cf8ba.html" },
  readiness: { title: "A3 Readiness check", file: "assessment-readiness-check-hindi-speech-transcription-qualification-eb07bd9b.html" },
  instructions: { title: "A4 Instructions and practice", file: "11d-assessment-instructions-practice-hindi-speech-transcription-qualification-4ecddef9.html" },
  "assessment-workspace": { title: "A5 Assessment workspace", file: "10-assessment-workspace-hindi-speech-transcription-qualification-94ac318a.html" },
  "review-submit": { title: "A6 Review and submit", file: "review-submit-assessment-hindi-speech-transcription-qualification-0731b136.html" },
  evaluation: { title: "A7 Evaluation status", file: "assessment-submission-confirmation-evaluation-status-hindi-speech-transcription-ca751c87.html" },
  results: { title: "A8 Results and qualification", file: "13-assessment-results-qualification-scorecard-hindi-speech-transcription-9c292290.html" },
  improve: { title: "A9 Improvement, retake and appeal", file: "improve-your-skills-next-steps-hindi-speech-transcription-qualification-72c10f3c.html" },
  opportunities: { title: "Project opportunities", file: "14-project-opportunities-svara-af0d4456.html" },
  "project-details": { title: "Project details", file: "15-project-details-contributor-onboarding-svara-3aece216.html" },
  training: { title: "Project training", file: "16-project-training-modules-svara-bb385dc4.html" },
  certification: { title: "Project certification and assessment", file: "17-project-certification-assessment-svara-7972cd52.html" },
  "task-queue": { title: "Task dashboard", file: "18-production-task-queue-svara-4cf9cd18.html" },
  annotation: { title: "Annotation workspace", file: "19-annotation-workspace-svara-c50d3e06.html" },
  submission: { title: "Submission details and quality audit", file: "20-submission-details-quality-audit-svara-8b44c5b5.html" },
  quality: { title: "Quality and performance analytics", file: "21-quality-performance-analytics-svara-fbf53798.html" },
  earnings: { title: "Earnings and payout history", file: "22-earnings-payout-history-svara-3378199c.html" },
  support: { title: "Support and appeals", file: "23-support-appeals-svara-344f94bf.html" },
};

const flows = [
  {
    id: "first-time",
    title: "1. First-time sign-up",
    summary: "A new contributor joins and reaches assessment selection.",
    steps: [
      ["landing", "Landing page"],
      ["login", "Sign up"],
      ["email-verify", "Email verification"],
      ["onboarding-personal", "Tell us about yourself"],
      ["onboarding-language", "Language profile"],
      ["onboarding-assessment", "Assessment selection"],
    ],
  },
  {
    id: "login-profile",
    title: "2. Login and profile",
    summary: "A returning contributor signs in and edits profile settings.",
    steps: [
      ["landing", "Landing page"],
      ["login", "Sign up / Login"],
      ["dashboard", "Contributor dashboard"],
      ["profile", "Profile overview"],
      ["personal-info", "Personal information"],
      ["languages", "Languages and skills"],
      ["verification", "Verification and documents"],
      ["settings", "Account settings"],
    ],
  },
  {
    id: "assessment",
    title: "3. Assessment",
    summary: "Platform assessment screens A1 through A9.",
    steps: [
      ["assessment-center", "A1 Assessment center"],
      ["assessment-details", "A2 Assessment details"],
      ["readiness", "A3 Readiness check"],
      ["instructions", "A4 Instructions and practice"],
      ["assessment-workspace", "A5 Assessment workspace"],
      ["review-submit", "A6 Review and submit"],
      ["evaluation", "A7 Evaluation status"],
      ["results", "A8 Results and qualification"],
      ["improve", "A9 Improvement, retake and appeal"],
    ],
  },
  {
    id: "project",
    title: "4. Project",
    summary: "From an opportunity through project certification.",
    steps: [
      ["opportunities", "Project opportunities"],
      ["project-details", "Project details"],
      ["training", "Project training"],
      ["certification", "Project certification and assessment"],
    ],
  },
  {
    id: "task",
    title: "5. Task",
    summary: "From the task dashboard through support and appeals.",
    steps: [
      ["task-queue", "Task dashboard"],
      ["annotation", "Annotation workspace"],
      ["submission", "Submission details and quality audit"],
      ["quality", "Quality and performance analytics"],
      ["earnings", "Earnings and payout history"],
      ["support", "Support and appeals"],
    ],
  },
];

const archify = [
  { id: "application", title: "Whole application", summary: "How the five journeys connect.", file: ".archify/workflow-svara-application-20261107-115430/svara-application.html" },
  { id: "first-time", title: "First-time sign-up", summary: "Landing through assessment selection.", file: ".archify/workflow-first-time-signup-20261107-114140/first-time-signup.html" },
  { id: "login-profile", title: "Login and profile", summary: "Sign in, then the profile icon.", file: ".archify/workflow-login-profile-20261107-114550/login-profile.html" },
  { id: "assessment", title: "Assessment", summary: "A1 through A9.", file: ".archify/workflow-assessment-20261107-114902/assessment.html" },
  { id: "project", title: "Project", summary: "Opportunity through certification.", file: ".archify/workflow-project-20261107-114948/project.html" },
  { id: "task", title: "Task", summary: "Task dashboard through support.", file: ".archify/workflow-task-20261107-115205/task.html" },
];

const docs = [
  { id: "readme", title: "README", summary: "What this package contains.", file: "README.md" },
  { id: "decisions", title: "Product decisions", summary: "Decision register and trade-offs.", file: "Svara_Product_Decision_Log.md" },
  { id: "hld", title: "High-level design", summary: "Journeys, architecture, and quality strategy.", file: "Svara_HLD.md" },
  { id: "lld", title: "Low-level design", summary: "Data, APIs, workflows, and tests.", file: "Svara_LLD.md" },
];

const docFiles = {
  "README.md": "readme",
  "README_v2_1.md": "readme",
  "Svara_HLD.md": "hld",
  "Svara_HLD_v2_1.md": "hld",
  "Svara_LLD.md": "lld",
  "Svara_LLD_v2_1.md": "lld",
  "Svara_Product_Decision_Log.md": "decisions",
  "Svara_Product_Decision_Log_v2_1.md": "decisions",
};

const links = [
  { match: /verify email/, to: "email-verify" },
  { from: "email-verify", match: /help/, to: "support", flow: "task" },
  { from: "onboarding-personal", match: /proceed|continue|save/, to: "onboarding-language" },
  { from: "onboarding-language", match: /continue to assessment/, to: "onboarding-assessment" },
  { from: "onboarding-assessment", match: /start assessment/, to: "assessment-details", flow: "assessment" },
  { from: "dashboard", match: /browse skill assessments/, to: "assessment-center", flow: "assessment" },
  { from: "dashboard", match: /accept invitation|^review$/, to: "project-details", flow: "project" },
  { from: "assessment-center", match: /take next|resume assessment|start assessment|view details/, to: "assessment-details" },
  { from: "assessment-center", match: /retake/, to: "improve" },
  { from: "assessment-details", match: /readiness/, to: "readiness" },
  { from: "assessment-details", match: /assessment center/, to: "assessment-center" },
  { from: "readiness", match: /continue to instructions/, to: "instructions" },
  { from: "readiness", match: /assessment details/, to: "assessment-details" },
  { from: "readiness", match: /live chat|support/, to: "support", flow: "task" },
  { from: "instructions", match: /start official assessment/, to: "assessment-workspace" },
  { from: "assessment-workspace", match: /review & submit|review and submit/, to: "review-submit" },
  { from: "review-submit", match: /confirm final submission|submit assessment/, to: "evaluation" },
  { from: "review-submit", match: /return to workspace/, to: "assessment-workspace" },
  { from: "evaluation", match: /assessment center/, to: "assessment-center" },
  { from: "evaluation", match: /contributor dashboard/, to: "dashboard", flow: "login-profile" },
  { from: "evaluation", match: /support|report a submission/, to: "support", flow: "task" },
  { from: "results", match: /eligible projects/, to: "opportunities", flow: "project" },
  { from: "results", match: /contributor profile/, to: "profile", flow: "login-profile" },
  { from: "results", match: /start learning/, to: "training", flow: "project" },
  { from: "results", match: /inquiry|clarification/, to: "support", flow: "task" },
  { from: "improve", match: /formal appeal/, to: "support", flow: "task" },
  { from: "improve", match: /evaluation|view details/, to: "results" },
  { from: "opportunities", match: /project details/, to: "project-details" },
  { from: "project-details", match: /continue training|start training/, to: "training" },
  { from: "training", match: /mark complete/, to: "certification" },
  { from: "certification", match: /submit certification/, to: "task-queue", flow: "task" },
  { from: "task-queue", match: /claim task|open claim/, to: "annotation" },
  { from: "annotation", match: /validate & submit|validate and submit/, to: "submission" },
  { from: "submission", match: /workspace/, to: "annotation" },
  { from: "submission", match: /dispute|clarify/, to: "support" },
  { from: "quality", match: /audit|dispute|appeal/, to: "support" },
  { from: "quality", match: /enroll in exam/, to: "certification", flow: "project" },
  { from: "earnings", match: /payout settings/, to: "settings", flow: "login-profile" },
  { from: "profile", match: /personal information|fix now|resolve verification|complete verification/, to: "personal-info" },
  { from: "profile", match: /manage languages|languages & skills/, to: "languages" },
  { from: "profile", match: /take assessments|start assessment/, to: "assessment-center", flow: "assessment" },
  { from: "profile", match: /performance stats/, to: "quality", flow: "task" },
  { from: "personal-info", match: /^languages & skills$/, to: "languages" },
  { from: "languages", match: /take assessment/, to: "assessment-details", flow: "assessment" },
  { from: "verification", match: /payout|earnings/, to: "earnings", flow: "task" },
  { from: "verification", match: /support/, to: "support", flow: "task" },
  { from: "settings", match: /payout/, to: "earnings", flow: "task" },
  { match: /^dashboard$/, to: "dashboard", flow: "login-profile" },
  { match: /^opportunities$/, to: "opportunities", flow: "project" },
  { match: /^projects$/, to: "opportunities", flow: "project" },
  { match: /^my tasks|^tasks$|tasks queue/, to: "task-queue", flow: "task" },
  { match: /^assessments$|assessments & training/, to: "assessment-center", flow: "assessment" },
  { match: /^earnings$/, to: "earnings", flow: "task" },
  { match: /^performance$/, to: "quality", flow: "task" },
  { match: /^support$/, to: "support", flow: "task" },
  { match: /^overview$|profile overview/, to: "profile", flow: "login-profile" },
  { match: /^personal information$/, to: "personal-info", flow: "login-profile" },
  { match: /^languages & skills$/, to: "languages", flow: "login-profile" },
  { match: /^verification & documents$/, to: "verification", flow: "login-profile" },
  { match: /^account settings$/, to: "settings", flow: "login-profile" },
  { match: /^sign out/, to: "login", flow: "login-profile" },
  { match: /help & support|help and support/, to: "support", flow: "task" },
];

const hashRoutes = {
  "#dashboard": ["dashboard", "login-profile"],
  "#opportunities": ["opportunities", "project"],
  "#my-tasks": ["task-queue", "task"],
  "#profile-overview": ["profile", "login-profile"],
  "#personal-info": ["personal-info", "login-profile"],
  "#languages-skills": ["languages", "login-profile"],
  "#verification-docs": ["verification", "login-profile"],
  "#account-settings": ["settings", "login-profile"],
};

const nav = document.querySelector("#nav");
const frame = document.querySelector("#screen");
const article = document.querySelector("#document");
const titleEl = document.querySelector("#title");
const pathEl = document.querySelector("#path");
const nextBtn = document.querySelector("#next");
const backBtn = document.querySelector("#back");
const zoom = document.querySelector("#zoom");
const zoomControl = zoom.closest(".zoom");
const toast = document.querySelector("#toast");

let view = { kind: "wireframe", flow: "first-time", screen: "landing" };
let currentFlow = "first-time";
let currentScreen = "landing";
let shownSrc = "";
let docToken = 0;
let toastTimer = 0;

function archifyById(id) {
  return archify.find((item) => item.id === id);
}

function docById(id) {
  return docs.find((item) => item.id === id);
}

function flowById(id) {
  return flows.find((flow) => flow.id === id);
}

function stepIndex(flow, screenId) {
  return flow.steps.findIndex((step) => step[0] === screenId);
}

function flowFor(screenId, preferred) {
  if (preferred) {
    const flow = flowById(preferred);
    if (flow && stepIndex(flow, screenId) >= 0) return preferred;
  }
  if (stepIndex(flowById(currentFlow), screenId) >= 0) return currentFlow;
  const match = flows.find((flow) => stepIndex(flow, screenId) >= 0);
  return match ? match.id : currentFlow;
}

function labelOf(element) {
  return (element.innerText || element.getAttribute("aria-label") || "")
    .replace(/\b[a-z]+_[a-z0-9_]*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function destination(screenId, label, element) {
  if (element.id === "profileDropdownBtn") return { screen: "profile", flow: "login-profile" };
  const href = (element.getAttribute("href") || "").split("?")[0];
  if (hashRoutes[href]) {
    const [screen, flow] = hashRoutes[href];
    return { screen, flow };
  }
  if (screenId === "landing" && /become a contributor|^sign in$/.test(label)) {
    return { screen: "login", flow: currentFlow === "login-profile" ? "login-profile" : "first-time" };
  }
  if (screenId === "login" && /^log in/.test(label)) return { screen: "dashboard", flow: "login-profile" };
  if (screenId === "login" && /forgot password/.test(label)) return null;
  if (screenId === "login" && /become a contributor/.test(label)) return { screen: "email-verify", flow: "first-time" };
  if (!label || label.length > 90) return null;
  for (const rule of links) {
    if (rule.from && rule.from !== screenId) continue;
    if (rule.match.test(label)) return { screen: rule.to, flow: rule.flow };
  }
  return null;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

function itemButton(kind, id, title, summary, selected) {
  return `<button class="flow${selected ? " active" : ""}" data-kind="${kind}" data-id="${id}">
    <strong>${title}</strong><span>${summary}</span>
  </button>`;
}

function section(label, active, body) {
  return `<section class="nav-section${active ? " active" : ""}"><p class="section-label">${label}</p>${body}</section>`;
}

function renderNav() {
  const wireframeOpen = view.kind === "wireframe";
  const wireBody = flows.map((item) => {
    const selected = wireframeOpen && item.id === currentFlow;
    const steps = selected ? `<div class="steps">${item.steps.map(([id, label], stepNumber) => `
      <button class="step${id === currentScreen ? " active" : ""}" data-kind="wireframe" data-flow="${item.id}" data-screen="${id}">
        ${stepNumber + 1}. ${label}
      </button>`).join("")}</div>
      ${item.id === "first-time" || item.id === "login-profile" ? `<p class="note">Sign up and login are the same screen. ${item.id === "first-time" ? "Continue onward to email verification." : "Log in to open the contributor dashboard, then use the profile icon."}</p>` : ""}` : "";
    return `<button class="flow${selected ? " active" : ""}" data-kind="wireframe" data-flow="${item.id}" data-screen="${item.steps[0][0]}">
      <strong>${item.title}</strong><span>${item.summary}</span>
    </button>${steps}`;
  }).join("");
  const archBody = archify.map((item) => itemButton("archify", item.id, item.title, item.summary, view.kind === "archify" && view.id === item.id)).join("");
  const docSections = docs.map((item) => section(
    item.title,
    view.kind === "doc" && view.id === item.id,
    itemButton("doc", item.id, item.title, item.summary, view.kind === "doc" && view.id === item.id),
  )).join("");
  nav.innerHTML = [
    docSections,
    section("Workflows", view.kind === "archify", archBody),
    section("Wireframe workflows", wireframeOpen, wireBody),
  ].join("");

  const next = neighbor(1);
  const previous = neighbor(-1);
  nextBtn.disabled = !next;
  backBtn.disabled = !previous;
  nextBtn.textContent = next ? `Next: ${next.label}` : "End";
  if (view.kind === "wireframe") {
    const flow = flowById(currentFlow);
    const index = stepIndex(flow, currentScreen);
    titleEl.textContent = flow.steps[index][1];
    pathEl.textContent = `${flow.title} · step ${index + 1} of ${flow.steps.length}`;
  } else if (view.kind === "archify") {
    const item = archifyById(view.id);
    titleEl.textContent = item.title;
    pathEl.textContent = `Workflows · ${item.summary}`;
  } else {
    const item = docById(view.id);
    titleEl.textContent = item.title;
    pathEl.textContent = item.file;
  }
}

function outline() {
  return [
    ...docs.map((item) => ({ kind: "doc", id: item.id, label: item.title })),
    ...archify.map((item) => ({ kind: "archify", id: item.id, label: item.title })),
    ...flows.flatMap((flow) => flow.steps.map(([screen, label]) => ({
      kind: "wireframe",
      flow: flow.id,
      screen,
      label,
    }))),
  ];
}

function neighbor(direction) {
  const items = outline();
  const index = items.findIndex((item) => {
    if (item.kind !== view.kind) return false;
    if (item.kind === "wireframe") return item.flow === currentFlow && item.screen === currentScreen;
    return item.id === view.id;
  });
  return items[index + direction] || null;
}

function showFrame(src) {
  article.hidden = true;
  frame.hidden = false;
  zoomControl.hidden = view.kind !== "wireframe";
  if (shownSrc === src) return;
  shownSrc = src;
  frame.src = src;
}

async function loadDoc(id) {
  const item = docById(id);
  const token = ++docToken;
  article.hidden = false;
  frame.hidden = true;
  zoomControl.hidden = true;
  article.innerHTML = `<p class="doc-status">Loading ${item.title}…</p>`;
  article.scrollTop = 0;
  try {
    const response = await fetch(item.file);
    if (!response.ok) throw new Error(`Could not load ${item.file}`);
    const markdown = await response.text();
    if (token !== docToken || view.kind !== "doc" || view.id !== id) return;
    article.innerHTML = marked.parse(markdown);
    article.querySelectorAll("a").forEach((link) => {
      const name = (link.getAttribute("href") || "").split("/").pop().split("#")[0];
      const docId = docFiles[name];
      if (!docId) return;
      link.setAttribute("href", `#doc/${docId}`);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openView({ kind: "doc", id: docId });
      });
    });
  } catch (error) {
    if (token !== docToken) return;
    article.innerHTML = `<p class="doc-status">${error.message}</p>`;
  }
}

function renderStage() {
  if (view.kind === "doc") {
    loadDoc(view.id);
    return;
  }
  docToken += 1;
  if (view.kind === "archify") showFrame(archifyById(view.id).file);
  else showFrame(`svara-screens/${screens[view.screen].file}`);
}

function openView(next, options = {}) {
  view = next;
  if (next.kind === "wireframe") {
    currentFlow = flowFor(next.screen, next.flow);
    currentScreen = next.screen;
    view = { kind: "wireframe", flow: currentFlow, screen: currentScreen };
  }
  const url = view.kind === "archify"
    ? `#archify/${view.id}`
    : view.kind === "doc"
      ? `#doc/${view.id}`
      : `#${view.flow}/${view.screen}`;
  if (options.replace) history.replaceState(view, "", url);
  else if (location.hash !== url) history.pushState(view, "", url);
  renderStage();
  renderNav();
  const active = nav.querySelector(".step.active, .flow.active");
  if (active) active.scrollIntoView({ block: "nearest" });
}

function go(screenId, flowId, options = {}) {
  if (!screens[screenId]) return;
  openView({ kind: "wireframe", flow: flowId, screen: screenId }, options);
}

function wireFrame() {
  const doc = frame.contentDocument;
  if (!doc) return;
  const style = doc.createElement("style");
  style.textContent = "html,body{overflow:auto !important;height:auto !important;min-height:100% !important;width:auto !important;max-width:none !important;position:static !important;}";
  (doc.head || doc.documentElement).appendChild(style);
  doc.documentElement.style.zoom = zoom.value;
  doc.querySelectorAll("a, button, [role='button']").forEach((element) => {
    const label = labelOf(element);
    const target = destination(currentScreen, label, element);
    if (!target || (target.screen === currentScreen && (!target.flow || target.flow === currentFlow))) return;
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const flow = flowById(target.flow || flowFor(target.screen));
      const step = flow.steps.find((item) => item[0] === target.screen);
      showToast(step ? step[1] : screens[target.screen].title);
      go(target.screen, target.flow);
    }, true);
  });
}

nav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-kind]");
  if (!button) return;
  if (button.dataset.kind === "wireframe") go(button.dataset.screen, button.dataset.flow);
  else openView({ kind: button.dataset.kind, id: button.dataset.id });
});

backBtn.addEventListener("click", () => {
  const previous = neighbor(-1);
  if (!previous) return;
  if (previous.kind) openView(previous);
  else go(previous.screen, previous.flow);
});

nextBtn.addEventListener("click", () => {
  const next = neighbor(1);
  if (!next) return;
  if (next.kind) openView(next);
  else go(next.screen, next.flow);
});

zoom.addEventListener("input", () => {
  const doc = frame.contentDocument;
  if (doc) doc.documentElement.style.zoom = zoom.value;
});

frame.addEventListener("load", () => {
  if (view.kind === "wireframe") wireFrame();
});

window.addEventListener("popstate", () => {
  const parsed = parseHash(location.hash);
  view = parsed;
  if (parsed.kind === "wireframe") {
    currentFlow = parsed.flow;
    currentScreen = parsed.screen;
  }
  renderStage();
  renderNav();
});

function parseHash(hash) {
  const [kind, id, extra] = hash.replace(/^#/, "").split("/").map(decodeURIComponent);
  if (kind === "archify" && archifyById(id)) return { kind: "archify", id };
  if (kind === "doc" && docById(id)) return { kind: "doc", id };
  const flowId = kind;
  const screenId = id;
  if (!extra && flowById(flowId) && screens[screenId] && stepIndex(flowById(flowId), screenId) >= 0) {
    return { kind: "wireframe", flow: flowId, screen: screenId };
  }
  return { kind: "doc", id: "readme" };
}

const initial = parseHash(location.hash);
if (initial.kind === "wireframe") go(initial.screen, initial.flow, { replace: true });
else openView(initial, { replace: true });
