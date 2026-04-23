
import React, { useState, useMemo } from 'react';
import { AvailabilityConfig, WorkingHour, BlockedDate } from '../types';
import { Save, Plus, Trash2, Clock, Calendar as CalendarIcon, X, Check } from 'lucide-react';

interface Props {
  config: AvailabilityConfig;
  onSave: (config: AvailabilityConfig) => void;
}

export const AvailabilityTab: React.FC<Props> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AvailabilityConfig>(() => {
    if (!config) return { workingHours: [], blockedDates: [], intervalMinutes: 30 };
    try { return JSON.parse(JSON.stringify(config)); }
    catch (e) { return { workingHours: [], blockedDates: [], intervalMinutes: 30 }; }
  });

  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('Indisponível');
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Slot generation logic similar to PublicBookingPage
  const availableSlots = useMemo(() => {
    if (!newBlockDate) return [];
    
    const jsDayOfWeek = new Date(newBlockDate + 'T12:00:00').getDay();
    const jsDayToPtDay: Record<number, string> = {
      1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 0: 'domingo'
    };
    const dayName = jsDayToPtDay[jsDayOfWeek];
    const dayConfig = localConfig.workingHours.find(h => h.day === dayName);
    
    if (!dayConfig || (!dayConfig.enabled && !dayConfig.isWorking)) return [];

    const start = dayConfig.startTime || dayConfig.start || '09:00';
    const end = dayConfig.endTime || dayConfig.end || '18:00';
    const interval = localConfig.intervalMinutes || 30;

    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const slots: string[] = [];
    let curr = toMin(start);
    const endMin = toMin(end);

    while (curr <= endMin) {
      slots.push(`${String(Math.floor(curr / 60)).padStart(2, '0')}:${String(curr % 60).padStart(2, '0')}`);
      curr += interval;
    }
    return slots;
  }, [newBlockDate, localConfig.workingHours, localConfig.intervalMinutes]);

  const handleHourChange = (index: number, field: keyof WorkingHour, value: any) => {
    const newHours = [...localConfig.workingHours];
    if (field === 'isWorking') {
      newHours[index] = { ...newHours[index], isWorking: value, enabled: value } as any;
    } else {
      newHours[index] = { ...newHours[index], [field]: value };
    }
    setLocalConfig({ ...localConfig, workingHours: newHours });
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleAddBlocks = () => {
    if (!newBlockDate) return;

    let newBlocks: BlockedDate[] = [];
    const existingBlocks = localConfig.blockedDates || [];

    if (selectedSlots.length === 0) {
      // Verifica se já existe um bloqueio de dia inteiro para esta data
      const hasFullDay = existingBlocks.some(b => b.date === newBlockDate && !b.startTime);
      if (!hasFullDay) {
        newBlocks.push({
          id: Date.now(),
          date: newBlockDate,
          reason: newBlockReason,
          startTime: null,
          endTime: null
        });
      }
    } else {
      // Bloqueia slots específicos
      selectedSlots.forEach((slot, idx) => {
        // Verifica se este slot específico já está bloqueado
        const isAlreadyBlocked = existingBlocks.some(b => b.date === newBlockDate && b.startTime === slot);
        if (!isAlreadyBlocked) {
          const [h, m] = slot.split(':').map(Number);
          const endMin = (h * 60 + m) + (localConfig.intervalMinutes || 30);
          const endTimeStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
          
          newBlocks.push({
            id: Date.now() + idx,
            date: newBlockDate,
            reason: newBlockReason,
            startTime: slot,
            endTime: endTimeStr
          });
        }
      });
    }

    if (newBlocks.length > 0) {
      setLocalConfig({
        ...localConfig,
        blockedDates: [...existingBlocks, ...newBlocks]
      });
    }

    setNewBlockDate('');
    setSelectedSlots([]);
    setShowSlotsModal(false);
  };

  const removeBlock = (id: number) => {
    setLocalConfig({
      ...localConfig,
      blockedDates: localConfig.blockedDates.filter(b => b.id !== id)
    });
  };

  return (
    <div className="space-y-6 pb-20 relative animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Configuração de Disponibilidade</h2>
          <p className="text-gray-500 text-sm">Defina seus horários de atendimento padrão e dias de folga.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Intervalo entre agendamentos</h3>
            <p className="text-gray-400 text-xs font-medium">Define de quanto em quanto tempo seus horários aparecem.</p>
          </div>
        </div>
        <select
          value={localConfig.intervalMinutes}
          onChange={(e) => setLocalConfig({ ...localConfig, intervalMinutes: Number(e.target.value) })}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
        >
          {[15, 30, 45, 60, 120, 180, 240, 360, 480, 720, 1440].map(m => (
            <option key={m} value={m}>
              {m < 60 ? `${m} minutos` : (m === 1440 ? '24 horas (Diária)' : `${m / 60} horas`)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Dia</div>
            <div className="col-span-2 text-center">Atende?</div>
            <div className="col-span-4">Início</div>
            <div className="col-span-4">Fim</div>
          </div>
          {(localConfig?.workingHours || []).map((wh, idx) => (
            <div key={wh.day} className={`px-6 py-4 grid grid-cols-12 gap-4 items-center ${!wh.isWorking ? 'opacity-50 bg-gray-50' : ''}`}>
              <div className="col-span-2 font-medium text-gray-900">{wh.name}</div>
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => handleHourChange(idx, 'isWorking', !wh.isWorking)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${wh.isWorking ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wh.isWorking ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="col-span-4">
                <input
                  type="time"
                  disabled={!wh.isWorking}
                  value={wh.startTime}
                  onChange={(e) => handleHourChange(idx, 'startTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="time"
                  disabled={!wh.isWorking}
                  value={wh.endTime}
                  onChange={(e) => handleHourChange(idx, 'endTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Bloqueio de Agenda</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">1. Selecione o Dia</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={newBlockDate}
                onChange={(e) => {
                  setNewBlockDate(e.target.value);
                  setShowSlotsModal(true);
                  setSelectedSlots([]);
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">2. Motivo do Bloqueio</label>
            <input
              type="text"
              placeholder="Ex: Feriado, Consulta, Folga..."
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all capitalize"
            />
          </div>
        </div>

        {/* Selected Slots Display */}
        {newBlockDate && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 animate-fade-in">
            <p className="text-sm font-bold text-amber-800 mb-2">
              Resumo do Bloqueio para {new Date(newBlockDate + 'T12:00:00').toLocaleDateString('pt-BR')}:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.length === 0 ? (
                <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">Bloquear Dia Inteiro</span>
              ) : (
                selectedSlots.map(s => (
                  <span key={s} className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">{s}</span>
                ))
              )}
            </div>
            <p className="text-[10px] text-amber-600 mt-3 font-black uppercase tracking-[0.2em] italic">
              * esses horários serão bloqueados
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleAddBlocks}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-amber-200"
              >
                <Check size={18} /> Confirmar Bloqueio
              </button>
              <button
                onClick={() => setShowSlotsModal(true)}
                className="bg-white text-amber-700 border border-amber-200 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-amber-100/50"
              >
                Alterar Horários
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Bloqueios Ativos</h4>
          {(!localConfig?.blockedDates || localConfig.blockedDates.length === 0) && (
            <p className="text-gray-400 text-sm italic">Nenhum bloqueio ativo.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(localConfig?.blockedDates || []).map(block => (
              <div key={block.id} className="flex justify-between items-center p-4 bg-red-50 text-red-700 rounded-3xl border border-red-100 group transition-all hover:bg-red-100/50">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-2xl text-red-600 shadow-sm">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {new Date(block.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                    <p className="text-[10px] uppercase font-black text-red-600 tracking-wider opacity-80">
                      {block.startTime ? `${block.startTime} - ${block.endTime}` : 'Dia Inteiro'} • {block.reason}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="text-red-300 hover:text-red-600 p-2 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => onSave(localConfig)}
          className="bg-primary hover:bg-primary-hover text-white px-10 py-5 rounded-3xl font-black shadow-2xl shadow-primary/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]"
        >
          <Save size={20} /> Salvar Alterações
        </button>
      </div>

      {/* Slots Selection Modal */}
      {showSlotsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-10 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Selecione os Horários</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">Quais horários você deseja bloquear?</p>
              </div>
              <button onClick={() => setShowSlotsModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-10 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {availableSlots.map(slot => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => toggleSlot(slot)}
                        className={`py-5 rounded-3xl text-[11px] font-black border transition-all ${
                          isSelected 
                          ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105' 
                          : 'bg-white border-gray-100 text-gray-700 hover:border-primary hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="bg-red-50 text-red-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <X size={40} />
                  </div>
                  <p className="text-gray-500 font-bold max-w-xs mx-auto">Este dia está configurado como folga ou não possui horários disponíveis.</p>
                </div>
              )}
            </div>

            <div className="p-10 bg-gray-50 flex flex-col gap-4">
              {selectedSlots.length > 0 ? (
                <>
                  <button
                    onClick={() => setShowSlotsModal(false)}
                    className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                  >
                    Concluir Seleção ({selectedSlots.length})
                  </button>
                  <button
                    onClick={() => setSelectedSlots([])}
                    className="w-full py-4 text-gray-400 font-bold uppercase text-[9px] hover:text-red-500 transition-colors"
                  >
                    Limpar Seleção
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedSlots([]);
                      handleAddBlocks();
                    }}
                    className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-xl shadow-black/10"
                  >
                    Bloquear Dia Inteiro
                  </button>
                  <button
                    onClick={() => setShowSlotsModal(false)}
                    className="w-full py-4 text-gray-400 font-bold uppercase text-[9px] hover:underline"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
