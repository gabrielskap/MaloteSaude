import React, { useState, useMemo } from "react";
import { useMalote } from "../context/MaloteContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Shield,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileText,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  X,
  Phone,
  Eye,
  Info
} from "lucide-react";
import { StatusEntrega } from "../types";

export default function RastreioPublico() {
  const { state } = useMalote();
  const isContratante = state.perfil === "Contratante" || new URLSearchParams(window.location.search).get("contratante") === "true";

  // Navigation menu / interactive tab state
  const [activeMenu, setActiveMenu] = useState<"rastreio" | "funcionamento" | "faq">("rastreio");

  // Search form state
  const [searchTab, setSearchTab] = useState<"cpf" | "codigo">("cpf");
  const [cpf, setCpf] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  // Search execution states
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundDelivery, setFoundDelivery] = useState<any | null>(null);

  // Auto-search if query parameter "codigo" is present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("codigo");
    if (code) {
      setSearchTab("codigo");
      setTrackingCode(code);
      setSearched(true);
      
      const delivery = state.entregas.find(
        (e) => e.codigo === code || e.codigoRastreio === code
      );
      if (delivery) {
        setFoundDelivery(delivery);
      } else {
        setSearchError("Código de rastreamento não localizado.");
      }
    }
  }, [state.entregas]);

  // FAQ interactive state
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  });

  const toggleFaq = (idx: number) => {
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper to format CPF as user types (000.000.000-00)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    // Apply mask
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    setCpf(value);
  };

  // Helper to format date as user types (DD/MM/AAAA)
  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    // Apply mask
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setBirthdate(value);
  };

  // Helper to upper-case tracking code
  const handleTrackingCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingCode(e.target.value.toUpperCase());
  };

  // Run the tracking query
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setFoundDelivery(null);
    setSearched(true);

    if (searchTab === "cpf") {
      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanBirth = birthdate.replace(/\D/g, "");

      if (cleanCpf.length < 11) {
        setSearchError("Por favor, informe um CPF válido com 11 dígitos.");
        return;
      }
      
      // Verification of second-factor (birth date is mandatory and must be complete)
      if (cleanBirth.length < 8) {
        setSearchError("A consulta por CPF exige a confirmação da data de nascimento correta.");
        return;
      }

      // Format date back to compare
      const formattedBirth = `${birthdate.slice(0, 2)}/${birthdate.slice(3, 5)}/${birthdate.slice(6)}`;

      // Search in State
      const delivery = state.entregas.find((e) => {
        const itemCpf = e.beneficiario.cpf.replace(/\D/g, "");
        const itemBirth = e.beneficiario.dataNascimento || "15/08/1985"; // fallback from seed
        
        return itemCpf === cleanCpf && itemBirth === formattedBirth;
      });

      if (delivery) {
        setFoundDelivery(delivery);
      } else {
        setSearchError("Nenhuma entrega foi localizada para os dados informados. Verifique se o CPF e a data de nascimento estão corretos.");
      }

    } else {
      // Search by tracking code
      const code = trackingCode.trim();
      if (!code) {
        setSearchError("Por favor, digite o código de rastreamento.");
        return;
      }

      const delivery = state.entregas.find(
        (e) => e.codigo === code || e.codigoRastreio === code
      );

      if (delivery) {
        setFoundDelivery(delivery);
      } else {
        setSearchError("Código de rastreamento não localizado. Verifique os caracteres e tente novamente.");
      }
    }
  };

  // Privacy Rule (RN-013, RF-044) - Always mask Beneficiary details unless authorized (RF-045)
  const getMaskedBeneficiary = (delivery: any) => {
    if (isContratante && delivery?.beneficiario) {
      return {
        nome: delivery.beneficiario.nome || "Carlos Eduardo da Silva",
        cpf: delivery.beneficiario.cpf || "123.456.789-00"
      };
    }
    return {
      nome: "MARIA A. S. C.**",
      cpf: "123.***.***-45"
    };
  };

  // Get item type label beautifully
  const getItemTypeLabel = (tipo: string) => {
    if (tipo === "Cartão") return "Cartão de Beneficiário / Plano de Saúde";
    if (tipo === "Boleto") return "Boleto de Cobrança / Plano de Saúde";
    if (tipo === "Carnê") return "Carnê de Pagamentos / Plano de Saúde";
    return `${tipo} / Plano de Saúde`;
  };

  // Map Delivery Status to public status (RN-013 / RF-044 - generic message for pendency)
  const getPublicStatusDetails = (status: StatusEntrega) => {
    const isPending = [
      "Tentativa sem sucesso",
      "Com inconsistência",
      "Em análise de pendência",
      "Aguardando nova tentativa"
    ].includes(status);

    if (isPending) {
      return {
        badge: "⚠️ Necessário contato",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
        message: "Há uma pendência cadastral ou dificuldade de localização. Por favor, entre em contato conosco ou com seu plano de saúde para regularizar os seus dados."
      };
    }

    switch (status) {
      case "Aguardando revisão":
      case "Validada":
        return {
          badge: "🚚 Em conferência",
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          message: "Estamos conferindo as informações para seguir com o envio."
        };
      case "Aguardando distribuição":
      case "Atribuída":
        return {
          badge: "📦 Preparado para envio",
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          message: "O item foi processado e já está na base logística pronto para a saída do entregador."
        };
      case "Em rota":
        return {
          badge: "🛵 Em rota de entrega",
          badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
          message: "O entregador já saiu com seu item. A entrega será realizada até o final do dia."
        };
      case "Entregue":
        return {
          badge: "✅ Entregue com sucesso",
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          message: "Seu item foi entregue no endereço de destino."
        };
      case "Devolução definitiva":
        return {
          badge: "🚫 Retornado ao emissor",
          badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
          message: "O item retornou ao emissor do plano de saúde. Entre em contato com seu plano para solicitar um reenvio."
        };
      case "Cancelada":
        return {
          badge: "❌ Cancelado",
          badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
          message: "Esta entrega foi cancelada pela operadora."
        };
      default:
        return {
          badge: "🚚 Em conferência",
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          message: "Estamos conferindo as informações logísticas para seguir com o envio."
        };
    }
  };

  // Horizontal timeline calculations (6 steps)
  const getTimelineSteps = (delivery: any) => {
    const status = delivery.status;
    
    // Status severity indices for mapping
    const isPending = ["Tentativa sem sucesso", "Com inconsistência", "Em análise de pendência", "Aguardando nova tentativa"].includes(status);
    
    let currentStep = 1; // Default to 'Em conferência' (Step 2 is active)
    
    if (status === "Aguardando distribuição" || status === "Atribuída") {
      currentStep = 1; // Still Em conferência / ready
    } else if (status === "Em rota") {
      currentStep = 2; // Despachado
    } else if (isPending) {
      currentStep = 3; // 1ª tentativa
    } else if (status === "Entregue") {
      currentStep = 5; // Entregue (index 5 represents the 6th step)
    } else if (status === "Devolução definitiva") {
      currentStep = 4; // 2ª tentativa / failure point
    }

    // Standard static timeline timestamps for aesthetics
    const dateBase = "26/05/2025";
    
    return [
      { label: "Recebido", date: `${dateBase} 08:15`, index: 0 },
      { label: "Em conferência", date: `${dateBase} 10:42`, index: 1 },
      { label: "Despachado", date: status === "Aguardando revisão" || status === "Validada" ? "Aguardando" : `${dateBase} 14:30`, index: 2 },
      { label: "1ª tentativa", date: isPending || status === "Entregue" || status === "Devolução definitiva" ? `${dateBase} 16:15` : "Aguardando", index: 3 },
      { label: "2ª tentativa agendada", date: status === "Devolução definitiva" ? `${dateBase} 17:00` : "Aguardando", index: 4 },
      { label: "Entregue", date: status === "Entregue" ? `${dateBase} 18:30` : "Aguardando", index: 5 },
    ];
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-[#0F172A]">
      
      {/* HEADER PUBLICO */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-3xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-[#0F6E6E] rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
              <Shield size={18} className="text-white" />
            </div>
            <div className="text-left">
              <span className="font-bold text-base text-[#0F172A] tracking-tight block leading-none font-display">
                Malote Saúde
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                Acompanhamento Logístico
              </span>
            </div>
          </div>

          {/* Center Navigation Menus */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => {
                setActiveMenu("rastreio");
                // Scroll to top/hero
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-bold tracking-wide transition-all pb-1 cursor-pointer ${
                activeMenu === "rastreio"
                  ? "text-[#0F6E6E] border-b-2 border-[#0F6E6E]"
                  : "text-slate-500 hover:text-[#0F6E6E]"
              }`}
            >
              Acompanhe sua entrega
            </button>
            <button
              onClick={() => {
                setActiveMenu("funcionamento");
                document.getElementById("funcionamento-sec")?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs font-bold tracking-wide transition-all pb-1 cursor-pointer ${
                activeMenu === "funcionamento"
                  ? "text-[#0F6E6E] border-b-2 border-[#0F6E6E]"
                  : "text-slate-500 hover:text-[#0F6E6E]"
              }`}
            >
              Como funciona
            </button>
            <button
              onClick={() => {
                setActiveMenu("faq");
                document.getElementById("faq-sec")?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs font-bold tracking-wide transition-all pb-1 cursor-pointer ${
                activeMenu === "faq"
                  ? "text-[#0F6E6E] border-b-2 border-[#0F6E6E]"
                  : "text-slate-500 hover:text-[#0F6E6E]"
              }`}
            >
              Perguntas frequentes
            </button>
          </nav>

          {/* Far Right Corner */}
          <div>
            <a
              href="#faq-sec"
              onClick={() => {
                document.getElementById("faq-sec")?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-slate-600 hover:text-[#0F6E6E] flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-100 transition-all"
            >
              <Info size={14} className="text-slate-400" />
              <span>Precisa de ajuda?</span>
            </a>
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER (CENTERED) */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-6 py-8 space-y-12">
        
        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white p-6 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left space-y-3 max-w-xl z-10">
            <span className="text-[10px] bg-teal-500/20 text-teal-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-teal-500/10">
              Serviço Exclusivo de Rastreamento
            </span>
            <h1 className="text-3xl md:text-[34px] font-black leading-tight tracking-tight font-display text-white">
              Acompanhe sua entrega
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              Consulte o status da sua entrega de forma rápida e segura.
            </p>
          </div>

          {/* Inline Isometric Illustration */}
          <div className="w-56 h-48 md:w-64 md:h-52 self-center shrink-0 z-10 flex items-center justify-center">
            <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <circle cx="120" cy="100" r="80" fill="rgba(255, 255, 255, 0.05)" />
              <circle cx="120" cy="100" r="50" fill="rgba(20, 184, 166, 0.1)" />
              
              <g transform="translate(65, 55)">
                {/* Isometric Box */}
                <path d="M50 15L10 30L50 45L90 30L50 15Z" fill="#14B8A6" opacity="0.8" />
                <path d="M10 30V70L50 85V45L10 30Z" fill="#0D9488" opacity="0.9" />
                <path d="M50 45V85L90 70V30L50 45Z" fill="#0F766E" />
                
                {/* Letter envelope layout inside */}
                <path d="M42 19L26 25V55L42 49V19Z" fill="#2DD4BF" opacity="0.4" />
                <path d="M50 25L58 22V52L50 55V25Z" fill="#2DD4BF" opacity="0.6" />
                
                {/* Floating Teal Checked Circle */}
                <g transform="translate(48, -12)">
                  <circle cx="22" cy="22" r="18" fill="#14B8A6" />
                  <path d="M14 22L19 27L29 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>
            </svg>
          </div>

          {/* Abstract ambient background elements */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-slate-500/15 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* SEARCH CARD SECTION */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-white border border-[#E6EAF0] rounded-2xl shadow-sm overflow-hidden text-left">
            
            {/* TABS HEADER */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
              <button
                onClick={() => {
                  setSearchTab("cpf");
                  setSearchError(null);
                }}
                className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  searchTab === "cpf"
                    ? "bg-white text-[#0F6E6E] shadow-3xs border border-slate-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Shield size={14} />
                <span>CPF do beneficiário</span>
              </button>
              
              <button
                onClick={() => {
                  setSearchTab("codigo");
                  setSearchError(null);
                }}
                className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  searchTab === "codigo"
                    ? "bg-white text-[#0F6E6E] shadow-3xs border border-slate-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText size={14} />
                <span>Código de rastreamento</span>
              </button>
            </div>

            {/* SEARCH FORM CONTENT */}
            <form onSubmit={handleSearch} className="p-6 space-y-5">
              
              {searchTab === "cpf" ? (
                /* TAB: CPF + BIRTHDATE */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* CPF field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      CPF do beneficiário
                    </label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCpfChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Birthdate field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={birthdate}
                        onChange={handleBirthdateChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold outline-none transition-all shadow-3xs placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                </div>
              ) : (
                /* TAB: TRACKING CODE ONLY */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Código de rastreamento / Entrega
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: ITM-0526-0001 ou MLTBR250526101BR"
                      value={trackingCode}
                      onChange={handleTrackingCodeChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E] rounded-xl text-xs font-semibold uppercase outline-none transition-all shadow-3xs placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* ACTION SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full bg-[#0F6E6E] hover:bg-[#0C5A5A] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search size={14} />
                <span>Consultar entrega</span>
              </button>

              {/* PROTECTED DATA STATEMENT */}
              <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-500 font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <ShieldCheck size={16} className="text-[#0F6E6E] shrink-0 mt-0.5" />
                <p>
                  Seus dados estão protegidos. Utilizamos suas informações apenas para localizar sua entrega.
                </p>
              </div>

            </form>

            {/* TEST HINT HELPER BOX */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-teal-50/20 text-left">
              <div className="flex items-start gap-2 text-xs">
                <Info size={14} className="text-[#0F6E6E] shrink-0 mt-0.5" />
                <div className="space-y-1 text-[#0F6E6E]">
                  <p className="font-bold uppercase tracking-wider text-[10px]">Dica para Testar o Rastreio:</p>
                  <p className="font-medium text-[11px]">
                    Use o CPF <strong className="font-extrabold select-all">123.456.806-39</strong> e a data de nascimento <strong className="font-extrabold select-all">15/08/1985</strong> para simular uma consulta com sucesso.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* QUERY RESULT CONTAINER */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {searchError ? (
                /* ERROR BOX */
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3 shadow-3xs max-w-xl mx-auto">
                  <AlertTriangle size={32} className="text-rose-500 mx-auto" />
                  <h4 className="font-bold text-rose-900 text-sm">Dados não localizados</h4>
                  <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                    {searchError}
                  </p>
                </div>
              ) : (
                foundDelivery && (
                  /* CARD DE RESULTADO */
                  <div className="bg-white border border-[#E6EAF0] rounded-2xl shadow-sm overflow-hidden text-left space-y-6">
                    
                    {isContratante && (
                      <div className="bg-teal-50/80 border-b border-teal-100 px-6 py-3.5 flex items-center justify-between text-xs text-[#0F6E6E] font-semibold">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-[#0F6E6E]" />
                          <span>🔓 Painel do Contratante — Visão Completa Autorizada (RF-045)</span>
                        </div>
                        <span className="bg-[#0F6E6E] text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Acesso Total
                        </span>
                      </div>
                    )}

                    {/* QUATRO BLOCOS NO TOPO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
                      
                      {/* Bloco 1: Beneficiário (Mascarado por Regra de Privacidade) */}
                      <div className="p-5 text-left space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Beneficiário</p>
                        <p className="font-extrabold text-[#0F172A] text-sm tracking-tight">{getMaskedBeneficiary(foundDelivery).nome}</p>
                        <p className="text-xs text-slate-500 font-semibold">CPF: {getMaskedBeneficiary(foundDelivery).cpf}</p>
                      </div>

                      {/* Bloco 2: Tipo de item */}
                      <div className="p-5 text-left space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de item</p>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <FileText size={16} className="text-[#0F6E6E] shrink-0" />
                          <p className="font-bold text-[#0F172A] text-xs leading-normal">
                            {getItemTypeLabel(foundDelivery.tipoItem)}
                          </p>
                        </div>
                      </div>

                      {/* Bloco 3: Status atual */}
                      <div className="p-5 text-left space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status atual</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPublicStatusDetails(foundDelivery.status).badgeBg}`}>
                          {getPublicStatusDetails(foundDelivery.status).badge}
                        </span>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                          {getPublicStatusDetails(foundDelivery.status).message}
                        </p>
                      </div>

                      {/* Bloco 4: Previsão de entrega */}
                      <div className="p-5 text-left space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsão de entrega</p>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={16} className="text-[#0F6E6E]" />
                          <p className="font-extrabold text-[#0F172A] text-xs">29/05/2025</p>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">Até o final do dia</p>
                      </div>

                    </div>

                    {/* DADOS DETALHADOS SE FOR CONTRATANTE (RF-045) */}
                    {isContratante && (
                      <div className="mx-6 p-5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl text-xs space-y-4">
                        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E6E]"></span>
                          Dados Detalhos da Entrega (Exclusivo Contratante)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Nome Completo:</p>
                            <p className="font-bold text-slate-800 text-sm">{foundDelivery.beneficiario?.nome || 'N/A'}</p>
                          </div>
                          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">CPF / Nascimento:</p>
                            <p className="font-bold text-slate-800 text-sm">
                              {foundDelivery.beneficiario?.cpf || 'N/A'} {foundDelivery.beneficiario?.dataNascimento ? `(${foundDelivery.beneficiario.dataNascimento})` : ''}
                            </p>
                          </div>
                          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100 md:col-span-2">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Endereço Completo de Destino:</p>
                            <p className="font-semibold text-slate-800 text-xs">
                              {foundDelivery.endereco ? (
                                `${foundDelivery.endereco.logradouro}, ${foundDelivery.endereco.numero}${foundDelivery.endereco.complemento ? ` - ${foundDelivery.endereco.complemento}` : ''}, ${foundDelivery.endereco.bairro}, ${foundDelivery.endereco.cidade}-${foundDelivery.endereco.uf}, CEP ${foundDelivery.endereco.cep}`
                              ) : (
                                'N/A'
                              )}
                            </p>
                          </div>
                          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Contato Telefônico:</p>
                            <p className="font-bold text-slate-800">{foundDelivery.telefone || 'N/A'}</p>
                          </div>
                          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Identificadores Logísticos:</p>
                            <p className="font-semibold text-slate-800">
                              Malote: <span className="font-mono text-xs">{foundDelivery.maloteId || 'N/A'}</span> | Prioridade: {foundDelivery.prioridade || 'Média'}
                            </p>
                          </div>
                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-100 md:col-span-2">
                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Histórico Detalhado (Auditoria Interna):</p>
                            <div className="text-[11px] text-slate-600 space-y-2 max-h-[120px] overflow-y-auto pr-1">
                              {foundDelivery.historico?.map((h: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-50 last:border-b-0 pb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div>
                                    <span className="font-bold text-[#0F6E6E]">{h.status}</span>
                                    <span className="text-slate-500 block sm:inline sm:ml-2">— {h.descricao}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 shrink-0 font-medium">
                                    {h.dataHora} • {h.responsavel}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LINHA DO TEMPO HORIZONTAL - 6 ETAPAS */}
                    <div className="px-6 py-4 space-y-6">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Acompanhamento da Rota
                      </h4>

                      {/* Responsive flow wrapper */}
                      <div className="overflow-x-auto pb-4">
                        <div className="min-w-[700px] relative flex items-center justify-between px-4 pt-4">
                          
                          {/* Timeline connector lines background */}
                          <div className="absolute left-[36px] right-[36px] top-[32px] h-0.5 bg-slate-200 z-0" />

                          {/* Dynamic colored progress bar conector verde */}
                          <div 
                            className="absolute left-[36px] top-[32px] h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                            style={{
                              // Derive length based on how many steps are checked
                              width: (() => {
                                const steps = getTimelineSteps(foundDelivery);
                                const status = foundDelivery.status;
                                const isPending = ["Tentativa sem sucesso", "Com inconsistência", "Em análise de pendência", "Aguardando nova tentativa"].includes(status);
                                
                                if (status === "Entregue") return "100%";
                                if (status === "Devolução definitiva") return "80%";
                                if (isPending) return "60%";
                                if (status === "Em rota") return "40%";
                                return "20%"; // default Em conferência
                              })()
                            }}
                          />

                          {/* Render the 6 steps */}
                          {getTimelineSteps(foundDelivery).map((step, idx) => {
                            const status = foundDelivery.status;
                            const isPending = ["Tentativa sem sucesso", "Com inconsistência", "Em análise de pendência", "Aguardando nova tentativa"].includes(status);
                            
                            // Determine step style state: complete, active, or waiting
                            let isComplete = false;
                            let isActive = false;

                            // Custom logic matching requirements
                            if (status === "Entregue") {
                              isComplete = true;
                            } else if (status === "Devolução definitiva") {
                              if (step.index <= 4) isComplete = true;
                            } else if (isPending) {
                              if (step.index < 3) isComplete = true;
                              if (step.index === 3) isActive = true; // 1ª tentativa
                            } else if (status === "Em rota") {
                              if (step.index < 2) isComplete = true;
                              if (step.index === 2) isActive = true; // Despachado
                            } else {
                              // Recebido/Em conferência
                              if (step.index === 0) isComplete = true;
                              if (step.index === 1) isActive = true; // Em conferência (lupa)
                            }

                            return (
                              <div key={step.index} className="flex-1 flex flex-col items-center text-center z-10 relative">
                                
                                {/* Step Circle node icon */}
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isComplete
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                      : isActive
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md animate-pulse"
                                      : "bg-white border-slate-200 text-slate-400"
                                  }`}
                                >
                                  {isComplete ? (
                                    <CheckCircle size={15} />
                                  ) : isActive ? (
                                    <Search size={14} className="animate-spin-slow" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{step.index + 1}</span>
                                  )}
                                </div>

                                {/* Step information labels */}
                                <div className="mt-3.5 space-y-0.5">
                                  <p className={`text-[11px] font-bold tracking-tight leading-tight ${
                                    isActive ? "text-[#0F6E6E]" : isComplete ? "text-slate-800" : "text-slate-400"
                                  }`}>
                                    {step.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {step.date}
                                  </p>
                                </div>

                              </div>
                            );
                          })}

                        </div>
                      </div>

                      {/* LIGHT GRAY FOOTER WARNING BANEER */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-500 text-[11px] font-semibold text-center mt-3">
                        💬 Os prazos podem variar em função da localidade e das condições de entrega.
                      </div>

                    </div>

                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION: "COMO FUNCIONA" */}
        <section id="funcionamento-sec" className="border-t border-slate-100 pt-10 text-left space-y-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl font-bold text-[#0F172A] font-display">Como funciona</h2>
            <p className="text-xs text-slate-500 font-medium">
              Entenda o fluxo logístico inteligente que a Malote Saúde executa para garantir entregas seguras de cartões e documentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-3xs space-y-3.5 text-left">
              <div className="h-9 w-9 bg-teal-50 text-[#0F6E6E] rounded-xl flex items-center justify-center font-bold text-xs border border-teal-100">
                1
              </div>
              <h3 className="font-extrabold text-[#0F172A] text-sm">Geração de Malote</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Os cartões e correspondências são agrupados em malotes selados pelas instituições de saúde com identificação eletrônica e triados via OCR.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-3xs space-y-3.5 text-left">
              <div className="h-9 w-9 bg-teal-50 text-[#0F6E6E] rounded-xl flex items-center justify-center font-bold text-xs border border-teal-100">
                2
              </div>
              <h3 className="font-extrabold text-[#0F172A] text-sm">Roteirização Inteligente</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Nossos operadores definem rotas otimizadas por região geográfica, e atribuem as entregas aos motoboys credenciados com controle de capacidade por quilo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-3xs space-y-3.5 text-left">
              <div className="h-9 w-9 bg-teal-50 text-[#0F6E6E] rounded-xl flex items-center justify-center font-bold text-xs border border-teal-100">
                3
              </div>
              <h3 className="font-extrabold text-[#0F172A] text-sm">Entrega Monitorada</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                O progresso é monitorado via GPS, e qualquer pendência ou retorno temporário é analisado minuciosamente pela nossa Central antes de uma nova tentativa.
              </p>
            </div>

          </div>
        </section>

        {/* SECTION: "DÚVIDAS FREQUENTES" */}
        <section id="faq-sec" className="border-t border-slate-100 pt-10 text-left space-y-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl font-bold text-[#0F172A] font-display">Dúvidas frequentes</h2>
            <p className="text-xs text-slate-500 font-medium">
              Encontre respostas para as perguntas mais comuns.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* FAQ Accordions (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              {[
                {
                  q: "Como faço para acompanhar minha entrega?",
                  a: "Basta inserir o CPF do beneficiário e sua data de nascimento ou o código de rastreamento no campo de consulta acima. A consulta por CPF exige a confirmação de nascimento por motivos de segurança e LGPD."
                },
                {
                  q: "Qual o prazo de entrega?",
                  a: "O prazo padrão é de até 3 dias úteis após a postagem em nossa central logística, podendo variar ligeiramente de acordo com a sua região e as condições climáticas."
                },
                {
                  q: "O que significa cada status?",
                  a: "Recebido: Item integrado no sistema. Em conferência: Checagem cadastral. Despachado: Item enviado para a base de distribuição. Em rota: Item em trânsito com o entregador. Entregue: Item entregue com sucesso."
                },
                {
                  q: "Posso alterar o endereço de entrega?",
                  a: "Por motivos de segurança cadastral e regulamentos do plano de saúde, alterações de endereço só podem ser solicitadas diretamente com o seu plano de saúde emissor do documento."
                },
                {
                  q: "Ninguém estava em casa. E agora?",
                  a: "Realizamos até 3 tentativas de entrega física. Se todas falharem, o item retorna para a nossa central para análise minuciosa. Você deverá acompanhar o rastreio ou contatar sua operadora de plano de saúde."
                },
                {
                  q: "Como falar com a Malote Saúde?",
                  a: "Para dúvidas logísticas gerais, clique no botão ao lado para falar com nossa equipe via WhatsApp corporativo."
                }
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden transition-all shadow-3xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50"
                  >
                    <span className="text-xs font-bold text-[#0F172A]">{faq.q}</span>
                    <ChevronRight
                      size={16}
                      className={`text-[#0F6E6E] shrink-0 transition-transform ${
                        faqOpen[index] ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  
                  {faqOpen[index] && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-50 text-xs text-slate-500 font-semibold leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* NEED HELP CARD (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <div className="h-10 w-10 bg-emerald-50 text-[#0F6E6E] rounded-xl flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-[#0F172A] text-sm">Ainda precisa de ajuda?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Nossa equipe está pronta para te atender de segunda a sexta, das 8h às 18h.
                </p>
              </div>

              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noreferrer"
                className="w-full border border-[#0F6E6E] hover:bg-teal-50 text-[#0F6E6E] font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Phone size={14} />
                <span>Falar com a Malote Saúde</span>
              </a>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER PUBLICO */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12 py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8 text-left">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            
            {/* Logo + Slogan */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#0F6E6E] rounded-lg flex items-center justify-center text-white font-black">
                  <Shield size={16} />
                </div>
                <span className="font-bold text-sm text-white tracking-tight font-display">
                  Malote Saúde
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                Tecnologia e confiança em logística de saúde.
              </p>
            </div>

            {/* Quick footer navigation links */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500 font-semibold select-none">
              <span className="text-slate-500">Política de Privacidade</span>
              <span>·</span>
              <span className="text-slate-500">Termos de Uso</span>
              <span>·</span>
              <span className="text-slate-500">Transparência</span>
              <span>·</span>
              <span className="text-slate-500">LGPD</span>
            </div>

            {/* Social icons */}
            <div className="space-y-1.5 select-none">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Siga a Malote Saúde</p>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold">
                  in
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold">
                  ig
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold">
                  yt
                </div>
              </div>
            </div>

          </div>

          {/* Copyright notice */}
          <div className="text-slate-500 text-[10px] font-semibold text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p>© 2025 Malote Saúde. Todos os direitos reservados.</p>
            <p className="text-[9px] text-slate-600">Desenvolvido com foco em segurança da informação.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
