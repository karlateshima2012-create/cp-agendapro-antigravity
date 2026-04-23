import React, { useState } from 'react';
import { Service, AvailabilityConfig, Appointment } from '../types';
import {
  Calendar as CalendarIcon,
  Calendar,
  ChevronLeft,
  CheckCircle,
  Clock,
  User,
  Phone,
  ArrowRight,
  ChevronRight,
  Briefcase,
  AlertCircle,
  Ban,
  Check,
  Mail
} from 'lucide-react';

interface Props {
  companyName: string;
  coverImage?: string;
  profileImage?: string;
  shortDescription?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  services: Service[];
  availability: AvailabilityConfig;
  appointments: Appointment[];
  busyAppointments: Appointment[]; // NOVA PROP AQUI
  onBook: (data: any) => Promise<boolean>;
  onBack: () => void;
}

export const PublicBookingPage: React.FC<Props> = ({
  companyName,
  coverImage,
  profileImage,
  shortDescription,
  servicesTitle,
  servicesSubtitle,
  primaryColor = '#25aae1',
  secondaryColor = '#1f2937',
  services,
  availability,
  appointments,
  busyAppointments, // RECEBE A NOVA PROP
  onBook,
  onBack
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientData, setClientData] = useState<{ name: string; phone: string; email?: string }>({ name: '', phone: '', email: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const normalizedHours = React.useMemo(() => {
    console.log('🚀 PublicBookingPage Build Version: 2026.02.18.10');
    let hours = availability.workingHours;
    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
        if (typeof hours === 'string') hours = JSON.parse(hours);
      } catch (e) {
        console.error('Failed defensive parse of workingHours:', e);
        return [];
      }
    }

    if (!Array.isArray(hours)) return [];

    // Normalize keys
    return hours.map(h => ({
      ...h,
      enabled: h.enabled ?? h.isWorking ?? h.is_working ?? true,
      start: h.start ?? h.startTime ?? h.start_time ?? '09:00',
      end: h.end ?? h.endTime ?? h.end_time ?? '18:00'
    }));
  }, [availability.workingHours]);

  console.log('AVAILABILITY OBJECT:', JSON.stringify(availability, null, 2));
  console.log('NORMALIZED HOURS:', normalizedHours);

  const getNowJST = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const formatLiteralDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDurationFriendly = (minutes: number) => {
    if (minutes === 1440) return '24 horas (Diária)';
    if (minutes >= 60) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutes} minutos`;
  };

  const renderProgressBar = () => {
    if (step === 5) return null;

    const steps = [
      { id: 1, label: 'Serviço', icon: Briefcase },
      { id: 2, label: 'Horário', icon: Clock },
      { id: 3, label: 'Dados', icon: User },
      { id: 4, label: 'Revisão', icon: CheckCircle },
    ];

    return (
      <div className="w-full max-w-2xl mx-auto mb-12 px-4">
        <div className="flex items-center justify-between relative">
          {/* Linha de fundo */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10"></div>

          {/* Linha de progresso ativa */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 transition-all duration-500 -z-10"
            style={{
              width: `${((step - 1) / (steps.length - 1)) * 100}%`,
              backgroundColor: primaryColor
            }}
          ></div>

          {steps.map((s) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white ${isCompleted || isActive ? 'shadow-lg' : 'border-gray-100'
                    }`}
                  style={{
                    borderColor: isCompleted || isActive ? primaryColor : '#f3f4f6',
                    backgroundColor: isCompleted ? primaryColor : 'white',
                    color: isCompleted ? 'white' : (isActive ? primaryColor : '#d1d5db')
                  }}
                >
                  {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-300'
                    }`}
                  style={isActive ? { color: primaryColor } : {}}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const toTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    // Remove 'Z' if it exists to treat everything as naive/local wall-clock time
    const cleanDateStr = dateStr.endsWith('Z') ? dateStr.substring(0, dateStr.length - 1) : dateStr;
    const parts = cleanDateStr.split(/[-T :]/);
    if (parts.length < 3) return 0;
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    const h = parts.length > 3 ? parseInt(parts[3]) : 0;
    const min = parts.length > 4 ? parseInt(parts[4]) : 0;
    // We use UTC just to get a stable comparable integer based on the wall-clock numbers
    return Date.UTC(y, m, d, h, min);
  };

  const getSlotsForDate = (date: string) => {
    if (!selectedService) return [];
    const nowJST = getNowJST();
    const todayStr = formatLiteralDate(nowJST);
    const isToday = date === todayStr;
    const currentMinutes = nowJST.getHours() * 60 + nowJST.getMinutes();
    const jsDayOfWeek = new Date(date + 'T12:00:00').getDay();
    const jsDayToPtDay: Record<number, string> = {
      1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 0: 'domingo'
    };
    const dayName = jsDayToPtDay[jsDayOfWeek];
    const config = normalizedHours.find(h => h.day === dayName);
    if (!config || !config.enabled) return [];
    let startTime = config.start;
    let endTime = config.end;

    // Para diárias (24h+), o horário padrão é o de início da disponibilidade (Check-in)
    // Mostramos apenas este slot se for o caso
    if (selectedService.duration >= 1440) {
      endTime = startTime;
    }

    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const interval = availability.intervalMinutes || 30;
    const times: string[] = [];
    let curr = toMin(startTime);
    const end = (selectedService.duration >= 1440) ? curr : toMin(endTime);

    while (curr <= end) {
      if (isToday && curr <= currentMinutes + 15) {
        curr += interval;
        continue;
      }
      const timeStr = `${String(Math.floor(curr / 60)).padStart(2, '0')}:${String(curr % 60).padStart(2, '0')}`;
      const slotStartTimestamp = toTimestamp(`${date} ${timeStr}`);
      const totalSlotDuration = selectedService.duration + (selectedService.cleaning_buffer || 0);
      const slotEndTimestamp = slotStartTimestamp + (totalSlotDuration * 60000);

      const isBusy = (busyAppointments || []).some(a => {
        if (a.status === 'canceled' || a.status === 'rejected') return false;
        const apptStartTimestamp = toTimestamp(a.startAt);
        const apptEndTimestamp = a.endAt ? toTimestamp(a.endAt) : apptStartTimestamp + (a.duration * 60000);

        const overlaps = (slotStartTimestamp < apptEndTimestamp && slotEndTimestamp > apptStartTimestamp);

        if (overlaps) {
          console.log(`[Conflict Found] Slot ${timeStr} with appt:`, {
            appt: a,
            apptStart: new Date(apptStartTimestamp).toISOString(),
            apptEnd: new Date(apptEndTimestamp).toISOString(),
            slotStart: new Date(slotStartTimestamp).toISOString(),
            slotEnd: new Date(slotEndTimestamp).toISOString()
          });
        }

        return overlaps;
      });

      const isBlockedInSlot = (availability.blockedDates || []).some(b => {
        const bDate = b.date?.includes('T') ? b.date.split('T')[0] : b.date;
        if (bDate !== date) return false;

        // Se for um bloqueio de dia inteiro (sem startTime), bloqueia o slot
        if (!b.startTime) return true;

        const toMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };

        const bStart = toMin(b.startTime);
        const bEnd = b.endTime ? toMin(b.endTime) : bStart + (availability.intervalMinutes || 30);
        
        const slotStart = toMin(timeStr);
        const slotEnd = slotStart + (selectedService.duration || 30);

        // Verifica sobreposição entre [slotStart, slotEnd] e [bStart, bEnd]
        return (slotStart < bEnd && slotEnd > bStart);
      });

      if (!isBusy && !isBlockedInSlot) times.push(timeStr);
      if (selectedService.duration >= 1440) break; // Só 1 slot para diárias
      curr += interval;
    }
    return times;
  };

  const renderCalendar = () => {
    const nowJST = getNowJST();
    const todayStr = formatLiteralDate(nowJST);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];
    const jsDayToPtDay: Record<number, string> = {
      1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 0: 'domingo'
    };
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 w-full"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const jsDayOfWeek = new Date(year, month, d).getDay();
      const dayString = jsDayToPtDay[jsDayOfWeek];
      const isPastOrToday = dateStr <= todayStr;
      const isSelected = selectedDate === dateStr;
      const scheduleForDay = normalizedHours.find(w => w.day === dayString);
      const isDayOff = !scheduleForDay || !scheduleForDay.enabled;
      const isFullDayBlocked = (availability.blockedDates || []).some(b => (b.date?.split('T')[0] === dateStr) && !b.startTime);
      const isDayFull = selectedService ? getSlotsForDate(dateStr).length === 0 : false;
      const isUnavailable = isPastOrToday || isDayOff || isFullDayBlocked || isDayFull;
      days.push(
        <button
          key={d}
          disabled={isUnavailable}
          onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
          className={`h-11 w-11 mx-auto flex items-center justify-center rounded-2xl text-sm font-black transition-all ${isUnavailable
            ? 'text-gray-200 cursor-not-allowed line-through'
            : isSelected
              ? 'text-white shadow-lg scale-110'
              : 'text-gray-700 hover:bg-gray-100 hover:text-primary hover:scale-105'
            }`}
          style={!isUnavailable && isSelected ? { backgroundColor: primaryColor, boxShadow: `0 8px 15px -4px ${primaryColor}66` } : {}}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  const handleFinalConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    if (!clientData.name.trim() || !clientData.phone.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios (Nome e Telefone).');
      setIsSubmitting(false);
      return;
    }
    const normalizedName = toTitleCase(clientData.name);
    const result = await onBook({
      serviceId: selectedService!.id,
      serviceName: selectedService!.name,
      // Usamos string pura (naive) para evitar deslocamento de timezone (toISOString causava bugs)
      startAt: `${selectedDate} ${selectedTime}:00`,
      duration: selectedService!.duration,
      clientName: normalizedName,
      clientPhone: clientData.phone,
      clientEmail: clientData.email || ''
    });
    if (result === true) {
      setStep(5);
    } else {
      setErrorMsg(typeof result === 'string' ? result : 'Não foi possível salvar seu agendamento. Tente novamente.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white md:my-10 md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col min-h-screen md:min-h-0 border border-gray-100">

        <header className="relative h-auto min-h-[280px] md:h-80 bg-gray-100 overflow-hidden">
          {/* Imagem de capa - preenche TODO o header */}
          <div className="absolute inset-0">
            {coverImage ? (
              <img src={coverImage} className="w-full h-full object-cover" alt="Banner" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-900 opacity-90"></div>
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
          </div>

          {/* Desktop - Imagem absolute na posição original */}
          {profileImage && (
            <div
              className="
                hidden
                md:block
                absolute
                right-12
                top-1/2
                -translate-y-1/2
                z-20
                w-[200px] h-[200px]
                rounded-3xl
                overflow-hidden
                border border-white/30
                bg-white/10
                backdrop-blur-xl
                shadow-2xl
              "
            >
              <img
                src={profileImage}
                alt="Logo ou Perfil"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {step > 1 && step < 5 && (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="absolute top-8 left-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-3 rounded-2xl text-white border border-white/20 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 z-30"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          {/* Mobile - Imagem NO FLUXO NORMAL (não absolute) */}
          {profileImage && (
            <div className="
              md:hidden
              flex justify-center
              pt-20
              mb-8
              relative
              z-20
            ">
              <div
                className="
                  w-[150px] h-[150px]
                  rounded-3xl
                  overflow-hidden
                  border border-white/30
                  bg-white/10
                  backdrop-blur-xl
                  shadow-2xl
                "
              >
                <img
                  src={profileImage}
                  alt="Logo ou Perfil"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Conteúdo do header - NO FLUXO NORMAL para mobile, ABSOLUTE para desktop */}
          <div className="relative md:absolute px-6 pb-8 md:bottom-12 md:left-10 md:right-10 md:z-10 animate-fade-in md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] bg-white/10 px-3 py-1 rounded-full border border-white/10">Agendamento Online</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-2 text-center md:text-left">{companyName}</h1>
            {shortDescription && step === 1 && (
              <p className="text-white/70 text-sm md:text-base font-medium max-w-lg line-clamp-2 text-center md:text-left mx-auto md:mx-0">{shortDescription}</p>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12">
          {renderProgressBar()}

          {step === 1 && (
            <div className="animate-fade-in space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: primaryColor }}>
                  {servicesTitle || 'Serviços Disponíveis'}
                </h2>
                <p className="text-gray-400 text-sm font-medium" style={{ color: primaryColor + '99' }}>
                  {servicesSubtitle || 'Selecione o procedimento desejado abaixo para ver horários'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(services || []).length > 0 ? (services || []).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className="p-8 bg-white border border-gray-100 rounded-[3rem] text-left hover:border-gray-300 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="p-3 rounded-2xl transition-all bg-gray-100 text-gray-500">
                        <Briefcase size={22} />
                      </div>
                      <h3 className="font-black text-2xl capitalize tracking-tight" style={{ color: primaryColor }}>{s.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed line-clamp-3 flex-1">{s.description}</p>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-6">
                      <div className="flex items-center gap-2 font-black text-[11px] text-gray-500 uppercase tracking-widest">
                        <Clock size={16} style={{ color: primaryColor }} /> {formatDurationFriendly(s.duration)}
                      </div>
                      <div className="flex flex-col items-end">
                        {s.price > 0 && <span className="font-black text-2xl text-gray-900">¥ {s.price.toLocaleString()}</span>}
                        <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }}>Selecionar</span>
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-full py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <Briefcase size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nenhum serviço disponível</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Escolha a data</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Serviço: <span className="font-bold uppercase" style={{ color: primaryColor }}>{selectedService?.name}</span></p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                  <Clock size={16} style={{ color: primaryColor }} />
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{formatDurationFriendly(selectedService?.duration || 0)} de duração</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-[0.3em]">{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors"><ChevronLeft size={20} /></button>
                      <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors"><ChevronRight size={20} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-300 mb-6 uppercase tracking-widest">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-3">{renderCalendar()}</div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Horários Disponíveis</h3>
                    {selectedDate && <span className="text-[10px] font-black bg-primary/5 px-2 py-1 rounded-lg uppercase" style={{ color: primaryColor }}>{slots.length} opções</span>}
                  </div>

                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-3">
                      {(slots || []).map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-4 rounded-2xl text-xs font-black border transition-all ${selectedTime === t ? 'text-white shadow-xl scale-105' : 'bg-white text-gray-700 border-gray-100 hover:border-primary'}`}
                          style={selectedTime === t ? { backgroundColor: primaryColor, borderColor: primaryColor, boxShadow: `0 8px 20px -5px ${primaryColor}88` } : {}}
                        >
                          {t}
                        </button>
                      ))}
                      {slots.length === 0 && (
                        <div className="col-span-3 text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-8 rounded-[2rem] border border-red-100 flex flex-col items-center gap-3">
                          <Ban size={24} />
                          Tudo lotado para este dia.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-gray-300 mb-6"><CalendarIcon size={32} /></div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center leading-relaxed">Selecione um dia no calendário para ver a disponibilidade</p>
                    </div>
                  )}

                  {selectedTime && (
                    <button onClick={() => setStep(3)} className="w-full mt-8 py-5 text-white font-black rounded-3xl shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor }}>
                      Continuar Agendamento <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md mx-auto animate-fade-in">
              <div className="text-center mb-12">
                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                  <User size={32} />
                </div>
                <h2 className="text-3xl font-black tracking-tight" style={{ color: primaryColor }}>Seus Dados</h2>
                <p className="text-gray-400 text-sm font-medium mt-2">Preencha seus dados para o Agendamento:</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo *</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input required className="w-full pl-16 pr-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-900 outline-none transition-all font-bold text-lg placeholder:text-gray-300 placeholder:font-medium" value={clientData.name} onChange={e => setClientData({ ...clientData, name: toTitleCase(e.target.value) })} placeholder="Ex: João da Silva" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">WhatsApp / Telefone *</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input required className="w-full pl-16 pr-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-900 outline-none transition-all font-mono font-bold text-lg placeholder:text-gray-300" value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value.replace(/\D/g, '') })} placeholder="090 0000 0000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-mail (Opcional)</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input type="email" className="w-full pl-16 pr-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-900 outline-none transition-all font-bold text-lg placeholder:text-gray-300 placeholder:font-medium" value={clientData.email || ''} onChange={e => setClientData({ ...clientData, email: e.target.value })} placeholder="exemplo@email.com" />
                  </div>
                </div>

                <button type="submit" className="w-full py-5 text-white font-black rounded-3xl shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] text-[11px] mt-10 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor }}>
                  Revisar Agendamento <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-md mx-auto animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Confirme o seu agendamento:</h2>
                <p className="text-gray-400 text-sm font-medium mt-2">Confira se tudo está correto antes de confirmar.</p>
              </div>

              <div className="bg-gray-50 rounded-[3rem] p-10 space-y-8 text-left border border-gray-100 mb-8 shadow-inner relative overflow-hidden">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-2xl tracking-tight capitalize" style={{ color: primaryColor }}>{selectedService?.name}</p>
                    {selectedService && selectedService.price > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-black text-gray-900">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(selectedService.price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
                    <p className="font-bold text-gray-800 text-lg leading-tight">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
                    <div className="flex items-center gap-2">
                      <Clock size={18} style={{ color: primaryColor }} />
                      <p className="font-black text-gray-800 text-2xl leading-none">{selectedTime}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-gray-200 flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100" style={{ color: primaryColor }}><Clock size={18} /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duração</p>
                      <p className="font-bold text-gray-900">{formatDurationFriendly(selectedService?.duration || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100" style={{ color: primaryColor }}><User size={18} /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                      <p className="font-bold text-gray-900">{clientData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100" style={{ color: primaryColor }}><Phone size={18} /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                      <p className="font-bold text-gray-900">{clientData.phone}</p>
                    </div>
                  </div>
                  {clientData.email && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100" style={{ color: primaryColor }}><Mail size={18} /></div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">E-mail</p>
                        <p className="font-bold text-gray-900">{clientData.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-xs font-bold animate-pulse">
                  <AlertCircle size={18} />
                  {errorMsg}
                </div>
              )}

              <button onClick={handleFinalConfirm} disabled={isSubmitting} className="w-full py-6 text-white font-black rounded-3xl shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] text-[12px] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                {isSubmitting ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><CheckCircle size={20} /> Confirmar Agendamento</>
                )}
              </button>
              <button onClick={() => setStep(3)} disabled={isSubmitting} className="w-full mt-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                Corrigir meus dados
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-16 animate-fade-in flex flex-col items-center">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner animate-bounce">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Agendamento Confirmado!</h2>
              <p className="text-gray-400 mb-10 max-w-sm mx-auto font-medium text-base leading-relaxed">
                Olá, <b>{clientData.name}</b>! Seu agendamento foi realizado com sucesso.
              </p>
              <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 mb-10 w-full max-w-md text-left shadow-sm">
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">DETALHES DO AGENDAMENTO</p>
                <p className="font-black text-gray-900 text-2xl mb-2 capitalize" style={{ color: primaryColor }}>{selectedService?.name}</p>
                <div className="flex items-center gap-2 text-gray-600 font-bold text-lg">
                  <Calendar size={20} className="text-gray-300" />
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {selectedTime}
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-16 py-6 text-white font-black rounded-3xl shadow-2xl uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: primaryColor }}>
                Voltar ao Início
              </button>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-12 mb-16 flex flex-col items-center opacity-30">
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center">
          © {new Date().getFullYear()} Creative Print. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};