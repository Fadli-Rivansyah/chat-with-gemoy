import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';    
const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json()); 
const GEMINI_MODEL = 'gemini-2.5-flash';
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if(!Array.isArray(conversation)) throw new Error("Message must be an array");

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{text}]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemIntruction: "jawab dalam bahasa indonesia",
            },
        });
        res.status(200).json({ result: response.text });
    } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: error.message});
    }
});