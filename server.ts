import express from "express";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Gzip/brotli-negotiated compression for all responses (static bundle + API)
app.use(compression());

// Default body limit for regular JSON requests; /api/ocr overrides this
// below with its own (smaller) limit so a large image upload can't block
// the single Node event loop for longer than necessary.
app.use(express.json({ limit: "1mb" }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API endpoint for OCR
// Uses its own (reduced) body limit instead of the global 1mb default, since
// this is the only route that needs to accept base64-encoded images.
app.post("/api/ocr", express.json({ limit: "6mb" }), async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem base64 fornecida." });
    }

    if (!ai) {
      // Return high-fidelity simulation if API key is not configured
      console.warn("GEMINI_API_KEY is not defined. Using simulation mode.");
      return res.json({
        simulation: true,
        data: {
          nomeBeneficiario: { valor: "CARLOS EDUARDO DA SILVA", confianca: "alta" },
          cpfCnpj: { valor: "123.456.789-00", confianca: "alta" },
          endereco: { valor: "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP", confianca: "media" },
          cep: { valor: "01310-100", confianca: "alta" },
          telefone: { valor: "(11) 98765-4321", confianca: "media" },
          tipoItem: { valor: "Cartão", confianca: "alta" },
          codigoRastreio: { valor: "MLTBR9876543210", confianca: "alta" }
        }
      });
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: base64Data,
      },
    };

    const promptText = `Execute um OCR ultra preciso na etiqueta de entrega/documento fornecida. Extraia os campos solicitados no esquema de resposta JSON.
Retorne SEMPRE os dados higienizados e formatados.
Exemplos de valores válidos para 'tipoItem': 'Cartão', 'Boleto', 'Carnê', 'Medicamento', 'Exame', 'Documento'.`;

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomeBeneficiario: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            cpfCnpj: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            endereco: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            cep: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            telefone: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            tipoItem: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING, description: "Cartão, Boleto, Carnê, Medicamento, Exame, or Documento" },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            },
            codigoRastreio: {
              type: Type.OBJECT,
              properties: {
                valor: { type: Type.STRING },
                confianca: { type: Type.STRING, description: "alta, media, or baixa" }
              },
              required: ["valor", "confianca"]
            }
          },
          required: [
            "nomeBeneficiario",
            "cpfCnpj",
            "endereco",
            "cep",
            "telefone",
            "tipoItem",
            "codigoRastreio"
          ]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Nenhum texto retornado pela API do Gemini.");
    }

    const parsedData = JSON.parse(jsonText.trim());
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erro no processamento de OCR:", error);
    res.status(500).json({ error: error.message || "Erro interno no servidor do Gemini." });
  }
});

// Serve frontend
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Vite fingerprints built asset filenames with a content hash, so it's
    // safe to let browsers cache them aggressively. index.html must NOT be
    // cached the same way (index: false) — it references those hashed
    // filenames, and caching it for a year would leave clients stuck on a
    // stale index.html pointing at chunks a new deploy has already removed.
    app.use(express.static(distPath, { maxAge: "1y", immutable: true, index: false }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] rodando em http://localhost:${PORT}`);
  });
}

bootstrap();
