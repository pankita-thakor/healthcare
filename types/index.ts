export type UserRole = "patient" | "provider" | "admin";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  meetingUrl: string | null;
  reason: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  appointmentId: string | null;
  content: string;
  createdAt: string;
}
