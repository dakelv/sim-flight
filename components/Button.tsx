import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'neutral';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'neutral', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded font-bold uppercase tracking-widest transition-all duration-200 text-sm border-2";
  
  const variants = {
    primary: "bg-blue-900/50 border-blue-500 text-blue-100 hover:bg-blue-800 hover:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    danger: "bg-red-900/50 border-red-500 text-red-100 hover:bg-red-800 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    warning: "bg-amber-900/50 border-amber-500 text-amber-100 hover:bg-amber-800 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    neutral: "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-400",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};