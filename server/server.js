// require('dotenv').config();
require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { writeFile } = require('fs/promises');
const { OpenAI } = require('openai'); // Ensure this matches the import style of your SDK version
const cors = require('cors'); // Added for CORS support

const app = express();
app.use(cors()); // Enable CORS for all routes
const upload = multer({ dest: 'uploads/' });



let conversationHistory = [];

// Transcription function adapted for use within the express route
async function transcribe(filePath, teamName) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // baseURL: "https://oai.hconeai.com/v1", // might need to fill these in
    // organization: process.env.OPENAI_ORG,
    defaultHeaders: {
      "Helicone-Auth": "Bearer " + process.env.OPENAI_API_KEY,
    },
  });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
  });

  const transcriptionFileName = `${teamName}_transcription.txt`;
  await writeFile(transcriptionFileName, transcription.text);

  return transcription.text;
}

// Function to send text to OpenAI's conversational API and maintain context
async function converseWithFDR(transcribedText) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Append the user's transcribed text to the conversation history
  conversationHistory.push({ role: "user", content: transcribedText });

  console.log("Sending prompt to OpenAI:", generatePrompt(conversationHistory)); // Added for debugging

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: generatePrompt(conversationHistory),
    temperature: 0.7,
    max_tokens: 150,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
  });
  console.log(response);
  // Append the model's response to the conversation history
  let modelResponse = response.choices[0].text.trim();

  // Check if the response already starts with "FDR:" to avoid repetition
  if (!modelResponse.startsWith("FDR:")) {
    modelResponse = "FDR: " + modelResponse;
  }

  conversationHistory.push({ role: "assistant", content: modelResponse });

  return modelResponse;
}

// Helper function to generate the prompt from the conversation history
function generatePrompt(history) {
  // Set up the initial context for the conversation if the history is empty
  let prompt = "You are Franklin D. Roosevelt (FDR), the 32nd President of the United States. Respond as if you are FDR.";
  
  // Append each entry in the conversation history to the prompt
  history.forEach(entry => {
    prompt += `\n${entry.role === 'user' ? 'Question:' : 'FDR:'} ${entry.content}`;
  });

  return prompt;
}

// app.post('/transcribe', upload.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   try {
//     const teamName = "exampleTeam";
//     const transcriptionText = await transcribe(req.file.path, teamName);

//     // Clean up the uploaded file
//     fs.unlinkSync(req.file.path);

//     // Send the transcribed text to OpenAI's conversational API
//     const modelResponse = await converseWithFDR(transcriptionText);

//     res.json({ transcription: transcriptionText, response: modelResponse });
//   } catch (error) {
//     console.error('Error with OpenAI transcription or conversation:', error);
//     res.status(500).send('Error in transcription or conversation');
//   }
// });

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.json()); // Place this before your routes to parse JSON bodies

// Endpoint for text transcription
app.post('/transcribe-text', express.json(), async (req, res) => {
  const { transcript } = req.body; // Get the transcript from the request body

  if (!transcript) {
    return res.status(400).send('No transcript provided.');
  }

  try {
    const modelResponse = await converseWithFDR(transcript);
    res.json({ transcription: transcript, response: modelResponse });
  } catch (error) {
    console.error('Error with OpenAI conversation:', error);
    res.status(500).send('Error in conversation');
  }
});

app.post('/clear-conversation', (req, res) => {
  // Reset the conversation history
  conversationHistory = [];
  // Respond to the request indicating success
  res.send({ message: 'Conversation history cleared.' });
});
