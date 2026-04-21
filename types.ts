
export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled' | 'rejected';
export type UserRole = 'admin' | 'client' | 'super_admin';
export type PlanType = '1m' | '3m' | '6m' | '12m';
export type AccountStatus = 'active' | 'expired' | 'blocked';

export interface Service {
  id?: number;
  name: string;
  description: string;
  duration: number;
  cleaning_buffer?: number;
  price: number;
}

export interface Appointment {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: number;
  serviceName: string;
  startAt: string;
  endAt?: string;
  duration: number;
  status: AppointmentStatus;
  createdAt: string;
  user_id?: string;
}

export interface WorkingHour {
  day: number | string;
  name: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

export interface BlockedDate {
  id: number;
  date: string;
  reason: string;
}

export interface AvailabilityConfig {
  workingHours: WorkingHour[];
  blockedDates: BlockedDate[];
  intervalMinutes: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  companyName: string;
  ownerName?: string; // Novo campo para o administrador
  coverImage?: string;
  profileImage?: string;
  shortDescription?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactPhone?: string;
  planType?: PlanType;
  planExpiresAt?: string;
  accountStatus?: AccountStatus;
  publicLink?: string;
  mustChangePassword?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  lastAccessAt?: string;
  lastAppointmentAt?: string;
  appointmentCount?: number;
  createdAt?: string;
}

export interface AccountInfo {
  companyName: string;
  coverImage?: string;
  profileImage?: string;
  shortDescription?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail: string;
  contactPhone: string;
  planType: PlanType;
  planExpiresAt: string;
  status: AccountStatus;
  publicLink: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  lifetimeAppointments?: number;
  onboardingSeen?: boolean;
  createdAt?: string;

}
