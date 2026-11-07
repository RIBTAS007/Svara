# Svara — Product, Quality & Architecture Package

**Version:** 2.1  
**Date:** 7 November 2026  

This package consolidates Svara's contributor lifecycle and strengthens the quality strategy behind it. It covers the product from sign-up and language profiling through platform assessment, project onboarding, training, project certification, task production, human/automated quality review, contributor performance, earnings and support.

## Documents

1. `Svara_Product_Decision_Log.md` — Manager-facing decision register. Each decision records the problem, decision, trade-off, expected business impact and approval status. Includes the new training-quality, contributor-screening, sample-access, anti-gaming, accuracy-improvement and assessment-validity decisions (PD-59–PD-68).
2. `Svara_HLD.md` — Product and high-level architecture. Describes user journeys, product principles, system boundaries, quality and integrity strategy, training governance, sample access classes, assessment validity, architecture, security, roadmap and open decisions.
3. `Svara_LLD.md` — Implementation-level design. Describes data structures, state machines, APIs, workflows, analytics, access controls, background jobs, error handling and tests for the expanded quality framework.

## Whats added in the App

The app focuses on the areas like:

- **Training quality:** learning objectives, language/domain SME review, instructional QA, content versioning, publication gates, practice design and effectiveness measurement against subsequent certification/production outcomes.
- **Sample access:** explicit separation of public demonstration, project preview, project training, unscored practice, secure assessment, gold QA and production assets, with server-side authorization and exposure audit.
- **Anti-gaming:** a threat model that covers account creation, assessment leakage/collusion, sample exposure, task claiming, production annotation, quality metric gaming, reviewer integrity and payout controls.
- **Accuracy improvement:** a closed-loop process to detect recurring errors, identify root causes, apply training/guideline/tooling/review interventions, reassess and measure the result.
- **Contributor screening:** a staged evidence funnel that keeps contact verification, identity/compliance, self-reported language, practical assessment, expert review, project certification and production evidence separate.
- **Proctoring:** retains a risk-based, disclosed and proportionate approach; isolated telemetry is not proof of cheating.
- **Assessment validity and analytics:** competency blueprint, expert content review, pilot/item analysis, reliability/rater agreement, form comparability, predictive validation against comparable reviewed production work and fairness/privacy guardrails.

## Traceability: your seven quality concerns

| Concern | HLD sections | LLD sections | Product decisions |
|---|---|---|---|
| Training module quality and effectiveness | 8.7 | 4.7.1, 6.10, 8.1, 13.6 | PD-59–PD-60 |
| Sample access and protection | 8.8 | 4.7.1, 8.2, 10.5 | PD-61, plus PD-24 |
| Preventing gaming across the lifecycle | 8.9, 9.2–9.3 | 6.12, 8.2, 10.4–10.5, 13.4 | PD-14, PD-16–PD-17, PD-63 |
| Improving annotation accuracy | 8.4–8.6, 8.10 | 6.7–6.8, 8, 9, 13.5–13.6 | PD-37–PD-44, PD-65 |
| Identifying capable contributors at onboarding | 8.6 | 4.2.1, 6.11, 13.6 | PD-10–PD-12, PD-62–PD-64 |
| Proctoring and assessment integrity | 9.2–9.3 | 6.2–6.3, 10.4–10.5 | PD-15–PD-17 |
| Assessment suitability and analytics | 9.4 | 4.5.1, 6.12, 8.1, 13.6 | PD-66–PD-68 |

## Recommended reading order

1. Read the **Product Decision Log** first to understand why the platform makes each important choice and what trade-offs require approval.
2. Read the **HLD** to understand the end-to-end product, quality strategy and system architecture.
3. Read the **LLD** to understand how workflows and policies become database records, APIs, state transitions, jobs and tests.

## Core product principle

Svara should not optimize only for assessment pass rates, training completion, automated QA pass rates or throughput. The central business outcome is:

**Reliably identify, train and retain contributors who consistently produce accurate, client-accepted data at a sustainable cost, while maintaining contributor fairness and trust.**

## Important interpretation and limitations

- These documents are proposed design artifacts based on the product journeys and screen designs discussed. They are not evidence that all controls, integrations or policies have already been implemented.
- The initial planning cohort of approximately 100 contributors is an assumption to validate with pilot traffic and workload measurements.
- Early assessment/training analytics will be descriptive and provisional. Statistical claims about item quality, reliability, fairness or predictive validity require adequate, representative evidence. Small cohorts should not be used to make unsupported conclusions.
- A high-stakes assessment should have an approved competency blueprint and expert-reviewed content before being used as a qualification gate.
- Training completion is not proof of competence. Practice is not an official attempt. Platform qualification is not project certification. Invitation acceptance is not production activation. Assessment submission is not approval. Approval is not payout.
- AI/ASR output and integrity telemetry are signals, not ground truth. High-impact decisions require the configured human review and appeal process.
- Mockup values such as scores, compensation, thresholds, durations, SLAs, payout dates and sample counts are illustrative until approved and configured.
- Technology choices in the documents remain proposed baselines, not claims about an already deployed stack.

## Decisions requiring cross-functional approval

Before production, confirm:

- Screening stages and any project-specific identity checks.
- Required training SME roles, publication gates and review cadence.
- Sample rights, de-identification, download/replay and exposure policies.
- Assessment blueprint, item bank governance, pass policy, pilot evidence and proctoring levels.
- Item-analysis interpretation, minimum sample policy and assessment validity review cadence.
- Gold-task frequency and security.
- Production ramp, sampling and quality intervention policy.
- Language/dialect normalization and accepted variants.
- Rework, rejection, appeal, payout and data-retention rules.
