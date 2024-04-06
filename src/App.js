import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import rooseveltImage from './assets/images/fdr.png';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [fdrResponse, setFdrResponse] = useState('');
  const speechSynthesisUtterance = useRef(null); // Ref to hold the speech synthesis utterance

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Please try Chrome.');
      return;
    }
  }, []);

  useEffect(() => {
    if (fdrResponse) {
      readFdrResponseAloud(fdrResponse);
    }
  }, [fdrResponse]);

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

    // Optionally, adjust the pitch and rate to try and deepen the voice
    utterance.pitch = 0.7; // Lower the pitch more
    utterance.rate = 0.8; // Slow down the rate a bit

    synth.speak(utterance);
  };

  const stopReadingAloud = () => {
    window.speechSynthesis.cancel();
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setTranscript(text);
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
    try {
      const response = await axios.post('http://localhost:3001/transcribe-text', { transcript: transcriptText });
      setFdrResponse(response.data.response);
    } catch (error) {
      console.error('Error sending transcript to server:', error);
    }
  };

  return (
    <div className="App">
      <h1 className="app-title">Have a Conversation with FDR</h1>
      <div className="element-wrapper">
        <button className="record-btn" onClick={isRecording ? () => {} : startRecording}>
          {isRecording ? 'Stop Recording and Get Response From FDR' : 'Record'}
        </button>
      </div>
      <div className="transcript">
        <p>Me: {transcript}</p>
      </div>
      <div className="response">
        <p>{fdrResponse}</p>
      </div>
      {/* Add a button to stop the speech synthesis */}
      <button className="record-btn" onClick={stopReadingAloud}>
          Stop Speech
        </button>
      <div className="element-wrapper">
        <img src={rooseveltImage} alt="Franklin D. Roosevelt" className="roosevelt-image"/>
        <p className="image-caption">Most beloved president of the Silent Generation, according to ChatGPT</p>
      </div>
    </div>
  );
}

export default App;