import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Tag, 
  Calendar, 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  BookOpen, 
  Info, 
  Check, 
  X, 
  Search, 
  FileSpreadsheet, 
  FileCheck, 
  Pencil, 
  Upload, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { StatusMalote, Prioridade, Malote } from '../types';

export default function NovoMalote() {
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // Form Field States
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [codigo, setCodigo] = useState('MAL-2025-05-129');
  const [tipoRecebimento, setTipoRecebimento] = useState('Físico');
  const [dataRecebimento, setDataRecebimento] = useState('2025-05-26');
  const [responsavel, setResponsavel] = useState('Ana Martins');
  const [unidade, setUnidade] = useState('Filial Central - São Paulo');
  const [qtdCartoes, setQtdCartoes] = useState(0);
  const [qtdBoletos, setQtdBoletos] = useState(0);
  const [qtdCarnes, setQtdCarnes] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  
  // Step 2 Option State: 'planilha' | 'ocr' | 'manual'
  const [cadastroOpcao, setCadastroOpcao] = useState<'planilha' | 'ocr' | 'manual'>('planilha');

  // Modal and loading states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Validation Error States
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Close client search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClienteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-fill form when Step 2 of the demo is active
  useEffect(() => {
    if (state.demoState?.preFillNovoMalote) {
      setSelectedClienteId('cli-1'); // Hospital São Lucas
      setCodigo('MAL-128');
      setQtdCartoes(120);
      setQtdBoletos(0);
      setQtdCarnes(0);
      setObservacoes('Malote contendo cartões de beneficiários do Hospital São Lucas. Lote gerado para homologação do fluxo logístico de remessa.');
    }
  }, [state.demoState?.preFillNovoMalote]);

  // Filter clients based on search input
  const filteredClientes = useMemo(() => {
    if (!clienteBusca) return state.clientes;
    return state.clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
      cliente.cnpj.includes(clienteBusca)
    );
  }, [state.clientes, clienteBusca]);

  // Selected client object
  const selectedCliente = useMemo(() => {
    return state.clientes.find(c => c.id === selectedClienteId) || null;
  }, [state.clientes, selectedClienteId]);

  // Calculate total items
  const totalItens = useMemo(() => {
    return Number(qtdCartoes || 0) + Number(qtdBoletos || 0) + Number(qtdCarnes || 0);
  }, [qtdCartoes, qtdBoletos, qtdCarnes]);

  // Format date to Brazilian format (DD/MM/YYYY) for display
  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '—';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Validate fields according to RF-017
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedClienteId) {
      newErrors.cliente = 'Selecione o cliente contratante.';
    }
    if (!codigo.trim()) {
      newErrors.codigo = 'O código do malote é obrigatório.';
    }
    if (!tipoRecebimento) {
      newErrors.tipoRecebimento = 'Selecione o tipo de recebimento.';
    }
    if (!dataRecebimento) {
      newErrors.dataRecebimento = 'Selecione a data de recebimento.';
    }
    if (!responsavel) {
      newErrors.responsavel = 'Selecione o responsável pelo recebimento.';
    }
    if (!unidade) {
      newErrors.unidade = 'Selecione a unidade de recebimento.';
    }

    // Number validations
    if (qtdCartoes < 0) newErrors.qtdCartoes = 'Não pode ser negativo.';
    if (qtdBoletos < 0) newErrors.qtdBoletos = 'Não pode ser negativo.';
    if (qtdCarnes < 0) newErrors.qtdCarnes = 'Não pode ser negativo.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit action
  const handleReceberMalote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Smooth scroll to top of form or errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Create the new malote object
    const novoMalote: Malote = {
      id: `MAL-${Date.now()}`,
      codigo: codigo.trim(),
      clienteId: selectedClienteId,
      tipoRecebimento: `${tipoRecebimento} (${totalItens} itens)`,
      dataRecebimento: formatDateBR(dataRecebimento),
      responsavel,
      unidade,
      qtdCartoes: Number(qtdCartoes),
      qtdBoletos: Number(qtdBoletos),
      qtdCarnes: Number(qtdCarnes),
      observacoes: observacoes.trim() || undefined,
      status: 'Recebido',
      prioridade: 'Média' as Prioridade,
      etapas: [
        {
          nome: 'Recebido',
          concluida: true,
          dataHora: new Date().toLocaleString('pt-BR'),
          responsavel
        },
        {
          nome: 'Em conferência',
          concluida: false
        },
        {
          nome: 'Em cadastramento',
          concluida: false
        },
        {
          nome: 'Pronto para distribuição',
          concluida: false
        },
        {
          nome: 'Em distribuição',
          concluida: false
        },
        {
          nome: 'Concluído',
          concluida: false
        }
      ]
    };

    // Dispatch action to save in context
    dispatch({ type: 'ADICIONAR_MALOTE', payload: novoMalote });

    // Handle navigation/workflows based on Step 2 option
    if (cadastroOpcao === 'ocr') {
      navigate(`/malotes/${novoMalote.id}/ocr`);
    } else if (cadastroOpcao === 'manual') {
      navigate(`/malotes/${novoMalote.id}/itens/novo`);
    } else if (cadastroOpcao === 'planilha') {
      // Open the interactive upload spreadsheet modal
      setIsUploadModalOpen(true);
    }
  };

  // Confirm Spreadsheet Import inside Modal
  const handleConfirmPlanilhaUpload = () => {
    if (!uploadFile) return;
    setIsUploading(true);
    
    // Simulate parse process
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Navigate to malote details after short delay
      setTimeout(() => {
        setIsUploadModalOpen(false);
        // Find newly added malote or fallback
        const latestMalote = state.malotes[0] || { id: 'MAL-2025-0526-128' };
        navigate(`/malotes`);
      }, 1500);
    }, 2000);
  };

  const handleSalvarRascunho = () => {
    if (!codigo.trim() || !selectedClienteId) {
      setErrors({
        cliente: !selectedClienteId ? 'Selecione o cliente contratante para salvar rascunho.' : '',
        codigo: !codigo.trim() ? 'Código obrigatório para rascunho.' : ''
      });
      return;
    }

    const novoRascunho: Malote = {
      id: `MAL-${Date.now()}`,
      codigo: codigo.trim(),
      clienteId: selectedClienteId,
      tipoRecebimento: `${tipoRecebimento} (${totalItens} itens)`,
      dataRecebimento: formatDateBR(dataRecebimento),
      responsavel,
      unidade,
      qtdCartoes: Number(qtdCartoes),
      qtdBoletos: Number(qtdBoletos),
      qtdCarnes: Number(qtdCarnes),
      observacoes: observacoes.trim() || undefined,
      status: 'Em cadastramento',
      prioridade: 'Baixa' as Prioridade,
      etapas: [
        {
          nome: 'Recebido',
          concluida: true,
          dataHora: new Date().toLocaleString('pt-BR'),
          responsavel
        }
      ]
    };

    dispatch({ type: 'ADICIONAR_MALOTE', payload: novoRascunho });
    navigate('/malotes');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
        <span className="hover:text-[#0F172A] cursor-pointer transition-colors" onClick={() => navigate('/malotes')}>Malotes</span>
        <span>›</span>
        <span className="text-[#0F172A] font-semibold">Novo malote</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Novo malote</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Cadastre um novo malote recebido, defina as quantidades estimadas de itens e escolha a forma de processamento.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column (75% / 3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          <form onSubmit={handleReceberMalote} className="space-y-6">
            
            {/* Card 1: Informações do malote */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs space-y-6" id="card-info-malote">
              <div className="border-b border-[#F1F5F9] pb-4">
                <h2 className="text-lg font-semibold text-[#2563EB]">1. Informações do malote</h2>
              </div>

              {/* Grid 3 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                
                {/* Cliente contratante */}
                <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Cliente contratante <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={selectedCliente ? selectedCliente.nome : clienteBusca}
                      onChange={(e) => {
                        if (selectedCliente) {
                          setSelectedClienteId('');
                          setClienteBusca(e.target.value);
                        } else {
                          setClienteBusca(e.target.value);
                        }
                        setIsClienteDropdownOpen(true);
                      }}
                      onFocus={() => setIsClienteDropdownOpen(true)}
                      placeholder="Buscar cliente..."
                      className={`w-full bg-white border rounded-lg pl-9 pr-8 py-2 font-semibold text-slate-700 focus:outline-none transition-colors ${errors.cliente ? 'border-red-500 bg-red-50/10' : 'border-[#E6EAF0] focus:border-[#2563EB]'}`}
                    />
                    {selectedCliente && (
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedClienteId('');
                          setClienteBusca('');
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {errors.cliente && (
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                      <AlertCircle size={12} /> {errors.cliente}
                    </span>
                  )}

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {isClienteDropdownOpen && !selectedCliente && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 left-0 right-0 top-[60px] bg-white border border-[#E6EAF0] rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100"
                      >
                        {filteredClientes.length > 0 ? (
                          filteredClientes.map((cliente) => (
                            <div 
                              key={cliente.id}
                              onClick={() => {
                                setSelectedClienteId(cliente.id);
                                setClienteBusca(cliente.nome);
                                setIsClienteDropdownOpen(false);
                                if (errors.cliente) setErrors(prev => ({ ...prev, cliente: '' }));
                              }}
                              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="font-bold text-slate-700">{cliente.nome}</div>
                              <div className="text-[10px] text-slate-400 font-medium mt-0.5">CNPJ: {cliente.cnpj}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-slate-400 font-medium text-center">
                            Nenhum cliente encontrado
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Código do malote */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Código do malote <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => {
                      setCodigo(e.target.value);
                      if (errors.codigo) setErrors(prev => ({ ...prev, codigo: '' }));
                    }}
                    placeholder="Ex.: MAL-2025-05-129"
                    className={`w-full bg-white border rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none transition-colors ${errors.codigo ? 'border-red-500 bg-red-50/10' : 'border-[#E6EAF0] focus:border-[#2563EB]'}`}
                  />
                  {errors.codigo && (
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                      <AlertCircle size={12} /> {errors.codigo}
                    </span>
                  )}
                </div>

                {/* Tipo de recebimento */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Tipo de recebimento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoRecebimento}
                    onChange={(e) => setTipoRecebimento(e.target.value)}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Físico">Físico</option>
                    <option value="Digital">Digital</option>
                    <option value="Misto">Misto</option>
                  </select>
                </div>

                {/* Data de recebimento */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Data de recebimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dataRecebimento}
                    onChange={(e) => setDataRecebimento(e.target.value)}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Responsável pelo recebimento */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Responsável pelo recebimento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Ana Martins">Ana Martins</option>
                    <option value="João Paulo">João Paulo</option>
                    <option value="Fernanda Lima">Fernanda Lima</option>
                    <option value="Ricardo Silva">Ricardo Silva</option>
                  </select>
                </div>

                {/* Unidade de recebimento */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Unidade de recebimento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Filial Central - São Paulo">Filial Central - São Paulo</option>
                    <option value="Filial Rio de Janeiro">Filial Rio de Janeiro</option>
                    <option value="Filial Belo Horizonte">Filial Belo Horizonte</option>
                    <option value="Filial Curitiba">Filial Curitiba</option>
                    <option value="Filial Salvador">Filial Salvador</option>
                  </select>
                </div>

                {/* Quantidade de cartões */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Quantidade de cartões <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qtdCartoes}
                    onChange={(e) => setQtdCartoes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Quantidade de boletos */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Quantidade de boletos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qtdBoletos}
                    onChange={(e) => setQtdBoletos(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Quantidade de carnês */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Quantidade de carnês <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qtdCarnes}
                    onChange={(e) => setQtdCarnes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Observações */}
                <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5 relative">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">
                    Observações
                  </label>
                  <textarea
                    maxLength={300}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value.slice(0, 300))}
                    placeholder="Informações adicionais sobre o malote (opcional)"
                    rows={3}
                    className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-slate-400">
                    {observacoes.length}/300
                  </span>
                </div>

              </div>
            </div>

            {/* Card 2: Como deseja cadastrar os itens */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs space-y-6" id="card-tipo-cadastro">
              <div>
                <h2 className="text-lg font-semibold text-[#0F172A]">2. Como deseja cadastrar os itens deste malote?</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Escolha a forma mais prática para adicionar os itens. Você poderá revisar antes de finalizar.
                </p>
              </div>

              {/* Grid 3 opções */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Opção 1: Planilha */}
                <div 
                  onClick={() => setCadastroOpcao('planilha')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${cadastroOpcao === 'planilha' ? 'border-[#0F6E6E] bg-teal-50/5' : 'border-[#E6EAF0] hover:border-slate-300'}`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cadastroOpcao === 'planilha' ? 'border-[#0F6E6E] bg-[#0F6E6E]' : 'border-slate-300'}`}>
                      {cadastroOpcao === 'planilha' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Importar planilha</h3>
                      <p className="text-[10.5px] text-[#64748B] mt-1 leading-normal font-medium">
                        Importe uma planilha .xlsx com os itens do malote.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                </div>

                {/* Opção 2: OCR */}
                <div 
                  onClick={() => setCadastroOpcao('ocr')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${cadastroOpcao === 'ocr' ? 'border-[#0F6E6E] bg-teal-50/5' : 'border-[#E6EAF0] hover:border-slate-300'}`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cadastroOpcao === 'ocr' ? 'border-[#0F6E6E] bg-[#0F6E6E]' : 'border-slate-300'}`}>
                      {cadastroOpcao === 'ocr' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Leitura OCR</h3>
                      <p className="text-[10.5px] text-[#64748B] mt-1 leading-normal font-medium">
                        Faça o upload de uma imagem ou PDF e extraia os dados automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Rápido
                    </span>
                  </div>
                </div>

                {/* Opção 3: Manual */}
                <div 
                  onClick={() => setCadastroOpcao('manual')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${cadastroOpcao === 'manual' ? 'border-[#0F6E6E] bg-teal-50/5' : 'border-[#E6EAF0] hover:border-slate-300'}`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${cadastroOpcao === 'manual' ? 'border-[#0F6E6E] bg-[#0F6E6E]' : 'border-slate-300'}`}>
                      {cadastroOpcao === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Pencil size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Cadastro manual</h3>
                      <p className="text-[10.5px] text-[#64748B] mt-1 leading-normal font-medium">
                        Cadastre os itens um a um manualmente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      Manual
                    </span>
                  </div>
                </div>

              </div>

              {/* Faixa azul clara com ícone info */}
              <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1E40AF] leading-relaxed font-semibold">
                  Dica: após importar ou cadastrar, você poderá revisar, editar e remover itens antes de confirmar o recebimento.
                </p>
              </div>

              {/* Rodapé do card com ações */}
              <div className="border-t border-[#F1F5F9] pt-5 flex items-center justify-between">
                <div>
                  <button 
                    type="button"
                    onClick={handleSalvarRascunho}
                    className="px-4 py-2 border border-[#E6EAF0] text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Salvar rascunho
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => navigate('/malotes')}
                    className="px-4 py-2 border border-[#E6EAF0] text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0F6E6E] hover:bg-[#0B5757] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check size={15} />
                    Receber malote
                  </button>
                </div>
              </div>

            </div>

          </form>

        </div>

        {/* Right Column (25% / 1 Col) - Resumo fixo */}
        <div className="space-y-6">
          
          {/* Card Resumo do malote */}
          <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-5 shadow-xs space-y-5" id="summary-right-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Resumo do malote
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                Novo malote
              </span>
            </div>

            <div className="space-y-1 border-b border-[#F1F5F9] pb-4">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Código</div>
              <div className="text-xl font-bold text-[#0F172A] tracking-tight font-mono">
                {codigo || '—'}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Cliente */}
              <div className="flex items-start gap-2.5">
                <Building size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente</div>
                  <div className="font-bold text-slate-700 leading-tight">
                    {selectedCliente ? selectedCliente.nome : '—'}
                  </div>
                </div>
              </div>

              {/* Tipo de recebimento */}
              <div className="flex items-start gap-2.5">
                <Tag size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo de recebimento</div>
                  <div className="font-semibold text-slate-700">
                    {tipoRecebimento || '—'}
                  </div>
                </div>
              </div>

              {/* Data de recebimento */}
              <div className="flex items-start gap-2.5">
                <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data de recebimento</div>
                  <div className="font-semibold text-slate-700">
                    {formatDateBR(dataRecebimento)}
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="flex items-start gap-2.5">
                <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Responsável</div>
                  <div className="font-semibold text-slate-700">
                    {responsavel || '—'}
                  </div>
                </div>
              </div>

              {/* Unidade */}
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unidade</div>
                  <div className="font-semibold text-slate-700">
                    {unidade || '—'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card Totais de itens */}
          <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Totais de itens
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><CreditCard size={13} className="text-[#0F6E6E]" /> Cartões</span>
                <span className="font-bold">{qtdCartoes}</span>
              </div>
              <div className="flex items-center justify-between font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><FileText size={13} className="text-[#2563EB]" /> Boletos</span>
                <span className="font-bold">{qtdBoletos}</span>
              </div>
              <div className="flex items-center justify-between font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-purple-600" /> Carnês</span>
                <span className="font-bold">{qtdCarnes}</span>
              </div>
              
              <div className="border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between font-bold text-slate-800 text-sm">
                <span>Total de itens</span>
                <span>{totalItens}</span>
              </div>
            </div>
          </div>

          {/* Faixa explicativa */}
          <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 flex items-start gap-2.5">
            <Info size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-[#1E40AF] leading-normal font-semibold">
              O resumo será atualizado automaticamente conforme os dados forem preenchidos.
            </p>
          </div>

        </div>

      </div>

      {/* Spreadsheet Import Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 max-w-lg w-full space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <h2 className="text-sm font-bold text-[#0F172A]">Importar Planilha de Itens</h2>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {!uploadSuccess ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Faça o upload do arquivo <span className="font-mono text-emerald-600">.xlsx</span> contendo a relação dos beneficiários e códigos de barras. O sistema processará automaticamente os dados.
                  </p>

                  {/* Drag and Drop Box */}
                  <div 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.xlsx, .xls, .csv';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) setUploadFile(file);
                      };
                      input.click();
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-[#0F6E6E] rounded-xl p-8 text-center cursor-pointer hover:bg-teal-50/5 transition-colors space-y-3"
                  >
                    <Upload size={32} className="text-[#0F6E6E] mx-auto" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">
                        {uploadFile ? uploadFile.name : 'Clique para selecionar ou arraste o arquivo'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'Suporta arquivos .xlsx, .xls ou .csv de até 10MB'}
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Footer */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      disabled={isUploading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPlanilhaUpload}
                      className="px-4 py-2 bg-[#0F6E6E] hover:bg-[#0B5757] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      disabled={!uploadFile || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Confirmar Importação
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-800">Planilha Importada com Sucesso!</h3>
                    <p className="text-[11px] text-slate-500">
                      O malote foi criado e os itens foram vinculados ao sistema com sucesso.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
