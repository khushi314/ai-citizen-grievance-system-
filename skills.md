# Automated AI Backend Capabilities Definition

This file defines the exact function signatures, input arguments, and structured schema definitions for the Gemini AI subsystems integrated into the Unified Citizen Portal.

---

## 1. Multimodal Payload Classifier
Processes raw text messages, voice memos, or images to categorize the civic complaint.

- **Model Alias:** `gemini-3.5-flash`
- **Mime Output:** `application/json`

### Structured Schema Definition
```typescript
interface MultimodalPayloadResponse {
  category: "Waste Management" | "Potholes" | "Broken Streetlights" | "Sanitation Related" | "Road Related" | "Damaged Bridges" | "Blocked Drains" | "Uncovered Manholes" | "Water Leakage";
  severity: "High" | "Medium" | "Low";
  summary: string; // A 1-sentence descriptive title/summary
  details: string; // Detailed description parsed or transcribed from the input
}
```

### JSON Schema configuration passed to Google GenAI
```json
{
  "type": "OBJECT",
  "properties": {
    "category": {
      "type": "STRING",
      "enum": [
        "Waste Management",
        "Potholes",
        "Broken Streetlights",
        "Sanitation Related",
        "Road Related",
        "Damaged Bridges",
        "Blocked Drains",
        "Uncovered Manholes",
        "Water Leakage"
      ]
    },
    "severity": {
      "type": "STRING",
      "enum": ["High", "Medium", "Low"]
    },
    "summary": {
      "type": "STRING",
      "description": "A brief, highly specific summary of the incident (e.g., 'Flooded intersection due to burst pipeline')."
    },
    "details": {
      "type": "STRING",
      "description": "Full details extracted or transcribed from the user's voice message, text, or visual."
    }
  },
  "required": ["category", "severity", "summary", "details"]
}
```

---

## 2. Automatic Department Routing Engine
Dynamically determines the appropriate officer routing queue based on jurisdiction matching.

- **Input:** Complaints state updates and the list of active departmental officers.
- **Rule Matrix:**
  - Map incoming categories strictly to the respective Department:
    1. Category `Waste Management` -> Department: `Waste Management`
    2. Category `Potholes` -> Department: `Roads & Infrastructure`
    3. Category `Broken Streetlights` -> Department: `Electrical Department`
    4. Category `Sanitation Related` -> Department: `Sanitation Department`
    5. Category `Road Related` -> Department: `Roads & Infrastructure`
    6. Category `Damaged Bridges` -> Department: `Roads & Infrastructure`
    7. Category `Blocked Drains` -> Department: `Sanitation Department`
    8. Category `Uncovered Manholes` -> Department: `Water & Sewage`
    9. Category `Water Leakage` -> Department: `Water & Sewage`
  - Matches the complaint's coordinates or textual area (e.g., "Ward 4") to the officer registered for that Jurisdiction.
- **Trigger:** Changes are written directly to the target Firestore document, updating the field `assignedOfficerId`, `assignedDepartment`, and status to `Dispatched`.

---

## 3. Image Metadata Extraction and Verification (Anti-Fraud)
Parses post-resolution uploaded photos and verifies their structural integrity and spatial authenticity against the original registration coordinates.

- **Input:** Post-resolution image payload (Base64) + original issue location `{ latitude: number, longitude: number }`.
- **System Instruction:**
  > "Extract any embedded geolocation, timestamps, or exif details available inside this image. Compare them to the registered coordinates. If EXIF geolocation matches within approximately 150 meters, return authentic true. If EXIF metadata is missing or location mismatch exceeds 150m, return authentic false."
- **Fallback Verification:** If the browser strip metadata blocks direct binary coordinates, or when the user uploads a direct gallery image, the AI conducts an architectural context analysis (visual semantic verification matching the background elements of the original vs resolution image) to confirm authenticity.

### Structured Schema Definition
```typescript
interface ExifVerificationResponse {
  authentic: boolean;
  distanceMeters: number | null;
  exifCoords: {
    latitude: number;
    longitude: number;
  } | null;
  reason: string; // Explanation of the validation decision
}
```
