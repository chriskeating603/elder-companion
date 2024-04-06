import React, { useState, useEffect } from 'react';
import './App.css';
import rooseveltImage from './assets/images/fdr.png';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Check for browser compatibility
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Please try Chrome.');
      return;
    }
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      console.log('Recording started');
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setTranscript(text);
      console.log('Transcript:', text);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('Recording stopped');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.start();
  };

  const stopRecording = () => {
    // SpeechRecognition does not need to be stopped manually in this setup,
    // it stops automatically when it's done. However, you can implement any
    // cleanup or state updates you need here.
    setIsRecording(false);
    console.log('Stop recording manually if needed');
  };

  return (
    <div className="App">
      <h1 className="app-title">Have a Conversation with FDR</h1>
      <div className="element-wrapper">
        <button className="record-btn" onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? 'Stop Recording' : 'Record'}
        </button>
      </div>
      <div className="element-wrapper">
        <button className="play-response-btn">Play Response</button>
      </div>
      <div className="element-wrapper">
        <img src={rooseveltImage} alt="Franklin D. Roosevelt" className="roosevelt-image"/>
        <p className="image-caption">Most beloved president of the Silent Generation, according to ChatGPT</p>
      </div>
      <div className="transcript">
        <p>Transcript: {transcript}</p>
      </div>
    </div>
  );
}

export default App;