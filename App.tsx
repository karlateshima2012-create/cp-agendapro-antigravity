import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { DEFAULT_AVAILABILITY } from './constants';
import { Appointment, AccountInfo, Service, AvailabilityConfig, User, UserRole, AppointmentStatus, AccountStatus } from './types';
import { PublicBookingPage } from './components/PublicBookingPage';
import { LoginScreen } from './components/LoginScreen';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BlockedScreen } from './components/BlockedScreen';
import { Toast, ToastType } from './components/Toast';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { LandingPage } from './components/LandingPage';
import { LegalTerms } from './components/LegalTerms';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentAccountStatus, setCurrentAccountStatus] = useState<AccountStatus>('active');
  const [blockedReason, setBlockedReason] = useState<string>(''); // NOVO: motivo do bloqueio

  const [view, setView] = useState<'landing' | 'login' | 'legal'>('landing');
  const [publicUserId, setPublicUserId] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [profile, setProfile] = useState<AccountInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [publicBusyAppointments, setPublicBusyAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityConfig>(DEFAULT_AVAILABILITY);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  // Verificar se está em modo público (?p=ID) e limpar sessão se estiver logado como admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicUserId = params.get('p');
    
    if (publicUserId && session?.user?.email === 'suporte@creativeprintjp.com') {
      // Se acessando link público mas está logado como admin
      // Podemos: 1) Fazer logout automático, ou 2) Manager sessão separada
      console.log('🔗 Modo público detectado - admin logado');
      // Opcional: supabase.auth.signOut() se quiser logout automático
    }
  }, [session]);

  const clearAllStates = useCallback(() => {
    setProfile(null);
    setAppointments([]);
    setPublicBusyAppointments([]);
    setServices([]);
    setAvailability(DEFAULT_AVAILABILITY);
    setAllUsers([]);
    setMustChangePassword(false);
    setCurrentAccountStatus('active');
    setBlockedReason(''); // LIMPA O MOTIVO
  }, []);

  const fetchPublicData = async (userId: string) => {
    try {
      let { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !prof) {
        return;
      }

      const accountInfo: AccountInfo = {
        companyName: prof.company_name || 'Empresa',
        contactEmail: prof.contact_email || prof.email || '',
        contactPhone: prof.contact_phone || prof.phone || '',
        status: prof.account_status || 'active',
        planType: prof.plan_type || '6m',
        planExpiresAt: prof.plan_expires_at || new Date().toISOString(),
        publicLink: `${window.location.origin}/?p=${userId}`,
        primaryColor: prof.primary_color || '#25aae1',
        secondaryColor: prof.secondary_color || '#1f2937',
        shortDescription: prof.short_description || '',
        servicesTitle: prof.services_title || '',
        servicesSubtitle: prof.services_subtitle || '',
        coverImage: prof.cover_image || '',
        profileImage: prof.profile_image || '',
        lifetimeAppointments: prof.lifetime_appointments || 0,
      };

      // ✅ VERIFICAÇÃO DE BLOQUEIO NO ACESSO PÚBLICO
      const isActuallyExpired = prof.plan_expires_at && new Date(prof.plan_expires_at).getTime() < Date.now();
      if (prof.account_status === 'blocked' || prof.account_status === 'expired' || isActuallyExpired) {
        let reason = 'Esta página de agendamentos está temporariamente suspensa.';
        if (prof.account_status === 'blocked') reason = 'Conta suspensa pelo administrador.';
        else if (prof.account_status === 'expired' || isActuallyExpired) reason = 'O plano deste profissional expirou.';

        setBlockedReason(reason);
        setCurrentAccountStatus('blocked');
        setProfile(accountInfo);
        return;
      }

      setProfile(accountInfo);

      const [svcs, avail, busy] = await Promise.all([
        // ✅ BUSCA SERVIÇOS
        supabase
          .from('services')
          .select('id, name, description, duration, price')
          .eq('user_id', userId)
          .order('id', { ascending: true }),

        // ✅ BUSCA DISPONIBILIDADE
        supabase
          .from('availability')
          .select('working_hours, blocked_dates, interval_minutes')
          .eq('user_id', userId)
          .maybeSingle(),

        // ✅ BUSCA BUSY SLOTS (SEM PII)
        supabase
          .from('public_busy_slots')
          .select('appointment_id, user_id, start_at, duration, status, updated_at')
          .eq('user_id', userId)
          .order('start_at', { ascending: true }),
      ]);

      // SERVIÇOS
      if (svcs.data) setServices(svcs.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: s.price
      })));

      // DISPONIBILIDADE
      if (avail.data) setAvailability({
        workingHours: avail.data.working_hours || DEFAULT_AVAILABILITY.workingHours,
        blockedDates: avail.data.blocked_dates || [],
        intervalMinutes: avail.data.interval_minutes || 30
      });

      // ✅ BUSY SLOTS -> Vira "Appointment" mínimo só pra bloquear horário
      if (busy.data) {
        const mappedBusy: Appointment[] = busy.data.map((b: any) => ({
          id: Number(b.appointment_id),
          user_id: b.user_id,
          startAt: b.start_at,
          duration: b.duration,
          status: b.status,
          createdAt: b.updated_at,
          // SEM PII:
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          serviceName: '',
          serviceId: null as any
        }));

        setPublicBusyAppointments(mappedBusy);
        setAppointments([]); // No público não precisa dos appointments completos
      }

    } catch (e) {
      console.error("Erro ao buscar dados públicos:", e);
    }
  };

  const fetchAllData = async (userId: string, role: UserRole) => {
    try {
      if (role === 'admin') {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('company_name', { ascending: true });

        if (error) throw error;

        const { data: appts } = await supabase
          .from('appointments')
          .select('user_id, created_at');

        const mappedUsers = (profiles || []).map((p: any) => {
          const userAppts = appts?.filter(a => a.user_id === p.id) || [];
          const lastOne = userAppts.length > 0 ? [...userAppts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null;

          return {
            id: p.id,
            email: p.contact_email || p.email || 'N/A',
            role: (p.email === 'suporte@creativeprintjp.com' ? 'admin' : 'client') as UserRole,
            companyName: p.company_name || 'Sem nome',
            ownerName: p.owner_name || '',
            contactPhone: p.contact_phone || p.phone || '',
            accountStatus: (p.account_status || 'active') as any,
            planType: (p.plan_type || '6m') as any,
            planExpiresAt: p.plan_expires_at,
            publicLink: `${window.location.origin}/?p=${p.id}`,
            lastAccessAt: p.updated_at || p.created_at,
            lastAppointmentAt: lastOne?.created_at || null,
            appointmentCount: p.lifetime_appointments || 0, // ✅ USANDO MÉTRICA VITALÍCIA
            createdAt: p.created_at
          };
        });
        setAllUsers(mappedUsers);
      } else {
        await fetchClientData(userId);
      }
    } catch (e: any) {
      console.error("Erro ao carregar dados do painel:", e);
    }
  };

  const fetchClientData = async (userId: string) => {
    try {
      // 1) Perfil
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profErr || !prof) {
        console.error('fetchClientData проф erro:', profErr);
        return;
      }

      const accountInfo: AccountInfo = {
        companyName: prof.company_name || 'Empresa',
        contactEmail: prof.contact_email || prof.email || '',
        contactPhone: prof.contact_phone || prof.phone || '',
        status: prof.account_status || 'active',
        planType: prof.plan_type || '6m',
        planExpiresAt: prof.plan_expires_at || new Date().toISOString(),
        publicLink: `${window.location.origin}/?p=${userId}`,
        primaryColor: prof.primary_color || '#25aae1',
        secondaryColor: prof.secondary_color || '#1f2937',
        shortDescription: prof.short_description || '',
        servicesTitle: prof.services_title || '',
        servicesSubtitle: prof.services_subtitle || '',
        coverImage: prof.cover_image || '',
        profileImage: prof.profile_image || '',
        telegramBotToken: prof.telegram_bot_token || '',
        telegramChatId: prof.telegram_chat_id || '',
        lifetimeAppointments: prof.lifetime_appointments || 0,
      };
      setProfile(accountInfo);

      // 2) Painel do profissional = SERVICES + AVAILABILITY + APPOINTMENTS (com PII)
      const [svcs, avail, appts] = await Promise.all([
        supabase
          .from('services')
          .select('id, name, description, duration, price')
          .eq('user_id', userId)
          .order('id', { ascending: true }),

        supabase
          .from('availability')
          .select('working_hours, blocked_dates, interval_minutes')
          .eq('user_id', userId)
          .maybeSingle(),

        supabase
          .from('appointments')
          .select('id, user_id, client_name, client_email, client_phone, service_id, service_name, start_at, duration, status, created_at')
          .eq('user_id', userId)
          .order('start_at', { ascending: true }),
      ]);

      // DEBUG (veja no console do navegador)
      console.log('APPOINTMENTS (raw):', appts);

      if (svcs.data) {
        setServices(svcs.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price
        })));
      }

      if (avail.data) {
        setAvailability({
          workingHours: avail.data.working_hours || DEFAULT_AVAILABILITY.workingHours,
          blockedDates: avail.data.blocked_dates || [],
          intervalMinutes: avail.data.interval_minutes || 30
        });
      }

      if (appts.error) {
        console.error('Erro ao buscar appointments:', appts.error);
        return;
      }

      if (appts.data) {
        const mapped: Appointment[] = appts.data.map((a: any) => ({
          id: Number(a.id), // appointments.id é BIGINT
          user_id: a.user_id,
          clientName: a.client_name ?? '',
          clientEmail: a.client_email ?? '',
          clientPhone: a.client_phone ?? '',
          serviceId: a.service_id,
          serviceName: a.service_name ?? '',
          startAt: a.start_at,
          duration: a.duration,
          status: a.status,
          createdAt: a.created_at
        }));

        setAppointments(mapped);
      }

    } catch (e) {
      console.error('Erro fetchClientData:', e);
    }
  };



  const handleAuthSession = useCallback(async (currentSession: any) => {
    if (!currentSession?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      clearAllStates();

      const email = currentSession.user.email?.toLowerCase() || '';
      const role: UserRole = email === 'suporte@creativeprintjp.com' ? 'admin' : 'client';
      setUserRole(role);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (role === 'client' && profileData) {
        // VERIFICAÇÃO COMPLETA DE BLOQUEIO (ADICIONADA)
        const isBlocked =
          profileData.account_status === 'blocked' ||
          profileData.account_status === 'expired' ||
          (profileData.plan_expires_at && new Date(profileData.plan_expires_at).getTime() < Date.now());

        if (isBlocked) {
          // DETERMINA O MOTIVO ESPECÍFICO
          let reason = 'Acesso suspenso';
          if (profileData.account_status === 'expired') {
            reason = 'Plano expirado';
          } else if (profileData.account_status === 'blocked') {
            reason = 'Conta bloqueada';
          } else if (profileData.plan_expires_at && new Date(profileData.plan_expires_at).getTime() < Date.now()) {
            reason = 'Plano vencido';
          }

          setBlockedReason(reason);
          setCurrentAccountStatus('blocked');
          setSession(currentSession);
          setLoading(false);
          return;
        }

        // Mantém a verificação original (se houver)
        if (profileData.account_status !== 'active') {
          setCurrentAccountStatus(profileData.account_status);
          setSession(currentSession);
          setLoading(false);
          return;
        }
      }

      if (profileData?.must_change_password) {
        setMustChangePassword(true);
      }

      await fetchAllData(currentSession.user.id, role);
      setSession(currentSession);
      setLoading(false);
    } catch (err) {
      console.error("Erro no fluxo de autenticação:", err);
      setLoading(false);
    }
  }, [clearAllStates]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('p');

    if (pId) {
      setPublicUserId(pId);
      setIsGuestMode(true);
      fetchPublicData(pId).then(() => setLoading(false));
    } else {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (initialSession) {
          handleAuthSession(initialSession);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Garante que o usuário seja levado para tela de troca de senha
          setMustChangePassword(true);
        }

        if (event === 'SIGNED_IN' && newSession) {
          if (newSession.user.id !== session?.user?.id) {
            handleAuthSession(newSession);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          clearAllStates();
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [handleAuthSession, session?.user?.id, clearAllStates]);

  // NOVA SUPABASE REALTIME SUBSCRIPTION
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`rt-appointments-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
        (payload) => {
          const a: any = payload.new;

          const mapped: Appointment = {
            id: a.id,
            clientName: a.client_name,
            clientEmail: a.client_email ?? '',
            clientPhone: a.client_phone ?? '',
            serviceId: a.service_id,
            serviceName: a.service_name ?? '',
            startAt: a.start_at,
            duration: a.duration,
            status: a.status,
            createdAt: a.created_at,
            user_id: a.user_id
          };

          setAppointments((prev: Appointment[]) => {
            if (prev.some((x) => x.id === mapped.id)) return prev;
            return [...prev, mapped].sort(
              (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime()
            );
          });

          if (mapped.status === 'confirmed' || mapped.status === 'pending') {
            setPublicBusyAppointments((prev: Appointment[]) => {
              if (prev.some((x) => x.id === mapped.id)) return prev;
              return [...prev, mapped].sort(
                (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime()
              );
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
        (payload) => {
          const a: any = payload.new;

          const mapped: Appointment = {
            id: a.id,
            clientName: a.client_name,
            clientEmail: a.client_email ?? '',
            clientPhone: a.client_phone ?? '',
            serviceId: a.service_id,
            serviceName: a.service_name ?? '',
            startAt: a.start_at,
            duration: a.duration,
            status: a.status,
            createdAt: a.created_at,
            user_id: a.user_id
          };

          setAppointments((prev: Appointment[]) =>
            prev
              .map((x) => (x.id === mapped.id ? mapped : x))
              .sort((x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime())
          );

          setPublicBusyAppointments((prev: Appointment[]) => {
            // atualiza o item se existir, e garante que BUSY = pending ou confirmed
            const exists = prev.some(x => x.id === mapped.id);

            let next = exists
              ? prev.map(x => (x.id === mapped.id ? mapped : x))
              : prev;

            // se virou pending/confirmed e ainda não existe no busy, adiciona
            if (!exists && (mapped.status === 'pending' || mapped.status === 'confirmed')) {
              next = [...next, mapped];
            }

            // remove do busy se cancelado ou rejeitado
            next = next.filter(appt => appt.status === 'pending' || appt.status === 'confirmed');

            return next.sort(
              (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime()
            );
          });

        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
        (payload) => {
          const oldRow: any = payload.old;
          setAppointments((prev: Appointment[]) => prev.filter((x) => x.id !== oldRow.id));
          setPublicBusyAppointments((prev: Appointment[]) => prev.filter((x) => x.id !== oldRow.id));
        }
      )
      .subscribe((status) => {
        console.log('Realtime channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // ✅ REALTIME PARA MODO PÚBLICO (guest) — usando public_busy_slots
  useEffect(() => {
    if (!isGuestMode || !publicUserId) return;

    const channel = supabase
      .channel(`rt-public-busy-${publicUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_busy_slots', filter: `user_id=eq.${publicUserId}` },
        (payload) => {
          const row: any = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (!row) return;

          const mapped: Appointment = {
            id: Number(row.appointment_id),
            user_id: row.user_id,
            startAt: row.start_at,
            duration: row.duration,
            status: row.status,
            createdAt: row.updated_at,
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            serviceName: '',
            serviceId: null as any
          };

          setPublicBusyAppointments(prev => {
            if (payload.eventType === 'DELETE') {
              return prev.filter(x => x.id !== mapped.id);
            }

            const exists = prev.some(x => x.id === mapped.id);
            const next = exists
              ? prev.map(x => x.id === mapped.id ? mapped : x)
              : [...prev, mapped];

            return next.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          });
        }
      )
      .subscribe((status) => console.log('Realtime BUSY PUBLIC status:', status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isGuestMode, publicUserId]);

  const handleBookAppointment = async (data: any) => {
    try {
      const { data: insertResult, error } = await supabase.rpc(
        'create_public_appointment',
        {
          p_user_id: publicUserId,
          p_client_name: data.name,
          p_client_email: data.email || '',
          p_client_phone: data.phone,
          p_service_id: data.serviceId,
          p_service_name: data.serviceName,
          p_start_at: data.startAt,
          p_duration: data.duration
        }
      );

      if (error) throw error;
      if (!insertResult) throw new Error('Resposta vazia do servidor.');


      // NOTIFICAÇÃO TELEGRAM: NOVO AGENDAMENTO (VIA EDGE FUNCTION)
      const date = new Date(data.startAt).toLocaleDateString('pt-BR', { timeZone: "Asia/Tokyo" });
      const time = new Date(data.startAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: "Asia/Tokyo"
      });

      // Invoca a função que vai buscar os dados sensíveis no backend e enviar a mensagem
      supabase.functions.invoke('send-telegram-notification', {
        body: {
          professional_id: publicUserId,
          message_data: {
            clientName: data.name,
            serviceName: data.serviceName,
            date,
            time,
            phone: data.phone
          }
        }
      }).catch(e => console.error('Erro ao invocar notificação:', e));


      // ✅ OTIMISTA - Adiciona imediatamente como BUSY SLOT
      if (isGuestMode) {
        setPublicBusyAppointments(prev => [
          ...prev,
          {
            id: insertResult.id,         // appointment_id
            user_id: insertResult.user_id,
            startAt: insertResult.start_at,
            duration: insertResult.duration,
            status: insertResult.status, // 'pending'
            createdAt: insertResult.created_at,
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            serviceName: '',
            serviceId: null as any
          }
        ]);
      }

      showToast('Agendamento solicitado! O horário foi reservado para você.');
      return true;
    } catch (error: any) {
      console.error('Erro Supabase:', error);
      console.error('Erro Supabase (raw):', error);
      console.error('Erro Supabase (json):', JSON.stringify(error, null, 2));

      const msg =
        error?.message ||
        error?.details ||
        'Falha técnica ao agendar.';

      showToast(msg, 'error');
      return false;
    }
  };

  const handleUpdateAdminUser = async (userId: string, data: Partial<User>) => {
    try {
      const mapped: any = {};
      if (data.companyName !== undefined) mapped.company_name = data.companyName;
      if (data.ownerName !== undefined) mapped.owner_name = data.ownerName;
      if (data.contactPhone !== undefined) mapped.contact_phone = data.contactPhone;
      if (data.email !== undefined) mapped.contact_email = data.email;
      if (data.planType !== undefined) mapped.plan_type = data.planType;
      if (data.accountStatus !== undefined) mapped.account_status = data.accountStatus;

      const { error } = await supabase.from('profiles').update(mapped).eq('id', userId);
      if (error) throw error;

      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
      return true;
    } catch (e: any) {
      showToast("Erro ao atualizar dados.", "error");
      return false;
    }
  };

  const handleUpdateUserStatus = async (id: string, status: AccountStatus) => {
    try {
      const { error } = await supabase.from('profiles').update({ account_status: status }).eq('id', id);
      if (error) throw error;
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, accountStatus: status } : u));
      showToast(`Acesso ${status === 'active' ? 'Liberado' : 'Bloqueado'}!`);
    } catch (e: any) {
      showToast("Erro ao mudar status.", "error");
    }
  };

  const handleRenewPlan = async (userId: string, currentExpiry: string | undefined, months: number) => {
    try {
      const now = new Date();
      let date = currentExpiry ? new Date(currentExpiry) : new Date();
      if (isNaN(date.getTime()) || date < now) date = new Date();

      const newExpiryDate = new Date(date);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

      const { error } = await supabase.from('profiles').update({
        plan_expires_at: newExpiryDate.toISOString(),
        account_status: 'active'
      }).eq('id', userId);

      if (error) throw error;

      setAllUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        planExpiresAt: newExpiryDate.toISOString(),
        accountStatus: 'active'
      } : u));

      return true;
    } catch (e: any) {
      showToast("Erro ao renovar plano.", "error");
      return false;
    }
  };

  const handleAddUser = async (userData: any): Promise<boolean> => {
    try {
      console.log('🔄 Iniciando criação de usuário:', userData.email);

      // 1. Chamar a Edge Function para criar usuário no Auth
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: userData.email.toLowerCase().trim(),
          password: userData.password.trim(),
          metadata: {
            company_name: userData.companyName.trim(),
            owner_name: userData.ownerName?.trim() || ''
          }
        }
      });

      console.log('📦 Resposta da Edge Function:', response);

      const { data, error: invokeError } = response;
      
      // Verificar erros da invocação
      if (invokeError) {
        console.error('❌ Erro ao invocar função:', invokeError);
        throw new Error(`Falha na comunicação: ${invokeError.message}`);
      }

      // Verificar erro retornado pela função
      if (data?.error) {
        console.error('❌ Erro da Edge Function:', data.error);
        throw new Error(`Credenciais: ${data.error}`);
      }

      // Acessar CORRETAMENTE o ID do usuário
      const newUserId = data?.user?.id;
      console.log('✅ ID do usuário criado:', newUserId);

      if (!newUserId) {
        console.error('❌ ID do usuário não retornado:', data);
        throw new Error("A criação do usuário não retornou um ID válido.");
      }

      // 2. Criar perfil na tabela profiles
      const profileData = {
        id: newUserId,
        company_name: userData.companyName.trim() || 'Empresa',
        owner_name: userData.ownerName?.trim() || 'Responsável',
        email: userData.email.toLowerCase().trim(),
        contact_email: userData.email.toLowerCase().trim(),
        contact_phone: userData.contactPhone || '',
        plan_type: userData.planType || '6m',
        plan_expires_at: userData.planExpiresAt || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // +6 meses
        account_status: 'active' as const,
        must_change_password: true,
        primary_color: '#25aae1',
        secondary_color: '#1f2937',
        short_description: '',
        services_title: '',
        services_subtitle: '',
        cover_image: '',
        profile_image: '',
        telegram_bot_token: '',
        telegram_chat_id: '',
        lifetime_appointments: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Inserindo perfil:', profileData);

      const { data: profileInsert, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select() // ← ADICIONE ESTE .select() para debugar
        .single();

      if (profileError) {
        console.error('❌ Erro ao inserir perfil:', profileError);
        
        // Se for erro 409 (conflito), tentar atualizar em vez de inserir
        if (profileError.code === '23505') { // Código de violação de chave única
          console.log('⚠️ Perfil já existe, tentando atualizar...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', newUserId);
          
          if (updateError) {
            throw new Error(`Perfil já existe e não pôde ser atualizado: ${updateError.message}`);
          }
        } else {
          throw new Error(`Falha ao salvar perfil: ${profileError.message} (Código: ${profileError.code})`);
        }
      }

      console.log('✅ Perfil criado/atualizado:', profileInsert);

      // 3. Criar configurações iniciais
      try {
        await supabase.from('availability').insert({
          user_id: newUserId,
          working_hours: DEFAULT_AVAILABILITY.workingHours,
          blocked_dates: [],
          interval_minutes: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        await supabase.from('services').insert({
          user_id: newUserId,
          name: "Serviço Padrão",
          description: "Serviço inicial para demonstração.",
          duration: 30,
          price: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log('⚙️ Configurações iniciais criadas');
      } catch (configError) {
        console.warn('⚠️ Erro ao criar configurações (pode ser normal):', configError);
        // Não falha a criação por erro nas configurações iniciais
      }

      showToast("Profissional criado com sucesso!");
      
      // 4. Recarregar dados do admin
      await fetchAllData(session.user.id, 'admin');
      
      return true;
    } catch (e: any) {
      console.error('💥 ERRO FATAL na criação:', e);
      showToast(e.message || "Erro ao processar cadastro.", "error");
      return false;
    }
  };

  const handleUpdateAccount = async (u: Partial<AccountInfo>) => {
    try {
      const mapped: any = {};
      if (u.companyName !== undefined) mapped.company_name = u.companyName;
      if (u.coverImage !== undefined) mapped.cover_image = u.coverImage;
      if (u.profileImage !== undefined) mapped.profile_image = u.profileImage;
      if (u.shortDescription !== undefined) mapped.short_description = u.shortDescription;
      if (u.servicesTitle !== undefined) mapped.services_title = u.servicesTitle;
      if (u.servicesSubtitle !== undefined) mapped.services_subtitle = u.servicesSubtitle;
      if (u.primaryColor !== undefined) mapped.primary_color = u.primaryColor;
      if (u.secondaryColor !== undefined) mapped.secondary_color = u.secondaryColor;
      if (u.telegramBotToken !== undefined) mapped.telegram_bot_token = u.telegramBotToken;
      if (u.telegramChatId !== undefined) mapped.telegram_chat_id = u.telegramChatId;


      const { error } = await supabase.from('profiles').update(mapped).eq('id', session.user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...u } : null);
      showToast("Configurações salvas!");
    } catch (e: any) {
      showToast("Erro ao salvar perfil.", "error");
    }
  };

  const handleUpdateServices = async (s: Service[]) => {
    try {
      setServices(s);
      await supabase.from('services').delete().eq('user_id', session.user.id);
      const { error } = await supabase.from('services').insert(s.map(x => ({
        user_id: session.user.id,
        name: x.name,
        description: x.description,
        duration: x.duration,
        price: x.price
      })));
      if (error) throw error;
      showToast("Serviços atualizados!");
    } catch (e) {
      showToast("Erro ao salvar serviços.", "error");
    }
  };

  const handleUpdateAvailability = async (a: AvailabilityConfig) => {
    try {
      setAvailability(a);
      const { error } = await supabase.from('availability').upsert({
        user_id: session.user.id,
        working_hours: a.workingHours,
        blocked_dates: a.blockedDates,
        interval_minutes: a.interval_minutes
      });
      if (error) throw error;
      showToast("Disponibilidade salva!");
    } catch (e) {
      showToast("Erro ao salvar disponibilidade.", "error");
    }
  };

  const handleUpdateStatus = async (id: number, s: AppointmentStatus) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: s }).eq('id', id);
      if (error) throw error;

      setAppointments(prev => prev.map(a => {
        if (a.id === id) {
          const updated = { ...a, status: s };

          if (s === 'confirmed' || s === 'pending') {
            setPublicBusyAppointments(prevBusy => {
              if (prevBusy.some(busy => busy.id === id)) {
                return prevBusy.map(busy => busy.id === id ? updated : busy).sort(
                  (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime()
                );
              }
              return [...prevBusy, updated].sort(
                (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime()
              );
            });
          } else {
            // rejected ou canceled devem LIBERAR o horário
            setPublicBusyAppointments(prevBusy => prevBusy.filter(busy => busy.id !== id));
          }


          return updated;
        }
        return a;
      }));

      showToast(`Status atualizado para ${s === 'confirmed' ? 'Confirmado' : s === 'rejected' ? 'Rejeitado' : 'Cancelado'}`);
    } catch (e) {
      showToast("Erro ao atualizar status.", "error");
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm("⚠️ Tem certeza que deseja excluir?")) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      setAppointments(prev => prev.filter(a => a.id !== id));
      setPublicBusyAppointments(prev => prev.filter(a => a.id !== id));
      showToast("Agendamento excluído!");
    } catch (e) {
      showToast("Erro ao excluir agendamento.", "error");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("⚠️ Excluir permanentemente este profissional?")) return;
    try {
      await supabase.functions.invoke('manage-users', { body: { action: 'delete', userId: id } });
      await supabase.from('profiles').delete().eq('id', id);
      setAllUsers(prev => prev.filter(u => u.id !== id));
      showToast("Profissional removido.");
    } catch (e: any) {
      showToast("Erro ao remover profissional.", "error");
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (authError) {
      setLoading(false);
      showToast("Credenciais inválidas.", "error");
      return;
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-xl"></div>
        <p className="text-gray-900 font-black text-[11px] uppercase tracking-widest">CP Agenda Pro</p>
      </div>
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isGuestMode && profile ? (
        <PublicBookingPage
          {...profile}
          services={services}
          availability={availability}
          appointments={appointments}
          busyAppointments={publicBusyAppointments}
          onBook={handleBookAppointment}
          onBack={() => window.location.href = '/'}
        />
      ) : view === 'legal' ? (
        <LegalTerms onBack={() => setView('landing')} />
      ) : !session ? (
        view === 'landing' ? (
          <LandingPage onGoToLogin={() => setView('login')} onGoToLegal={() => setView('legal')} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )
      ) : (userRole === 'client' && currentAccountStatus !== 'active') ? (
        // ATUALIZADO: Passa o motivo específico para o BlockedScreen
        <BlockedScreen
          reason={blockedReason || "Sua assinatura expirou ou seu acesso foi suspenso."}
          onLogout={handleLogout}
        />
      ) : mustChangePassword ? (
        <ForcePasswordChange onPasswordChanged={async (p) => { await supabase.auth.updateUser({ password: p }); await supabase.from('profiles').update({ must_change_password: false }).eq('id', session.user.id); setMustChangePassword(false); showToast("Senha alterada!"); }} onLogout={handleLogout} />
      ) : userRole === 'admin' ? (
        <AdminDashboard users={allUsers} onAddUser={handleAddUser} onUpdateUserStatus={handleUpdateUserStatus} onUpdateAdminUser={handleUpdateAdminUser} onRenewPlan={handleRenewPlan} onDeleteUser={handleDeleteUser} onLogout={handleLogout} showToast={showToast} />
      ) : profile ? (
        <ClientDashboard
          account={profile}
          appointments={appointments}
          services={services}
          availability={availability}
          onLogout={handleLogout}
          onOpenPublic={() => window.open(profile.publicLink, '_blank')}
          onUpdateStatus={handleUpdateStatus}
          onDeleteAppointment={handleDeleteAppointment}
          onUpdateServices={handleUpdateServices}
          onUpdateAvailability={handleUpdateAvailability}
          onUpdateAccount={handleUpdateAccount}
          onUpdateAppointments={setAppointments}
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
};

export default App;