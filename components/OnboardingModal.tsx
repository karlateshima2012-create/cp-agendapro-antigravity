import React, { useCallback, useEffect, useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle,
  Calendar, Briefcase, Settings, PartyPopper, Bell
} from 'lucide-react';

type Props = {
  seen: boolean;
  onMarkSeen: () => Promise<void> | void;
};

export const OnboardingModal: React.FC<Props> = ({ seen, onMarkSeen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!seen) setIsVisible(true);
  }, [seen]);

  useEffect(() => {
    if (seen && isVisible) setIsVisible(false);
  }, [seen, isVisible]);

  const handleClose = useCallback(async () => {
    try {
      await onMarkSeen();
    } finally {
      setIsVisible(false);
    }
  }, [onMarkSeen]);

  const LAST_STEP = 5;

  const handleNext = () => {
    if (currentStep < LAST_STEP) setCurrentStep((prev) => prev + 1);
    else handleClose();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  const steps = [
    {
      icon: <PartyPopper size={28} />,
      type: 'welcome',
      title: 'Bem-vindo ao CP Agenda Pro!',
      main: 'Seu sistema de agendamentos já está ativo. Siga este guia rápido e em menos de 15 minutos você estará pronto para receber os primeiros clientes.',
      content: (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-left mt-2">
          <p className="text-[12px] font-black text-primary uppercase tracking-widest mb-2">3 passos essenciais</p>
          <ul className="text-[12px] text-gray-600 space-y-1.5">
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span> Cadastrar seus serviços</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span> Definir seus horários de atendimento</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span> Compartilhar seu link com os clientes</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Briefcase size={28} />,
      type: 'info',
      title: 'Cadastre seus serviços',
      main: 'Sem serviços cadastrados, sua página fica em branco. Esse é o primeiro passo.',
      content: (
        <div className="space-y-2 mt-1 text-left">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[12px] font-black text-amber-800 mb-1">⚠️ Atenção: a duração é o campo mais importante</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">Ela controla o bloqueio de horários. Se colocar errado, o sistema vai oferecer horários que você não consegue cumprir.</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">O que você vai preencher</p>
            <ul className="text-[12px] text-gray-600 space-y-1">
              <li>• <strong>Nome</strong> — ex: Corte Masculino</li>
              <li>• <strong>Duração</strong> — tempo do serviço em minutos</li>
              <li>• <strong>Buffer de limpeza</strong> — tempo extra após o serviço (invisível para o cliente, bloqueia o próximo slot)</li>
              <li>• <strong>Preço</strong> — opcional. Se não preencher, não aparece</li>
              <li>• <strong>Foto do serviço</strong> — opcional, mas valoriza muito</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: <Calendar size={28} />,
      type: 'info',
      title: 'Configure seus horários',
      main: 'Diga ao sistema em quais dias e horários você atende. O cliente só vai ver os slots que você liberar.',
      content: (
        <div className="space-y-2 mt-1 text-left">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Dois modos disponíveis</p>
            <div className="space-y-2">
              <div>
                <p className="text-[12px] font-black text-gray-700">Por Intervalo</p>
                <p className="text-[11px] text-gray-500">Você define início e fim. O sistema gera os slots automaticamente de X em X minutos.</p>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-[12px] font-black text-gray-700">Horários Fixos</p>
                <p className="text-[11px] text-gray-500">Você define cada horário manualmente. Ideal para agendas irregulares ou sessões longas.</p>
              </div>
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
            <p className="text-[12px] text-sky-800">Você também pode bloquear dias específicos (feriados, folgas) e definir quais meses do ano ficam abertos para agendamento.</p>
          </div>
        </div>
      ),
    },
    {
      icon: <Settings size={28} />,
      type: 'info',
      title: 'Personalize sua página',
      main: 'Na aba Configurações você personaliza tudo que o cliente vai ver ao acessar seu link.',
      content: (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left mt-1">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">O que você pode mudar</p>
          <ul className="text-[12px] text-gray-600 space-y-1.5">
            <li>• <strong>Foto de capa</strong> e foto de perfil</li>
            <li>• <strong>Cores</strong> da página (combina com sua identidade)</li>
            <li>• Textos de apresentação e da seção de serviços</li>
            <li>• Modo de exibição dos serviços: cards com foto ou lista compacta</li>
            <li>• Link público e <strong>QR Code</strong> para imprimir</li>
          </ul>
          <p className="text-[11px] text-gray-400 mt-2 italic">Essas informações só aparecem na sua página pública — não afetam o painel.</p>
        </div>
      ),
    },
    {
      icon: <Bell size={28} />,
      type: 'info',
      title: 'Ative as notificações',
      main: 'Receba uma mensagem no Telegram toda vez que um cliente agendar. É rápido de configurar.',
      content: (
        <div className="space-y-2 mt-1 text-left">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">Como ativar em 2 passos</p>
            <ol className="text-[12px] text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>No Telegram, pesquise por <strong>@userinfobot</strong>, clique em Start e copie o número que aparecer como seu ID</span>
              </li>
              <li className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Vá em <strong>Configurações → Notificações Telegram</strong>, cole o ID e salve. Use o botão de teste para confirmar que está funcionando</span>
              </li>
            </ol>
          </div>
          <p className="text-[11px] text-gray-400 text-center">Você pode pular e configurar depois. Mas é muito útil!</p>
        </div>
      ),
    },
    {
      icon: <CheckCircle size={28} />,
      type: 'success',
      title: 'Tudo pronto para começar!',
      main: 'Configure os passos anteriores e compartilhe seu link. Os primeiros agendamentos já podem chegar.',
      content: (
        <div className="space-y-2 mt-1 text-left">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-[11px] font-black text-green-700 uppercase tracking-wider mb-2">Onde encontrar seu link</p>
            <p className="text-[12px] text-green-800">Vá em <strong>Configurações</strong> e role até <strong>"Minha Página Pública"</strong>. Lá você encontra o link para copiar e o QR Code para baixar.</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Onde compartilhar</p>
            <ul className="text-[12px] text-gray-600 space-y-0.5">
              <li>• Bio do Instagram</li>
              <li>• Stories com link</li>
              <li>• WhatsApp para clientes habituais</li>
              <li>• Cartão de visita (QR Code)</li>
            </ul>
          </div>
        </div>
      ),
    },
  ] as const;

  const step = steps[currentStep] as any;

  const iconBg =
    step.type === 'welcome'
      ? 'bg-primary/10 text-primary'
      : step.type === 'success'
      ? 'bg-green-50 text-green-600'
      : 'bg-sky-50 text-sky-600';

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-900/70 backdrop-blur-sm p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* HEADER — barra de progresso */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <div className="flex-1 flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all ${i <= currentStep ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-gray-400 tabular-nums">
            {currentStep + 1}/{steps.length}
          </span>
          <button onClick={handleClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 flex flex-col text-center min-h-[380px]">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${iconBg}`}>
            {step.icon}
          </div>

          <h2 className="text-[18px] font-extrabold text-gray-900 mb-2">{step.title}</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">{step.main}</p>

          <div className="mt-3 text-left">
            {step.content}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-[13px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <ChevronLeft size={14} /> Voltar
              </button>
            ) : (
              <div className="flex-1" />
            )}

            <button
              onClick={handleNext}
              className="flex-[1.5] bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 text-[13px] font-extrabold flex items-center justify-center gap-1 shadow-lg shadow-primary/20 transition-all"
            >
              {currentStep === LAST_STEP ? 'Acessar o sistema' : 'PRÓXIMO'}
              {currentStep !== LAST_STEP && <ChevronRight size={14} />}
            </button>
          </div>

          {currentStep < LAST_STEP && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-[12px] font-semibold transition-colors"
            >
              Pular e acessar o sistema
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
