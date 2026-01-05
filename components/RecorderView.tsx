
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
      const barWidth = (canvas.width / bufferLength) * 0.7;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const opacity = 0.3 + (dataArray[i] / 255) * 0.7;
        ctx.fillStyle = isRecording ? `rgba(99, 102, 241, ${opacity})` : 'rgba(203, 213, 225, 0.2)';
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth, Math.max(3, barHeight), 4);
        ctx.fill();
        x += barWidth + 5;
      }
    };
    draw();
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/mp4') 
            ? 'audio/mp4' 
            : 'audio/aac';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const finalMime = mediaRecorder.mimeType;
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
          
          if (audioBlob.size < 1000) {
            cleanupAudio();
            return;
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onStop(base64Audio, finalMime);
            cleanupAudio();
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        startTimer();
        startVisualizer(stream);
      } catch (err) {
        alert("Microphone access is required.");
      }
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
    <div className="flex flex-col items-center w-full select-none">
      <div className="w-full h-12 mb-10 flex items-center justify-center px-8">
        <canvas ref={canvasRef} className="w-full h-full max-w-[200px]" width={200} height={48} />
      </div>

      <button 
        onClick={toggleRecording}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 relative group ${
          isRecording 
            ? 'bg-rose-500 scale-105 shadow-[0_20px_60px_rgba(244,63,94,0.4)]' 
            : 'bg-indigo-600 shadow-[0_20px_60px_rgba(79,70,229,0.3)]'
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
        {isRecording && (
          <div className="absolute inset-[-8px] rounded-full border-2 border-rose-500/20 animate-ping" />
        )}
        <div className="flex items-center justify-center text-white relative z-10 transition-transform group-active:scale-90">
          {isRecording ? (
             <div className="w-7 h-7 bg-white rounded-md shadow-lg" />
          ) : (
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 10v2a7 7 0 01-14 0v-2m7 9v4m-4 0h8" />
             </svg>
          )}
        </div>
      </button>

      <div className="mt-12 text-center h-20">
        {isRecording ? (
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{formatTime(timer)}</p>
            <p className="label-caps text-rose-500 text-[9px] animate-pulse">Capturing active context</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-lg font-black text-slate-900 tracking-tight">Intelligence Node</p>
            <p className="text-[10px] font-bold text-slate-400 max-w-[160px] mx-auto opacity-70 uppercase tracking-widest">Initialize capture</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecorderView;
