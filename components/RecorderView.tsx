
import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';

interface RecorderViewProps {
  onStop: (audioBase64: string, mimeType: string) => void;
  state: AppState;
}

const RecorderView: React.FC<RecorderViewProps> = ({ onStop, state }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    audioContextRef.current = null;
  };

  const startVisualizer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 64; 
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!audioContextRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const barSpacing = 8;
      const barWidth = 4;
      const centerX = width / 2;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255.0;
        const barHeight = Math.max(4, v * height * 0.9);
        const opacity = 0.1 + (v * 0.9);
        
        ctx.fillStyle = isRecording ? `rgba(99, 102, 241, ${opacity})` : 'rgba(203, 213, 225, 0.2)';
        
        ctx.beginPath();
        ctx.roundRect(centerX + (i * (barWidth + barSpacing)), (height - barHeight) / 2, barWidth, barHeight, 10);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(centerX - (i * (barWidth + barSpacing)) - barWidth, (height - barHeight) / 2, barWidth, barHeight, 10);
        ctx.fill();
      }
    };
    draw();
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' 
                      : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' 
                      : 'audio/aac';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          // Ensure we have at least 1 second of audio
          if (audioBlob.size < 100) { cleanupAudio(); return; }
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onStop(base64Audio, mediaRecorder.mimeType);
            cleanupAudio();
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        startTimer();
        startVisualizer(stream);
      } catch (err) { alert("Microphone access required for Intelligence synthesis."); }
    } else {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        stopTimer();
      }
    }
  };

  const startTimer = () => {
    setTimer(0);
    timerIntervalRef.current = window.setInterval(() => setTimer(p => p + 1), 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none space-y-12">
      <div className={`px-6 py-2 rounded-full border flex items-center gap-3 transition-all duration-1000 ${
        isRecording ? 'bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-slate-300'}`} />
        <span className="label-caps text-[10px] text-slate-500 tracking-[0.25em] font-black uppercase">
          {isRecording ? 'SECURE CONTEXT CAPTURE' : 'IDLE INTELLIGENCE NODE'}
        </span>
      </div>

      <div className="w-full h-28 flex items-center justify-center px-4 overflow-visible">
        <canvas ref={canvasRef} className="w-full h-full" width={400} height={120} />
      </div>

      <div className="relative group">
        <div className={`absolute inset-[-30px] rounded-full border border-indigo-500/10 transition-all duration-1000 ${
          isRecording ? 'scale-110 opacity-100 animate-[spin_12s_linear_infinite]' : 'scale-90 opacity-0'
        }`} />
        <div className={`absolute inset-[-15px] rounded-full border border-indigo-500/20 transition-all duration-700 ${
          isRecording ? 'scale-105 opacity-100 animate-[spin_18s_linear_infinite_reverse]' : 'scale-95 opacity-0'
        }`} />

        <button 
          onClick={toggleRecording}
          className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 ${
            isRecording 
              ? 'bg-rose-500 scale-105 shadow-[0_40px_100px_rgba(244,63,94,0.3)]' 
              : 'bg-white shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-slate-100 active:scale-95'
          }`}
        >
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          
          <div className={`flex flex-col items-center justify-center transition-all duration-500 ${isRecording ? 'text-white' : 'text-indigo-600'}`}>
            {isRecording ? (
               <div className="w-10 h-10 bg-white rounded-2xl shadow-inner animate-[pulse_2s_infinite]" />
            ) : (
               <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 10v2a7 7 0 01-14 0v-2m7 9v4m-4 0h8" />
               </svg>
            )}
          </div>
        </button>
      </div>

      <div className="text-center h-28 space-y-4">
        {isRecording ? (
          <div className="animate-liquid-reveal space-y-4">
            <p className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums font-mono drop-shadow-sm">{formatTime(timer)}</p>
            <div className="flex flex-col items-center gap-2">
              <span className="label-caps text-rose-500 text-[9px] animate-pulse font-black tracking-[0.3em]">SYNTHESIZING ACOUSTICS</span>
              <span className="text-[10px] font-bold text-slate-400 opacity-60 uppercase tracking-[0.1em]">Multi-speaker separation active</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 opacity-90">
            <p className="text-2xl font-black text-slate-900 tracking-tight">Capture Intelligence</p>
            <p className="text-[11px] font-bold text-slate-400 max-w-[220px] mx-auto opacity-70 uppercase tracking-[0.2em] leading-relaxed">
              Touch to initialize session synthesis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecorderView;
