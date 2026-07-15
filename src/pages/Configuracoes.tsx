import React, { useState, useMemo, useEffect } from 'react';
import { useMalote } from '../context/MaloteContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Sliders, Users, Shield, Briefcase, AlertTriangle, 
  FileSpreadsheet, History, Plus, Trash2, Edit2, Check, X, 
  ArrowUp, ArrowDown, Download, Search, Filter, AlertCircle,
  Eye, ToggleLeft, ToggleRight, CheckCircle, Info
} from 'lucide-react';
import { ConfigState, UsuarioSistema, Cliente, MotivoInsucesso } from '../types';

export default function Configuracoes() {
  const { state, dispatch } = useMalote();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'gerais' | 'usuarios' | 'permissoes' | 'clientes' | 'motivos' | 'ocr' | 'auditoria'>('gerais');

  // Local state for changes - cloned from context to support dirty checks and "Save Changes" workflow
  const [localConfig, setLocalConfig] = useState<ConfigState>(() => JSON.parse(JSON.stringify(state.configuracoes)));
  const [localUsuarios, setLocalUsuarios] = useState<UsuarioSistema[]>(() => JSON.parse(JSON.stringify(state.usuarios)));
  const [localClientes, setLocalClientes] = useState<Cliente[]>(() => JSON.parse(JSON.stringify(state.clientes)));

  // Sync with context if global state changes
  useEffect(() => {
    setLocalConfig(JSON.parse(JSON.stringify(state.configuracoes)));
    setLocalUsuarios(JSON.parse(JSON.stringify(state.usuarios)));
    setLocalClientes(JSON.parse(JSON.stringify(state.clientes)));
  }, [state.configuracoes, state.usuarios, state.clientes]);

  // Dirty state tracking - enables save changes button in footer
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(localConfig) !== JSON.stringify(state.configuracoes) ||
      JSON.stringify(localUsuarios) !== JSON.stringify(state.usuarios) ||
      JSON.stringify(localClientes) !== JSON.stringify(state.clientes)
    );
  }, [localConfig, localUsuarios, localClientes, state.configuracoes, state.usuarios, state.clientes]);

  // Form modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewReasonModalOpen, setIsNewReasonModalOpen] = useState(false);
  
  // Dialog for confirming user inactivation
  const [confirmInactivateUser, setConfirmInactivateUser] = useState<UsuarioSistema | null>(null);

  // Selected client for detailed obligatory field checklist configuration
  const [selectedClientDetail, setSelectedClientDetail] = useState<Cliente | null>(null);

  // Success message toast
  const [showToast, setShowToast] = useState(false);
  const [customToast, setCustomToast] = useState<{ title: string; sub: string } | null>(null);

  // New User fields
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    perfil: 'Operação' as any,
    unidade: 'Central SP'
  });

  // New Client fields
  const [newClient, setNewClient] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    contato: '',
    contratosAtivos: 1,
    camposObrigatorios: {
      nome: true,
      cpf: true,
      endereco: true,
      cep: true,
      telefone: false,
      tipoItem: true
    }
  });

  // New Failure Reason fields
  const [newReason, setNewReason] = useState({
    nome: '',
    exigeJustificativa: false,
    exigeFoto: true,
    cliente: 'Todos'
  });

  // Search & Filter state for Auditoria
  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('Todos');
  const [auditEntityFilter, setAuditEntityFilter] = useState('Todos');
  const [auditActionFilter, setAuditActionFilter] = useState('Todos');

  // Trigger save operation
  const handleSaveChanges = () => {
    dispatch({ type: 'SALVAR_CONFIGURACOES', payload: localConfig });
    dispatch({ type: 'ATUALIZAR_USUARIOS', payload: localUsuarios });
    dispatch({ type: 'ATUALIZAR_CLIENTES', payload: localClientes });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Matrix actions and profiles definition (as specified in Section 6.1)
  const matrixActions = [
    { key: 'criarEditarMalote', label: 'Criar/editar malote' },
    { key: 'cadastrarRevisarEntrega', label: 'Cadastrar/revisar entrega' },
    { key: 'atribuirMotoboy', label: 'Atribuir motoboy' },
    { key: 'registrarTentativa', label: 'Registrar tentativa' },
    { key: 'tratarPendencia', label: 'Tratar pendência' },
    { key: 'alterarTabelaValores', label: 'Alterar tabela de valores' },
    { key: 'fecharFaturamento', label: 'Fechar faturamento' },
    { key: 'consultarRastreio', label: 'Consultar rastreamento' },
  ];

  const matrixProfiles = ['Admin', 'Operação', 'Gestor', 'Motoboy', 'Financeiro', 'Contratante', 'Beneficiário'];
  const cellOptions = ['Sim', 'Não', 'Consulta', 'Apoio', 'Exceção', 'Aprova', 'Próprias', 'Própria'];

  const getCellBgClass = (val: string) => {
    if (val === 'Sim') return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    if (val === 'Não') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  };

  // Drag and drop for reasons reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveReason = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= localConfig.motivosInsucesso.length) return;
    const list = [...localConfig.motivosInsucesso];
    const temp = list[index];
    list[index] = list[nextIndex];
    list[nextIndex] = temp;
    setLocalConfig({ ...localConfig, motivosInsucesso: list });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const list = [...localConfig.motivosInsucesso];
    const item = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(index, 0, item);
    setDraggedIndex(index);
    setLocalConfig({ ...localConfig, motivosInsucesso: list });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Filter audit history dynamically
  const auditUsers = useMemo(() => ['Todos', ...Array.from(new Set(state.auditoria.map(a => a.usuario)))], [state.auditoria]);
  const auditEntities = useMemo(() => ['Todos', ...Array.from(new Set(state.auditoria.map(a => a.entidade)))], [state.auditoria]);
  const auditActions = useMemo(() => ['Todos', ...Array.from(new Set(state.auditoria.map(a => a.acao)))], [state.auditoria]);

  const filteredAudits = useMemo(() => {
    return state.auditoria.filter(a => {
      const matchSearch = 
        a.acao.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.entidade.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (a.valorNovo && a.valorNovo.toLowerCase().includes(auditSearch.toLowerCase())) ||
        (a.valorAnterior && a.valorAnterior.toLowerCase().includes(auditSearch.toLowerCase()));

      const matchUser = auditUserFilter === 'Todos' || a.usuario === auditUserFilter;
      const matchEntity = auditEntityFilter === 'Todos' || a.entidade === auditEntityFilter;
      const matchAction = auditActionFilter === 'Todos' || a.acao === auditActionFilter;

      return matchSearch && matchUser && matchEntity && matchAction;
    });
  }, [state.auditoria, auditSearch, auditUserFilter, auditEntityFilter, auditActionFilter]);

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0F172A]">Configurações</h1>
        <p className="text-sm text-[#64748B] mt-1">Ajuste de SLA, regras e parâmetros gerais do sistema.</p>
      </div>

      {/* Main Single Card Panel */}
      <div className="bg-white rounded-[20px] border border-[#E6EAF0] shadow-xs overflow-hidden flex flex-col min-h-[580px]">
        
        {/* Horizontal Navigation Tabs */}
        <div className="flex border-b border-[#F1F5F9] bg-[#F8FAFC] overflow-x-auto scrollbar-none px-6">
          <div className="flex gap-1 py-3 shrink-0">
            {[
              { id: 'gerais', label: 'Parâmetros gerais', icon: Sliders },
              { id: 'usuarios', label: 'Usuários', icon: Users },
              { id: 'permissoes', label: 'Perfis e permissões', icon: Shield },
              { id: 'clientes', label: 'Clientes contratantes', icon: Briefcase },
              { id: 'motivos', label: 'Motivos de insucesso', icon: AlertTriangle },
              { id: 'ocr', label: 'OCR e importação', icon: FileSpreadsheet },
              { id: 'auditoria', label: 'Auditoria', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#0F6E6E] shadow-3xs border border-[#E6EAF0]' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/50'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#0F6E6E]' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Body Container */}
        <div className="p-6 md:p-8 flex-1">
          
          {/* TAB: PARÂMETROS GERAIS */}
          {activeTab === 'gerais' && (
            <div className="space-y-10 divide-y divide-slate-100">
              
              {/* Tentativas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">Tentativas de Entrega</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Configure os limites operacionais de re-entrega direta na ponta.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Número máximo de tentativas no fluxo padrão
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={5}
                      value={localConfig.tentativasMaximas}
                      onChange={(e) => setLocalConfig({ ...localConfig, tentativasMaximas: Number(e.target.value) })}
                      className="w-full md:w-32 p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none focus:border-[#0F6E6E] focus:ring-1 focus:ring-[#0F6E6E]/20 transition-all"
                    />
                    <p className="text-[11px] text-[#0F6E6E] font-medium mt-1.5 flex items-center gap-1 bg-teal-50/50 p-2 rounded-lg border border-teal-100/50">
                      <Info size={12} />
                      <span>RN-009. Alterar aqui muda o bloqueio na tela do motoboy.</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">Permitir 4ª tentativa mediante autorização excepcional</p>
                      <p className="text-[11px] text-slate-500 font-medium">Requer liberação explícita do operador no painel</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, autorizacaoQuartaTentativa: !localConfig.autorizacaoQuartaTentativa })}
                      className="cursor-pointer"
                    >
                      {localConfig.autorizacaoQuartaTentativa ? (
                        <ToggleRight size={38} className="text-[#0F6E6E]" />
                      ) : (
                        <ToggleLeft size={38} className="text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Evidências */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">Evidências de Campo</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Nível de rigor para comprovação de recebimento ou insucesso operacional.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-4 max-w-xl">
                  
                  {/* Foto Fachada Insucesso */}
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E6EAF0] rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Exigir foto da fachada nas tentativas sem sucesso</p>
                      <p className="text-[11px] text-[#0F6E6E] font-semibold">Exigência ativa (RN-007) para validação</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, exigirFotoFachadaInsucesso: !localConfig.exigirFotoFachadaInsucesso })}
                      className="cursor-pointer"
                    >
                      {localConfig.exigirFotoFachadaInsucesso ? (
                        <ToggleRight size={38} className="text-[#0F6E6E]" />
                      ) : (
                        <ToggleLeft size={38} className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* Foto Concluída */}
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E6EAF0] rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Exigir foto na entrega concluída</p>
                      <p className="text-[11px] text-slate-500 font-medium">Obrigatório foto do canhoto ou recebedor</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, exigirFotoEntregaConcluida: !localConfig.exigirFotoEntregaConcluida })}
                      className="cursor-pointer"
                    >
                      {localConfig.exigirFotoEntregaConcluida ? (
                        <ToggleRight size={38} className="text-[#0F6E6E]" />
                      ) : (
                        <ToggleLeft size={38} className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* GPS */}
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E6EAF0] rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Capturar localização GPS</p>
                      <p className="text-[11px] text-slate-500 font-medium">Registra geolocalização no ato da ocorrência</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, capturarLocalizacaoGps: !localConfig.capturarLocalizacaoGps })}
                      className="cursor-pointer"
                    >
                      {localConfig.capturarLocalizacaoGps ? (
                        <ToggleRight size={38} className="text-[#0F6E6E]" />
                      ) : (
                        <ToggleLeft size={38} className="text-slate-300" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    *Sujeito à autorização do usuário e à política de privacidade.
                  </p>
                </div>
              </div>

              {/* SLA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">Acordos de Nível de Serviço (SLA)</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Define as métricas de tempo para sinalização de gargalos e alertas no dashboard.
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prazo para conferência do malote (horas)
                    </label>
                    <input 
                      type="number"
                      value={localConfig.prazoConferenciaHoras}
                      onChange={(e) => setLocalConfig({ ...localConfig, prazoConferenciaHoras: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prazo para despacho após validação (horas)
                    </label>
                    <input 
                      type="number"
                      value={localConfig.prazoDespachoHoras}
                      onChange={(e) => setLocalConfig({ ...localConfig, prazoDespachoHoras: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prazo total de entrega (dias)
                    </label>
                    <input 
                      type="number"
                      value={localConfig.prazoTotalEntregaDias}
                      onChange={(e) => setLocalConfig({ ...localConfig, prazoTotalEntregaDias: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entrega atrasada após (horas)
                    </label>
                    <input 
                      type="number"
                      value={localConfig.atrasoAposHoras}
                      onChange={(e) => setLocalConfig({ ...localConfig, atrasoAposHoras: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Retenção */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">Política de Retenção de Dados</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Limites de segurança jurídica para arquivamento frio de arquivos e posições.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Retenção de fotos e evidências (dias)
                      </label>
                      <input 
                        type="number"
                        value={localConfig.retencaoEvidenciasDias}
                        onChange={(e) => setLocalConfig({ ...localConfig, retencaoEvidenciasDias: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Retenção de dados de localização (dias)
                      </label>
                      <input 
                        type="number"
                        value={localConfig.retencaoLocalizacaoDias}
                        onChange={(e) => setLocalConfig({ ...localConfig, retencaoLocalizacaoDias: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 border border-amber-100 rounded-lg font-medium flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>Seção 13 — a definir antes da produção.</span>
                  </p>
                </div>
              </div>

              {/* Operação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 pb-4">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">Limites Operacionais Básicos</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Parâmetros para otimização de rotas e acompanhamento de produtividade física.
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Capacidade padrão do motoboy (kg)
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      value={localConfig.capacidadePadraoMotoboyKg}
                      onChange={(e) => setLocalConfig({ ...localConfig, capacidadePadraoMotoboyKg: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta diária de entregas por motoboy
                    </label>
                    <input 
                      type="number"
                      value={localConfig.metaDiariaEntregasMotoboy}
                      onChange={(e) => setLocalConfig({ ...localConfig, metaDiariaEntregasMotoboy: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: USUÁRIOS */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center pb-2">
                <p className="text-xs font-semibold text-[#64748B]">
                  Mostrando {localUsuarios.length} usuários cadastrados no sistema.
                </p>
                <button
                  id="btn-novo-usuario"
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F6E6E] text-white hover:bg-[#0c5959] text-xs font-bold rounded-xl shadow-3xs cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Novo usuário</span>
                </button>
              </div>

              {/* Users Data Table */}
              <div className="overflow-x-auto border border-[#E6EAF0] rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0]">
                      <th className="p-3.5 text-xs font-bold text-[#1E293B]">Usuário</th>
                      <th className="p-3.5 text-xs font-bold text-[#1E293B]">Perfil</th>
                      <th className="p-3.5 text-xs font-bold text-[#1E293B]">Unidade</th>
                      <th className="p-3.5 text-xs font-bold text-[#1E293B]">Último Acesso</th>
                      <th className="p-3.5 text-xs font-bold text-[#1E293B] text-center">Status</th>
                      <th className="p-3.5 text-xs font-bold text-[#1E293B] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-xs">
                    {localUsuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#E8F4F2] text-[#0F6E6E] font-extrabold text-[11px] flex items-center justify-center">
                              {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{u.nome}</p>
                              <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.perfil === 'Administrador' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                            u.perfil === 'Operação' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            u.perfil === 'Motoboy' ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {u.perfil}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-600">{u.unidade}</td>
                        <td className="p-3.5 text-[#64748B] font-medium">{u.ultimoAcesso}</td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (u.ativo) {
                                // Confirm before inactivating as requested (revokes access immediately)
                                setConfirmInactivateUser(u);
                              } else {
                                // Reactivate directly
                                setLocalUsuarios(localUsuarios.map(usr => usr.id === u.id ? { ...usr, ativo: true } : usr));
                              }
                            }}
                            className="cursor-pointer mx-auto block"
                          >
                            {u.ativo ? (
                              <ToggleRight size={32} className="text-[#0F6E6E]" />
                            ) : (
                              <ToggleLeft size={32} className="text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button 
                            onClick={() => {
                              // Fast deletion for demo list
                              setLocalUsuarios(localUsuarios.filter(usr => usr.id !== u.id));
                            }}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors inline-block"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB: PERFIS E PERMISSÕES */}
          {activeTab === 'permissoes' && (
            <div className="space-y-4">
              
              {/* Amber warning alert banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-800">Matriz preliminar</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                    O perfil "cliente contratante" pode exigir segregação por empresa, unidade ou contrato.
                  </p>
                </div>
              </div>

              {/* Editable Matrix Table */}
              <div className="overflow-x-auto border border-[#E6EAF0] rounded-xl">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0]">
                      <th className="p-3 text-xs font-bold text-[#1E293B] w-48">Ação / Funcionalidade</th>
                      {matrixProfiles.map(p => (
                        <th key={p} className="p-3 text-xs font-bold text-[#1E293B] text-center">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matrixActions.map((actionRow) => (
                      <tr key={actionRow.key} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 text-xs font-bold text-slate-700">{actionRow.label}</td>
                        
                        {matrixProfiles.map((profileCol) => {
                          const val = (localConfig.matrizPermissoes as any)[actionRow.key]?.[profileCol] || 'Não';
                          return (
                            <td key={profileCol} className="p-2 text-center">
                              <select
                                value={val}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  const updatedMatrix = {
                                    ...localConfig.matrizPermissoes,
                                    [actionRow.key]: {
                                      ...(localConfig.matrizPermissoes as any)[actionRow.key],
                                      [profileCol]: newVal
                                    }
                                  };
                                  setLocalConfig({ ...localConfig, matrizPermissoes: updatedMatrix });
                                }}
                                className={`w-full p-1 text-center text-[11px] font-bold border rounded-lg outline-none cursor-pointer transition-all ${getCellBgClass(val)}`}
                              >
                                {cellOptions.map(opt => (
                                  <option key={opt} value={opt} className="bg-white text-slate-800">{opt}</option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB: CLIENTES CONTRATANTES */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">
              
              {/* Clients Grid & Detail configuration split layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Side: Client List Table (cols: 2/3) */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-[#64748B]">
                      Lista de contratantes e regras de validação por contrato.
                    </p>
                    <button
                      id="btn-novo-cliente"
                      onClick={() => setIsNewClientModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F6E6E] text-white hover:bg-[#0c5959] text-xs font-bold rounded-xl shadow-3xs cursor-pointer transition-colors"
                    >
                      <Plus size={14} />
                      <span>Novo cliente</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#E6EAF0] rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0]">
                          <th className="p-3 text-xs font-bold text-[#1E293B]">Cliente / CNPJ</th>
                          <th className="p-3 text-xs font-bold text-[#1E293B]">Contato</th>
                          <th className="p-3 text-xs font-bold text-[#1E293B] text-center">Contratos</th>
                          <th className="p-3 text-xs font-bold text-[#1E293B] text-center">Malotes/Mês</th>
                          <th className="p-3 text-xs font-bold text-[#1E293B] text-center">Status</th>
                          <th className="p-3 text-xs font-bold text-[#1E293B] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {localClientes.map((cli) => {
                          const isSelected = selectedClientDetail?.id === cli.id;
                          return (
                            <tr 
                              key={cli.id} 
                              className={`transition-colors cursor-pointer ${
                                isSelected ? 'bg-teal-50/20 hover:bg-teal-50/30' : 'hover:bg-slate-50/50'
                              }`}
                              onClick={() => setSelectedClientDetail(cli)}
                            >
                              <td className="p-3 font-bold">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-500 shrink-0">
                                    {cli.nome.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-slate-800 leading-tight">{cli.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{cli.cnpj}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-slate-600">{cli.contato || 'Sem contato'}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{cli.contratosAtivos ?? 1}</td>
                              <td className="p-3 text-center font-bold text-[#0F6E6E]">{cli.malotesNoMes ?? 0}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  (cli.status ?? 'Ativo') === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {cli.status ?? 'Ativo'}
                                </span>
                              </td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => setSelectedClientDetail(cli)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                                    title="Configurar Campos"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    onClick={() => setLocalClientes(localClientes.filter(c => c.id !== cli.id))}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                    title="Remover"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Detailed Field Configuration Panel (col: 1/3) */}
                <div className="xl:col-span-1 bg-[#F8FAFC] border border-[#E6EAF0] rounded-2xl p-5 space-y-4">
                  {selectedClientDetail ? (
                    <div className="space-y-4">
                      
                      <div className="flex items-start justify-between border-b border-slate-150 pb-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Regras de validação</p>
                          <h4 className="text-sm font-bold text-slate-800 mt-0.5">{selectedClientDetail.nome}</h4>
                        </div>
                        <button
                          onClick={() => setSelectedClientDetail(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* RF-017 Block - Campos Obrigatórios */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-[#0F6E6E]" />
                          <p className="text-xs font-bold text-[#0F6E6E]">Campos obrigatórios para liberar entrega (RF-017)</p>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-relaxed">
                          Marque os dados cadastrais mínimos exigidos pelo OCR ou cadastro manual para aprovar as entregas deste cliente.
                        </p>

                        <div className="space-y-2 pt-2">
                          {[
                            { key: 'nome', label: 'Nome do beneficiário' },
                            { key: 'cpf', label: 'CPF válido' },
                            { key: 'endereco', label: 'Endereço completo (Logradouro + Nº)' },
                            { key: 'cep', label: 'CEP operacional' },
                            { key: 'telefone', label: 'Telefone de contato' },
                            { key: 'tipoItem', label: 'Tipo de item (Cartão, Boleto, etc.)' }
                          ].map((item) => {
                            const isChecked = selectedClientDetail.camposObrigatorios?.[item.key as keyof typeof selectedClientDetail.camposObrigatorios] ?? false;
                            return (
                              <label 
                                key={item.key} 
                                className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-[#0F6E6E]/20 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    const updatedClients = localClientes.map(c => {
                                      if (c.id === selectedClientDetail.id) {
                                        return {
                                          ...c,
                                          camposObrigatorios: {
                                            ...(c.camposObrigatorios || {
                                              nome: true, cpf: true, endereco: true, cep: true, telefone: false, tipoItem: true
                                            }),
                                            [item.key]: val
                                          }
                                        };
                                      }
                                      return c;
                                    });
                                    setLocalClientes(updatedClients);
                                    setSelectedClientDetail({
                                      ...selectedClientDetail,
                                      camposObrigatorios: {
                                        ...(selectedClientDetail.camposObrigatorios || {
                                          nome: true, cpf: true, endereco: true, cep: true, telefone: false, tipoItem: true
                                        }),
                                        [item.key]: val
                                      }
                                    });
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F6E6E] focus:ring-[#0F6E6E] accent-[#0F6E6E]"
                                />
                                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                        <Briefcase size={20} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Selecione um cliente</h4>
                      <p className="text-[10px] text-slate-400 max-w-[180px] leading-relaxed">
                        Selecione um cliente ao lado para customizar o checklist de preenchimento obrigatório (RF-017/RF-020).
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB: MOTIVOS DE INSUCESSO */}
          {activeTab === 'motivos' && (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center pb-2">
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">
                    Ordene arraste ou use os botões para reordenar os motivos de ocorrência padrão (Seção 9.1).
                  </p>
                  <p className="text-[10px] text-[#0F6E6E] font-medium mt-0.5">
                    *Mudar a ordem ou desativar afeta o aplicativo do entregador e os 4 motivos rápidos.
                  </p>
                </div>
                <button
                  id="btn-novo-motivo"
                  onClick={() => setIsNewReasonModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F6E6E] text-white hover:bg-[#0c5959] text-xs font-bold rounded-xl shadow-3xs cursor-pointer transition-colors shrink-0"
                >
                  <Plus size={14} />
                  <span>Novo motivo</span>
                </button>
              </div>

              {/* Orderable interactive list of failure reasons */}
              <div className="space-y-2.5 max-w-4xl">
                {localConfig.motivosInsucesso.map((mot, i) => (
                  <div
                    key={mot.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-white border rounded-xl hover:shadow-3xs transition-all ${
                      draggedIndex === i ? 'opacity-40 border-[#0F6E6E] bg-teal-50/10' : 'border-[#E6EAF0]'
                    }`}
                  >
                    
                    {/* Reason Details */}
                    <div className="flex items-center gap-3">
                      
                      {/* Drag Handle & Ordering controls */}
                      <div className="flex flex-col md:flex-row items-center gap-1">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => moveReason(i, 'up')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={i === localConfig.motivosInsucesso.length - 1}
                          onClick={() => moveReason(i, 'down')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="w-6 h-6 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-100">
                        {i + 1}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{mot.nome}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cliente: <strong className="text-[#0F6E6E]">{mot.cliente}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Operational Toggles */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 ml-auto">
                      
                      {/* Toggle: Ativo */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Ativo</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localConfig.motivosInsucesso.map((m, idx) => 
                              idx === i ? { ...m, ativo: !m.ativo } : m
                            );
                            setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                          }}
                          className="cursor-pointer"
                        >
                          {mot.ativo ? (
                            <ToggleRight size={26} className="text-[#0F6E6E]" />
                          ) : (
                            <ToggleLeft size={26} className="text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Toggle: Exige justificativa */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500" title="Obriga o entregador a descrever textualmente">Exige obs</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localConfig.motivosInsucesso.map((m, idx) => 
                              idx === i ? { ...m, exigeJustificativa: !m.exigeJustificativa } : m
                            );
                            setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                          }}
                          className="cursor-pointer"
                        >
                          {mot.exigeJustificativa ? (
                            <ToggleRight size={26} className="text-[#0F6E6E]" />
                          ) : (
                            <ToggleLeft size={26} className="text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Toggle: Exige foto */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500" title="Exige anexação de foto da fachada do endereço">Exige foto</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localConfig.motivosInsucesso.map((m, idx) => 
                              idx === i ? { ...m, exigeFoto: !m.exigeFoto } : m
                            );
                            setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                          }}
                          className="cursor-pointer"
                        >
                          {mot.exigeFoto ? (
                            <ToggleRight size={26} className="text-[#0F6E6E]" />
                          ) : (
                            <ToggleLeft size={26} className="text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Quick Dropdown: Cliente Specific */}
                      <div className="flex items-center gap-1">
                        <select
                          value={mot.cliente}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = localConfig.motivosInsucesso.map((m, idx) => 
                              idx === i ? { ...m, cliente: val } : m
                            );
                            setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="Todos">Todos</option>
                          {localClientes.map(c => (
                            <option key={c.id} value={c.nome}>{c.nome}</option>
                          ))}
                        </select>
                      </div>

                      {/* Delete reason */}
                      <button
                        onClick={() => {
                          const updated = localConfig.motivosInsucesso.filter((_, idx) => idx !== i);
                          setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                        }}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Deletar motivo"
                      >
                        <Trash2 size={13} />
                      </button>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: OCR E IMPORTAÇÃO */}
          {activeTab === 'ocr' && (
            <div className="space-y-8 max-w-3xl divide-y divide-slate-100">
              
              {/* Revisão Humana */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Processamento de OCR</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Exigência de compliance de revisão para validação dos dados extraídos.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-3 max-w-xl">
                  <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-xl opacity-85 select-none">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">Revisão humana obrigatória antes de salvar</p>
                      <p className="text-[11px] text-red-600 font-bold">LIGADO E BLOQUEADO — ITEM 17.3</p>
                    </div>
                    <ToggleRight size={38} className="text-slate-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#991B1B] bg-[#FEF2F2] p-2.5 rounded-xl border border-[#FEE2E2] font-semibold leading-relaxed flex items-start gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>Item 17.3: o sistema não garante precisão do OCR sem revisão humana.</span>
                  </p>
                </div>
              </div>

              {/* Slider Limite de confiança */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Sinalização de Inconsistência</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Limite mínimo de acurácia estatística para destacar um campo como suspeito ou de baixa confiança.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-2 max-w-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                    <span>Limite de confiança para sinalizar campo</span>
                    <span className="text-[#0F6E6E] bg-teal-50 px-2 py-0.5 rounded-md text-xs font-extrabold border border-teal-100">
                      {localConfig.ocrLimiteConfianca}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={localConfig.ocrLimiteConfianca}
                    onChange={(e) => setLocalConfig({ ...localConfig, ocrLimiteConfianca: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0F6E6E]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>50% (Baixo rigor)</span>
                    <span>80% (Padrão)</span>
                    <span>95% (Máxima Acurácia)</span>
                  </div>
                </div>
              </div>

              {/* Campos Extraídos obrigatoriamente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Campos Extraídos</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Campos de preenchimento compulsório extraídos da etiqueta para aprovar OCR.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-3 max-w-xl">
                  <div className="grid grid-cols-2 gap-3.5">
                    {[
                      'Nome', 'CPF', 'Logradouro', 'Número', 'CEP', 'Telefone', 'Tipo de item'
                    ].map((fld) => {
                      const isChecked = localConfig.ocrCamposObrigatorios.includes(fld);
                      return (
                        <label 
                          key={fld}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 hover:border-[#0F6E6E]/20 cursor-pointer text-xs font-bold text-slate-700"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const val = e.target.checked;
                              const updatedFields = val 
                                ? [...localConfig.ocrCamposObrigatorios, fld]
                                : localConfig.ocrCamposObrigatorios.filter(f => f !== fld);
                              setLocalConfig({ ...localConfig, ocrCamposObrigatorios: updatedFields });
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F6E6E] accent-[#0F6E6E]"
                          />
                          <span>{fld}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Formato do Arquivo de importação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 pb-2">
                <div className="md:col-span-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Planilha de Importação</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Define o layout e formato suportado para upload de arquivos em lote.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-3 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Formato do arquivo de importação
                    </label>
                    <select
                      value={localConfig.ocrFormatoArquivo}
                      onChange={(e) => setLocalConfig({ ...localConfig, ocrFormatoArquivo: e.target.value as any })}
                      className="p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold text-slate-800 outline-none w-full md:w-48"
                    >
                      <option value="xlsx">Excel (.xlsx)</option>
                      <option value="csv">Texto Separado por Vírgulas (.csv)</option>
                    </select>
                  </div>
                  <div className="pt-1.5">
                    <button 
                      type="button"
                      onClick={() => {
                        setCustomToast({
                          title: 'Download Iniciado',
                          sub: 'O arquivo de modelo (.xlsx) para preenchimento de malotes foi baixado com sucesso!'
                        });
                        setTimeout(() => setCustomToast(null), 4000);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0F6E6E] hover:text-[#0c5959] cursor-pointer bg-transparent border-none p-0 outline-none"
                    >
                      <Download size={13} />
                      <u>Baixar modelo de planilha</u>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-4">
              
              {/* Search and filter controls */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3.5">
                
                {/* Search Text */}
                <div className="md:col-span-2 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Filtrar por ação, entidade ou valor..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#0F6E6E]"
                  />
                </div>

                {/* Filter User */}
                <div>
                  <select
                    value={auditUserFilter}
                    onChange={(e) => setAuditUserFilter(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="Todos">Usuário: Todos</option>
                    {auditUsers.filter(u => u !== 'Todos').map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Entity */}
                <div>
                  <select
                    value={auditEntityFilter}
                    onChange={(e) => setAuditEntityFilter(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="Todos">Entidade: Todas</option>
                    {auditEntities.filter(ent => ent !== 'Todos').map(ent => (
                      <option key={ent} value={ent}>{ent}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Action */}
                <div className="flex gap-2">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="Todos">Ação: Todas</option>
                    {auditActions.filter(act => act !== 'Todos').map(act => (
                      <option key={act} value={act}>{act}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      setCustomToast({
                        title: 'Auditoria Exportada',
                        sub: 'O relatório completo da trilha de auditoria foi exportado em formato CSV com sucesso!'
                      });
                      setTimeout(() => setCustomToast(null), 4000);
                    }}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[#0F6E6E] flex items-center justify-center cursor-pointer transition-colors"
                    title="Exportar logs"
                  >
                    <Download size={14} />
                  </button>
                </div>

              </div>

              {/* Auditoria Data Table */}
              <div className="overflow-x-auto border border-[#E6EAF0] rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0]">
                      <th className="p-3 text-xs font-bold text-[#1E293B] w-40">Data/Hora</th>
                      <th className="p-3 text-xs font-bold text-[#1E293B] w-44">Usuário</th>
                      <th className="p-3 text-xs font-bold text-[#1E293B]">Ação / Evento</th>
                      <th className="p-3 text-xs font-bold text-[#1E293B] w-36">Entidade</th>
                      <th className="p-3 text-xs font-bold text-[#1E293B] w-28">Origem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-xs font-medium">
                    {filteredAudits.length > 0 ? (
                      filteredAudits.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-[#64748B] font-mono whitespace-nowrap">{a.dataHora}</td>
                          <td className="p-3 font-bold text-slate-800">{a.usuario}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-bold text-slate-800">{a.acao}</p>
                              {a.valorNovo && (
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed bg-slate-50 p-1.5 rounded-md border border-slate-100 font-mono">
                                  {a.valorAnterior ? (
                                    <span>De [<strong>{a.valorAnterior}</strong>] para [<strong>{a.valorNovo}</strong>]</span>
                                  ) : (
                                    <span>{a.valorNovo}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {a.entidade}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[#0F6E6E] font-semibold text-[10px]">
                              {a.origem || 'Sistema'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Nenhum registro de auditoria encontrado correspondente aos filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* FIXED FOOTER WITH ACTIONS */}
        <div className="bg-[#F8FAFC] border-t border-[#F1F5F9] px-6 py-4 flex justify-between items-center gap-4 shrink-0">
          <p className="text-xs text-[#64748B] font-medium">
            {isDirty 
              ? 'Você possui alterações não salvas nos parâmetros do sistema.' 
              : 'As configurações estão atualizadas e salvas.'}
          </p>
          <div className="flex items-center gap-2">
            
            {/* Cancel/Reset Local state button */}
            {isDirty && (
              <button
                onClick={() => {
                  setLocalConfig(JSON.parse(JSON.stringify(state.configuracoes)));
                  setLocalUsuarios(JSON.parse(JSON.stringify(state.usuarios)));
                  setLocalClientes(JSON.parse(JSON.stringify(state.clientes)));
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Descartar mudanças
              </button>
            )}

            <button
              onClick={handleSaveChanges}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer ${
                isDirty 
                  ? 'bg-[#0F6E6E] text-white hover:bg-[#0c5959]' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Check size={14} />
              <span>Salvar alterações</span>
            </button>
          </div>
        </div>

      </div>

      {/* CONFIRM USER INACTIVATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmInactivateUser && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[20px] max-w-sm w-full p-6 border border-[#E6EAF0] shadow-xl text-center space-y-4"
            >
              <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Confirmar Inativação?</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Deseja realmente inativar o usuário <strong>{confirmInactivateUser.nome}</strong>? O acesso será revogado imediatamente de forma operacional.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setConfirmInactivateUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const updated = localUsuarios.map(u => 
                      u.id === confirmInactivateUser.id ? { ...u, ativo: false } : u
                    );
                    setLocalUsuarios(updated);
                    setConfirmInactivateUser(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Confirmar e Inativar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW USER MODAL FORM */}
      <AnimatePresence>
        {isNewUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-[20px] max-w-md w-full border border-[#E6EAF0] shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Novo Usuário</h3>
                <button onClick={() => setIsNewUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: joao.silva@sistema.com.br"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Perfil / Cargo</label>
                  <select
                    value={newUser.perfil}
                    onChange={(e) => setNewUser({ ...newUser, perfil: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none text-slate-800"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Operação">Operação</option>
                    <option value="Motoboy">Motoboy</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Contratante">Contratante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade / Polo</label>
                  <input
                    type="text"
                    value={newUser.unidade}
                    onChange={(e) => setNewUser({ ...newUser, unidade: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: Central SP / Zona Norte"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const added: UsuarioSistema = {
                      id: `user-${Date.now()}`,
                      nome: newUser.nome,
                      email: newUser.email,
                      perfil: newUser.perfil,
                      unidade: newUser.unidade,
                      ultimoAcesso: 'Nunca',
                      ativo: true
                    };
                    setLocalUsuarios([...localUsuarios, added]);
                    setIsNewUserModalOpen(false);
                    setNewUser({ nome: '', email: '', perfil: 'Operação', unidade: 'Central SP' });
                  }}
                  disabled={!newUser.nome || !newUser.email}
                  className="px-4 py-2 bg-[#0F6E6E] hover:bg-[#0c5959] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CLIENT MODAL FORM */}
      <AnimatePresence>
        {isNewClientModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-[20px] max-w-md w-full border border-[#E6EAF0] shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Novo Cliente Contratante</h3>
                <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={newClient.nome}
                    onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: Laboratório Diagnósticos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={newClient.cnpj}
                    onChange={(e) => setNewClient({ ...newClient, cnpj: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contato Responsável</label>
                  <input
                    type="text"
                    value={newClient.contato}
                    onChange={(e) => setNewClient({ ...newClient, contato: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: Clara Souza (Gerente)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Sede</label>
                  <input
                    type="text"
                    value={newClient.endereco}
                    onChange={(e) => setNewClient({ ...newClient, endereco: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: Avenida Rebouças, 2200, SP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contratos Ativos</label>
                  <input
                    type="number"
                    value={newClient.contratosAtivos}
                    onChange={(e) => setNewClient({ ...newClient, contratosAtivos: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                {/* Logo Upload Simulation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[11px] font-bold text-slate-600 mb-1">Logotipo da Empresa</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomToast({
                            title: 'Logo Carregado',
                            sub: 'O logotipo da contratante foi processado e simulado com sucesso!'
                          });
                          setTimeout(() => setCustomToast(null), 4000);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Upload Logotipo
                      </button>
                      <p className="text-[9px] text-slate-400 mt-1">Formatos PNG, JPG até 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const added: Cliente = {
                      id: `cli-${Date.now()}`,
                      nome: newClient.nome,
                      cnpj: newClient.cnpj,
                      endereco: newClient.endereco,
                      contato: newClient.contato,
                      contratosAtivos: newClient.contratosAtivos,
                      malotesNoMes: 0,
                      status: 'Ativo',
                      camposObrigatorios: { ...newClient.camposObrigatorios }
                    };
                    setLocalClientes([...localClientes, added]);
                    setIsNewClientModalOpen(false);
                    // Reset
                    setNewClient({
                      nome: '', cnpj: '', endereco: '', contato: '', contratosAtivos: 1,
                      camposObrigatorios: { nome: true, cpf: true, endereco: true, cep: true, telefone: false, tipoItem: true }
                    });
                  }}
                  disabled={!newClient.nome || !newClient.cnpj}
                  className="px-4 py-2 bg-[#0F6E6E] hover:bg-[#0c5959] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW FAILURE REASON MODAL FORM */}
      <AnimatePresence>
        {isNewReasonModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-[20px] max-w-md w-full border border-[#E6EAF0] shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Novo Motivo de Insucesso</h3>
                <button onClick={() => setIsNewReasonModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Nome do Motivo</label>
                  <input
                    type="text"
                    value={newReason.nome}
                    onChange={(e) => setNewReason({ ...newReason, nome: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none"
                    placeholder="Ex: Beneficiário faleceu"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Exigir justificativa textual</p>
                    <p className="text-[10px] text-slate-400">Obriga o preenchimento do campo de observações</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewReason({ ...newReason, exigeJustificativa: !newReason.exigeJustificativa })}
                    className="cursor-pointer"
                  >
                    {newReason.exigeJustificativa ? (
                      <ToggleRight size={26} className="text-[#0F6E6E]" />
                    ) : (
                      <ToggleLeft size={26} className="text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">Exigir foto comprovante</p>
                    <p className="text-[10px] text-slate-400">Obriga a tirar foto da fachada para finalizar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewReason({ ...newReason, exigeFoto: !newReason.exigeFoto })}
                    className="cursor-pointer"
                  >
                    {newReason.exigeFoto ? (
                      <ToggleRight size={26} className="text-[#0F6E6E]" />
                    ) : (
                      <ToggleLeft size={26} className="text-slate-300" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Restringir ao Cliente</label>
                  <select
                    value={newReason.cliente}
                    onChange={(e) => setNewReason({ ...newReason, cliente: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#E6EAF0] rounded-xl text-xs font-bold outline-none text-slate-800"
                  >
                    <option value="Todos">Todos os clientes (Geral)</option>
                    {localClientes.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setIsNewReasonModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const added: MotivoInsucesso = {
                      id: `mot-${Date.now()}`,
                      nome: newReason.nome,
                      ativo: true,
                      exigeJustificativa: newReason.exigeJustificativa,
                      exigeFoto: newReason.exigeFoto,
                      cliente: newReason.cliente
                    };
                    const updated = [...localConfig.motivosInsucesso, added];
                    setLocalConfig({ ...localConfig, motivosInsucesso: updated });
                    setIsNewReasonModalOpen(false);
                    setNewReason({ nome: '', exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' });
                  }}
                  disabled={!newReason.nome}
                  className="px-4 py-2 bg-[#0F6E6E] hover:bg-[#0c5959] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Adicionar Motivo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS TOAST MESSAGE */}
      <AnimatePresence>
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-3"
            >
              <CheckCircle size={18} />
              <div className="text-xs">
                <p className="font-bold">Alterações salvas com sucesso!</p>
                <p className="text-[10px] text-emerald-100 mt-0.5">Parâmetros e tabelas de dados atualizados no sistema.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM TOAST MESSAGE */}
      <AnimatePresence>
        {customToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm"
            >
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-100">{customToast.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{customToast.sub}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
