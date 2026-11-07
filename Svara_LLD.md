# Svara — Low-Level Design (LLD)

**Version:** 2.1  
**Date:** 7 November 2026  
**Companion:** `Svara_HLD.md`  
**Product decision register:** `Svara_Product_Decision_Log.md`  
**Audience:** Engineering, Product, QA, Data Operations and Security

---

## 0. How to use this document

This LLD translates the Svara contributor lifecycle and product decisions into implementable modules, data structures, state machines, APIs, background jobs, authorization rules and test cases.

Requirement labels:

- **Confirmed product direction:** explicitly established in the current product journey and screen discussions.
- **Recommended design:** a technical or product recommendation that should be adopted unless a deliberate decision changes it.
- **Configurable policy:** a value that must be configured per assessment, project, country, client contract or operational policy; it must not be hardcoded in the UI.
- **Open decision:** requires product, operations, legal, client or finance confirmation before production.

Code and SQL below are implementation templates. They must be reconciled with the chosen framework versions, migration conventions and security review before production deployment.

## 1. System implementation conventions

### 1.1 Naming and data formats

- Python modules/functions: `snake_case`; classes: `PascalCase`.
- Database tables and columns: `snake_case`.
- REST paths: plural resource names under `/api/v1`.
- Primary identifiers: UUID.
- Timestamps: UTC `TIMESTAMPTZ`; convert to user timezone only for display.
- Money: integer minor units plus ISO-4217 currency code. Do not use floating-point money.
- Percentages: numeric 0–100 with documented precision and calculation policy.
- Audio timestamps: integer milliseconds or sample offsets with an explicit time base.
- Text offsets: declared per schema; recommended UTF-8-independent Unicode code-point offsets, with frontend/backend tests for Indic combining marks and grapheme clusters.
- Annotation payloads: JSONB validated by a versioned schema. Stable, frequently queried attributes remain relational columns.
- Use `Idempotency-Key` for retry-sensitive POST operations and `X-Correlation-ID` for distributed tracing.

### 1.2 API response conventions

Successful responses use standard HTTP status codes and typed JSON bodies. Errors use one envelope:

```json
{
  "error": {
    "code": "TASK_NOT_CLAIMABLE",
    "message": "This task is no longer available.",
    "details": {"task_id": "uuid"},
    "correlation_id": "trace-id"
  }
}
```

Do not return secrets, raw identity documents, internal fraud scores, gold answers, reviewer-only notes, private object-storage keys or another contributor's records.

### 1.3 Pagination and concurrency

- Use cursor pagination for large queues and ledgers.
- Use optimistic concurrency (`version` or `If-Match`) for drafts and editable records.
- Use database transactions and locking for task claims, invitation acceptance where capacity is reserved, final submission and ledger postings.
- Use idempotency keys for claims, submissions, payout initiation and other retry-prone writes.

## 2. Backend module layout

```text
app/
  main.py
  core/
    config.py
    database.py
    security.py
    authorization.py
    rate_limits.py
    idempotency.py
    telemetry.py
  modules/
    identity/
    onboarding/
    contributors/
    verification/
    assessments/
    qualifications/
    projects/
    invitations/
    training/
    assets/
    tasks/
    annotations/
    submissions/
    quality/
    reviews/
    support/
    finance/
    notifications/
    analytics/
    audit/
  integrations/
    object_storage/
    email/
    sms/
    asr/
    ai_evaluation/
    payment_provider/
  workers/
    celery_app.py
    media_jobs.py
    assessment_jobs.py
    quality_jobs.py
    notification_jobs.py
    export_jobs.py
    maintenance_jobs.py
  shared/
    enums.py
    schemas.py
    errors.py
    events.py
    pagination.py
```

Each domain module owns its models, repositories, service layer, API schemas, router and policy checks. Routers validate requests and invoke services; business rules must not be implemented only in route handlers or frontend components.

## 3. Domain boundaries and core state machines

### 3.1 Account and onboarding states

Keep account state distinct from profile-completion state and verification state.

```python
class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DISABLED = "DISABLED"

class OnboardingStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PERSONAL_DETAILS_IN_PROGRESS = "PERSONAL_DETAILS_IN_PROGRESS"
    LANGUAGE_PROFILE_IN_PROGRESS = "LANGUAGE_PROFILE_IN_PROGRESS"
    ASSESSMENT_REQUIRED = "ASSESSMENT_REQUIRED"
    COMPLETED = "COMPLETED"

class VerificationStatus(str, Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    NOT_STARTED = "NOT_STARTED"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
```

Email/phone OTP proves control of a channel; it does not by itself establish government identity or contributor qualification. Verification requirements are policy-driven.

### 3.2 Assessment states — keep attempt, evaluation and outcome separate

```python
class AssessmentAttemptStatus(str, Enum):
    CREATED = "CREATED"
    READINESS_PENDING = "READINESS_PENDING"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW_READY = "REVIEW_READY"
    SUBMITTED = "SUBMITTED"
    EXPIRED = "EXPIRED"
    ABANDONED = "ABANDONED"
    CANCELLED = "CANCELLED"

class EvaluationStatus(str, Enum):
    QUEUED = "QUEUED"
    AUTOMATED_CHECKS = "AUTOMATED_CHECKS"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    ADDITIONAL_VERIFICATION = "ADDITIONAL_VERIFICATION"
    FINALIZED = "FINALIZED"
    TECHNICAL_FAILURE = "TECHNICAL_FAILURE"

class AssessmentOutcome(str, Enum):
    QUALIFIED = "QUALIFIED"
    NOT_YET_QUALIFIED = "NOT_YET_QUALIFIED"
    INCONCLUSIVE = "INCONCLUSIVE"
    UNDER_APPEAL = "UNDER_APPEAL"
```

Rules:

1. A practice exercise does not create an official assessment attempt and does not consume an attempt allowance.
2. The official timer begins only after the contributor confirms the start action and the server creates/activates the attempt.
3. An attempt snapshots the assessment version, item selection, rubric version, permitted-tool policy, duration and relevant proctoring/consent configuration.
4. Submission is immutable. Corrections, reviewer findings and appeal decisions are separate records or versions.
5. A result is not finalized until configured automated and human steps have completed.
6. Qualification is a distinct record linked to the assessment outcome, skill, language/task scope and validity policy.

### 3.3 Project invitation, participation and activation states

Do not place all project lifecycle information in one status column.

```python
class InvitationStatus(str, Enum):
    SENT = "SENT"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    WITHDRAWN = "WITHDRAWN"

class ParticipationStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    ONBOARDING_IN_PROGRESS = "ONBOARDING_IN_PROGRESS"
    TRAINING_IN_PROGRESS = "TRAINING_IN_PROGRESS"
    CERTIFICATION_PENDING = "CERTIFICATION_PENDING"
    CERTIFICATION_UNDER_REVIEW = "CERTIFICATION_UNDER_REVIEW"
    READY_FOR_ALLOCATION = "READY_FOR_ALLOCATION"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"
    CANCELLED = "CANCELLED"
```

Invitation acceptance confirms intent and creates/updates project participation. It does not automatically activate production task access. Training, agreements, project certification, eligibility, capacity and explicit allocation/activation gates are evaluated separately.

### 3.4 Training states

```python
class LessonStatus(str, Enum):
    LOCKED = "LOCKED"
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    PRACTICE_PENDING = "PRACTICE_PENDING"
    COMPLETED = "COMPLETED"

class TrainingStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
```

A lesson is complete only when its configured requirements are met (for example, required content, exercises and acknowledgements). Page view or scroll position alone is not completion evidence.

### 3.5 Production task, assignment and submission states

```python
class TaskStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    AUTOMATED_QA = "AUTOMATED_QA"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    REWORK = "REWORK"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class AnswerStatus(str, Enum):
    EMPTY = "EMPTY"
    DRAFT = "DRAFT"
    ANSWERED = "ANSWERED"
    SUBMITTED = "SUBMITTED"

class SyncStatus(str, Enum):
    LOCAL_ONLY = "LOCAL_ONLY"
    PENDING = "PENDING"
    SYNCED = "SYNCED"
    FAILED = "FAILED"

class ReviewFlagStatus(str, Enum):
    NOT_FLAGGED = "NOT_FLAGGED"
    FLAGGED_BY_CONTRIBUTOR = "FLAGGED_BY_CONTRIBUTOR"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    RESOLVED = "RESOLVED"
```

`answer_status`, `sync_status`, `review_flag_status`, QA status and final review decision are orthogonal dimensions. A task may be answered, saved and flagged at the same time.

### 3.6 Submission/review states

```python
class SubmissionStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    QA_PENDING = "QA_PENDING"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    REWORK_REQUIRED = "REWORK_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    APPEAL_PENDING = "APPEAL_PENDING"
    CLOSED = "CLOSED"

class ReviewDecision(str, Enum):
    APPROVE = "APPROVE"
    REWORK = "REWORK"
    REJECT = "REJECT"
    ESCALATE = "ESCALATE"
```

### 3.7 Finance and case states

```python
class EarningStatus(str, Enum):
    ESTIMATED = "ESTIMATED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"
    ON_HOLD = "ON_HOLD"
    REVERSED = "REVERSED"

class CaseStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    AWAITING_CONTRIBUTOR = "AWAITING_CONTRIBUTOR"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
```

## 4. Database design

The following DDL is a logical starting point. Apply migrations in dependency order, add required indexes and constraints, and decide which optional/profile fields need dedicated tables versus JSONB based on reporting and privacy needs.

### 4.1 Identity, role and session tables

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_methods (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  contact_type VARCHAR(16) NOT NULL CHECK (contact_type IN ('EMAIL','PHONE')),
  value_encrypted TEXT NOT NULL,
  value_lookup_hash TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_type, value_lookup_hash)
);

CREATE TABLE verification_challenges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  contact_method_id UUID NOT NULL REFERENCES contact_methods(id),
  purpose VARCHAR(32) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  organization_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, role_id)
);

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  refresh_token_hash TEXT NOT NULL,
  device_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
```

Never store plaintext OTPs or refresh tokens. Apply rate limits, bounded verification attempts and generic authentication errors.

### 4.2 Contributor profile and skill model

```sql
CREATE TABLE contributor_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  legal_name_encrypted TEXT,
  display_name VARCHAR(160),
  profile_photo_key TEXT,
  country_code CHAR(2),
  region VARCHAR(120),
  city VARCHAR(120),
  timezone VARCHAR(80),
  education_level VARCHAR(80),
  field_of_study VARCHAR(160),
  institution VARCHAR(200),
  current_occupation VARCHAR(160),
  onboarding_status VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE languages (
  id UUID PRIMARY KEY,
  language_code VARCHAR(20) NOT NULL UNIQUE,
  language_name VARCHAR(120) NOT NULL
);

CREATE TABLE dialects (
  id UUID PRIMARY KEY,
  language_id UUID NOT NULL REFERENCES languages(id),
  dialect_code VARCHAR(40),
  dialect_name VARCHAR(160) NOT NULL,
  region_description TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE contributor_languages (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  language_id UUID NOT NULL REFERENCES languages(id),
  language_role VARCHAR(20) NOT NULL,
  overall_self_reported_level VARCHAR(32),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contributor_id, language_id)
);

CREATE TABLE contributor_language_proficiency (
  id UUID PRIMARY KEY,
  contributor_language_id UUID NOT NULL REFERENCES contributor_languages(id),
  proficiency_dimension VARCHAR(20) NOT NULL,
  self_reported_level VARCHAR(32),
  verified_level VARCHAR(32),
  evidence_assessment_id UUID,
  verified_at TIMESTAMPTZ,
  UNIQUE(contributor_language_id, proficiency_dimension)
);

CREATE TABLE contributor_dialects (
  id UUID PRIMARY KEY,
  contributor_language_id UUID NOT NULL REFERENCES contributor_languages(id),
  dialect_id UUID REFERENCES dialects(id),
  dialect_label_other VARCHAR(160),
  speaking_familiarity VARCHAR(32),
  listening_familiarity VARCHAR(32),
  self_reported BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE task_types (
  id UUID PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(160) NOT NULL
);

CREATE TABLE contributor_task_preferences (
  id UUID PRIMARY KEY,
  contributor_language_id UUID NOT NULL REFERENCES contributor_languages(id),
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  interest_status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contributor_language_id, task_type_id)
);
```

Self-reported language proficiency, assessment evidence, project certification and production quality are distinct records. Do not turn a language preference into a verified qualification.

#### 4.2.1 Contributor screening and capability evidence

Self-reported profile data must remain separate from assessed and production evidence. The following records support traceable screening without introducing demographic proxies.

```sql
CREATE TABLE contributor_screening_records (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  screening_type VARCHAR(40) NOT NULL,
  language_id UUID REFERENCES languages(id),
  dialect_id UUID REFERENCES dialects(id),
  task_type_id UUID REFERENCES task_types(id),
  status VARCHAR(24) NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

CREATE TABLE capability_evidence (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  evidence_scope VARCHAR(32) NOT NULL,
  language_id UUID REFERENCES languages(id),
  dialect_id UUID REFERENCES dialects(id),
  task_type_id UUID REFERENCES task_types(id),
  source_type VARCHAR(32) NOT NULL,
  source_reference JSONB NOT NULL,
  evidence_summary JSONB NOT NULL,
  confidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ
);

CREATE TABLE contributor_quality_interventions (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  language_id UUID REFERENCES languages(id),
  dialect_id UUID REFERENCES dialects(id),
  task_type_id UUID REFERENCES task_types(id),
  project_id UUID,
  intervention_type VARCHAR(40) NOT NULL,
  trigger_evidence JSONB NOT NULL,
  action_plan JSONB NOT NULL,
  status VARCHAR(24) NOT NULL,
  authorized_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

Use screening records for workflow evidence, not a permanent single contributor score. Any capability stage shown in the UI should be derived from scoped evidence and current policy. A screening diagnostic can route candidates to the right next step but must not replace practical qualification or expert review in high-impact cases.


### 4.3 Personal verification and documents

```sql
CREATE TABLE verification_requirements (
  id UUID PRIMARY KEY,
  scope_type VARCHAR(24) NOT NULL,
  scope_id UUID,
  country_code CHAR(2),
  verification_type VARCHAR(40) NOT NULL,
  required BOOLEAN NOT NULL,
  policy_version INTEGER NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE contributor_verifications (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  requirement_id UUID NOT NULL REFERENCES verification_requirements(id),
  status VARCHAR(32) NOT NULL,
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES users(id),
  contributor_facing_reason TEXT,
  UNIQUE(contributor_id, requirement_id)
);

CREATE TABLE verification_documents (
  id UUID PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES contributor_verifications(id),
  private_object_key TEXT NOT NULL,
  document_type VARCHAR(48) NOT NULL,
  checksum_sha256 CHAR(64),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE verification_events (
  id UUID PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES contributor_verifications(id),
  event_type VARCHAR(48) NOT NULL,
  actor_id UUID REFERENCES users(id),
  reason_code VARCHAR(64),
  public_message TEXT,
  private_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Access to document object keys is highly restricted. Never store document binary payloads in public assets or return permanent public URLs.

### 4.4 Projects base table and tenant ownership

The base `projects` table is created before assessments because platform/project-scoped assessment blueprints and attempts may reference it. Project requirements, guideline versions and participation tables are defined after their dependent domain entities below.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  currency CHAR(3),
  terms_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contributor_quality_interventions
  ADD CONSTRAINT fk_contributor_quality_interventions_project
  FOREIGN KEY (project_id) REFERENCES projects(id);
```

### 4.5 Assessments, attempts, answers and qualifications

```sql
CREATE TABLE assessment_blueprints (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  assessment_scope VARCHAR(24) NOT NULL,
  language_id UUID REFERENCES languages(id),
  task_type_id UUID REFERENCES task_types(id),
  project_id UUID REFERENCES projects(id),
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE assessment_versions (
  id UUID PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES assessment_blueprints(id),
  version_number INTEGER NOT NULL,
  duration_seconds INTEGER,
  attempt_policy JSONB NOT NULL,
  scoring_policy JSONB NOT NULL,
  integrity_policy JSONB NOT NULL,
  rubric_version VARCHAR(80) NOT NULL,
  published_at TIMESTAMPTZ,
  UNIQUE(blueprint_id, version_number)
);

CREATE TABLE assessment_items (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  item_type VARCHAR(40) NOT NULL,
  secure_content JSONB NOT NULL,
  secure_reference JSONB,
  scoring_rubric JSONB NOT NULL,
  points NUMERIC(8,2) NOT NULL,
  sequence_number INTEGER NOT NULL
);

CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  project_id UUID REFERENCES projects(id),
  attempt_number INTEGER NOT NULL,
  attempt_status VARCHAR(40) NOT NULL,
  evaluation_status VARCHAR(40),
  outcome VARCHAR(32),
  started_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  score NUMERIC(6,3),
  UNIQUE(contributor_id, assessment_version_id, attempt_number)
);

CREATE TABLE assessment_attempt_items (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id),
  assessment_item_id UUID NOT NULL REFERENCES assessment_items(id),
  display_order INTEGER NOT NULL,
  response_status VARCHAR(24) NOT NULL DEFAULT 'EMPTY',
  UNIQUE(attempt_id, assessment_item_id)
);

CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY,
  attempt_item_id UUID NOT NULL REFERENCES assessment_attempt_items(id),
  response_version INTEGER NOT NULL,
  response_payload JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_final BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(attempt_item_id, response_version)
);

CREATE TABLE assessment_evaluations (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id),
  evaluation_version INTEGER NOT NULL,
  overall_score NUMERIC(6,3),
  outcome VARCHAR(32),
  component_scores JSONB NOT NULL,
  automated_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  human_review_id UUID,
  finalized_at TIMESTAMPTZ,
  UNIQUE(attempt_id, evaluation_version)
);

CREATE TABLE assessment_integrity_events (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id),
  event_type VARCHAR(60) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_required BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(64) NOT NULL,
  policy_version VARCHAR(80) NOT NULL,
  granted BOOLEAN NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE qualifications (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  qualification_scope VARCHAR(24) NOT NULL,
  language_id UUID REFERENCES languages(id),
  task_type_id UUID REFERENCES task_types(id),
  project_id UUID REFERENCES projects(id),
  evaluation_id UUID NOT NULL REFERENCES assessment_evaluations(id),
  status VARCHAR(24) NOT NULL,
  credential_code VARCHAR(100) UNIQUE,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

Keep secure answer references server-side and do not expose them through contributor APIs.

#### 4.5.1 Assessment blueprint coverage, validation and item analytics

The existing `assessment_blueprints`, `assessment_versions` and `assessment_items` are the base. The following extension makes the assessment's intended construct and subsequent validation evidence explicit.

```sql
CREATE TABLE competency_catalog (
  id UUID PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  language_id UUID REFERENCES languages(id),
  task_type_id UUID REFERENCES task_types(id),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE assessment_version_competencies (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  competency_id UUID NOT NULL REFERENCES competency_catalog(id),
  target_weight NUMERIC(7,4),
  mandatory_floor NUMERIC(7,4),
  evidence_description TEXT NOT NULL,
  UNIQUE(assessment_version_id, competency_id)
);

CREATE TABLE assessment_item_competencies (
  assessment_item_id UUID NOT NULL REFERENCES assessment_items(id),
  competency_id UUID NOT NULL REFERENCES competency_catalog(id),
  weight NUMERIC(7,4),
  PRIMARY KEY (assessment_item_id, competency_id)
);

CREATE TABLE assessment_validation_reviews (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  review_type VARCHAR(40) NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(24) NOT NULL,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_pilot_runs (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  cohort_label VARCHAR(120),
  language_id UUID REFERENCES languages(id),
  dialect_id UUID REFERENCES dialects(id),
  sample_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  methodology JSONB NOT NULL DEFAULT '{}'::jsonb,
  limitations TEXT
);

CREATE TABLE assessment_item_analytics (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  assessment_item_id UUID NOT NULL REFERENCES assessment_items(id),
  pilot_run_id UUID REFERENCES assessment_pilot_runs(id),
  attempts_count INTEGER NOT NULL,
  scored_count INTEGER NOT NULL,
  correct_count INTEGER,
  difficulty_p_value NUMERIC(8,5),
  discrimination_index NUMERIC(8,5),
  omission_rate NUMERIC(8,5),
  median_response_seconds NUMERIC(12,3),
  distractor_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  exposure_count INTEGER NOT NULL DEFAULT 0,
  uncertainty JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_recommendation VARCHAR(32),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_analytics_snapshots (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id),
  cohort_label VARCHAR(120),
  language_id UUID REFERENCES languages(id),
  dialect_id UUID REFERENCES dialects(id),
  task_type_id UUID REFERENCES task_types(id),
  sample_count INTEGER NOT NULL,
  completion_rate NUMERIC(8,5),
  pass_rate NUMERIC(8,5),
  score_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  rater_agreement JSONB NOT NULL DEFAULT '{}'::jsonb,
  form_comparability JSONB NOT NULL DEFAULT '{}'::jsonb,
  production_linkage JSONB NOT NULL DEFAULT '{}'::jsonb,
  limitations TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_item_exposures (
  id UUID PRIMARY KEY,
  assessment_item_id UUID NOT NULL REFERENCES assessment_items(id),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  exposed_at TIMESTAMPTZ NOT NULL,
  exposure_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(assessment_item_id, attempt_id)
);
```

Implementation notes:

- Store item statistics as versioned snapshots; do not overwrite historical analytics after rubric or item changes.
- Difficulty `p` is the proportion correct only for objectively scored items where that interpretation is valid. Practical rubric-scored tasks require appropriate item/task analysis instead.
- Discrimination statistics are diagnostic, not automatic item deletion rules. Review negative/near-zero values for ambiguity, miskeying, leakage, construct mismatch or sample artifacts.
- Reliability statistics depend on assessment structure. Do not calculate one universal coefficient across heterogeneous audio tasks and subjective reviewer judgments.
- Cohort, language and dialect breakdowns must respect privacy and minimum-cell policies.
- Keep secure reference content and item-level leakage-sensitive analytics out of contributor APIs.


### 4.6 Projects, invitations and participation

```sql

CREATE TABLE project_requirements (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  language_id UUID REFERENCES languages(id),
  task_type_id UUID REFERENCES task_types(id),
  dialect_id UUID REFERENCES dialects(id),
  qualification_id UUID REFERENCES qualifications(id),
  minimum_quality_policy JSONB,
  required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE project_guideline_versions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  annotation_schema JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  UNIQUE(project_id, version_number)
);

CREATE TABLE project_invitations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  status VARCHAR(24) NOT NULL,
  expires_at TIMESTAMPTZ,
  terms_version INTEGER NOT NULL,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_participations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  invitation_id UUID REFERENCES project_invitations(id),
  status VARCHAR(40) NOT NULL,
  accepted_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(project_id, contributor_id)
);

CREATE TABLE project_agreement_acceptances (
  id UUID PRIMARY KEY,
  participation_id UUID NOT NULL REFERENCES project_participations(id),
  agreement_type VARCHAR(48) NOT NULL,
  agreement_version VARCHAR(80) NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

Acceptance must be performed transactionally and idempotently. Store the project terms version accepted by the contributor. Material terms changes require explicit renewed acceptance when policy requires it.

### 4.7 Project training

```sql
CREATE TABLE training_modules (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  guideline_version_id UUID NOT NULL REFERENCES project_guideline_versions(id),
  title VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL
);

CREATE TABLE training_lessons (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES training_modules(id),
  title VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  duration_seconds INTEGER,
  content JSONB NOT NULL,
  completion_rules JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE training_progress (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id),
  status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
  progress_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contributor_id, lesson_id)
);

CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id),
  exercise_version VARCHAR(80) NOT NULL,
  response JSONB NOT NULL,
  feedback JSONB,
  score NUMERIC(6,3),
  completed_at TIMESTAMPTZ
);
```

Practice attempts are training evidence only; they do not consume official certification attempts or issue qualifications.

#### 4.7.1 Training content governance, learning objectives and sample access

The existing training tables need explicit content versioning and review evidence. `content JSONB` remains useful for flexible lesson composition, but it must not be the only record of whether content was approved or what it teaches.

```sql
CREATE TABLE training_content_versions (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES training_modules(id),
  lesson_id UUID REFERENCES training_lessons(id),
  version_number INTEGER NOT NULL,
  guideline_version_id UUID REFERENCES project_guideline_versions(id),
  schema_version VARCHAR(80),
  content_hash VARCHAR(128) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((module_id IS NOT NULL) <> (lesson_id IS NOT NULL))
);

CREATE TABLE learning_objectives (
  id UUID PRIMARY KEY,
  competency_id UUID NOT NULL REFERENCES competency_catalog(id),
  code VARCHAR(80) NOT NULL UNIQUE,
  objective TEXT NOT NULL,
  observable_evidence TEXT NOT NULL
);

CREATE TABLE training_objective_mappings (
  id UUID PRIMARY KEY,
  training_content_version_id UUID NOT NULL REFERENCES training_content_versions(id),
  learning_objective_id UUID NOT NULL REFERENCES learning_objectives(id),
  required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(training_content_version_id, learning_objective_id)
);

CREATE TABLE training_content_reviews (
  id UUID PRIMARY KEY,
  training_content_version_id UUID NOT NULL REFERENCES training_content_versions(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewer_role VARCHAR(40) NOT NULL,
  review_type VARCHAR(40) NOT NULL,
  decision VARCHAR(24) NOT NULL,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE training_exercises (
  id UUID PRIMARY KEY,
  training_content_version_id UUID NOT NULL REFERENCES training_content_versions(id),
  exercise_type VARCHAR(40) NOT NULL,
  asset_id UUID,
  schema_version VARCHAR(80),
  exercise_config JSONB NOT NULL,
  feedback_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sequence_number INTEGER NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE training_effectiveness_snapshots (
  id UUID PRIMARY KEY,
  training_content_version_id UUID NOT NULL REFERENCES training_content_versions(id),
  cohort_label VARCHAR(120),
  contributor_count INTEGER NOT NULL,
  completion_rate NUMERIC(8,5),
  practice_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  subsequent_certification_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  subsequent_production_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparison_method VARCHAR(80),
  limitations TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_access_grants (
  id UUID PRIMARY KEY,
  asset_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  access_class VARCHAR(32) NOT NULL,
  project_id UUID REFERENCES projects(id),
  participation_id UUID REFERENCES project_participations(id),
  assessment_attempt_id UUID REFERENCES assessment_attempts(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  policy_version VARCHAR(80) NOT NULL
);

CREATE TABLE content_access_events (
  id UUID PRIMARY KEY,
  asset_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  access_class VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE training_outcome_observations (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  training_content_version_id UUID NOT NULL REFERENCES training_content_versions(id),
  learning_objective_id UUID REFERENCES learning_objectives(id),
  observation_type VARCHAR(40) NOT NULL,
  score NUMERIC(8,4),
  evidence_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The `assets` table is created in Section 4.8. To keep the illustrative DDL executable in dependency order, asset foreign keys from `training_exercises` and `content_access_*` are added immediately after the base `assets` table is created. `project_participations` and `assessment_attempts` are defined before the content-access grant table.

Training content publication rules:

1. A module/lesson content version has explicit learning objectives.
2. Required objectives map to competencies and guideline/schema versions.
3. Language/domain SME review and instructional/content QA are recorded separately where possible.
4. Exercise examples are checked for correctness, acceptable dialect variants, clarity, accessibility and secure-content classification.
5. Publish only after required review decisions pass.
6. Contributor progress references the exact content version completed.
7. New material versions do not silently rewrite historical completion evidence.
8. Training effectiveness is evaluated with post-training certification and subsequent production outcomes where evidence is sufficient.

Sample access classes should use a controlled enum/configuration equivalent to:

- `PUBLIC_DEMO`
- `PROJECT_PREVIEW`
- `PROJECT_TRAINING`
- `UNSCORED_PRACTICE`
- `SECURE_ASSESSMENT`
- `GOLD_QA`
- `PRODUCTION_ASSET`

Enforce access class and grant expiry on the server for every asset request. Signed media URLs must be short-lived and scoped. Access events record view/play/download/denied events as appropriate. Hiding a URL in the frontend is not access control.


### 4.8 Assets, tasks, assignment, annotation and submissions

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  object_key TEXT NOT NULL,
  media_type VARCHAR(40) NOT NULL,
  duration_ms BIGINT,
  checksum_sha256 CHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE training_exercises
  ADD CONSTRAINT fk_training_exercises_asset
  FOREIGN KEY (asset_id) REFERENCES assets(id);
ALTER TABLE content_access_grants
  ADD CONSTRAINT fk_content_access_grants_asset
  FOREIGN KEY (asset_id) REFERENCES assets(id);
ALTER TABLE content_access_events
  ADD CONSTRAINT fk_content_access_events_asset
  FOREIGN KEY (asset_id) REFERENCES assets(id);

CREATE TABLE task_batches (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(160) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  batch_id UUID REFERENCES task_batches(id),
  asset_id UUID NOT NULL REFERENCES assets(id),
  guideline_version_id UUID NOT NULL REFERENCES project_guideline_versions(id),
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  schema_version INTEGER NOT NULL,
  annotation_schema JSONB NOT NULL,
  task_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  priority INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_assignments (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  status VARCHAR(32) NOT NULL,
  reserved_at TIMESTAMPTZ,
  reservation_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE annotation_sessions (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES task_assignments(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE TABLE annotation_drafts (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES task_assignments(id),
  version_number INTEGER NOT NULL,
  payload JSONB NOT NULL,
  client_saved_at TIMESTAMPTZ,
  server_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, version_number)
);

CREATE TABLE task_flags (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES task_assignments(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  reason_code VARCHAR(48) NOT NULL,
  note TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES task_assignments(id),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  submission_version INTEGER NOT NULL,
  annotation_payload JSONB NOT NULL,
  guideline_version_id UUID NOT NULL REFERENCES project_guideline_versions(id),
  schema_version INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMPTZ NOT NULL,
  UNIQUE(assignment_id, submission_version)
);
```

Drafts are mutable/versioned; submissions are immutable. A rework cycle creates a new submission version linked to the prior submission and rework request. Do not overwrite the original evidence.

### 4.9 Automated QA, review and quality metrics

```sql
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id),
  source_type VARCHAR(24) NOT NULL,
  check_type VARCHAR(64) NOT NULL,
  policy_version VARCHAR(80) NOT NULL,
  provider VARCHAR(100),
  model_version VARCHAR(100),
  score NUMERIC(8,4),
  result VARCHAR(32) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(24) NOT NULL,
  rubric_version VARCHAR(80) NOT NULL,
  summary TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_findings (
  id UUID PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id),
  segment_reference JSONB,
  issue_category VARCHAR(64) NOT NULL,
  severity VARCHAR(24) NOT NULL,
  original_value JSONB,
  proposed_value JSONB,
  guideline_reference VARCHAR(160),
  contributor_message TEXT
);

CREATE TABLE rework_requests (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id),
  review_id UUID NOT NULL REFERENCES reviews(id),
  status VARCHAR(24) NOT NULL,
  due_at TIMESTAMPTZ,
  instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE quality_snapshots (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  project_id UUID REFERENCES projects(id),
  language_id UUID REFERENCES languages(id),
  task_type_id UUID REFERENCES task_types(id),
  metric_set JSONB NOT NULL,
  sample_count INTEGER NOT NULL,
  confidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_version VARCHAR(80) NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Metrics must identify scope, period, sample count, policy/version and calculation method. WER/CER normalization, NER matching, DER and timestamp tolerances are task-schema/project-policy specific. ASR disagreement is a signal, not ground truth.

### 4.10 Support, appeals, earnings and payouts

```sql
CREATE TABLE support_cases (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  case_type VARCHAR(24) NOT NULL,
  category VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  related_task_id UUID REFERENCES tasks(id),
  related_submission_id UUID REFERENCES submissions(id),
  related_assessment_attempt_id UUID REFERENCES assessment_attempts(id),
  related_ledger_entry_id UUID,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES support_cases(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  visibility VARCHAR(24) NOT NULL DEFAULT 'CONTRIBUTOR_VISIBLE',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_attachments (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES support_cases(id),
  object_key TEXT NOT NULL,
  content_type VARCHAR(120),
  size_bytes BIGINT,
  scan_status VARCHAR(24) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appeal_decisions (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES support_cases(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(32) NOT NULL,
  contributor_facing_reason TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rate_card_versions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  version_number INTEGER NOT NULL,
  currency CHAR(3) NOT NULL,
  rate_rules JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  UNIQUE(project_id, version_number)
);

CREATE TABLE earnings_ledger (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  submission_id UUID REFERENCES submissions(id),
  rate_card_version_id UUID REFERENCES rate_card_versions(id),
  entry_type VARCHAR(32) NOT NULL,
  amount_minor_units BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  status VARCHAR(32) NOT NULL,
  business_reference VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payout_methods (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  provider_token TEXT NOT NULL,
  method_type VARCHAR(32) NOT NULL,
  masked_details JSONB NOT NULL,
  status VARCHAR(24) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
  payout_method_id UUID NOT NULL REFERENCES payout_methods(id),
  amount_minor_units BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  status VARCHAR(32) NOT NULL,
  provider_reference VARCHAR(160),
  initiated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_code VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Support request types and formal appeals share case infrastructure, but have separate eligibility, evidence and adjudication policies. Internal messages must be access-controlled. Financial ledger entries must be append-only; corrections use reversal/adjustment entries rather than editing historical amounts.

### 4.11 Notifications, audit and outbox

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(48) NOT NULL,
  channel VARCHAR(24) NOT NULL,
  enabled BOOLEAN NOT NULL,
  UNIQUE(user_id, category, channel)
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(80) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  correlation_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(120) NOT NULL,
  aggregate_type VARCHAR(80) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0
);
```

Use an outbox for state changes that must reliably trigger background work or notification. Consumers must be idempotent.

## 5. API contracts by product area

All endpoints use `/api/v1`. Exact payload schemas should be implemented in Pydantic and versioned where client compatibility matters.

### 5.1 Authentication and onboarding

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/otp/send` | Send email/phone OTP |
| POST | `/auth/otp/verify` | Verify challenge |
| POST | `/auth/login` | Authenticate |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke current session |
| POST | `/auth/password/reset/request` | Request reset |
| POST | `/auth/password/reset/confirm` | Complete reset |
| GET/PUT | `/contributors/me` | Read/update contributor's personal profile |
| GET/PUT | `/contributors/me/languages` | Read/update language and proficiency profile |
| GET | `/contributors/me/onboarding` | Get onboarding progress and next action |
| POST | `/contributors/me/onboarding/complete` | Validate and complete onboarding gate |

OTP validation must be rate-limited, time-limited, single-use and bound to its purpose. A sign-up flow may route the user to onboarding only after configured verification gates are satisfied.

### 5.2 Profile and verification

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/contributors/me/profile-overview` | Profile overview summary |
| GET/PUT | `/contributors/me/personal-information` | Personal details |
| GET/PUT | `/contributors/me/languages` | Language/dialect/proficiency/task preferences |
| GET | `/contributors/me/qualifications` | Verified qualifications |
| GET | `/contributors/me/verifications` | Verification requirements and statuses |
| POST | `/contributors/me/verifications/{id}/documents/upload-url` | Issue short-lived private upload URL |
| POST | `/contributors/me/verifications/{id}/documents/complete` | Verify upload metadata and attach document |
| POST | `/contributors/me/verifications/{id}/resubmit` | Resubmit after action required |
| GET/PUT | `/contributors/me/account-settings` | Security and preferences |

Do not collect gender, religion, exact home address, DOB or other demographic data without a specific lawful and documented purpose. Such fields must not be used as proxies for language competence.

### 5.3 Assessment and qualification

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/assessments` | Assessment Center catalogue/recommendations |
| GET | `/assessments/{id}` | Assessment details and published policy summary |
| POST | `/assessments/{id}/readiness-checks` | Record actual readiness diagnostics |
| POST | `/assessments/{id}/attempts` | Create official attempt after confirmation |
| GET | `/assessment-attempts/{id}` | Resume attempt and retrieve server state |
| PUT | `/assessment-attempts/{id}/responses/{item_id}` | Versioned answer autosave |
| POST | `/assessment-attempts/{id}/submit-review` | Validate pre-submit state |
| POST | `/assessment-attempts/{id}/submit` | Finalize immutable attempt, idempotent |
| GET | `/assessment-attempts/{id}/evaluation` | Evaluation status and final result when ready |
| GET | `/contributors/me/qualifications` | Qualification history |
| POST | `/assessment-attempts/{id}/appeals` | Create eligible assessment appeal |
| POST | `/assessment-attempts/{id}/retakes` | Create eligible retake |

The attempt API response must not expose secure reference answers. The backend owns timer/deadline validation, attempt count, question form selection and outcome computation.

### 5.4 Project discovery, invitation, onboarding and certification

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/projects/opportunities` | Eligible invitations/recommended projects |
| GET | `/projects/{id}` | Project details according to participation state |
| POST | `/project-invitations/{id}/accept` | Accept invitation idempotently |
| POST | `/project-invitations/{id}/decline` | Decline invitation |
| GET | `/project-participations/{id}` | Participation/onboarding state |
| GET | `/project-participations/{id}/checklist` | Required onboarding steps |
| POST | `/project-participations/{id}/agreements` | Record agreement acceptance |
| GET | `/projects/{id}/training/modules` | Training curriculum |
| PUT | `/training/lessons/{id}/progress` | Persist lesson progress |
| POST | `/training/lessons/{id}/practice-attempts` | Practice-only submission |
| POST | `/project-participations/{id}/certification-attempts` | Start project certification when eligible |
| GET | `/project-participations/{id}/certification-status` | Certification state |
| GET | `/project-participations/{id}/allocation-status` | Ready/awaiting/active status |

A project participation API should calculate the single next action for the current state, but frontend must still handle errors and permissions. Training modules must not unlock before invitation acceptance if project policy requires acceptance first. Project activation requires all configured gates.

### 5.5 Production task dashboard and allocation

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/tasks/eligible` | Eligible task queue |
| GET | `/tasks/{id}` | Task details and claimability |
| POST | `/tasks/{id}/claim` | Atomic task claim/reservation, idempotent |
| POST | `/task-assignments/{id}/release` | Release if policy permits |
| POST | `/contributors/me/auto-claim-preferences` | Explicit opt-in auto-claim preferences |
| GET | `/contributors/me/task-summary` | Counts by task status |

Eligibility is checked server-side using account status, language-task qualification, project certification, project participation/activation, capacity and configured restrictions.

### 5.6 Annotation workspace and submission

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/task-assignments/{id}/workspace` | Fetch task, asset URL, guideline/schema versions |
| GET | `/task-assignments/{id}/draft` | Resume latest draft |
| PUT | `/task-assignments/{id}/draft` | Save versioned draft |
| POST | `/task-assignments/{id}/flags` | Flag task/clip/audio issue |
| DELETE | `/task-flags/{id}` | Resolve contributor flag when allowed |
| POST | `/task-assignments/{id}/submit` | Submit immutable version, idempotent |
| GET | `/submissions/{id}` | Submission status, feedback and rework detail |
| POST | `/submissions/{id}/rework` | Resubmit allowed corrections as new version |

Draft updates require expected version or ETag. A stale write returns `409 DRAFT_VERSION_CONFLICT` and must not overwrite newer work. Autosave UI must only display server-synced status after server acknowledgment.

### 5.7 Quality, performance, earnings and support

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/contributors/me/quality` | Scoped quality metrics and sample sizes |
| GET | `/contributors/me/performance` | Trends and recommendations |
| GET | `/contributors/me/earnings/summary` | Estimated/pending/approved/paid totals |
| GET | `/contributors/me/earnings/ledger` | Immutable ledger query |
| GET | `/contributors/me/payouts` | Payout history/status |
| POST | `/contributors/me/payout-methods` | Add payout provider token |
| PUT | `/contributors/me/payout-methods/{id}` | Change supported metadata/status |
| POST | `/support/cases` | Create support case or eligible appeal |
| GET | `/support/cases` | List contributor's cases |
| GET | `/support/cases/{id}` | Case details and visible messages |
| POST | `/support/cases/{id}/messages` | Reply/add information |
| POST | `/support/cases/{id}/attachments/upload-url` | Secure evidence upload |

Financial balance is computed from ledger entries; never accept client-supplied balance values. Support cases must be scoped to the authenticated contributor and expose only contributor-visible messages.


### 5.8 Training governance, screening and assessment analytics

| Method and path | Purpose | Access |
|---|---|---|
| `GET /training/modules/{id}/content` | Fetch only the published content version accessible to the contributor | Accepted project participation or configured public access |
| `GET /training/modules/{id}/progress` | Fetch module/lesson completion and exact content version | Own contributor record |
| `POST /training/lessons/{id}/practice-attempts` | Submit unscored practice response | Eligible contributor |
| `POST /training/lessons/{id}/complete` | Request lesson completion after configured evidence | Eligible contributor; server validates completion rules |
| `GET /training/lessons/{id}/guidelines` | Fetch approved guideline excerpts for the lesson | Access-class permission check |
| `POST /internal/training/content-versions/{id}/reviews` | Record SME/instructional QA review | Training owner/reviewer |
| `POST /internal/training/content-versions/{id}/publish` | Publish approved training version | Authorized training owner |
| `GET /internal/assessment-analytics/versions/{id}` | View assessment validity and item analytics | Assessment/quality manager |
| `GET /internal/assessment-analytics/items/{id}` | Inspect item-level statistics and exposure | Restricted assessment manager |
| `POST /internal/assessment-analytics/versions/{id}/validation-reviews` | Record content, pilot or release validation | Authorized expert/reviewer |
| `GET /internal/contributors/{id}/capability-evidence` | Inspect scoped evidence for screening/matching decisions | Authorized operations/quality roles |

Internal routes must use explicit permissions and audit events. Never return secure item references or gold answers to contributor-facing routes.

## 6. Critical domain service workflows

### 6.1 Signup and onboarding

1. Validate registration fields and password policy.
2. Create user with `PENDING_VERIFICATION`.
3. Create purpose-bound OTP challenge and dispatch notification asynchronously.
4. Verify OTP using a hashed code, attempt limit and expiry.
5. Mark contact verified; activate account only when required verification policy passes.
6. Create contributor profile in `NOT_STARTED` onboarding state.
7. Save personal details and language profile in separate steps.
8. Calculate required-field completion; optional fields do not block 100% completion.
9. Route to assessment center/required assessment based on onboarding and qualification rules.

Never calculate language proficiency from country, religion, gender or education. Those are not reliable proxies for language ability.

### 6.2 Assessment attempt creation and answer capture

1. Check contributor account and assessment eligibility.
2. Check remaining attempts and cooldown using server time.
3. Snapshot assessment version, form selection, duration, allowed resources, integrity policy and scoring rubric.
4. Create attempt and selected item set in a transaction.
5. Run the readiness screen checks and record actual results.
6. On explicit start, set `started_at` and `deadline_at` server-side.
7. Autosave each response as a versioned record.
8. Keep practice attempts isolated from official attempts.
9. At review/submit, reconcile all answer sync state, unanswered items and policy.
10. Final submit with idempotency key; lock attempt and create outbox event.

### 6.3 Assessment evaluation pipeline

1. Submission received and immutable attempt sealed.
2. Deterministic validation: schema, required response, Unicode/encoding validity, payload shape.
3. Automated evaluation: objective answers and configured language-specific metrics.
4. AI assistance: ASR comparison or quality model creates evidence/suggestions, not ground truth.
5. Integrity signals are combined with contextual evidence; isolated focus/network/device events are not automatic proof of cheating.
6. Human review is routed where mandatory, ambiguous or high-impact.
7. Final decision applies weighted score plus critical competency thresholds.
8. If qualified, create language/task or project-scoped qualification with evidence, version, issue/expiry rules.
9. If not qualified, display feedback, retake eligibility and appeal route according to policy.

### 6.4 Invitation acceptance and project onboarding

Acceptance service transaction:

1. Lock the invitation row.
2. Verify it belongs to the contributor and has not expired or been withdrawn.
3. Validate project is accepting participants and required hard eligibility is met.
4. Validate current project terms version.
5. Record acceptance and create/update unique project participation.
6. Create onboarding checklist from the project's current configuration.
7. Emit outbox event for notification and onboarding state update.
8. Return current participation state and next action.

Duplicate acceptance returns the existing accepted state rather than creating duplicate participation.

Training is unlocked only after acceptance if the project's policy requires it. Project-specific content access is permission-checked on every request.

### 6.5 Training and project certification

- Training module and lesson content reference a published guideline version.
- Lesson completion is evaluated by configured completion rules.
- Practice feedback is educational and does not issue credentials.
- Module completion unlocks next required module according to dependency graph.
- Once mandatory modules are completed, project certification becomes eligible.
- Project certification uses the shared assessment engine but a project-scoped blueprint and credential.
- Passing certification does not automatically allocate production tasks; allocation/activation remains a separate gate.

### 6.6 Task claim and capacity

The claim operation must be atomic.

For exclusive tasks, execute inside one transaction:

```sql
BEGIN;
SELECT id, task_status
FROM tasks
WHERE id = :task_id
FOR UPDATE;
-- Check AVAILABLE, project activation, contributor eligibility and capacity.
INSERT INTO task_assignments (...);
UPDATE tasks SET task_status = 'RESERVED'
WHERE id = :task_id AND task_status = 'AVAILABLE';
-- Verify one row changed; otherwise rollback.
COMMIT;
```

For parallel annotation, create explicit assignment slots with target count and uniqueness rules. Do not assume all task types are exclusive.

Reservation expiry is a scheduled, idempotent job. It must not expire an assignment while a valid submit is being committed.

### 6.7 Annotation draft, QA and submission

- Workspace loads task, signed asset access, exact guideline version and annotation schema version.
- Frontend renders schema-driven components; backend remains authoritative for validation.
- Draft service appends versioned snapshots or safely updates with optimistic concurrency.
- Final submit validates assignment ownership/status, deadline policy, schema and idempotency key.
- Insert immutable submission and outbox event in one transaction.
- Async workers run deterministic checks and configured AI signals.
- Quality policy routes to sample review, mandatory human review, rework or authorized approval.
- Review record stores reviewer, decision, rubric/guideline version, findings and timestamp.
- Rework creates a new submission version linked to prior findings.

### 6.8 Review and appeal

- Reviewers may access only authorized project queues.
- A reviewer cannot review their own annotation.
- Findings reference exact segment/offset/timestamp and guideline section where possible.
- Automated QA findings and human findings are labeled by source.
- Appeal case links to exact task/submission/assessment decision.
- Independent review is preferred for challenged reviewer decisions where staffing permits.
- Original decision remains immutable; appeal outcome is a separate record.
- An appeal does not automatically reset retake count or cancel a retake; policy must define interaction.

### 6.9 Earnings and payout

- Create an earning ledger entry only at the configured earning event (normally approval).
- Unique business reference prevents duplicate earnings.
- Rate card and terms version are stored with the entry.
- Pending, approved, processing, paid, failed, on-hold and reversed are different states.
- Payout provider confirmation, not frontend action, determines `PAID`.
- Corrections are reversal/adjustment ledger entries; do not edit posted financial history.

### 6.10 Training content publication and effectiveness workflow

1. Training owner drafts a module/lesson version and maps it to learning objectives, competencies and a guideline/schema version.
2. Domain SME reviews language correctness, dialect coverage, examples and answer validity.
3. Instructional/content QA reviews clarity, sequencing, accessibility and whether the exercise actually measures the objective.
4. Security/content owner assigns sample access class; verify rights, de-identification, download/replay policy and whether an example can be reused.
5. Authorized owner publishes an immutable version only after required review gates pass.
6. Contributor progress and practice attempts reference the exact published version.
7. Lesson completion service evaluates configured objective/exercise/acknowledgement requirements; page view or scroll is insufficient.
8. Analytics worker aggregates learning outcomes, subsequent certification and production outcomes by version/cohort.
9. Training owner reviews recurring errors and retires or revises content. Existing completion records remain tied to the version actually completed.

### 6.11 Contributor screening and production ramp

1. Verify the configured contact channel; do not equate OTP with identity or skill verification.
2. Save minimal profile and self-reported language/dialect/task-interest claims.
3. Run configured low-cost diagnostic when useful; record it as screening evidence, not a qualification.
4. Route to a practical assessment blueprint mapped to the contributor's claimed language/task scope.
5. Route low-confidence, ambiguous or high-impact cases to qualified human review.
6. Grant only the qualification scopes supported by finalized evidence.
7. After project acceptance, require versioned training and project certification where configured.
8. For new production contributors, apply a controlled initial batch/review policy if the project requires it.
9. Expand task access or reduce additional sampling only after the minimum evidence and authorized policy criteria are met.
10. Store the decision and evidence by scope; do not turn a temporary intervention into an unexplained global rank.

### 6.12 Assessment validity and item analytics workflow

1. Before publication, validate blueprint coverage against intended competencies and observable production tasks.
2. Record SME/content review, scoring rubric review, accessibility and security approval.
3. Pilot appropriate forms/items and capture cohort size, population characteristics relevant to language/task scope and known limitations.
4. Compute item-level diagnostics only for item types where the statistic is valid; retain attempts/scored denominators and uncertainty metadata.
5. Review low/negative discrimination, unusual omissions, timing and distractor patterns for leakage, ambiguity, miskeying or construct mismatch.
6. Evaluate rater agreement and adjudication for subjective audio/language tasks.
7. After contributors produce reviewed work, link assessment version/competency evidence to comparable production outcomes.
8. Analyze predictive relationships while documenting selection effects, project/task differences, training exposure and small-sample limitations.
9. Make a versioned decision: retain, revise, monitor or retire items/assessment form. Keep old attempt results tied to the original version.

No automatic assessment pass/fail threshold or item-retirement decision should be derived solely from one statistical metric.


## 7. Annotation payload contracts

### 7.1 Speech transcription and segmentation

```json
{
  "schema_version": 3,
  "transcript": "मैं कल दिल्ली जाऊँगा।",
  "segments": [
    {
      "segment_id": "seg_001",
      "start_ms": 0,
      "end_ms": 850,
      "text": "मैं कल",
      "speaker_id": "speaker_1",
      "labels": []
    },
    {
      "segment_id": "seg_002",
      "start_ms": 850,
      "end_ms": 1800,
      "text": "दिल्ली",
      "speaker_id": "speaker_1",
      "labels": [{"type": "NAMED_ENTITY", "value": "LOCATION"}]
    }
  ],
  "speakers": [{"speaker_id": "speaker_1", "description": null}],
  "flags": []
}
```

Validation depends on task schema: start < end; offsets within audio duration; speakers exist if diarization is enabled; tags belong to allowed vocabulary; overlap follows configured policy; unintelligible segments use configured labels rather than guessed speech.

### 7.2 Text NER

```json
{
  "schema_version": 2,
  "source_text": "OpenAI was founded in 2015.",
  "annotations": [
    {"start": 0, "end": 6, "text": "OpenAI", "label": "ORGANIZATION"},
    {"start": 22, "end": 26, "text": "2015", "label": "DATE"}
  ]
}
```

Offsets and overlap policy must match project schema. Verify the selected source substring against the submitted text using the declared normalization policy.

### 7.3 Classification

```json
{
  "schema_version": 1,
  "source_text": "The delivery was excellent.",
  "labels": [{"category": "SENTIMENT", "value": "POSITIVE"}]
}
```

Contributor-reported confidence is optional and is not a ground-truth confidence value.

## 8. Quality metric implementation rules

- **WER/CER:** record normalization policy/version, tokenizer or character handling, reference version and sample count. Dialect variants and accepted alternatives must be defined by experts.
- **NER:** declare exact-match or overlap matching, entity label mapping, micro/macro aggregation and overlap policy.
- **Diarization:** record speaker mapping policy and DER components (miss, false alarm, speaker error) where relevant.
- **Timestamp:** record onset/offset tolerance, time base and alignment method.
- **Classification:** record class balance, accuracy and macro-F1 when appropriate.
- **Gold tasks:** version gold reference, expert-verification status and exposure controls.
- **Human review:** store reviewer rubric, calibration, reviewer identity and adjudication evidence.

Quality snapshots are scoped by project, language, dialect where relevant and task type. Each snapshot includes sample count, evaluation period, policy version and confidence/uncertainty metadata. High-impact restrictions require policy-based sample thresholds and authorized human review.



### 8.1 Assessment and training quality analytics

Assessment analytics must be tied to an immutable assessment version and competency blueprint.

- **Blueprint coverage:** percent/weight of target competencies represented by valid assessment evidence. Coverage is a content-design check, not proof of validity by itself.
- **Difficulty (`p`):** correct responses divided by scored responses for suitable objectively scored items. Define omission handling and exclude unscored/invalid attempts according to policy.
- **Discrimination:** use an appropriate item-total or group comparison statistic; retain sample size and uncertainty. Negative or weak values trigger expert investigation, not automatic deletion.
- **Distractor analysis:** report selection frequency and whether distractors function plausibly for objective items.
- **Reliability:** choose an approach appropriate to item structure; report its assumptions and sample size. For subjective transcription/rubric scores, analyze inter-rater agreement and adjudication rather than applying a generic internal-consistency statistic blindly.
- **Form comparability:** compare competency coverage, score distribution and item difficulty across equivalent forms. Do not claim equivalent difficulty without evidence.
- **Predictive relationship:** compare assessment evidence with subsequent reviewed production quality for comparable language/dialect/task/rubric. Report cohort count, outcome count, time window, confounders and uncertainty. Correlation does not establish causation.
- **Fairness diagnostics:** inspect relevant cohort-level completion, item behavior, pass and downstream outcomes where lawful, necessary and sufficiently aggregated. Do not use protected traits as qualification proxies.

Training effectiveness analytics should include content version, cohort size, completion, practice outcomes, subsequent certification and production outcomes. A before/after change is not automatically causal; document the comparison method and limitations.

### 8.2 Sample and exposure governance

Every sample/reference must carry an access class, owner/project scope, rights/de-identification state, guideline/schema version, permitted use, retention rule and exposure history. A practice clip must not silently become a secure certification item after its answer has been shown. Item/sample reuse requires exposure review and, where necessary, retirement or re-annotation by experts.

## 9. Background jobs and event handling

| Queue | Job | Idempotency key / retry behavior |
|---|---|---|
| `media` | Inspect uploaded media, duration, checksum, conversion | Asset ID + processing version; bounded retries |
| `assessment` | Evaluate objective responses | Attempt ID + evaluation version |
| `quality` | Schema validation and quality metrics | Submission ID + policy version |
| `quality` | ASR/AI comparison | Submission ID + provider/model/config version |
| `exports` | Dataset assembly and provenance report | Project ID + dataset version |
| `notifications` | Email/SMS/in-app dispatch | Event ID + destination + template version |
| `finance` | Payout initiation/reconciliation | Payout ID + provider idempotency reference |
| `maintenance` | Reservation/attempt expiry | Record ID + expiry version |
| `training` | Validate training content publication gates and guideline/schema references | Content version ID + review policy version |
| `training` | Calculate cohort learning and post-training effectiveness snapshots | Content version ID + cohort window |
| `assessment` | Calculate item analytics and assessment-version diagnostics | Assessment version + pilot run ID |
| `assessment` | Generate exposure summaries and flag item reuse review | Item ID + exposure policy version |
| `quality` | Generate error taxonomy trends and recommend configured interventions | Scope + quality snapshot version |
| `quality` | Link finalized assessment evidence to later eligible production outcomes | Contributor + assessment version + outcome window |

Transient failures retry with bounded backoff. Permanent failures are recorded and routed to an operational queue. Dead-letter visibility and safe retry tooling are required.

## 10. Security, privacy and authorization controls

### 10.1 Authentication and account security

- Password hashing with a reviewed password-hashing scheme and parameters.
- Short-lived access tokens and refresh-token rotation/revocation.
- Rate-limited OTP and login attempts.
- Session/device management with revoke capability.
- Reauthentication for sensitive payout/security changes.
- No secrets in logs, analytics events or browser-visible configuration.

### 10.2 Authorization

Use centralized permission checks in routes and domain services. Example:

```python
require_permission(
    actor=current_user,
    permission="submission.review",
    organization_id=project.organization_id,
    project_id=project.id,
)
```

Frontend route guards are usability aids, not security controls. Every deep link and API request is re-authorized. Contributors can read only their own records; clients cannot read private contributor data or internal reviewer notes; reviewers are scoped to permitted projects/queues.

### 10.3 Sensitive data and documents

- Private object buckets by default.
- Short-lived signed URLs.
- MIME, size and checksum verification.
- Malware scanning for uploads.
- Access logging for sensitive documents where appropriate.
- Encryption and retention according to policy.
- Mask payout and tax identifiers in API responses.
- Separate legal name from display name.
- Do not collect religion or unrelated demographic fields for contributor matching.

### 10.4 Proctoring and integrity

- Disclose collection before the assessment.
- Obtain explicit consent for video/audio recording when required.
- Do not enable camera/microphone for an assessment that does not require it.
- Store purpose, policy version, consent timestamp and retention rules.
- Use browser focus/network/device events as contextual signals only.
- No covert keystroke logging, private browsing history or unrelated device surveillance.
- No automatic cheating verdict from one weak signal.
- Provide human review and appeal for adverse decisions.


### 10.5 Anti-gaming and sample access controls

- Keep account/contact, identity, assessment integrity, capability and production quality as separate evidence domains.
- Record assessment item exposure and prevent secure item/reference leakage in contributor serializers, logs and analytics endpoints.
- Record sample asset access class and grant; enforce on every media URL request.
- Use separate identifiers/content pools for public demo, project preview, training, practice, certification and gold QA where feasible.
- Use versioned equivalent assessment forms and exposure-aware item selection.
- Similarity, shared IP/device, focus events, timing anomalies or AI detections create investigation signals only; combine relevant evidence and route adverse decisions to authorized human review.
- Store integrity case disposition, evidence references, reviewer, policy version and appeal state. Minimize retention and restrict access.
- Apply production quality sampling and gold-task rotation to detect drift without making gold answers predictable.
- Detect reservation/claim abuse and suspicious earning patterns through auditable business events; do not let client-side state alter allocation or finance records.
- Keep investigation details and secure benchmarks hidden from contributor APIs; provide an understandable outcome and appeal channel where a decision affects the contributor.

## 11. Frontend route and component organization

```text
src/
  app/
    public/
    auth/
    contributor/
      dashboard/
      profile/
        overview/
        personal-information/
        languages-skills/
        verification-documents/
        account-settings/
      assessments/
        center/
        details/
        readiness/
        instructions-practice/
        workspace/
        review-submit/
        evaluation-status/
        results/
        retake-appeal/
      projects/
        opportunities/
        details/
        training/
        certification/
        participation-status/
      tasks/
        queue/
        workspace/
        submission-details/
        quality-performance/
      earnings/
      support/
  features/
    audio-player/
    waveform/
    transcript-editor/
    annotation-schema-renderer/
    assessment-timer/
    autosave/
    task-state/
    quality-feedback/
    earnings-ledger/
    support-cases/
  components/
    layout/
    navigation/
    data-table/
    status/
    forms/
  services/
  hooks/
  types/
```

Use a shared application shell and design tokens. Keep role-specific routes separate from contributor routes. A screen that renders multiple lifecycle states should derive its state from backend records and display only actions authorized for that state.

## 12. Error handling and recovery matrix

| Scenario | Required behavior |
|---|---|
| OTP invalid/expired | Explain, rate-limit, resend according to policy |
| Profile optional fields missing | Allow completion if mandatory fields are satisfied |
| Assessment readiness check fails | Explain exact requirement and allow retry/approved accommodation |
| Browser refresh during assessment | Restore server-confirmed attempt and responses |
| Network loss while editing | Preserve local pending draft; reconcile by version; do not claim server save |
| Assessment timer expires | Apply published attempt policy; submit saved answers or expire; notify clearly |
| Duplicate assessment submit | Return same result for same idempotency key |
| Invitation expired | Disable acceptance, preserve history, show other opportunities |
| Project full before acceptance | Return conflict and explain; do not create partial participation |
| Training opened before acceptance | Deny restricted content, show acceptance prerequisite |
| Guideline version changes | Preserve old version; require acknowledgment/retraining if policy says so |
| Task claimed by another user | Return 409 and refresh queue |
| Claim reservation expires | Release only through safe state transition |
| Save conflict from another tab | Return version conflict; offer recover/compare, never silently overwrite |
| Audio fails | Allow retry/flag; do not penalize source defect |
| QA flags a submission | Show warning/review state; not equivalent to rejection |
| Rework requested | Show exact segments/findings/deadline and reopen allowed work |
| Reviewer disagreement | Escalate to adjudicator and retain both review records |
| Appeal accepted | Update result through a new decision/evaluation record; preserve original |
| Payout provider timeout | Reconcile provider status before retry; avoid duplicate transfer |
| Account suspended | Block new claims, preserve records and show support route |

## 13. Testing strategy

### 13.1 Unit tests

- Proficiency/qualification separation.
- Assessment scoring and threshold rules.
- WER/CER normalization and variant handling.
- NER span matching and overlap.
- Timestamp boundary validation.
- Task eligibility and capacity policy.
- Project next-action/CTA state derivation.
- Lesson completion rules.
- Ledger calculations and idempotency.
- Support/appeal eligibility and case visibility.

### 13.2 Integration tests

- Registration → OTP → onboarding → profile → assessment.
- Assessment readiness → instructions/practice → official attempt → result/qualification.
- Project opportunity → details → accept → training → project certification → allocation.
- Task claim → draft → annotation → submission → QA → human review → approval/rework.
- Approved work → earning ledger → payout reconciliation.
- Contextual support case from task/submission/assessment/transaction.

### 13.3 Concurrency and reliability tests

- Two contributors claim same exclusive task.
- Concurrent invitation acceptance.
- Duplicate submission POST.
- Two tabs save same draft.
- Timer expiry during submission.
- Retry outbox event after worker crash.
- Duplicate ledger posting.
- Duplicate payout provider callback.

### 13.4 Security tests

- Cross-tenant project access.
- Contributor reads another contributor's profile/assessment/earnings.
- Client reads private identity document or reviewer note.
- Reviewer reads unauthorized project.
- Expired/reused signed URL.
- Unauthorized payout-method update.
- Privilege escalation through role switch or direct API call.

### 13.5 Product acceptance tests

- A contributor can understand the next action at each onboarding/project/assessment state.
- A contributor can distinguish profile completion, verification, platform qualification and project certification.
- A contributor can recover an annotation after network interruption.
- A contributor can see exactly why a submission requires rework.
- A contributor can dispute a decision without seeing confidential benchmark answers.
- Earnings reconcile to approved task records and payout confirmation.


### 13.6 Training quality, screening and assessment validity tests

- Training module cannot publish without configured SME/content QA approvals.
- Training version records exact guideline/schema and objective mapping.
- Contributor completion remains attached to the version actually completed after a new version is published.
- Lesson completion cannot be forged by page view or scroll alone.
- Practice response does not consume official assessment attempts or reveal secure certification answers.
- Sample asset access is denied outside its access class, participation and expiry rules.
- Secure assessment/gold references never appear in contributor APIs, browser bundles or logs.
- Screening diagnostic does not create a qualification unless a separately configured assessment policy says so.
- Capability evidence remains scoped by language/dialect/task type and source.
- Item analytics denominators, omitted responses and scoring eligibility are tested.
- Low-sample item statistics are labelled insufficient/uncertain and cannot automatically retire an item.
- Human-rated tasks include rater agreement/adjudication evidence.
- Assessment-to-production analytics compare only eligible comparable scopes and retain sample counts and limitations.
- Training effectiveness snapshots identify content version, cohort and comparison method.
- Anti-gaming signals alone cannot automatically cause an adverse contributor decision.
- Quality interventions are authorized, scoped, auditable and appealable where required.

## 14. Implementation sequence

1. Identity, OTP, sessions, RBAC and route protection.
2. Contributor onboarding and profile domain.
3. Language/dialect/proficiency and verification domain.
4. Assessment blueprint, attempt, readiness, evaluation and qualifications.
5. Project catalogue, invitations and participation state.
6. Training curriculum, learning objectives, SME/instructional QA, sample access classes and practice progress.
7. Project certification integration.
8. Task queue, claim/reservation and capacity.
9. Annotation workspace, schema renderer and autosave.
10. Immutable submission, QA worker, reviewer and rework workflows.
11. Performance analytics and quality intervention.
12. Earnings ledger, payout tracking and reconciliation.
13. Support cases and formal appeals.
14. Operations/client workflows, dataset export and delivery.
15. Training effectiveness, assessment item analytics and assessment-to-production validation.
16. End-to-end, security, concurrency and pilot validation.

## 15. Open implementation decisions

The following values must be approved before production; they should remain policy/configuration, not hardcoded UI assumptions:

- Email, phone and identity verification requirements by country/project.
- Mandatory versus optional personal profile fields.
- Assessment attempt limits, cooldowns, duration and approved accommodations.
- Proctoring modes, recording scope, consent and retention.
- Assessment pass thresholds, critical competency floors and human-review rules.
- Accepted dialect spellings, normalization and verbatim policy.
- Invitation expiry and reservation duration.
- Exclusive versus multi-annotator tasks.
- Training completion and module dependency rules.
- Project certification validity/reassessment policy.
- Auto-claim policy and contributor capacity limits.
- QA sample rate, gold-task frequency and mandatory human-review criteria.
- Rework attempts, deadlines, rejection and appeal policy.
- Compensation unit, earning event, adjustment rules and payout schedule.
- Data retention, deletion, export and client access policy.
- Minimum sample sizes and confidence requirements for performance interventions.

## 16. Definition of done

The LLD is considered implemented for the initial contributor pilot when:

1. Contributor can register, verify contact channel and complete the two onboarding steps.
2. Self-reported language details remain distinct from verified capabilities.
3. Contributor can complete a platform assessment and receive an evidence-backed result.
4. Contributor can review project opportunities, accept an invitation and complete project onboarding.
5. Training and project certification gates are enforced server-side.
6. Contributor can claim a valid task, annotate it and recover drafts after interruption.
7. Submission is immutable and linked to source asset, task, contributor, schema and guideline versions.
8. Automated QA provides signals and human review decisions are auditable.
9. Contributor can see feedback, complete rework and submit a dispute/appeal.
10. Approved work generates auditable earnings and payout state transitions.
11. Quality analytics are scoped, sample-aware and traceable to evidence.
12. Support cases are linked to relevant records and access-controlled.
13. Cross-tenant and cross-contributor access tests pass.
14. Full end-to-end pilot succeeds with normal and failure/recovery paths.
15. Mandatory training content has published version, learning-objective mapping and required review approvals.
16. Sample assets are access-classified; public preview, project training, practice, secure assessment, gold and production assets have enforced permissions.
17. Contributor screening evidence is separate from self-reported profile data and does not use demographic proxies.
18. Assessment versions have competency coverage and documented content/security approval; analytics are labelled with sample size and limitations.
19. Pilot review compares training/certification outcomes and assessment evidence with subsequent comparable production quality where sufficient evidence exists.
20. Integrity signals and production anomalies cannot create automatic adverse decisions without the configured review process.

