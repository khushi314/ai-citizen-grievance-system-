import { Complaint } from "./types";

export interface SLAInfo {
  status: "Resolved" | "On Schedule" | "Approaching Deadline" | "Deadline Exceeded (Overdue)";
  color: string;
  label: string;
  timeLeftFormatted: string;
  deadlineFormatted: string;
  percentageLeft: number;
  isOverdue: boolean;
  hours: number;
}

export function getSLAStatus(complaint: Complaint, deadlines: Record<string, number> = {}): SLAInfo {
  const hours = deadlines[complaint.category] || 24;
  const totalDurationMs = hours * 60 * 60 * 1000;
  const createdTime = new Date(complaint.createdAt).getTime();
  const deadlineTime = createdTime + totalDurationMs;

  const deadlineDate = new Date(deadlineTime);
  const deadlineFormatted = deadlineDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  if (complaint.status === "Resolved") {
    const resolvedTime = complaint.resolvedAt ? new Date(complaint.resolvedAt).getTime() : Date.now();
    const resolvedDiff = deadlineTime - resolvedTime;
    const isOnTime = resolvedDiff >= 0;

    return {
      status: "Resolved",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      label: isOnTime ? "Resolved On Time" : "Resolved Late (Overdue)",
      timeLeftFormatted: isOnTime ? "Resolved within SLA window" : "Resolved past SLA deadline",
      deadlineFormatted,
      percentageLeft: 100,
      isOverdue: !isOnTime,
      hours
    };
  }

  const now = Date.now();
  const timeLeftMs = deadlineTime - now;

  if (timeLeftMs <= 0) {
    const overdueMs = Math.abs(timeLeftMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      status: "Deadline Exceeded (Overdue)",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      label: "Deadline Exceeded (Overdue)",
      timeLeftFormatted: `Overdue by ${overdueHours}h ${overdueMins}m`,
      deadlineFormatted,
      percentageLeft: 0,
      isOverdue: true,
      hours
    };
  }

  const percentageLeft = (timeLeftMs / totalDurationMs) * 100;
  const leftHours = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const leftMins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const leftSecs = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
  
  // "Approaching Deadline" if less than 25% of SLA is left OR less than 6 hours are left
  const isApproaching = percentageLeft <= 25 || timeLeftMs < 6 * 60 * 60 * 1000;

  return {
    status: isApproaching ? "Approaching Deadline" : "On Schedule",
    color: isApproaching 
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
      : "text-teal-400 bg-teal-500/10 border-teal-500/20",
    label: isApproaching ? "Approaching Deadline" : "On Schedule",
    timeLeftFormatted: `${leftHours}h ${leftMins}m ${leftSecs}s remaining`,
    deadlineFormatted,
    percentageLeft,
    isOverdue: false,
    hours
  };
}
