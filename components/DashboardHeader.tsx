
import React from 'react';
import { AccountInfo } from '../types';
import { LogOut } from 'lucide-react';

interface Props {
  account: AccountInfo;
  onLogout: () => void;
  onOpenPublic?: () => void;
}

export const DashboardHeader: React.FC<Props> = ({ account, onLogout }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 pb-8 mb-10 gap-4 px-2 border-b border-gray-200/60">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
          Olá, {account.companyName}!
        </h1>
        <p className="text-gray-400 font-medium text-sm mt-1">
          Gerencie aqui os seus agendamentos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-6 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-gray-200 hover:border-red-100 active:scale-95 shadow-sm bg-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};
