# 🏛️Unified Citizen Redressal & Smart Governance Platform

(Mechanism for Intelligent Tracking and Resolution Architecture) is a Next-generation AI-powered Unified Platform designed to eliminate traditional, fragmented complaint systems and bring citizens and government authorities into a single cohesive ecosystem. Citizens no longer need to navigate multiple departmental portals or report issues across fragmented channels—any civic grievance can now be reported **"From Anywhere, At Any Time."**

---

## 🚀 Live Links & Demonstration

🔗 **Live Deployment Link: https://ai-citizen-grievance-system-k15bgcr7l-khushi-mitra.vercel.app 
🎬 **Project Video Demonstration:** [PASTE_YOUR_VIDEO_CLIP_LINK_HERE]

---

## 📸 Platform Walkthrough & Screenshots

### 👥 1. Unified Citizen Portal
Citizens can seamlessly lodge complaints along with video or photo evidence without filling out complex forms. The AI core handles everything automatedly at the backend.
![Citizen Dashboard]([PASTE_CITIZEN_PAGE_SCREENSHOT_LINK_HERE])

### 📊 2. Admin Real-Time Tracking Map (Red & Green Dots)
The comprehensive admin dashboard features a dynamic map displaying real-time issues across the jurisdiction:
* 🔴 **Red Dots:** Pending / High-Priority Issues.
* 🟢 **Green Dots:** Successfully Resolved Issues.
![Admin Live Map]([PASTE_ADMIN_MAP_SCREENSHOT_LINK_HERE])

---

## 🔥 Key & Unique Features

### 1. 📲 Unified Citizen Experience
* **Report from Anywhere:** Replaces fragmented legacy portals with a single, unified interface where any civic issue can be reported instantly.
* **Rich Media Support:** Supports attaching audio/video evidence. (Note: Instead of basic audio playback, the system leverages an advanced backend framework to process and analyze the voice data natively).
* **Automatic Location Fetch:** The application automatically traces the user's live location to log the complaint accurately, leaving zero room for incorrect addresses.
* **MITRA Chatbot (Your AI Assistant):** A smart, NLP-powered assistant that guides users in real-time, helping them navigate and interact with the application smoothly.
* **Live Issue Tracking:** Users get absolute transparency with real-time tracking of their filed complaints at every administrative stage.

### 2. 🛡️ AI Backend & Fraud Prevention (The USP)
* **Automated Issue Categorization:** The AI core evaluates text and uploaded media to automatically route the complaint into its correct category (e.g., Garbage, Potholes, Electricity).
* **AI Resolution Verification (Anti-Cheat):** When an officer marks an issue as resolved and uploads a resolution photo, the AI backend performs a structural comparison against the original complaint photo. If an officer attempts to upload an unrelated or fraudulent image, the **Verification Fails** instantly.

### 3. 💼 Smart Officer Operations & Navigation
* **SLA Time Limits:** Every officer is bound by strict, specific time limits (Service Level Agreements) to resolve assigned tasks.
* **In-App Road Navigation:** Clicking on an assigned complaint automatically triggers turn-by-turn road navigation on the map, showing the officer the exact route to the spot of the grievance.

### 4. 📈 Comprehensive Admin Dashboard & Analytics
* **Officer Accountability Ledger:** The admin panel tracks operational transparency by clearly highlighting:
  * Which officer's AI verification failed.
  * Who successfully resolved issues with verified proof.
  * Who failed to meet the strict SLA time limits.

### 5. 🎮 Interactive Gamified Zone
* Features a dedicated **Gamified Zone** designed to boost community engagement and foster friendly, collaborative interactions between citizens and local governance bodies.

---

## 🛠️ Tech Stack Used
* **Frontend & Backend:** Next.js / React.js
* **AI Core:** Google Gemini API (NLP Integration, Categorization & Visual Resolution Verification)
* **Database & Real-time Synchronization:** Firebase Firestore
* **Deployment:** Vercel Cloud Platform
*
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/be99056a-112d-44e9-b948-10b9e84e3159

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
