import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Bell,
  MapPin,
  Compass,
  AlertTriangle,
  User,
  Home,
  CheckCircle,
  Clock,
  Phone,
  Info,
  ChevronDown,
  Navigation,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Play,
  Settings,
  HelpCircle,
  ChevronRight,
  ThumbsUp,
  Activity
} from "lucide-react";

// Delivery Item Interface for the Mobile view
interface MobileEntrega {
  id: string;
  local: string;
  tipo: string;
  qtd: number;
  endereco: string;
  horario: string;
  status: "Em rota" | "Pendente" | "Concluída" | "Tentativa sem sucesso" | "Devolução definitiva";
  tipoItem: "Cartão" | "Boleto" | "Carnê" | "Medicamento";
  tentativas?: number;
}

export default function MinhasEntregas() {
  const navigate = useNavigate();

  // Availability state
  const [disponibilidade, setDisponibilidade] = useState<"Disponível" | "Indisponível" | "Em rota">("Disponível");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Active navigation tab ("entregas" is active by default)
  const [activeTab, setActiveTab] = useState<"inicio" | "entregas" | "pendencias" | "perfil">("entregas");

  // Filter state for the checklist ("Todas (15)", "Em rota (6)", "Pendente (2)", "Concluída (7)")
  const [filtroStatus, setFiltroStatus] = useState<"Todas" | "Em rota" | "Pendente" | "Concluída" | "Tentativa sem sucesso" | "Devolução definitiva">("Todas");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Mobile deliveries state - initialized with the 4 specific items requested, synchronized with localStorage
  const [entregas, setEntregas] = useState<MobileEntrega[]>(() => {
    const saved = localStorage.getItem("motoboy_entregas_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "ent-1",
        local: "Hospital São Lucas",
        tipo: "cartões",
        qtd: 120,
        endereco: "Av. Brasil, 2560 – Centro, Fortaleza – CE",
        horario: "09:15",
        status: "Em rota",
        tipoItem: "Cartão",
        tentativas: 0
      },
      {
        id: "ent-2",
        local: "Clínica Vida Plena",
        tipo: "boletos",
        qtd: 85,
        endereco: "R. Des. Moreira, 1500 – Aldeota, Fortaleza – CE",
        horario: "10:30",
        status: "Pendente",
        tipoItem: "Boleto",
        tentativas: 1
      },
      {
        id: "ent-3",
        local: "Laboratório Saúde+",
        tipo: "carnês",
        qtd: 200,
        endereco: "Av. Dom Luís, 987 – Meireles, Fortaleza – CE",
        horario: "11:30",
        status: "Concluída",
        tipoItem: "Carnê",
        tentativas: 0
      },
      {
        id: "ent-4",
        local: "Hospital Santa Helena",
        tipo: "cartões",
        qtd: 150,
        endereco: "Av. Santos Dumont, 3131 – Aldeota, Fortaleza – CE",
        horario: "14:00",
        status: "Em rota",
        tipoItem: "Cartão",
        tentativas: 2
      }
    ];
  });

  // Keep localStorage updated with mobile state changes
  useEffect(() => {
    localStorage.setItem("motoboy_entregas_list", JSON.stringify(entregas));
  }, [entregas]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Modal / Sheet
  const [selectedEntregaDetails, setSelectedEntregaDetails] = useState<MobileEntrega | null>(null);

  // Simulated GPS/Map Route Modal
  const [activeRouteMap, setActiveRouteMap] = useState<MobileEntrega | null>(null);

  // Side Drawer menu toggle
  const [showDrawer, setShowDrawer] = useState(false);

  // Trigger Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Check on mount if we have an incoming toast from RegistrarTentativa
  useEffect(() => {
    const toast = sessionStorage.getItem("motoboy_delivery_toast");
    if (toast) {
      triggerToast(toast);
      sessionStorage.removeItem("motoboy_delivery_toast");
    }
  }, []);

  // Toggle Delivery item status locally for interactivity
  const handleToggleStatus = (id: string, currentStatus: string) => {
    let nextStatus: "Em rota" | "Pendente" | "Concluída" = "Concluída";
    if (currentStatus === "Em rota") nextStatus = "Concluída";
    else if (currentStatus === "Pendente") nextStatus = "Em rota";
    else nextStatus = "Pendente";

    setEntregas(prev =>
      prev.map(item => (item.id === id ? { ...item, status: nextStatus } : item))
    );
    triggerToast(`Status alterado para ${nextStatus}!`);
  };

  // Get item type styling & icon
  const getItemBadgeStyle = (tipoItem: string) => {
    switch (tipoItem) {
      case "Cartão":
        return {
          bg: "bg-teal-50 text-[#0F6E6E] border border-teal-100",
          icon: <CreditCard size={18} className="text-[#0F6E6E]" />
        };
      case "Boleto":
        return {
          bg: "bg-blue-50 text-blue-700 border border-blue-100",
          icon: <FileText size={18} className="text-blue-600" />
        };
      case "Carnê":
        return {
          bg: "bg-purple-50 text-purple-700 border border-purple-100",
          icon: <FileSpreadsheet size={18} className="text-purple-600" />
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border border-slate-100",
          icon: <Info size={18} className="text-slate-600" />
        };
    }
  };

  // Get status details (color bar, badge color, title label)
  const getStatusConfig = (status: "Em rota" | "Pendente" | "Concluída" | "Tentativa sem sucesso" | "Devolução definitiva") => {
    switch (status) {
      case "Em rota":
        return {
          barColor: "bg-blue-500",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Em rota"
        };
      case "Pendente":
        return {
          barColor: "bg-amber-500",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          label: "Pendente"
        };
      case "Concluída":
        return {
          barColor: "bg-emerald-500",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "Entregue"
        };
      case "Tentativa sem sucesso":
        return {
          barColor: "bg-rose-500",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
          label: "Insucesso"
        };
      case "Devolução definitiva":
        return {
          barColor: "bg-slate-500",
          badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
          label: "Devolvida"
        };
    }
  };

  // Handle Próxima Parada Solid button click
  const handleIniciarRotaProximaParada = () => {
    // São Lucas is the next stop
    setEntregas(prev =>
      prev.map(item => (item.id === "ent-1" ? { ...item, status: "Em rota" } : item))
    );
    triggerToast("Rota iniciada para Hospital São Lucas!");
  };

  // Filter deliveries list
  const filteredEntregas = entregas.filter(item => {
    if (filtroStatus === "Todas") return true;
    return item.status === filtroStatus;
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-0 sm:py-8 sm:px-4 flex flex-col items-center justify-center font-sans select-none relative">

      {/* Back button to go to main admin console */}
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

        {/* Notch & Top Speaker bar (desktop mockup only) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#0F172A] rounded-b-2xl z-50 hidden sm:flex items-center justify-center gap-1.5">
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
        </div>

        {/* Status bar details (time, network, battery) (desktop mockup only) */}
        <div className="bg-[#F8FAFC] h-10 px-6 pt-2 hidden sm:flex items-center justify-between text-[11px] font-bold text-slate-500 select-none z-30">
          <span>09:00</span>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="bg-slate-600 h-full w-4 rounded-3xs" />
            </div>
          </div>
        </div>

        {/* TOAST NOTIFICATION inside the mobile viewport */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="absolute top-12 left-4 right-4 bg-[#E8F4F2] border border-[#0F6E6E] text-[#0F6E6E] font-bold text-xs py-3 px-4 rounded-xl shadow-lg z-50 flex items-center gap-2"
            >
              <CheckCircle size={16} className="text-[#0F6E6E]" />
              <span className="flex-1 text-left">{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-[#0F6E6E] hover:opacity-70 p-1">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCROLLABLE SCREEN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 scrollbar-hide">
          
          {/* TOPO: Hamburger menu, Title (26px semibold), Notification indicator */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowDrawer(true)}
              className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Menu size={22} />
            </button>
            
            <h1 className="text-[26px] font-semibold text-[#0F172A] tracking-tight">
              Minhas entregas
            </h1>

            {/* Notification bell with badge "3" */}
            <button
              onClick={() => triggerToast("Você tem 3 notificações não lidas")}
              className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm relative active:scale-95 transition-all cursor-pointer"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-[#F8FAFC]">
                3
              </span>
            </button>
          </div>

          {/* MOTOBOY INFO BAR: Avatar, Name, Availability Selector */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {/* Teal avatar with "RS" */}
              <div className="h-11 w-11 bg-teal-600 text-white font-bold text-sm rounded-full flex items-center justify-center shadow-inner">
                RS
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">Ricardo Silva</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-slate-400 font-bold">Motoboy ● Online</span>
                </div>
              </div>
            </div>

            {/* Availability select dropdown "● Disponível ▾" */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer min-h-[40px]"
              >
                <span className={`h-2 w-2 rounded-full ${disponibilidade === "Disponível" ? "bg-emerald-500" : disponibilidade === "Em rota" ? "bg-blue-500" : "bg-rose-500"}`} />
                <span>{disponibilidade}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              <AnimatePresence>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowStatusMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-left"
                    >
                      {[
                        { label: "Disponível", color: "bg-emerald-500" },
                        { label: "Em rota", color: "bg-blue-500" },
                        { label: "Indisponível", color: "bg-rose-500" }
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={() => {
                            setDisponibilidade(item.label as any);
                            setShowStatusMenu(false);
                            triggerToast(`Status alterado para ${item.label}`);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <span className={`h-2 w-2 rounded-full ${item.color}`} />
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* THREE RESUMO CARDS LADO A LADO */}
          <div className="grid grid-cols-3 gap-2">
            
            {/* Card 1: Entregas de hoje / 15 / Programadas */}
            <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-2xs">
              <div className="h-8 w-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mb-1 shadow-sm">
                <Compass size={16} />
              </div>
              <span className="text-[9px] font-bold text-teal-600 leading-tight">Entregas hoje</span>
              <span className="text-base font-black text-teal-800 my-0.5">15</span>
              <span className="text-[9px] font-medium text-teal-500">Programadas</span>
            </div>

            {/* Card 2: Em rota / 6 / Entregas */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-2xs">
              <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-1 shadow-sm">
                <Navigation size={16} />
              </div>
              <span className="text-[9px] font-bold text-blue-600 leading-tight">Em rota</span>
              <span className="text-base font-black text-blue-800 my-0.5">6</span>
              <span className="text-[9px] font-medium text-blue-500">Entregas</span>
            </div>

            {/* Card 3: Pendências / 2 / Requer atenção */}
            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-2xs">
              <div className="h-8 w-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mb-1 shadow-sm">
                <AlertTriangle size={16} />
              </div>
              <span className="text-[9px] font-bold text-orange-600 leading-tight">Pendências</span>
              <span className="text-base font-black text-orange-800 my-0.5">2</span>
              <span className="text-[9px] font-medium text-orange-500">Requer atenção</span>
            </div>
          </div>

          {/* CARD DESTACADO "PRÓXIMA PARADA" */}
          <div className="bg-[#E8F4F2] border border-teal-200/50 border-l-4 border-l-[#0F6E6E] rounded-2xl p-4 shadow-sm text-left relative flex flex-col justify-between min-h-[145px]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-[#0F6E6E] tracking-wider uppercase">
                  PRÓXIMA PARADA
                </span>
                <span className="bg-[#0F6E6E]/10 text-[#0F6E6E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Prioridade
                </span>
              </div>
              
              <h3 className="text-base font-bold text-[#0F172A]">Hospital São Lucas</h3>
              
              <p className="text-xs text-[#0F6E6E] font-extrabold mt-1.5 flex items-center gap-1.5">
                <CreditCard size={14} />
                <span>▭ 120 cartões</span>
              </p>

              <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-start gap-1">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">Av. Brasil, 2560 – Centro, Fortaleza – CE</span>
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-teal-200/40 flex items-center justify-between gap-2">
              <div className="text-left">
                <span className="text-[9px] font-bold text-[#0F6E6E]/60 uppercase tracking-wide block">Previsto</span>
                <span className="text-xl font-black text-[#0F6E6E] leading-none">09:15</span>
              </div>

              {entregas.find(e => e.id === "ent-1")?.status === "Em rota" ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigate("/app/entregas/ent-1/tentativa")}
                    className="border border-red-500 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl py-2 px-3 shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 min-h-[44px] cursor-pointer bg-white"
                  >
                    <AlertTriangle size={12} />
                    <span>Insucesso</span>
                  </button>
                  <button
                    onClick={() => {
                      setEntregas(prev => prev.map(e => e.id === "ent-1" ? { ...e, status: "Concluída" } : e));
                      triggerToast("Entrega de Hospital São Lucas concluída com sucesso!");
                    }}
                    className="bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs rounded-xl py-2 px-3 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>Entregar</span>
                  </button>
                </div>
              ) : entregas.find(e => e.id === "ent-1")?.status === "Concluída" ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>Concluída</span>
                </span>
              ) : entregas.find(e => e.id === "ent-1")?.status === "Tentativa sem sucesso" ? (
                <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Não Entregue</span>
                </span>
              ) : (
                <button
                  onClick={handleIniciarRotaProximaParada}
                  className="bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs rounded-xl py-2 px-4 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Iniciar rota</span>
                </button>
              )}
            </div>
          </div>

          {/* SEÇÃO "ENTREGAS ATRIBUÍDAS" COM BOTÃO DE FILTRO */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-base font-bold text-[#0F172A]">
              Entregas atribuídas
            </h2>

            {/* Filter button "Todas (15) ▾" */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0F6E6E] hover:opacity-85 transition-opacity py-1.5 px-3 bg-white border border-slate-200 rounded-xl shadow-xs cursor-pointer min-h-[40px]"
              >
                <span>
                  {filtroStatus === "Todas"
                    ? `Todas (${entregas.length})`
                    : filtroStatus === "Tentativa sem sucesso"
                    ? `Sem Sucesso (${entregas.filter(e => e.status === "Tentativa sem sucesso").length})`
                    : filtroStatus === "Devolução definitiva"
                    ? `Devolvidas (${entregas.filter(e => e.status === "Devolução definitiva").length})`
                    : filtroStatus === "Concluída"
                    ? `Concluídas (${entregas.filter(e => e.status === "Concluída").length})`
                    : `${filtroStatus} (${entregas.filter(e => e.status === filtroStatus).length})`}
                </span>
                <ChevronDown size={14} />
              </button>

              <AnimatePresence>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowFilterMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40 text-left animate-in fade-in zoom-in duration-100"
                    >
                      {([
                        "Todas",
                        "Em rota",
                        "Pendente",
                        "Concluída",
                        "Tentativa sem sucesso",
                        "Devolução definitiva"
                      ] as const).map(option => {
                        const count = option === "Todas" ? entregas.length : entregas.filter(e => e.status === option).length;
                        const labelMap: Record<string, string> = {
                          "Todas": "Todas",
                          "Em rota": "Em rota",
                          "Pendente": "Pendente",
                          "Concluída": "Concluídas",
                          "Tentativa sem sucesso": "Sem Sucesso",
                          "Devolução definitiva": "Devolvidas"
                        };
                        return (
                          <button
                            key={option}
                            onClick={() => {
                              setFiltroStatus(option);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 flex items-center justify-between ${
                              filtroStatus === option ? "text-[#0F6E6E] bg-teal-50/50" : "text-slate-700"
                            }`}
                          >
                            <span>{labelMap[option]}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* LISTA DE CARDS DE ENTREGAS */}
          <div className="space-y-3 pb-6">
            {filteredEntregas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl py-12 px-4 text-center text-slate-400 font-semibold text-xs">
                Nenhuma entrega neste filtro.
              </div>
            ) : (
              filteredEntregas.map(item => {
                const badge = getItemBadgeStyle(item.tipoItem);
                const config = getStatusConfig(item.status);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left relative flex flex-col"
                  >
                    {/* Status vertical color bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${config.barColor}`} />

                    {/* Card Body */}
                    <div className="p-4 pl-5 flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-center gap-2">
                          {/* Square Colored Type Icon */}
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${badge.bg}`}>
                            {badge.icon}
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {item.local}
                          </h4>
                        </div>

                        {/* Quantity detail */}
                        <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                          <span>▭ {item.qtd} {item.tipo}</span>
                        </p>

                        {/* Address (NO sensitive beneficiario details or CPFs - RF-027 compliant) */}
                        <p className="text-[11px] text-slate-400 font-semibold flex items-start gap-0.5">
                          <MapPin size={12} className="text-slate-300 shrink-0 mt-0.5" />
                          <span className="truncate">{item.endereco}</span>
                        </p>
                      </div>

                      {/* Right top corner details (horário & status badge) */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <div className="flex items-center gap-1 text-[11px] font-black text-slate-400">
                          <Clock size={12} />
                          <span>{item.horario}</span>
                        </div>

                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Two 44px min-height outline buttons side-by-side */}
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3.5 border-t border-slate-100/60 mt-1 bg-slate-50/50">
                      
                      {/* Left Button */}
                      <button
                        onClick={() => {
                          setActiveRouteMap(item);
                          triggerToast(`Roteirizando caminho para ${item.local}...`);
                        }}
                        className="w-full border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
                      >
                        <Compass size={14} className="text-[#0F6E6E]" />
                        <span>Ver rota</span>
                      </button>

                      {/* Right Button - Varying by Status */}
                      {item.status === "Em rota" && (
                        <button
                          onClick={() => handleToggleStatus(item.id, item.status)}
                          className="w-full border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
                        >
                          <Info size={14} className="text-[#0F6E6E]" />
                          <span>Detalhes</span>
                        </button>
                      )}

                      {item.status === "Pendente" && (
                        <button
                          onClick={() => navigate(`/app/entregas/${item.id}/tentativa`)}
                          className="w-full border border-slate-200 hover:bg-white text-[#E11D48] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
                        >
                          <Phone size={14} className="text-[#E11D48]" />
                          <span>Registrar tentativa</span>
                        </button>
                      )}

                      {item.status === "Concluída" && (
                        <button
                          disabled
                          className="w-full border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] cursor-not-allowed"
                        >
                          <Check size={14} className="text-slate-400" />
                          <span>Entregue</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FIXED BOTTOM NAVIGATION BAR inside the phone container */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-3 flex justify-between items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {/* Nav Item: Início */}
          <button
            onClick={() => {
              setActiveTab("inicio");
              triggerToast("Redirecionando para Início...");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 justify-center py-1 transition-all cursor-pointer min-h-[44px] ${
              activeTab === "inicio" ? "text-[#0F6E6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-bold">Início</span>
          </button>

          {/* Nav Item: Entregas (Active with underline) */}
          <button
            onClick={() => setActiveTab("entregas")}
            className={`flex-1 flex flex-col items-center gap-0.5 justify-center py-1 transition-all cursor-pointer min-h-[44px] relative ${
              activeTab === "entregas" ? "text-[#0F6E6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Compass size={20} className="animate-spin-slow" style={{ animationDuration: '20s' }} />
            <span className="text-[10px] font-bold">Entregas</span>
            {activeTab === "entregas" && (
              <span className="absolute bottom-[-10px] left-1/4 right-1/4 h-0.5 bg-[#0F6E6E] rounded-full" />
            )}
          </button>

          {/* Nav Item: Pendências (with red badge "2") */}
          <button
            onClick={() => {
              setActiveTab("pendencias");
              triggerToast("Abrindo Central de Pendências do Motoboy...");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 justify-center py-1 transition-all cursor-pointer min-h-[44px] relative ${
              activeTab === "pendencias" ? "text-[#0F6E6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <AlertTriangle size={20} />
            <span className="text-[10px] font-bold">Pendências</span>
            <span className="absolute top-0 right-4 h-4 w-4 bg-red-500 text-white font-extrabold text-[8px] rounded-full flex items-center justify-center border border-white">
              2
            </span>
          </button>

          {/* Nav Item: Perfil */}
          <button
            onClick={() => {
              setActiveTab("perfil");
              triggerToast("Abrindo Perfil do Motoboy...");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 justify-center py-1 transition-all cursor-pointer min-h-[44px] ${
              activeTab === "perfil" ? "text-[#0F6E6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </div>

        {/* OPTIONAL BOTTOM SAFE BAR (simulated phone bottom handle) */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-40 pointer-events-none" />

        {/* MODAL 1: OVERLAY MAP ROUTE PREVIEW */}
        <AnimatePresence>
          {activeRouteMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex flex-col justify-end"
            >
              <div className="fixed inset-0" onClick={() => setActiveRouteMap(null)} />
              <motion.div
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                className="bg-white rounded-t-[32px] p-5 shadow-2xl relative z-50 text-left space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#E8F4F2] text-[#0F6E6E] rounded-lg">
                      <Navigation size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Caminho da Rota</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{activeRouteMap.local}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveRouteMap(null)}
                    className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Simulated Visual Route Line and stats */}
                <div className="h-44 bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden flex items-center justify-center">
                  
                  {/* Fake map drawing */}
                  <svg className="absolute inset-0 w-full h-full text-slate-300" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f1f5f9" />
                    <path d="M0,50 Q100,20 200,80 T400,60" fill="none" stroke="#cbd5e1" strokeWidth="4" />
                    <path d="M100,0 L100,200" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                    <path d="M250,0 L250,200" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                    
                    {/* Active highlighted path */}
                    <path d="M100,45 L150,30 L220,70 L250,55" fill="none" stroke="#0F6E6E" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                  </svg>

                  {/* Marker start */}
                  <div className="absolute top-10 left-24 flex flex-col items-center">
                    <span className="h-5 w-5 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                      A
                    </span>
                    <span className="bg-slate-950 text-white text-[8px] px-1 py-0.5 rounded-sm mt-0.5 font-bold">Unidade</span>
                  </div>

                  {/* Marker end */}
                  <div className="absolute top-[50px] left-[240px] flex flex-col items-center">
                    <span className="h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                      <MapPin size={12} />
                    </span>
                    <span className="bg-[#0F172A] text-white text-[8px] px-1.5 py-0.5 rounded-sm mt-0.5 font-bold truncate max-w-[120px]">
                      {activeRouteMap.local}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-600">
                    Otimizado por trânsito
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Distância estimada</p>
                    <p className="text-base font-black text-slate-800">4.8 km</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tempo de trajeto</p>
                    <p className="text-base font-black text-[#0F6E6E]">14 minutos</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveRouteMap(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all min-h-[44px]"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setActiveRouteMap(null);
                      triggerToast(`Coordenadas de ${activeRouteMap.local} exportadas para o GPS!`);
                    }}
                    className="flex-1 bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Navigation size={14} />
                    <span>Iniciar no Waze/Maps</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DRAWER MENU / ASIDE (Simulated Hamburger Drawer inside Phone) */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start"
            >
              <div className="fixed inset-0" onClick={() => setShowDrawer(false)} />
              
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="bg-slate-900 text-white w-3/4 h-full relative z-50 p-6 flex flex-col justify-between shadow-2xl text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-[#0F6E6E] rounded-lg flex items-center justify-center text-white font-black text-xs">
                        ML
                      </div>
                      <span className="font-extrabold text-sm tracking-tight text-slate-100">MALOTE SYSTEM</span>
                    </div>
                    <button
                      onClick={() => setShowDrawer(false)}
                      className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Drawer user info */}
                  <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-800 mb-6">
                    <div className="h-10 w-10 bg-teal-600 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner">
                      RS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">Ricardo Silva</p>
                      <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                        Motoboy Cadastrado
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1.5">
                    {[
                      { label: "Minhas Entregas", icon: <Compass size={18} />, active: true },
                      { label: "Alertas & Pendências", icon: <AlertTriangle size={18} /> },
                      { label: "Histórico Diário", icon: <Clock size={18} /> },
                      { label: "Configurações", icon: <Settings size={18} /> },
                      { label: "Suporte & Ajuda", icon: <HelpCircle size={18} /> }
                    ].map(link => (
                      <button
                        key={link.label}
                        onClick={() => {
                          setShowDrawer(false);
                          triggerToast(`Navegando para: ${link.label}`);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                          link.active
                            ? "bg-[#0F6E6E] text-white"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        }`}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log out option at bottom */}
                <div>
                  <button
                    onClick={() => {
                      setShowDrawer(false);
                      navigate("/");
                    }}
                    className="w-full flex items-center gap-3 text-rose-400 hover:text-rose-300 font-bold text-xs p-3 hover:bg-rose-950/20 rounded-xl transition-all"
                  >
                    <User size={18} />
                    <span>Ir para Admin</span>
                  </button>
                  <p className="text-[10px] text-slate-500 font-medium mt-3 text-center">
                    App v2.4.12-PROD
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
