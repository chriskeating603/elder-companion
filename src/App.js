import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import rooseveltImage from './assets/images/fdr.png';
import logoImage from './assets/images/logo.png';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [historicalFigure, setHistoricalFigure] = useState('FDR');
  const [figureDetails, setFigureDetails] = useState({ imageUrl: '', tagline: '' });

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Please try Chrome.');
      return;
    }
  }, []);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastResponse = conversationHistory[conversationHistory.length - 1].content;
      readHistoricalFigureResponseAloud(lastResponse);
    }
  }, [conversationHistory]);

  useEffect(() => {
    setHistoricalFigure('FDR');
  }, []);

  const updateHistoricalFigure = async (event) => {
    event.preventDefault(); // Prevent the form from submitting in the traditional way
    const figureName = event.target.figureName.value; // Assuming your input has a name attribute of 'figureName'
    
    // Update the historical figure name at the top of the screen immediately
    const formattedName = formatName(figureName);
    setHistoricalFigure(formattedName);

    // Clear local conversation history
    setConversationHistory([]);

    // Send a request to the server to clear the server-side conversation history
    try {
      await axios.post('https://elder-comp-server-8e643edb1bd8.herokuapp.com/clear-conversation');
      // Fetch image URL and tagline for the new figure
      const response = await axios.post('https://elder-comp-server-8e643edb1bd8.herokuapp.com/get-figure-details', { figureName: formattedName });
      console.log("figure_details:", response);
      setFigureDetails({ imageUrl: response.data.imageUrl, tagline: response.data.tagline });
    } catch (error) {
      console.error('Error clearing conversation on server:', error);
    }
  };

  const readHistoricalFigureResponseAloud = (text) => {
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
      const response = await axios.post('https://elder-comp-server-8e643edb1bd8.herokuapp.com/transcribe-text', { transcript: correctedText, figure: historicalFigure });
      // Update conversation history with both user's question and historicalFigure's response
      setConversationHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', content: correctedText },
        { role: 'historicalFigure', content: response.data.response }
      ]);
    } catch (error) {
      console.error('Error sending transcript to server:', error);
    }
  };

  const clearConversation = async () => {
    try {
      // Send a request to the server to clear the conversation history
      await axios.post('https://elder-comp-server-8e643edb1bd8.herokuapp.com/clear-conversation');
      // Reset the local conversation history state
      setConversationHistory([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  function formatName(name) {
    return name
      .split(/\s+|-/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\s+(-)\s+/g, '$1');
  }

  const handleInteraction = (event) => {
    event.preventDefault(); // Prevent the browser from handling the touch event as a click.
    
    // Logic to determine if this is a start or stop recording action
    if (!isRecording) {
      startRecording();
    } else {
      stopReadingAloud();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logoImage} alt="Logo" className="app-logo"/>
        <div className="title-container">
          <h1 className="app-title">Have a Conversation with {formatName(historicalFigure)}</h1>
        </div>
      </header>
        <div className="">
          <form onSubmit={updateHistoricalFigure}>
            <button type="submit">Start New Conversation with:</button>
            <input type="text" name="figureName" placeholder="Historical Figure Name" />
          </form>
        </div>
      <div className="element-wrapper">
        <button className="record-btn" onClick={handleInteraction} onTouchEnd={handleInteraction}>
          {isRecording ? `Stop Recording and Get Response From ${formatName(historicalFigure)}` : `Ask ${formatName(historicalFigure)} a Question`}
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
        <img src={figureDetails.imageUrl || rooseveltImage} alt="Franklin D. Roosevelt" className={`roosevelt-image ${isSpeaking ? 'speaking' : ''}`}/>
        <p className="image-caption">{figureDetails.tagline || "Most beloved president of the Silent Generation, according to ChatGPT"}</p>
      </div>
    </div>
  );
}

export default App;