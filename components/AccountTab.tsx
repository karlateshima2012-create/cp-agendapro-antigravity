import React, { useState, useRef, useEffect } from 'react';
import { AccountInfo } from '../types';
import {
  Shield, User, Bell, Save,
  Image as ImageIcon, Layout, Upload,
  Info, Lock, HelpCircle, Copy, ExternalLink, Check, QrCode, X, ChevronDown
} from 'lucide-react';
import { TermsAndPoliciesModal } from './TermsAndPoliciesModal';
import { ConfirmModal } from './ConfirmModal';
import { api } from '../src/api';

interface Props {
  account: AccountInfo;
  onUpdateSettings?: (settings: Partial<AccountInfo>) => void;
  onOpenPublic?: () => void;
}

export const AccountTab: React.FC<Props> = ({ account, onUpdateSettings, onOpenPublic }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [telegramToken, setTelegramToken] = useState(account.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState(account.telegramChatId || '');
  const [coverImage, setCoverImage] = useState(account.coverImage || '');
  const [profileImage, setProfileImage] = useState(account.profileImage || '');
  const [shortDescription, setShortDescription] = useState(account.shortDescription || '');
  const [servicesTitle, setServicesTitle] = useState(account.servicesTitle || '');
  const [servicesSubtitle, setServicesSubtitle] = useState(account.servicesSubtitle || '');
  const [primaryColor, setPrimaryColor] = useState(account.primaryColor || '#25aae1');
  const [secondaryColor, setSecondaryColor] = useState(account.secondaryColor || '#1f2937');
  const [viewMode, setViewMode] = useState<'card'|'list'>(account.viewMode || 'card');
  const [coverOpacity, setCoverOpacity] = useState<number>(account.coverOpacity ?? 100);

  const [telegramState, setTelegramState] = useState<'disconnected' | 'awaiting' | 'connected'>(
    account.telegramChatId ? 'connected' : 'disconnected'
  );
  const [linkedChatId, setLinkedChatId] = useState(account.telegramChatId || '');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const pollingRef = useRef<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, isDanger = true) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isDanger
    });
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Sincronizar estado local quando os props mudarem (ex: após salvar ou carregar)
  useEffect(() => {
    setTelegramToken(account.telegramBotToken || '');
    setTelegramChatId(account.telegramChatId || '');
    setLinkedChatId(account.telegramChatId || '');
    if (telegramState !== 'awaiting') {
      setTelegramState(account.telegramChatId ? 'connected' : 'disconnected');
    }
    setCoverImage(account.coverImage || '');
    setProfileImage(account.profileImage || '');
    setShortDescription(account.shortDescription || '');
    setServicesTitle(account.servicesTitle || '');
    setServicesSubtitle(account.servicesSubtitle || '');
    setPrimaryColor(account.primaryColor || '#25aae1');
    setSecondaryColor(account.secondaryColor || '#1f2937');
    setViewMode(account.viewMode || 'card');
    setCoverOpacity(account.coverOpacity ?? 100);
  }, [account]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImage(reader.result as string);
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Tente outra imagem.');
      };
      reader.readAsDataURL(file);
    }
  };
  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Tente outra imagem.');
      };
      reader.readAsDataURL(file);
    }
  };


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

  const handleSaveSettings = async () => {
    if (onUpdateSettings) {
      setIsSaving(true);

      const payload: Partial<AccountInfo> = {};

      const cleanTelegramChatId = telegramChatId.trim();
      const cleanCoverImage = coverImage.trim();
      const cleanProfileImage = profileImage.trim();
      const cleanShortDescription = shortDescription.trim();
      const cleanServicesTitle = servicesTitle.trim();
      const cleanServicesSubtitle = servicesSubtitle.trim();

      const origTelegramChatId = (account.telegramChatId || '').trim();
      const origCoverImage = (account.coverImage || '').trim();
      const origProfileImage = (account.profileImage || '').trim();
      const origShortDescription = (account.shortDescription || '').trim();
      const origServicesTitle = (account.servicesTitle || '').trim();
      const origServicesSubtitle = (account.servicesSubtitle || '').trim();
      const origPrimaryColor = account.primaryColor || '#25aae1';
      const origSecondaryColor = account.secondaryColor || '#1f2937';

      if (cleanTelegramChatId !== origTelegramChatId) {
        payload.telegramChatId = cleanTelegramChatId;
      }
      if (cleanCoverImage !== origCoverImage) {
        payload.coverImage = cleanCoverImage;
      }
      if (cleanProfileImage !== origProfileImage) {
        payload.profileImage = cleanProfileImage;
      }
      if (cleanShortDescription !== origShortDescription) {
        payload.shortDescription = cleanShortDescription;
      }
      if (cleanServicesTitle !== origServicesTitle) {
        payload.servicesTitle = cleanServicesTitle;
      }
      if (cleanServicesSubtitle !== origServicesSubtitle) {
        payload.servicesSubtitle = cleanServicesSubtitle;
      }
      if (primaryColor !== origPrimaryColor) {
        payload.primaryColor = primaryColor;
      }
      if (secondaryColor !== origSecondaryColor) {
        payload.secondaryColor = secondaryColor;
      }
      if (viewMode !== (account.viewMode || 'card')) {
        payload.viewMode = viewMode;
      }
      if (coverOpacity !== (account.coverOpacity ?? 100)) {
        payload.coverOpacity = coverOpacity;
      }

      // Se houver campos alterados, faz o update. Caso contrário, apenas encerra salvamento instantaneamente (sucesso)
      await onUpdateSettings(payload);
      setIsSaving(false);
    }
  };

  const testNotification = async () => {
    const cleanChatId = telegramChatId.trim();
    if (!cleanChatId) {
      alert('Preencha o seu Chat ID para testar.');
      return;
    }
    try {
      const res = await api.testTelegramNotification(cleanChatId);
      if (res.ok) {
        alert('✅ Sucesso! Verifique seu Telegram.');
      } else {
        alert('❌ Erro: ' + (res.error || 'ID Inválido ou Bot não iniciado pelo usuário'));
      }
    } catch (e) {
      alert('Erro de conexão.');
    }
  };

  const handleConnectTelegram = async () => {
    setIsLoadingLink(true);
    try {
      const res = await api.getTelegramLink();
      if (res.ok && res.data?.link) {
        window.open(res.data.link, '_blank');
        setTelegramState('awaiting');
        
        // Start polling for connection confirmation
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await api.getTelegramStatus();
            if (statusRes.ok && statusRes.data?.connected) {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setTelegramState('connected');
              setLinkedChatId(statusRes.data.chat_id);
              setTelegramChatId(statusRes.data.chat_id);
              onUpdateSettings?.({ telegramChatId: statusRes.data.chat_id });
            }
          } catch (err) {
            console.error('Erro de polling do Telegram:', err);
          }
        }, 3000);
      } else {
        alert('Erro ao gerar link de conexão do Telegram.');
      }
    } catch (e) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleDisconnectTelegram = () => {
    openConfirm(
      'Desconectar Telegram',
      'Tem certeza de que deseja desconectar o Telegram? Você deixará de receber as notificações automáticas de agendamentos.',
      async () => {
        try {
          const res = await api.disconnectTelegram();
          if (res.ok) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setTelegramState('disconnected');
            setTelegramChatId('');
            setLinkedChatId('');
            onUpdateSettings?.({ telegramChatId: '' });
          } else {
            alert('Erro ao desconectar o Telegram.');
          }
        } catch (e) {
          alert('Erro de conexão com o servidor.');
        }
      }
    );
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PERFIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User size={20} style={{ color: primaryColor }} /> Perfil Profissional
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</label>
              <p className="text-lg font-bold text-gray-900 capitalize">{account.companyName}</p>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</label>
                <p className="text-gray-900 font-bold text-xs">{account.contactPhone || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <p className="text-gray-600 font-medium text-xs truncate" title={account.contactEmail}>{account.contactEmail}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Início do Plano</label>
                <p className="text-gray-600 font-medium text-xs">
                  {account.createdAt ? new Date(account.createdAt).toLocaleDateString('pt-BR') : '---'}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximo Vencimento</label>
                <p className="text-red-600 font-bold text-xs">
                  {account.country === 'BR' ? 'Via Hotmart' : new Date(account.planExpiresAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            </div>
            
            {/* Botão para abrir o Modal de Faturas ou Link Hotmart */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              {account.country === 'BR' ? (
                <a
                  href={account.hotmart_url || 'https://consumer.hotmart.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                      <ExternalLink size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900">Plano gerenciado pela Hotmart</p>
                      <p className="text-[10px] text-gray-400 font-medium">Clique para acessar sua assinatura</p>
                    </div>
                  </div>
                  <div className="text-gray-300 group-hover:text-orange-500 transition-colors">
                    <ExternalLink size={16} />
                  </div>
                </a>
              ) : (
                <button
                  onClick={() => setShowInvoicesModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <ChevronDown size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900">Próximo faturamento</p>
                    </div>
                  </div>
                  <div className="text-gray-300 group-hover:text-primary transition-colors">
                    <ExternalLink size={16} />
                  </div>
                </button>
              )}
            </div>
          </div>

        {/* LINK PÚBLICO */}
        <div data-tour="public-link-section" className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ExternalLink size={20} style={{ color: primaryColor }} /> Link Público
          </h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${copied
                ? 'bg-green-50 text-green-600 border-green-100'
                : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>

            <button
              onClick={onOpenPublic}
              className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <ExternalLink size={18} /> Abrir Página
            </button>

            <p className="text-[10px] text-gray-400 font-medium text-center mt-1">
              Envie este link para seus clientes agendarem.
            </p>
          </div>
        </div>

        {/* PERSONALIZAÇÃO DA PÁGINA */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Layout size={20} className="text-purple-600" /> Identidade Visual
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ImageIcon size={16} /> Imagem de Capa (Banner)
                </label>
                <div
                  className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer hover:border-primary transition-all shadow-inner"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ borderColor: primaryColor + '40' }}
                >
                  {coverImage ? (
                    <>
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" style={{ opacity: coverOpacity / 100 }} />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Upload size={32} className="text-white mb-2" />
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Trocar</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                      <Upload size={32} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload Capa</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                <div className="mt-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Opacidade da Capa ({coverOpacity}%)</label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={coverOpacity} 
                    onChange={e => setCoverOpacity(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Ajuste a transparência da imagem de capa para destacar melhor os textos.</p>
                </div>


                <div className="mt-6">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ImageIcon size={16} /> Logo / Foto de Perfil
                  </label>

                  <div
                    className="relative w-full h-40 rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer hover:border-primary transition-all shadow-inner flex items-center justify-center"
                    onClick={() => profileInputRef.current?.click()}
                    style={{ borderColor: primaryColor + '40' }}
                  >
                    {profileImage ? (
                      <>
                        <img src={profileImage} alt="Perfil" className="w-32 h-32 object-cover rounded-2xl border border-white/30" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Upload size={32} className="text-white mb-2" />
                          <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Trocar</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <Upload size={32} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload Logo</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={profileInputRef}
                    onChange={handleProfileFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>


              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block text-center">Cor Principal</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none" />
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: primaryColor }}></div>
                  </div>
                </div>

              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Título da Seção de Serviços</label>
                <input
                  type="text" value={servicesTitle} onChange={e => setServicesTitle(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Subtítulo</label>
                <input
                  type="text" value={servicesSubtitle} onChange={e => setServicesSubtitle(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Descrição da Empresa</label>
                <textarea
                  rows={3} maxLength={120} value={shortDescription} onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>



        {/* TELEGRAM */}
        <div data-tour="telegram-config" className="md:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-gray-900 flex items-center gap-3">
            <Bell size={20} className="text-yellow-500" /> Notificações via Telegram
          </h3>
          <p className="text-sm text-gray-500 mt-2 mb-6">Ative lembretes automáticos com aviso sonoro via Telegram</p>

          {telegramState === 'disconnected' && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100 animate-fade-in">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status: Não Conectado</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Ative o envio de notificações instantâneas no seu celular clicando no botão abaixo para vincular.
                </p>
              </div>
              <button
                disabled={isLoadingLink}
                onClick={handleConnectTelegram}
                className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 h-14 shrink-0 cursor-pointer"
              >
                📲 Conectar Telegram
              </button>
            </div>
          )}

          {telegramState === 'awaiting' && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-yellow-50/50 p-6 rounded-[2rem] border border-yellow-100 animate-fade-in">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest flex items-center gap-1">
                    Status: Aguardando Conexão
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1 h-1 rounded-full bg-yellow-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-yellow-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-yellow-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </span>
                </div>
                <p className="text-sm text-yellow-800 font-medium">
                  Clique abaixo para abrir o bot do Telegram e pressione <b>Iniciar/Começar</b>. Estamos aguardando a confirmação.
                </p>
              </div>
              <button
                onClick={() => {
                  api.getTelegramLink().then(res => {
                    if (res.ok && res.data?.link) {
                      window.open(res.data.link, '_blank');
                    }
                  });
                }}
                className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all h-14 shrink-0 cursor-pointer"
              >
                ↗ Abrir Telegram novamente
              </button>
            </div>
          )}

          {telegramState === 'connected' && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-green-50/50 p-6 rounded-[2rem] border border-green-100 animate-fade-in">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Status: Conectado</span>
                </div>
                <p className="text-sm text-green-800 font-medium">
                  Notificações via Telegram ativas no Chat ID: <code>{linkedChatId}</code>.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button
                  onClick={testNotification}
                  className="flex-1 md:flex-none bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/10 h-14 shrink-0 cursor-pointer"
                >
                  ⚡ Testar
                </button>
                <button
                  onClick={handleDisconnectTelegram}
                  className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all h-14 shrink-0 cursor-pointer"
                >
                  🔕 Desconectar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QR CODE CARD */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-3">
            <QrCode size={20} className="text-primary" /> QR Code de Agendamento
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner group transition-all hover:bg-white hover:shadow-xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(account.publicLink || '')}`}
                alt="QR Code de Agendamento"
                className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply"
              />
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div>
                <p className="text-base font-black text-gray-900 mb-2">Divulgue sua Agenda</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Utilize este QR Code em seus materiais impressos. Ao escanear, seu cliente será levado diretamente para sua página de agendamentos.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={async () => {
                    try {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(account.publicLink || '')}`;
                      const response = await fetch(qrUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `QRCode_Agendamento_${account.companyName.replace(/\s+/g, '_')}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Erro ao baixar QR Code:', error);
                      alert('Erro ao baixar o QR Code. Tente abrir em uma nova aba.');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-white px-6 py-5 rounded-2xl text-sm font-black transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                >
                  <Upload size={20} className="rotate-180" /> Baixar QR Code (PNG)
                </button>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info size={18} className="text-blue-400 mt-0.5" />
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tight leading-relaxed">
                  Dica: Para melhores resultados em materiais impressos, baixe a versão em alta resolução clicando no botão acima.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* FOOTER & TERMOS */}
      <div className="flex flex-col items-center justify-center pt-8 pb-12 opacity-60 hover:opacity-100 transition-opacity mt-8">
        <p className="text-[10px] font-black text-gray-500 tracking-widest mb-3">
          © {new Date().getFullYear()} creative print. todos os direitos reservados.
        </p>
        <button 
          onClick={() => setShowTermsModal(true)}
          className="text-xs font-bold text-blue-500 hover:text-blue-700 hover:underline tracking-wide transition-all"
        >
          TERMOS DE USO E POLÍTICA DE PRIVACIDADE
        </button>
        <a 
          href="https://wa.me/819011886491"
          target="_blank"
          rel="noreferrer"
          className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          FALAR COM SUPORTE
        </a>

        {/* BOTÃO SALVAR AGORA ESTÁTICO NO FINAL - NITIDEZ CORRIGIDA */}
        <div className="mt-12 w-full flex justify-center">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full md:w-auto text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-black/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : <Save size={20} />}
            {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
          </button>
        </div>
      </div>

      <TermsAndPoliciesModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
      />

      {/* MODAL DE FATURAS (LEITURA) */}
      {showInvoicesModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999] backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowInvoicesModal(false)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors p-2"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                <Layout size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Suas Faturas</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Histórico financeiro da assinatura</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              {(!account.invoices || account.invoices.length === 0) ? (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-400">Nenhuma fatura encontrada.</p>
                </div>
              ) : (
                (() => {
                  const ACTIVE_STATUSES = ['pending', 'upcoming', 'overdue'];
                  const activeInvoices = account.invoices
                    .filter((inv: any) => ACTIVE_STATUSES.includes(inv.status))
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                  const historyInvoices = account.invoices
                    .filter((inv: any) => !ACTIVE_STATUSES.includes(inv.status))
                    .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

                  const statusColors: Record<string, string> = {
                    pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
                    upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
                    overdue:  'bg-red-50 text-red-700 border-red-200',
                    paid:     'bg-green-50 text-green-700 border-green-200',
                    canceled: 'bg-gray-100 text-gray-500 border-gray-200',
                  };
                  const statusLabels: Record<string, string> = {
                    pending:  'Pendente',
                    upcoming: 'A Vencer',
                    overdue:  'Vencido',
                    paid:     'Pago',
                    canceled: 'Cancelado',
                  };

                  return (
                    <div className="flex flex-col gap-8">
                      {activeInvoices.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Próximo Faturamento</h4>
                          <div className="space-y-3">
                            {activeInvoices.map((inv: any) => (
                              <div key={inv.id} className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                inv.status === 'overdue'  ? 'bg-red-50/40 border-red-100' :
                                inv.status === 'upcoming' ? 'bg-blue-50/40 border-blue-100' :
                                'bg-gradient-to-br from-blue-50 to-white border-blue-100'
                              }`}>
                                <div>
                                  <p className="text-base font-black text-gray-900">{inv.planReference || 'Fatura de Assinatura'}</p>
                                  <p className="text-xs font-bold text-gray-500 mt-1">
                                    Vencimento: <span className="text-gray-900">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</span>
                                  </p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                                  <p className="text-2xl font-black text-primary">
                                    {new Intl.NumberFormat(
                                      account.country === 'BR' ? 'pt-BR' : 'ja-JP',
                                      { style: 'currency', currency: account.currency ?? 'JPY' }
                                    ).format(Number(inv.amount))}
                                  </p>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[inv.status] ?? statusColors.pending}`}>
                                    {statusLabels[inv.status] ?? inv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {historyInvoices.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Histórico</h4>
                          <div className="space-y-3">
                            {historyInvoices.map((inv: any) => (
                              <div key={inv.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                  <p className="text-sm font-black text-gray-900">{inv.planReference || 'Fatura de Assinatura'}</p>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    Vencimento: <span className="text-gray-900">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</span>
                                  </p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                                  <p className="text-lg font-black text-gray-900">
                                    {new Intl.NumberFormat(
                                      account.country === 'BR' ? 'pt-BR' : 'ja-JP',
                                      { style: 'currency', currency: account.currency ?? 'JPY' }
                                    ).format(Number(inv.amount))}
                                  </p>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[inv.status] ?? statusColors.canceled}`}>
                                    {statusLabels[inv.status] ?? inv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => setShowInvoicesModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};
