let audioCtx = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playClickSound = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Deeper, organic 'thock' sound for a dark mystery game
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch(e) {}
};

export const playRevealSound = (isWerewolf) => {
  try {
    const ctx = initAudio();
    
    if (isWerewolf) {
      // Dark surprise (Jumpscare / Dramatic hit)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      
      // Dissonant low notes
      osc1.frequency.setValueAtTime(100, ctx.currentTime);
      osc2.frequency.setValueAtTime(105, ctx.currentTime); // slight detune for horror effect
      
      osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);
      osc2.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 1.5);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      // Sharp attack
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      // Long decay
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(); osc2.start();
      osc1.stop(ctx.currentTime + 1.5); osc2.stop(ctx.currentTime + 1.5);
    } else {
      // Bright surprise ("Tada!" or magical reveal)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      
      // Quick slide up for "surprise"
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1); // hold
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
      
      // Second note for a "chord" feeling
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.start();
      osc2.stop(ctx.currentTime + 1.0);
    }
  } catch(e) {}
};

let currentBGMType = null;
let bgmAudioElements = {};

const initBGM = () => {
  if (Object.keys(bgmAudioElements).length === 0) {
    bgmAudioElements = {
      'menu': new Audio('/sounds/bgm-menu.mp3'),
      'game-siang': new Audio('/sounds/bgm-game-fase siang.mp3'),
      'game-malam': new Audio('/sounds/bgm-game-fase malam.mp3'),
      'victory_villager': new Audio('/sounds/bgm-vilagger.mp3'),
      'victory_werewolf': new Audio('/sounds/bgm-werewolf.mp3'),
    };
    Object.values(bgmAudioElements).forEach(audio => {
      audio.loop = true;
      audio.fadeInterval = null; // To track fade intervals
    });
  }
};

const crossfade = (oldAudio, newAudio, targetVol = 0.6) => {
  const fadeMs = 1500;
  const steps = 30;
  const stepTime = fadeMs / steps;
  
  if (oldAudio) {
    clearInterval(oldAudio.fadeInterval);
    const startVol = oldAudio.volume;
    const fadeOutStep = startVol / steps;
    let currentOut = 0;
    
    oldAudio.fadeInterval = setInterval(() => {
      currentOut++;
      let vol = startVol - (fadeOutStep * currentOut);
      if (vol <= 0.01 || currentOut >= steps) {
        clearInterval(oldAudio.fadeInterval);
        oldAudio.pause();
        oldAudio.volume = 0;
        oldAudio.currentTime = 0;
      } else {
        oldAudio.volume = vol;
      }
    }, stepTime);
  }
  
  if (newAudio) {
    clearInterval(newAudio.fadeInterval);
    newAudio.volume = 0;
    const playPromise = newAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        const fadeInStep = targetVol / steps;
        let currentIn = 0;
        
        newAudio.fadeInterval = setInterval(() => {
          currentIn++;
          let vol = fadeInStep * currentIn;
          if (vol >= targetVol || currentIn >= steps) {
            clearInterval(newAudio.fadeInterval);
            newAudio.volume = targetVol;
          } else {
            newAudio.volume = vol;
          }
        }, stepTime);
      }).catch(e => console.log("Audio play blocked", e));
    }
  }
};

export const playBGM = (type) => {
  try {
    if (currentBGMType === type) return; 
    
    initBGM();

    const oldAudio = currentBGMType ? bgmAudioElements[currentBGMType] : null;
    const newAudio = type === 'none' ? null : bgmAudioElements[type];
    
    currentBGMType = type;
    
    crossfade(oldAudio, newAudio, 0.6);
  } catch(e) {}
};

export const resumeBGM = () => {
  try {
    if (currentBGMType && bgmAudioElements[currentBGMType]) {
      const audio = bgmAudioElements[currentBGMType];
      if (audio.paused) {
        audio.play().catch(e => console.log("Still blocked", e));
      }
    }
  } catch(e) {}
};

export const playEliminationSound = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch(e) {}
};
