import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-black';
  const subColor = variant === 'light' ? 'text-white/50' : 'text-[#A0AEC0]';
  
  const scale = size === 'sm' ? 'scale-[0.6] -ml-4' : size === 'lg' ? 'scale-125' : 'scale-100';

  return (
    <div className={`flex items-center gap-5 transition-all ${scale} origin-left`}>
      {/* Gráfico Geométrico (6 Elementos) */}
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        {/* Coluna 1 */}
        <rect x="0" y="0" width="10" height="10" rx="1" fill="#E5157A" />
        <rect x="0" y="12" width="10" height="10" rx="1" fill="#38B6FF" />
        
        {/* Coluna 2 */}
        <rect x="12" y="0" width="4.5" height="4.5" rx="0.5" fill="#FFF200" />
        <rect x="12" y="6" width="4.5" height="4.5" rx="0.5" fill="#38B6FF" />
        <rect x="12" y="12" width="10" height="10" rx="1" fill="#FFF200" />
        
        {/* Coluna 3 */}
        <rect x="18" y="6" width="4.5" height="4.5" rx="0.5" fill="#E5157A" />
      </svg>

      {/* Tipografia Alinhada */}
      <div className="flex flex-col leading-none">
        <h1 className={`${textColor} font-black text-[34px] tracking-tight leading-none uppercase`}>
          CP AGENDA
        </h1>
        <p className={`${subColor} text-[11px] font-medium tracking-[0.54em] uppercase mt-1 leading-none mr-[-0.54em]`}>
          CREATIVE PRINT
        </p>
      </div>
    </div>
  );
};



