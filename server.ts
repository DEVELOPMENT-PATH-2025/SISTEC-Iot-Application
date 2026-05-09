import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";

// Initialize Firebase Client SDK for server-side
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const firebaseApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API 1: Save Temperature & Humidity (ESP8266)
  // Supporting both GET and POST as requested
  app.all("/api/sensor", async (req, res) => {
    try {
      const temp = req.method === 'GET' ? req.query.temp : req.body.temp;
      const hum = req.method === 'GET' ? req.query.hum : req.body.hum;

      if (!temp || !hum) {
        return res.status(400).send("Missing temp or hum parameters");
      }

      await addDoc(collection(db, "readings"), {
        temperature: parseFloat(temp as string),
        humidity: parseFloat(hum as string),
        timestamp: serverTimestamp(),
      });

      console.log(`Data saved: Temp ${temp}, Hum ${hum}`);
      res.status(200).send("Data Received and Saved");
    } catch (error) {
      console.error("Error saving sensor data:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // API 2: Fetch Text from lcd.txt
  app.get("/api/lcd", (req, res) => {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), "lcd.txt"), "utf8");
      res.send(content);
    } catch (error) {
      res.status(500).send("Error reading lcd.txt");
    }
  });

  // Internal API to update lcd.txt from dashboard
  app.post("/api/lcd", (req, res) => {
    try {
      const { text } = req.body;
      if (typeof text !== "string") return res.status(400).send("Invalid text");
      
      const limitedText = text.substring(0, 16);
      fs.writeFileSync(path.join(process.cwd(), "lcd.txt"), limitedText);
      res.send("LCD Updated");
    } catch (error) {
      res.status(500).send("Error writing lcd.txt");
    }
  });

  // Vite middleware
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
