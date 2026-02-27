import React from 'react';
import type { ReactNode } from "react";

interface KeepAliveProps {
  children: ReactNode;
  isActive: boolean;
}

const KeepAlive = ({ children, isActive }: KeepAliveProps) => {
  return (
    <div 
      style={{ 
        display: isActive ? 'block' : 'none',
        visibility: isActive ? 'visible' : 'hidden',
        position: isActive ? 'relative' : 'absolute',
        width: isActive ? '100%' : 0,
        height: isActive ? 'auto' : 0,
        overflow: isActive ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: isActive ? 1 : 0,
        transition: isActive ? 'opacity 0.15s ease-in-out' : 'none'
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
};

export default KeepAlive;
