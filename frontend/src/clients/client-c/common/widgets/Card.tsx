import React from 'react';
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#1a1b20]/60 backdrop-blur-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '' }: CardProps) => {
  return (
    <h3 className={`text-lg font-semibold text-white ${className}`}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };
