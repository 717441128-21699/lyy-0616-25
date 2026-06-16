let synth: SpeechSynthesis | null = null;

if (typeof window !== 'undefined') {
  synth = window.speechSynthesis;
}

export const speakWord = (word: string, lang: string = 'en-US'): void => {
  if (!synth) return;
  
  if (synth.speaking) {
    synth.cancel();
  }
  
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = lang;
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  const voices = synth.getVoices();
  const englishVoice = voices.find(
    v => v.lang.startsWith('en') && v.name.includes('English')
  ) || voices.find(v => v.lang.startsWith('en'));
  
  if (englishVoice) {
    utterance.voice = englishVoice;
  }
  
  synth.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (synth && synth.speaking) {
    synth.cancel();
  }
};
