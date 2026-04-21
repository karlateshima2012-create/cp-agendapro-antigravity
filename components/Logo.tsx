import React from 'react';

interface LogoProps {
  variant?: 'vertical' | 'horizontal';
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'horizontal', size = 45 }) => {
  const graphic = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <rect x="1" y="1" width="10" height="10" rx="2" fill="#E91E63" />
      <rect x="1" y="13" width="10" height="10" rx="2" fill="#0EA5E9" />
      <rect x="13" y="13" width="10" height="10" rx="2" fill="#FACC15" />
      <rect x="13" y="1" width="4.5" height="4.5" rx="1" fill="#FACC15" />
      <rect x="13" y="6.5" width="4.5" height="4.5" rx="1" fill="#0EA5E9" />
      <rect x="18.5" y="6.5" width="4.5" height="4.5" rx="1" fill="#E91E63" />
    </svg>
  );

  if (variant === 'vertical') {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2">
          {graphic}
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#1a1a1a] leading-none tracking-tighter">
              CP AGENDA
            </h1>
            <p className="text-[10px] font-medium text-gray-400 tracking-[0.4em] mt-1 leading-none">
              CREATIVE PRINT
            </p>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-[#E91E63] tracking-[0.2em] uppercase">PRO</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {graphic}
      <div className="flex flex-col">
        <span className="text-sm font-black text-gray-900 leading-none tracking-tight">CP AGENDA</span>
        <span className="text-[10px] font-black text-[#E91E63] mt-0.5 tracking-widest uppercase">PRO</span>
      </div>
    </div>
  );
};
