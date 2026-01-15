
import React from 'react';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const LegalTerms: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <span className="text-sm font-black tracking-tighter uppercase">Jurídico</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24 space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Termos de Uso e Privacidade</h1>
          <p className="text-gray-400 font-medium">Última atualização: Dezembro de 2024</p>
        </header>

        <section className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-primary" /> 1. Termos de Uso
            </h2>
            <p>
              Ao utilizar o <b>CP Agenda</b>, serviço desenvolvido pela <b>Creative Print</b>, você concorda com as seguintes condições:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>O sistema é fornecido sob regime de assinatura mensal (planos de 6 ou 12 meses).</li>
              <li>O acesso é condicionado ao pagamento prévio do período contratado.</li>
              <li>A Creative Print reserva-se o direito de bloquear o acesso em caso de inadimplência.</li>
              <li>O usuário é responsável pela veracidade dos dados de agendamento e informações da empresa.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" /> 2. Política de Privacidade
            </h2>
            <p>
              Respeitamos a privacidade de nossos usuários e de seus respectivos clientes finais:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>Dados Coletados:</b> Nome, telefone e e-mail (quando fornecido) dos clientes para fins exclusivos de agendamento.</li>
              <li><b>Uso de Dados:</b> As informações são utilizadas apenas para o funcionamento da agenda e notificações automáticas.</li>
              <li><b>Segurança:</b> Utilizamos tecnologias modernas de criptografia (via Supabase) para garantir a integridade das informações.</li>
              <li><b>Compartilhamento:</b> Não vendemos ou compartilhamos dados com terceiros para fins publicitários.</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
             <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-3">3. Política de Reembolso e Cancelamento</h3>
             <p className="text-sm leading-relaxed">
               Conforme estabelecido em nossa oferta comercial, o sistema não oferece reembolso após a ativação do acesso. O acesso permanece liberado pelo período total contratado. Em caso de não renovação, a conta será bloqueada permanentemente após o vencimento, sem taxas extras de cancelamento.
             </p>
          </div>
        </section>

        <footer className="pt-12 border-t border-gray-100 text-center">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Desenvolvido por Creative Print</p>
        </footer>
      </main>
    </div>
  );
};
