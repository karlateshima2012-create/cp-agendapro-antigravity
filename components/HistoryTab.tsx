
import React, { useState, useEffect } from 'react';
import { api } from '../src/api';
import { Appointment } from '../types';
import { 
  Search, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2,
  Download,
  Loader2
} from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const filters: any = { history: true };
      if (dateFrom) filters.from = `${dateFrom} 00:00:00`;
      if (dateTo) filters.to = `${dateTo} 23:59:59`;
      
      const resp = await api.listAppointments(filters);
      if (resp.ok) {
        setAppointments(resp.data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateFrom, dateTo]);

  const filteredAppointments = appointments.filter(app => {
    const searchLower = search.toLowerCase();
    return (
      app.clientName.toLowerCase().includes(searchLower) ||
      app.clientPhone.includes(searchLower) ||
      app.serviceName.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (appointment: Appointment) => {
    if (appointment.deleted_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
          <Trash2 size={12} /> EXCLUÍDO
        </span>
      );
    }

    switch (appointment.status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 size={12} /> CONFIRMADO
          </span>
        );
      case 'canceled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle size={12} /> CANCELADO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock size={12} /> PENDENTE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Histórico Completo</h2>
          <p className="text-gray-500 text-sm">Visualize e filtre todos os agendamentos realizados, incluindo os excluídos.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nome, telefone ou serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="w-full md:w-44 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="w-full md:w-44 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <button
          onClick={fetchHistory}
          className="bg-gray-800 hover:bg-black text-white p-2.5 rounded-xl transition-colors shadow-sm"
          title="Recarregar"
        >
          <Clock size={18} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-gray-400 text-sm font-medium">Carregando histórico...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Calendar className="text-gray-300" size={48} />
            </div>
            <h3 className="text-gray-800 font-bold text-lg">Nenhum registro encontrado</h3>
            <p className="text-gray-400 text-sm max-w-xs mt-1">
              Ajuste os filtros para encontrar o que procura.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className={`hover:bg-gray-50/50 transition-colors ${app.deleted_at ? 'opacity-60 bg-gray-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg text-primary">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(app.startAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(app.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-900">{app.clientName}</p>
                        <p className="text-xs text-gray-500 font-medium">{app.clientPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                        {app.serviceName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(app)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
