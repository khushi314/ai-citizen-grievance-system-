# Autonomous Backend Controller Blueprint

This document defines the system architecture and operational pipeline for the AI Controller of the **Unified Citizen Portal**. The AI operates as the primary server-side automation layer orchestrating ingestion, routing, and verification.

---

## 1. Core Architecture Overview
The portal is designed around a three-tier server architecture that utilizes **Firebase Firestore** as the central event bus and persistent state repository, and **Gemini AI (gemini-3.5-flash)** as the decision and intelligence engine.

```
       +--------------------------------------------------------+
       |                  Citizen Web Portal /                  |
       |                WhatsApp Webhook Ingestion              |
       +----------------------------+---------------------------+
                                    |
                                    v (Payload: Audio/Image/Text)
       +----------------------------+---------------------------+
       |             Express Server Backend (server.ts)         |
       +----------------------------+---------------------------+
                                    |
            +-----------------------+-----------------------+
            | AI Processing Loop                            | Firestore Read/Write
            v                                               v
+-----------------------+                       +-----------------------+
|  Gemini AI (3.5)      |                       |  Cloud Firestore DB   |
|  - Multimodal Class.  |                       |  - Complaints         |
|  - Routing Engine     |                       |  - Verification Logs  |
|  - Fraud Check        |                       |  - Mitra Chat History |
+-----------------------+                       +-----------------------+
```

---

## 2. Ingestion Pipeline
The controller acts as an event-driven listener for incoming citizen reports from both the frontend React application and external WhatsApp simulator hooks.

### 2.1 Multimodal Ingestion (Audio, Video, Image)
1. **Source Capture:** Users record voice memos, snap live photos of issues, or upload files.
2. **Payload Envelope:** Payloads are serialized as Base64 strings along with standard MIME types and sent to the Express API (`/api/complaints/submit`).
3. **MIME Processing:** The Express server acts as a proxy, packaging the payload into Google GenAI-compliant multipart envelopes:
   - **Audio Memos:** Converted into raw PCM (16kHz, 16-bit) or standard audio formats and classified for structural details.
   - **Visuals (Images/Frames):** Handled as direct image attachments.

---

## 3. Decision Engine Matrix (Routing Routing & Priority)
The routing engine acts as an autonomous sorting operator.

1. **Content Extraction:** The AI processes the citizen's description or transcribes voice input.
2. **Classification:** It invokes `multimodalPayloadClassifier` to identify:
   - **Category:** Matches strictly to one of the 9 civic categories.
   - **Severity:** Evaluates the level of danger (e.g., Uncovered Manholes = "High", Broken Streetlight = "Medium", Sanitation = "Low").
   - **Summary:** Condenses the issue into a clear, concise headline.
3. **Database Injection:** Inserts the parsed metadata directly into Firestore.
4. **Officer Queue Distribution:**
   - Evaluates active officers in the matching Department and Jurisdiction.
   - Triggers a real-time reactive update in the matching officer's dashboard queue via a Firestore listener.

---

## 4. Supervisor Role (Anti-Fraud and Resolution Inspector)
To ensure the integrity of the resolution process, the AI acts as an independent auditor when an officer claims a task is solved.

1. **Resolution Upload:** The officer uploads a post-resolution verification photo (taken via live camera or gallery upload).
2. **GPS Extraction & Cross-Reference:**
   - The system executes the `imageMetadataExtractionAndVerification` pipeline.
   - Extracts EXIF GPS coordinates embedded within the upload.
   - Calculates the distance (Haversine formula) between the resolution image coordinates and the original complaint's registration coordinates.
3. **Automated Approval/Flagging:**
   - **Match (Radius <= 150 meters):** The AI automatically marks the task as `Resolved` and credits the officer.
   - **Mismatch (Radius > 150 meters or no GPS data found):** The submission is marked as `Flagged: Verification Failed`, and an administrative alarm is raised in the Administrative Dashboard.
