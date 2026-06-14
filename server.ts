import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Gemini SQL Help and Code Tutor
  app.post("/api/gemini/explain", async (req, res) => {
    try {
      const { prompt, sqlContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "O tutor de IA precisa de uma chave GEMINI_API_KEY configurada. Você pode configurá-la no painel de Segredos (Secrets) do AI Studio."
        });
      }

      // Lazy instantiation
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `Você é o "Tutor SQL Inteligente", um professor especialista em Bancos de Dados Relacionais e Linguagem SQL de nível universitário.
Você está ajudando estudantes a compreenderem os conceitos de bancos de dados relacionais, comandos SQL (como CREATE DATABASE, CREATE TABLE, chaves primárias, AUTO_INCREMENT, VARCHAR, NOT NULL) e manipulação de tabelas.

O estudante está interagindo com um Simulador SQL integrado de banco e tabelas (como ESCOLA e ALUNO).
Responda em PORTUGUÊS de forma extremamente didática, curta, objetiva, entusiasmada e profissional.
Sempre formate as respostas usando Markdown elegante com blocos de códigos formatados em SQL e tabelas explicativas se útil.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Mensagem ou dúvida do aluno: "${prompt}"\n\nEstado atual do Banco de Dados simulado do usuário para contexto:\n${JSON.stringify(sqlContext, null, 2)}`,
        config: {
          systemInstruction,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido ao chamar a API do Gemini." });
    }
  });

  // Vite middleware for development
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
