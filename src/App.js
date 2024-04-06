import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import rooseveltImage from './assets/images/fdr.png';
import logoImage from './assets/images/logo.png'; // Add this line

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]); // Updated state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const speechSynthesisUtterance = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Please try Chrome.');
      return;
    }
  }, []);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastResponse = conversationHistory[conversationHistory.length - 1].content;
      readFdrResponseAloud(lastResponse);
    }
  }, [conversationHistory]);

  const readFdrResponseAloud = (text) => {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    // Find the 'Alex' voice in the list of voices
    const alexVoice = voices.find(voice => voice.name === 'Aaron');

    const utterance = new SpeechSynthesisUtterance(text);
    if (alexVoice) {
      utterance.voice = alexVoice;
    } else {
      console.log("Aaron voice not found, using default voice.");
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    // Optionally, adjust the pitch and rate to try and deepen the voice
    utterance.pitch = 0.9; // Lower the pitch more
    utterance.rate = 0.8; // Slow down the rate a bit

    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const stopReadingAloud = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setConversationStarted(true); // Set conversation as started
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      sendTranscriptToServer(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.start();
  };

  const sendTranscriptToServer = async (transcriptText) => {
    // Basic capitalization and punctuation correction
    const correctedText = transcriptText
      .trim()
      .replace(/^\w/, c => c.toUpperCase()) // Capitalize the first letter
      .replace(/([^.])$/, "$1."); // Ensure it ends with a period

    try {
      const response = await axios.post('http://localhost:3001/transcribe-text', { transcript: correctedText });
      // Update conversation history with both user's question and FDR's response
      setConversationHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', content: correctedText },
        { role: 'fdr', content: response.data.response }
      ]);
    } catch (error) {
      console.error('Error sending transcript to server:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logoImage} alt="Logo" className="app-logo"/>
        <div className="title-container">
          <h1 className="app-title">Have a Conversation with FDR</h1>
        </div>
      </header>
      <div className="element-wrapper">
        <button className="record-btn" onClick={isRecording ? () => {} : startRecording}>
          {isRecording ? 'Stop Recording and Get Response From FDR' : 'Ask FDR a Question'}
        </button>
      </div>
      <div className="conversation-history">
        {conversationHistory.map((entry, index) => (
          <div key={index} className={`conversation-entry ${entry.role}`}>
            <p>{entry.role === 'user' ? 'Me: ' : ''}{entry.content}</p>
          </div>
        ))}
      </div>
      {isSpeaking && (
        <button className="record-btn" onClick={stopReadingAloud}>
          Stop Speech
        </button>
      )}
      <div className="element-wrapper">
        <img src={rooseveltImage} alt="Franklin D. Roosevelt" className={`roosevelt-image ${isSpeaking ? 'speaking' : ''}`}/>
        <p className="image-caption">Most beloved president of the Silent Generation, according to ChatGPT</p>
      </div>
    </div>
  );
}

export default App;