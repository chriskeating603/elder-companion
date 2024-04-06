import React, { useState } from 'react';
import './App.css';
import rooseveltImage from './assets/images/fdr.png'; // Update the path accordingly

function App() {
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Function to start recording
  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        setRecorder(mediaRecorder);

        mediaRecorder.start();
        setIsRecording(true);

        mediaRecorder.onstop = () => {
          // Handle what happens when recording stops
          console.log("Recording stopped");
        };

        mediaRecorder.ondataavailable = async (e) => {
          const audioBlob = e.data;
          const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
          const formData = new FormData();
          formData.append('file', audioFile);

          // Replace 'http://localhost:5000' with your server's URL
          fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
          })
          .then(response => response.json())
          .then(data => {
            console.log('Success:', data);
            setTranscript(data.transcription); // Assuming you have a state to hold the transcription
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        };
      } catch (err) {
        console.error("Error accessing the microphone:", err);
      }
    } else {
      console.error("getUserMedia not supported on your browser!");
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setIsRecording(false);
    }
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
      <div>{transcript}</div>
    </div>
  );
}

export default App;