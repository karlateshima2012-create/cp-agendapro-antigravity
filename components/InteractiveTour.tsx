import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Calendar,
  Clock, Briefcase, Settings, PartyPopper, Bell,
  MessageCircle, BarChart2
} from 'lucide-react';
import { AccountInfo } from '../types';

interface Props {
  seen: boolean;
  onMarkSeen: () => Promise<void> | void;
  setActiveTab: (tab: any) => void;
  activeTab: string;
  setShowMobileMenu: (show: boolean) => void;
  showMobileMenu: boolean;
}

interface TourStep {
  target: string;         // Desktop CSS selector
  mobileTarget?: string;  // Mobile alternative CSS selector
  tab?: string;           // Active tab ID required for this step
  requiresMobileMore?: boolean; // Set true to toggle the overflow mobile menu
  title: string;          // Tooltip title
  content: string;        // Tooltip text
  position: 'top' | 'bottom' | 'left' | 'right'; // Desktop positioning relative to element
}

export const InteractiveTour: React.FC<Props> = ({
  seen,
  onMarkSeen,
  setActiveTab,
  activeTab,
  setShowMobileMenu,
  showMobileMenu
}) => {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 is the initial welcome dialog
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const checkIntervalRef = useRef<any>(null);

  // Initialize visibility based on the onboardingSeen state
  useEffect(() => {
    if (!seen) {
      setIsVisible(true);
    }
  }, [seen]);

  // Track window resizing to dynamically check for mobile views
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Steps configuration
  const steps: TourStep[] = [
    {
      target: '[data-tour="nav-appointments"]',
      mobileTarget: '[data-tour="mobile-nav-appointments"]',
      tab: 'appointments',
      title: 'Sua Agenda e Calendário',
      content: 'Aqui você acompanha todos os seus agendamentos confirmados e pendentes. É o cérebro do seu painel.',
      position: 'right',
    },
    {
      target: '[data-tour="appointments-toggle"]',
      mobileTarget: '[data-tour="appointments-toggle"]',
      tab: 'appointments',
      title: 'Grade, Lista ou Calendário',
      content: 'Alterne a visualização como preferir: grade rápida de cartões, lista compacta para o dia a dia, ou o calendário mensal completo.',
      position: 'bottom',
    },
    {
      target: '[data-tour="first-appointment"]',
      mobileTarget: '[data-tour="first-appointment"]',
      tab: 'appointments',
      title: 'Ações de Agendamento',
      content: 'Clique em cada agendamento para ver detalhes, confirmar horários pendentes, cancelar, ou enviar mensagens prontas diretamente para o WhatsApp do cliente.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-availability"]',
      mobileTarget: '[data-tour="mobile-nav-availability"]',
      tab: 'availability',
      title: 'Horários e Folgas',
      content: 'Gerencie em quais dias e horários você trabalha. Você pode criar intervalos automáticos ou definir horários fixos e bloquear férias.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-services"]',
      mobileTarget: '[data-tour="mobile-nav-services"]',
      tab: 'services',
      title: 'Seus Serviços',
      content: 'Cadastre seus serviços. Lembre-se de definir a duração certa de cada um e o tempo de limpeza (buffer) pós-atendimento para evitar conflitos na sua agenda pública.',
      position: 'right',
    },
    {
      target: '[data-tour="telegram-config"]',
      mobileTarget: '[data-tour="telegram-config"]',
      tab: 'account',
      title: 'Notificações no Telegram',
      content: 'Configure as notificações para receber alertas com som instantâneos no seu celular sempre que um cliente agendar.',
      position: 'top',
    },
    {
      target: '[data-tour="public-link-section"]',
      mobileTarget: '[data-tour="public-link-section"]',
      tab: 'account',
      title: 'Divulgue seu Link Público',
      content: 'Este é o link que suas clientes usam para agendar sozinhas. Copie e cole na biografia do seu Instagram ou use o QR Code impresso no balcão.',
      position: 'top',
    },
    {
      target: '[data-tour="nav-gestao"]',
      mobileTarget: '[data-tour="mobile-overflow-gestao"]',
      tab: 'gestao',
      requiresMobileMore: true,
      title: 'Métricas de Gestão',
      content: 'Acompanhe o faturamento mensal estimado (convertido automaticamente para BRL ou JPY), taxa de cancelamento e ranking dos serviços mais vendidos.',
      position: 'right',
    }
  ];

  // Dynamic listener to position spotlight masking cutout over the targeted DOM element
  useEffect(() => {
    if (!isVisible || currentStep < 0 || currentStep >= steps.length) {
      setTargetRect(null);
      return;
    }

    const step = steps[currentStep];

    // Trigger tab updates if requested by the current step configuration
    if (step.tab && activeTab !== step.tab) {
      setActiveTab(step.tab);
    }

    // Trigger Mobile Overflow Menu if required
    if (isMobile) {
      if (step.requiresMobileMore && !showMobileMenu) {
        setShowMobileMenu(true);
      } else if (!step.requiresMobileMore && showMobileMenu) {
        setShowMobileMenu(false);
      }
    }

    const updateCoordinates = () => {
      const selector = isMobile && step.mobileTarget ? step.mobileTarget : step.target;
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Skip updating if coordinates are exactly identical to prevent render loops
        if (
          !targetRect ||
          targetRect.x !== rect.x ||
          targetRect.y !== rect.y ||
          targetRect.width !== rect.width ||
          targetRect.height !== rect.height
        ) {
          setTargetRect(rect);
        }
      } else {
        setTargetRect(null);
      }
    };

    // Periodically poll DOM to position correctly when tabs transition or contents load
    updateCoordinates();
    checkIntervalRef.current = setInterval(updateCoordinates, 150);

    // Bind scroll/resize for responsive positioning
    window.addEventListener('resize', updateCoordinates);
    window.addEventListener('scroll', updateCoordinates, true);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates, true);
    };
  }, [currentStep, isVisible, isMobile, activeTab, showMobileMenu]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  const handleClose = async () => {
    try {
      await onMarkSeen();
    } finally {
      setIsVisible(false);
      setShowMobileMenu(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > -1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isVisible) return null;

  // Render Initial Welcome dialog
  if (currentStep === -1) {
    return (
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 animate-pulse">
            <PartyPopper size={36} />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Tour pelo Sistema!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
            Seu painel CP Agenda Pro está pronto. Vamos fazer um tour guiado de 1 minuto para te mostrar as principais ferramentas e configurações?
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setCurrentStep(0)}
              className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              Iniciar Tour Guiado
            </button>
            <button
              onClick={handleClose}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-wider border border-gray-100"
            >
              Pular e Acessar Direto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate coordinates for the tooltip box on Desktop
  const getTooltipStyles = () => {
    if (!targetRect || isMobile) return {};

    const spacing = 24;
    const step = steps[currentStep];
    const styles: React.CSSProperties = { position: 'fixed', zIndex: 10001 };

    switch (step.position) {
      case 'right':
        styles.left = targetRect.right + spacing;
        styles.top = targetRect.top + (targetRect.height - 180) / 2; // Approximate height center
        break;
      case 'left':
        styles.left = targetRect.left - 360 - spacing; // Approximate width 360px
        styles.top = targetRect.top + (targetRect.height - 180) / 2;
        break;
      case 'bottom':
        styles.left = targetRect.left + (targetRect.width - 360) / 2;
        styles.top = targetRect.bottom + spacing;
        break;
      case 'top':
      default:
        styles.left = targetRect.left + (targetRect.width - 360) / 2;
        styles.top = targetRect.top - 180 - spacing;
        break;
    }

    // Window boundaries checks to prevent tooltip from overflow clipping
    if (styles.left && typeof styles.left === 'number') {
      if (styles.left < 16) styles.left = 16;
      if (styles.left + 360 > window.innerWidth - 16) {
        styles.left = window.innerWidth - 376;
      }
    }
    if (styles.top && typeof styles.top === 'number') {
      if (styles.top < 16) styles.top = 16;
      if (styles.top + 200 > window.innerHeight - 16) {
        styles.top = window.innerHeight - 216;
      }
    }

    return styles;
  };

  // Draw arrow path between targeted spotlight element and tooltip box
  const renderArrow = () => {
    if (!targetRect || isMobile) return null;

    const step = steps[currentStep];
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let qX = 0; // Curve control points
    let qY = 0;

    const tStyles = getTooltipStyles();
    const tX = Number(tStyles.left || 0);
    const tY = Number(tStyles.top || 0);
    const tW = 360;
    const tH = 170; // Approximate card dimensions

    if (step.position === 'right') {
      startX = tX;
      startY = tY + tH / 2;
      endX = targetRect.right;
      endY = targetRect.top + targetRect.height / 2;
      qX = endX + (startX - endX) / 2;
      qY = endY - 40; // Curve upward
    } else if (step.position === 'bottom') {
      startX = tX + tW / 2;
      startY = tY;
      endX = targetRect.left + targetRect.width / 2;
      endY = targetRect.bottom;
      qX = endX + 40;
      qY = endY + (startY - endY) / 2;
    } else if (step.position === 'top') {
      startX = tX + tW / 2;
      startY = tY + tH;
      endX = targetRect.left + targetRect.width / 2;
      endY = targetRect.top;
      qX = endX - 40;
      qY = endY + (startY - endY) / 2;
    } else if (step.position === 'left') {
      startX = tX + tW;
      startY = tY + tH / 2;
      endX = targetRect.left;
      endY = targetRect.top + targetRect.height / 2;
      qX = endX + (startX - endX) / 2;
      qY = endY + 40;
    }

    return (
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[10000] overflow-visible">
        {/* Glow drop-shadow filter */}
        <defs>
          <filter id="arrow-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#25aae1" />
          </marker>
        </defs>

        {/* Animated curved pointer path */}
        <path
          d={`M ${startX} ${startY} Q ${qX} ${qY} ${endX} ${endY}`}
          fill="none"
          stroke="#25aae1"
          strokeWidth="3"
          strokeDasharray="6 4"
          markerEnd="url(#arrowhead)"
          filter="url(#arrow-glow)"
          className="animate-[dash_1s_linear_infinite]"
        />

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
        `}} />
      </svg>
    );
  };

  const step = steps[currentStep];

  return (
    <>
      {/* 1. Fullscreen dark backdrop with spotlight cutout */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9998] overflow-hidden">
        <defs>
          <mask id="spotlight-mask">
            {/* White rectangle covers whole screen (keeps dark background) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black rectangle makes the cutout element fully transparent/highlighted */}
            {targetRect && (
              <rect
                x={targetRect.x - 6}
                y={targetRect.y - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Overlay rectangle with mask applied */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
        />

        {/* Dynamic Glowing border outline around the cutout target */}
        {targetRect && (
          <rect
            x={targetRect.x - 6}
            y={targetRect.y - 6}
            width={targetRect.width + 12}
            height={targetRect.height + 12}
            rx="14"
            ry="14"
            fill="none"
            stroke="#25aae1"
            strokeWidth="3.5"
            className="animate-pulse pointer-events-none"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(37,170,225,0.7))',
            }}
          />
        )}
      </svg>

      {/* 2. Visual Guide Arrow (Desktop Only) */}
      {renderArrow()}

      {/* 3. Glassmorphic Tooltip Card */}
      <div
        style={getTooltipStyles()}
        className={`bg-white/95 backdrop-blur-md rounded-3xl border border-gray-100 shadow-2xl p-6 flex flex-col z-[10001] transition-all animate-fade-in ${
          isMobile
            ? 'fixed bottom-[85px] left-4 right-4 w-auto h-auto max-h-[40vh] overflow-y-auto shadow-[0_-15px_30px_rgba(0,0,0,0.15)] border-t border-gray-100'
            : 'w-[360px]'
        }`}
        role="dialog"
      >
        {/* Header section with progress dots */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex gap-1 flex-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
            {currentStep + 1} / {steps.length}
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
            title="Sair do Onboarding"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5 mb-5">
          <h3 className="font-extrabold text-[15px] text-gray-900 tracking-tight flex items-center gap-2">
            {currentStep === 0 && <PartyPopper size={18} className="text-primary" />}
            {currentStep === 3 && <Clock size={18} className="text-primary" />}
            {currentStep === 4 && <Briefcase size={18} className="text-primary" />}
            {currentStep === 5 && <Bell size={18} className="text-primary" />}
            {step.title}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {step.content}
          </p>
        </div>

        {/* Action button controls */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 gap-3">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest"
          >
            Pular
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all ${
                currentStep === 0 ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-primary/10 tracking-widest uppercase transition-all"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Avançar'}
              {currentStep < steps.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
