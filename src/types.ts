export type UserRole = "Citizen" | "Officer" | "Admin";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  area?: string;
  officeAddress?: string;
  points?: number;
}

export type ComplaintStatus = "Registered" | "Dispatched" | "In Progress" | "Arrived" | "Resolved" | "Verification Failed";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: string;
  description: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "High" | "Medium" | "Low";
  status: ComplaintStatus;
  location: GeoLocation;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  mediaUrl?: string; // photo/audio/video of the complaint
  mediaType?: "image" | "audio" | "video";
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedDepartment?: string;
  timeline: TimelineEvent[];
  resolvedAt?: string;
  resolutionImageUrl?: string;
  verificationReason?: string;
  feedbackScore?: number;
  escalated?: boolean;
  escalatedAt?: string;
}

export interface MitraMessage {
  id: string;
  sender: "user" | "mitra";
  text: string;
  timestamp: string;
  isAudio?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  hint: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  badges: string[];
  resolvedCount: number;
}
