import React, { useState, useEffect, useRef } from "react";
import { useMalote } from "../context/MaloteContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FileSpreadsheet,
  BookOpen,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Share2,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
  Map,
  Compass,
  Zap,
  Check,
  Activity
} from "lucide-react";
import { Entrega, StatusEntrega, Prioridade, Motoboy } from "../types";
import MotoboyCard from "../components/MotoboyCard";

export default function Distribuicao() {
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // Selected Deliveries Multi-selection
  const [selectedEntregaIds, setSelectedEntregaIds] = useState<Set<string>>(new Set());

  // Filter States
  const [regiaoFilter, setRegiaoFilter] = useState("Todas as regiões");
  const [prioridadeFilter, setPrioridadeFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Aguardando atribuição");
  const [maloteFilter, setMaloteFilter] = useState("Todos os malotes");
  const [buscaFilter, setBuscaFilter] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("prioridade");

  // Selected Motoboy (Rafael Santos is default "moto-1")
  const [selectedMotoboyId, setSelectedMotoboyId] = useState<string>("moto-1");

  // Carousel offset/index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Pagination State (8 items per page, page numbers up to 11)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize: Select exactly 3 deliveries on mount to fulfill "8 linhas, 3 já marcadas"
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && state.entregas.length > 0) {
      const initialSelection = new Set<string>();
      
      // Get deliveries with status 'Validada' or 'Aguardando distribuição' (RF-020)
      const validItems = state.entregas.filter(
        (e) => e.status === "Validada" || e.status === "Aguardando distribuição"
      );
      
      // Select first 3 items
      validItems.slice(0, 3).forEach((item) => {
        initialSelection.add(item.id);
      });
      
      setSelectedEntregaIds(initialSelection);
      initializedRef.current = true;
    }
  }, [state.entregas]);

  // Clean all filters
  const handleLimparFiltros = (e: React.MouseEvent) => {
    e.preventDefault();
    setRegiaoFilter("Todas as regiões");
    setPrioridadeFilter("Todas");
    setStatusFilter("Aguardando atribuição");
    setMaloteFilter("Todos os malotes");
    setBuscaFilter("");
    setOrdenarPor("prioridade");
    setCurrentPage(1);
  };

  // Clear selected deliveries list
  const handleLimparSelecao = () => {
    setSelectedEntregaIds(new Set());
  };

  // Helper to resolve delivery item icons
  const getTipoItemIcon = (tipo: string) => {
    switch (tipo) {
      case "Cartão":
        return <CreditCard size={14} className="text-[#0F6E6E]" />;
      case "Boleto":
        return <FileText size={14} className="text-blue-500" />;
      case "Carnê":
        return <FileSpreadsheet size={14} className="text-purple-500" />;
      case "Medicamento":
        return <Activity size={14} className="text-rose-500" />;
      case "Exame":
        return <FileSpreadsheet size={14} className="text-teal-500" />;
      default:
        return <BookOpen size={14} className="text-slate-500" />;
    }
  };

  // Helper to resolve priority badge styles
  const getPrioridadeBadge = (pri: Prioridade) => {
    switch (pri) {
      case "Alta":
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Alta
          </span>
        );
      case "Média":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Média
          </span>
        );
      case "Baixa":
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Baixa
          </span>
        );
    }
  };

  // Only show deliveries with status "Validada" or "Aguardando distribuição" (RF-020)
  const baseDeliveries = state.entregas.filter(
    (e) => e.status === "Validada" || e.status === "Aguardando distribuição"
  );

  // Apply filters
  const filteredDeliveries = baseDeliveries.filter((e) => {
    // 1. Region Filter
    if (regiaoFilter !== "Todas as regiões" && e.endereco.bairro) {
      // Basic region mapping
      const isSouth = ["Vila Mariana", "Moema", "Ipiranga"].includes(e.endereco.bairro);
      const isCenter = ["Bela Vista", "Consolação", "Cerqueira César"].includes(e.endereco.bairro);
      const isEast = ["Tatuapé"].includes(e.endereco.bairro);
      const isWest = ["Pinheiros"].includes(e.endereco.bairro);
      
      if (regiaoFilter === "Zona Sul" && !isSouth) return false;
      if (regiaoFilter === "Centro" && !isCenter) return false;
      if (regiaoFilter === "Zona Leste" && !isEast) return false;
      if (regiaoFilter === "Zona Oeste" && !isWest) return false;
    }

    // 2. Priority Filter
    if (prioridadeFilter !== "Todas" && e.prioridade !== prioridadeFilter) {
      return false;
    }

    // 3. Status Filter (Aguardando atribuição, Validada, Aguardando distribuição)
    if (statusFilter === "Aguardando atribuição") {
      // matches either 'Validada' or 'Aguardando distribuição' which are both available for distribution
    } else if (statusFilter !== "Todas" && e.status !== statusFilter) {
      return false;
    }

    // 4. Malote Filter
    if (maloteFilter !== "Todos os malotes") {
      // Find the associated malote id
      const maloteObj = state.malotes.find(m => m.id === maloteFilter || m.codigo === maloteFilter);
      if (maloteObj && e.maloteId !== maloteObj.id) {
        return false;
      }
    }

    // 5. Text Search (beneficiary, bairro, malote code)
    if (buscaFilter.trim() !== "") {
      const query = buscaFilter.toLowerCase();
      const matchBen = e.beneficiario.nome.toLowerCase().includes(query);
      const matchBairro = e.endereco.bairro.toLowerCase().includes(query);
      const assocMalote = state.malotes.find((m) => m.id === e.maloteId);
      const matchMalote = assocMalote?.codigo.toLowerCase().includes(query);
      if (!matchBen && !matchBairro && !matchMalote) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    if (ordenarPor === "nome") {
      return a.beneficiario.nome.localeCompare(b.beneficiario.nome);
    }
    if (ordenarPor === "bairro") {
      return a.endereco.bairro.localeCompare(b.endereco.bairro);
    }
    // Default sorting: Prioridade (Alta first, then Média, then Baixa)
    const priValue = { Alta: 3, Média: 2, Baixa: 1 };
    const aPri = priValue[a.prioridade] || 1;
    const bPri = priValue[b.prioridade] || 1;
    return bPri - aPri;
  });

  // Get distinct Malotes list for the filter select dropdown
  const uniqueMalotes = state.malotes.filter((m) =>
    ["Em conferência", "Em cadastramento", "Pronto para distribuição", "Em distribuição", "Recebido"].includes(m.status)
  );

  // Paginated Deliveries List
  const totalDeliveries = sortedDeliveries.length;
  const totalPages = Math.max(1, Math.ceil(totalDeliveries / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedDeliveries = sortedDeliveries.slice(startIdx, endIdx);

  // Synchronize Page Number if filter reduces the list size
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Handle Select All Checkbox toggler on the current visible page
  const isAllPageSelected =
    paginatedDeliveries.length > 0 &&
    paginatedDeliveries.every((item) => selectedEntregaIds.has(item.id));

  const handleSelectAllPage = () => {
    const nextSelection = new Set(selectedEntregaIds);
    if (isAllPageSelected) {
      paginatedDeliveries.forEach((item) => nextSelection.delete(item.id));
    } else {
      paginatedDeliveries.forEach((item) => nextSelection.add(item.id));
    }
    setSelectedEntregaIds(nextSelection);
  };

  const handleToggleItem = (id: string) => {
    const nextSelection = new Set(selectedEntregaIds);
    if (nextSelection.has(id)) {
      nextSelection.delete(id);
    } else {
      nextSelection.add(id);
    }
    setSelectedEntregaIds(nextSelection);
  };

  // Get Selected Deliveries objects
  const selectedDeliveries = state.entregas.filter((e) => selectedEntregaIds.has(e.id));
  const selectedCount = selectedDeliveries.length;

  // Selected Motoboy Details
  const selectedMotoboy = state.motoboys.find((m) => m.id === selectedMotoboyId) || state.motoboys[0];

  // Dynamic Metrics for "Formação de Rota" & "Resumo da seleção"
  // Each item weighs approx 0.6 kg, each item contributes approx 6.2 km, approx 19.3 mins
  const pesoTotal = selectedCount * 0.6;
  const distanciaTotal = selectedCount * 6.23;
  const tempoTotal = Math.round(selectedCount * 19.33);

  // Calculate maximum priority of selected deliveries
  const getSelectedMaxPriority = () => {
    if (selectedCount === 0) return "Nenhuma";
    const priorities = selectedDeliveries.map((e) => e.prioridade);
    if (priorities.includes("Alta")) return "Alta";
    if (priorities.includes("Média")) return "Média";
    return "Baixa";
  };
  const maxPriority = getSelectedMaxPriority();

  // Action Dispatch: "Criar rota e despachar"
  const handleCriarRotaEDespachar = () => {
    if (selectedCount === 0) {
      setToastMessage("Por favor, selecione pelo menos uma entrega para despachar.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!selectedMotoboy) {
      setToastMessage("Selecione um motoboy disponível para atribuir a rota.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const totalEntregasMoto = state.entregas.filter(e => e.motoboyId === selectedMotoboy.id).length;
    const occupancy = selectedMotoboy.meta > 0 ? Math.round((totalEntregasMoto / selectedMotoboy.meta) * 100) : 0;
    if (occupancy > 100) {
      setToastMessage(`O motoboy ${selectedMotoboy.nome} está com sobrecarga (>100%) e não pode receber novas atribuições.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    // Dispatch DESPACHAR_ENTREGAS to global store
    dispatch({
      type: "DESPACHAR_ENTREGAS",
      payload: {
        entregaIds: Array.from(selectedEntregaIds),
        motoboyId: selectedMotoboy.id
      }
    });

    // Notify User
    setToastMessage(`${selectedCount} entregas despachadas para ${selectedMotoboy.nome}`);
    setTimeout(() => setToastMessage(null), 4000);

    // Clear Selection
    setSelectedEntregaIds(new Set());
  };

  // Action Dispatch: "Atribuir ao motoboy" (changes state to Atribuída)
  const handleAtribuirAoMotoboy = () => {
    if (selectedCount === 0) {
      setToastMessage("Por favor, selecione pelo menos uma entrega.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!selectedMotoboy) {
      setToastMessage("Selecione um motoboy.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const totalEntregasMoto = state.entregas.filter(e => e.motoboyId === selectedMotoboy.id).length;
    const occupancy = selectedMotoboy.meta > 0 ? Math.round((totalEntregasMoto / selectedMotoboy.meta) * 100) : 0;
    if (occupancy > 100) {
      setToastMessage(`O motoboy ${selectedMotoboy.nome} está com sobrecarga (>100%) e não pode receber novas atribuições.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    dispatch({
      type: "ATRIBUIR_MOTOBOY",
      payload: {
        entregaIds: Array.from(selectedEntregaIds),
        motoboyId: selectedMotoboy.id
      }
    });

    setToastMessage(`${selectedCount} entregas atribuídas a ${selectedMotoboy.nome}`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedEntregaIds(new Set());
  };

  // Horizontal list carousel handlers (filtered dynamically to Available status)
  const carouselMotoboys = state.motoboys.filter(m => m.status === 'Disponível');

  const handleNextCarousel = () => {
    if (carouselIndex < carouselMotoboys.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    }
  };

  const handlePrevCarousel = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none pb-28 relative">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#E8F4F2] border border-[#0F6E6E] text-[#0F6E6E] font-bold text-xs py-3 px-6 rounded-full shadow-lg z-50 flex items-center gap-2.5"
          >
            <CheckCircle2 size={16} className="text-[#0F6E6E] animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Subtitle */}
      <div>
        <h1 className="text-2xl font-black font-display text-[#0F172A] tracking-tight">Distribuição</h1>
        <p className="text-xs text-[#64748B] font-medium mt-0.5">
          Atribuição e despacho de entregas para motoboys.
        </p>
      </div>

      {/* TOP FILTERS BAR: 4 Selects and 1 Limpar button */}
      <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 shadow-xs flex flex-col md:flex-row items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto flex-1">
          {/* Região */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Região
            </span>
            <select
              value={regiaoFilter}
              onChange={(e) => {
                setRegiaoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs font-semibold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="Todas as regiões">Todas as regiões</option>
              <option value="Zona Sul">Zona Sul</option>
              <option value="Centro">Centro</option>
              <option value="Zona Leste">Zona Leste</option>
              <option value="Zona Oeste">Zona Oeste</option>
              <option value="Zona Norte">Zona Norte</option>
            </select>
          </div>

          {/* Prioridade */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Prioridade
            </span>
            <select
              value={prioridadeFilter}
              onChange={(e) => {
                setPrioridadeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs font-semibold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="Todas">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs font-semibold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="Aguardando atribuição">Aguardando atribuição</option>
              <option value="Validada">Validada</option>
              <option value="Aguardando distribuição">Aguardando distribuição</option>
              <option value="Todas">Todas</option>
            </select>
          </div>

          {/* Malote */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Malote
            </span>
            <select
              value={maloteFilter}
              onChange={(e) => {
                setMaloteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs font-semibold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer truncate"
            >
              <option value="Todos os malotes">Todos os malotes</option>
              {uniqueMalotes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} ({m.unidade.split(" - ")[1] || "SP"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Link */}
        <button
          onClick={handleLimparFiltros}
          className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1 shrink-0 pb-2.5 cursor-pointer"
        >
          ↻ Limpar filtros
        </button>
      </div>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: Entregas Disponíveis */}
        <div className="bg-white rounded-xl border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between min-h-[640px]">
          <div>
            {/* Header row inside card */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A] font-display">
                  Entregas disponíveis
                </h2>
                <span className="bg-[#E8F4F2] text-[#0F6E6E] text-xs font-black px-2.5 py-0.5 rounded-full">
                  {totalDeliveries}
                </span>
              </div>
            </div>

            {/* Search Input and Sorting Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por beneficiário, bairro ou malote..."
                  value={buscaFilter}
                  onChange={(e) => {
                    setBuscaFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white rounded-lg text-xs font-semibold placeholder:text-slate-400 text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Ordenar por select */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-bold">Ordenar:</span>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] text-xs font-bold text-slate-700 px-3 py-2 rounded-lg outline-none cursor-pointer"
                >
                  <option value="prioridade">Prioridade</option>
                  <option value="nome">Beneficiário</option>
                  <option value="bairro">Bairro</option>
                </select>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAllPage}
                        className="rounded border-[#CBD5E1] text-[#0F6E6E] focus:ring-[#0F6E6E] h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-2">Beneficiário</th>
                    <th className="py-2.5 px-2">Bairro</th>
                    <th className="py-2.5 px-2">Item</th>
                    <th className="py-2.5 px-2">Malote</th>
                    <th className="py-2.5 px-2">Prioridade</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        Nenhuma entrega disponível com os filtros ativos.
                      </td>
                    </tr>
                  ) : (
                    paginatedDeliveries.map((item) => {
                      const isChecked = selectedEntregaIds.has(item.id);
                      
                      // Split malote code in two lines
                      const assocMal = state.malotes.find(m => m.id === item.maloteId);
                      const maloteCode = assocMal ? assocMal.codigo : "MAL-2025-0526-128";
                      const midIdx = Math.ceil(maloteCode.length / 2);
                      const mPart1 = maloteCode.slice(0, midIdx);
                      const mPart2 = maloteCode.slice(midIdx);

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-[#F8FAFC] hover:bg-slate-50/75 transition-all ${
                            isChecked ? "bg-[#E8F4F2]/10" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleItem(item.id)}
                              className="rounded border-[#CBD5E1] text-[#0F6E6E] focus:ring-[#0F6E6E] h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>

                          {/* Beneficiário & Endereço */}
                          <td className="py-3 px-2 max-w-[150px]">
                            <div className="font-bold text-slate-800 truncate">
                              {item.beneficiario.nome}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {item.endereco.logradouro}, {item.endereco.numero}
                            </div>
                          </td>

                          {/* Bairro */}
                          <td className="py-3 px-2 text-slate-600 font-medium whitespace-nowrap">
                            {item.endereco.bairro}
                          </td>

                          {/* Item Type with Icon */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1 text-slate-700 font-semibold">
                              {getTipoItemIcon(item.tipoItem)}
                              <span>{item.tipoItem}</span>
                            </div>
                          </td>

                          {/* Malote link - broken in two lines */}
                          <td className="py-3 px-2">
                            <div
                              onClick={() => navigate(`/malotes/${item.maloteId}`)}
                              className="text-blue-500 hover:underline cursor-pointer text-[10px] font-bold leading-tight select-none"
                            >
                              <div>{mPart1}</div>
                              <div>{mPart2}</div>
                            </div>
                          </td>

                          {/* Prioridade badge */}
                          <td className="py-3 px-2">
                            {getPrioridadeBadge(item.prioridade)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-2 text-right">
                            <span className="inline-block bg-amber-50 border border-amber-100 text-amber-600 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
                              Aguardando
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Left Card footer: pagination and range text */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#F1F5F9] pt-4 mt-6 gap-3">
            <span className="text-xs text-slate-400 font-semibold">
              {totalDeliveries > 0
                ? `${startIdx + 1}–${Math.min(endIdx, totalDeliveries)} de ${totalDeliveries} entregas`
                : "0 de 0 entregas"}
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft size={14} className="text-slate-500" />
              </button>

              {/* Render dynamic list representing pages up to 11 */}
              {Array.from({ length: Math.min(11, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md font-bold text-xs cursor-pointer transition-all ${
                      currentPage === pageNum
                        ? "bg-[#0F6E6E] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Display "..." and 11 if total pages exceeds 11 and we display upto 11 */}
              {totalPages > 11 && (
                <>
                  <span className="text-xs text-slate-400 px-1 font-bold">...</span>
                  <button
                    onClick={() => setCurrentPage(11)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md font-bold text-xs cursor-pointer transition-all ${
                      currentPage === 11
                        ? "bg-[#0F6E6E] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    11
                  </button>
                </>
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight size={14} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* TOP CARD: Motoboys disponíveis */}
          <div className="bg-white rounded-xl border border-[#E6EAF0] p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <h2 className="text-base font-bold text-[#0F172A] font-display">
                Motoboys disponíveis
              </h2>
              <button
                onClick={() => navigate("/motoboys")}
                className="text-xs font-bold text-[#0F6E6E] hover:underline cursor-pointer"
              >
                Ver todos →
              </button>
            </div>

            {/* Horizontal carousel slider container */}
            <div className="relative">
              <div className="flex items-center gap-4">
                
                {/* Horizontal list */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                  {carouselMotoboys.map((moto) => {
                    const isSelected = selectedMotoboyId === moto.id;
                    return (
                      <MotoboyCard
                        key={moto.id}
                        moto={moto}
                        isSelected={isSelected}
                        onClick={() => setSelectedMotoboyId(moto.id)}
                      />
                    );
                  })}
                </div>

                {/* Right Navigation Chevron Button */}
                <button
                  onClick={handleNextCarousel}
                  disabled={carouselIndex >= carouselMotoboys.length - 3}
                  className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM CARD: Formação de rota */}
          <div className="bg-white rounded-xl border border-[#E6EAF0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-2">
              <h2 className="text-base font-bold text-[#0F172A] font-display">
                Formação de rota
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setToastMessage("Algoritmo heurístico aplicou otimização de rota com sucesso!");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="text-[10px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md transition-all cursor-pointer"
                >
                  Otimizar rota
                </button>
                <button
                  onClick={handleLimparSelecao}
                  className="text-[10px] font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-all cursor-pointer"
                >
                  Limpar rota
                </button>
              </div>
            </div>

            {/* Split layout: Motoboy details vs Map & list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left inner column: Selected Motoboy summary */}
              <div className="space-y-4 bg-slate-50/50 rounded-xl p-4 border border-[#F1F5F9]">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Motoboy selecionado
                </h4>

                {selectedMotoboy ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedMotoboy.fotoUrl}
                        alt={selectedMotoboy.nome}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-full object-cover border-2 border-[#0F6E6E]"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{selectedMotoboy.nome}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            selectedMotoboy.status === "Disponível"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          ● {selectedMotoboy.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta information */}
                    <div className="space-y-1.5 border-t border-[#E6EAF0] pt-3 text-xs text-slate-600 font-semibold">
                      <div className="flex justify-between">
                        <span>Entregas na rota:</span>
                        <span className="font-extrabold text-slate-900">{selectedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peso na rota:</span>
                        <span className="font-extrabold text-slate-900">{pesoTotal.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Distância estimada:</span>
                        <span className="font-extrabold text-slate-900">{distanciaTotal.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tempo estimado:</span>
                        <span className="font-extrabold text-slate-900">{tempoTotal} min</span>
                      </div>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="space-y-1 pt-2 border-t border-[#E6EAF0]">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Capacidade total</span>
                        <span>{selectedMotoboy.capacidadeKg.toFixed(1)} kg</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0F6E6E] h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (pesoTotal / selectedMotoboy.capacidadeKg) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">
                    Selecione um motoboy no carrossel superior.
                  </p>
                )}
              </div>

              {/* Right inner column: Map Vector Design + stop paradas list */}
              <div className="space-y-4">
                
                {/* SVG MAP */}
                <div className="h-40 border border-[#E6EAF0] bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                  
                  {/* Decorative background grids */}
                  <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Simulated Map Streets */}
                    <path
                      d="M 10 50 Q 80 40 150 90 T 320 80 M 80 10 L 80 150 M 180 10 L 220 150 M 20 120 Q 150 110 300 130"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 50 10 C 120 40, 200 110, 310 10"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Route line connecting selected pins if selectedCount > 0 */}
                    {selectedCount > 0 && (
                      <path
                        d={
                          selectedCount === 1
                            ? "M 80 50"
                            : selectedCount === 2
                            ? "M 80 50 L 180 80"
                            : selectedCount === 3
                            ? "M 80 50 L 180 80 L 240 40"
                            : "M 80 50 L 180 80 L 240 40 L 140 120 L 280 130"
                        }
                        fill="none"
                        stroke="#0F6E6E"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      />
                    )}
                  </svg>

                  {/* Numbered map pins overlay */}
                  {selectedDeliveries.map((item, idx) => {
                    const positions = [
                      { top: "50px", left: "80px" },
                      { top: "80px", left: "180px" },
                      { top: "40px", left: "240px" },
                      { top: "120px", left: "140px" },
                      { top: "130px", left: "280px" }
                    ];
                    const pos = positions[idx % positions.length];

                    return (
                      <div
                        key={item.id}
                        className="absolute flex items-center justify-center h-5 w-5 bg-blue-600 text-white font-extrabold text-[9px] rounded-full border-2 border-white shadow-md animate-bounce"
                        style={{ top: pos.top, left: pos.left }}
                        title={item.beneficiario.nome}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}

                  {selectedCount === 0 && (
                    <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center">
                      <Map size={24} className="text-slate-400 mb-1" />
                      <p className="text-[10px] font-bold text-slate-500">
                        Nenhuma entrega selecionada
                      </p>
                    </div>
                  )}

                  {/* Compass seal */}
                  <div className="absolute bottom-2 right-2 bg-white/80 p-1 rounded border border-slate-200">
                    <Compass size={14} className="text-slate-500 animate-spin" style={{ animationDuration: "12s" }} />
                  </div>
                </div>

                {/* Paradas list below map */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Paradas na rota ({selectedCount})
                  </h4>

                  {selectedCount === 0 ? (
                    <p className="text-[11px] text-slate-400 font-medium italic text-center py-4 bg-slate-50 rounded-lg">
                      Marque as entregas desejadas para gerar a lista.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDeliveries.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-[#F1F5F9] hover:border-slate-300 transition-all"
                        >
                          {/* Number inside blue circle */}
                          <div className="h-5 w-5 bg-blue-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {item.beneficiario.nome}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium truncate">
                              {item.endereco.logradouro}, {item.endereco.bairro}
                            </p>
                          </div>

                          {/* Item type and priority badges */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[8px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-sm">
                              {item.tipoItem}
                            </span>
                            {getPrioridadeBadge(item.prioridade)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED FOOTER RESUMO DA SELEÇÃO */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 py-4 px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-4 z-40 shadow-2xl">
        {/* Left segment metrics info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-300">
          <span className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
            Resumo da seleção:
          </span>
          <div>
            Selecionadas: <span className="font-black text-white text-sm">{selectedCount}</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800 hidden md:block" />
          <div>
            Itens: <span className="font-black text-white text-sm">{selectedCount > 0 ? selectedCount + 1 : 0}</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800 hidden md:block" />
          <div>
            Peso total (aprox.): <span className="font-black text-[#38BDF8] text-sm">{pesoTotal.toFixed(1)} kg</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800 hidden md:block" />
          <div>
            Prioridade máx:{" "}
            <span
              className={`font-black text-sm ${
                maxPriority === "Alta"
                  ? "text-red-500"
                  : maxPriority === "Média"
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              {maxPriority}
            </span>
          </div>
        </div>

        {/* Right segment action buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={handleLimparSelecao}
            disabled={selectedCount === 0}
            className="px-4 py-2 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            Limpar seleção
          </button>
          
          <button
            onClick={handleAtribuirAoMotoboy}
            disabled={selectedCount === 0}
            className="px-4 py-2 text-xs font-bold text-[#38BDF8] border border-[#0F6E6E]/80 rounded-lg hover:bg-[#0F6E6E]/20 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            Atribuir ao motoboy
          </button>

          <button
            onClick={handleCriarRotaEDespachar}
            disabled={selectedCount === 0}
            className="px-5 py-2.5 bg-[#0F6E6E] text-white font-bold text-xs rounded-lg hover:bg-[#0C5A5A] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm flex items-center gap-1.5"
          >
            <Zap size={14} className="fill-white" /> Criar rota e despachar
          </button>
        </div>
      </div>
    </div>
  );
}
