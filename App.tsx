
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EnvironmentalAnalysis, HistoryItem } from './types';
import { analyzeEnvironment } from './services/geminiService';
import Clock from './components/Clock';
import IoTConsole from './components/IoTConsole';
import EnvironmentMetrics from './components/EnvironmentMetrics';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EnvironmentalAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [currentSource, setCurrentSource] = useState<'live' | 'upload'>('live');
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (level: number = 0) => {
    setInitializing(true);
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("SYSTEM_FAULT: MEDIA_APIS_NOT_FOUND");
      setInitializing(false);
      return;
    }

    const constraintsList = [
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false }
    ];

    if (level >= constraintsList.length) {
      setError("SENSOR_FAULT: PERMANENT_IO_ERROR");
      setInitializing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraintsList[level]);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              setCameraActive(true);
              setInitializing(false);
              setPreviewImage(null);
            })
            .catch(e => {
              setError("SYSTEM_INTERCEPT: USER_ACTION_REQUIRED");
              setInitializing(false);
            });
        };
      } else {
        setTimeout(() => startCamera(level), 100);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("AUTH_ERROR: OPTICAL_ACCESS_DENIED");
        setInitializing(false);
      } else {
        await startCamera(level + 1);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const executeAnalysis = async (base64: string, source: 'live' | 'upload') => {
    setIsAnalyzing(true);
    setError(null);
    setCurrentSource(source);
    
    const dubaiTimeStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());

    setCurrentTimestamp(dubaiTimeStr);

    try {
      const result = await analyzeEnvironment(base64, dubaiTimeStr, source === 'live');
      setAnalysis(result);
      setHistory(prev => [{
        timestamp: dubaiTimeStr,
        source: source,
        analysis: result,
        imageUrl: `data:image/jpeg;base64,${base64}`
      }, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(`CORE_ERROR: ${err.message || 'ANALYSIS_TIMEOUT'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    if (previewImage) {
      const base64 = previewImage.split(',')[1];
      await executeAnalysis(base64, 'upload');
      return;
    }
    if (!cameraActive) {
      await startCamera(0);
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    try {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        await executeAnalysis(base64, 'live');
      }
    } catch (err: any) {
      setError("BUFFER_ERROR: FRAME_CAPTURE_FAILED");
    }
  }, [isAnalyzing, previewImage, cameraActive]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setPreviewImage(result);
        stopCamera();
        const base64 = result.split(',')[1];
        await executeAnalysis(base64, 'upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-red-500';
    if (score <= 60) return 'text-yellow-500';
    if (score <= 85) return 'text-emerald-400';
    return 'text-emerald-500';
  };

  useEffect(() => {
    startCamera(0);
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] font-sans text-slate-400">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-600/95 backdrop-blur-md text-white text-[10px] font-mono py-2 px-10 text-center uppercase tracking-[0.2em] z-[100] animate-pulse flex items-center justify-center gap-4">
          <span className="font-bold">ERROR: {error}</span>
          <button onClick={() => startCamera(0)} className="px-3 py-1 bg-white text-black font-black hover:bg-slate-200 transition-all text-[9px]">
            RESET_CORE
          </button>
        </div>
      )}

      <header className="border-b border-white/5 bg-black px-4 md:px-10 py-6 md:py-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            <span className="text-white font-mono font-bold text-lg md:text-xl tracking-tighter relative z-10">L3.0</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-[0.2em] md:tracking-[0.4em] text-white uppercase flex items-center gap-3">
              Lumina OS <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[8px] border border-cyan-500/20 tracking-widest uppercase">Bio-Architect</span>
            </h1>
            <p className="text-[8px] md:text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em] mt-0.5">
              Reasoning Node: DXB_HACK_V1
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <section className="flex-1 flex flex-col p-4 md:p-8 gap-6 md:gap-8 overflow-y-auto custom-scroll h-full relative">
          
          <div className="relative min-h-[400px] md:min-h-[550px] bg-black border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] shrink-0 flex flex-col items-center justify-center">
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive && !previewImage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            />

            {previewImage && (
              <img src={previewImage} className="absolute inset-0 w-full h-full object-contain z-10 animate-in fade-in" alt="Environment" />
            )}

            {initializing && !cameraActive && !previewImage && (
              <div className="absolute inset-0 z-20 bg-[#030712] flex flex-col items-center justify-center gap-6">
                <div className="text-cyan-500 font-mono text-[11px] uppercase tracking-[0.8em] animate-pulse text-center">
                  BOOTING_BIO_SENSORS...
                </div>
              </div>
            )}

            {!initializing && !cameraActive && !previewImage && (
              <div className="absolute inset-0 z-20 bg-[#030712] flex flex-col items-center justify-center gap-8">
                <div className="text-red-500/50 font-mono text-[11px] uppercase tracking-[0.6em] text-center">
                  SENSOR_ARRAY_DESYNC
                </div>
                <button 
                  onClick={() => startCamera(0)}
                  className="px-10 py-4 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_30px_rgba(34,211,238,0.1)] active:scale-95"
                >
                  FORCE_SENSORS_ON
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
                <div className="w-full h-[2px] bg-cyan-400 shadow-[0_0_50px_#22d3ee] absolute top-0 animate-[scan_1.5s_ease-in-out_infinite]" />
                <div className="bg-black/80 px-10 py-8 border border-cyan-500/30 flex flex-col items-center gap-4">
                  <div className="text-cyan-400 font-mono text-[16px] md:text-[20px] uppercase tracking-[1em] font-black animate-pulse text-center pl-[1em]">BIO_REASONING</div>
                  <div className="text-[8px] text-cyan-800 font-mono uppercase tracking-widest font-black text-center">EVALUATING_SPECTRAL_FLUX_FOR_CIRCADIAN_SUPPORT</div>
                </div>
              </div>
            )}

            <div className="absolute top-6 left-6 z-40 font-mono text-[9px] md:text-[11px] text-cyan-400 flex flex-col gap-1.5 pointer-events-none drop-shadow-lg">
              <div className="flex gap-2 items-center">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-cyan-500 animate-pulse' : 'bg-red-600'}`} />
                <span className="tracking-[0.1em] font-black">SENSORS: {cameraActive ? 'ACTIVE' : 'OFFLINE'}</span>
              </div>
              <span className="opacity-50 text-[8px]">INPUT: {previewImage ? 'ASSET_UPLOAD' : 'LIVE_FEED'}</span>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-4 w-[90%] sm:w-auto z-40">
              <button 
                onClick={captureAndAnalyze} 
                className={`px-12 md:px-20 py-6 md:py-8 bg-cyan-500 text-black font-mono font-black text-xs md:text-sm uppercase tracking-[0.5em] md:tracking-[1em] hover:bg-cyan-300 transition-all shadow-[0_0_60px_rgba(34,211,238,0.3)] active:scale-95 transform border-none ${isAnalyzing ? 'opacity-30' : ''}`}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'SYNCHRONIZING' : 'BIO-ADAPTIVE AUDIT'}
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-8 md:px-12 py-6 bg-black/60 border border-white/10 text-white font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-center backdrop-blur-md font-bold"
              >
                UPLOAD_ASSET
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>

          {analysis ? (
            <div className="space-y-12 md:space-y-20 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <section className="bg-white/[0.02] border border-white/10 p-8 md:p-14 relative overflow-hidden group">
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                   <span className={`text-[8px] px-1.5 py-0.5 font-black uppercase tracking-widest border ${currentSource === 'live' ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600'}`}>
                     {currentSource}
                   </span>
                   {currentSource === 'live' && (
                     <span className="text-[10px] font-mono text-white/50 block uppercase tracking-[0.3em] font-black">Capture Time: {currentTimestamp}</span>
                   )}
                   {currentSource === 'upload' && (
                     <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest italic font-bold">Time not considered (image uploaded)</span>
                   )}
                </div>
                
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                  <span className="text-[160px] font-mono leading-none font-black tracking-tighter">SCN</span>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 mt-6">
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-10 group/tip relative">
                      <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-slate-500">Circadian Support Score</h2>
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[8px] cursor-help font-bold">?</div>
                      <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-[#0a0f1e] border border-white/10 text-[10px] leading-relaxed z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none font-medium shadow-2xl text-slate-300">
                        Score reflects how supportive this light environment is for healthy circadian rhythms. Educational estimate based on visible spectral patterns.
                      </div>
                    </div>
                    <div className="flex items-baseline gap-4 justify-center md:justify-start">
                      <span className={`text-8xl md:text-9xl font-mono font-black tracking-tighter ${getScoreColor(analysis.sleepScore.current)}`}>
                        {analysis.sleepScore.current}
                      </span>
                      <span className="text-slate-800 text-5xl font-mono">/100</span>
                    </div>
                    <p className="mt-8 text-lg text-slate-200 max-w-xl font-medium leading-relaxed italic border-l-2 border-cyan-500/20 pl-8">
                      {analysis.sleepScore.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-3 bg-white/5 p-12 border border-white/10 shadow-2xl backdrop-blur-2xl min-w-[280px]">
                    <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-widest mb-2 font-black">DELTA_POTENTIAL</span>
                    <span className="text-7xl font-mono text-white font-black">+{analysis.sleepScore.improvement}</span>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Target Score: {analysis.sleepScore.optimized}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-cyan-400 border-b border-cyan-500/20 pb-6 mb-12">
                  I. Environment Telemetry [Vision_Audit]
                </h3>
                <EnvironmentMetrics analysis={analysis} />
              </section>

              <section>
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-white border-b border-white/10 pb-6 mb-12">
                  II. Physiological Resonance Log
                </h3>
                <div className="bg-white/[0.01] border border-white/5 p-8 md:p-16 relative">
                   <div className="mb-14 p-6 bg-cyan-950/10 border-l-4 border-cyan-500 text-[11px] font-bold uppercase font-mono text-cyan-400 tracking-widest leading-relaxed">
                     DISCLAIMER: Analysis is based on visible light patterns. Educational estimate only.
                   </div>
                   <p className="text-slate-200 mb-16 text-2xl leading-relaxed italic font-light tracking-wide max-w-4xl">
                     "{analysis.bioLogicImpact.impactAssessment}"
                   </p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-20">
                      <div className="border-l border-white/10 pl-12">
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] mb-4 block font-black">Biologically Activating Flux</span>
                        <span className="text-4xl text-white font-mono font-black tracking-tighter">{analysis.bioLogicImpact.melatoninReductionRange}</span>
                      </div>
                      <div className="border-l border-white/10 pl-12">
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] mb-4 block font-black">Current SCN Phase</span>
                        <span className="text-4xl text-white font-mono font-black tracking-tighter uppercase">{analysis.circadianPhase}</span>
                      </div>
                   </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-white border-b border-white/10 pb-6 mb-12">
                  III. Circadian Optimization Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      {analysis.wellnessForecast.map((f, i) => (
                        <div key={i} className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/10 p-8 flex items-center transition-all cursor-default">
                           <span className="w-24 font-mono text-[11px] text-slate-600 shrink-0 border-r border-white/10 font-bold">{f.time}</span>
                           <div className="flex-1 px-10">
                             <span className="text-[14px] font-black text-white uppercase block mb-1 tracking-tight group-hover:text-cyan-400">{f.activity}</span>
                             <span className="text-[11px] text-slate-500 leading-relaxed block font-medium">{f.rationale}</span>
                           </div>
                           <div className={`text-[9px] font-black uppercase px-4 py-2 border ${
                             f.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                             f.status === 'Caution' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                           }`}>
                             {f.status}
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="bg-cyan-500/5 border border-cyan-500/10 p-16 flex flex-col justify-center relative overflow-hidden min-h-[450px]">
                     <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[150px] pointer-events-none" />
                     <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-[0.6em] block mb-12 font-black">DUBAI_ACTIVITY_VECTOR</span>
                     <h4 className="text-white font-black text-5xl mb-6 uppercase tracking-tighter leading-none">{analysis.activitySuggestion.location}</h4>
                     <p className="text-[12px] text-slate-500 font-mono mb-12 italic tracking-[0.2em]">{analysis.activitySuggestion.coordinates} // Window: {analysis.activitySuggestion.suggestedTime}</p>
                     <p className="text-xl leading-relaxed text-slate-200 font-light border-l-4 border-cyan-500/30 pl-10">{analysis.activitySuggestion.rationale}</p>
                   </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-cyan-400 border-b border-cyan-500/20 pb-6 mb-12">
                  IV. Matter v1.3 Conceptual Payload
                </h3>
                <div className="h-96 md:h-[650px] shadow-2xl border border-white/10">
                  <IoTConsole command={analysis.iotConcept.command} />
                </div>
              </section>

              <footer className="pt-40 pb-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.5em] font-black leading-loose max-w-4xl mx-auto px-10">
                  LUMINA OS v3.7 // BIO-ADAPTIVE ARCHITECTURE<br/>
                  Educational Content Only // Analysis is based on visible light patterns.<br/>
                  No Medical Claims // Grounding: Dubai GST
                </p>
              </footer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-20 text-center gap-12">
              <div className="w-40 h-40 border-2 border-white/5 flex items-center justify-center animate-pulse rounded-full relative">
                 <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin duration-[4000ms]" />
                <span className="text-5xl text-white font-mono italic font-black">?</span>
              </div>
              <div className="space-y-4">
                <span className="text-sm font-mono uppercase tracking-[1.5em] block text-white font-black pl-[1.5em]">SYSTEM_READY</span>
                <span className="text-[11px] text-slate-600 uppercase tracking-[0.5em] block font-bold">Awaiting environmental ingestion to synchronize rhythms</span>
              </div>
            </div>
          )}
        </section>

        <aside className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-white/10 bg-black p-10 md:p-16 flex flex-col gap-14 h-auto md:h-full shrink-0 shadow-[-30px_0_60px_rgba(0,0,0,0.7)]">
          <div className="flex justify-between items-center border-b border-white/5 pb-8">
            <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Audit_History</h3>
            <span className="text-[11px] font-mono text-slate-800 font-black tracking-widest">{history.length}/10_NODES</span>
          </div>
          <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto space-x-10 md:space-x-0 md:space-y-16 custom-scroll pb-12 md:pb-0 scroll-smooth">
            {history.length > 0 ? history.map((h, i) => (
              <div key={i} className="group cursor-pointer border-b border-white/5 pb-12 md:pb-16 min-w-[280px] md:min-w-0 transition-all hover:opacity-100 opacity-40 hover:pl-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 overflow-hidden shrink-0 relative group-hover:border-cyan-500 transition-colors duration-500">
                    <img src={h.imageUrl} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="Audit" />
                  </div>
                  <div className="overflow-hidden text-center md:text-left flex-1 space-y-3">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                       <span className={`text-[8px] px-1.5 py-0.5 font-black uppercase tracking-widest border ${h.source === 'live' ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600'}`}>
                         {h.source}
                       </span>
                       {h.source === 'live' && (
                         <span className="text-[10px] font-mono text-white block uppercase tracking-[0.3em] font-black">{h.timestamp}</span>
                       )}
                       {h.source === 'upload' && (
                         <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest italic font-bold">Time hidden (upload)</span>
                       )}
                    </div>
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                      <span className={`text-[14px] font-mono font-black ${getScoreColor(h.analysis.sleepScore.current)}`}>
                        {h.analysis.sleepScore.current}_INDEX
                      </span>
                      <span className="text-[10px] text-slate-700 font-mono font-black">>> {h.analysis.circadianPhase.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-40 flex flex-col items-center justify-center opacity-10">
                <p className="text-[12px] font-mono uppercase tracking-[1em] font-black">LOG_EMPTY</p>
                <div className="w-16 h-[1px] bg-white mt-6" />
              </div>
            )}
          </div>
        </aside>
      </main>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(800px); opacity: 0; }
        }
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
        
        @keyframes slide-in-bottom { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .slide-in-from-bottom-8 { animation: slide-in-bottom 1.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
};

export default App;
