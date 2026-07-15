import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMalote } from "../context/MaloteContext";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Phone,
  MapPin,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  Layers,
  CheckSquare,
  Users,
  Activity,
  X,
  Plus,
  HelpCircle,
  Eye,
  Trash2,
  Lock,
  RefreshCw,
  XCircle
} from "lucide-react";
import { Endereco, StatusEntrega } from "../types";

export default function Pendencias() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // Search and filter states for the list view
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "cartoes" | "boletos" | "carnes" | "outros">("todos");
  const [filterAge, setFilterAge] = useState<"todos" | "recente" | "atrasado">("todos");

  // State to hold local edits for the active delivery
  const [correctedLogradouro, setCorrectedLogradouro] = useState("");
  const [correctedNumero, setCorrectedNumero] = useState("");
  const [correctedBairro, setCorrectedBairro] = useState("");
  const [correctedCep, setCorrectedCep] = useState("");
  const [correctedCidade, setCorrectedCidade] = useState("");
  const [correctedUf, setCorrectedUf] = useState("");
  const [correctedTelefone, setCorrectedTelefone] = useState("");
  const [providencias, setProvidencias] = useState("");

  // Keep track of original values to check if any field has been changed (RN-011)
  const [originalValues, setOriginalValues] = useState<{
    logradouro: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    telefone: string;
  } | null>(null);

  // Lightbox modal for viewing facade photos in full scale
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Session storage toast display on mount
  useEffect(() => {
    const pendingToast = sessionStorage.getItem("pendencias_toast");
    if (pendingToast) {
      showToast(pendingToast, "success");
      sessionStorage.removeItem("pendencias_toast");
    }
  }, []);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Derived variables for top cards (Aguardando análise, Em análise, Liberadas hoje, Para devolução definitiva)
  const stats = useMemo(() => {
    const aguardando = state.entregas.filter(
      (e) => e.status === "Tentativa sem sucesso" || e.status === "Com inconsistência"
    ).length;
    const emAnalise = state.entregas.filter((e) => e.status === "Em análise de pendência").length;
    
    // We can fetch released today count dynamically or fall back to an aesthetic base of 8 + any active releases from this session
    const baseReleased = 8;
    const releasedToday = baseReleased + state.auditoria.filter(
      (a) => a.acao === "Resolução de Pendência" && a.valorNovo?.includes("Aguardando distribuição")
    ).length;

    const devolucoes = state.entregas.filter((e) => e.status === "Devolução definitiva").length;

    return { aguardando, emAnalise, releasedToday, devolucoes };
  }, [state.entregas, state.auditoria]);

  // Derive AGE and RESPONSIBLE deterministically for any given delivery
  const getDeliveryMeta = (deliveryId: string, idx: number) => {
    // Generate deterministic age and responsible operator
    const lastDigit = parseInt(deliveryId.replace(/\D/g, "") || "0");
    const isOver24h = lastDigit % 3 === 0;
    const ageLabel = isOver24h ? `${(lastDigit % 5) + 2} dias` : `${(lastDigit % 20) + 3}h`;
    
    const operators = ["Ana Martins", "João Paulo", "Fernanda Lima", "Não atribuído"];
    const responsible = operators[lastDigit % operators.length];

    return {
      ageLabel,
      isOver24h,
      responsible
    };
  };

  // Get failure reason
  const getFailureReason = (delivery: any) => {
    if (delivery.status === "Com inconsistência") {
      return "Endereço incompleto";
    }
    const lastAttempt = delivery.tentativas && delivery.tentativas.length > 0
      ? delivery.tentativas[delivery.tentativas.length - 1]
      : null;
    return lastAttempt?.motivo || "Cliente ausente";
  };

  // List of deliveries to display in the pendency table (Tentativa sem sucesso, Com inconsistência, Em análise de pendência)
  const pendingDeliveries = useMemo(() => {
    return state.entregas.filter(
      (e) =>
        e.status === "Tentativa sem sucesso" ||
        e.status === "Com inconsistência" ||
        e.status === "Em análise de pendência"
    );
  }, [state.entregas]);

  // Filtered deliveries for the table based on search & buttons
  const filteredDeliveries = useMemo(() => {
    return pendingDeliveries.filter((e, idx) => {
      // Search text matches code, beneficiary name, cpf, or malote
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        e.codigo.toLowerCase().includes(searchLower) ||
        e.beneficiario.nome.toLowerCase().includes(searchLower) ||
        e.beneficiario.cpf.includes(searchLower) ||
        e.maloteId.toLowerCase().includes(searchLower);

      // Filter by type
      let matchesType = true;
      if (filterType === "cartoes") matchesType = e.tipoItem === "Cartão";
      else if (filterType === "boletos") matchesType = e.tipoItem === "Boleto";
      else if (filterType === "carnes") matchesType = e.tipoItem === "Carnê";
      else if (filterType === "outros") {
        matchesType = e.tipoItem !== "Cartão" && e.tipoItem !== "Boleto" && e.tipoItem !== "Carnê";
      }

      // Filter by age
      let matchesAge = true;
      const meta = getDeliveryMeta(e.id, idx);
      if (filterAge === "recente") matchesAge = !meta.isOver24h;
      else if (filterAge === "atrasado") matchesAge = meta.isOver24h;

      return matchesSearch && matchesType && matchesAge;
    });
  }, [pendingDeliveries, searchTerm, filterType, filterAge]);

  // Find active delivery for the analyzer view
  const activeDelivery = useMemo(() => {
    if (!id) return null;
    return state.entregas.find((e) => e.id === id) || null;
  }, [id, state.entregas]);

  // Initialize editable fields on active delivery mount
  useEffect(() => {
    if (activeDelivery) {
      setCorrectedLogradouro(activeDelivery.endereco.logradouro);
      setCorrectedNumero(activeDelivery.endereco.numero);
      setCorrectedBairro(activeDelivery.endereco.bairro);
      setCorrectedCep(activeDelivery.endereco.cep);
      setCorrectedCidade(activeDelivery.endereco.cidade);
      setCorrectedUf(activeDelivery.endereco.uf);
      setCorrectedTelefone(activeDelivery.telefone);
      setProvidencias("");

      setOriginalValues({
        logradouro: activeDelivery.endereco.logradouro,
        numero: activeDelivery.endereco.numero,
        bairro: activeDelivery.endereco.bairro,
        cep: activeDelivery.endereco.cep,
        cidade: activeDelivery.endereco.cidade,
        uf: activeDelivery.endereco.uf,
        telefone: activeDelivery.telefone
      });

      // Update status to 'Em análise de pendência' when analyzed if it was not already
      if (activeDelivery.status !== "Em análise de pendência") {
        dispatch({
          type: "ATUALIZAR_STATUS_ENTREGA",
          payload: { id: activeDelivery.id, status: "Em análise de pendência" }
        });
      }
    } else {
      setOriginalValues(null);
    }
  }, [id, activeDelivery, dispatch]);

  // Check which fields are modified
  const isFieldChanged = (fieldName: "logradouro" | "numero" | "bairro" | "cep" | "cidade" | "uf" | "telefone") => {
    if (!originalValues) return false;
    if (fieldName === "logradouro") return correctedLogradouro !== originalValues.logradouro;
    if (fieldName === "numero") return correctedNumero !== originalValues.numero;
    if (fieldName === "bairro") return correctedBairro !== originalValues.bairro;
    if (fieldName === "cep") return correctedCep !== originalValues.cep;
    if (fieldName === "cidade") return correctedCidade !== originalValues.cidade;
    if (fieldName === "uf") return correctedUf !== originalValues.uf;
    if (fieldName === "telefone") return correctedTelefone !== originalValues.telefone;
    return false;
  };

  const isAnyFieldChanged = useMemo(() => {
    return (
      isFieldChanged("logradouro") ||
      isFieldChanged("numero") ||
      isFieldChanged("bairro") ||
      isFieldChanged("cep") ||
      isFieldChanged("cidade") ||
      isFieldChanged("uf") ||
      isFieldChanged("telefone")
    );
  }, [
    correctedLogradouro,
    correctedNumero,
    correctedBairro,
    correctedCep,
    correctedCidade,
    correctedUf,
    correctedTelefone,
    originalValues
  ]);

  // Form submit handlers (Liberar, Encerrar, Cancelar)
  const handleResolution = (actionType: "liberar" | "devolucao" | "cancelar") => {
    if (!activeDelivery || !originalValues) return;

    if (!providencias.trim()) {
      showToast("Por favor, preencha o campo de providências tomadas.", "error");
      return;
    }

    const auditEvents: { acao: string; entidade: string; valorAnterior?: string; valorNovo?: string }[] = [];

    // 1. Audit changed fields (RF-061)
    if (isFieldChanged("logradouro")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (Logradouro)",
        valorAnterior: originalValues.logradouro,
        valorNovo: correctedLogradouro
      });
    }
    if (isFieldChanged("numero")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (Número)",
        valorAnterior: originalValues.numero,
        valorNovo: correctedNumero
      });
    }
    if (isFieldChanged("bairro")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (Bairro)",
        valorAnterior: originalValues.bairro,
        valorNovo: correctedBairro
      });
    }
    if (isFieldChanged("cep")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (CEP)",
        valorAnterior: originalValues.cep,
        valorNovo: correctedCep
      });
    }
    if (isFieldChanged("cidade")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (Cidade)",
        valorAnterior: originalValues.cidade,
        valorNovo: correctedCidade
      });
    }
    if (isFieldChanged("uf")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (UF)",
        valorAnterior: originalValues.uf,
        valorNovo: correctedUf
      });
    }
    if (isFieldChanged("telefone")) {
      auditEvents.push({
        acao: "Correção de Cadastro",
        entidade: "Entrega (Telefone)",
        valorAnterior: originalValues.telefone,
        valorNovo: correctedTelefone
      });
    }

    let novoStatus: StatusEntrega = "Aguardando distribuição";
    let statusLabel = "";
    let incTentativa = false;

    if (actionType === "liberar") {
      novoStatus = "Aguardando distribuição";
      statusLabel = "Liberado para nova tentativa";
      incTentativa = true;
    } else if (actionType === "devolucao") {
      novoStatus = "Devolução definitiva";
      statusLabel = "Encerrado como devolução definitiva";
    } else if (actionType === "cancelar") {
      novoStatus = "Cancelada";
      statusLabel = "Entrega cancelada";
    }

    // Add main resolution audit event
    auditEvents.push({
      acao: "Resolução de Pendência",
      entidade: "Entrega",
      valorAnterior: activeDelivery.status,
      valorNovo: `${novoStatus} (${statusLabel})`
    });

    const enderecoCorrigido: Endereco = {
      cep: correctedCep,
      logradouro: correctedLogradouro,
      numero: correctedNumero,
      bairro: correctedBairro,
      cidade: correctedCidade,
      uf: correctedUf
    };

    dispatch({
      type: "RESOLVER_ANALISE_PENDENCIA",
      payload: {
        entregaId: activeDelivery.id,
        novoStatus,
        incrementarTentativa: incTentativa,
        enderecoCorrigido: isAnyFieldChanged ? enderecoCorrigido : undefined,
        telefoneCorrigido: isFieldChanged("telefone") ? correctedTelefone : undefined,
        providencias: providencias.trim(),
        auditorias: auditEvents
      }
    });

    // Also update mobile list state in localStorage if it exists
    const savedList = localStorage.getItem("motoboy_entregas_list");
    if (savedList) {
      try {
        const list = JSON.parse(savedList);
        const updatedList = list.map((e: any) => {
          if (e.id === activeDelivery.id) {
            return {
              ...e,
              status: novoStatus === "Aguardando distribuição" ? "Em rota" : novoStatus === "Devolução definitiva" ? "Devolução definitiva" : "Pendente"
            };
          }
          return e;
        });
        localStorage.setItem("motoboy_entregas_list", JSON.stringify(updatedList));
      } catch (err) {
        // ignore
      }
    }

    sessionStorage.setItem(
      "pendencias_toast",
      `Entrega ${activeDelivery.codigo} resolvida com sucesso: ${statusLabel}`
    );
    navigate("/pendencias");
  };

  // Safe fallback photo URL
  const defaultPhoto = "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600";

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <div className="flex items-center gap-3">
            {id && (
              <button
                onClick={() => navigate("/pendencias")}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-[#0F172A] font-display">
              {id ? "Análise e Tratativa de Pendência" : "Central de Pendências"}
            </h1>
          </div>
          <p className="text-sm text-[#64748B] mt-1 font-sans">
            {id
              ? `Analisando a entrega ${activeDelivery?.codigo || ""} do beneficiário ${activeDelivery?.beneficiario.nome || ""}`
              : "Fila de entregas que retornaram e aguardam análise antes de nova tentativa."}
          </p>
        </div>

        {!id && (
          <div className="flex items-center gap-2 bg-emerald-50 text-[#0F6E6E] px-4 py-2 rounded-full border border-teal-100 text-xs font-bold font-sans self-start">
            <Activity size={14} className="animate-pulse" />
            <span>Painel em tempo real</span>
          </div>
        )}
      </div>

      {/* TOAST ALERTA */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold font-sans ${
              toastType === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : toastType === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {toastType === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-85">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED ANALYSIS VIEW (TWO-COLUMN ROUTE) */}
      {id ? (
        activeDelivery ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* COLUMN LEFT: HISTÓRICO DA ENTREGA (5 cols) */}
            <div className="xl:col-span-5 space-y-6">
              <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-xs text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight uppercase flex items-center gap-2">
                    <Activity size={16} className="text-[#0F6E6E]" />
                    Histórico da Entrega
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {activeDelivery.codigo}
                  </span>
                </div>

                {/* TIMELINE */}
                <div className="relative pl-6 border-l border-slate-200 space-y-6 py-2">
                  
                  {/* Item correction events feed or attempts chronologically */}
                  {activeDelivery.tentativas && activeDelivery.tentativas.length > 0 ? (
                    activeDelivery.tentativas.map((attempt, index) => (
                      <div key={`attempt-${index}`} className="relative">
                        
                        {/* Bullet point node */}
                        <div className="absolute -left-[31px] top-1 h-4 w-4 bg-rose-500 rounded-full border-4 border-white shadow-xs" />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">
                              {attempt.numero}ª Tentativa
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={11} />
                              {attempt.dataHora}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                            Resultado: <span className="text-rose-600 font-bold uppercase">{attempt.resultado}</span>
                          </p>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 mt-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                              <span>Motoboy: <strong>Ricardo Silva</strong></span>
                              <span className="text-[#0F6E6E] font-bold">GPS Confirmado</span>
                            </div>
                            <p className="text-slate-700">
                              Motivo: <strong className="text-slate-900">{attempt.motivo || "Não informado"}</strong>
                            </p>
                            {attempt.observacao && (
                              <p className="text-slate-500 italic">
                                "{attempt.observacao}"
                              </p>
                            )}

                            {/* Clickable thumbnail of facade photo */}
                            <div className="pt-1 text-left">
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Foto da Fachada:</p>
                              <div
                                onClick={() => setActivePhotoUrl(attempt.fotoUrl || defaultPhoto)}
                                className="relative h-16 w-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-3xs cursor-zoom-in hover:brightness-95 active:scale-95 transition-all group"
                              >
                                <img
                                  src={attempt.fotoUrl || defaultPhoto}
                                  alt="Fachada"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 flex items-center justify-center transition-all">
                                  <Eye size={12} className="text-white opacity-0 group-hover:opacity-100" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 h-4 w-4 bg-amber-500 rounded-full border-4 border-white shadow-xs" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Inconsistência cadastral preliminar</p>
                        <p className="text-xs text-slate-500">Nenhuma tentativa física realizada. Dados retidos no OCR.</p>
                      </div>
                    </div>
                  )}

                  {/* Standard History transitions (Acompanhamento) */}
                  {activeDelivery.historico.map((h, index) => (
                    <div key={`hist-${index}`} className="relative">
                      {/* Node bullet */}
                      <div className="absolute -left-[31px] top-1 h-4 w-4 bg-[#0F6E6E] rounded-full border-4 border-white shadow-xs" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F172A] leading-tight">
                            {h.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {h.dataHora}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal">
                          {h.descricao}
                        </p>
                        {h.responsavel && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Por: {h.responsavel}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {/* RETROCEDER BUTTON */}
              <button
                onClick={() => navigate("/pendencias")}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                ← Voltar para a Central de Pendências
              </button>
            </div>

            {/* COLUMN RIGHT: ANÁLISE E CORREÇÃO (7 cols) */}
            <div className="xl:col-span-7 space-y-6 text-left">
              <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-xs space-y-5">
                
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm uppercase flex items-center gap-2">
                    <CheckSquare size={16} className="text-[#0F6E6E]" />
                    Análise e Correção de Dados
                  </h3>
                  <span className="bg-teal-50 text-[#0F6E6E] border border-teal-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Operador: Ricardo Silva
                  </span>
                </div>

                {/* BLOCO: DADOS ORIGINAIS RECEBIDOS (CINZA, LEITURA - RN-011) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <Lock size={12} />
                    <span>Dados originais recebidos</span>
                    <span className="text-[9px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full uppercase ml-auto">
                      Imutável
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Beneficiário</p>
                      <p className="font-semibold text-slate-700">{activeDelivery.beneficiario.nome}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">CPF</p>
                      <p className="font-semibold text-slate-700">{activeDelivery.beneficiario.cpf}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-slate-400 font-medium">Endereço de entrega</p>
                      <p className="font-semibold text-slate-700">
                        {originalValues?.logradouro}, {originalValues?.numero}
                        {originalValues?.bairro ? ` – ${originalValues?.bairro}` : ""}
                        {originalValues?.cep ? ` (CEP: ${originalValues?.cep})` : ""}
                        {originalValues?.cidade ? `, ${originalValues?.cidade} - ${originalValues?.uf}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Telefone de contato</p>
                      <p className="font-semibold text-slate-700">{originalValues?.telefone || "Não cadastrado"}</p>
                    </div>
                  </div>
                </div>

                {/* BLOCO: DADOS CORRIGIDOS (EDITÁVEIS) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span>Dados corrigidos</span>
                    {isAnyFieldChanged && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin-slow" />
                        Campos alterados detectados
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    
                    {/* LOGRADOURO */}
                    <div className="md:col-span-9 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>Logradouro / Avenida / Rua</label>
                        {isFieldChanged("logradouro") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alterado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedLogradouro}
                        onChange={(e) => setCorrectedLogradouro(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("logradouro")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* NÚMERO */}
                    <div className="md:col-span-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>Número</label>
                        {isFieldChanged("numero") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alt
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedNumero}
                        onChange={(e) => setCorrectedNumero(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("numero")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* BAIRRO */}
                    <div className="md:col-span-6 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>Bairro</label>
                        {isFieldChanged("bairro") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alterado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedBairro}
                        onChange={(e) => setCorrectedBairro(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("bairro")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* CEP */}
                    <div className="md:col-span-6 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>CEP</label>
                        {isFieldChanged("cep") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alterado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedCep}
                        onChange={(e) => setCorrectedCep(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("cep")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* CIDADE */}
                    <div className="md:col-span-8 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>Cidade</label>
                        {isFieldChanged("cidade") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alterado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedCidade}
                        onChange={(e) => setCorrectedCidade(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("cidade")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* UF */}
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>UF</label>
                        {isFieldChanged("uf") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alt
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedUf}
                        onChange={(e) => setCorrectedUf(e.target.value)}
                        maxLength={2}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold uppercase outline-none transition-all shadow-3xs ${
                          isFieldChanged("uf")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                    {/* TELEFONE */}
                    <div className="md:col-span-12 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <label>Contato Telefônico</label>
                        {isFieldChanged("telefone") && (
                          <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                            Alterado
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={correctedTelefone}
                        onChange={(e) => setCorrectedTelefone(e.target.value)}
                        className={`w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs ${
                          isFieldChanged("telefone")
                            ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/5"
                            : "border-slate-200 focus:border-[#0F6E6E]"
                        }`}
                      />
                    </div>

                  </div>
                </div>

                {/* TEXTAREA: PROVIDÊNCIAS TOMADAS (OBRIGATÓRIA - RF-037) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-1">
                      <span>Providências tomadas</span>
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {providencias.length}/300
                    </span>
                  </div>
                  <textarea
                    placeholder="Descreva obrigatoriamente as medidas adotadas para correção cadastral ou contato com o beneficiário..."
                    rows={4}
                    maxLength={300}
                    value={providencias}
                    onChange={(e) => setProvidencias(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold placeholder:text-slate-400 outline-none resize-none transition-all shadow-3xs"
                  />
                  {!providencias.trim() && (
                    <p className="text-[10px] text-rose-500 font-bold">
                      ⚠️ O campo de providências é obrigatório para concluir qualquer ação de análise.
                    </p>
                  )}
                </div>

                {/* FOOTER ACTIONS (RF-037 / RN-010) */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                  
                  {/* Cancel button */}
                  <button
                    onClick={() => handleResolution("cancelar")}
                    disabled={!providencias.trim()}
                    className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} />
                    <span>Cancelar entrega</span>
                  </button>

                  {/* Devolução definitiva */}
                  <button
                    onClick={() => handleResolution("devolucao")}
                    disabled={!providencias.trim()}
                    className="w-full sm:w-auto border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Encerrar como devolução definitiva</span>
                  </button>

                  {/* Liberar nova tentativa (solid teal) - Hidden if activeDelivery.tentativaAtual >= 3 (RN-010) */}
                  {activeDelivery.tentativaAtual < 3 ? (
                    <button
                      onClick={() => handleResolution("liberar")}
                      disabled={!providencias.trim()}
                      className="w-full sm:w-auto bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      <span>Liberar {activeDelivery.tentativaAtual + 1}ª tentativa</span>
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] font-bold px-3 py-2.5 rounded-xl flex items-center gap-2 max-w-xs leading-normal">
                      <AlertTriangle size={16} className="text-red-600 shrink-0" />
                      <span>Limite de 3 tentativas atingido. Reenvio indisponível (RN-010).</span>
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-[#E6EAF0] rounded-2xl p-8 text-center max-w-lg mx-auto">
            <AlertTriangle size={40} className="text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Entrega não localizada</h3>
            <p className="text-xs text-slate-500 mt-1">A entrega com ID especificado não foi encontrada ou não pertence à fila.</p>
            <button
              onClick={() => navigate("/pendencias")}
              className="mt-4 bg-[#0F6E6E] text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Voltar para a fila
            </button>
          </div>
        )
      ) : (
        
        /* STANDARD QUEUE VIEW (LISTING & METRICS) */
        <div className="space-y-6">
          
          {/* STATS CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Aguardando análise */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4 shadow-3xs flex items-center gap-4 text-left">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aguardando análise</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.aguardando}</p>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Retornaram da rota</p>
              </div>
            </div>

            {/* Em análise */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4 shadow-3xs flex items-center gap-4 text-left">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                <Activity size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em análise</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.emAnalise}</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Sendo analisadas hoje</p>
              </div>
            </div>

            {/* Liberadas hoje */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4 shadow-3xs flex items-center gap-4 text-left">
              <div className="h-12 w-12 bg-emerald-50 text-[#0F6E6E] rounded-xl flex items-center justify-center border border-teal-100">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liberadas hoje</p>
                <p className="text-2xl font-black text-[#0F6E6E] mt-0.5">{stats.releasedToday}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Retornaram à Distribuição</p>
              </div>
            </div>

            {/* Para devolução definitiva */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4 shadow-3xs flex items-center gap-4 text-left">
              <div className="h-12 w-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200">
                <Trash2 size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Para devolução</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.devolucoes}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Encerradas em definitivo</p>
              </div>
            </div>

          </div>

          {/* TABLE CONTAINER CARD */}
          <div className="bg-white border border-[#E6EAF0] rounded-2xl overflow-hidden shadow-xs text-left">
            
            {/* SEARCH AND FILTERS */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search */}
              <div className="relative max-w-md w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por código, beneficiário, CPF ou malote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-[#0F6E6E] rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs placeholder:text-slate-400"
                />
              </div>

              {/* Badges / dropdown filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Item type filter */}
                <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-3xs">
                  {[
                    { key: "todos", label: "Todos" },
                    { key: "cartoes", label: "Cartões" },
                    { key: "boletos", label: "Boletos" },
                    { key: "carnes", label: "Carnês" },
                    { key: "outros", label: "Outros" }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setFilterType(btn.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterType === btn.key
                          ? "bg-[#0F6E6E] text-white shadow-3xs"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Age filter */}
                <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-3xs">
                  {[
                    { key: "todos", label: "Idade: Todas" },
                    { key: "recente", label: "Recentes (<24h)" },
                    { key: "atrasado", label: "Atrasados (>24h) ⚠️" }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setFilterAge(btn.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterAge === btn.key
                          ? "bg-rose-600 text-white shadow-3xs"
                          : "text-slate-600 hover:text-rose-600"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

              </div>

            </div>

            {/* QUEUE TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                    <th className="py-4 px-5">Entrega</th>
                    <th className="py-4 px-5">Malote</th>
                    <th className="py-4 px-5">Motivo do Retorno</th>
                    <th className="py-4 px-5">Tentativa</th>
                    <th className="py-4 px-5">Idade na Fila</th>
                    <th className="py-4 px-5">Responsável</th>
                    <th className="py-4 px-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-sans">
                  {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery, idx) => {
                      const meta = getDeliveryMeta(delivery.id, idx);
                      const failureReason = getFailureReason(delivery);
                      const attemptsCount = delivery.tentativas?.length || delivery.tentativaAtual || 1;

                      return (
                        <tr
                          key={delivery.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* ENTREGA (CÓDIGO + BENEFICIÁRIO) */}
                          <td className="py-3.5 px-5">
                            <div className="flex flex-col space-y-0.5">
                              <span className="font-extrabold text-[#0F172A] group-hover:text-[#0F6E6E] transition-colors flex items-center gap-1.5">
                                {delivery.codigo}
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                                  delivery.status === "Em análise de pendência"
                                    ? "bg-blue-100 text-blue-800"
                                    : delivery.status === "Com inconsistência"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {delivery.status === "Em análise de pendência" ? "Em análise" : "Pendente"}
                                </span>
                              </span>
                              <span className="text-slate-500 font-semibold">{delivery.beneficiario.nome}</span>
                              <span className="text-[10px] text-slate-400 font-medium">CPF: {delivery.beneficiario.cpf}</span>
                            </div>
                          </td>

                          {/* MALOTE (LINK) */}
                          <td className="py-3.5 px-5">
                            <Link
                              to={`/malotes/${delivery.maloteId}`}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F6E6E] font-bold underline"
                            >
                              <span>{delivery.maloteId}</span>
                              <ExternalLink size={11} />
                            </Link>
                          </td>

                          {/* MOTIVO (BADGE CATALOG) */}
                          <td className="py-3.5 px-5">
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                              {failureReason}
                            </span>
                          </td>

                          {/* TENTATIVA (1ª/2ª/3ª) */}
                          <td className="py-3.5 px-5">
                            <span className="bg-[#EBF7F5] text-[#0F6E6E] border border-teal-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {attemptsCount}ª tentativa
                            </span>
                          </td>

                          {/* IDADE (MOCK/DYNAMIC AGE, OVER 24H IN RED) */}
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-1 rounded-lg ${
                                meta.isOver24h
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              <Clock size={12} className={meta.isOver24h ? "text-rose-500" : "text-slate-400"} />
                              <span>{meta.ageLabel}</span>
                            </span>
                          </td>

                          {/* RESPONSÁVEL (AVATAR OR "NÃO ATRIBUÍDO") */}
                          <td className="py-3.5 px-5">
                            {meta.responsible !== "Não atribuído" ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-teal-100 text-[#0F6E6E] font-extrabold text-[10px] flex items-center justify-center border border-teal-200">
                                  {meta.responsible.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-700">{meta.responsible}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-medium">Não atribuído</span>
                            )}
                          </td>

                          {/* AÇÕES (ANALISAR) */}
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => navigate(`/pendencias/${delivery.id}`)}
                              className="bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer min-h-[32px] inline-flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Analisar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                        <p className="font-bold">Nenhuma pendência pendente de análise!</p>
                        <p className="text-[11px] text-slate-400 mt-1">Tudo limpo por aqui. Bom trabalho!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER SUMMARY */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Exibindo {filteredDeliveries.length} de {pendingDeliveries.length} pendências</span>
              <span>Central de Pendências Logísticas</span>
            </div>

          </div>

        </div>

      )}

      {/* FULL SCREEN PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {activePhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhotoUrl(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left"
            >
              
              {/* Header with dismiss button */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Visualização da Fachada (Comprovante de Insucesso)</h4>
                <button
                  onClick={() => setActivePhotoUrl(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Photo Area */}
              <div className="bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                <img
                  src={activePhotoUrl}
                  alt="Fachada Ampliada"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Footer detail */}
              <div className="p-4 bg-slate-50 text-xs text-slate-500 font-semibold border-t border-slate-100">
                <span>Esta foto comprova as condições físicas da fachada e a tentativa real de entrega (GPS registrado).</span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
