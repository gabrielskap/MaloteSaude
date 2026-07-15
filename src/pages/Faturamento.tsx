import React, { useState, useEffect, useMemo } from "react";
import { useMalote } from "../context/MaloteContext";
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Edit2,
  X,
  FileSpreadsheet,
  User,
  DollarSign,
  Calendar,
  Filter,
  Check,
  TrendingUp
} from "lucide-react";
import { StatusEntrega, Cliente, Entrega, Malote } from "../types";

// Type definitions for Billing
export interface RegraCorrida {
  id: string;
  clienteId: string; // 'Todos' or specific client ID
  clienteNome: string;
  regiaoCep: string; // e.g. 'Zona Sul', 'Centro', 'Zona Leste', etc.
  tipoItem: string; // 'Cartão' | 'Boleto' | 'Carnê' | 'Todos' etc.
  tentativa: string; // '1ª Tentativa' | '2ª Tentativa' | '3ª Tentativa' | 'Todas'
  vigenciaInicio: string; // YYYY-MM-DD
  vigenciaFim: string; // YYYY-MM-DD
  valor: number;
  status: "Ativo" | "Inativo";
}

export interface AjusteFaturamento {
  id: string;
  entregaId: string;
  entregaCodigo: string;
  clienteNome: string;
  valorOriginal: number;
  valorNovo: number;
  justificativa: string;
  quemLancou: string;
  quemAprovou: string;
  dataHora: string;
}

export default function Faturamento() {
  const { state, dispatch } = useMalote();

  // --- PERSISTENCE & LOCAL STATE INITIALIZATION ---
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>("Maio/2025");
  const [selectedCliente, setSelectedCliente] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"previa" | "corridas" | "ajustes">("previa");

  // Competência situations dictionary (persists on localStorage)
  const [situacoesMap, setSituacoesMap] = useState<{ [key: string]: "Em revisão" | "Aprovado" | "Fechado" | "Reaberto" }>(() => {
    const saved = localStorage.getItem("malote_faturamento_situacoes");
    return saved ? JSON.parse(saved) : { "Maio/2025": "Em revisão", "Abril/2025": "Fechado", "Junho/2025": "Em revisão" };
  });

  // Active situation based on selected competence
  const situacaoAtual = situacoesMap[selectedCompetencia] || "Em revisão";

  // Save situations map to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("malote_faturamento_situacoes", JSON.stringify(situacoesMap));
  }, [situacoesMap]);

  // Regras de corrida (Vigências e valores)
  const [regras, setRegras] = useState<RegraCorrida[]>(() => {
    const saved = localStorage.getItem("malote_faturamento_regras");
    if (saved) return JSON.parse(saved);

    // Initial default rules
    return [
      {
        id: "regra-1",
        clienteId: "cli-1",
        clienteNome: "Hospital São Lucas",
        regiaoCep: "Zona Sul",
        tipoItem: "Todos",
        tentativa: "1ª Tentativa",
        vigenciaInicio: "2025-05-01",
        vigenciaFim: "2025-05-31",
        valor: 16.50,
        status: "Ativo"
      },
      {
        id: "regra-2",
        clienteId: "cli-1",
        clienteNome: "Hospital São Lucas",
        regiaoCep: "Zona Sul",
        tipoItem: "Todos",
        tentativa: "2ª Tentativa",
        vigenciaInicio: "2025-05-01",
        vigenciaFim: "2025-05-31",
        valor: 0.00, // Second attempt free
        status: "Ativo"
      },
      {
        id: "regra-3",
        clienteId: "cli-1",
        clienteNome: "Hospital São Lucas",
        regiaoCep: "Zona Sul",
        tipoItem: "Todos",
        tentativa: "3ª Tentativa",
        vigenciaInicio: "2025-05-01",
        vigenciaFim: "2025-05-31",
        valor: 12.00,
        status: "Ativo"
      },
      {
        id: "regra-4",
        clienteId: "cli-2",
        clienteNome: "Clínica Vida Plena",
        regiaoCep: "Centro",
        tipoItem: "Todos",
        tentativa: "Todas",
        vigenciaInicio: "2025-05-01",
        vigenciaFim: "2025-05-31",
        valor: 14.00,
        status: "Ativo"
      },
      {
        id: "regra-5",
        clienteId: "cli-3",
        clienteNome: "Laboratório Saúde+",
        regiaoCep: "Zona Leste",
        tipoItem: "Carnê",
        tentativa: "1ª Tentativa",
        vigenciaInicio: "2025-05-01",
        vigenciaFim: "2025-05-31",
        valor: 18.00,
        status: "Ativo"
      },
      {
        id: "regra-6",
        clienteId: "Todos",
        clienteNome: "Todos os Clientes",
        regiaoCep: "Todas as regiões",
        tipoItem: "Todos",
        tentativa: "Todas",
        vigenciaInicio: "2025-04-01",
        vigenciaFim: "2025-06-30",
        valor: 15.00,
        status: "Ativo"
      }
    ];
  });

  // Save rules to localStorage
  useEffect(() => {
    localStorage.setItem("malote_faturamento_regras", JSON.stringify(regras));
  }, [regras]);

  // Adjustments map (persists on localStorage)
  const [ajustes, setAjustes] = useState<AjusteFaturamento[]>(() => {
    const saved = localStorage.getItem("malote_faturamento_ajustes");
    return saved ? JSON.parse(saved) : [];
  });

  // Save adjustments to localStorage
  useEffect(() => {
    localStorage.setItem("malote_faturamento_ajustes", JSON.stringify(ajustes));
  }, [ajustes]);

  // Toast / notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- MODAL STATES ---
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [selectedEntregaForAjuste, setSelectedEntregaForAjuste] = useState<Entrega | null>(null);
  const [ajusteNovoValor, setAjusteNovoValor] = useState<string>("");
  const [ajusteJustificativa, setAjusteJustificativa] = useState<string>("");
  const [ajusteAprovador, setAjusteAprovador] = useState<string>("");
  const [ajusteQuemLancou, setAjusteQuemLancou] = useState<string>("Ricardo Silva");
  const [ajusteError, setAjusteError] = useState<string | null>(null);

  const [isNovaRegraModalOpen, setIsNovaRegraModalOpen] = useState(false);
  const [novaRegraClienteId, setNovaRegraClienteId] = useState<string>("Todos");
  const [novaRegraRegiao, setNovaRegraRegiao] = useState<string>("Todas as regiões");
  const [novaRegraTipoItem, setNovaRegraTipoItem] = useState<string>("Todos");
  const [novaRegraTentativa, setNovaRegraTentativa] = useState<string>("Todas");
  const [novaRegraVigenciaInicio, setNovaRegraVigenciaInicio] = useState<string>("2025-05-01");
  const [novaRegraVigenciaFim, setNovaRegraVigenciaFim] = useState<string>("2025-05-31");
  const [novaRegraValor, setNovaRegraValor] = useState<string>("");
  const [novaRegraError, setNovaRegraError] = useState<string | null>(null);

  const [isConfirmReabrirModalOpen, setIsConfirmReabrirModalOpen] = useState(false);

  // --- DATE HELPER FUNCTION ---
  const getEntregaCompetencia = (dataRecebimentoStr: string): string => {
    if (!dataRecebimentoStr) return "";
    // format "25/05/2025 09:50"
    const parts = dataRecebimentoStr.split(" ");
    const dateParts = parts[0].split("/");
    if (dateParts.length < 3) return "";
    const month = dateParts[1];
    const year = dateParts[2];
    const monthNames: { [key: string]: string } = {
      "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
      "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
      "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
    };
    return `${monthNames[month]}/${year}`;
  };

  // Convert "DD/MM/YYYY HH:MM" to "YYYY-MM-DD"
  const getEntregaDataRef = (dataRecebimentoStr: string): string => {
    if (!dataRecebimentoStr) return "2025-05-26";
    const parts = dataRecebimentoStr.split(" ");
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    return "2025-05-26";
  };

  // Neighborhood mapping to regions
  const getBairroRegiao = (bairro: string): string => {
    if (["Vila Mariana", "Moema", "Ipiranga"].includes(bairro)) return "Zona Sul";
    if (["Consolação", "Bela Vista", "Cerqueira César"].includes(bairro)) return "Centro";
    if (["Tatuapé"].includes(bairro)) return "Zona Leste";
    if (["Pinheiros"].includes(bairro)) return "Zona Oeste";
    return "Centro"; // default fallback
  };

  // --- MATCHING PRICING ENGINE (RN-014) ---
  const matchRegraVigente = (
    entrega: Entrega,
    malote: Malote,
    tentativaNum: number
  ): { valor: number; regraId: string | null; matchedRule: RegraCorrida | null } => {
    const dataRef = getEntregaDataRef(malote.dataRecebimento);
    const regiao = getBairroRegiao(entrega.endereco.bairro);

    // Filter rules
    const matches = regras.filter((r) => {
      if (r.status !== "Ativo") return false;

      // Date range check
      if (r.vigenciaInicio > dataRef || dataRef > r.vigenciaFim) return false;

      // Client check
      if (r.clienteId !== "Todos" && r.clienteId !== malote.clienteId) return false;

      // Item type check
      if (r.tipoItem !== "Todos" && r.tipoItem !== entrega.tipoItem) return false;

      // Region check
      if (r.regiaoCep !== "Todas as regiões" && r.regiaoCep !== regiao && r.regiaoCep !== entrega.endereco.bairro) {
        return false;
      }

      // Attempt check
      const tentStr = `${tentativaNum}ª Tentativa`;
      if (r.tentativa !== "Todas" && r.tentativa !== tentStr) return false;

      return true;
    });

    if (matches.length === 0) {
      // Fallback default price: 1ª attempt gets R$ 14.00, subsequent attempts are free
      return {
        valor: tentativaNum === 1 ? 14.00 : 0.00,
        regraId: null,
        matchedRule: null
      };
    }

    // Sort by specificity
    // Specific Client + Specific Item + Specific Region > Specific Client + all > etc.
    const scoredMatches = matches.map((r) => {
      let score = 0;
      if (r.clienteId !== "Todos") score += 1000;
      if (r.tipoItem !== "Todos") score += 100;
      if (r.regiaoCep !== "Todas as regiões") score += 10;
      if (r.tentativa !== "Todas") score += 1;
      return { rule: r, score };
    });

    scoredMatches.sort((a, b) => b.score - a.score);
    const bestRule = scoredMatches[0].rule;

    return {
      valor: bestRule.valor,
      regraId: bestRule.id,
      matchedRule: bestRule
    };
  };

  // Calculate full list of attempts and costs for a delivery
  const calculateEntregaFaturamento = (entrega: Entrega, malote: Malote) => {
    // Determine number of attempts made
    const countTentativas = entrega.tentativas && entrega.tentativas.length > 0 
      ? entrega.tentativas.length 
      : (entrega.status === "Entregue" ? 1 : 0);

    const attemptsDetails: { num: number; cobrado: boolean; valor: number; ruleId: string | null }[] = [];
    let sumCalculado = 0;

    for (let i = 1; i <= Math.max(countTentativas, 1); i++) {
      const match = matchRegraVigente(entrega, malote, i);
      const isCobrado = match.valor > 0;
      attemptsDetails.push({
        num: i,
        cobrado: isCobrado,
        valor: match.valor,
        ruleId: match.regraId
      });
      // Sum only if attempts are actually within the number of performed attempts (otherwise fallback default attempts pricing)
      if (i <= countTentativas) {
        sumCalculado += match.valor;
      }
    }

    // Cancelled deliveries don't cost anything
    if (entrega.status === "Cancelada") {
      sumCalculado = 0;
    }

    // Check manual adjustment override
    const latestAjuste = ajustes.find((a) => a.entregaId === entrega.id);
    const valorFinal = latestAjuste ? latestAjuste.valorNovo : sumCalculado;
    const diferencaAjuste = latestAjuste ? latestAjuste.valorNovo - sumCalculado : 0;

    return {
      attempts: attemptsDetails,
      countTentativas,
      valorCalculado: sumCalculado,
      valorFinal,
      diferencaAjuste,
      ajuste: latestAjuste
    };
  };

  // --- FILTERED MEMORY OF CALCULATIONS ---
  const memoryCalculations = useMemo(() => {
    return state.entregas
      .map((e) => {
        const malote = state.malotes.find((m) => m.id === e.maloteId);
        return {
          entrega: e,
          malote,
          clienteNome: malote ? state.clientes.find((c) => c.id === malote.clienteId)?.nome || "Não encontrado" : "Não encontrado",
          clienteId: malote?.clienteId || "",
          competencia: malote ? getEntregaCompetencia(malote.dataRecebimento) : "",
          faturamento: malote ? calculateEntregaFaturamento(e, malote) : null
        };
      })
      .filter((item) => {
        if (!item.malote || !item.faturamento) return false;

        // Selected competence check
        if (item.competencia !== selectedCompetencia) return false;

        // Selected client check
        if (selectedCliente !== "Todos" && item.clienteId !== selectedCliente) return false;

        // Search text check (Code, Beneficiary name, or tracking code)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchCode = item.entrega.codigo.toLowerCase().includes(query);
          const matchTracking = item.entrega.codigoRastreio.toLowerCase().includes(query);
          const matchName = item.entrega.beneficiario.nome.toLowerCase().includes(query);
          const matchMalote = item.malote.codigo.toLowerCase().includes(query);
          if (!matchCode && !matchTracking && !matchName && !matchMalote) return false;
        }

        return true;
      });
  }, [state.entregas, state.malotes, state.clientes, selectedCompetencia, selectedCliente, searchQuery, regras, ajustes]);

  // --- SUMMARY CARDS METRICS ---
  const metrics = useMemo(() => {
    let countFaturaveis = 0;
    let sumCalculado = 0;
    let sumAjustes = 0;
    let sumFinal = 0;

    memoryCalculations.forEach((item) => {
      // Delivered or definitive return statuses are typical final states that are counted
      if (["Entregue", "Devolução definitiva", "Tentativa sem sucesso"].includes(item.entrega.status)) {
        countFaturaveis++;
      }
      sumCalculado += item.faturamento?.valorCalculado || 0;
      sumAjustes += item.faturamento?.diferencaAjuste || 0;
      sumFinal += item.faturamento?.valorFinal || 0;
    });

    return {
      countFaturaveis,
      sumCalculado,
      sumAjustes,
      sumFinal
    };
  }, [memoryCalculations]);

  // --- CRUD RULES ACTIONS ---
  const handleAddRegra = (e: React.FormEvent) => {
    e.preventDefault();
    setNovaRegraError(null);

    const valorNum = parseFloat(novaRegraValor);
    if (isNaN(valorNum) || valorNum < 0) {
      setNovaRegraError("O valor da tarifa deve ser um número maior ou igual a zero.");
      return;
    }

    if (!novaRegraVigenciaInicio || !novaRegraVigenciaFim) {
      setNovaRegraError("Informe as datas de vigência de início e término.");
      return;
    }

    if (novaRegraVigenciaInicio > novaRegraVigenciaFim) {
      setNovaRegraError("A data de início da vigência não pode ser posterior à data de término.");
      return;
    }

    const clientNome = novaRegraClienteId === "Todos" 
      ? "Todos os Clientes" 
      : state.clientes.find((c) => c.id === novaRegraClienteId)?.nome || novaRegraClienteId;

    const nova: RegraCorrida = {
      id: `regra-${Date.now()}`,
      clienteId: novaRegraClienteId,
      clienteNome: clientNome,
      regiaoCep: novaRegraRegiao,
      tipoItem: novaRegraTipoItem,
      tentativa: novaRegraTentativa,
      vigenciaInicio: novaRegraVigenciaInicio,
      vigenciaFim: novaRegraVigenciaFim,
      valor: valorNum,
      status: "Ativo"
    };

    setRegras((prev) => [nova, ...prev]);
    setIsNovaRegraModalOpen(false);
    
    // Log audit in context
    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Criação de Regra",
        entidade: "Tabela de Corridas",
        valorNovo: `Criada regra para ${clientNome} em ${novaRegraRegiao} (${novaRegraTentativa}) - R$ ${valorNum.toFixed(2)}`
      }
    });

    showToast("Nova regra de faturamento cadastrada com sucesso!");

    // Reset fields
    setNovaRegraValor("");
  };

  const toggleRegraStatus = (id: string) => {
    if (situacaoAtual === "Fechado") return;

    setRegras((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const novoStatus = r.status === "Ativo" ? "Inativo" : "Ativo";
          
          dispatch({
            type: "REGISTRAR_AUDITORIA",
            payload: {
              acao: "Alteração de Regra",
              entidade: "Tabela de Corridas",
              valorAnterior: `Regra ${r.id} - Status: ${r.status}`,
              valorNovo: `Status alterado para: ${novoStatus}`
            }
          });

          return { ...r, status: novoStatus as "Ativo" | "Inativo" };
        }
        return r;
      })
    );
    showToast("Status da regra alterado com sucesso!");
  };

  const deleteRegra = (id: string) => {
    if (situacaoAtual === "Fechado") return;

    const regra = regras.find((r) => r.id === id);
    if (!regra) return;

    setRegras((prev) => prev.filter((r) => r.id !== id));
    
    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Exclusão de Regra",
        entidade: "Tabela de Corridas",
        valorAnterior: `Regra ${regra.id} para ${regra.clienteNome} - Tarifa: R$ ${regra.valor.toFixed(2)}`
      }
    });

    showToast("Regra de corrida excluída com sucesso!", "info");
  };

  // --- ADJUSTMENT ACTIONS (RN-015) ---
  const handleOpenAjusteModal = (entrega: Entrega) => {
    if (situacaoAtual === "Fechado") return;
    
    const calculatedCost = calculateEntregaFaturamento(entrega, state.malotes.find(m => m.id === entrega.maloteId)!).valorCalculado;
    const existingAjuste = ajustes.find(a => a.entregaId === entrega.id);

    setSelectedEntregaForAjuste(entrega);
    setAjusteNovoValor(existingAjuste ? existingAjuste.valorNovo.toString() : calculatedCost.toString());
    setAjusteJustificativa(existingAjuste ? existingAjuste.justificativa : "");
    setAjusteAprovador(existingAjuste ? existingAjuste.quemAprovou : "");
    setAjusteQuemLancou("Ricardo Silva");
    setAjusteError(null);
    setIsAjusteModalOpen(true);
  };

  const handleSaveAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    setAjusteError(null);

    if (!selectedEntregaForAjuste) return;

    const novoVal = parseFloat(ajusteNovoValor);
    if (isNaN(novoVal) || novoVal < 0) {
      setAjusteError("O novo valor deve ser um número maior ou igual a zero.");
      return;
    }

    if (!ajusteJustificativa.trim() || ajusteJustificativa.trim().length < 5) {
      setAjusteError("A justificativa é obrigatória e deve conter pelo menos 5 caracteres.");
      return;
    }

    if (!ajusteAprovador.trim()) {
      setAjusteError("O nome do aprovador responsável é obrigatório.");
      return;
    }

    const malote = state.malotes.find((m) => m.id === selectedEntregaForAjuste.maloteId);
    const clienteNome = malote ? state.clientes.find((c) => c.id === malote.clienteId)?.nome || "Não encontrado" : "Não encontrado";
    
    // Core memory calculation of the delivery to see what was the original cost
    const originalCost = calculateEntregaFaturamento(selectedEntregaForAjuste, malote!).valorCalculado;

    // Filter existing adjustment for this delivery to replace if any, otherwise add
    const novoAjuste: AjusteFaturamento = {
      id: `ajuste-${Date.now()}`,
      entregaId: selectedEntregaForAjuste.id,
      entregaCodigo: selectedEntregaForAjuste.codigo,
      clienteNome,
      valorOriginal: originalCost,
      valorNovo: novoVal,
      justificativa: ajusteJustificativa,
      quemLancou: ajusteQuemLancou,
      quemAprovou: ajusteAprovador,
      dataHora: new Date().toLocaleString("pt-BR")
    };

    setAjustes((prev) => {
      const filtered = prev.filter((a) => a.entregaId !== selectedEntregaForAjuste.id);
      return [novoAjuste, ...filtered];
    });

    setIsAjusteModalOpen(false);

    // Context audit log
    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Ajuste Manual",
        entidade: "Faturamento",
        valorAnterior: `Entrega ${selectedEntregaForAjuste.codigo} - R$ ${originalCost.toFixed(2)}`,
        valorNovo: `Substituído para R$ ${novoVal.toFixed(2)} por justificativa de '${ajusteJustificativa}' (Aprovador: ${ajusteAprovador})`
      }
    });

    showToast(`Faturamento do item ${selectedEntregaForAjuste.codigo} ajustado com sucesso!`);
  };

  const removeAjuste = (entregaId: string) => {
    if (situacaoAtual === "Fechado") return;

    const ajuste = ajustes.find((a) => a.entregaId === entregaId);
    if (!ajuste) return;

    setAjustes((prev) => prev.filter((a) => a.entregaId !== entregaId));

    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Exclusão de Ajuste",
        entidade: "Faturamento",
        valorAnterior: `Ajuste manual da entrega ${ajuste.entregaCodigo} removido - Retornado ao original R$ ${ajuste.valorOriginal.toFixed(2)}`
      }
    });

    showToast(`Ajuste manual da entrega ${ajuste.entregaCodigo} removido com sucesso!`, "info");
  };

  // --- COMPETENCE CLOSURE ACTIONS (RN-016) ---
  const handleFecharCompetencia = () => {
    if (situacaoAtual === "Fechado") return;

    setSituacoesMap((prev) => ({
      ...prev,
      [selectedCompetencia]: "Fechado"
    }));

    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Fechamento de Competência",
        entidade: "Faturamento",
        valorAnterior: situacaoAtual,
        valorNovo: "Fechado",
        usuario: "Ricardo Silva"
      }
    });

    showToast(`Competência de ${selectedCompetencia} FECHADA com sucesso! A tela agora está bloqueada para edição.`);
  };

  const handleOpenReabrirConfirm = () => {
    setIsConfirmReabrirModalOpen(true);
  };

  const handleConfirmReabrir = () => {
    const valorAnterior = situacoesMap[selectedCompetencia] || "Fechado";

    setSituacoesMap((prev) => ({
      ...prev,
      [selectedCompetencia]: "Reaberto"
    }));

    setIsConfirmReabrirModalOpen(false);

    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Reabertura de Competência",
        entidade: "Faturamento",
        valorAnterior: valorAnterior,
        valorNovo: "Reaberto",
        usuario: "Ricardo Silva"
      }
    });

    showToast(`Competência de ${selectedCompetencia} REABERTA com sucesso. Novas alterações são permitidas e auditadas.`, "info");
  };

  const handleSetAprovado = () => {
    if (situacaoAtual === "Fechado") return;

    setSituacoesMap((prev) => ({
      ...prev,
      [selectedCompetencia]: "Aprovado"
    }));

    dispatch({
      type: "REGISTRAR_AUDITORIA",
      payload: {
        acao: "Aprovação de Competência",
        entidade: "Faturamento",
        valorAnterior: situacaoAtual,
        valorNovo: "Aprovado"
      }
    });

    showToast(`Competência de ${selectedCompetencia} alterada para APROVADO.`);
  };

  // --- RECALCULATE SIMULATOR ---
  const [isRecalculating, setIsRecalculating] = useState(false);
  const handleRecalcular = () => {
    if (situacaoAtual === "Fechado") return;

    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      
      dispatch({
        type: "REGISTRAR_AUDITORIA",
        payload: {
          acao: "Recálculo de Tarifas",
          entidade: "Faturamento",
          valorNovo: `Recalculado o período de ${selectedCompetencia} para ${selectedCliente !== "Todos" ? state.clientes.find(c => c.id === selectedCliente)?.nome : "Todos os Clientes"}`
        }
      });

      showToast("Faturamento recalculado com base nas vigências e tarifas vigentes!");
    }, 1200);
  };

  // --- EXPORT MOCK FILES ---
  const handleExportXLSX = () => {
    // Generate beautiful TSV content (compatible with Excel/Sheets)
    const headers = ["Entrega", "Malote", "Cliente", "Destino", "Bairro", "Status", "Tentativas", "Valor Calculado", "Ajuste", "Justificativa", "Valor Final"];
    const rows = memoryCalculations.map((item) => [
      item.entrega.codigo,
      item.malote?.codigo || "",
      item.clienteNome,
      getBairroRegiao(item.entrega.endereco.bairro),
      item.entrega.endereco.bairro,
      item.entrega.status,
      `${item.faturamento?.countTentativas} tentativa(s)`,
      item.faturamento?.valorCalculado.toFixed(2),
      item.faturamento?.diferencaAjuste.toFixed(2),
      item.faturamento?.ajuste?.justificativa || "",
      item.faturamento?.valorFinal.toFixed(2)
    ]);

    const content = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `faturamento_${selectedCompetencia.replace("/", "_")}_${selectedCliente}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Planilha XLSX da competência ${selectedCompetencia} exportada com sucesso!`);
  };

  const handleExportPDF = () => {
    // Elegant text-based layout formatted for printing
    const title = `=== FECHAMENTO LOGISTICO - MALOTE SAUDE ===\nCOMPETENCIA: ${selectedCompetencia} | CLIENTE: ${selectedCliente}\nSITUACAO: ${situacaoAtual}\nVALOR TOTAL CONSOLIDADO: R$ ${metrics.sumFinal.toFixed(2)}\n\n`;
    const details = memoryCalculations.map(item => 
      `[${item.entrega.codigo}] Malote: ${item.malote?.codigo} | Beneficiario: ${item.entrega.beneficiario.nome} | Regiao: ${getBairroRegiao(item.entrega.endereco.bairro)} | Status: ${item.entrega.status} | Final: R$ ${item.faturamento?.valorFinal.toFixed(2)}`
    ).join("\n");

    const content = title + "--- DETALHAMENTO DE ENTREGAS ---\n" + details;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `faturamento_${selectedCompetencia.replace("/", "_")}_${selectedCliente}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Relatório PDF da competência ${selectedCompetencia} exportado com sucesso!`);
  };

  return (
    <div className="space-y-6 fade-in text-[#0F172A] font-sans">
      
      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold animate-bounce bg-white text-[#0F6E6E] border-slate-100">
          <CheckCircle2 size={16} className="text-[#0F6E6E]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-3xs">
        
        {/* Title / Subtitle */}
        <div className="text-left space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-[#0F172A] font-display">
            Faturamento
          </h1>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Consolide as corridas do período e feche a competência.
          </p>
        </div>

        {/* SELECTORS & COMPETENCE STATUS BADGE */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Competência Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Competência:</span>
            <select
              value={selectedCompetencia}
              onChange={(e) => setSelectedCompetencia(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700 rounded-xl px-3 py-2 cursor-pointer outline-none transition-all"
            >
              <option value="Maio/2025">Maio/2025</option>
              <option value="Abril/2025">Abril/2025</option>
              <option value="Junho/2025">Junho/2025</option>
            </select>
          </div>

          {/* Client Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente:</span>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700 rounded-xl px-3 py-2 cursor-pointer outline-none transition-all max-w-[200px]"
            >
              <option value="Todos">Todos os clientes</option>
              {state.clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* SITUATION BADGE */}
          <div className="flex items-center gap-1">
            {situacaoAtual === "Em revisão" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Em revisão
              </span>
            )}
            {situacaoAtual === "Aprovado" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Aprovado
              </span>
            )}
            {situacaoAtual === "Fechado" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Lock size={12} className="text-emerald-700" />
                Fechado
              </span>
            )}
            {situacaoAtual === "Reaberto" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                <Unlock size={12} className="text-rose-700 animate-pulse" />
                Reaberto
              </span>
            )}
          </div>

        </div>

      </div>

      {/* READ ONLY BANNER IN "FECHADO" STATUS */}
      {situacaoAtual === "Fechado" && (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-col sm:flex-row gap-3 text-left shadow-3xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-slate-800 text-teal-400 rounded-lg flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Competência Fechada & Bloqueada</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">As corridas foram consolidadas e estão protegidas contra alterações. Modo somente leitura ativo.</p>
            </div>
          </div>

          <button
            onClick={handleOpenReabrirConfirm}
            className="text-xs font-extrabold text-rose-400 bg-rose-950/20 hover:bg-rose-950/50 hover:text-white px-3.5 py-2 rounded-xl border border-rose-900/30 transition-all shrink-0 cursor-pointer"
          >
            Reabrir competência
          </button>
        </div>
      )}

      {/* CORE ACTIONS ROW (RN-016 & RF-055) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Side: Dynamic action helper text */}
        <p className="text-xs font-bold text-slate-500">
          Mostrando {memoryCalculations.length} item(ns) para {selectedCompetencia}
        </p>

        {/* Right Side Actions Panel */}
        <div className="flex flex-wrap items-center gap-2">
          
          {situacaoAtual !== "Fechado" && (
            <>
              {/* Recalcular Button */}
              <button
                onClick={handleRecalcular}
                disabled={isRecalculating}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRecalculating ? "animate-spin" : ""} />
                <span>{isRecalculating ? "Recalculando..." : "Recalcular"}</span>
              </button>

              {/* Set Approved Button */}
              {situacaoAtual !== "Aprovado" && (
                <button
                  onClick={handleSetAprovado}
                  className="bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-3xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>Aprovar faturamento</span>
                </button>
              )}
            </>
          )}

          {/* Export Actions (always visible but nice download buttons) */}
          <button
            onClick={handleExportXLSX}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Exportar XLSX</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Exportar PDF</span>
          </button>

          {/* Fechar competência (hidden if already closed) */}
          {situacaoAtual !== "Fechado" && (
            <button
              onClick={handleFecharCompetencia}
              className="bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Lock size={14} />
              <span>Fechar competência</span>
            </button>
          )}

        </div>

      </div>

      {/* METRICS FOUR CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Entregas Faturáveis */}
        <div className="bg-white border border-[#E6EAF0] p-5 rounded-2xl text-left space-y-2 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas faturáveis</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0F172A] tracking-tight">
              {metrics.countFaturaveis}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              finalizadas
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">Itens aptos ao encerramento fiscal no período.</p>
        </div>

        {/* Card 2: Valor Calculado */}
        <div className="bg-white border border-[#E6EAF0] p-5 rounded-2xl text-left space-y-2 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor calculado</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-700 tracking-tight">
              R$ {metrics.sumCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              vigência nominal
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">Valor bruto gerado pelas regras de vigências.</p>
        </div>

        {/* Card 3: Ajustes Manuais */}
        <div className="bg-white border border-[#E6EAF0] p-5 rounded-2xl text-left space-y-2 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajustes manuais</p>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black tracking-tight ${metrics.sumAjustes > 0 ? "text-amber-700" : metrics.sumAjustes < 0 ? "text-emerald-700" : "text-slate-500"}`}>
              {metrics.sumAjustes >= 0 ? "+" : ""}R$ {metrics.sumAjustes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              diferença
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">Soma das correções manuais com aprovação.</p>
        </div>

        {/* Card 4: Valor Final (Destaque Teal) */}
        <div className="bg-[#E8F4F2] border border-[#BFDFDB] p-5 rounded-2xl text-left space-y-2 shadow-3xs">
          <p className="text-[10px] font-bold text-[#0F6E6E] uppercase tracking-wider">Valor final faturado</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0F6E6E] tracking-tight">
              R$ {metrics.sumFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-[#0F6E6E]">
              líquido
            </span>
          </div>
          <p className="text-[10px] text-[#0F6E6E]/80 font-semibold leading-tight">Montante final faturável do período para o cliente.</p>
        </div>

      </div>

      {/* CORE CARDS TAB SYSTEM */}
      <div className="bg-white border border-[#E6EAF0] rounded-2xl shadow-sm overflow-hidden text-left">
        
        {/* TABS SELECTOR HEADERS */}
        <div className="flex flex-col sm:flex-row border-b border-slate-100 bg-slate-50/50 p-1">
          <div className="flex flex-1 gap-1">
            <button
              onClick={() => setActiveTab("previa")}
              className={`flex-1 sm:flex-initial px-5 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "previa"
                  ? "bg-white text-[#0F6E6E] shadow-3xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Prévia do fechamento</span>
            </button>

            <button
              onClick={() => setActiveTab("corridas")}
              className={`flex-1 sm:flex-initial px-5 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "corridas"
                  ? "bg-white text-[#0F6E6E] shadow-3xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TrendingUp size={14} />
              <span>Tabela de corridas (Regras)</span>
            </button>

            <button
              onClick={() => setActiveTab("ajustes")}
              className={`flex-1 sm:flex-initial px-5 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "ajustes"
                  ? "bg-white text-[#0F6E6E] shadow-3xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={14} />
              <span>Ajustes manuais</span>
            </button>
          </div>

          {/* Inline Search Filter (Only relevant for Previa) */}
          {activeTab === "previa" && (
            <div className="p-1 sm:py-0 sm:pr-2 flex items-center">
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por código, beneficiário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          
          {/* TAB 1: PREVIA DO FECHAMENTO */}
          {activeTab === "previa" && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p>💡 A memória de cálculo exibe todas as tentativas registradas para cada item e calcula com base na vigência da tabela de corridas do dia da entrega.</p>
                <p className="font-bold text-[#0F6E6E]">Filtros: {selectedCompetencia} | {selectedCliente === "Todos" ? "Todos os clientes" : "Cliente Selecionado"}</p>
              </div>

              {/* MEMORY OF CALCULATION TABLE */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Entrega</th>
                      <th className="p-3.5">Malote</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Destino / Corrida</th>
                      <th className="p-3.5">Tentativas (Indicador de Cobrança)</th>
                      <th className="p-3.5 text-right">Calculado</th>
                      <th className="p-3.5 text-right">Ajuste</th>
                      <th className="p-3.5">Justificativa</th>
                      <th className="p-3.5 text-right">Valor Final</th>
                      <th className="p-3.5">Situação</th>
                      {situacaoAtual !== "Fechado" && <th className="p-3.5 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#0F172A]">
                    {memoryCalculations.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                          Nenhuma entrega localizada para os filtros selecionados nesta competência.
                        </td>
                      </tr>
                    ) : (
                      memoryCalculations.map((item) => {
                        const fat = item.faturamento!;
                        const hasAjuste = !!fat.ajuste;

                        return (
                          <tr
                            key={item.entrega.id}
                            className={`transition-colors hover:bg-slate-50/50 ${hasAjuste ? "bg-amber-50/40 hover:bg-amber-50/70" : ""}`}
                          >
                            {/* Entrega */}
                            <td className="p-3.5">
                              <span className="font-extrabold text-slate-900 block">{item.entrega.codigo}</span>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">{item.entrega.codigoRastreio}</span>
                            </td>

                            {/* Malote */}
                            <td className="p-3.5 font-bold text-slate-600">
                              {item.malote?.codigo || "-"}
                            </td>

                            {/* Cliente */}
                            <td className="p-3.5 font-bold text-slate-600 max-w-[150px] truncate">
                              {item.clienteNome}
                            </td>

                            {/* Destino */}
                            <td className="p-3.5">
                              <span className="font-bold text-slate-700 block">{getBairroRegiao(item.entrega.endereco.bairro)}</span>
                              <span className="text-[10px] text-slate-400 font-semibold block">{item.entrega.endereco.bairro} ({item.entrega.endereco.cep})</span>
                            </td>

                            {/* Tentativas indicator */}
                            <td className="p-3.5">
                              <div className="flex flex-col gap-1 max-w-[190px]">
                                {fat.attempts.map((att) => (
                                  <div key={att.num} className="flex items-center justify-between text-[10px] font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/80">
                                    <span className="text-slate-500">{att.num}ª tentativa:</span>
                                    {att.cobrado ? (
                                      <span className="text-teal-700 font-bold">Cobrada (R$ {att.valor.toFixed(2)})</span>
                                    ) : (
                                      <span className="text-slate-400 font-bold">Isenta</span>
                                    )}
                                  </div>
                                ))}
                                <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Total feitas: {fat.countTentativas}</span>
                              </div>
                            </td>

                            {/* Calculado */}
                            <td className="p-3.5 text-right font-bold text-slate-600">
                              R$ {fat.valorCalculado.toFixed(2)}
                            </td>

                            {/* Ajuste */}
                            <td className={`p-3.5 text-right font-extrabold ${fat.diferencaAjuste > 0 ? "text-amber-700" : fat.diferencaAjuste < 0 ? "text-emerald-700" : "text-slate-400"}`}>
                              {fat.diferencaAjuste !== 0 ? (
                                <>
                                  {fat.diferencaAjuste > 0 ? "+" : ""}
                                  R$ {fat.diferencaAjuste.toFixed(2)}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Justificativa */}
                            <td className="p-3.5 text-slate-500 italic max-w-[130px] truncate" title={fat.ajuste?.justificativa}>
                              {fat.ajuste?.justificativa || "-"}
                            </td>

                            {/* Valor final */}
                            <td className="p-3.5 text-right font-black text-[#0F6E6E]">
                              R$ {fat.valorFinal.toFixed(2)}
                            </td>

                            {/* Situação badge */}
                            <td className="p-3.5">
                              {item.entrega.status === "Entregue" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                  Entregue
                                </span>
                              ) : item.entrega.status === "Devolução definitiva" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                  Devolvido
                                </span>
                              ) : item.entrega.status === "Cancelada" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-100">
                                  Cancelado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                  Pendente
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            {situacaoAtual !== "Fechado" && (
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenAjusteModal(item.entrega)}
                                    className="p-1 text-[#0F6E6E] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                    title="Ajustar valor manual"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  {hasAjuste && (
                                    <button
                                      onClick={() => removeAjuste(item.entrega.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Remover ajuste manual"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}

                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* TOTALIZERS FOOTER */}
                  {memoryCalculations.length > 0 && (
                    <tfoot className="bg-slate-100/50 font-black text-[#0F172A] border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={5} className="p-3.5 text-left text-xs uppercase tracking-wider font-extrabold">
                          Total Geral Consolidado ({memoryCalculations.length} entregas)
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-700 text-xs">
                          R$ {metrics.sumCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3.5 text-right font-black text-xs ${metrics.sumAjustes >= 0 ? "text-amber-800" : "text-emerald-800"}`}>
                          {metrics.sumAjustes >= 0 ? "+" : ""}R$ {metrics.sumAjustes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5"></td>
                        <td className="p-3.5 text-right font-extrabold text-[#0F6E6E] text-sm bg-teal-50">
                          R$ {metrics.sumFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: TABELA DE CORRIDAS (CRUD REGRAS) */}
          {activeTab === "corridas" && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Regras de Corrida Ativas</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Gerencie os valores de faturamento por cliente, região, faixa de CEP e vigências (RN-014).</p>
                </div>

                {situacaoAtual !== "Fechado" && (
                  <button
                    onClick={() => setIsNovaRegraModalOpen(true)}
                    className="bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Nova corrida</span>
                  </button>
                )}
              </div>

              {/* RULES GRID / TABLE */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Destino / Região / CEP</th>
                      <th className="p-3.5">Tipo de Entrega</th>
                      <th className="p-3.5">Tentativa Aplicável</th>
                      <th className="p-3.5">Vigência (Início e Fim)</th>
                      <th className="p-3.5 text-right">Tarifa</th>
                      <th className="p-3.5">Status</th>
                      {situacaoAtual !== "Fechado" && <th className="p-3.5 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {regras.map((regra) => (
                      <tr key={regra.id} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* Cliente */}
                        <td className="p-3.5 font-bold text-[#0F172A]">
                          {regra.clienteNome}
                        </td>

                        {/* Destino */}
                        <td className="p-3.5 font-bold text-slate-600">
                          {regra.regiaoCep}
                        </td>

                        {/* Tipo de item */}
                        <td className="p-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${regra.tipoItem === "Todos" ? "bg-slate-100 text-slate-700" : "bg-teal-50 text-teal-800"}`}>
                            {regra.tipoItem}
                          </span>
                        </td>

                        {/* Tentativa */}
                        <td className="p-3.5 font-bold">
                          {regra.tentativa}
                        </td>

                        {/* Vigência */}
                        <td className="p-3.5 text-slate-500 font-semibold">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span>
                              {regra.vigenciaInicio.split("-").reverse().join("/")}
                            </span>
                            <span className="text-slate-300">até</span>
                            <span>
                              {regra.vigenciaFim.split("-").reverse().join("/")}
                            </span>
                          </div>
                        </td>

                        {/* Tarifa */}
                        <td className="p-3.5 text-right font-black text-[#0F6E6E]">
                          R$ {regra.valor.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleRegraStatus(regra.id)}
                            disabled={situacaoAtual === "Fechado"}
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              regra.status === "Ativo"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                            } ${situacaoAtual === "Fechado" ? "pointer-events-none" : "cursor-pointer"}`}
                          >
                            {regra.status}
                          </button>
                        </td>

                        {/* Ações */}
                        {situacaoAtual !== "Fechado" && (
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => deleteRegra(regra.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir regra de tarifa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: LISTA DE AJUSTES MANUAIS */}
          {activeTab === "ajustes" && (
            <div className="space-y-4">
              
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico de Ajustes Manuais</h3>
                <p className="text-xs text-slate-500 mt-0.5">Auditoria cronológica de todas as correções de faturamento realizadas sob justificativa (RN-015).</p>
              </div>

              {/* ADJUSTMENTS TABLE */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Entrega</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5 text-right">Valor Original</th>
                      <th className="p-3.5 text-right">Novo Valor</th>
                      <th className="p-3.5 text-right">Diferença</th>
                      <th className="p-3.5">Motivo / Justificativa</th>
                      <th className="p-3.5">Lançado por</th>
                      <th className="p-3.5">Aprovado por</th>
                      <th className="p-3.5 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {ajustes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                          Nenhum ajuste manual registrado nesta competência.
                        </td>
                      </tr>
                    ) : (
                      ajustes.map((aj) => {
                        const dif = aj.valorNovo - aj.valorOriginal;
                        return (
                          <tr key={aj.id} className="hover:bg-slate-50/50 transition-colors">
                            
                            {/* Entrega */}
                            <td className="p-3.5 font-extrabold text-[#0F172A]">
                              {aj.entregaCodigo}
                            </td>

                            {/* Cliente */}
                            <td className="p-3.5 font-bold text-slate-600">
                              {aj.clienteNome}
                            </td>

                            {/* Original */}
                            <td className="p-3.5 text-right text-slate-500">
                              R$ {aj.valorOriginal.toFixed(2)}
                            </td>

                            {/* Novo */}
                            <td className="p-3.5 text-right font-black text-[#0F6E6E]">
                              R$ {aj.valorNovo.toFixed(2)}
                            </td>

                            {/* Diferença */}
                            <td className={`p-3.5 text-right font-extrabold ${dif > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                              {dif >= 0 ? "+" : ""}R$ {dif.toFixed(2)}
                            </td>

                            {/* Justificativa */}
                            <td className="p-3.5 text-slate-600 italic">
                              {aj.justificativa}
                            </td>

                            {/* Lançador */}
                            <td className="p-3.5 text-slate-500 font-semibold flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              <span>{aj.quemLancou}</span>
                            </td>

                            {/* Aprovador */}
                            <td className="p-3.5 font-bold text-slate-700">
                              {aj.quemAprovou}
                            </td>

                            {/* Data */}
                            <td className="p-3.5 text-right text-slate-400 text-[10px] font-semibold">
                              {aj.dataHora}
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: AJUSTE MANUAL DE VALOR (RN-015) */}
      {isAjusteModalOpen && selectedEntregaForAjuste && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-[#0F6E6E]" size={18} />
                <h4 className="font-bold text-[#0F172A] text-sm">Ajustar Faturamento Manual</h4>
              </div>
              <button
                onClick={() => setIsAjusteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAjuste} className="p-6 space-y-4">
              
              {/* Delivery Details Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                <p className="font-extrabold text-slate-800">Item: {selectedEntregaForAjuste.codigo}</p>
                <p className="text-slate-500 font-semibold">Plano: {selectedEntregaForAjuste.tipoItem} | Destino: {selectedEntregaForAjuste.endereco.bairro}</p>
                <p className="text-slate-400 font-bold uppercase text-[9px] mt-1">
                  Valor sugerido original: <strong className="text-slate-700 font-extrabold">R$ {calculateEntregaFaturamento(selectedEntregaForAjuste, state.malotes.find(m => m.id === selectedEntregaForAjuste.maloteId)!).valorCalculado.toFixed(2)}</strong>
                </p>
              </div>

              {/* Error block */}
              {ajusteError && (
                <div className="bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-rose-100 flex items-start gap-1.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{ajusteError}</span>
                </div>
              )}

              {/* Novo Valor Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Novo Valor Faturado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={ajusteNovoValor}
                  onChange={(e) => setAjusteNovoValor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold outline-none outline-0"
                />
              </div>

              {/* Justificativa Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Justificativa / Motivo do Ajuste *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="Justifique o motivo da alteração de tarifa..."
                  value={ajusteJustificativa}
                  onChange={(e) => setAjusteJustificativa(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              {/* Aprovador Input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Aprovado Por *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do gestor"
                    value={ajusteAprovador}
                    onChange={(e) => setAjusteAprovador(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lançado Por
                  </label>
                  <input
                    type="text"
                    disabled
                    value={ajusteQuemLancou}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold outline-none pointer-events-none"
                  />
                </div>
              </div>

              {/* Policy protection notes */}
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                ⚠️ * Conforme norma RN-015, ajustes manuais são auditados em tempo real e exigem justificativa fundamentada e nome do aprovador responsável.
              </p>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAjusteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirmar e Salvar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRO DE NOVA CORRIDA (CRUD REGRAS) */}
      {isNovaRegraModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-[#0F6E6E]" size={18} />
                <h4 className="font-bold text-[#0F172A] text-sm">Nova Regra de Corrida</h4>
              </div>
              <button
                onClick={() => setIsNovaRegraModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddRegra} className="p-6 space-y-4">
              
              {novaRegraError && (
                <div className="bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-rose-100 flex items-start gap-1.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{novaRegraError}</span>
                </div>
              )}

              {/* Cliente */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Cliente / Plano de Saúde
                </label>
                <select
                  value={novaRegraClienteId}
                  onChange={(e) => setNovaRegraClienteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#0F6E6E]"
                >
                  <option value="Todos">Todos os Clientes</option>
                  {state.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Região / Bairro */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Destino / Região ou Bairro
                </label>
                <select
                  value={novaRegraRegiao}
                  onChange={(e) => setNovaRegraRegiao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#0F6E6E]"
                >
                  <option value="Todas as regiões">Todas as regiões</option>
                  <option value="Centro">Região: Centro</option>
                  <option value="Zona Sul">Região: Zona Sul</option>
                  <option value="Zona Leste">Região: Zona Leste</option>
                  <option value="Zona Oeste">Região: Zona Oeste</option>
                  <option value="Zona Norte">Região: Zona Norte</option>
                  <option value="Vila Mariana">Bairro: Vila Mariana</option>
                  <option value="Bela Vista">Bairro: Bela Vista</option>
                  <option value="Moema">Bairro: Moema</option>
                  <option value="Consolação">Bairro: Consolação</option>
                </select>
              </div>

              {/* Tipo de Item & Tentativa */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Tipo de Entrega
                  </label>
                  <select
                    value={novaRegraTipoItem}
                    onChange={(e) => setNovaRegraTipoItem(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0F6E6E]"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Carnê">Carnê</option>
                    <option value="Exame">Exame</option>
                    <option value="Medicamento">Medicamento</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Tentativa
                  </label>
                  <select
                    value={novaRegraTentativa}
                    onChange={(e) => setNovaRegraTentativa(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0F6E6E]"
                  >
                    <option value="Todas">Todas</option>
                    <option value="1ª Tentativa">1ª Tentativa</option>
                    <option value="2ª Tentativa">2ª Tentativa</option>
                    <option value="3ª Tentativa">3ª Tentativa</option>
                  </select>
                </div>
              </div>

              {/* Vigências */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Vigência Início
                  </label>
                  <input
                    type="date"
                    required
                    value={novaRegraVigenciaInicio}
                    onChange={(e) => setNovaRegraVigenciaInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0F6E6E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Vigência Fim
                  </label>
                  <input
                    type="date"
                    required
                    value={novaRegraVigenciaFim}
                    onChange={(e) => setNovaRegraVigenciaFim(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0F6E6E]"
                  />
                </div>
              </div>

              {/* Tarifa Valor */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Tarifa Sugerida (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={novaRegraValor}
                  onChange={(e) => setNovaRegraValor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-black outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNovaRegraModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Criar Regra
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE REABERTURA (RN-016) */}
      {isConfirmReabrirModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 font-sans text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <Unlock size={20} className="animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-[#0F172A] text-sm">Deseja reabrir a competência?</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Esta ação reabrirá a competência de <strong>{selectedCompetencia}</strong>. O faturamento voltará para revisão, permitindo novos ajustes e edição de regras.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-[10px] text-slate-400 font-bold border border-slate-100 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-500 shrink-0" />
              <span>Esta reabertura registrará uma auditoria (RN-016).</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsConfirmReabrirModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmReabrir}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Reabrir Competência
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
