# Svara — Product Decision Log

**Document version:** 2.1  
**Date:** 7 November 2026   
**Companion documents:** `Svara_HLD.md`, `Svara_LLD.md`  
**Audience:** Product leadership, engineering, data operations, quality, finance, security and client-facing teams

---

## 0. Purpose

This document records the product decisions that shape Svara's contributor lifecycle and operating model. It is intended to make product thinking visible and reviewable. The goal is not to justify technology choices in isolation; it is to show how the platform balances data quality, contributor trust, client requirements, operating cost, delivery speed and future scale.

Each entry follows:

- **Problem:** The user, business or operational problem being addressed.
- **Decision:** The product or system behavior selected or recommended.
- **Trade-off:** What becomes more expensive, slower, more complex or less flexible because of the decision.
- **Business impact:** The expected effect on data quality, cost, risk, trust, conversion, delivery or scalability.

## 0.1 Decision status

| Status | Meaning |
|---|---|
| Confirmed direction | Explicitly established in the product journey and screen discussions. Implementation details may still require validation. |
| Recommended | A product/architecture recommendation proposed to make the workflow reliable and coherent. Accept or amend through review. |
| Open approval | Requires a decision from product, operations, legal, finance, security or a client before production. |
| Deferred | Deliberately not required for the initial contributor-focused release. |

A screen mockup is not evidence that a feature, provider integration, payout rail, SLA or security certification is already implemented. Numerical values shown in mockups (scores, rates, durations, response times, member counts or payout schedules) are illustrative until confirmed in configuration or contract.

---

## 1. Product strategy and scope

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-01 | Product focus | A broad multi-sided platform can become too large to validate before proving contributor supply and output quality. | Prioritize the contributor lifecycle and the operational capabilities required to qualify, train, allocate, review and pay contributors. Keep client and operations capabilities sufficient to run the pilot. | Some advanced client self-service and workforce automation are delayed. | Faster validation of whether Svara can reliably produce high-quality speech/text data with a managed contributor cohort. | Confirmed direction |
| PD-02 | MVP scale | Architecture can be overbuilt for an early cohort. | Use approximately 100 contributors as the initial planning assumption and validate load/throughput with realistic pilot traffic. | The design does not optimize prematurely for very large concurrent workloads. | Lower delivery and operational cost while preserving clear boundaries for later scaling. | Confirmed direction; capacity assumption to validate |
| PD-03 | Product differentiation | A basic transcription interface is easy to replicate and does not guarantee dataset quality. | Differentiate through verified capability, project-specific preparation, schema-driven annotation, layered QA, human review, traceability and contributor development. | More workflow and governance work than a simple task marketplace. | Stronger client confidence and more defensible quality outcomes. | Confirmed direction |
| PD-04 | Scope control | Supporting every modality and workflow immediately dilutes focus. | Begin with speech/audio and text annotation; add modalities only after the initial workflows are proven. | Some potential client use cases are deferred. | Lower implementation complexity and better validation of the core production loop. | Confirmed direction |

## 2. Acquisition, onboarding and contributor profile

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-05 | Entry and authentication | Asking a new contributor to choose among internal roles creates unnecessary role confusion. | Use a contributor-first sign-up path. Keep client/enterprise registration separate. Resolve role and workspace context after authentication where multiple roles exist. | Role selection is not exposed as a prominent sign-in step for the contributor-first experience. | Lower onboarding friction and clearer acquisition funnel. | Confirmed direction |
| PD-06 | Signup flow | Account creation, personal profiling and capability declaration are different tasks. | Sequence: sign-up → OTP verification → personal information → language and linguistic profile → entry to assessment center/required assessment. | More steps than a single long registration form. | Better completion rates through progressive disclosure and clearer data purpose. | Confirmed direction |
| PD-07 | OTP versus identity | OTP proves access to an email/phone channel, not government identity or language skill. | Model contact verification, identity/KYC verification, profile review and skill qualification as separate controls and states. | More states and operational handling. | Prevents false trust claims and avoids granting eligibility from an OTP event alone. | Recommended |
| PD-08 | Data minimization | Over-collecting demographic information creates privacy risk and may introduce biased matching. | Collect only information needed for account operation, jurisdiction, payment, legal compliance or a defined project requirement. Do not require religion or gender for language qualification. Education and experience should be optional contextual information, not proxies for proficiency. | Less demographic data for descriptive reporting. | Higher trust, less friction, reduced privacy exposure and fairer matching. | Confirmed direction |
| PD-09 | Profile structure | Personal details and language/task preferences are conceptually different and one long form is difficult to complete. | Split onboarding into a personal-information step and a language/linguistic profile step. Profile pages then expose overview, personal information, languages & skills, verification & documents, and account settings. | More navigation and a need for consistent profile completion logic. | Clearer mental model and easier future profile maintenance. | Confirmed direction |
| PD-10 | Language capability | A single language label or self-declared “native” badge does not establish ability across annotation tasks. | Store each language/dialect separately, with self-reported proficiency dimensions, task interests and independently verified skill evidence. Distinguish speaking/listening/reading/writing where relevant from task-specific skills such as transcription, diarization, NER and evaluation. | More detailed profile and assessment model. | More reliable project matching and better evidence of actual capability. | Confirmed direction |
| PD-11 | Education and experience | Education can provide context but does not prove fluency or annotation quality. | Keep education, field of study and professional experience optional unless a particular project has a justified requirement. Never use them as substitutes for language/task assessment. | Less convenient for coarse profile ranking. | Reduces proxy bias and keeps project selection grounded in demonstrated skill. | Recommended |
| PD-12 | Profile completion | Users may be blocked by optional profile fields. | Calculate profile completeness from mandatory fields only. Show verification, qualification and readiness separately from profile completion. | More explicit status indicators. | Prevents misleading completion percentages and avoids unnecessary onboarding abandonment. | Recommended |

## 3. Platform assessment, integrity and qualification

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-13 | Assessment design | MCQs alone do not demonstrate practical transcription or annotation ability. | Use practical audio/text tasks as the primary evidence. Use MCQ, scenario reasoning and guideline interpretation as supporting evidence. | Practical assessments take longer to author, evaluate and maintain. | Better prediction of production capability and fewer low-quality allocations. | Confirmed direction |
| PD-14 | Assessment content leakage | Contributors can share answers or use external tools; a fixed test is vulnerable to memorization. | Use versioned item banks, randomized/unseen clips, controlled task variants, exposure tracking and periodic item review/retirement. Design multiple equivalent forms. | More authoring effort and calibration overhead. | Reduces answer leakage and makes repeat attempts more meaningful. | Recommended |
| PD-15 | Time limits | A timer alone does not prevent external assistance and can unfairly penalize slow but capable users. | Use time limits only where task design justifies them. Start the official timer on server-confirmed attempt start; provide clear rules and configured accommodation paths. | More policy configuration and time-state handling. | Better balance of assessment validity, fairness and operational control. | Recommended |
| PD-16 | Proctoring | Continuous video creates privacy cost and does not guarantee honesty. | Use layered, risk-based integrity controls: randomized items, disclosed browser/session telemetry, appropriate technical checks, gold items, anomaly signals and human review. Use video/live proctoring only for justified high-assurance assessments with advance disclosure, consent, access controls and retention rules. | Some fraud signals require human investigation; high-assurance tests cost more to operate. | Reduces cheating while limiting invasive monitoring and false accusations. | Recommended |
| PD-17 | Integrity decisions | A tab switch, network event or model flag can have benign explanations. | Telemetry and AI signals trigger proportionate review, not automatic qualification failure or punitive action. Maintain an evidence trail and a contributor appeal path. | More human review and case-management cost. | Improves fairness, reduces false positives and protects contributor trust. | Recommended |
| PD-18 | Practice versus official attempt | Contributors need feedback while learning, but practice answers should not consume official attempts or reveal certification keys. | Keep unscored practice separate from official attempts. Use practice feedback for learning; keep certification content controlled and versioned. | Requires separate progress and attempt models. | Better learning while preserving assessment integrity. | Confirmed direction |
| PD-19 | Review and submission | Contributors can accidentally submit incomplete or unsaved answers. | Provide a dedicated pre-submit review with answered, unanswered, flagged and synchronization states; explain incomplete-task policy; require explicit final confirmation. | Additional UI and server validation. | Fewer accidental submissions and fewer support cases. | Confirmed direction |
| PD-20 | Assessment result | A score alone does not explain capability or what happens next. | Present final outcome, competency breakdown, reviewer feedback, qualification scope, credential and next steps. Keep technical metrics expandable and explain them. | More effort to curate contributor-facing feedback. | Makes qualification actionable and improves confidence in Svara's credentials. | Confirmed direction |
| PD-21 | Retake and appeal | Retakes and appeals solve different problems. | Separate skill improvement, retake eligibility/cooldown and formal appeal. Preserve original attempts/results; appeals do not automatically reset attempts or cancel retakes. | More policy states and workflow complexity. | Fairer reassessment and a defensible audit trail. | Confirmed direction |

## 4. Project discovery, invitation and onboarding

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-22 | Project discovery | A list of invitations with internal matching metrics is difficult to evaluate. | Project Opportunities focuses on task type, language/dialect, requirements, compensation unit, commitment, expiry and why the contributor matches. Internal match weights remain hidden. | Less visible algorithmic detail. | Faster decisions, greater transparency and reduced confusion. | Confirmed direction |
| PD-23 | Acceptance action | Accepting from a dense list card can create a commitment before the user understands the project. | Project Details is the canonical invitation acceptance point. The opportunity card navigates to details; decline may remain available from the list if policy permits. | One extra navigation step. | More informed acceptance and fewer withdrawals/disputes. | Confirmed direction |
| PD-24 | Pre-acceptance preview | Contributors need enough information to decide, but clients may have restricted materials. | Show public-safe project overview, compensation, requirements, sample work and a guideline summary before acceptance. Unlock restricted mandatory training and confidential material only after acceptance and required agreement. | Requires content classification and access control. | Informed consent with protection of client materials. | Confirmed direction |
| PD-25 | Invitation acceptance versus activation | An accepted invitation is easily mistaken for immediate task access. | Model invitation, participation, training, project certification, ready-for-allocation and active project as distinct states. | More explicit status and transition logic. | Prevents unauthorized or premature production work and unrealistic contributor expectations. | Confirmed direction |
| PD-26 | Training sequence | Training everyone before they accept a project consumes time and may expose restricted client content. | General platform learning can be available earlier; mandatory project-specific training unlocks after invitation acceptance and any required agreement. | Some contributors may accept and then abandon onboarding. | Better use of training capacity and stronger protection of project-specific information. | Confirmed direction |
| PD-27 | Project certification | A contributor may have platform-level Hindi transcription skill but still need to learn a client's annotation schema. | Use project certification tied to the specific guideline/schema version, separate from platform qualification. Reuse assessment infrastructure, but keep project-scoped result records. | Contributors may complete additional assessments for different projects. | Higher consistency with client-specific requirements and more defensible task access. | Confirmed direction |
| PD-28 | Allocation | Passing certification does not guarantee current work availability. | Show `Ready for Allocation` when qualified but not assigned. Show `Active` and `Open Project Workspace` only after authorized allocation/activation. | Contributors may wait after completing onboarding. | Prevents false work/earning promises and gives operations capacity control. | Confirmed direction |

## 5. Production tasks and annotation quality

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-29 | Task discovery | Contributors may see work they are not qualified or allowed to claim. | Apply hard eligibility filters server-side before showing claimable tasks: account state, relevant skill/certification, project membership, capacity and task state. Explain unmet requirements in the UI. | Fewer visible tasks and more eligibility checks. | Reduces invalid claims and protects client data quality. | Recommended |
| PD-30 | Task claiming | Two contributors may claim the same exclusive task concurrently. | Claim/reserve atomically in a database transaction with idempotency and server-side capacity checks. Explicitly model independent annotation slots when multiple annotators are required. | Transaction and concurrency complexity. | Prevents duplicate work and allocation disputes. | Recommended |
| PD-31 | Auto-claim | Automatic claims can surprise contributors or overrun declared availability. | Make auto-claim explicit opt-in with clear task, capacity and reservation preferences. Keep manual claim as the default until policy is validated. | Lower utilization than aggressive auto-allocation. | Greater contributor control and fewer abandoned reservations. | Recommended |
| PD-32 | Annotation workspace | Building one hardcoded UI per task type is costly and inconsistent. | Use a shared workspace shell with schema-driven task components for speech, diarization, timestamps, NER, classification and other supported types. | Requires schema versioning, renderer governance and compatibility tests. | Lower cost to add task types and consistent contributor experience. | Confirmed direction |
| PD-33 | Human versus AI annotation | AI suggestions can silently bias or overwrite contributor work. | Visually distinguish contributor-entered content, model suggestions and QA findings. AI must not silently overwrite the human answer; acceptance/rejection is explicit and recorded where enabled. | More UI and provenance metadata. | Preserves human accountability and improves dataset traceability. | Recommended |
| PD-34 | Draft reliability | Long annotation sessions and unstable networks can lose contributor work. | Use versioned autosave, server acknowledgement, local recovery buffer, conflict/version checks and safe retry. Show accurate saving/sync states. | More sync/conflict logic and storage writes. | Protects contributor effort and prevents incomplete/corrupt submissions. | Confirmed direction |
| PD-35 | Pre-submit QA | Contributors may submit structurally invalid annotations. | Run client-side guidance for usability and authoritative server-side schema validation before accepting final submission. Distinguish blocking errors from warnings. | Additional validation work and occasional friction. | Reduces avoidable reviewer load and malformed data. | Recommended |
| PD-36 | Submission immutability | Editing the original submission after review makes provenance unreliable. | Store immutable submission versions. Rework creates a new version linked to the previous version; reviewer corrections remain separate artifacts. | More records and storage. | Reproducible reviews, auditability and trustworthy client exports. | Confirmed direction |

## 6. Quality assurance, review and performance

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-37 | Layered QA | One validation method cannot detect every error. | Use schema checks, deterministic rules, gold tasks, AI/ASR comparison, sampling and human review as a configurable quality policy. | More orchestration and evaluation cost. | Better coverage of structural, linguistic and semantic defects. | Confirmed direction |
| PD-38 | ASR/LLM as reference | Model output can be wrong, especially on dialects, code-switching, low-resource audio and noisy speech. | Treat ASR/LLM results as advisory signals; compare to expert-verified references and route uncertain/conflicting cases to human review. | More human review than a fully automated pipeline. | Avoids rejecting valid dialectal annotations and protects client data quality. | Confirmed direction |
| PD-39 | Human review | Reviewers may be inconsistent or review work outside their expertise. | Assign reviewers using project scope/skill requirements, prohibit self-review, calibrate with gold examples and escalate disagreement to an adjudicator. | Reviewer training and throughput cost. | More consistent quality decisions and greater client confidence. | Recommended |
| PD-40 | Quality score | A single composite score hides skill-specific performance and can overstate precision. | Store component metrics scoped by language, task type and project with sample count, policy version, timestamp and uncertainty/confidence where available. | More detailed data model and analytics. | Enables better targeted training and fairer allocation. | Confirmed direction |
| PD-41 | Low sample performance | One or two bad tasks can create unstable rankings or unfair restrictions. | Define minimum sample evidence before high-impact quality interventions; use confidence-aware trends and human review. | Slower detection of genuine quality decline. | Reduces false penalties and improves allocation fairness. | Recommended |
| PD-42 | Rework | Generic rejection notes do not help contributors correct work efficiently. | Return exact segment/task references, issue category, explanation, applicable guideline version, deadline and permitted correction path. | Reviewers need to produce structured feedback. | Faster rework, fewer repeated errors and lower support volume. | Confirmed direction |
| PD-43 | Contributor appeal | Contributors need a fair route to dispute a decision. | Separate general support from formal appeals; link appeals to task/submission/assessment/transaction and support independent review where feasible. | Additional adjudication capacity and SLA management. | Increases trust and reduces unresolved disputes. | Confirmed direction |
| PD-44 | Quality interventions | Low quality can require coaching, increased sampling, retraining or access restrictions. | Use graduated interventions. Restriction/suspension requires documented evidence and authorized human action, except narrowly defined security safeguards. | Slower enforcement than fully automated suspension. | Protects quality while reducing wrongful exclusion. | Recommended |

## 7. Earnings, payout and support

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-45 | Earnings semantics | Estimated, submitted, approved and paid amounts can be confused. | Separate `ESTIMATED`, `PENDING_APPROVAL`, `APPROVED`, `PROCESSING`, `PAID`, `FAILED`, `ON_HOLD` and `REVERSED` states in an auditable ledger. | More detailed finance model and reconciliation. | Builds contributor trust and prevents overstated earnings. | Confirmed direction |
| PD-46 | Earning event | Creating earnings when a task is merely submitted can overstate liabilities. | Create approved earning entries only at the configured approval/earning event; retain estimates separately. Use idempotent business references to prevent duplicates. | Earnings may appear later than submission. | More accurate financial obligations and client cost accounting. | Recommended; trigger requires finance approval |
| PD-47 | Rate transparency | Rate per audio minute, per task, per span and per labor hour are not directly comparable. | Always show unit, base rate, bonus conditions, approval dependency and payout schedule; distinguish media duration from contributor labor time. | More detailed card and rate configuration. | Fewer compensation misunderstandings and disputes. | Confirmed direction |
| PD-48 | Payout delivery | A ledger entry does not prove a bank transfer completed. | Model payout separately from earnings; reconcile provider/bank confirmation, reference and failure reason before showing `PAID`. | Requires reconciliation and possibly provider integration. | Accurate payout status and auditable financial operations. | Recommended |
| PD-49 | Financial corrections | Editable balances are difficult to audit and can lead to unexplained deductions. | Use append-only ledger adjustments/reversals with reason, actor, source reference and audit event; no silent balance edits. | More accounting discipline. | Easier reconciliation, dispute resolution and financial controls. | Recommended |
| PD-50 | Support versus appeal | General help and formal challenges need different eligibility and review logic. | Use separate case types/workflows, with contextual links from task, submission, assessment, earnings and payout records. | More case categories and routing rules. | Faster triage and more appropriate resolution paths. | Confirmed direction |

## 8. Security, privacy, operations and architecture

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-51 | Tenant isolation | Shared contributor network and client projects create cross-tenant leakage risk. | Keep contributor identity/skill evidence separate from tenant-owned project data; enforce organization/project authorization on every resource access and use database defense in depth where practical. | More authorization and automated security tests. | Protects client confidentiality and enables safe shared-network operations. | Recommended |
| PD-52 | Document privacy | Identity and payout documents are more sensitive than ordinary profile data. | Store in private object storage, use short-lived authorized links, separate reviewer permissions and retention/deletion policy. | More storage access controls and operational handling. | Reduces exposure and supports compliance review. | Recommended |
| PD-53 | Guideline changes | Changing an annotation guideline can make old scores and submissions impossible to reproduce. | Version guideline, annotation schema, assessment rubric and quality policy. Every attempt/submission records exact versions used. | Version management and compatibility work. | Reproducible evaluations and reliable dataset provenance. | Confirmed direction |
| PD-54 | Architecture at MVP scale | Microservices add deployment, observability and distributed transaction overhead. | Use a modular monolith with explicit domain modules and separate async worker processes; extract services only with evidence of scaling/team needs. | Shared deployment and database remain coupling points. | Faster delivery and lower operating cost without abandoning domain boundaries. | Confirmed direction |
| PD-55 | Long-running processing | Audio processing, ASR, QA and exports can exceed synchronous request limits. | Execute long-running work in background queues; return job/status identifiers and make handlers retry-safe. | Queue and job observability are required. | Better API responsiveness and controlled processing cost. | Confirmed direction |
| PD-56 | Data storage | Large audio files and exports do not belong in relational rows. | Store binaries in private object storage; store metadata, object keys and checksums in PostgreSQL. | Requires signed access URLs and storage lifecycle management. | Efficient media handling and manageable database growth. | Confirmed direction |
| PD-57 | Financial/operational automation | Full automation before policy and volume are proven may amplify errors. | Start with a controlled, auditable manual-first payout and allocation process; automate selectively after reconciliation and exception handling are proven. | More manual operations in the pilot. | Reduces premature integration risk and supports learning before automation. | Confirmed direction from prior HLD baseline |
| PD-58 | Observability | A multi-step contributor task is difficult to debug if events cannot be correlated. | Use correlation IDs and audit events across claim, draft, submission, QA, review, earning and payout. Track queue age, failures and task conflicts. | Additional instrumentation and retention cost. | Faster incident resolution and better operational visibility. | Recommended |

---

## 9. Training quality, contributor screening and assessment validity

| ID | Domain | Problem | Decision | Trade-off | Business impact | Status |
|---|---|---|---|---|---|---|
| PD-59 | Training content quality | A completed lesson may be inaccurate, incomplete or ineffective. | Require explicit learning objectives, guideline/schema mapping, language/domain SME review, instructional/content QA, correct/incorrect examples, accessibility checks and versioned publication gates. | More content production and review time; content owners must maintain versions. | Reduces incorrect instruction, improves contributor readiness and protects client-specific annotation consistency. | Recommended |
| PD-60 | Training effectiveness | Lesson completion and practice score alone do not prove that training improves production. | Measure practice error change, post-training certification, first-pass production approval and recurring rework by training content version and cohort. | Requires evidence linkage and sufficient follow-up; causal claims remain limited in small cohorts. | Directs training investment toward modules that improve real output quality. | Recommended |
| PD-61 | Sample access | The same examples cannot safely serve public demos, training, secure certification and gold QA. | Classify content as public demo, project preview, project training, unscored practice, secure assessment, gold QA or production asset; enforce purpose- and scope-based access with exposure audit. | More content governance, access control and asset lifecycle management. | Enables informed previews and effective training while reducing leakage and protecting client material. | Recommended |
| PD-62 | Contributor screening | Self-reported language, profile completion or education does not prove task capability. | Use a staged funnel: contact verification, minimal profile, language/dialect declaration, low-cost diagnostic, practical task assessment, expert review where needed and scoped capability evidence. | More assessment and reviewer effort; potentially more onboarding steps. | Improves selection of capable contributors without relying on demographic proxies or premature rejection. | Recommended |
| PD-63 | Production gaming | Contributors may game task allocation, gold tasks, quality metrics, account identity or reviewer workflows after passing an assessment. | Extend the integrity threat model across account, assessment, sample access, task claim, production annotation, review and payout; use multiple evidence sources, audits and human adjudication. | Monitoring, investigation and independent review add operational cost. | Protects dataset integrity while reducing wrongful accusations and abuse. | Recommended |
| PD-64 | Production ramp | A strong assessment result may not predict consistent performance on real project data. | Use a controlled initial production ramp with appropriate sampling/review, then adjust task scope or review intensity only after sufficient scoped evidence. | Early throughput may be lower and review cost higher. | Limits quality risk while real-world capability is established. | Recommended |
| PD-65 | Accuracy improvement | Repeated annotation errors may be caused by contributors, guidelines, source audio, tooling or evaluator defects. | Use an error taxonomy and root-cause loop: detect, localize, diagnose, intervene, reassess and measure. Feed validated patterns back into guidelines, training and QA rules. | Requires structured findings and cross-functional operations. | Reduces recurring rework and lowers cost per client-accepted annotation. | Recommended |
| PD-66 | Assessment validity | A passing score does not prove that an assessment measures production capability. | Map assessment items/tasks to competencies; conduct expert content review, pilot item analysis, rater-agreement checks and ongoing assessment-to-production validation. | Requires item-bank governance, pilot data and statistical/SME expertise. | Improves qualification decisions and reduces both false-positive and false-negative selection. | Recommended |
| PD-67 | Assessment analytics | Pass rate alone can hide weak questions, leakage, inconsistent scoring or poor prediction. | Provide internal analytics for item difficulty/discrimination where suitable, omissions/timing, exposure, form comparability, reviewer agreement, appeals and downstream production outcomes; label sample sizes and limitations. | More analytics work; small early cohorts limit statistical certainty. | Enables evidence-led assessment improvement rather than arbitrary threshold changes. | Recommended |
| PD-68 | Fair assessment evidence | Small or skewed language/dialect cohorts can make item and group statistics unstable. | Treat pilot statistics as diagnostic; use privacy-safe cohort breakdowns, minimum-cell rules, expert review and documented uncertainty. Do not make unsupported fairness or validity claims. | Slower decisions and less granular reporting in small cohorts. | Reduces biased item decisions and protects contributors in low-resource language groups. | Recommended |


## 10. Product metrics and decision validation

Decisions should be validated using measured outcomes, not only visual review. Suggested pilot metrics are below; target values should be established after baseline measurement rather than invented in the mockups.

| Product objective | Metric | Why it matters | Segment/breakdown |
|---|---|---|---|
| Onboarding conversion | Signup-to-OTP completion; OTP-to-profile completion; profile-to-first-assessment start | Detect friction in the acquisition funnel | Channel, country, device, language |
| Assessment validity | Assessment completion; score distribution; repeat-attempt score correlation; item exposure/reuse; human adjudication rate | Check whether assessments distinguish capability and resist leakage | Language, task type, assessment version |
| Project activation | Invitation view-to-accept; acceptance-to-training completion; training-to-certification pass; ready-to-active time | Detect drop-off after acceptance and delays to production | Project, language, cohort |
| Production throughput | Claim success/conflict; time-to-first-task; task completion time; abandonment/reservation expiry | Improve allocation and task supply | Project, task type, contributor cohort |
| Data quality | Schema error rate; WER/CER where applicable; reviewer rework rate; first-pass approval; adjudication rate | Measure output reliability and review cost | Language, dialect, task type, guideline version |
| Contributor trust | Appeal rate; appeal uphold rate; time-to-resolution; payout issue rate; support response time | Detect unfair decisions and financial friction | Case category, project, payout method |
| Financial control | Approved-to-paid time; failed payout rate; ledger reconciliation variance; cost per approved unit | Protect margin and payment reliability | Currency, project, payment provider |
| Client delivery | Accepted export rate; export defect rate; delivery SLA; provenance completeness | Validate the core customer outcome | Client, project, delivery format |

### 9.1 Quality/cost balance

The platform should not maximize automated approval percentage as a standalone goal. The meaningful optimization is to minimize the cost per *client-accepted, quality-compliant unit* while maintaining contributor fairness and meeting the client's acceptance criteria.

A project quality policy should make review cost configurable:

- Increase human review for new contributors, new dialects, new schema versions, high-risk assets or conflicting model signals.
- Reduce redundant review only when evidence demonstrates stable performance and the client policy permits sampling.
- Preserve random/stratified quality samples to detect silent degradation.
- Keep a human escalation path for ambiguous, contested or high-impact decisions.

### 9.2 Pilot review cadence

- Weekly: onboarding funnel, task availability, completion, quality/rework, support and payout exceptions.
- Per project batch: schema validity, reviewer agreement, adjudication, acceptance and unit cost.
- Monthly or per cohort: skill-specific quality trends, certification validity, allocation fairness and contributor retention.

---



### 9.3 Training, screening and assessment validity measures

| Objective | Metric/evidence | Product question | Guardrail |
|---|---|---|---|
| Screening efficiency | Diagnostic completion, practical assessment completion, expert-review rate, qualification rate, appeal/overturn rate | Is the funnel identifying capable people without excessive drop-off? | Do not optimize qualification rate alone or use demographic proxies |
| Training content quality | SME defects found, guideline coverage, content version freshness, exercise validity, accessibility defects | Is the material correct, complete and usable? | A published lesson must have reviewed content and version evidence |
| Training effectiveness | Pre/post practice error categories, post-training certification, first-pass production approval, rework recurrence | Does training improve independent work? | Report cohort size and comparison limitations; avoid unsupported causal claims |
| Sample governance | Asset access by class, denied access, item exposure/reuse, item retirement and leakage incidents | Are samples used for the right purpose and protected? | Secure/gold references remain restricted |
| Assessment quality | Blueprint coverage, item difficulty/discrimination where suitable, omission/time patterns, form comparability, rater agreement | Does the assessment test the intended skill consistently? | Statistical diagnostics trigger investigation, not automatic deletion or threshold changes |
| Predictive validity | Assessment competency evidence versus subsequent comparable production quality | Does qualification predict real work? | Account for task difficulty, project, language/dialect, training and selection effects |
| Accuracy improvement | Error recurrence, intervention completion, post-intervention first-pass approval, rework and adjudication | Did the intervention solve the actual root cause? | Do not attribute every defect to the contributor |
| Anti-gaming | Confirmed abuse by category, false-positive/overturned flags, investigation resolution time | Are controls finding real abuse fairly? | Raw telemetry/model signals are not proof |

## 11. Decision governance

For each decision, record:

- Decision owner (Product, Operations, Quality, Engineering, Security/Privacy, Finance or Client).
- Date approved.
- Scope (platform-wide, project-specific, assessment-specific or jurisdiction-specific).
- Policy/configuration version.
- Evidence used and revisit trigger.

Revisit a decision when:

- Pilot data contradicts the assumption.
- A client contract imposes a different requirement.
- A policy change impacts contributor eligibility, monitoring, payment or appeal rights.
- A scale or reliability limit is reached.
- The decision materially increases cost, false rejections, contributor abandonment or client defects.

### 10.1 Approval register

| Decision IDs | Suggested owner | Approval needed |
|---|---|---|
| PD-05–PD-12 | Product + Security/Privacy + Operations | Confirm required fields, OTP policy, KYC triggers and profile policy |
| PD-13–PD-21, PD-66–PD-68 | Assessment/Quality + Product + Security/Privacy | Approve blueprint, attempts, rubric, validity plan, item analytics, proctoring, appeals and disclosure policy |
| PD-59–PD-65 | Training owner + Language SMEs + Quality + Operations + Product | Approve training publication gates, sample classes, screening evidence, production ramp and accuracy interventions |
| PD-22–PD-28 | Product + Project Operations + Finance | Approve invitation, terms, training gates, certification and activation rules |
| PD-29–PD-36 | Task Operations + Engineering + Quality | Approve reservation, auto-claim, schema and autosave behaviors |
| PD-37–PD-44 | Quality + Operations + Product | Approve metrics, sample sizes, review sampling, rework and intervention policy |
| PD-45–PD-50 | Finance + Support Operations + Product | Approve earning trigger, rate cards, payout schedule and dispute SLA |
| PD-51–PD-58 | Engineering + Security/Privacy + Operations | Approve tenancy controls, data retention, hosting and observability |

---

## 12. Review checklist for product leadership

Before approving the product and architecture baseline, confirm:

- [ ] Contributor-first signup and separate client onboarding.
- [ ] OTP requirements and separate KYC/identity rules.
- [ ] Minimal profile data and optional education/experience.
- [ ] Language/dialect/task skill model and verification evidence.
- [ ] Assessment format, attempt policy, cheating controls and proctoring levels.
- [ ] Platform qualification versus project certification.
- [ ] Invitation acceptance, project training and production activation gates.
- [ ] Task reservation, exclusivity and auto-claim policy.
- [ ] Annotation schema and language-specific normalization.
- [ ] Automated QA, human sampling, adjudication and rework policy.
- [ ] Contributor performance sample thresholds and appeal policy.
- [ ] Rate cards, earning event, payout rails, tax and reconciliation.
- [ ] Support case categories, appeal SLAs and escalation ownership.
- [ ] Data access, retention, deletion, client export and consent requirements.
- [ ] Pilot success metrics and acceptance criteria.

