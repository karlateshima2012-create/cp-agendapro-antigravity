import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Props {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type, onClose }) => {
  const isCentered = type === 'error' || type === 'warning';

  useEffect(() => {
    const delay = isCentered ? 8000 : 4000;
    const timer = setTimeout(onClose, delay);
    return () => clearTimeout(timer);
  }, [onClose, isCentered]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', iconColor: 'text-green-500' },
    error: { icon: XCircle, bg: 'bg-white', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', iconColor: 'text-blue-500' },
    warning: { icon: AlertTriangle, bg: 'bg-white', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  }[type];

  const Icon = config.icon;

  if (isCentered) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      >
        <div
          className={`relative flex flex-col items-center gap-4 px-8 py-7 rounded-3xl border-2 ${config.bg} ${config.border} shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200`}
          onClick={e => e.stopPropagation()}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${type === 'error' ? 'bg-red-50' : 'bg-amber-50'}`}>
            <Icon className={config.iconColor} size={32} />
          </div>
          <p className={`text-sm font-bold ${config.text} text-center leading-relaxed`}>{message}</p>
          <button
            onClick={onClose}
            className={`mt-1 w-full py-2.5 rounded-2xl text-sm font-black transition-all ${type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
          >
            Ok, entendi
          </button>
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl border ${config.bg} ${config.border} shadow-2xl animate-in slide-in-from-right-full duration-300 max-w-sm`}>
      <Icon className={config.iconColor} size={24} />
      <p className={`text-sm font-bold ${config.text}`}>{message}</p>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};
