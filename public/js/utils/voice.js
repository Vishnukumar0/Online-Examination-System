/* ── Web Speech API: Text-to-Speech & Voice Command Controller ─── */
const VoiceAssistant = (() => {
  let synth = window.speechSynthesis;
  let recognition = null;
  let isListening = false;
  let isSpeaking = false;

  // Initialize Speech Recognition if supported
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  function speakText(text, onEnd) {
    if (!synth) return;
    synth.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => { isSpeaking = true; };
    utterance.onend = () => {
      isSpeaking = false;
      if (onEnd) onEnd();
    };
    utterance.onerror = () => { isSpeaking = false; };

    synth.speak(utterance);
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
    isSpeaking = false;
  }

  function readCurrentQuestion(qText, options = []) {
    let script = `${qText}. `;
    const letters = ['Option A', 'Option B', 'Option C', 'Option D'];
    options.forEach((opt, i) => {
      script += `${letters[i] || 'Option'}: ${opt}. `;
    });
    speakText(script);
  }

  function startVoiceCommands(onCommand) {
    if (!recognition) {
      showToast('Speech recognition is not supported in this browser.', 'warning');
      return;
    }

    try {
      recognition.onstart = () => {
        isListening = true;
        showToast('🎙️ Voice Listening: Say "Option A", "Next", or "Flag"', 'info');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Voice recognized:', transcript);

        if (transcript.includes('option a') || transcript === 'a' || transcript.includes('first')) {
          onCommand({ type: 'select', index: 0 });
        } else if (transcript.includes('option b') || transcript === 'b' || transcript.includes('second')) {
          onCommand({ type: 'select', index: 1 });
        } else if (transcript.includes('option c') || transcript === 'c' || transcript.includes('third')) {
          onCommand({ type: 'select', index: 2 });
        } else if (transcript.includes('option d') || transcript === 'd' || transcript.includes('fourth')) {
          onCommand({ type: 'select', index: 3 });
        } else if (transcript.includes('next') || transcript.includes('forward')) {
          onCommand({ type: 'next' });
        } else if (transcript.includes('previous') || transcript.includes('back')) {
          onCommand({ type: 'prev' });
        } else if (transcript.includes('flag') || transcript.includes('review')) {
          onCommand({ type: 'flag' });
        } else if (transcript.includes('submit')) {
          onCommand({ type: 'submit' });
        } else {
          showToast(`Heard: "${transcript}". Try saying "Option A" or "Next"`, 'info');
        }
      };

      recognition.onerror = () => { isListening = false; };
      recognition.onend = () => { isListening = false; };

      recognition.start();
    } catch {}
  }

  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
  }

  return { speakText, stopSpeaking, readCurrentQuestion, startVoiceCommands, stopListening, isSpeechSupported: Boolean(SpeechRec) };
})();
