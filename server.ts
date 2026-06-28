import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Initialize the Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI Captioning will use fallback generation.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json());

const PORT = 3000;

// API Route: Generate Auto Captions using Gemini
app.post("/api/generate-captions", async (req, res) => {
  const { title, artist, genre, duration = 180 } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Return mock creative captions as an intelligent fallback
    return res.json({
      success: true,
      provider: "fallback",
      captions: generateFallbackCaptions(title, artist || "Unknown", genre || "Ambient", duration)
    });
  }

  try {
    const prompt = `You are a professional music captioning assistant. 
Generate a beautifully formatted timeline of synchronized lyrical captions or descriptive scene logs for the song:
Title: "${title}"
Artist: "${artist || "Unknown Artist"}"
Genre: "${genre || "Instrumental / Synth"}"
Duration: ${duration} seconds

Create 8 to 15 chronological subtitles or scene captions spaced smoothly across the ${duration}-second duration (starting from 0 up to near the end).
Ensure the captions fit the emotional vibe of the song title, genre, and artist. 
For non-lyrical or electronic genres, describe the physical scene, instrument changes, beats, drops, or atmosphere (e.g., "[00:15] Synthesized bass sweeps in with a low rumble"). 
For lyrical songs, write beautiful and poetic lyrics matching the title.

Respond with strict JSON containing an array of captions under the key "captions", where each item has "time" (integer, current time in seconds) and "text" (string, the lyric or scene text).`;

    const responseSchema = {
      type: Type.OBJECT,
      required: ["captions"],
      properties: {
        captions: {
          type: Type.ARRAY,
          description: "The list of synchronized track captions and subtitles.",
          items: {
            type: Type.OBJECT,
            required: ["time", "text"],
            properties: {
              time: {
                type: Type.INTEGER,
                description: "The position in seconds when this caption should appear."
              },
              text: {
                type: Type.STRING,
                description: "The lyric or descriptive textual event occurring at this timestamp."
              }
            }
          }
        }
      }
    };

    // Robust model-switching & retry loop to handle 503/UNAVAILABLE or rate limits
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;
    let response: any = null;
    let usedModel = "gemini-3.5-flash";

    for (const model of modelsToTry) {
      usedModel = model;
      let delay = 300; // milliseconds
      let success = false;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          });
          success = true;
          break; // successfully retrieved response
        } catch (error: any) {
          lastError = error;
          console.warn(`Attempt ${attempt} with model ${model} failed:`, error.message || error);

          // Check if error is a transient error (503 Service Unavailable, 429 Too Many Requests, or containing UNAVAILABLE)
          const errStr = JSON.stringify(error).toLowerCase() + " " + String(error.message || "").toLowerCase();
          const isTransient = errStr.includes("503") || 
                              errStr.includes("unavailable") || 
                              errStr.includes("429") || 
                              errStr.includes("high demand") ||
                              error.status === 503 || 
                              error.status === 429;

          if (!isTransient) {
            // Non-transient error, break retries immediately to try next model or fallback
            break;
          }

          if (attempt < 3) {
            // Wait with exponential backoff before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2.5;
          }
        }
      }

      if (success && response) {
        break; // break outer model loop
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to generate captions across all available models and retries.");
    }

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    const data = JSON.parse(text);
    res.json({
      success: true,
      provider: "gemini",
      model: usedModel,
      captions: data.captions || []
    });

  } catch (error: any) {
    console.error("Gemini Captioning Error after retries:", error);
    // Provide automatic fallback on API error
    res.json({
      success: true,
      provider: "fallback-on-error",
      error: error.message,
      captions: generateFallbackCaptions(title, artist || "Unknown", genre || "Ambient", duration)
    });
  }
});

// Fallback Caption Generator
function generateFallbackCaptions(title: string, artist: string, genre: string, duration: number) {
  const captions = [];
  const steps = 10;
  const interval = duration / steps;

  const vibes = [
    `🎵 Dynamic opening notes ring out in "${title}"...`,
    `🥁 Rhythm section enters, establishing a pulse.`,
    `✨ Melodic synthesizer layers glide softly over the background.`,
    `🌟 Harmonic shift: The music builds in emotional resonance.`,
    `💥 Dynamic peak: Full ensemble playing with peak intensity!`,
    `🌌 Echoing echoes of reverb create a spacious cosmic wash.`,
    `🎹 Acoustic breakdown: Focus shifts to a delicate lead line.`,
    `🚀 Sub-bass drop! High-frequency elements spark around the soundstage.`,
    `🎶 Main theme returns in a final, glorious reprise.`,
    `🍂 Gentle fade-out... Residual vibrations trail off gracefully.`
  ];

  for (let i = 0; i < steps; i++) {
    const time = Math.min(Math.floor(i * interval), duration - 2);
    let text = vibes[i];

    if (i === 0) {
      text = `🎶 Introducing: "${title}" by ${artist} [${genre}]`;
    } else if (i === steps - 1) {
      text = `🔇 Track outro: Softly settling to silence. Thanks for listening!`;
    }

    captions.push({ time, text });
  }

  return captions;
}

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
