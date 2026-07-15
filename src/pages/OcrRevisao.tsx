import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMalote } from "../context/MaloteContext";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  Sparkles,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
  CreditCard,
  FileSpreadsheet,
  BookOpen
} from "lucide-react";
import { Entrega, StatusEntrega, Prioridade } from "../types";

// Canvas Generator Helper to render high-fidelity mock label documents on client
function generateLabelBase64(
  nome: string,
  cpf: string,
  endereco: string,
  cep: string,
  telefone: string,
  rastreio: string,
  tipoItem: string
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 600, 750);

  // High Contrast Border Outer
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 730);

  // Inner Border Accent
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 1;
  ctx.strokeRect(15, 15, 570, 720);

  // Header Banner (Navy slate background)
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(16, 16, 568, 80);
  
  ctx.fillStyle = "#38BDF8";
  ctx.font = "bold 20px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MALOTE SAÚDE - LOGÍSTICA EXPRESS", 300, 50);
  
  ctx.fillStyle = "#94A3B8";
  ctx.font = "semibold 12px 'JetBrains Mono', monospace";
  ctx.fillText("OPERADORA DE LOGÍSTICA HOSPITALAR CREDENCIADA", 300, 75);

  // Draw Barcode lines
  ctx.fillStyle = "#000000";
  const barcodeY = 115;
  const barcodeHeight = 80;
  let currentX = 80;
  
  // Custom deterministic line drawing for unique barcode
  for (let i = 0; i < 65; i++) {
    const width = (i % 5 === 0) ? 5 : (i % 3 === 0) ? 3 : 1;
    const gap = (i % 4 === 0) ? 4 : 2;
    if (currentX + width < 520) {
      ctx.fillRect(currentX, barcodeY, width, barcodeHeight);
      currentX += width + gap;
    }
  }
  
  // Barcode text below code
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(rastreio, 300, 215);

  // Separator 1
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, 230);
  ctx.lineTo(584, 230);
  ctx.stroke();

  // Category Banner Row
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(16, 231, 568, 45);
  
  ctx.fillStyle = "#0F6E6E";
  ctx.font = "bold 13px 'Space Grotesk', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`CONTEÚDO DO ENVELOPE: ${tipoItem.toUpperCase()}`, 35, 258);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("ETIQUETA OCR-A VERIFICÁVEL", 565, 258);

  // Separator 2
  ctx.beginPath();
  ctx.moveTo(16, 276);
  ctx.lineTo(584, 276);
  ctx.stroke();

  // Data section fields
  ctx.textAlign = "left";

  // Label 1: Beneficiário
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("1. NOME COMPLETO DO BENEFICIÁRIO (CONTRATANTE)", 35, 305);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 17px 'Inter', sans-serif";
  ctx.fillText(nome.toUpperCase(), 35, 330);

  // Label 2: CPF
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("2. CADASTRO DE PESSOAS FÍSICAS (CPF)", 35, 380);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 15px 'Inter', sans-serif";
  ctx.fillText(cpf, 35, 402);

  // Label 3: Endereço completo
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("3. ENDEREÇO DE DESTINO PARA ENTREGA", 35, 450);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px 'Inter', sans-serif";
  
  // Wrap address text if it is too wide
  const words = endereco.split(" ");
  let line = "";
  let y = 472;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 520 && n > 0) {
      ctx.fillText(line, 35, y);
      line = words[n] + " ";
      y += 20;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 35, y);

  // Label 4 & 5: CEP & Telefone side by side
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("4. CÓDIGO POSTAL (CEP)", 35, y + 35);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.fillText(cep, 35, y + 55);

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("5. TELEFONE DE CONTATO", 320, y + 35);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.fillText(telefone, 320, y + 55);

  // Label 6 & 7: Categoria & Chave de Rastreio side by side
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("6. TIPO DE DOCUMENTO", 35, y + 90);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.fillText(tipoItem, 35, y + 110);

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 10px 'Space Grotesk', sans-serif";
  ctx.fillText("7. CÓDIGO DE RASTREIO LOGÍSTICO", 320, y + 90);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText(rastreio, 320, y + 110);

  // Footer Seal bar
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(16, 680, 568, 54);
  
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 680);
  ctx.lineTo(584, 680);
  ctx.stroke();

  ctx.fillStyle = "#64748B";
  ctx.font = "semibold 9px 'JetBrains Mono', monospace";
  ctx.fillText("CONFIDENTIAL MEDICAL LOGISTICS - ANVISA ANV-45920-SP", 35, 712);
  
  ctx.fillStyle = "#10B981";
  ctx.font = "bold 11px 'Space Grotesk', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("● CONEXÃO SEGURA OCR", 565, 712);

  return canvas.toDataURL("image/png");
}

// Three high-fidelity mock label documents to select from
interface MockDocument {
  id: string;
  name: string;
  cpf: string;
  address: string;
  cep: string;
  phone: string;
  tracking: string;
  type: "Cartão" | "Boleto" | "Carnê" | "Medicamento" | "Exame" | "Documento";
  description: string;
}

const mockLabels: MockDocument[] = [
  {
    id: "label-1",
    name: "Carlos Eduardo da Silva",
    cpf: "123.456.789-00",
    address: "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP",
    cep: "01310-100",
    phone: "(11) 98765-4321",
    tracking: "MLTBR9876543210",
    type: "Cartão",
    description: "Cartão de beneficiário - Unimed Saúde"
  },
  {
    id: "label-2",
    name: "Ana Beatriz de Souza",
    cpf: "987.654.321-99",
    address: "Rua dos Pinheiros, 450 - Pinheiros, São Paulo - SP",
    cep: "05422-000",
    phone: "(11) 99123-4567",
    tracking: "MLTBR4561237890",
    type: "Boleto",
    description: "Boleto de cobrança de mensalidade"
  },
  {
    id: "label-3",
    name: "Roberto Mendes Costa",
    cpf: "456.789.123-44",
    address: "Avenida Atlântica, 2500 - Copacabana, Rio de Janeiro - RJ",
    cep: "22070-011",
    phone: "(21) 97543-2109",
    tracking: "MLTBR1122334455",
    type: "Exame",
    description: "Guia médica de exame de imagem"
  }
];

export default function OcrRevisao() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useMalote();

  // Batch progress tracked dynamically in state
  const [reviewedCount, setReviewedCount] = useState(5);
  const totalBatchCount = 12;

  // Active scanned document state
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeMime, setActiveMime] = useState<string>("image/png");
  const [selectedMockId, setSelectedMockId] = useState<string | null>(null);

  // Form Fields State
  const [formFields, setFormFields] = useState({
    nomeBeneficiario: "",
    cpfCnpj: "",
    endereco: "",
    cep: "",
    telefone: "",
    tipoItem: "Cartão" as 'Cartão' | 'Boleto' | 'Carnê' | 'Medicamento' | 'Exame' | 'Documento',
    codigoRastreio: "",
    observacoes: ""
  });

  // Confidence badges state
  const [confidence, setConfidence] = useState({
    nomeBeneficiario: "",
    cpfCnpj: "",
    endereco: "",
    cep: "",
    telefone: "",
    tipoItem: "",
    codigoRastreio: ""
  });

  // UI Interactive States
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isSuccessBatch, setIsSuccessBatch] = useState(false);

  // Load the first mock label initially to give an outstanding out-of-the-box user experience
  useEffect(() => {
    loadMockLabel(mockLabels[0]);
  }, []);

  // Pre-fill fields for demo step 3
  useEffect(() => {
    if (state.demoState?.ocrRevisaoStep) {
      setFormFields({
        nomeBeneficiario: "Carlos Eduardo da Silva",
        cpfCnpj: "123.456.789-00",
        endereco: "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP",
        cep: "01310-100",
        telefone: "(11) 98765-4321",
        tipoItem: "Cartão",
        codigoRastreio: "MLTBR9876543210",
        observacoes: ""
      });
      setConfidence({
        nomeBeneficiario: "alta",
        cpfCnpj: "alta",
        endereco: "baixa",
        cep: "alta",
        telefone: "alta",
        tipoItem: "alta",
        codigoRastreio: "alta"
      });
    }
  }, [state.demoState?.ocrRevisaoStep]);

  const loadMockLabel = (doc: MockDocument) => {
    setSelectedMockId(doc.id);
    setErrorBanner(null);
    const dataUrl = generateLabelBase64(
      doc.name,
      doc.cpf,
      doc.address,
      doc.cep,
      doc.phone,
      doc.tracking,
      doc.type
    );
    setActiveImage(dataUrl);
    setActiveMime("image/png");
    
    // Clear the form fields first to indicate ready for analysis
    setFormFields({
      nomeBeneficiario: "",
      cpfCnpj: "",
      endereco: "",
      cep: "",
      telefone: "",
      tipoItem: "Cartão",
      codigoRastreio: "",
      observacoes: ""
    });
    setConfidence({
      nomeBeneficiario: "",
      cpfCnpj: "",
      endereco: "",
      cep: "",
      telefone: "",
      tipoItem: "",
      codigoRastreio: ""
    });
  };

  // Drag and Drop File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorBanner(null);
    setSelectedMockId(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setActiveImage(reader.result);
        setActiveMime(file.type);
        // Clear previous OCR forms
        setFormFields({
          nomeBeneficiario: "",
          cpfCnpj: "",
          endereco: "",
          cep: "",
          telefone: "",
          tipoItem: "Cartão",
          codigoRastreio: "",
          observacoes: ""
        });
        setConfidence({
          nomeBeneficiario: "",
          cpfCnpj: "",
          endereco: "",
          cep: "",
          telefone: "",
          tipoItem: "",
          codigoRastreio: ""
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear Form Fields
  const handleClearFields = () => {
    setFormFields({
      nomeBeneficiario: "",
      cpfCnpj: "",
      endereco: "",
      cep: "",
      telefone: "",
      tipoItem: "Cartão",
      codigoRastreio: "",
      observacoes: ""
    });
    setConfidence({
      nomeBeneficiario: "",
      cpfCnpj: "",
      endereco: "",
      cep: "",
      telefone: "",
      tipoItem: "",
      codigoRastreio: ""
    });
  };

  // Call the real backend endpoint to perform Gemini OCR
  const handleAnalyzeOCR = async () => {
    if (!activeImage) {
      setErrorBanner("Por favor, carregue uma etiqueta ou selecione um modelo de teste.");
      return;
    }

    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64: activeImage,
          mimeType: activeMime
        })
      });

      if (!response.ok) {
        throw new Error(`Servidor retornou erro ${response.status}`);
      }

      const resJson = await response.json();
      
      if (resJson.error) {
        throw new Error(resJson.error);
      }

      const ocrData = resJson.data;

      setFormFields({
        nomeBeneficiario: ocrData.nomeBeneficiario?.valor || "",
        cpfCnpj: ocrData.cpfCnpj?.valor || "",
        endereco: ocrData.endereco?.valor || "",
        cep: ocrData.cep?.valor || "",
        telefone: ocrData.telefone?.valor || "",
        tipoItem: (ocrData.tipoItem?.valor as any) || "Cartão",
        codigoRastreio: ocrData.codigoRastreio?.valor || "",
        observacoes: ""
      });

      setConfidence({
        nomeBeneficiario: ocrData.nomeBeneficiario?.confianca || "alta",
        cpfCnpj: ocrData.cpfCnpj?.confianca || "alta",
        endereco: ocrData.endereco?.confianca || "alta",
        cep: ocrData.cep?.confianca || "alta",
        telefone: ocrData.telefone?.confianca || "alta",
        tipoItem: ocrData.tipoItem?.confianca || "alta",
        codigoRastreio: ocrData.codigoRastreio?.confianca || "alta"
      });

    } catch (err: any) {
      console.error(err);
      setErrorBanner(err.message || "Erro de conexão ao processar o documento com o Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save the delivery and advance in batch
  const handleSaveAndContinue = () => {
    // Basic Obligatory Validation
    if (
      !formFields.nomeBeneficiario ||
      !formFields.cpfCnpj ||
      !formFields.endereco ||
      !formFields.cep ||
      !formFields.telefone ||
      !formFields.codigoRastreio
    ) {
      setErrorBanner("Por favor, preencha todos os campos obrigatórios (*) antes de salvar.");
      return;
    }

    // Save Entrega in Context
    const newId = `ITM-2025-0526-${Date.now().toString().slice(-4)}`;
    const newDelivery: Entrega = {
      id: newId,
      codigo: `ITM-${Date.now().toString().slice(-6)}`,
      maloteId: id || "MAL-2025-0526-128",
      beneficiario: {
        nome: formFields.nomeBeneficiario,
        cpf: formFields.cpfCnpj,
        dataNascimento: "15/08/1987" // default mock
      },
      endereco: {
        cep: formFields.cep,
        logradouro: formFields.endereco,
        numero: "S/N",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP"
      },
      telefone: formFields.telefone,
      tipoItem: formFields.tipoItem,
      prioridade: "Média",
      tentativaAtual: 0,
      status: "Validada" as StatusEntrega,
      codigoRastreio: formFields.codigoRastreio,
      valorCorrida: 15.0,
      historico: [
        {
          status: "Validada" as StatusEntrega,
          dataHora: new Date().toLocaleString("pt-BR"),
          descricao: "Item verificado via inteligência artificial (Gemini OCR) e validado pelo operador.",
          responsavel: "Ricardo Silva"
        }
      ]
    };

    dispatch({ type: "ADICIONAR_ENTREGA", payload: newDelivery });

    // Increment reviewed count
    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);

    // If complete, trigger success modal, else load next mock label to simulate flow
    if (nextReviewed >= totalBatchCount) {
      setIsSuccessBatch(true);
    } else {
      // Rotate mockup docs for endless high fidelity simulation
      const currentMockIndex = mockLabels.findIndex((m) => m.id === selectedMockId);
      const nextMockIndex = (currentMockIndex + 1) % mockLabels.length;
      loadMockLabel(mockLabels[nextMockIndex]);
      
      // Flash small check indicator
      const banner = document.getElementById("success-flash");
      if (banner) {
        banner.style.opacity = "1";
        setTimeout(() => {
          banner.style.opacity = "0";
        }, 2000);
      }
    }
  };

  // Helper styles for confidence badges
  const getConfidenceBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "alta":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ● Confiança Alta
          </span>
        );
      case "media":
      case "média":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ● Confiança Média
          </span>
        );
      case "baixa":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ● Confiança Baixa
          </span>
        );
      default:
        return null;
    }
  };

  const progressPercent = Math.round((reviewedCount / totalBatchCount) * 100);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none pb-12">
      {/* Top Banner Flash Message */}
      <div
        id="success-flash"
        className="fixed top-20 right-8 bg-[#E8F4F2] border border-[#0F6E6E] text-[#0F6E6E] font-semibold text-xs py-3 px-5 rounded-xl shadow-lg transition-opacity duration-300 opacity-0 pointer-events-none z-50 flex items-center gap-2"
      >
        <CheckCircle2 size={16} /> Item salvo com sucesso! Carregando próxima etiqueta do lote...
      </div>

      {/* Header and Back navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/malotes/${id || "MAL-2025-0526-128"}`)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft size={14} /> Voltar para o malote
          </button>
          <h1 className="text-2xl font-bold font-display text-[#0F172A]">OCR e Revisão</h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Revise os dados extraídos dos documentos/etiquetas do malote com Inteligência Artificial.
          </p>
        </div>

        {/* Top Right: Progress Card */}
        <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-4 shadow-xs min-w-[280px] group hover:border-[#0F6E6E] transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Progresso do lote
            </span>
            <span className="text-xs font-bold text-[#0F6E6E] bg-[#E8F4F2] px-2 py-0.5 rounded-full">
              {progressPercent}%
            </span>
          </div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-lg font-black text-[#0F172A] font-display">
              {reviewedCount} <span className="text-xs font-semibold text-slate-400">de {totalBatchCount} revisados</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0F6E6E] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error banner notification */}
      {errorBanner && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-4 rounded-xl flex items-center gap-3 shadow-xs">
          <AlertCircle size={18} className="shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Atenção:</span> {errorBanner}
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-red-400 hover:text-red-700 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Documento escaneado card */}
        <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A] font-display">
                  Documento escaneado
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#64748B] font-medium">Etiqueta do malote</span>
                  <span className="bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                    Alta qualidade
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-[#F1F5F9]">
                <button
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                  className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[11px] font-bold text-slate-500 px-1 min-w-[36px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                  className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <div className="w-[1px] bg-slate-200 h-4 mx-0.5" />
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  title="Girar"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  onClick={() => setIsMaximized(true)}
                  className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  title="Expandir"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            {/* Simulated interactive image dropzone / Viewer */}
            <div className="relative border border-[#E6EAF0] rounded-xl bg-slate-50 min-h-[460px] flex items-center justify-center overflow-hidden mb-6 p-4">
              {activeImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="transition-transform duration-200 relative"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      maxHeight: "440px"
                    }}
                  >
                    <img
                      src={activeImage}
                      alt="Etiqueta Escaneada"
                      className="rounded shadow-sm max-h-[420px] object-contain border border-slate-200 bg-white"
                    />

                    {/* Green Highlighter Box Overlays (1 to 7) - Only visible when form fields are filled, representing OCR bounding boxes */}
                    {formFields.nomeBeneficiario && (
                      <>
                        {/* 1. Nome Beneficiário */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "40.5%", left: "5.5%", width: "89%", height: "5.5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            1
                          </span>
                        </div>
                        {/* 2. CPF/CNPJ */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "50%", left: "5.5%", width: "42%", height: "5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            2
                          </span>
                        </div>
                        {/* 3. Endereço */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "59.5%", left: "5.5%", width: "89%", height: "8.5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            3
                          </span>
                        </div>
                        {/* 4. CEP */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "71.2%", left: "5.5%", width: "42%", height: "5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            4
                          </span>
                        </div>
                        {/* 5. Telefone */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "71.2%", left: "52.5%", width: "42%", height: "5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            5
                          </span>
                        </div>
                        {/* 6. Tipo de Item */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "82.5%", left: "5.5%", width: "42%", height: "5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            6
                          </span>
                        </div>
                        {/* 7. Código de Rastreio */}
                        <div
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-xs flex items-center justify-start pl-1 pointer-events-none group animate-pulse"
                          style={{ top: "82.5%", left: "52.5%", width: "42%", height: "5%" }}
                        >
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1 rounded flex items-center justify-center h-4 w-4">
                            7
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1">Nenhum documento carregado</h3>
                  <p className="text-[11px] text-[#64748B] max-w-xs mb-4">
                    Arraste a etiqueta ou clique para enviar (JPG, PNG ou PDF).
                  </p>
                </div>
              )}
            </div>

            {/* Test Labels Section */}
            <div className="border-t border-[#F1F5F9] pt-4 mb-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Simulador: Escolha uma etiqueta de teste abaixo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mockLabels.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => loadMockLabel(doc)}
                    className={`p-3 text-left border rounded-xl transition-all duration-200 cursor-pointer ${
                      selectedMockId === doc.id
                        ? "border-[#0F6E6E] bg-[#E8F4F2]/30 shadow-xs"
                        : "border-[#E6EAF0] bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {doc.tracking.slice(0, 8)}...
                      </span>
                      {doc.type === "Cartão" && <CreditCard size={12} className="text-[#0F6E6E]" />}
                      {doc.type === "Boleto" && <FileText size={12} className="text-blue-500" />}
                      {doc.type === "Exame" && <FileSpreadsheet size={12} className="text-purple-500" />}
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {doc.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual File Upload input */}
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-[#CBD5E1] hover:border-[#0F6E6E] hover:bg-slate-50 transition-all py-2 rounded-lg cursor-pointer text-xs font-semibold text-slate-600">
                <UploadCloud size={16} /> Fazer upload de arquivo próprio
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeOCR}
                disabled={isLoading || !activeImage}
                className="bg-[#0F6E6E] text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#0C5A5A] active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none group shrink-0"
              >
                <Sparkles size={15} className="group-hover:animate-spin" />
                {isLoading ? "Analisando com Gemini..." : "Analisar com IA (Gemini)"}
              </button>
            </div>
          </div>

          {/* Left Card footer */}
          <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-4 mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Legenda: ▪ Campos reconhecidos pelo OCR</span>
            <span className="text-[#0F6E6E]">
              {formFields.nomeBeneficiario ? "7 campos detectados" : "Nenhum campo detectado"}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Dados extraídos card */}
        <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A] font-display">
                  Dados extraídos
                </h2>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  Revise, corrija e confirme os dados extraídos pelo OCR.
                </p>
              </div>

              {/* Clear fields button */}
              <button
                onClick={handleClearFields}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} /> Limpar campos
              </button>
            </div>

            {/* Pulsing skeleton screen loader */}
            {isLoading ? (
              <div className="space-y-6 py-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/6" />
                    </div>
                    <div className="h-10 bg-slate-100 rounded-lg w-full" />
                  </div>
                ))}
              </div>
            ) : (
              // Form Fields Area
              <div className="space-y-4.5 py-2">
                {/* 1. Nome Beneficiário */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                        1
                      </span>
                      Nome do Beneficiário *
                    </label>
                    {getConfidenceBadge(confidence.nomeBeneficiario)}
                  </div>
                  <input
                    type="text"
                    value={formFields.nomeBeneficiario}
                    onChange={(e) =>
                      setFormFields({ ...formFields, nomeBeneficiario: e.target.value })
                    }
                    placeholder="Nome completo extraído..."
                    className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                  />
                </div>

                {/* 2. CPF/CNPJ */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                        2
                      </span>
                      CPF / CNPJ *
                    </label>
                    {getConfidenceBadge(confidence.cpfCnpj)}
                  </div>
                  <input
                    type="text"
                    value={formFields.cpfCnpj}
                    onChange={(e) => setFormFields({ ...formFields, cpfCnpj: e.target.value })}
                    placeholder="Documento de cadastro..."
                    className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                  />
                </div>

                {/* 3. Endereço */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                        3
                      </span>
                      Endereço Completo *
                    </label>
                    {getConfidenceBadge(confidence.endereco)}
                  </div>
                  <input
                    type="text"
                    value={formFields.endereco}
                    onChange={(e) => setFormFields({ ...formFields, endereco: e.target.value })}
                    placeholder="Logradouro, número, bairro, cidade, UF..."
                    className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                  />
                  {confidence.endereco === "baixa" && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold p-2.5 rounded-lg mt-1 flex items-start gap-1.5">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Endereço incompleto detectado:</span> Ausência de complemento (número do apartamento, bloco ou sala). Isso gerará inconsistência se salvo sem ajuste!
                      </div>
                    </div>
                  )}
                </div>

                {/* CEP & Telefone side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 4. CEP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                          4
                        </span>
                        CEP *
                      </label>
                      {getConfidenceBadge(confidence.cep)}
                    </div>
                    <input
                      type="text"
                      value={formFields.cep}
                      onChange={(e) => setFormFields({ ...formFields, cep: e.target.value })}
                      placeholder="00000-000..."
                      className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                    />
                  </div>

                  {/* 5. Telefone */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                          5
                        </span>
                        Telefone *
                      </label>
                      {getConfidenceBadge(confidence.telefone)}
                    </div>
                    <input
                      type="text"
                      value={formFields.telefone}
                      onChange={(e) => setFormFields({ ...formFields, telefone: e.target.value })}
                      placeholder="(00) 00000-0000..."
                      className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Tipo de Item & Código de Rastreio side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 6. Tipo de Item */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                          6
                        </span>
                        Tipo do Item *
                      </label>
                      {getConfidenceBadge(confidence.tipoItem)}
                    </div>
                    <select
                      value={formFields.tipoItem}
                      onChange={(e) =>
                        setFormFields({
                          ...formFields,
                          tipoItem: e.target.value as any
                        })
                      }
                      className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-800"
                    >
                      <option value="Cartão">Cartão</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Carnê">Carnê</option>
                      <option value="Medicamento">Medicamento</option>
                      <option value="Exame">Exame</option>
                      <option value="Documento">Documento</option>
                    </select>
                  </div>

                  {/* 7. Código de Rastreio */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-emerald-500 text-white font-black text-[9px] rounded-full h-5 w-5 shrink-0">
                          7
                        </span>
                        Rastreio *
                      </label>
                      {getConfidenceBadge(confidence.codigoRastreio)}
                    </div>
                    <input
                      type="text"
                      value={formFields.codigoRastreio}
                      onChange={(e) =>
                        setFormFields({ ...formFields, codigoRastreio: e.target.value })
                      }
                      placeholder="Ex: MLTBR..."
                      className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Observações</label>
                  <textarea
                    rows={2}
                    value={formFields.observacoes}
                    onChange={(e) =>
                      setFormFields({ ...formFields, observacoes: e.target.value })
                    }
                    placeholder="Adicione observações para este item, se necessário..."
                    className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs px-4 py-2.5 rounded-lg focus:outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-[#F1F5F9] mt-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Shield size={14} className="text-[#0F6E6E]" />
              <span>Nada é salvo sem revisão humana</span>
            </div>

            <button
              onClick={handleSaveAndContinue}
              disabled={isLoading || !formFields.nomeBeneficiario}
              className="md:ml-auto w-full md:w-auto bg-[#0F6E6E] text-white font-bold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0C5A5A] active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Confirmar, Salvar e Continuar <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {isMaximized && activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xs flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-700 p-6 max-w-4xl w-full flex flex-col gap-4 max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 font-display">
                  Visualização em Alta Definição
                </h3>
                <button
                  onClick={() => setIsMaximized(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-4 min-h-[400px]">
                <img
                  src={activeImage}
                  alt="Etiqueta Ampliada"
                  className="max-h-[60vh] object-contain rounded border border-slate-200"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsMaximized(false)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS FLOW MODAL */}
      <AnimatePresence>
        {isSuccessBatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-xs flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl border border-[#E6EAF0] p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 font-display leading-tight">
                Lote Concluído!
              </h3>
              
              <p className="text-xs font-semibold text-[#64748B] leading-relaxed max-w-xs">
                Todas as 12 etiquetas do malote foram revisadas, extraídas com Inteligência Artificial e salvas no sistema para roteirização e envio.
              </p>

              <div className="w-full bg-[#F8FAFC] rounded-xl p-4 border border-[#E6EAF0] text-left space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Malote Associado:</span>
                  <span className="font-mono text-slate-500">{id || "MAL-2025-0526-128"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Etapas Concluídas:</span>
                  <span className="text-emerald-600">6 de 6 Etapas</span>
                </div>
                <div className="flex justify-between">
                  <span>Itens Cadastrados:</span>
                  <span>12 Itens Registrados</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/malotes/${id || "MAL-2025-0526-128"}`)}
                className="w-full bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs py-3 rounded-lg transition-all cursor-pointer shadow-md"
              >
                Voltar para Detalhes do Malote
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
