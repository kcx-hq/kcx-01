import React from 'react';

interface KeepAliveProps {
  children?: React.ReactNode;
  isActive: boolean;
}

const KeepAlive = React.memo(
  ({ children, isActive }: KeepAliveProps) => {
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
          transition: isActive ? 'opacity 0.15s ease-in-out' : 'none',
        }}
        aria-hidden={!isActive}
      >
        {children}
      </div>
    );
  },
  (prev: KeepAliveProps, next: KeepAliveProps) => prev.isActive === next.isActive
);

KeepAlive.displayName = 'KeepAlive';
export default KeepAlive;



