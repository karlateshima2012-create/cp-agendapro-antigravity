
import React, { useState, useRef, useEffect } from 'react';
import { AccountInfo } from '../types';
import {
  Shield, User, Bell, Save,
  Image as ImageIcon, Layout, Upload,
  Info, Lock, HelpCircle
} from 'lucide-react';

interface Props {
  account: AccountInfo;
  onUpdateSettings?: (settings: Partial<AccountInfo>) => void;
}

export const AccountTab: React.FC<Props> = ({ account, onUpdateSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [telegramToken, setTelegramToken] = useState(account.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState(account.telegramChatId || '');
  const [coverImage, setCoverImage] = useState(account.coverImage || '');
  const [profileImage, setProfileImage] = useState(account.profileImage || '');
  const [shortDescription, setShortDescription] = useState(account.shortDescription || '');
  const [servicesTitle, setServicesTitle] = useState(account.servicesTitle || '');
  const [servicesSubtitle, setServicesSubtitle] = useState(account.servicesSubtitle || '');
  const [primaryColor, setPrimaryColor] = useState(account.primaryColor || '#25aae1');
  const [secondaryColor, setSecondaryColor] = useState(account.secondaryColor || '#1f2937');

  // Sincronizar estado local quando os props mudarem (ex: após salvar ou carregar)
  useEffect(() => {
    setTelegramToken(account.telegramBotToken || '');
    setTelegramChatId(account.telegramChatId || '');
    setCoverImage(account.coverImage || '');
    setProfileImage(account.profileImage || '');
    setShortDescription(account.shortDescription || '');
    setServicesTitle(account.servicesTitle || '');
    setServicesSubtitle(account.servicesSubtitle || '');
    setPrimaryColor(account.primaryColor || '#25aae1');
    setSecondaryColor(account.secondaryColor || '#1f2937');
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


  const OFFICIAL_BOT_TOKEN = '8679011580:AAGYmZRTeLJTkekfHcJzM-4KriplY_g_6Rk';

  const handleSaveSettings = async () => {
    if (onUpdateSettings) {
      setIsSaving(true);
      await onUpdateSettings({
        telegramBotToken: OFFICIAL_BOT_TOKEN, // Sempre salvar o token oficial agora
        telegramChatId: telegramChatId.trim(),
        coverImage: coverImage.trim(),
        profileImage: profileImage.trim(),
        shortDescription: shortDescription.trim(),
        servicesTitle: servicesTitle.trim(),
        servicesSubtitle: servicesSubtitle.trim(),
        primaryColor,
        secondaryColor,
      });
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
      const text = "<b>🔔 CP Agenda Pro</b>: Teste de Notificação bem-sucedido!";
      const url = `https://api.telegram.org/bot${OFFICIAL_BOT_TOKEN}/sendMessage?chat_id=${cleanChatId}&parse_mode=HTML&text=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok) {
        alert('✅ Sucesso! Verifique seu Telegram.');
      } else {
        alert('❌ Erro: ' + (data.description || 'ID Inválido ou Bot não iniciado'));
      }
    } catch (e) {
      alert('Erro de conexão com a API do Telegram.');
    }
  };

  return (
    <div className="space-y-6 pb-24 relative animate-fade-in">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <p className="text-gray-600 font-medium text-xs truncate">{account.contactEmail}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</label>
                <p className="text-gray-600 font-medium text-xs">{new Date(account.planExpiresAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-green-600" /> Status da Conta
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-bold text-green-700 uppercase text-xs tracking-wider">Assinatura Ativa</span>
            </div>
            <p className="text-xs text-gray-500">Recursos liberados.</p>
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
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
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

                <div>
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
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Bell size={20} className="text-yellow-500" /> Notificações via Telegram
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col gap-6 transition-all hover:bg-blue-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-primary/20 rotate-3">1</div>
                  <div>
                    <p className="text-base font-black text-gray-900 uppercase tracking-tight">Ative seu Assistente</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">Clique no botão abaixo para abrir o Robô Oficial. Lá você receberá seu <b>ID de Notificação</b> instantaneamente.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href="https://t.me/Cpagendaprobot?start=setup"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary text-white text-center py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    <Bell size={20} /> Clique para Ativar Chat ID
                  </a>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">O robô responderá seu ID na hora</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-100/50">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-3">O que você receberá no Telegram:</p>
                  <div className="bg-white/60 p-4 rounded-2xl border border-blue-50 text-[11px] text-gray-600 font-medium leading-relaxed italic">
                    "Olá! 🆔 Seu Chat ID: 128010XXXX... Copie este número e cole no campo ao lado."
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Configuração Final</label>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase mb-2 ml-1">Seu Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={e => setTelegramChatId(e.target.value)}
                    placeholder="Digite seu ID"
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-white focus:bg-white outline-none text-sm font-mono ring-2 ring-transparent focus:ring-primary/20 transition-all text-center placeholder:text-gray-300 shadow-sm"
                  />
                </div>
                <button
                  onClick={testNotification}
                  className="w-full bg-gray-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-black/10"
                >
                  <Bell size={16} /> Testar Notificação
                </button>
              </div>

              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-start gap-3">
                <Info size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-tight">
                  Após inserir o ID, lembre-se de clicar no botão "Salvar Alterações" no fim da página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÃO SALVAR FIXO */}
      <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 flex justify-end items-center z-20">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : <Save size={20} />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};
