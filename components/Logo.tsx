import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`flex items-center gap-4 ${sizeClasses[size]}`}>
      {/* Brand Mark: Geometric Grid */}
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

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <span className={`${textColor} font-black text-2xl tracking-tighter uppercase`}>
          CP Agenda
        </span>
        <span className="text-[#38B6FF] font-black text-sm tracking-[0.3em] uppercase mt-1">
          PRO
        </span>
      </div>
    </div>
  );
};

