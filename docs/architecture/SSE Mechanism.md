# HRI SSE Real-time Mechanism

HRI uses **Server-Sent Events (SSE)** to provide real-time updates to recruiters without requiring page refreshes.

---

## 🛰️ Real-time Data Flow

The system uses a tiered architecture to manage connections, broadcast events, and optimize performance.

```mermaid
sequenceDiagram
    participant UI as Browser (React/Client)
    participant API as Next.js API / SSE Route
    participant Hub as SSE Hub (realtime.ts)
    participant Opt as Optimizer (aggressive-sse-optimizer.ts)
    participant App as App Logic (SimpleBroadcaster)

    %% Connection Phase
    UI->>API: GET /api/realtime (EventSource)
    API->>Hub: subscribe(request)
    Hub-->>UI: Connected! (Retry config + 30s Keepalive)

    %% Event Trigger Phase
    Note over App: Recruiter updates a applicant
    App->>Opt: broadcastHighPriority('applicant_update', data)
    
    %% Optimization Phase
    Note over Opt: Batch events / Apply Throttling
    Opt->>Hub: broadcast(optimizedData)
    
    %% Delivery Phase
    Hub-->>UI: data: {"type": "applicant_update", ...}
    Note over UI: UI updates via useRealtime Hook
```

---

## 🛠️ Implementation Layers

### 1. Connection Hub (`realtime.ts`)
- **State**: Maintains a global `Set` of active HTTP response controllers.
- **Keepalive**: Sends a heartbeat every 30 seconds to keep proxy connections (like Nginx) alive.
- **Cleanup**: Automatically removes stale or aborted connections to prevent memory leaks.

### 2. Event Optimization (`aggressive-sse-optimizer.ts`)
To prevent overwhelming the browser and server during high activity, an optimization layer is used:
- **Throttling**: Caps global event output at **20 events per second**.
- **Priority Batching**:
  - **High**: Sent immediately (e.g., deletions, new applicants).
  - **Medium**: Delayed by ~200ms (e.g., minor data updates).
  - **Low**: Delayed by ~1s (e.g., background metadata).
- **Deduplication**: If multiple updates for the same entity occur within a window, only the latest state is sent.

### 3. Application Link (`simple-broadcaster.ts`)
- Provides clean, semantic functions for the rest of the app:
  - `broadcastapplicantStatusChanged()`
  - `broadcastPositionCreated()`
  - `broadcastNotification()`
  - `broadcastUploadStarted()`

---

## 🔑 Key Features
- **Efficiency**: Uses a single persistent HTTP connection per user.
- **Reliability**: Implements standard SSE protocol with automatic browser reconnection.
- **Smart Tracking**: Integrates with a `data-change-tracker` to ensure updates are only sent if the data has actually changed.
- **Proxy Friendly**: Uses `X-Accel-Buffering: no` and identity encoding to work seamlessly through Nginx and Kubernetes Ingress.

---

## 📋 Common Event Types

| Event Type | Typical Payload |
| :--- | :--- |
| `applicant_update` | Updated applicant object + `action` (e.g., "status_changed") |
| `position_update` | Position details + `action` (e.g., "created") |
| `notification` | `message`, `level` (info/warn/error), `timestamp` |
| `upload_queue_update` | `fileName`, `status` (processing/completed/failed) |
| `dashboard_update` | `type: "refresh"` (triggers UI to fetch fresh stats) |
