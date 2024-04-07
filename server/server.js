require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const { OpenAI } = require('openai'); // Ensure this matches the import style of your SDK version
const cors = require('cors'); // Added for CORS support
const axios = require('axios');

const app = express();
app.use(cors()); // Enable CORS for all routes
// const upload = multer({ dest: 'uploads/' });

async function fetchImageForFigure(figureName) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY; // Replace with your Unsplash Access Key
  const url = `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(figureName)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    // Assuming you want the first image's URL
    const imageUrl = response.data.results[0]?.urls?.regular;
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return ''; // Return a default or empty string if the API call fails
  }
}


let conversationHistory = [];

// Transcription function adapted for use within the express route
// async function transcribe(filePath, teamName) {
//   const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//     // baseURL: "https://oai.hconeai.com/v1", // might need to fill these in
//     // organization: process.env.OPENAI_ORG,
//     defaultHeaders: {
//       "Helicone-Auth": "Bearer " + process.env.OPENAI_API_KEY,
//     },
//   });

//   const transcription = await openai.audio.transcriptions.create({
//     file: fs.createReadStream(filePath),
//     model: "whisper-1",
//   });

//   const transcriptionFileName = `${teamName}_transcription.txt`;
//   await writeFile(transcriptionFileName, transcription.text);

//   return transcription.text;
// }

// Function to send text to OpenAI's conversational API and maintain context
async function converseWithHistoricalFig(transcribedText, historicalFigure) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Append the user's transcribed text to the conversation history
  conversationHistory.push({ role: "user", content: transcribedText });

  console.log("Sending prompt to OpenAI:", generatePrompt(conversationHistory, historicalFigure)); // Added for debugging

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: generatePrompt(conversationHistory, historicalFigure),
    temperature: 0.7,
    max_tokens: 150,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
  });
  console.log(response);
  // Append the model's response to the conversation history
  let modelResponse = response.choices[0].text.trim();

  conversationHistory.push({ role: "assistant", content: modelResponse });

  return modelResponse;
}

// Helper function to generate the prompt from the conversation history
function generatePrompt(history, historicalFigure) {
  // Set up the initial context for the conversation if the history is empty
  let prompt = `You are ${historicalFigure}, the historical figure. Respond as if you are ${historicalFigure}.`;
  
  // Append each entry in the conversation history to the prompt
  history.forEach(entry => {
    prompt += `\n${entry.role === 'user' ? 'Question:' : historicalFigure + ':' } ${entry.content}`;
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
//     const modelResponse = await converseWithHistoricalFig(transcriptionText);

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
  const { transcript, figure } = req.body; // Extract figure from the request body

  if (!transcript || !figure) {
    return res.status(400).send('No transcript or historical figure provided.');
  }

  try {
    // Pass the figure to converseWithHistoricalFig
    const modelResponse = await converseWithHistoricalFig(transcript, figure);
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

// app.post('/get-figure-details', express.json(), async (req, res) => {
//   const { figureName } = req.body;
//   console.log("figure_name:", figureName);
//   if (!figureName) {
//     return res.status(400).send('No historical figure name provided.');
//   }

//   try {
//     // Generate a tagline using OpenAI's GPT
//     const tagline = await generateTaglineForFigure(figureName);
//     // For simplicity, we'll use a placeholder image URL. In a real application, you might integrate with an image search API.
//     const imageUrl = `https://example.com/image/${encodeURIComponent(figureName)}.jpg`;

//     res.json({ figureName, tagline, imageUrl });
//   } catch (error) {
//     console.error('Error fetching figure details:', error);
//     res.status(500).send('Error fetching figure details');
//   }
// });

app.post('/get-figure-details', express.json(), async (req, res) => {
  const { figureName } = req.body;

  if (!figureName) {
    return res.status(400).send('No historical figure name provided.');
  }

  try {
    // Generate a tagline using OpenAI's GPT
    const tagline = await generateTaglineForFigure(figureName);
    // Fetch an image URL for the figure
    const imageUrl = await fetchImageForFigure(figureName);

    res.json({ figureName, tagline, imageUrl });
  } catch (error) {
    console.error('Error fetching figure details:', error);
    res.status(500).send('Error fetching figure details');
  }
});

async function generateTaglineForFigure(figureName) {
  // Use OpenAI's GPT to generate a tagline for the historical figure
  // This is a simplified example. You'll need to implement the actual call to OpenAI's API.
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: `Generate a catchy tagline for ${figureName}, a historical figure.`,
    temperature: 0.7,
    max_tokens: 60,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
  });

  return response.choices[0].text.trim();
}