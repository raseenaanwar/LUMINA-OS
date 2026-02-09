import React from 'react';

interface IoTConsoleProps {
  command: any;
}

const IoTConsole: React.FC<IoTConsoleProps> = ({ command }) => {
  return (
    <div className="bg-[#050b18] border border-white/5 h-full overflow-hidden flex flex-col font-mono">
      {/* Header aligned with the provided image */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
          LUMINA MATTER BRIDGE <span className="text-slate-600 ml-2">[CONCEPT_DEMO]</span>
        </h3>
        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase italic">
          Simulated Integration
        </div>
      </div>
      
      {/* JSON Display Area with IDE-like styling */}
      <div className="flex-1 overflow-auto p-8 custom-scroll">
        <div className="text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold mb-4">
          // START CONCEPTUAL PAYLOAD (MATTER V1.3)
        </div>
        
        <div className="text-[12px] md:text-[13px] leading-relaxed">
          <pre className="text-cyan-400/90 whitespace-pre-wrap">
            <span className="text-slate-500">{`{`}</span>
            {Object.entries(command).map(([key, value], index, array) => (
              <div key={key} className="pl-4">
                <span className="text-cyan-400">"{key}"</span><span className="text-slate-500">: {`{`}</span>
                <div className="pl-4">
                  {Object.entries(value as any).map(([innerKey, innerValue], innerIndex, innerArray) => (
                    <div key={innerKey}>
                      <span className="text-cyan-400">"{innerKey}"</span><span className="text-slate-500">: </span>
                      <span className={typeof innerValue === 'number' ? 'text-emerald-400' : 'text-emerald-500'}>
                        {typeof innerValue === 'number' ? innerValue : `"${innerValue}"`}
                      </span>
                      {innerIndex < innerArray.length - 1 ? <span className="text-slate-500">,</span> : null}
                    </div>
                  ))}
                </div>
                <span className="text-slate-500">{`}`}</span>
                {index < array.length - 1 ? <span className="text-slate-500">,</span> : null}
              </div>
            ))}
            <span className="text-slate-500">{`}`}</span>
          </pre>
        </div>

        <div className="text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold mt-6">
          // END CONCEPTUAL PAYLOAD
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex justify-between items-center text-[9px] text-slate-600 uppercase font-black tracking-widest">
        <div className="flex items-center gap-4">
          <span>Status: <span className="text-emerald-500/80">Operational_Simulation</span></span>
          <span className="opacity-40">|</span>
          <span>Latency: 0ms</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-pulse" />
          <span>Active Bridge: Node_DXB</span>
        </div>
      </div>
    </div>
  );
};

export default IoTConsole;
