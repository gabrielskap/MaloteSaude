import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase limit to allow base64 images
app.use(express.json({ limit: "15mb" }));

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
app.post("/api/ocr", async (req, res) => {
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] rodando em http://localhost:${PORT}`);
  });
}

bootstrap();
