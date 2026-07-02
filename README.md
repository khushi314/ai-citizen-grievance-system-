# 🏛️Unified Citizen Redressal & Smart Governance Platform

(Mechanism for Intelligent Tracking and Resolution Architecture) is a Next-generation AI-powered Unified Platform designed to eliminate traditional, fragmented complaint systems and bring citizens and government authorities into a single cohesive ecosystem. Citizens no longer need to navigate multiple departmental portals or report issues across fragmented channels—any civic grievance can now be reported **"From Anywhere, At Any Time."**



## 📸 Platform Walkthrough & Screenshots
<img width="1920" height="948" alt="Screenshot 2026-06-30 202842" src="https://github.com/user-attachments/assets/c213a50f-723b-46d7-9ec9-09e2ad95f5a0" />



### 👥 1. Unified Citizen Portal
Citizens can seamlessly lodge complaints along with video or photo evidence without filling out complex forms. The AI core handles everything automatedly at the backend.


### 📊 2. Admin Real-Time Tracking Map (Red & Green Dots)
The comprehensive admin dashboard features a dynamic map displaying real-time issues across the jurisdiction:
* 🔴 **Red Dots:** Pending / High-Priority Issues.
* 🟢 **Green Dots:** Successfully Resolved Issues.
  <img width="1920" height="923" alt="Screenshot 2026-06-30 202713" src="https://github.com/user-attachments/assets/4366a568-caac-4cfc-b906-f8ea04a036e4" />

---

## 🔥 Key & Unique Features

### 1. 📲 Unified Citizen Experience
* **Report from Anywhere:** Replaces fragmented legacy portals with a single, unified interface where any civic issue can be reported instantly.
* **Rich Media Support:** Supports attaching audio/video evidence. (Note: Instead of basic audio playback, the system leverages an advanced backend framework to process and analyze the voice data natively).
* **Automatic Location Fetch:** The application automatically traces the user's live location to log the complaint accurately, leaving zero room for incorrect addresses.
* **MITRA Chatbot (Your AI Assistant):** A smart, NLP-powered assistant that guides users in real-time, helping them navigate and interact with the application smoothly.
* **Live Issue Tracking:** Users get absolute transparency with real-time tracking of their filed complaints at every administrative stage.
  <img width="1920" height="895" alt="Screenshot 2026-06-30 203009" src="https://github.com/user-attachments/assets/2372221a-39f9-40cc-a69a-1888b1d96bb1" />


### 2. 🛡️ AI Backend & Fraud Prevention (The USP)
* **Automated Issue Categorization:** The AI core evaluates text and uploaded media to automatically route the complaint into its correct category (e.g., Garbage, Potholes, Electricity).
<img width="1920" height="748" alt="Screenshot 2026-06-30 202911" src="https://github.com/user-attachments/assets/c74e08bc-ba81-4f41-8b74-02575266c6e3" />
 
  
* **AI Resolution Verification (Anti-Cheat):** When an officer marks an issue as resolved and uploads a resolution photo, the AI backend performs a structural comparison against the original complaint photo. If an officer attempts to upload an unrelated or fraudulent image, the **Verification Fails** instantly.
  <img width="1920" height="951" alt="Screenshot 2026-06-30 203043" src="https://github.com/user-attachments/assets/f3f72c96-beb6-4e7d-8249-458f33d70bd3" />


### 3. 💼 Smart Officer Operations & Navigation
* **SLA Time Limits:** Every officer is bound by strict, specific time limits (Service Level Agreements) to resolve assigned tasks.
* **In-App Road Navigation:** Clicking on an assigned complaint automatically triggers turn-by-turn road navigation on the map, showing the officer the exact route to the spot of the grievance.

### 4. 📈 Comprehensive Admin Dashboard & Analytics
* **Officer Accountability Ledger:** The admin panel tracks operational transparency by clearly highlighting:
  * Which officer's AI verification failed.
  * Who successfully resolved issues with verified proof.
  * Who failed to meet the strict SLA time limits.
    <img width="1243" height="568" alt="Screenshot 2026-07-02 230036" src="https://github.com/user-attachments/assets/4471e5b1-f939-457f-b057-7ad34e4d1e9b" />

    

### 5. 🎮 Interactive Gamified Zone
* Features a dedicated **Gamified Zone** designed to boost community engagement and foster friendly, collaborative interactions between citizens and local governance bodies.
<img width="1920" height="920" alt="Screenshot 2026-06-30 202828" src="https://github.com/user-attachments/assets/74911079-e104-486e-861a-2fe28cadb3e6" />

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
