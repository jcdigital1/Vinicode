import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSlogan = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div id="vini-code-brand-logo" className="flex items-center gap-2.5 select-none">
      {/* QR + V integrated minimalist icon */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center bg-gradient-to-br from-red-600 to-red-900 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.25)] border border-red-500/40 shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* QR corner module top-left */}
          <rect x="3" y="3" width="5" height="5" rx="1" fill="#ffffff" />
          <rect x="4.5" y="4.5" width="2" height="2" fill="#ef4444" />

          {/* QR corner module top-right */}
          <rect x="16" y="3" width="5" height="5" rx="1" fill="#ffffff" />
          <rect x="17.5" y="4.5" width="2" height="2" fill="#ef4444" />

          {/* Stylized Sharp 'V' cutting through the center to bottom */}
          <path
            d="M5 11L12 21L19 11H15.5L12 16.5L8.5 11H5Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-white ${textSizes[size]}`}>
            VINI
          </span>
          <span className={`font-semibold tracking-wider text-red-500 ${textSizes[size]}`}>
            CODE
          </span>
        </div>
        {showSlogan && (
          <span className="text-[11px] text-zinc-400 font-normal tracking-wide mt-1">
            QR Codes inteligentes. Links que evoluem.
          </span>
        )}
      </div>
    </div>
  );
};
