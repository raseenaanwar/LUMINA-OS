
import React from 'react';
import { EnvironmentalAnalysis } from '../types';

interface MetricsProps {
  analysis: EnvironmentalAnalysis;
}

const EnvironmentMetrics: React.FC<MetricsProps> = ({ analysis }) => {
  return (
    <div className="w-full overflow-hidden border border-white/5 bg-white/[0.01]">
      <table className="w-full text-left text-[11px] font-mono">
        <thead className="bg-white/[0.03] border-b border-white/5">
          <tr>
            <th className="px-6 py-4 text-slate-600 font-bold uppercase tracking-widest">Spectral_Analysis</th>
            <th className="px-6 py-4 text-slate-600 font-bold uppercase tracking-widest text-right">AI_Estimate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="px-6 py-4 text-slate-400">Estimated Correlated Color Temp</td>
            <td className="px-6 py-4 text-white text-right">{analysis.preSyncStatus.kelvinRange}</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-slate-400">Biologically Effective Intensity</td>
            <td className="px-6 py-4 text-white text-right">{analysis.preSyncStatus.luxEquivalent}</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-slate-400">Detected Circadian Stressors</td>
            <td className="px-6 py-4 text-red-500 text-right uppercase text-[9px] font-bold">
              {analysis.preSyncStatus.stressors.join(' // ')}
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-slate-400">Biological Activating Potential</td>
            <td className="px-6 py-4 text-cyan-400 font-bold text-right uppercase">
              {analysis.circadianPhase}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EnvironmentMetrics;
