"use client";

let audioCtx: AudioContext | null = null;

export function playPaperSlap() {
  try {
    if (typeof window === "undefined") return;
    
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const duration = 0.12; // 120ms
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    // White noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter to make it sound like thick paper/cardboard
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);
    
    // Envelope
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
  } catch (err) {
    // silently ignore audio errors
  }
}
