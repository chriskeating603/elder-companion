import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios
import './App.css';
import rooseveltImage from './assets/images/fdr.png';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [fdrResponse, setFdrResponse] = useState(''); // State to store FDR's response

  useEffect(() => {
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
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setTranscript(text);
      sendTranscriptToServer(text); // Call the function with the text directly
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.start();
  };

  // Function to send the transcript to the server and receive a response
  const sendTranscriptToServer = async (transcriptText) => {
    try {
      const response = await axios.post('http://localhost:3001/transcribe-text', { transcript: transcriptText });
      setFdrResponse(response.data.response); // Assuming the server sends back an object with a 'response' field
      
    } catch (error) {
      console.error('Error sending transcript to server:', error);
    }
  };

  useEffect(() => {
    if (transcript) {
      sendTranscriptToServer(transcript);
    }
  }, [transcript]); // This effect runs when the transcript state updates

  return (
    <div className="App">
      <h1 className="app-title">Have a Conversation with FDR</h1>
      <div className="element-wrapper">
        <button className="record-btn" onClick={isRecording ? () => {} : startRecording}>
          {isRecording ? 'Recording...' : 'Record'}
        </button>
      </div>
      <div className="transcript">
        <p>Transcript: {transcript}</p>
      </div>
      <div className="response">
        <p>Response: {fdrResponse}</p>
      </div>
      <div className="element-wrapper">
        <img src={rooseveltImage} alt="Franklin D. Roosevelt" className="roosevelt-image"/>
        <p className="image-caption">Most beloved president of the Silent Generation, according to ChatGPT</p>
      </div>
    </div>
  );
}

export default App;