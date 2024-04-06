// require('dotenv').config();
require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { writeFile } = require('fs/promises');
const { OpenAI } = require('openai'); // Ensure this matches the import style of your SDK version

const app = express();
const upload = multer({ dest: 'uploads/' });

console.log(process.env.OPENAI_API_KEY); // This should print your API key

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

app.post('/transcribe', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Assuming teamName is somehow determined or provided. Adjust as necessary.
    const teamName = "exampleTeam";
    const transcriptionText = await transcribe(req.file.path, teamName);

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ transcription: transcriptionText });
  } catch (error) {
    console.error('Error with OpenAI transcription:', error);
    res.status(500).send('Error in transcription');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});