import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Briefcase,
  Settings,
  LogOut,
  LayoutGrid,
  Activity,
  Star,
  Users,
  History,
  Contact2,
  MoreHorizontal,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import { AccountInfo, Appointment, AvailabilityConfig, Service, AppointmentStatus } from '../types';
import { DashboardHeader } from './DashboardHeader';
import { AppointmentsTab } from './AppointmentsTab';
import { AvailabilityTab } from './AvailabilityTab';
import { ServicesTab } from './ServicesTab';
import { AccountTab } from './AccountTab';
import { OnboardingModal } from './OnboardingModal';
import { Logo } from './Logo';
import { ClientsTab } from './ClientsTab';
import { HistoryTab } from './HistoryTab';

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
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'services' | 'clients' | 'history' | 'account'>('appointments');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-shrink-0 flex-col h-screen sticky top-0 z-10">
          <div className="p-6 border-b border-gray-100 hidden md:flex justify-center">
            <Logo size="sm" />
          </div>

          <nav className="p-4 flex flex-col gap-2">
            <NavItem id="appointments" label="Agenda" icon={CalendarDays} />
            <NavItem id="availability" label="Disponibilidade" icon={Clock} />
            <NavItem id="services" label="Serviços" icon={Briefcase} />
            <NavItem id="clients" label="Clientes" icon={Contact2} />
            <NavItem id="history" label="Histórico" icon={History} />
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

        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pb-24 md:pb-8">
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

              <div className={activeTab === 'clients' ? 'block' : 'hidden'}>
                <ClientsTab />
              </div>

              <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                <HistoryTab />
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

            {/* MOBILE NAVIGATION BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around z-[60] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] pb-safe-offset-3">
              <button
                onClick={() => { setActiveTab('appointments'); setShowMobileMenu(false); }}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${activeTab === 'appointments' ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-primary/10 shadow-lg shadow-primary/20' : ''}`}>
                  <CalendarDays size={22} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">Agenda</span>
              </button>

              <button
                onClick={() => { setActiveTab('availability'); setShowMobileMenu(false); }}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${activeTab === 'availability' ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'availability' ? 'bg-primary/10 shadow-lg shadow-primary/20' : ''}`}>
                  <Clock size={22} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">Horários</span>
              </button>

              <button
                onClick={() => { setActiveTab('services'); setShowMobileMenu(false); }}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${activeTab === 'services' ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'services' ? 'bg-primary/10 shadow-lg shadow-primary/20' : ''}`}>
                  <Briefcase size={22} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">Serviços</span>
              </button>

              <button
                onClick={() => { setActiveTab('clients'); setShowMobileMenu(false); }}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${activeTab === 'clients' ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-primary/10 shadow-lg shadow-primary/20' : ''}`}>
                  <Contact2 size={22} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">Clientes</span>
              </button>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${showMobileMenu ? 'text-primary' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${showMobileMenu ? 'bg-primary/10 shadow-lg shadow-primary/20' : ''}`}>
                  <MoreHorizontal size={22} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">Mais</span>
              </button>
            </div>

            {/* MOBILE OVERFLOW MENU */}
            {showMobileMenu && (
              <div className="md:hidden fixed inset-0 z-[55] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowMobileMenu(false)}>
                <div 
                  className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl animate-slide-up"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => { setActiveTab('history'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-700'}`}
                    >
                      <History size={20} />
                      <span className="font-bold">Histórico de Agendamentos</span>
                    </button>
                    
                    <button
                      onClick={() => { setActiveTab('account'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'account' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-700'}`}
                    >
                      <Settings size={20} />
                      <span className="font-bold">Configurações do Perfil</span>
                    </button>

                    <button
                      onClick={onLogout}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 transition-all border border-red-100"
                    >
                      <LogOut size={20} />
                      <span className="font-bold">Sair do Sistema</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowMobileMenu(false)}
                    className="w-full mt-6 py-4 text-gray-400 font-bold text-sm uppercase tracking-widest"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};
