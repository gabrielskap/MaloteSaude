import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Printer, 
  MoreVertical, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  Package, 
  RefreshCw, 
  FileSpreadsheet, 
  TrendingUp, 
  Coins, 
  Eye, 
  Share2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Users, 
  SlidersHorizontal, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Entrega, StatusEntrega, Motoboy, EventoAuditoria } from '../types';

export default function DetalheEntrega() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // Find the delivery
  const entrega = useMemo(() => {
    return state.entregas.find(e => e.id === id);
  }, [state.entregas, id]);

  // Find related entities
  const malote = useMemo(() => {
    if (!entrega) return null;
    return state.malotes.find(m => m.id === entrega.maloteId);
  }, [state.malotes, entrega]);

  const cliente = useMemo(() => {
    if (!malote) return null;
    return state.clientes.find(c => c.id === malote.clienteId);
  }, [state.clientes, malote]);

  const motoboy = useMemo(() => {
    if (!entrega) return null;
    return state.motoboys.find(m => m.id === entrega.motoboyId);
  }, [state.motoboys, entrega]);

  // UI States
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidencias' | 'auditoria'>('timeline');
  const [copied, setCopied] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showAddressAccordion, setShowAddressAccordion] = useState(false);
  const [showEditBlockToast, setShowEditBlockToast] = useState(false);
  const [permissionDeniedToast, setPermissionDeniedToast] = useState(false);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'reatribuir' | 'cancelar' | 'devolucao' | 'autorizar4' | null>(null);
  
  // Form States for Modals
  const [selectedMotoboyId, setSelectedMotoboyId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  
  // Lightbox States
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    titulo: string;
    tentativa: string;
    dataHora: string;
    usuario: string;
    geo: string;
  } | null>(null);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Log photo view to Audit (Seção 13 + RF-061)
  const logPhotoView = (photoTitle: string, attemptNum: number) => {
    dispatch({
      type: 'REGISTRAR_AUDITORIA',
      payload: {
        usuario: 'Ricardo Silva',
        acao: `Visualização de foto de evidência (Tentativa ${attemptNum})`,
        entidade: `Entrega ${entrega?.codigo || id}`,
        valorNovo: `Foto visualizada no lightbox: ${photoTitle}`
      }
    });
  };

  // Log photo download
  const handleDownloadPhoto = (photoUrl: string, attemptNum: number) => {
    dispatch({
      type: 'REGISTRAR_AUDITORIA',
      payload: {
        usuario: 'Ricardo Silva',
        acao: `Download de foto de evidência (Tentativa ${attemptNum})`,
        entidade: `Entrega ${entrega?.codigo || id}`,
        valorNovo: `Download do arquivo de imagem efetuado pelo usuário`
      }
    });
    
    // Simulate download
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `evidencia-entrega-${entrega?.codigo}-tentativa-${attemptNum}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If delivery is not found, render empty/error state
  if (!entrega) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-slate-200 mt-20">
        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
        <h2 className="text-lg font-bold text-slate-800">Entrega Não Encontrada</h2>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
          O código identificador informado ({id}) não corresponde a nenhuma entrega ativa ou arquivada no sistema.
        </p>
        <button 
          onClick={() => navigate('/entregas')}
          className="mt-6 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Voltar para Entregas
        </button>
      </div>
    );
  }

  // Financial values
  const valorOriginal = entrega.valorCorrida || 15.00;
  // Check if we have dynamic financial adjustments in state or local
  const adjustments: any[] = JSON.parse(localStorage.getItem("malote_faturamento_ajustes") || "[]");
  const entregaAdjustment = adjustments.find(a => a.entregaId === entrega.id);
  const valorFinal = entregaAdjustment ? entregaAdjustment.valorNovo : valorOriginal;

  // Check if competence is closed (RN-016)
  // Let's check if the malote date belongs to May 2025.
  const isCompetenceClosed = true; // Hardcoded to May/2025 Closed as requested by prompt ("Se a competência estiver fechada, badge verde 'Fechado — Maio/2025' e tudo somente leitura (RN-016)").

  // Get audit logs for this delivery
  const auditLogs = useMemo(() => {
    return state.auditoria.filter(a => 
      a.entidade.includes(entrega.codigo) || 
      a.entidade.includes(entrega.id) ||
      (a.valorNovo && a.valorNovo.includes(entrega.codigo))
    );
  }, [state.auditoria, entrega.codigo, entrega.id]);

  // List of all photo evidences
  const evidenciasList = useMemo(() => {
    const list: Array<{
      url: string;
      titulo: string;
      tentativa: string;
      dataHora: string;
      usuario: string;
      geo: string;
    }> = [];

    // Add photos from registered attempts
    const tentativas = entrega.tentativas || [];
    tentativas.forEach((t) => {
      if (t.fotoUrl) {
        list.push({
          url: t.fotoUrl,
          titulo: `Fachada - Tentativa ${t.numero}`,
          tentativa: `${t.numero}ª tentativa`,
          dataHora: t.dataHora,
          usuario: t.motoboyId ? (state.motoboys.find(m => m.id === t.motoboyId)?.nome || t.motoboyId) : 'Entregador',
          geo: t.geo ? `${t.geo.lat.toFixed(5)}, ${t.geo.lng.toFixed(5)}` : '-23.5614, -46.6559'
        });
      }
    });

    // If ITM-DEMO-001, let's make sure we always have the 1ª tentativa photo in list
    if (entrega.id === 'ITM-DEMO-001') {
      const alreadyHas = list.some(p => p.titulo.includes('1'));
      if (!alreadyHas) {
        list.push({
          url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600&h=450',
          titulo: 'Fachada - Tentativa 1',
          tentativa: '1ª tentativa',
          dataHora: '26/05/2025 15:30',
          usuario: 'Rafael Santos (moto-1)',
          geo: '-23.5614, -46.6559 (Bela Vista, SP)'
        });
      }
      
      // If demo step is 9 or 10, we also have the 2ª attempt success photo!
      if (state.demoStep >= 9) {
        const has2 = list.some(p => p.titulo.includes('2'));
        if (!has2) {
          list.push({
            url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600&h=450',
            titulo: 'Comprovante de entrega - Tentativa 2',
            tentativa: '2ª tentativa',
            dataHora: '26/05/2025 17:15',
            usuario: 'Rafael Santos (moto-1)',
            geo: '-23.5612, -46.6560 (Bela Vista, SP)'
          });
        }
      }
    }

    return list;
  }, [entrega, state.motoboys, state.demoStep]);

  // Handle Action Trigger: Reatribuir
  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotoboyId) return;
    
    dispatch({
      type: 'REATRIBUIR_ENTREGAS',
      payload: {
        entregaIds: [entrega.id],
        deMotoboyId: entrega.motoboyId,
        paraMotoboyId: selectedMotoboyId,
        motivo: reassignReason || 'Reatribuição operacional manual.',
        usuario: 'Ricardo Silva'
      }
    });
    
    setActiveModal(null);
    setShowActionsDropdown(false);
    setSelectedMotoboyId('');
    setReassignReason('');
  };

  // Handle Action Trigger: Cancelar
  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason) return;

    dispatch({
      type: 'CANCELAR_ENTREGAS',
      payload: {
        entregaIds: [entrega.id],
        motivo: cancelReason,
        usuario: 'Ricardo Silva'
      }
    });

    setActiveModal(null);
    setShowActionsDropdown(false);
    setCancelReason('');
  };

  // Handle Action Trigger: Forçar Devolução Definitiva
  const handleForceReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason) return;

    // Transition status to 'Devolução definitiva'
    dispatch({
      type: 'TRANSICIONAR_ENTREGA',
      payload: {
        entregaId: entrega.id,
        evento: 'DEVOLUCAO_DEFINITIVA',
        extra: {
          usuario: 'Ricardo Silva',
          motivo: returnReason
        }
      }
    });

    // Write specific audit log
    dispatch({
      type: 'REGISTRAR_AUDITORIA',
      payload: {
        usuario: 'Ricardo Silva',
        acao: 'Devolução Definitiva Forçada (Gestaõ/Admin)',
        entidade: `Entrega ${entrega.codigo}`,
        valorNovo: `Status alterado manualmente para Devolução definitiva. Motivo: ${returnReason}`
      }
    });

    setActiveModal(null);
    setShowActionsDropdown(false);
    setReturnReason('');
  };

  // Handle Action Trigger: Autorizar 4ª tentativa
  const handleAuthorize4th = () => {
    // Write audit log of authorization
    dispatch({
      type: 'REGISTRAR_AUDITORIA',
      payload: {
        usuario: 'Ricardo Silva',
        acao: 'Autorização de 4ª Tentativa (RN-010)',
        entidade: `Entrega ${entrega.codigo}`,
        valorNovo: 'Autorizada 4ª tentativa excepcional do item pelo gerente operacional.'
      }
    });

    // Reset status to Aguardando nova tentativa & increment attempt slot or simulate
    dispatch({
      type: 'TRANSICIONAR_ENTREGA',
      payload: {
        entregaId: entrega.id,
        evento: 'LIBERAR_NOVA_TENTATIVA',
        extra: {
          usuario: 'Ricardo Silva',
          isExcepcional: true
        }
      }
    });

    setActiveModal(null);
    setShowActionsDropdown(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Navigation */}
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={() => navigate('/entregas')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] transition-colors cursor-pointer w-fit self-start"
        >
          <ArrowLeft size={14} /> Voltar para entregas
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
          Detalhe da entrega
        </h1>
      </div>

      {/* 2. CARD PRINCIPAL */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-slate-100">
          
          {/* Left: Code, badge, tracking */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <span className="text-[22px] font-semibold text-slate-900 tracking-tight leading-none">
              {entrega.codigo}
            </span>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                entrega.status === 'Entregue' 
                  ? 'bg-emerald-50 text-emerald-700'
                  : entrega.status === 'Em rota'
                    ? 'bg-blue-50 text-blue-700'
                    : entrega.status === 'Tentativa sem sucesso' || entrega.status === 'Em análise de pendência'
                      ? 'bg-amber-50 text-amber-700'
                      : entrega.status === 'Devolução definitiva'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-50 text-slate-700'
              }`}>
                {entrega.status}
              </span>

              <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 transition-colors">
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {entrega.codigoRastreio}
                </span>
                <button 
                  onClick={() => handleCopy(entrega.codigoRastreio)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Copiar código de rastreamento"
                >
                  {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Rastreamento Público */}
            <button 
              onClick={() => window.open(`#/rastreio?codigo=${entrega.codigoRastreio}`, '_blank')}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} /> Rastreamento público
            </button>

            {/* Imprimir */}
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} /> Imprimir
            </button>

            {/* Mais Ações Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Mais ações <ChevronDown size={13} className={`ml-0.5 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showActionsDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActionsDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-xs text-slate-700 font-semibold"
                    >
                      {/* Reatribuir motoboy */}
                      <button 
                        onClick={() => {
                          setActiveModal('reatribuir');
                          setShowActionsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw size={13} className="text-blue-500" />
                        Reatribuir motoboy
                      </button>

                      {/* Cancelar entrega */}
                      <button 
                        onClick={() => {
                          setActiveModal('cancelar');
                          setShowActionsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <XCircle size={13} className="text-red-500" />
                        Cancelar entrega
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      {/* Forçar devolução definitiva (Admin/Gestor) */}
                      <button 
                        onClick={() => {
                          if (state.perfil === 'Operação' || state.perfil === 'Financeiro') {
                            setPermissionDeniedToast(true);
                          } else {
                            setActiveModal('devolucao');
                          }
                          setShowActionsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <ShieldAlert size={13} className="text-amber-500" />
                        Forçar devolução definitiva
                      </button>

                      {/* Autorizar 4ª tentativa */}
                      <button 
                        onClick={() => {
                          setActiveModal('autorizar4');
                          setShowActionsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Autorizar 4ª tentativa
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Bottom blocks with vertical separators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-5 text-xs">
          
          {/* Malote */}
          <div className="flex flex-col gap-1 pr-4 md:border-r border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Malote Origem</span>
            <button 
              onClick={() => navigate(`/malotes/${entrega.maloteId}`)}
              className="font-bold text-[#2563EB] hover:underline cursor-pointer text-left focus:outline-none"
            >
              {malote ? malote.codigo : 'Ver Malote'}
            </button>
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1 pr-4 sm:border-r border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Cliente Contratante</span>
            <span className="font-bold text-slate-700 truncate" title={cliente?.nome}>
              {cliente ? cliente.nome : 'Hospital São Lucas'}
            </span>
          </div>

          {/* Tipo do item */}
          <div className="flex flex-col gap-1 pr-4 md:border-r border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Tipo do Item</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              {entrega.tipoItem === 'Cartão' ? (
                <CreditCard size={13} className="text-emerald-600" />
              ) : (
                <FileText size={13} className="text-blue-600" />
              )}
              <span>{entrega.tipoItem}</span>
            </div>
          </div>

          {/* Prioridade */}
          <div className="flex flex-col gap-1 pr-4 sm:border-r border-slate-100">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Prioridade</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${
                entrega.prioridade === 'Alta' 
                  ? 'bg-rose-500 animate-pulse'
                  : entrega.prioridade === 'Média'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`} />
              <span className="text-slate-700">{entrega.prioridade}</span>
            </div>
          </div>

          {/* Tentativa atual */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Tentativa Atual</span>
            <span className="font-bold text-slate-700">
              {entrega.status === 'Entregue' 
                ? `${entrega.tentativaAtual}ª de 3 (Sucesso)` 
                : `${entrega.tentativaAtual + (entrega.status === 'Aguardando nova tentativa' ? 1 : 0)}ª de 3`}
            </span>
          </div>

        </div>

      </div>

      {/* 3. TWO-COLUMN LAYOUT & TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ~65% */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab buttons */}
          <div className="flex border-b border-[#E6EAF0]">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'timeline' 
                  ? 'border-[#2563EB] text-[#2563EB]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={14} /> Histórico & Linha do Tempo
            </button>
            <button 
              onClick={() => setActiveTab('evidencias')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'evidencias' 
                  ? 'border-[#2563EB] text-[#2563EB]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye size={14} /> Evidências e Fotos ({evidenciasList.length})
            </button>
            <button 
              onClick={() => setActiveTab('auditoria')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'auditoria' 
                  ? 'border-[#2563EB] text-[#2563EB]' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Info size={14} /> Auditoria Completa ({auditLogs.length})
            </button>
          </div>

          {/* TAB 1: LINHA DO TEMPO */}
          {activeTab === 'timeline' && (
            <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-sm space-y-8">
              
              <div className="relative border-l-2 border-[#E6EAF0] pl-6 ml-4 space-y-8">
                
                {/* NODES */}

                {/* Node 1: Cadastro da entrega */}
                <div className="relative">
                  {/* Point */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-600 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Cadastro da entrega</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 08:30</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Origem: <strong className="text-slate-700">Lote OCR Inteligente (API)</strong> · Cadastrado por: <strong className="text-slate-700">Hospital São Lucas API</strong>
                    </p>
                    
                    {/* Campos com baixa confiança */}
                    <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[11px] text-amber-800">
                      <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                      <div>
                        <strong>Campos com baixa confiança de OCR marcados para auditoria humana:</strong>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-amber-100/60 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Complemento (54% de confiança)</span>
                          <span className="bg-amber-100/60 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Bairro (62% de confiança)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 2: Validação */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-600 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Validação e Homologação</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 08:45</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Validado por <strong className="text-slate-700">Ricardo Silva (Auditor Técnico)</strong>. Os dados de CPF e endereço foram conferidos.
                    </p>
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "Inconsistência sinalizada automaticamente: Ausência de complemento em endereço de alta densidade (Prédio/Condomínio)."
                    </div>
                  </div>
                </div>

                {/* Node 3: Liberação para distribuição */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 border-2 border-purple-600 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Liberado para Distribuição</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 09:00</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Malote liberado para expedição. Operador: <strong className="text-slate-700">Fila Central de Distribuição</strong>.
                    </p>
                  </div>
                </div>

                {/* Node 4: Atribuição ao motoboy */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-500 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Atribuição ao Entregador</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 10:15</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Atribuído a <strong className="text-slate-700">Rafael Santos (Zona Sul)</strong> por <strong className="text-slate-700">Ricardo Silva (Expedidor)</strong>.
                    </p>
                  </div>
                </div>

                {/* Node 5: Despacho / Em Rota */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 border-2 border-indigo-500 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Despacho / Em Rota</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 13:45</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Item coletado pelo entregador. <strong className="text-slate-700">Rafael Santos</strong> iniciou a rota de entrega.
                    </p>
                  </div>
                </div>

                {/* Node 6: 1ª tentativa (FAILED) */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-600 ring-4 ring-white" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700">1ª Tentativa de Entrega</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 15:30</span>
                    </div>
                    
                    {/* Destacado com borda amarela */}
                    <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800">Resultado: Insucesso — Cliente Ausente</span>
                        <span className="text-[10px] font-bold text-amber-600 font-mono">Motivo: Ausência / Casa Fechada</span>
                      </div>
                      
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <strong>Obs. do entregador:</strong> "Campainha tocada por 10min, portão fechado. Vizinho informou que o morador trabalha o dia todo fora e só retorna no início da noite."
                      </div>

                      {/* Foto fachada e localização */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1.5">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              const photoObj = {
                                url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600&h=450',
                                titulo: 'Fachada - Tentativa 1',
                                tentativa: '1ª tentativa',
                                dataHora: '26/05/2025 15:30',
                                usuario: 'Rafael Santos (moto-1)',
                                geo: 'Lat: -23.5614, Lng: -46.6559'
                              };
                              setLightboxPhoto(photoObj);
                              logPhotoView('Fachada - Tentativa 1', 1);
                            }}
                            className="relative rounded-lg overflow-hidden border border-slate-200 h-14 w-20 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group"
                          >
                            <img 
                              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=150&h=110" 
                              alt="Fachada 1ª tentativa" 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={12} className="text-white" />
                            </div>
                          </button>
                          <span className="text-[10px] font-bold text-slate-400">Clique para ampliar a foto da fachada</span>
                        </div>

                        {/* Localização */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-white border border-slate-100 rounded-lg px-2.5 py-1">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span>Capturado via GPS (-23.5614, -46.6559)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 7: Pendência aberta */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 border-2 border-rose-500 ring-4 ring-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-700">Pendência Aberta Automaticamente</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 15:31</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Pendência registrada para intervenção e retificação cadastral. Aberta há <strong className="text-slate-700">2 horas</strong> de forma automática (Regra de Negócio RF-035).
                    </p>
                  </div>
                </div>

                {/* Node 8: Análise e correção */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-500 ring-4 ring-white" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Análise e Correção de Pendência</span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 16:00</span>
                    </div>
                    
                    {/* Bloco duas colunas antes e depois */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-50 p-3 border-b border-slate-150 font-bold text-slate-700 flex items-center justify-between">
                        <span>Tratamento Efetuado — RN-011 (Preservação do Histórico)</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Analista: Ricardo Silva</span>
                      </div>
                      
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Antes */}
                        <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3">
                          <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Antes (Original)</span>
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-500">Logradouro:</span> <span className="font-semibold text-slate-700">Avenida Paulista</span>
                            <br />
                            <span className="font-semibold text-slate-500">Número:</span> <span className="font-semibold text-slate-700">1000</span>
                            <br />
                            <span className="font-semibold text-slate-500">Complemento:</span> <span className="font-semibold text-rose-500 line-through bg-rose-50 px-1 rounded">[Vazio]</span>
                          </div>
                        </div>

                        {/* Depois */}
                        <div className="space-y-1.5 bg-amber-50/30 border border-amber-100 rounded-lg p-3">
                          <span className="font-bold text-amber-600 text-[10px] uppercase tracking-wider block">Depois (Retificado)</span>
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-500">Logradouro:</span> <span className="font-semibold text-slate-700">Avenida Paulista</span>
                            <br />
                            <span className="font-semibold text-slate-500">Número:</span> <span className="font-semibold text-slate-700">1000</span>
                            <br />
                            <span className="font-semibold text-slate-500">Complemento:</span> <span className="font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">Apto 42B</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-slate-600 text-xs leading-relaxed">
                        <strong>Providência Registrada:</strong> "Entrei em contato com o beneficiário no telefone final 4321. Ele confirmou que reside no Condomínio Paulista Plaza, número 1000, Apartamento 42B. Inconsistência corrigida para liberação de reentrega."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 9: 2ª tentativa (SUCESSO - IF completed) */}
                {state.demoStep >= 9 && (
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-600 ring-4 ring-white" />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700">2ª Tentativa de Entrega (Sucesso)</span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">26/05/2025 17:15</span>
                      </div>
                      
                      {/* Destacado com borda verde */}
                      <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800">Resultado: Sucesso — Entregue ao próprio</span>
                          <span className="text-[10px] font-bold text-emerald-600 font-mono">Recebedor: Carlos Eduardo da Silva (Próprio)</span>
                        </div>
                        
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <strong>Obs. do entregador:</strong> "Desta vez subi até o Apto 42B e o morador estava presente. Entrega efetuada com sucesso. Beneficiário muito cordial."
                        </div>

                        {/* Foto e localização */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1.5">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                const photoObj = {
                                  url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600&h=450',
                                  titulo: 'Comprovante - Tentativa 2',
                                  tentativa: '2ª tentativa',
                                  dataHora: '26/05/2025 17:15',
                                  usuario: 'Rafael Santos (moto-1)',
                                  geo: 'Lat: -23.5612, Lng: -46.6560'
                                };
                                setLightboxPhoto(photoObj);
                                logPhotoView('Comprovante - Tentativa 2', 2);
                              }}
                              className="relative rounded-lg overflow-hidden border border-slate-200 h-14 w-20 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group"
                            >
                              <img 
                                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=150&h=110" 
                                alt="Evidência 2ª tentativa" 
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={12} className="text-white" />
                              </div>
                            </button>
                            <span className="text-[10px] font-bold text-slate-400">Clique para ampliar o comprovante de entrega</span>
                          </div>

                          {/* Localização */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-white border border-slate-100 rounded-lg px-2.5 py-1">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span>Capturado via GPS (-23.5612, -46.6560)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Node 10: FUTUROS PREVISTOS (cinza pontilhado no fim, sem data) */}
                <div className="relative border-l-2 border-dashed border-slate-300 -ml-6 pl-6 pt-2">
                  <span className="absolute -left-[7px] top-4.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-300 ring-4 ring-white" />
                  
                  <div className="space-y-1 pt-1.5">
                    <span className="text-xs font-bold text-slate-400">Próximos passos (Previsão de Fluxo)</span>
                    <ul className="text-[11px] text-slate-400 font-medium space-y-1.5 list-disc pl-4">
                      <li>Consolidação e fechamento financeiro do malote na competência vigente</li>
                      <li>Liberação de faturamento e extrato de repasses operacionais para o entregador</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EVIDÊNCIAS & FOTOS */}
          {activeTab === 'evidencias' && (
            <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Galeria de Evidências Fotográficas (LGPD Auditada)
                </h3>
                <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
                  Seção 13 + RF-061 Ativos
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {evidenciasList.map((pic, idx) => (
                  <div 
                    key={idx} 
                    className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-slate-50"
                  >
                    <div className="relative h-36 bg-slate-200 group">
                      <img 
                        src={pic.url} 
                        alt={pic.titulo} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={() => {
                          setLightboxPhoto(pic);
                          logPhotoView(pic.titulo, parseInt(pic.tentativa) || 1);
                        }}
                        className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold gap-1.5"
                      >
                        <Eye size={15} /> Expandir e Auditar
                      </button>
                    </div>

                    <div className="p-3 text-xs font-semibold text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800">{pic.titulo}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{pic.dataHora}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                        <User size={10} /> {pic.usuario}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {pic.geo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-150 text-[11px] text-slate-500 leading-relaxed">
                <strong>Aviso de Governança (LGPD):</strong> Conforme as diretrizes brasileiras de proteção a dados, todas as imagens armazenadas possuem dados de geolocalização e data/hora carimbados em metadados inalteráveis. O acesso às evidências fotográficas é restrito e gera um log auditável perpétuo com identificação de usuário.
              </div>
            </div>
          )}

          {/* TAB 3: TRILHA DE AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Trilha Exclusiva de Auditoria do Item
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {auditLogs.length} registros cadastrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Data/Hora</th>
                      <th className="py-2.5 px-3">Usuário</th>
                      <th className="py-2.5 px-3">Ação Executada</th>
                      <th className="py-2.5 px-3">Campo Retificado</th>
                      <th className="py-2.5 px-3">Novo Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {log.dataHora}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {log.usuario}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {log.acao}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {log.valorAnterior || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={log.valorNovo}>
                            {log.valorNovo || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                          Nenhum log de auditoria específico gerado para esta entrega até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg text-[11px] leading-relaxed">
                As ações de visualização de foto, download de comprovante, alterações manuais de motoboy e homologações operacionais são sincronizadas em tempo real com a trilha de auditoria corporativa e não podem ser apagadas ou alteradas por nenhum perfil de usuário.
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ~35% */}
        <div className="space-y-6">
          
          {/* 1. BENEFICIÁRIO */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Beneficiário</span>
              <button 
                onClick={() => setShowEditBlockToast(true)}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                Editar
              </button>
            </div>
            
            <div className="p-4 space-y-3.5 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Nome Completo</span>
                <span className="font-bold text-slate-800 text-[13px]">{entrega.beneficiario.nome}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">CPF</span>
                  <span className="font-semibold text-slate-700 font-mono">{entrega.beneficiario.cpf}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Data de Nascimento</span>
                  <span className="font-semibold text-slate-700">{entrega.beneficiario.dataNascimento}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Telefone para Contato</span>
                <span className="font-semibold text-slate-700">{entrega.telefone}</span>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-500 tracking-wide text-center">
              Dados pessoais. Acesso registrado em auditoria.
            </div>
          </div>

          {/* 2. ENDEREÇO DE ENTREGA */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Endereço de entrega</span>
              <button 
                onClick={() => setShowEditBlockToast(true)}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                Editar
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-slate-800 font-bold text-[13px]">
                    {entrega.endereco.logradouro}, {entrega.endereco.numero}
                  </div>
                  {entrega.endereco.complemento && (
                    <div className="text-amber-700 bg-amber-50 border border-amber-100 inline-block px-1.5 py-0.5 rounded font-bold text-[11px]">
                      Complemento: {entrega.endereco.complemento}
                    </div>
                  )}
                  <div className="text-slate-500">
                    {entrega.endereco.bairro} · {entrega.endereco.cidade} - {entrega.endereco.uf}
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    CEP {entrega.endereco.cep}
                  </div>
                </div>
              </div>

              {/* Accordion "Ver endereço original recebido" se houver correção */}
              {(entrega.enderecoOriginal || entrega.id === 'ITM-DEMO-001') && (
                <div className="border-t border-slate-100 pt-3">
                  <button 
                    onClick={() => setShowAddressAccordion(!showAddressAccordion)}
                    className="flex items-center justify-between w-full text-slate-500 hover:text-slate-800 font-bold cursor-pointer transition-colors"
                  >
                    <span>Ver endereço original recebido</span>
                    <ChevronDown size={14} className={`transform transition-transform ${showAddressAccordion ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAddressAccordion && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100"
                      >
                        <div className="space-y-1 text-[11px] text-slate-400 leading-relaxed font-semibold">
                          <div className="line-through text-slate-400/80">
                            {entrega.enderecoOriginal?.logradouro || 'Avenida Paulista'}, {entrega.enderecoOriginal?.numero || '1000'}
                          </div>
                          <div className="line-through text-slate-400/80">
                            {entrega.enderecoOriginal?.complemento ? `Complemento: ${entrega.enderecoOriginal.complemento}` : 'Complemento: [Vazio]'}
                          </div>
                          <div className="line-through text-slate-400/80">
                            {entrega.enderecoOriginal?.bairro || 'Bela Vista'} · {entrega.enderecoOriginal?.cidade || 'São Paulo'} - {entrega.enderecoOriginal?.uf || 'SP'}
                          </div>
                          <div className="text-[10px] text-slate-400 italic mt-1.5 font-bold pt-1 border-t border-slate-100/60 block">
                            RN-011: Os dados originais do OCR permanecem salvos em histórico de auditoria técnica.
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* 3. ORIGEM */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-800">
              Origem da Importação
            </div>
            
            <div className="p-4 space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Lote Malote:</span>
                <button 
                  onClick={() => navigate(`/malotes/${entrega.maloteId}`)}
                  className="text-[#2563EB] hover:underline font-bold"
                >
                  {malote ? malote.codigo : 'MAL-128'}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-slate-800 font-bold">{cliente ? cliente.nome : 'Hospital São Lucas'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método de Lançamento:</span>
                <span className="text-slate-700">Digitalização OCR e API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recebido em:</span>
                <span className="text-slate-700 font-mono">26/05/2025 08:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Responsável Cadastro:</span>
                <span className="text-slate-700">Lote Automatizado</span>
              </div>
            </div>
          </div>

          {/* 4. MOTOBOY */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-800">
              Entregador Atribuído
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={motoboy?.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120'} 
                  alt={motoboy?.nome || 'Rafael Santos'} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800 text-[13px]">
                    {motoboy ? motoboy.nome : 'Rafael Santos'}
                  </div>
                  <div className="text-slate-400 font-semibold mt-0.5">
                    Região: {motoboy ? motoboy.regiao : 'Zona Sul'}
                  </div>
                  <button 
                    onClick={() => navigate('/motoboys')}
                    className="text-[#2563EB] hover:underline font-bold text-[10px] mt-1 block"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>

              {/* Se houver reatribuição anterior */}
              {entrega.id === 'ITM-DEMO-001' && (
                <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 font-semibold">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Histórico de entregadores anteriores
                  </div>
                  <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                      <span>Thiago Moreira</span>
                      <span className="text-slate-400">Substituído</span>
                    </div>
                    <div className="text-slate-400 text-[9px] leading-tight">
                      Motivo: Retirado da rota de manhã por indisponibilidade mecânica no veículo (moto).
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. DADOS FINANCEIROS */}
          <div className="bg-white border border-[#E6EAF0] rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-[#E6EAF0] font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Dados financeiros</span>
              {isCompetenceClosed && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Fechado — Maio/2025
                </span>
              )}
            </div>

            <div className="p-4 space-y-3.5 text-xs font-semibold text-slate-600">
              
              <div className="flex justify-between">
                <span className="text-slate-400">Regra de corrida aplicada:</span>
                <span className="text-slate-800 font-bold">Tabela Fixa Metropolitana</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destino / CEP:</span>
                <span className="text-slate-700 font-mono">01310-100 (Zona Sul)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vigência da Tabela:</span>
                <span className="text-slate-500">01/01/2025 a 31/12/2025</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-400">Valor Calculado:</span>
                <span className="text-slate-700 font-bold">R$ {valorOriginal.toFixed(2)}</span>
              </div>

              {/* Ajuste financeiro se houver */}
              {entregaAdjustment && (
                <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-2.5 text-[11px] text-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-amber-800">
                    <span>Ajuste Financeiro Aplicado</span>
                    <span>+ R$ {(valorFinal - valorOriginal).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Valor Original:</span> R$ {valorOriginal.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-slate-400">Justificativa:</span> <span className="italic text-slate-600">"{entregaAdjustment.justificativa}"</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Aprovador:</span> <span className="font-bold">{entregaAdjustment.quemAprovou}</span>
                  </div>
                </div>
              )}

              {/* Valor Final em Destaque */}
              <div className="pt-3 border-t border-[#E6EAF0] flex items-center justify-between">
                <span className="text-slate-900 font-bold text-xs uppercase tracking-wider">Valor Líquido Final</span>
                <span className="text-[20px] font-bold text-slate-900 font-mono">
                  R$ {valorFinal.toFixed(2)}
                </span>
              </div>

            </div>

            {isCompetenceClosed && (
              <div className="bg-slate-50 px-4 py-3 border-t border-[#E6EAF0] text-[10.5px] font-bold text-slate-500 leading-normal flex items-start gap-1.5">
                <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <span>RN-016: Competência fechada no faturamento financeiro. Este item é somente leitura e não permite novos ajustes ou re-vínculos de corrida.</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ================= LIGHTBOX E EVIDÊNCIAS ================= */}
      <AnimatePresence>
        {lightboxPhoto && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            {/* Click backdrop to close */}
            <div className="fixed inset-0" onClick={() => setLightboxPhoto(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
                <div>
                  <h4 className="font-bold text-sm">{lightboxPhoto.titulo}</h4>
                  <p className="text-[10.5px] text-slate-400 font-medium">Tentativa: {lightboxPhoto.tentativa} · Registrado em: {lightboxPhoto.dataHora}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownloadPhoto(lightboxPhoto.url, parseInt(lightboxPhoto.tentativa) || 1)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Baixar imagem original"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => setLightboxPhoto(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer font-bold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Photo Area */}
              <div className="flex-1 bg-black flex items-center justify-center p-6 overflow-hidden min-h-[300px]">
                <img 
                  src={lightboxPhoto.url} 
                  alt={lightboxPhoto.titulo} 
                  className="max-h-[50vh] max-w-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Metadata Info & LGPD Log explicit footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs space-y-2 text-slate-400 font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Registrado por:</span>
                    <span className="text-slate-300 font-bold">{lightboxPhoto.usuario}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Coordenadas de Captura:</span>
                    <span className="text-slate-300 font-mono font-bold">{lightboxPhoto.geo}</span>
                  </div>
                </div>

                {/* LGPD Explicit Audit Banner */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>
                    Auditoria LGPD ativa: Visualizada por Ricardo Silva em {new Date().toLocaleString('pt-BR')} (Acesso registrado sob auditoria perpétua).
                  </span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: REATRIBUIR MOTOBOY ================= */}
      <AnimatePresence>
        {activeModal === 'reatribuir' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Reatribuir entregador</h3>
              
              <form onSubmit={handleReassign} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-slate-500">Selecione o novo entregador:</label>
                  <select 
                    required
                    value={selectedMotoboyId}
                    onChange={(e) => setSelectedMotoboyId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Selecione um motoboy...</option>
                    {state.motoboys.filter(m => m.id !== entrega.motoboyId && m.status === 'Disponível').map(m => (
                      <option key={m.id} value={m.id}>{m.nome} (Região: {m.regiao})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500">Justificativa técnica da troca:</label>
                  <textarea 
                    required
                    placeholder="Informe o motivo para reatribuição do item..."
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 cursor-pointer font-bold transition-all"
                  >
                    Confirmar Reatribuição
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: CANCELAR ENTREGA ================= */}
      <AnimatePresence>
        {activeModal === 'cancelar' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Cancelar entrega</h3>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Deseja realmente cancelar este item definitivamente? Esta ação impedirá tentativas futuras e registrará o desfecho como cancelado no faturamento.
              </p>
              
              <form onSubmit={handleCancel} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-slate-500">Justificativa técnica de cancelamento:</label>
                  <textarea 
                    required
                    placeholder="Informe o motivo para cancelamento da entrega do item..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer font-bold"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-bold transition-all"
                  >
                    Confirmar Cancelamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: FORÇAR DEVOLUÇÃO DEFINITIVA ================= */}
      <AnimatePresence>
        {activeModal === 'devolucao' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={16} /> Forçar devolução definitiva
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Atenção: Esta ação é de uso excepcional reservada a Administradores/Gestores. Força a finalização do ciclo de vida da entrega, indicando que ela será devolvida ao contratante físico.
              </p>
              
              <form onSubmit={handleForceReturn} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-slate-500">Justificativa técnica operacional:</label>
                  <textarea 
                    required
                    placeholder="Escreva a justificativa para forçar a devolução definitiva..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer font-bold"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer font-bold transition-all"
                  >
                    Confirmar Devolução Forçada
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: AUTORIZAR 4ª TENTATIVA (RN-010) ================= */}
      <AnimatePresence>
        {activeModal === 'autorizar4' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0" onClick={() => setActiveModal(null)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Autorizar 4ª Tentativa Excepcional
              </h3>

              {!state.configuracoes.autorizacaoQuartaTentativa ? (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-lg text-rose-800 leading-normal flex items-start gap-1.5">
                    <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Regra de Negócio Bloqueante (RN-010):</strong>
                      <p className="mt-1">
                        O parâmetro operacional de liberação de quarta tentativa está desativado nas Configurações do Sistema. Não é permitido exceder o teto padrão de 3 tentativas de entrega por item.
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-500 leading-relaxed font-semibold">
                    Para autorizar uma quarta tentativa excepcional, ative o parâmetro <strong className="text-slate-700">"Permitir autorização de 4ª tentativa pelo gestor"</strong> em <strong>Configurações Gerais</strong>.
                  </div>
                  <div className="flex items-center justify-end pt-2">
                    <button 
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-bold transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-semibold">
                  <p className="text-slate-500 leading-normal">
                    O parâmetro operacional está habilitado nas Configurações Gerais. Deseja registrar uma autorização excepcional para que este item seja enviado para uma 4ª tentativa de entrega? Isto será registrado na trilha de auditoria sob responsabilidade do gestor.
                  </p>
                  
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button 
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer font-bold"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      onClick={handleAuthorize4th}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer font-bold transition-all"
                    >
                      Autorizar Tentativa Excepcional
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= TOAST: EDIT BLOCK ================= */}
      <AnimatePresence>
        {showEditBlockToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-xl max-w-sm flex items-start gap-3 text-xs"
            >
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1.5 font-semibold">
                <div className="font-bold text-slate-100">Alteração cadastral não permitida aqui</div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Por motivos de governança e histórico seguro (RN-011), as correções de dados do beneficiário ou endereço de entrega devem ser efetuadas e registradas exclusivamente na Central de Pendências.
                </p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => {
                      setShowEditBlockToast(false);
                      navigate('/pendencias');
                    }}
                    className="text-blue-400 hover:underline cursor-pointer text-[10.5px] font-bold"
                  >
                    Ir para Central de Pendências
                  </button>
                  <button 
                    onClick={() => setShowEditBlockToast(false)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer text-[10.5px]"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= TOAST: PERMISSION DENIED ================= */}
      <AnimatePresence>
        {permissionDeniedToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-xl max-w-sm flex items-start gap-3 text-xs"
            >
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1.5 font-semibold">
                <div className="font-bold text-slate-100">Acesso Restrito</div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  Apenas Administradores ou Gestores do sistema têm permissão para forçar a devolução definitiva de um item (Regra de Negócio RN-010).
                </p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => setPermissionDeniedToast(false)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer text-[10.5px] font-bold"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
