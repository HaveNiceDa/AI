import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import { RagService } from "./rag";
import { KnowledgeBaseService } from "./knowledgeBase";
import { config } from "./config";
import { getHistory } from "./chatHistory";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const ragService = new RagService();
const knowledgeBaseService = new KnowledgeBaseService();

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = req.file.buffer.toString("utf-8");
    const filename = req.file.originalname;

    const result = await knowledgeBaseService.uploadByStr(text, filename);

    res.json({ success: true, message: result });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { input, sessionId } = req.body;

    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    const sessionConfig = {
      configurable: {
        sessionId: sessionId || config.sessionConfig.configurable.sessionId,
      },
    };

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await ragService.stream(input, sessionConfig);

    for await (const chunk of stream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res
      .status(500)
      .json({ error: "Chat failed", details: (error as Error).message });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "No sessionId provided" });
    }

    const history = getHistory(sessionId as string);
    const messages = await history.getMessages();

    const formattedMessages = messages.map((msg) => ({
      role: msg._getType() === "human" ? "user" : "assistant",
      content: msg.content as string,
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
