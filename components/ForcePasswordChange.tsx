import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
  onPasswordChanged: (newPass: string) => void;
  onLogout: () => void;
}

export const ForcePasswordChange: React.FC<Props> = ({ onPasswordChanged, onLogout }) => {
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass1.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (pass1 !== pass2) {
      setError('As senhas não conferem.');
      return;
    }
    onPasswordChanged(pass1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border-t-4 border-yellow-500">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
            <Lock size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Defina sua Senha</h1>
        <p className="text-gray-500 mb-8 text-center">Este é seu primeiro acesso. Por segurança, defina uma nova senha pessoal.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPass1 ? "text" : "password"} 
                required 
                value={pass1}
                onChange={e => setPass1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all pr-12" 
              />
              <button 
                type="button"
                onClick={() => setShowPass1(!showPass1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 transition-colors"
              >
                {showPass1 ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
            <div className="relative">
              <input 
                type={showPass2 ? "text" : "password"} 
                required 
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all pr-12" 
              />
              <button 
                type="button"
                onClick={() => setShowPass2(!showPass2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 transition-colors"
              >
                {showPass2 ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-md transition-all">
            Salvar Senha e Entrar
          </button>
          <button type="button" onClick={onLogout} className="w-full text-gray-500 font-medium py-2 text-sm hover:underline">
            Cancelar e Sair
          </button>
        </form>
      </div>
    </div>
  );
};