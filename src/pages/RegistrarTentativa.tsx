import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMalote } from "../context/MaloteContext";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Check,
  ChevronDown,
  Bell,
  XCircle
} from "lucide-react";
import { Entrega } from "../types";

export default function RegistrarTentativa() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useMalote();

  // Find associated delivery in the global store
  const globalEntrega = state.entregas.find(e => e.id === id);

  // Fallback mobile-specific list for ent-1 to ent-4 to ensure they are fully populated and interactive
  const mobileFallbackList = [
    {
      id: "ent-1",
      nome: "Hospital São Lucas",
      tipoItem: "Cartão",
      qtd: 120,
      tipo: "cartões",
      endereco: "Av. Brasil, 2560 – Centro, Fortaleza – CE",
      horario: "09:15",
      status: "Em rota" as const,
      tentativas: 0
    },
    {
      id: "ent-2",
      nome: "Clínica Vida Plena",
      tipoItem: "Boleto",
      qtd: 85,
      tipo: "boletos",
      endereco: "R. Des. Moreira, 1500 – Aldeota, Fortaleza – CE",
      horario: "10:30",
      status: "Pendente" as const,
      tentativas: 1
    },
    {
      id: "ent-3",
      nome: "Laboratório Saúde+",
      tipoItem: "Carnê",
      qtd: 200,
      tipo: "carnês",
      endereco: "Av. Dom Luís, 987 – Meireles, Fortaleza – CE",
      horario: "11:30",
      status: "Concluída" as const,
      tentativas: 0
    },
    {
      id: "ent-4",
      nome: "Hospital Santa Helena",
      tipoItem: "Cartão",
      qtd: 150,
      tipo: "cartões",
      endereco: "Av. Santos Dumont, 3131 – Aldeota, Fortaleza – CE",
      horario: "14:00",
      status: "Em rota" as const,
      tentativas: 2
    }
  ];

  const mobileEntrega = mobileFallbackList.find(e => e.id === id);

  // Derive all data either from the global store, fallback mock list, or absolute defaults
  const nome = globalEntrega?.beneficiario.nome || mobileEntrega?.nome || "Hospital São Lucas";
  const tipoItem = globalEntrega?.tipoItem || mobileEntrega?.tipoItem || "Cartão";
  const qtd = globalEntrega ? 120 : (mobileEntrega?.qtd || 120);
  const tipo = globalEntrega ? "cartões" : (mobileEntrega?.tipo || "cartões");
  const status = globalEntrega?.status || mobileEntrega?.status || "Em rota";
  const attemptsCount = globalEntrega?.tentativas?.length || mobileEntrega?.tentativas || 0;

  const enderecoStr = globalEntrega 
    ? `${globalEntrega.endereco.logradouro}, ${globalEntrega.endereco.numero} – ${globalEntrega.endereco.bairro}, ${globalEntrega.endereco.cidade} – ${globalEntrega.endereco.uf}`
    : (mobileEntrega?.endereco || "Av. Brasil, 2560 – Centro, Fortaleza – CE");

  // Determine current attempt number (e.g. 1st, 2nd, 3rd)
  const currentAttemptNumber = attemptsCount + 1;
  const attemptLabel = `${currentAttemptNumber}ª tentativa`;

  // RN-009/RN-034: Check if limit of 3 attempts is already reached
  const maxAttempts = state.configuracoes?.tentativasMaximas ?? 3;
  const isBlocked = attemptsCount >= maxAttempts;

  // Helper to check if a motive name is active in the settings catalog
  const isMotiveActive = (motiveName: string) => {
    if (!state.configuracoes?.motivosInsucesso) return true;
    return state.configuracoes.motivosInsucesso.some(m => m.nome === motiveName && m.ativo);
  };

  // Form States - default to first active quick reason or "Outro"
  const [motivoRapido, setMotivoRapido] = useState<string>(() => {
    if (isMotiveActive("Beneficiário ausente")) return "Cliente ausente";
    if (isMotiveActive("Endereço incompleto")) return "Endereço incompleto";
    if (isMotiveActive("Contato indisponível")) return "Sem contato";
    if (isMotiveActive("Recusa de recebimento")) return "Recusado";
    return "Outro";
  });
  const [outroMotivo, setOutroMotivo] = useState("");
  const [fotoAnexada, setFotoAnexada] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Hidden file input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catalog of standard delivery failure reasons for select dropdown
  const catalogoMotivos = state.configuracoes?.motivosInsucesso
    ? state.configuracoes.motivosInsucesso.filter(m => m.ativo).map(m => m.nome)
    : [
        "Beneficiário ausente",
        "Endereço não localizado",
        "Endereço incompleto",
        "Endereço incorreto",
        "Contato indisponível",
        "Mudou-se",
        "Recusa de recebimento",
        "Local fechado",
        "Área de risco/restrição operacional",
        "Kit/documento com problema",
        "Entrega cancelada pelo contratante",
        "Outro motivo (justificativa obrigatória)"
      ];

  // Map quick selections to final reason text
  const finalMotivo = motivoRapido === "Outro" ? outroMotivo : motivoRapido;

  // Retrieve configuration for selected reason object
  const selectedReasonObj = state.configuracoes?.motivosInsucesso?.find(m => {
    if (finalMotivo === "Cliente ausente" && m.nome === "Beneficiário ausente") return true;
    if (finalMotivo === "Sem contato" && m.nome === "Contato indisponível") return true;
    if (finalMotivo === "Recusado" && m.nome === "Recusa de recebimento") return true;
    return m.nome === finalMotivo;
  });

  // Validation rules (RN-007)
  const isPhotoRequired = (state.configuracoes?.exigirFotoFachadaInsucesso ?? true) && (selectedReasonObj ? selectedReasonObj.exigeFoto : true);
  const isJustificationRequired = selectedReasonObj ? selectedReasonObj.exigeJustificativa : (finalMotivo === "Outro motivo (justificativa obrigatória)" || motivoRapido === "Outro");
  const isSaveDisabled = !finalMotivo || (isPhotoRequired && !fotoAnexada) || (isJustificationRequired && !observacao.trim());

  // Handle Photo input changes (support capturing/galeria)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoAnexada(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle Form submission and state persistence (RN-008, RN-009/RN-034)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaveDisabled || isSubmitting) return;

    setIsSubmitting(true);

    // Build the global Tentativa object
    const novaTentativa = {
      numero: currentAttemptNumber,
      dataHora: "26/05/2025 09:10",
      motoboyId: "moto-6", // Ricardo Silva
      resultado: "Insucesso" as const,
      motivo: finalMotivo,
      fotoUrl: fotoAnexada || "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600",
      observacao: observacao.trim() || undefined,
      geo: {
        lat: -3.7319,
        lng: -38.5267
      }
    };

    // 1. Persist the updated attempt globally inside the back-office context
    // This maintains back-office audits, statistics, and pending queues (RN-008)
    let targetEntrega = state.entregas.find(e => e.id === id);

    if (!targetEntrega) {
      // If delivery is not found in global state, bootstrap it to ensure the dashboard reflects this failed delivery correctly!
      const newEntrega: Entrega = {
        id: id || "ent-1",
        codigo: `ITM-0526-${id?.replace(/\D/g, "") || "1"}`,
        maloteId: "MAL-128",
        beneficiario: {
          nome,
          cpf: "123.456.789-00",
          dataNascimento: "10/10/1980"
        },
        endereco: {
          cep: "60000-000",
          logradouro: enderecoStr.split(" – ")[0] || "Av. Brasil, 2560",
          numero: "2560",
          bairro: enderecoStr.split(" – ")[1]?.split(",")[0] || "Centro",
          cidade: "Fortaleza",
          uf: "CE"
        },
        telefone: "(85) 99999-9999",
        tipoItem: (tipoItem as any) || "Cartão",
        prioridade: "Alta",
        tentativaAtual: attemptsCount,
        status: "Em rota",
        motoboyId: "moto-6",
        codigoRastreio: `MLTBR250526999BR`,
        historico: [
          {
            status: "Em rota",
            dataHora: "26/05/2025 09:15",
            descricao: "Saída para entrega do motoboy",
            responsavel: "Sistema Logístico"
          }
        ],
        valorCorrida: 12.50,
        tentativas: []
      };

      // Add dummy pre-attempts if needed
      if (attemptsCount > 0) {
        for (let i = 1; i <= attemptsCount; i++) {
          newEntrega.tentativas?.push({
            numero: i,
            dataHora: `26/05/2025 08:${i}0`,
            motoboyId: "moto-6",
            resultado: "Insucesso",
            motivo: "Cliente ausente",
            observacao: "Tentativa prévia registrada",
            geo: { lat: -3.7319, lng: -38.5267 }
          });
        }
      }

      dispatch({ type: "ADICIONAR_ENTREGA", payload: newEntrega });
    }

    // Now record the attempt
    dispatch({
      type: "REGISTRAR_TENTATIVA",
      payload: {
        entregaId: id || "ent-1",
        tentativa: novaTentativa
      }
    });

    // 2. Persist in LocalStorage to keep the mobile app fully interactive and synchronized
    const savedList = localStorage.getItem("motoboy_entregas_list");
    if (savedList) {
      try {
        const list = JSON.parse(savedList);
        const updatedList = list.map((e: any) => {
          if (e.id === id) {
            return {
              ...e,
              status: "Tentativa sem sucesso",
              tentativas: currentAttemptNumber
            };
          }
          return e;
        });
        localStorage.setItem("motoboy_entregas_list", JSON.stringify(updatedList));
      } catch (err) {
        // ignore
      }
    }

    // Show custom success screen, save session toast notification, and redirect
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      sessionStorage.setItem(
        "motoboy_delivery_toast",
        "Ocorrência registrada. Entrega enviada para análise."
      );

      setTimeout(() => {
        navigate("/app/entregas");
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-0 sm:py-8 sm:px-4 flex flex-col items-center justify-center font-sans select-none relative">

      {/* Admin Panel Quick Link */}
      <div className="mb-4 pt-4 sm:pt-0 text-center">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-[#0F6E6E] text-white hover:bg-[#0C5A5A] text-xs font-bold px-4 py-2 rounded-full shadow-md transition-all cursor-pointer"
        >
          ← Voltar para o Painel Administrativo
        </button>
      </div>

      {/* SMARTPHONE CONTAINER MOLDURA — full screen on mobile, decorative frame from sm: up */}
      <div className="w-full min-h-dvh rounded-none border-0 shadow-none sm:max-w-[420px] sm:min-h-[850px] sm:rounded-[48px] sm:border-[14px] sm:border-[#0F172A] sm:shadow-2xl bg-[#F8FAFC] relative overflow-hidden flex flex-col text-slate-800 pb-20">

        {/* Notch details (desktop mockup only) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#0F172A] rounded-b-2xl z-50 hidden sm:flex items-center justify-center gap-1.5">
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
        </div>

        {/* Top Status Bar (desktop mockup only) */}
        <div className="bg-[#F8FAFC] h-10 px-6 pt-2 hidden sm:flex items-center justify-between text-[11px] font-bold text-slate-500 select-none z-30">
          <span>09:10</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="bg-slate-600 h-full w-4 rounded-3xs" />
            </div>
          </div>
        </div>

        {/* SUCCESS SPLASH OVERLAY */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F6E6E] text-white z-50 flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.3, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle size={44} className="text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">Tentativa Gravada!</h2>
              <p className="text-xs text-teal-100 mt-2 max-w-[280px] leading-relaxed">
                A ocorrência foi registrada com sucesso. A entrega foi encaminhada para análise e as coordenadas GPS foram capturadas.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCREEN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-left">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => navigate("/app/entregas")}
              className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h1 className="text-base font-bold text-[#0F172A] tracking-tight">
              Registrar tentativa
            </h1>

            <button
              type="button"
              className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm relative active:scale-95 transition-all cursor-pointer"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-[#F8FAFC]">
                3
              </span>
            </button>
          </div>

          {/* CARD DO DESTINO */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative flex flex-col">
            <div className="p-4 flex flex-col space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Envelope icon in teal circle */}
                  <div className="h-10 w-10 bg-[#EBF7F5] text-[#0F6E6E] rounded-full flex items-center justify-center shrink-0 border border-teal-100">
                    <Mail size={18} />
                  </div>
                  <h2 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">
                    {nome}
                  </h2>
                </div>
                {/* Badge azul "Em rota" in top corner */}
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-1">
                  {status === "Em rota" ? "Em rota" : "Atribuída"}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 pl-1">
                <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="text-slate-400 font-normal">▭</span>
                  <span>{qtd} {tipo}</span>
                </p>

                <p className="text-xs text-slate-500 font-medium flex items-start gap-1">
                  <span className="text-rose-500 text-sm mt-[-1px]">📍</span>
                  <span className="leading-tight">{enderecoStr}</span>
                </p>
              </div>
            </div>

            {/* Faixa teal clara com barra vertical: "PRÓXIMA PARADA / 2ª parada de 6" e chevron à direita */}
            <div className="bg-[#EBF7F5] border-t border-teal-100 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {/* Barra vertical verde */}
                <div className="w-1.5 h-8 bg-[#0F6E6E] rounded-full shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-bold text-[#0F6E6E] tracking-wider uppercase">
                    PRÓXIMA PARADA
                  </p>
                  <p className="text-xs font-extrabold text-[#0F6E6E]">
                    2ª parada de 6
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#0F6E6E] shrink-0" />
            </div>
          </div>

          {/* BLOCKING OVERLAY FOR LIMIT OF ATTEMPTS (RN-009/RN-034) */}
          {isBlocked ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-4">
              <div className="h-14 w-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                Tentativa Bloqueada
              </h3>
              <p className="text-xs text-red-700 leading-relaxed font-semibold">
                Limite de tentativas atingido. Esta entrega deve seguir para devolução definitiva.
              </p>
              <div className="bg-white border border-red-100 rounded-xl p-3 text-xs text-slate-500 font-medium space-y-1">
                <p>Histórico do item: <strong>3 tentativas falhas</strong></p>
                <p>Status: <strong className="text-red-600">Encaminhado para devolução</strong></p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/app/entregas")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
              >
                Voltar para as entregas
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* SEÇÃO TENTATIVA ATUAL */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tentativa atual
                </h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 shadow-3xs">
                  <div className="flex items-center">
                    {/* Chip teal */}
                    <span className="bg-[#EBF7F5] text-[#0F6E6E] border border-teal-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {attemptLabel}
                    </span>
                  </div>

                  {/* Row with values */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base text-slate-400"><Calendar size={14} /></span>
                      <span>26/05/2025</span>
                    </div>
                    <div className="text-slate-200 font-normal">|</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base text-slate-400"><Clock size={14} /></span>
                      <span>09:10</span>
                    </div>
                    <div className="text-slate-200 font-normal">|</div>
                    <div className="flex items-center gap-1">
                      <span className="text-base text-slate-400"><MapPin size={14} /></span>
                      <span className="text-slate-700">GPS Ativo</span>
                      <span className="text-emerald-500 font-bold text-xs ml-0.5 bg-emerald-50 h-4 w-4 rounded-full flex items-center justify-center border border-emerald-100">✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO MOTIVO DA TENTATIVA NÃO CONCLUÍDA */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Motivo da tentativa não concluída
                </h3>
                
                {/* 2x2 selectable grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "Cliente ausente", label: "Cliente ausente", icon: <User size={16} />, active: isMotiveActive("Beneficiário ausente") },
                    { key: "Endereço incompleto", label: "Endereço incompleto", icon: <MapPin size={16} />, active: isMotiveActive("Endereço incompleto") },
                    { key: "Sem contato", label: "Sem contato", icon: <Phone size={16} />, active: isMotiveActive("Contato indisponível") },
                    { key: "Recusado", label: "Recusado", icon: <XCircle size={16} />, active: isMotiveActive("Recusa de recebimento") },
                  ].filter(item => item.active).map(item => {
                    const isSelected = motivoRapido === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setMotivoRapido(item.key);
                          setOutroMotivo(""); // Reset select dropdown
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all min-h-[52px] cursor-pointer text-left ${
                          isSelected
                            ? "border-[#0F6E6E] bg-teal-50/50 text-[#0F6E6E] shadow-3xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isSelected ? "text-[#0F6E6E]" : "text-slate-400 shrink-0"}>
                            {item.icon}
                          </span>
                          <span className="leading-tight">{item.label}</span>
                        </div>
                        
                        {/* Check circular teal */}
                        {isSelected ? (
                          <span className="h-5 w-5 bg-[#0F6E6E] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded-full border border-slate-200 shrink-0 bg-slate-50" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Full catalogue select dropdown */}
                <div className="relative pt-1">
                  <select
                    value={outroMotivo}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setMotivoRapido("Outro");
                        setOutroMotivo(val);
                      } else {
                        setMotivoRapido("Cliente ausente");
                        setOutroMotivo("");
                      }
                    }}
                    className={`w-full p-3 pr-10 bg-white border rounded-xl text-xs font-bold outline-none transition-all appearance-none cursor-pointer min-h-[46px] ${
                      motivoRapido === "Outro" ? "border-[#0F6E6E] text-[#0F6E6E] bg-teal-50/20" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="" className="text-slate-400">Outro motivo ▾</option>
                    {catalogoMotivos.map(m => (
                      <option key={m} value={m} className="text-slate-800">
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* SEÇÃO FOTO DA FACHADA (OBRIGATÓRIA) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Foto da fachada
                  </h3>
                  <span className="text-[10px] font-black text-red-500 uppercase">
                    (obrigatória)
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {fotoAnexada ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-44 shadow-2xs bg-slate-100 group">
                    <img src={fotoAnexada} alt="Foto da Fachada" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <button
                        type="button"
                        onClick={() => setFotoAnexada(null)}
                        className="bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all hover:bg-red-700 active:scale-95"
                      >
                        <X size={14} />
                        <span>Remover foto</span>
                      </button>
                    </div>
                    {/* Delete button always visible at top corner for mobile usability */}
                    <button
                      type="button"
                      onClick={() => setFotoAnexada(null)}
                      className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-white hover:border-[#0F6E6E] hover:bg-teal-50/10 transition-all flex flex-col items-center justify-center text-center space-y-2 min-h-[130px] cursor-pointer shadow-3xs"
                  >
                    {/* Camera icon in teal circle */}
                    <div className="h-11 w-11 bg-[#EBF7F5] text-[#0F6E6E] rounded-full flex items-center justify-center border border-teal-100 shrink-0">
                      <Camera size={20} />
                    </div>
                    <div className="text-xs font-bold leading-normal">
                      <span className="text-[#0F6E6E] hover:underline">Tirar foto da fachada</span>{" "}
                      <span className="text-slate-400 font-medium">ou selecione da galeria</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO OBSERVAÇÕES (OPCIONAL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Observações {isJustificationRequired && <span className="text-red-500 font-bold">*</span>}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {observacao.length}/250
                  </span>
                </div>
                <textarea
                  placeholder={isJustificationRequired ? "Descreva obrigatoriamente os detalhes sobre este outro motivo..." : "Descreva detalhes sobre a tentativa..."}
                  rows={3}
                  value={observacao}
                  maxLength={250}
                  onChange={e => setObservacao(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold placeholder:text-slate-400 outline-none resize-none transition-all shadow-3xs"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSaveDisabled || isSubmitting}
                  className="w-full bg-[#0F6E6E] hover:bg-[#0C5A5A] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl py-3.5 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-white border-white/30 rounded-full animate-spin" />
                      <span>Gravando...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Salvar ocorrência</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/app/entregas")}
                  className="w-full border border-[#0F6E6E] text-[#0F6E6E] hover:bg-teal-50 font-bold text-sm rounded-xl py-3 shadow-sm transition-all active:scale-95 flex items-center justify-center min-h-[44px] cursor-pointer bg-white"
                >
                  Voltar
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Home bar footer indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-40 pointer-events-none" />

      </div>
    </div>
  );
}
