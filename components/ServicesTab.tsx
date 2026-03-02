
import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

interface Props {
  services: Service[];
  onUpdateServices: (services: Service[]) => void;
}

export const ServicesTab: React.FC<Props> = ({ services, onUpdateServices }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  // Form state
  const [formState, setFormState] = useState<Partial<Service>>({});

  const startEdit = (svc: Service) => {
    setEditingId(svc.id);
    setFormState(svc);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState({});
  };

  const handleSave = () => {
    if (!formState.name) return; // Price is optional now

    if (editingId === 0) {
      // New Service
      const newService: Service = {
        id: Date.now(),
        name: formState.name,
        description: formState.description || '',
        duration: formState.duration || 30,
        cleaning_buffer: formState.cleaning_buffer || 0,
        price: formState.price || 0
      };
      onUpdateServices([...services, newService]);
    } else {
      // Update existing
      onUpdateServices(services.map(s => s.id === editingId ? { ...s, ...formState } as Service : s));
    }
    cancelEdit();
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      onUpdateServices(services.filter(s => s.id !== id));
    }
  };

  const startNew = () => {
    setEditingId(0);
    setFormState({ duration: 30, cleaning_buffer: 0, price: 0, description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Meus Serviços</h2>
          <p className="text-gray-500 text-sm">Gerencie os serviços que seus clientes podem agendar.</p>
        </div>
        <button
          onClick={startNew}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={20} /> Novo Serviço
        </button>
      </div>

      {editingId !== null && (
        <div className="bg-white p-6 rounded-2xl border border-primary/30 shadow-lg mb-6 ring-4 ring-primary/5">
          {/* Honey-pot inputs to prevent browser from suggesting "Save Password" */}
          <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" name="prevent_autofill_pwd" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

          <h3 className="font-bold text-lg mb-4 text-primary">{editingId === 0 ? 'Novo Serviço' : 'Editar Serviço'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                name="service_name_field"
                id="service_name_field"
                autoComplete="off"
                value={formState.name || ''}
                onChange={e => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none capitalize"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (¥) <span className="text-gray-400 font-normal">(Opcional)</span></label>
              <input
                type="number"
                placeholder="0"
                value={formState.price || ''}
                onChange={e => setFormState({ ...formState, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={2}
                name="service_description_field"
                id="service_description_field"
                autoComplete="off"
                value={formState.description || ''}
                onChange={e => setFormState({ ...formState, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none capitalize"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
              <select
                value={formState.duration || 30}
                onChange={e => setFormState({ ...formState, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary outline-none"
              >
                {[15, 30, 45, 60, 120, 180, 240, 360, 480, 720, 1440].map(m => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : (m === 1440 ? '24h (Diária)' : `${m / 60}h`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de Limpeza <span className="text-gray-400 font-normal">(Bloqueio extra)</span></label>
              <select
                value={formState.cleaning_buffer || 0}
                onChange={e => setFormState({ ...formState, cleaning_buffer: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50/30 text-gray-900 focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={0}>Nenhum</option>
                {[15, 30, 45, 60, 90, 120, 180, 240, 360, 480].map(m => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60}h`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={cancelEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-md">Salvar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(services || []).map(svc => (
          <div key={svc.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-900 capitalize">{svc.name}</h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2 capitalize">{svc.description}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(svc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(svc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm font-medium text-gray-700 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                <Clock size={14} /> {svc.duration < 60 ? `${svc.duration} min` : (svc.duration === 1440 ? '24h (Diária)' : `${svc.duration / 60}h`)}
              </span>
              {svc.price > 0 && (
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                  {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(svc.price)}
                </span>
              )}
              {svc.cleaning_buffer > 0 && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                  Limpeza: {svc.cleaning_buffer < 60 ? `${svc.cleaning_buffer}m` : `${svc.cleaning_buffer / 60}h`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
