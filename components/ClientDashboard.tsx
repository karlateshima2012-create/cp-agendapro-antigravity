import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Briefcase,
  MessageCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { AccountInfo, Appointment, AvailabilityConfig, Service, AppointmentStatus } from '../types';
import { DashboardHeader } from './DashboardHeader';
import { AppointmentsTab } from './AppointmentsTab';
import { AvailabilityTab } from './AvailabilityTab';
import { ServicesTab } from './ServicesTab';
import { AccountTab } from './AccountTab';
import { OnboardingModal } from './OnboardingModal';

interface Props {
  account: AccountInfo;
  appointments: Appointment[];
  services: Service[];
  availability: AvailabilityConfig;
  onLogout: () => void;
  onOpenPublic: () => void;
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onUpdateStatus: (id: number, status: AppointmentStatus) => void;
  onDeleteAppointment: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  onUpdateServices: (services: Service[]) => void;
  onUpdateAvailability: (availability: AvailabilityConfig) => void;
  onUpdateAccount: (settings: Partial<AccountInfo>) => void;
}

const CPLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="10" height="10" rx="2" fill="#E91E63" />
    <rect x="1" y="13" width="10" height="10" rx="2" fill="#0EA5E9" />
    <rect x="13" y="13" width="10" height="10" rx="2" fill="#FACC15" />
    <rect x="13" y="1" width="4.5" height="4.5" rx="1" fill="#FACC15" />
    <rect x="13" y="6.5" width="4.5" height="4.5" rx="1" fill="#0EA5E9" />
    <rect x="18.5" y="6.5" width="4.5" height="4.5" rx="1" fill="#E91E63" />
  </svg>
);

export const ClientDashboard: React.FC<Props> = ({
  account,
  appointments,
  services,
  availability,
  onLogout,
  onOpenPublic,
  onUpdateStatus,
  onDeleteAppointment,
  onBulkDelete,
  onUpdateServices,
  onUpdateAvailability,
  onUpdateAccount
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'services' | 'account'>('appointments');

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === id
        ? 'bg-primary text-white shadow-lg shadow-primary/30'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <>
      <OnboardingModal
        seen={!!account.onboardingSeen}
        onMarkSeen={async () => onUpdateAccount({ onboardingSeen: true })}
      />

      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-10">
          <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-3">
            <CPLogo className="w-8 h-8 flex-shrink-0" />
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">CP - Agenda Pro</h1>
          </div>

          <nav className="p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <NavItem id="appointments" label="Agenda" icon={CalendarDays} />
            <NavItem id="availability" label="Disponibilidade" icon={Clock} />
            <NavItem id="services" label="Serviços" icon={Briefcase} />
            <NavItem id="account" label="Configurações" icon={Settings} />
          </nav>

          <div className="mt-auto p-4 hidden md:block">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl text-sm font-bold transition-all border border-red-100 shadow-sm"
            >
              <LogOut size={18} /> SAIR
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
          <div className="max-w-5xl mx-auto min-h-full flex flex-col">
            <DashboardHeader account={account} onLogout={onLogout} onOpenPublic={onOpenPublic} />

            <div className="animate-fade-in flex-1">
              <div className={activeTab === 'appointments' ? 'block' : 'hidden'}>
                <AppointmentsTab
                  appointments={appointments}
                  availability={availability}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteAppointment={onDeleteAppointment}
                  onBulkDelete={onBulkDelete}
                  publicLink={account.publicLink}
                />
              </div>

              <div className={activeTab === 'availability' ? 'block' : 'hidden'}>
                <AvailabilityTab
                  key={JSON.stringify(availability)}
                  config={availability}
                  onSave={onUpdateAvailability}
                />
              </div>

              <div className={activeTab === 'services' ? 'block' : 'hidden'}>
                <ServicesTab
                  key={JSON.stringify(services)}
                  services={services}
                  onUpdateServices={onUpdateServices}
                />
              </div>

              <div className={activeTab === 'account' ? 'block' : 'hidden'}>
                <AccountTab
                  key={JSON.stringify(account)}
                  account={account}
                  onUpdateSettings={onUpdateAccount}
                  onOpenPublic={onOpenPublic}
                />
              </div>
            </div>

            {/* MOBILE ONLY: Cards Extras e Logout antes do Rodapé */}
            <div className="mt-8 space-y-6 md:hidden">
              <div className="space-y-4">

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-4 rounded-xl text-sm font-bold transition-all border border-red-100 shadow-sm"
                >
                  <LogOut size={18} /> SAIR DA CONTA
                </button>
              </div>
            </div>

            {/* Rodapé igual da página pública */}
            <footer className="mt-12 mb-8 flex flex-col items-center opacity-30 group cursor-default">
              <div className="flex items-center gap-3 grayscale group-hover:grayscale-0 transition-all duration-500">
                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-[11px] shadow-xl">
                  CP
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-900 tracking-tighter leading-none">CP - Agenda Pro</span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
};
