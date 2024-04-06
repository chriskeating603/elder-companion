import logo from './logo.svg';
import './App.css';
// Import the image if it's stored locally in your src folder
import rooseveltImage from './assets/images/fdr.png'; // Update the path accordingly

function App() {
  return (
    <div className="App">
      <h1 className="app-title">Have a Conversation with FDR</h1>
      <div className="element-wrapper">
        <button className="record-btn">Record</button>
      </div>
      <div className="element-wrapper">
        <button className="play-response-btn">Play Response</button>
      </div>
      <div className="element-wrapper">
        <img src={rooseveltImage} alt="Franklin D. Roosevelt" className="roosevelt-image"/>
        <p className="image-caption">Most beloved president of the Silent Generation, according to ChatGPT</p>
      </div>
    </div>
  );
}

export default App;