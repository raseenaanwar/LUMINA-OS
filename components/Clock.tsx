
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dubaiTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(time);

  return (
    <div className="flex flex-col items-end shrink-0">
      <div className="text-[8px] md:text-xs uppercase tracking-[0.1em] md:tracking-widest text-slate-500 font-bold mb-0.5 md:mb-1">Dubai GST (UTC+4)</div>
      <div className="text-2xl md:text-4xl font-mono font-medium text-cyan-400 tracking-tighter">
        {dubaiTime}
      </div>
    </div>
  );
};

export default Clock;
