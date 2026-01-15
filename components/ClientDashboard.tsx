import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  User as UserIcon,
  Briefcase,
  MessageCircle,
  Copy,
  ExternalLink,
  Check
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
  onUpdateServices,
  onUpdateAvailability,
  onUpdateAccount
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'services' | 'account'>('appointments');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const linkToCopy = account.publicLink || window.location.origin;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = linkToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id
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
      <OnboardingModal />

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
            <NavItem id="account" label="Minha Conta" icon={UserIcon} />
          </nav>

          <div className="mt-auto p-6 hidden md:block space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-3">Link Público</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                    copied
                      ? 'bg-green-50 text-green-600 border-green-100'
                      : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar link'}
                </button>

                <button
                  onClick={onOpenPublic}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <ExternalLink size={14} /> Abrir Página
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-blue-50 p-4 rounded-2xl border border-primary/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Suporte ao Sistema</p>
              <a
                href="https://wa.me/819011886491"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-white text-green-600 border border-green-200 hover:bg-green-50 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <MessageCircle size={14} /> Creative Print
              </a>
            </div>
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
                  publicLink={account.publicLink}
                />
              </div>

              <div className={activeTab === 'availability' ? 'block' : 'hidden'}>
                <AvailabilityTab config={availability} onSave={onUpdateAvailability} />
              </div>

              <div className={activeTab === 'services' ? 'block' : 'hidden'}>
                <ServicesTab services={services} onUpdateServices={onUpdateServices} />
              </div>

              <div className={activeTab === 'account' ? 'block' : 'hidden'}>
                <AccountTab account={account} onUpdateSettings={onUpdateAccount} />
              </div>
            </div>

            {/* MOBILE ONLY: Cards Extras e Logout antes do Rodapé */}
            <div className="mt-8 space-y-6 md:hidden">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-3">Link Público</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCopyLink}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-xs font-bold transition-all border ${
                        copied
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copiado!' : 'Copiar link'}
                    </button>

                    <button
                      onClick={onOpenPublic}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 py-3 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <ExternalLink size={14} /> Abrir Página
                    </button>

                    <p className="text-[10px] text-gray-400 font-medium text-center mt-1">
                      Envie este link para seus clientes agendarem.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-blue-50 p-4 rounded-2xl border border-primary/10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Suporte ao Sistema</p>
                  <a
                    href="https://wa.me/819011886491"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white text-green-600 border border-green-200 hover:bg-green-50 px-3 py-3 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <MessageCircle size={14} /> Falar com Suporte
                  </a>
                </div>
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
