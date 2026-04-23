
import React, { useState } from 'react';
import { AvailabilityConfig, WorkingHour } from '../types';
import { Save, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';

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
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newBlockStartTime, setNewBlockStartTime] = useState('');
  const [newBlockEndTime, setNewBlockEndTime] = useState('');


  const handleHourChange = (index: number, field: keyof WorkingHour, value: any) => {
    const newHours = [...localConfig.workingHours];
    // ✅ Cirúrgico: manter `enabled` sincronizado com o toggle
    // (o save usa `isWorking` como fonte principal, mas isso evita qualquer estado "velho")
    if (field === 'isWorking') {
      newHours[index] = { ...newHours[index], isWorking: value, enabled: value } as any;
    } else {
      newHours[index] = { ...newHours[index], [field]: value };
    }
    setLocalConfig({ ...localConfig, workingHours: newHours });
  };

  const handleAddBlock = () => {
    if (!newBlockDate || !newBlockReason) return;
    setLocalConfig({
      ...localConfig,
      blockedDates: [
        ...localConfig.blockedDates,
        { 
          id: Date.now(), 
          date: newBlockDate, 
          reason: newBlockReason,
          startTime: newBlockStartTime || null,
          endTime: newBlockEndTime || null
        }
      ]
    });
    setNewBlockDate('');
    setNewBlockReason('');
    setNewBlockStartTime('');
    setNewBlockEndTime('');
  };

  const removeBlock = (id: number) => {
    setLocalConfig({
      ...localConfig,
      blockedDates: localConfig.blockedDates.filter(b => b.id !== id)
    });
  };

  // OBS: o feedback de "salvo" já é controlado no App.tsx via Toast global.
  // Esse componente não possui (nem deve possuir) um estado local de toast.
  const handleSaveWithFeedback = () => {
    onSave(localConfig);
  };

  return (
    <div className="space-y-6 pb-20 relative animate-fade-in">


      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Configuração de Disponibilidade</h2>
          <p className="text-gray-500 text-sm">Defina seus horários de atendimento padrão e dias de folga.</p>
        </div>
      </div>

      {/* INTERVALO ENTRE ATENDIMENTOS REINTRODUZIDO */}
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
        <div className="flex items-center gap-3">
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">Bloqueio de Dias (Folgas/Feriados)</h3>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none"
            />
            <input
              type="text"
              placeholder="Motivo (ex: Feriado)"
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none capitalize"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase">Bloquear Horário (opcional):</span>
              <input
                type="time"
                value={newBlockStartTime}
                onChange={(e) => setNewBlockStartTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm"
              />
              <span className="text-gray-400 text-xs">até</span>
              <input
                type="time"
                value={newBlockEndTime}
                onChange={(e) => setNewBlockEndTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <button
              onClick={handleAddBlock}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus size={18} /> Adicionar Bloqueio
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {(!localConfig?.blockedDates || localConfig.blockedDates.length === 0) && <p className="text-gray-400 italic">Nenhum bloqueio cadastrado.</p>}
          {(localConfig?.blockedDates || []).map(block => (
            <div key={block.id} className="flex justify-between items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
              <span className="font-medium">
                {new Date(block.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} 
                {block.startTime && block.endTime && ` (${block.startTime} - ${block.endTime})`} - 
                <span className="font-normal capitalize ml-1">{block.reason}</span>
              </span>
              <button onClick={() => removeBlock(block.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveWithFeedback}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 flex items-center gap-2 transition-transform active:scale-95"
        >
          <Save size={20} /> Salvar Disponibilidade
        </button>
      </div>
    </div>
  );
};
