class AudioManager {
  private volume: number = 0.7;
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  private music: HTMLAudioElement | null = null;

  constructor() {
    this.initSounds();
  }

  private initSounds() {
    const soundEffects = {
      shoot_pistol: this.generateShootSound(0.15, 100, 50),
      shoot_shotgun: this.generateShootSound(0.2, 80, 40),
      shoot_rifle: this.generateShootSound(0.1, 120, 60),
      hit: this.generateHitSound(),
      death: this.generateDeathSound(),
      pickup: this.generatePickupSound(),
      enemyShoot: this.generateEnemyShootSound(),
    };

    Object.entries(soundEffects).forEach(([key, audio]) => {
      this.sounds.set(key, [audio]);
    });
  }

  private generateShootSound(duration: number, freq1: number, freq2: number): HTMLAudioElement {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / audioContext.sampleRate;
      const freq = freq1 + (freq2 - freq1) * (t / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10);
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([this.bufferToWave(buffer, buffer.length)], { type: 'audio/wav' }));
    return audio;
  }

  private generateHitSound(): HTMLAudioElement {
    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1000);
    }
    
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([this.bufferToWave(buffer, buffer.length)], { type: 'audio/wav' }));
    return audio;
  }

  private generateDeathSound(): HTMLAudioElement {
    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / audioContext.sampleRate;
      data[i] = Math.sin(2 * Math.PI * (200 - t * 400) * t) * Math.exp(-t * 5);
    }
    
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([this.bufferToWave(buffer, buffer.length)], { type: 'audio/wav' }));
    return audio;
  }

  private generatePickupSound(): HTMLAudioElement {
    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / audioContext.sampleRate;
      data[i] = Math.sin(2 * Math.PI * (300 + t * 500) * t) * Math.exp(-t * 8);
    }
    
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([this.bufferToWave(buffer, buffer.length)], { type: 'audio/wav' }));
    return audio;
  }

  private generateEnemyShootSound(): HTMLAudioElement {
    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.12, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const t = i / audioContext.sampleRate;
      data[i] = Math.sin(2 * Math.PI * 90 * t) * Math.exp(-t * 12);
    }
    
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([this.bufferToWave(buffer, buffer.length)], { type: 'audio/wav' }));
    return audio;
  }

  private bufferToWave(buffer: AudioBuffer, len: number): ArrayBuffer {
    const numOfChan = buffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const out = new ArrayBuffer(length);
    const view = new DataView(out);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return out;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(soundName: string) {
    const soundArray = this.sounds.get(soundName);
    if (!soundArray || soundArray.length === 0) return;

    const audio = soundArray[0].cloneNode() as HTMLAudioElement;
    audio.volume = this.volume;
    audio.play().catch(() => {});
  }

  playMusic(loop: boolean = true) {
    if (this.music) {
      this.music.loop = loop;
      this.music.volume = this.volume * 0.3;
      this.music.play().catch(() => {});
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }
}

export const audioManager = new AudioManager();
