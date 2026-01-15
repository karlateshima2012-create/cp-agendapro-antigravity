
import React from 'react';
import {
  CheckCircle,
  Calendar,
  Clock,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Zap,
  Star,
  Shield,
  CreditCard,
  UserCheck,
  MousePointerClick,
  Send,
  Unlock,
  RefreshCw,
  Search,
  Check,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowRightCircle,
  HelpCircle,
  Info
} from 'lucide-react';

interface Props {
  onGoToLogin: () => void;
  onGoToLegal: () => void;
}

const whatsappLink = "https://wa.me/819011886491?text=Olá!%20Vi%20a%20página%20do%20CP%20Agenda%20e%20gostaria%20de%20ativar%20meu%20plano.";

const CPLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="10" height="10" rx="2" fill="#E91E63" />
    <rect x="1" y="13" width="10" height="10" rx="2" fill="#0EA5E9" />
    <rect x="13" y="13" width="10" height="10" rx="2" fill="#FACC15" />
    <rect x="13" y="1" width="4.5" height="4.5" rx="1" fill="#FACC15" />
    <rect x="13" y="6.5" width="4.5" height="4.5" rx="1" fill="#0EA5E9" />
    <rect x="18.5" y="6.5" width="4.5" height="4.5" rx="1" fill="#E91E63" />
  </svg>
);

// --- SEÇÃO: HERO (IMAGEM OCULTA NO MOBILE) ---
const Hero = () => (
  <section className="relative min-h-[80vh] flex items-center bg-white overflow-hidden pt-20">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
      <div className="space-y-8 animate-fade-in order-2 lg:order-1 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mx-auto lg:mx-0">
          <Zap size={16} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Creative Print Systems</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-gray-900">
          Sua agenda <br />
          <span className="bg-gradient-to-r from-[#25aae1] to-[#E91E63] bg-clip-text text-transparent">aberta 24h.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
          Modernize seu atendimento, elimine falhas de comunicação e foque no crescimento da sua empresa.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            Ativar Minha Agenda <ArrowRight size={20} />
          </a>
        </div>
      </div>

      {/* Imagem ocultada no mobile (lg:flex hidden) */}
      <div className="relative order-1 lg:order-2 hidden lg:flex justify-center lg:justify-end">
        <div className="absolute -inset-10 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl -z-10"></div>
        <div className="w-full max-w-[500px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white ring-1 ring-gray-100 transform rotate-2 hover:rotate-0 transition-all duration-700">
          <img
            src="https://midias.creativeprintjp.com/wp-content/uploads/2025/12/Gemini_Generated_Image_u6jjcau6jjcau6jj.png"
            className="w-full h-full object-cover"
            alt="CP Agenda Showcase"
          />
        </div>
      </div>
    </div>
  </section>
);

// --- SEÇÃO: VANTAGENS ---
const Benefits = () => (
  <section className="py-24 bg-gray-50 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-gray-900">Vantagens para sua Empresa</h2>
        <p className="text-primary font-black uppercase text-[10px] tracking-[0.2em]">Tecnologia que impulsiona o seu negócio</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BenefitCard icon={<Star size={32} className="text-yellow-500" />} title="Profissionalismo" desc="Passe mais credibilidade aos seus clientes com um sistema de reserva moderno e intuitivo." />
        <BenefitCard icon={<Clock size={32} className="text-primary" />} title="Ganho de Tempo" desc="Chega de perder minutos preciosos do seu dia respondendo disponibilidade no WhatsApp." />
        <BenefitCard icon={<UserCheck size={32} className="text-[#E91E63]" />} title="Fidelização" desc="Facilite a vida do seu cliente para que ele sempre escolha você pela praticidade." />
      </div>
    </div>
  </section>
);

// --- SEÇÃO: PLANOS DE ASSINATURA ---
const Pricing = () => (
  <section className="py-24 bg-white px-6" id="pricing">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-gray-900">Planos de Assinatura</h2>
        <p className="text-gray-500 font-medium">O melhor custo-benefício para sua gestão digital.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-100 p-12 rounded-[3.5rem] space-y-8 hover:shadow-2xl transition-all shadow-sm flex flex-col">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Plano 6 Meses</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-gray-900">¥ 3.000</span>
              <span className="text-gray-400 font-bold uppercase text-[10px]">/ mês</span>
            </div>
          </div>
          <ul className="space-y-4 flex-1">
            <PricingItem text="Dashboard Completo" />
            <PricingItem text="Notificações Telegram" />
            <PricingItem text="Link Público Personalizado" />
          </ul>
          <a href={whatsappLink} className="block w-full py-5 text-center bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Contratar plano</a>
        </div>

        <div className="bg-white border-2 border-primary p-12 rounded-[3.5rem] space-y-8 shadow-2xl shadow-primary/10 relative flex flex-col scale-105">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#E91E63] text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Melhor Valor</div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Plano 12 Meses</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-gray-900">¥ 2.500</span>
              <span className="text-gray-400 font-bold uppercase text-[10px]">/ mês</span>
            </div>
          </div>
          <ul className="space-y-4 flex-1">
            <PricingItem text="Dashboard Completo" />
            <PricingItem text="Notificações Telegram" />
            <PricingItem text="Link Público Personalizado" />
            <PricingItem text="Economia de ¥ 6.000/ano" />
          </ul>
          <a href={whatsappLink} className="block w-full py-5 text-center bg-gradient-to-r from-primary to-[#E91E63] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20">Contratar plano</a>
        </div>
      </div>
    </div>
  </section>
);

// --- SEÇÃO: RECURSOS DO SISTEMA ---
const Features = () => (
  <section className="py-24 bg-gray-50 px-6 rounded-[5rem] mx-4">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-gray-900">Recursos do Sistema</h2>
        <p className="text-gray-400 font-medium">Tudo o que você precisa em um único lugar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
        <FeatureListItem title="Página Personalizada" desc="Link exclusivo com sua identidade visual para agendamentos rápidos." />
        <FeatureListItem title="WhatsApp & Telegram" desc="Notificações em tempo real para você nunca perder um cliente." />
        <FeatureListItem title="Controle de Escala" desc="Defina horários, pausas e bloqueios de datas com total facilidade." />
        <FeatureListItem title="Gestão de Serviços" desc="Cadastre múltiplos serviços com durações e preços variados." />
        <FeatureListItem title="Dashboard Mobile e PC" desc="Acesse e gerencie seus compromissos de qualquer dispositivo." />
        <FeatureListItem title="Segurança Creative Print" desc="Seus dados protegidos com criptografia de ponta a ponta." />
      </div>
    </div>
  </section>
);

// --- SEÇÃO: PROCESSO DE ASSINATURA (REMOÇÃO DE EMOJIS) ---
const Process = () => (
  <section className="py-32 bg-white px-6">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-gray-900">Comece em poucos minutos</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Do primeiro contato à agenda funcionando, sem complicação. Um processo simples, pensado para quem quer resultado rápido, não dor de cabeça.
        </p>
      </div>

      <div className="mb-24">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Info size={20} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Como funciona</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ProcessStepCard
            number="1"
            icon={<MessageCircle size={24} />}
            title="Fale com a Creative Print"
            desc="O atendimento acontece pelo WhatsApp. Tiramos suas dúvidas e confirmamos se o CP Agenda é ideal para o seu negócio."
          />
          <ProcessStepCard
            number="2"
            icon={<Wallet size={24} />}
            title="Confirme o pagamento"
            desc="Pagamento via transferência ou PayPay. Simples, sem taxas escondidas."
          />
          <ProcessStepCard
            number="3"
            icon={<Zap size={24} />}
            title="Ativação do sistema"
            desc="Após a confirmação, sua agenda é ativada e configurada para o seu negócio."
          />
          <ProcessStepCard
            number="4"
            icon={<CheckCircle2 size={24} />}
            title="Tudo pronto"
            desc="Você recebe seu acesso e já pode começar a receber agendamentos online."
          />
        </div>
      </div>

      {/* BLOCO: SEGURANÇA E TRANSPARÊNCIA */}
      <div className="bg-gray-50 rounded-[4rem] p-10 md:p-16 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/3 space-y-4">
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full mb-2">
              <Lock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Confiança</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 leading-tight">Segurança e transparência</h3>
            <p className="text-gray-500 font-medium text-sm">Sem letras miúdas. Sem surpresas.</p>
          </div>

          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Shield size={20} />
                <h4 className="font-black uppercase text-xs tracking-widest">Acesso garantido</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Seu acesso ao CP Agenda fica ativo durante todo o período contratado. Antes do vencimento, você é notificado para renovar com tranquilidade e evitar qualquer interrupção.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#E91E63]">
                <CreditCard size={20} />
                <h4 className="font-black uppercase text-xs tracking-widest">Política de investimento</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                O valor é claro e transparente. Após a ativação do sistema, não há reembolso, e o acesso permanece garantido até o final do ciclo contratado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- SEÇÃO: SOBRE A CREATIVE PRINT ---
const About = () => (
  <section className="py-24 bg-white px-6">
    <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
      <div className="mb-2">
        <CPLogo className="w-20 h-20" />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Uma solução Creative Print</h2>
        <p className="text-gray-500 max-w-2xl font-medium leading-relaxed">
          A <b>Creative Print</b> desenvolve soluções digitais pensadas para a realidade de quem empreende no Japão. O <b>CP Agenda</b> foi criado para para eliminar o caos dos agendamentos manuais e devolver tempo, organização e controle para negócios que trabalham com hora marcada.
        </p>
      </div>
      <a
        href="https://wa.me/819011886491"
        target="_blank"
        rel="noreferrer"
        className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-3"
      >
        <MessageCircle size={20} /> Entre em contato
      </a>
    </div>
  </section>
);

// --- SEÇÃO: RODAPÉ ---
const Footer = ({ onGoToLogin, onGoToLegal }: { onGoToLogin: () => void, onGoToLegal: () => void }) => (
  <footer className="py-12 px-6 border-t border-gray-100 bg-white">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <CPLogo className="w-6 h-6 grayscale" />
        <span className="text-sm font-black text-gray-400">© 2026 CP - Agenda Pro</span>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={onGoToLogin} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Login</button>
        <button onClick={onGoToLegal} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Termos e Privacidade</button>
      </div>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Powered by Creative Print</p>
    </div>
  </footer>
);

// --- COMPONENTES AUXILIARES ---

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 space-y-6 group">
    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
    <p className="text-gray-500 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
);

const FeatureListItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-4 group">
    <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
      <Check size={14} strokeWidth={4} />
    </div>
    <div className="space-y-1">
      <h4 className="font-black text-gray-900 text-lg tracking-tight uppercase">{title}</h4>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ProcessStepCard = ({ number, icon, title, desc }: { number: string, icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 relative">
    <div className="absolute top-6 right-6 text-4xl font-black text-gray-50 opacity-50 group-hover:text-primary/10">{number}</div>
    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-primary mb-2">
      {icon}
    </div>
    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">{title}</h4>
    <p className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const PricingItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
    <CheckCircle size={18} className="text-green-500 shrink-0" />
    {text}
  </li>
);

// --- COMPONENTE PRINCIPAL ---
export const LandingPage: React.FC<Props> = ({ onGoToLogin, onGoToLegal }) => {
  return (
    <div className="bg-white font-sans text-gray-900 overflow-x-hidden">
      {/* Navbar Clara */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CPLogo className="w-8 h-8" />
            <span className="text-xl font-black tracking-tighter text-gray-900">CP - Agenda</span>
          </div>
          <button
            onClick={onGoToLogin}
            className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 hover:shadow-lg active:scale-95"
          >
            Área do Profissional
          </button>
        </div>
      </nav>

      <Hero />
      <Benefits />
      <Pricing />
      <Features />
      <Process />
      <About />
      <Footer onGoToLogin={onGoToLogin} onGoToLegal={onGoToLegal} />
    </div>
  );
};
