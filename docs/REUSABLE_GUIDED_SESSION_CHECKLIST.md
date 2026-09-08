# Reusable Guided Session implementation checklist

This checklist defines a cross-product capability for scheduled, realtime, agent-assisted sessions. **Hrive owns the interview-specific business workflow.** Obsi Calendar, Obsi Chat, Outborn AI, Outborn Core and identity integrations remain domain-neutral so the same capability can support onboarding, coaching, assessments, consultations, support calls, training, customer discovery and other guided meetings.

## Architecture boundaries

- [ ] Hrive: own interview templates, interview rounds, candidate association, rubrics, evidence review and hiring decisions.
- [ ] Obsi Calendar: expose generic scheduled-session booking, availability, reschedule/cancel and reminders.
- [ ] Obsi Chat: expose generic realtime session rooms, guests, media capabilities, recording/transcript artifacts and agent participants.
- [ ] Outborn AI: run an existing Agent Profile with ephemeral session context; do not create an interview-specific agent type.
- [ ] Outborn Core: define reusable cross-app session references, lifecycle events, correlation/idempotency metadata and artifact contracts.
- [ ] Identity: use short-lived generic guest/session claims rather than candidate-specific account concepts.

## Shared contract

- [ ] Define `GuidedSessionRef`, `SessionSourceRef`, `AgentProfileRef`, `SessionParticipant`, `SessionCapability` and `SessionArtifact` contracts.
- [ ] Define lifecycle events: created, scheduled, rescheduled, ready, started, participant joined/left, artifact ready, completed, cancelled and failed.
- [ ] Include `correlationId`, `idempotencyKey`, `sourceApplication`, opaque `sourceEntityType/sourceEntityId` and extensible metadata.
- [ ] Keep source-domain data opaque outside the source application.

## Obsi Calendar

- [ ] Add generic scheduled-session metadata to bookings/events without interview-specific fields.
- [ ] Add create/get/reschedule/cancel scheduled-session APIs.
- [ ] Support participant availability and self-booking links.
- [ ] Allow a generic external realtime-room URL/provider to be attached and updated.
- [ ] Emit lifecycle metadata suitable for webhook/event consumers.
- [ ] Expose the capability in Calendar SDK.
- [ ] Expose the capability in Calendar MCP.

## Obsi Chat

- [ ] Add generic session-room contract and source references.
- [ ] Support short-lived guest room access.
- [ ] Support room configuration: waiting room, device check, recording, transcript, screen share, chat and private host tools.
- [ ] Support an AI participant by generic Agent Profile reference.
- [ ] Keep AI/profile runtime context opaque to Chat.
- [ ] Expose session room create/get/update/end through SDK.
- [ ] Expose session room operations through MCP.
- [ ] Return artifacts/events through a reusable contract.

## Outborn AI

- [ ] Add generic Agent Profile runtime-session request using an existing profile ID.
- [ ] Accept ephemeral context, capability/tool policy, output schema and source/session references.
- [ ] Do not persist source-domain context into the Agent Profile by default.
- [ ] Support realtime participant/session bindings without interview-specific behavior.
- [ ] Emit structured runtime lifecycle/output events.

## Outborn Core / identity

- [ ] Add reusable guided-session contract/types.
- [ ] Define generic guest-session claims and consent/audit metadata.
- [ ] Keep guest access scoped to application + session + capabilities + expiry.
- [ ] Document service-to-service correlation and idempotency expectations.

## Hrive interview specialization

- [ ] Add Interview Template with question plan, competencies/rubric, duration, policy and optional Agent Profile.
- [ ] Add Interview Session with candidate, position, round, panel, schedule, Calendar ref and Chat room ref.
- [ ] Support HUMAN, AI and HUMAN_WITH_AI modes.
- [ ] Add schedule/reschedule/cancel orchestration through generic Calendar capability.
- [ ] Provision/join the generic Obsi Chat session room.
- [ ] Pass interview context at runtime to the selected Outborn AI Agent Profile.
- [ ] Store transcript/recording references, structured evidence and human-reviewed scorecard.
- [ ] Add consent, audit trail and retention metadata.
- [ ] Add candidate self-scheduling/join journey and interviewer review journey.
- [ ] Keep final hiring decisions human-owned in Hrive.

## Reliability and security

- [ ] Make create/update operations idempotent.
- [ ] Ensure failure of AI/transcription does not terminate the underlying video session.
- [ ] Add least-privilege guest/session scopes and expiration.
- [ ] Avoid biometric/emotion/appearance/accent inference for candidate evaluation.
- [ ] Require evidence-linked human review before AI suggestions become final interview scores.
- [ ] Add validation/tests for contracts and critical lifecycle transitions.
