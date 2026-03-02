import apiClient from './apiClient';
import { Appointment, AccountInfo, Service, User, AccountStatus } from '../types';

export const api = {
    // Auth
    async login(credentials: any) {
        return apiClient.post('/auth/login', credentials);
    },

    async logout() {
        return apiClient.post('/auth/logout');
    },

    async getMe() {
        return apiClient.get('/me');
    },

    // Diagnostics
    async ping() {
        return apiClient.get('/ping');
    },

    async checkDb() {
        return apiClient.get('/db');
    },

    // Services
    async listServices(): Promise<any> {
        return apiClient.get('/services');
    },

    async saveServices(services: any[]): Promise<any> {
        return apiClient.put('/services', services);
    },

    // Availability
    async getAvailability(): Promise<any> {
        return apiClient.get('/availability');
    },

    async saveAvailability(payload: any): Promise<any> {
        return apiClient.put('/availability', payload);
    },

    // Blocked Dates
    async listBlockedDates(): Promise<any> {
        return apiClient.get('/blocked-dates');
    },

    async addBlockedDate(data: { date: string, reason: string }): Promise<any> {
        return apiClient.post('/blocked-dates', data);
    },

    async deleteBlockedDate(id: number): Promise<any> {
        return apiClient.delete(`/blocked-dates/${id}`);
    },

    // Appointments
    async listAppointments(filters?: { from?: string, to?: string }): Promise<any> {
        return apiClient.get('/appointments', { params: filters });
    },

    async updateAppointmentStatus(id: number, status: string): Promise<any> {
        return apiClient.patch(`/appointments/${id}/status`, { status });
    },

    async deleteAppointment(id: number): Promise<any> {
        return apiClient.delete(`/appointments/${id}`);
    },

    async bulkDeleteAppointments(ids: number[]): Promise<any> {
        return apiClient.post('/appointments/bulk-delete', { ids });
    },

    async createPublicAppointment(data: any): Promise<any> {
        // Maps to RPC equivalent in PHP
        return apiClient.post('/appointments/create', data);
    },

    async getPublicProfile(id: string): Promise<any> {
        return apiClient.get(`/public/profile/${id}`); // Need a public route
    },

    async updateProfile(data: any): Promise<any> {
        return apiClient.patch('/me/profile', data);
    },

    // Admin
    async adminListProfiles(): Promise<any> {
        return apiClient.get('/admin/profiles');
    },

    async adminUpdateProfile(id: string, data: any): Promise<any> {
        return apiClient.patch(`/admin/profiles/${id}`, data);
    },

    async adminRenewPlan(id: string, months: number): Promise<any> {
        return apiClient.post(`/admin/profiles/${id}/renew`, { months });
    },

    async adminCreateUser(data: any): Promise<any> {
        return apiClient.post('/admin/users', data);
    },

    async adminDeleteUser(id: string): Promise<any> {
        return apiClient.delete(`/admin/users/${id}`);
    },

    async changePassword(password: string): Promise<any> {
        return apiClient.post('/me/change-password', { password });
    },

    async updateOnboarding(seen: boolean): Promise<any> {
        return apiClient.post('/me/onboarding', { seen });
    },

    async requestPasswordReset(email: string): Promise<any> {
        return apiClient.post('/auth/forgot-password', { email });
    },

    async confirmPasswordReset(code: string, password: string): Promise<any> {
        return apiClient.post('/auth/reset-password', { code, password });
    }
};
