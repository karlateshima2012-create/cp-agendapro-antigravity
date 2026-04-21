import React, { useState, useEffect } from 'react';
import { User, PlanType, AccountStatus } from '../types';
import {
  Users, Lock, Unlock, Trash2, LogOut, CheckCircle,
  X, RefreshCw, MessageSquare, Clock, AlertTriangle, Activity, Briefcase, Save, Edit2, User as UserIcon, Calendar, Copy, Check
} from 'lucide-react';

interface Props {
  users: User[];
  onAddUser: (user: any) => Promise<boolean>;
  onUpdateAdminUser: (userId: string, data: Partial<User>) => Promise<boolean>;
  onUpdateUserStatus: (id: string, status: AccountStatus) => void;
  onRenewPlan: (userId: string, currentExpiry: string | undefined, months: number) => Promise<boolean>;
  onDeleteUser: (id: string) => void;
  onLogout: () => void;
  showToast?: (message: string, type?: any) => void;
}

export const AdminDashboard: React.FC<Props> = ({ users, onAddUser, onUpdateAdminUser, onUpdateUserStatus, onRenewPlan, onDeleteUser, onLogout, showToast }) => {
  console.log('📊 [Dashboard] Received users prop:', users);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  // IMPORTANTE: por padrão NÃO aplica renovação.
  // A renovação deve ser uma ação explícita (6 ou 12 meses).
  const [renewalPeriod, setRenewalPeriod] = useState<number>(0);
  const [isRenewingInModal, setIsRenewingInModal] = useState(false);

  const [editData, setEditData] = useState<Partial<User>>({});
  const [manualExpiryDate, setManualExpiryDate] = useState<string>(''); // NOVO: para editar data manualmente

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    companyName: '',
    ownerName: '',
    contactPhone: '',
    planType: '6m' as PlanType
  });

  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Lógica de Hierarquia e Ordenação: 
  // 1. Peso de Status (Ativos = 0, Expirados = 1, Bloqueados = 2)
  // 2. Ordem Alfabética da Empresa
  const sortedClients = [...(users || []).filter(u => u && u.email !== 'suporte@creativeprintjp.com')].sort((a, b) => {
    const getStatusWeight = (u: User) => {
      const isExp = u.planExpiresAt && new Date(u.planExpiresAt).getTime() < now.getTime();
      if (u.accountStatus === 'blocked') return 2;
      if (isExp) return 1;
      return 0; // Ativos no topo
    };

    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);

    if (weightA !== weightB) return weightA - weightB;

    // Sort by creation date DESC (Newest first)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const clients = sortedClients || [];

  const expire3d = clients.filter(c => {
    if (!c.planExpiresAt) return false;
    const exp = new Date(c.planExpiresAt);
    const diff = exp.getTime() - now.getTime();
    return diff > 0 && diff <= 3 * dayInMs;
  }).length;

  const expire7d = clients.filter(c => {
    if (!c.planExpiresAt) return false;
    const exp = new Date(c.planExpiresAt);
    const diff = exp.getTime() - now.getTime();
    // Excluímos os que já estão no filtro de 3 dias para não duplicar
    return diff > 3 * dayInMs && diff <= 7 * dayInMs;
  }).length;

  const activeClients = clients.filter(c => c.accountStatus === 'active').length;
  // Metric: Plano Vencido (Expired Plans)
  const expiredPlans = clients.filter(c => {
    if (!c.planExpiresAt) return false;
    const exp = new Date(c.planExpiresAt);
    const today = new Date();
    exp.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return exp.getTime() <= today.getTime();
  }).length;
  const blockedClients = clients.filter(c => c.accountStatus === 'blocked').length;

  // NOVO: Função para calcular a prévia da nova data de vencimento
  const getPreviewExpiryDate = () => {
    // Usa a data manual se estiver definida, senão usa a data atual do usuário
    const baseDateStr = manualExpiryDate || detailsUser?.planExpiresAt;
    if (!baseDateStr) return '---';

    const baseDate = new Date(baseDateStr);
    const dateToRenewFrom = baseDate < now ? now : baseDate;
    const newDate = new Date(dateToRenewFrom);
    newDate.setMonth(newDate.getMonth() + renewalPeriod);
    return newDate.toLocaleDateString('pt-BR');
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewUser(prev => ({ ...prev, password: pass }));
  };

  const handleOpenDetails = (user: User) => {
    setDetailsUser(user);
    // Não renova automaticamente ao abrir o modal.
    setRenewalPeriod(0);
    setEditData({
      companyName: user.companyName,
      ownerName: user.ownerName,
      contactPhone: user.contactPhone,
      email: user.email,
      planType: user.planType
    });
    // NOVO: Inicializa a data manual com a data atual do usuário formatada para input date
    if (user.planExpiresAt) {
      const date = new Date(user.planExpiresAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setManualExpiryDate(`${year}-${month}-${day}`);
    } else {
      setManualExpiryDate('');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const expiresAt = new Date();
    const months = newUser.planType === '12m' ? 12 : 
                   newUser.planType === '6m' ? 6 : 
                   newUser.planType === '3m' ? 3 : 1;
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const userData = {
      email: newUser.email.trim().toLowerCase(),
      password: newUser.password.trim(),
      companyName: newUser.companyName.trim(),
      ownerName: newUser.ownerName.trim(),
      contactPhone: newUser.contactPhone.trim(),
      planType: newUser.planType,
      planExpiresAt: expiresAt.toISOString(),
    };

    const success = await onAddUser(userData);
    if (success) {
      setShowAddForm(false);
      setCreatedUser(userData);
      setNewUser({ email: '', password: '', companyName: '', ownerName: '', contactPhone: '', planType: '6m' });
    }
    setIsSubmitting(false);
  };

  const openWhatsAppMessage = () => {
    if (!createdUser) return;

    const baseUrl = window.location.origin;

    let phone = createdUser.contactPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);

    const cleanPhone = phone.startsWith('81') ? phone : '81' + phone;

    const message =
      `*Sua agenda profissional está pronta*

O acesso ao CP Agenda Pro já foi criado para você.

🌐 *Site Oficial:*
https://saibamaiscpagendapro.creativeprintjp.com/
(Basta clicar em 'Login' para acessar seu painel)

🔗 *Link Direto do Sistema:*
${baseUrl}

📧 *E-mail:*
${createdUser.email}

🔑 *Senha Provisória:*
${createdUser.password}

No primeiro acesso, o sistema irá redirecionar automaticamente para a alteração de senha, que é obrigatória para sua segurança.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };


  // NOVO: Função atualizada para salvar
  const handleSaveModalUpdates = async () => {
    if (!detailsUser) return;
    setIsRenewingInModal(true);

    // Prepara os dados para atualização
    const updateData: Partial<User> = {
      companyName: editData.companyName,
      ownerName: editData.ownerName,
      contactPhone: editData.contactPhone,
      email: editData.email,
      planType: editData.planType,
    };

    // Se houver data manual, inclui no update
    if (manualExpiryDate) {
      const manualDate = new Date(manualExpiryDate);
      // Garante que a data seja no final do dia (23:59:59)
      manualDate.setHours(23, 59, 59, 999);
      updateData.planExpiresAt = manualDate.toISOString();
    }

    // Primeiro atualiza os dados do usuário
    const updateSuccess = await onUpdateAdminUser(detailsUser.id, updateData);

    // Se renovação foi selecionada, aplica a renovação
    let renewalSuccess = true;
    if (renewalPeriod > 0) {
      // Usa a data manual como base se existir, senão usa a data do usuário
      const baseDate = manualExpiryDate ? manualExpiryDate : detailsUser.planExpiresAt;
      renewalSuccess = await onRenewPlan(detailsUser.id, baseDate, renewalPeriod);
    }

    setIsRenewingInModal(false);
    if (updateSuccess && renewalSuccess) {
      if (showToast) showToast("Dados atualizados com sucesso!");
      setDetailsUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 p-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">CP</div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Painel Master</h1>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">CP Gestão Admin</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <Clock className="text-red-500 mb-3" size={20} />
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Vence em 7 dias</h3>
            <p className="text-3xl font-black text-gray-900 mt-1">{expire7d}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <AlertTriangle className="text-orange-600 animate-pulse mb-3" size={20} />
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Vence em 3 dias</h3>
            <p className="text-3xl font-black text-gray-900 mt-1">{expire3d}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle size={18} className="text-red-500" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano Vencido</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{expiredPlans}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <Activity className="text-primary mb-3" size={20} />
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ativos</h3>
            <p className="text-3xl font-black text-primary mt-1">{activeClients}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Users size={24} className="text-primary" /> Clientes Profissionais ({clients.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all relative z-10"
          >
            Novo Profissional
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa / Responsável</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Vencimento</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Agendamentos</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(clients || []).map(client => {
                  const isExp = client.planExpiresAt && (() => {
                    const exp = new Date(client.planExpiresAt);
                    const today = new Date();
                    // Reset time to compare only dates
                    exp.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return exp.getTime() <= today.getTime();
                  })();
                  const isActive = client.accountStatus === 'active';
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="font-black text-gray-900 uppercase text-sm">{client.companyName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <UserIcon size={10} className="text-primary" />
                            <p className="text-[10px] text-gray-500 font-bold">{client.ownerName || 'Não informado'}</p>
                          </div>
                          <p className="text-[9px] text-gray-300 font-bold mt-0.5">{client.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          {(() => {
                            const exp = new Date(client.planExpiresAt || 0);
                            const diff = exp.getTime() - now.getTime();
                            const isExpired = exp.getTime() <= now.getTime();
                            const isUrgent3d = diff > 0 && diff <= 3 * dayInMs;
                            const isUrgent7d = diff > 3 * dayInMs && diff <= 7 * dayInMs;

                            let bgColor = "bg-gray-50";
                            let textColor = "text-gray-500";
                            let borderColor = "border-gray-100";
                            let label = "VENCIMENTO";

                            if (isExpired) {
                              bgColor = "bg-red-600";
                              textColor = "text-white";
                              borderColor = "border-red-700";
                              label = "VENCIDO";
                            } else if (isUrgent3d) {
                              bgColor = "bg-orange-500";
                              textColor = "text-white";
                              borderColor = "border-orange-600";
                              label = "URGENTE: 3 DIAS";
                            } else if (isUrgent7d) {
                              bgColor = "bg-yellow-400";
                              textColor = "text-gray-900";
                              borderColor = "border-yellow-500";
                              label = "ATENÇÃO: 7 DIAS";
                            }

                            return (
                              <span className={`${bgColor} ${textColor} px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border ${borderColor} w-fit flex items-center gap-2 shadow-sm`}>
                                📅 {label}: {client.planExpiresAt ? new Date(client.planExpiresAt).toLocaleDateString('pt-BR') : '---'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex flex-col items-center p-3 bg-gray-50 rounded-2xl border border-gray-100 min-w-[140px]">
                          <span className="text-xl font-black text-primary">{client.appointmentCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => {
                            const link = `${window.location.origin}/?p=${client.id}`;
                            navigator.clipboard.writeText(link);
                            if (showToast) showToast("Link público copiado!");
                          }} className="p-2.5 text-blue-500 bg-white border border-gray-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm" title="Copiar Link Público">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => handleOpenDetails(client)} className="p-2.5 text-gray-500 bg-white border border-gray-200 hover:text-primary rounded-xl transition-all shadow-sm" title="Editar Profissional">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onUpdateUserStatus(client.id, isActive ? 'blocked' : 'active')}
                            className={`p-2.5 rounded-xl border transition-all shadow-sm ${isActive ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                          >
                            {isActive ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          <button onClick={() => onDeleteUser(client.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: FICHA E EDIÇÃO */}
      {detailsUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999] backdrop-blur-sm animate-fade-in overflow-hidden">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl border-t-8 border-primary relative flex flex-col max-h-[95vh] no-scrollbar overflow-y-auto">
            <button onClick={() => setDetailsUser(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2"><X size={28} /></button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ficha e Edição</h3>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Status: {detailsUser.accountStatus}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Admin - Cadastro</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Empresa</label>
                    <input type="text" value={editData.companyName || ''} onChange={e => setEditData({ ...editData, companyName: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Responsável (Info Interna)</label>
                    <input type="text" value={editData.ownerName || ''} onChange={e => setEditData({ ...editData, ownerName: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white" placeholder="Nome do gestor" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">WhatsApp</label>
                    <input type="text" value={editData.contactPhone || ''} onChange={e => setEditData({ ...editData, contactPhone: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">E-mail</label>
                    <input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value.toLowerCase() })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Assinatura</h4>
                <div className="space-y-3">
                  {/* NOVO: Campo para editar data de vencimento manualmente */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                      <Calendar size={14} className="text-primary" /> Dados da Assinatura
                    </label>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100/50">
                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 block">Início do Plano</label>
                        <p className="text-base font-black text-blue-700">
                          {detailsUser.createdAt ? new Date(detailsUser.createdAt).toLocaleDateString('pt-BR') : '---'}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100/50">
                        <label className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 block">PRÓXIMO VENCIMENTO</label>
                        <p className="text-base font-black text-red-700">
                          {detailsUser.planExpiresAt ? new Date(detailsUser.planExpiresAt).toLocaleDateString('pt-BR') : '---'}
                        </p>
                      </div>
                    </div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Alterar Data Manualmente</label>
                    <input
                      type="date"
                      value={manualExpiryDate}
                      onChange={(e) => setManualExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary"><RefreshCw size={20} /></div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 tracking-tight">Renovação de Plano</h4>
                  <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Estender plano do profissional</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRenewalPeriod(0)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${renewalPeriod === 0 ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}
                >
                  <span className="text-[8px] font-black uppercase mb-1">Pausa</span>
                  <span className="text-[10px] font-black">0 meses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewalPeriod(1)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${renewalPeriod === 1 ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}
                >
                  <span className="text-[8px] font-black uppercase mb-1">Mensal</span>
                  <span className="text-[10px] font-black">+1 Mês</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewalPeriod(3)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${renewalPeriod === 3 ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}
                >
                  <span className="text-[8px] font-black uppercase mb-1">Trimestral</span>
                  <span className="text-[10px] font-black">+3 Meses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewalPeriod(6)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${renewalPeriod === 6 ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}
                >
                  <span className="text-[8px] font-black uppercase mb-1">Semestral</span>
                  <span className="text-[10px] font-black">+6 Meses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewalPeriod(12)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${renewalPeriod === 12 ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`}
                >
                  <span className="text-[8px] font-black uppercase mb-1">Anual</span>
                  <span className="text-[10px] font-black">+12 Meses</span>
                </button>
              </div>

              {renewalPeriod > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-primary/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Nova data prevista</p>
                      <p className="text-base font-black text-primary">{getPreviewExpiryDate()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-500">+{renewalPeriod} meses</p>
                  </div>
                </div>
              )}
            </div>

            {/* NOVO: QR CODE SECTION */}
            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 mt-6 mb-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 tracking-tight">Link de Agendamento (QR Code)</h4>
                  <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Acesso rápido para agendamentos</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100 shrink-0">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/?p=' + detailsUser.id)}`}
                    alt="QR Code Agendamento"
                    className="w-32 h-32 md:w-40 md:h-40"
                  />
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200 text-xs font-mono text-gray-400 truncate shadow-inner">
                    {window.location.origin}/?p={detailsUser.id}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/?p=${detailsUser.id}`;
                        navigator.clipboard.writeText(link);
                        if (showToast) showToast("Link copiado!");
                      }}
                      className="flex items-center justify-center gap-2 bg-white text-gray-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                      <Copy size={16} /> Copiar Link
                    </button>
                    <button
                      onClick={() => {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/?p=' + detailsUser.id)}`;
                        window.open(qrUrl, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 bg-white text-primary py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                    >
                      <Upload size={16} className="rotate-180" /> Baixar QR
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed px-1">
                    Este QR Code leva diretamente para a página de reservas do profissional. Útil para materiais impressos ou cartões de visita.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveModalUpdates}
              disabled={isRenewingInModal}
              className="w-full bg-[#0EA5E9] hover:bg-[#0284c7] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-8 mb-4 border-b-4 border-black/10"
            >
              {isRenewingInModal ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              SALVAR ALTERAÇÕES
            </button>
            <button onClick={() => setDetailsUser(null)} className="w-full text-gray-400 font-bold uppercase text-[9px] hover:underline mb-4">Descartar e Fechar</button>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PROFISSIONAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999] backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl border-t-8 border-primary relative overflow-y-auto max-h-[95vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ativar Novo Assinante</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2"><X size={28} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                  <input required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none font-bold transition-all" placeholder="Ex: Studio VIP" value={newUser.companyName} onChange={e => setNewUser({ ...newUser, companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsável (Admin)</label>
                  <input required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none font-bold transition-all" placeholder="Nome do gestor" value={newUser.ownerName} onChange={e => setNewUser({ ...newUser, ownerName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input required type="email" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none font-bold transition-all" placeholder="profissional@email.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value.toLowerCase().trim() })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none font-bold transition-all" placeholder="090 0000 0000" value={newUser.contactPhone} onChange={e => setNewUser({ ...newUser, contactPhone: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">Senha Temporária <button type="button" onClick={generateRandomPassword} className="text-primary hover:underline lowercase font-bold">gerar nova</button></label>
                <input required className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none font-mono font-bold transition-all" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Período da Assinatura</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, planType: '1m' })}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.planType === '1m' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/30'}`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, planType: '3m' })}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.planType === '3m' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/30'}`}
                  >
                    3 Meses
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, planType: '6m' })}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.planType === '6m' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/30'}`}
                  >
                    6 Meses
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, planType: '12m' })}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.planType === '12m' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/30'}`}
                  >
                    Anual
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4">
                {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : 'Finalizar e Ativar Conta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUCESSO PÓS-CADASTRO (ESTILO CRM) */}
      {createdUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative">
            <button onClick={() => setCreatedUser(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={24} />
            </button>

            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} />
            </div>

            <h3 className="text-2xl font-black mb-1 text-gray-900">Configuração Concluída!</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">O acesso para {createdUser.companyName} foi gerado.</p>

            <div className="bg-gray-50/50 rounded-[2rem] p-6 text-left border border-gray-100 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Mensagem de Boas-vindas</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight">Pronta para Envio</span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-xs text-gray-600 font-medium leading-relaxed shadow-sm whitespace-pre-wrap">
                {`Olá *${createdUser.companyName}*! 👋

Seu acesso ao sistema CP Agenda foi configurado com sucesso.

📍 *Dados de Acesso:*
📧 Login: ${createdUser.email}
🔑 Senha: ${createdUser.password}

🔗 *Painel de Gestão:*
${window.location.origin}

⚠️ *OBS:* Por segurança, sua senha deve ser redefinida no primeiro acesso.`}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={openWhatsAppMessage}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-primary/20 text-sm transition-all active:scale-95"
              >
                <Copy size={18} /> Copiar para WhatsApp
              </button>

              <button
                onClick={() => setCreatedUser(null)}
                className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-sm transition-all hover:bg-gray-100"
              >
                Fechar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};