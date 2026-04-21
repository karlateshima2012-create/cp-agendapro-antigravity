import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
  const sizeClasses = {
    sm: 'scale-75 origin-left',
    md: 'scale-100',
    lg: 'scale-125'
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const subColor = variant === 'light' ? 'text-white/60' : 'text-gray-400';

  return (
    <div className={`flex items-center gap-4 ${sizeClasses[size]}`}>
      {/* Brand Mark: Geometric Grid (Definitive) */}
      <div className="grid grid-cols-2 gap-[3px] w-12 h-12 flex-shrink-0">
        <div className="bg-[#E5157A] rounded-[2px]" /> {/* Top Left */}
        <div className="grid grid-cols-2 gap-[2px]"> {/* Top Right Mini-Grid */}
          <div className="bg-[#FFF200] rounded-[1px]" />
          <div className="bg-transparent" />
          <div className="bg-[#38B6FF] rounded-[1px]" />
          <div className="bg-[#E5157A] rounded-[1px]" />
        </div>
        <div className="bg-[#38B6FF] rounded-[2px]" /> {/* Bottom Left */}
        <div className="bg-[#FFF200] rounded-[2px]" /> {/* Bottom Right */}
      </div>

      {/* Typography: Aligned Widths */}
      <div className="flex flex-col leading-none">
        <h1 className={`${textColor} font-black text-2xl tracking-tighter uppercase mb-0.5`}>
          CP AGENDA
        </h1>
        <div className="w-full flex justify-between uppercase">
          <p className={`${subColor} text-[8px] font-bold tracking-[0.28em] w-full text-justify`} style={{ textAlignLast: 'justify' }}>
            CREATIVE PRINT
          </p>
        </div>
      </div>
    </div>
  );
};


