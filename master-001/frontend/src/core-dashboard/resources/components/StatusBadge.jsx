import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-green-500/10 text-green-400 border-green-500/20',
    Spiking: 'bg-red-500/10 text-red-400 border-red-500/20',
    Zombie: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    New: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
        styles[status] || styles.Active
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
