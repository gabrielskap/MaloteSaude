import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { motion } from 'motion/react';
import { 
  Mail, 
  Plus, 
  Search, 
  Eye, 
  MoreVertical, 
  CreditCard, 
  FileText, 
  BookOpen, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { StatusMalote } from '../types';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function Malotes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useMalote();

  // Local UI filters
  const [busca, setBusca] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('Todos');
  const [selectedPeriodo, setSelectedPeriodo] = useState('Últimos 7 dias');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync state filters if set from other pages
  useEffect(() => {
    if (state.filtros.status && state.filtros.status !== 'Todos os status') {
      const activeStatus = state.filtros.status;
      // Map 'Entregue' or others to malote equivalent status if necessary, or set directly
      if (['Recebido', 'Em conferência', 'Em cadastramento', 'Pronto para distribuição', 'Em distribuição', 'Parcialmente concluído', 'Concluído'].includes(activeStatus)) {
        setSelectedStatus(activeStatus);
      }
      // Reset filter in context so it doesn't lock the page indefinitely
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Todos os status' } });
    }
  }, [state.filtros.status, dispatch]);

  // Baseline counts from seed to scale numbers dynamically
  const baseMalotes = 13;
  const activeRecebidos = state.malotes.filter(m => m.status === 'Recebido').length;
  const activeEmConferencia = state.malotes.filter(m => m.status === 'Em conferência').length;
  const activeEmDistribuicao = state.malotes.filter(m => m.status === 'Em distribuição').length;
  const activeConcluidos = state.malotes.filter(m => m.status === 'Concluído').length;

  const totalRecebidosHoje = 128 + (state.malotes.length - baseMalotes);
  const totalEmConferencia = 56 + (activeEmConferencia - 2);
  const totalEmDistribuicao = 86 + (activeEmDistribuicao - 3);
  const totalFinalizados = 215 + (activeConcluidos - 4);

  // Map status to progress percentage
  const getMaloteProgress = (status: StatusMalote): number => {
    switch (status) {
      case 'Concluído':
      case 'Concluído com devoluções':
        return 100;
      case 'Parcialmente concluído':
        return 85;
      case 'Em distribuição':
        return 70;
      case 'Pronto para distribuição':
        return 50;
      case 'Em cadastramento':
        return 35;
      case 'Em conferência':
        return 20;
      case 'Recebido':
        return 10;
      default:
        return 0;
    }
  };

  // Get progress bar color
  const getProgressColorClass = (percent: number) => {
    if (percent === 100) return 'bg-emerald-500';
    if (percent < 25) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  // Helper for status badge styles
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Parcialmente concluído':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Em distribuição':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Em conferência':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Em cadastramento':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Recebido':
        return 'bg-slate-50 text-slate-700 border-slate-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  // Helper to resolve malote item icon and description
  const getItemDetails = (malote: any) => {
    let icon = <FileText size={15} className="text-[#64748B]" />;
    let text = '';
    
    if (malote.qtdCartoes > 0) {
      icon = <CreditCard size={15} className="text-[#0F6E6E]" />;
      text = `${malote.qtdCartoes} cartões`;
    } else if (malote.qtdBoletos > 0) {
      icon = <FileText size={15} className="text-[#2563EB]" />;
      text = `${malote.qtdBoletos} boletos`;
    } else if (malote.qtdCarnes > 0) {
      icon = <BookOpen size={15} className="text-purple-600" />;
      text = `${malote.qtdCarnes} carnês`;
    } else {
      text = malote.tipoRecebimento || 'Itens';
      icon = <FileSpreadsheet size={15} className="text-amber-600" />;
    }
    return { icon, text };
  };

  // Extract initials from responsible person's name
  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter logic
  const filteredMalotes = useMemo(() => {
    return state.malotes.filter(malote => {
      // Search matches code, client name, or responsible operator
      const client = state.clientes.find(c => c.id === malote.clienteId);
      const clientNome = client ? client.nome : '';
      const matchSearch = 
        malote.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        clientNome.toLowerCase().includes(busca.toLowerCase()) ||
        malote.responsavel.toLowerCase().includes(busca.toLowerCase());

      // Filter by Client
      const matchCliente = selectedCliente === 'Todos' || malote.clienteId === selectedCliente;

      // Filter by Status
      const matchStatus = selectedStatus === 'Todos' || malote.status === selectedStatus;

      // Filter by Period (mock matching for "Hoje", "Últimos 7 dias", "Todos os períodos")
      let matchPeriodo = true;
      if (selectedPeriodo === 'Hoje') {
        // Just mock matching today's malotes (containing '26/05' in seed or recently added)
        matchPeriodo = malote.dataRecebimento.includes('26/05') || malote.id.startsWith('new-');
      }

      return matchSearch && matchCliente && matchStatus && matchPeriodo;
    });
  }, [state.malotes, state.clientes, busca, selectedCliente, selectedStatus, selectedPeriodo]);

  // Paginated item slice
  const paginatedMalotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMalotes.slice(start, start + itemsPerPage);
  }, [filteredMalotes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMalotes.length / itemsPerPage) || 1;

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [busca, selectedCliente, selectedStatus, selectedPeriodo, itemsPerPage]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-[1600px] mx-auto select-none"
    >
      
      {/* Resumo cards on top */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Recebidos */}
        <motion.div 
          variants={cardVariants}
          onClick={() => setSelectedStatus(selectedStatus === 'Recebido' ? 'Todos' : 'Recebido')}
          className={`bg-white rounded-[14px] border p-6 flex items-center gap-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group ${selectedStatus === 'Recebido' ? 'border-[#0F6E6E] bg-teal-50/10' : 'border-[#E6EAF0]'}`}
          id="summary-malotes-recebidos"
        >
          <div className="w-14 h-14 rounded-full bg-[#E8F4F2] text-[#0F6E6E] flex items-center justify-center shrink-0 group-hover:bg-[#0F6E6E] group-hover:text-white transition-colors duration-200">
            <Mail size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recebidos
            </span>
            <div className="text-[28px] font-bold leading-none text-[#0F6E6E]">
              {totalRecebidosHoje}
            </div>
            <div className="text-[#16A34A] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={12} />
              <span>+12% vs. ontem (114)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Em conferência */}
        <motion.div 
          variants={cardVariants}
          onClick={() => setSelectedStatus(selectedStatus === 'Em conferência' ? 'Todos' : 'Em conferência')}
          className={`bg-white rounded-[14px] border p-6 flex items-center gap-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group ${selectedStatus === 'Em conferência' ? 'border-[#2563EB] bg-blue-50/10' : 'border-[#E6EAF0]'}`}
          id="summary-malotes-conferencia"
        >
          <div className="w-14 h-14 rounded-full bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200">
            <Clock size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Em conferência
            </span>
            <div className="text-[28px] font-bold leading-none text-[#2563EB]">
              {totalEmConferencia}
            </div>
            <div className="text-emerald-600 text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={12} />
              <span>+8% vs. ontem (52)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Em distribuição */}
        <motion.div 
          variants={cardVariants}
          onClick={() => setSelectedStatus(selectedStatus === 'Em distribuição' ? 'Todos' : 'Em distribuição')}
          className={`bg-white rounded-[14px] border p-6 flex items-center gap-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group ${selectedStatus === 'Em distribuição' ? 'border-[#EA580C] bg-orange-50/10' : 'border-[#E6EAF0]'}`}
          id="summary-malotes-distribuicao"
        >
          <div className="w-14 h-14 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0 group-hover:bg-[#EA580C] group-hover:text-white transition-colors duration-200">
            <Truck size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Em distribuição
            </span>
            <div className="text-[28px] font-bold leading-none text-[#EA580C]">
              {totalEmDistribuicao}
            </div>
            <div className="text-emerald-600 text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={12} />
              <span>+15% vs. ontem (75)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Finalizados */}
        <motion.div 
          variants={cardVariants}
          onClick={() => setSelectedStatus(selectedStatus === 'Concluído' ? 'Todos' : 'Concluído')}
          className={`bg-white rounded-[14px] border p-6 flex items-center gap-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group ${selectedStatus === 'Concluído' ? 'border-[#16A34A] bg-emerald-50/10' : 'border-[#E6EAF0]'}`}
          id="summary-malotes-finalizados"
        >
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 group-hover:bg-[#16A34A] group-hover:text-white transition-colors duration-200">
            <FileCheck size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Finalizados
            </span>
            <div className="text-[28px] font-bold leading-none text-[#16A34A]">
              {totalFinalizados}
            </div>
            <div className="text-[#16A34A] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={12} />
              <span>+18% vs. ontem (182)</span>
            </div>
          </div>
        </motion.div>

      </section>

      {/* Barra de filtros num Card */}
      <motion.div 
        variants={cardVariants}
        className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs"
        id="malotes-filters-bar"
      >
        <div className="flex flex-col lg:flex-row gap-5 items-end justify-between">
          
          {/* Inputs section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full flex-1">
            
            {/* Campo de busca */}
            <div className="sm:col-span-1 md:col-span-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pesquisa rápida
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar malote, cliente..."
                  className="w-full bg-white border border-[#E6EAF0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Select Cliente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cliente
              </label>
              <select 
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Todos">Todos</option>
                {state.clientes.map(client => (
                  <option key={client.id} value={client.id}>{client.nome}</option>
                ))}
              </select>
            </div>

            {/* Select Período */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Período
              </label>
              <select 
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Todos os períodos">Todos os períodos</option>
                <option value="Hoje">Hoje</option>
                <option value="Últimos 7 dias">Últimos 7 dias</option>
              </select>
            </div>

            {/* Select Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Todos">Todos</option>
                <option value="Recebido">Recebido</option>
                <option value="Em conferência">Em conferência</option>
                <option value="Em cadastramento">Em cadastramento</option>
                <option value="Pronto para distribuição">Pronto para distribuição</option>
                <option value="Em distribuição">Em distribuição</option>
                <option value="Parcialmente concluído">Parcialmente concluído</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>

          </div>

          {/* Action button */}
          <div className="w-full lg:w-auto shrink-0">
            <button 
              onClick={() => navigate('/malotes/novo')}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <Plus size={15} />
              Novo malote
            </button>
          </div>

        </div>
      </motion.div>

      {/* Tabela de malotes */}
      <motion.div 
        variants={cardVariants}
        className="bg-white rounded-[14px] border border-[#E6EAF0] shadow-xs overflow-hidden"
        id="malotes-table-container"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Código do malote</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Recebido em</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 min-w-[180px]">Progresso</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {paginatedMalotes.length > 0 ? (
                paginatedMalotes.map((malote) => {
                  const client = state.clientes.find(c => c.id === malote.clienteId);
                  const clientNome = client ? client.nome : 'Cliente Desconhecido';
                  const { icon, text } = getItemDetails(malote);
                  const progress = getMaloteProgress(malote.status);
                  
                  return (
                    <tr key={malote.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Código */}
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <button 
                            onClick={() => navigate(`/malotes/${malote.id}`)}
                            className="text-[#2563EB] hover:text-[#1D4ED8] font-bold text-left hover:underline cursor-pointer"
                          >
                            {malote.codigo}
                          </button>
                        </div>
                      </td>
                      
                      {/* Cliente */}
                      <td className="py-3.5 px-4 text-[#334155] font-semibold max-w-[160px] truncate" title={clientNome}>
                        {clientNome}
                      </td>
                      
                      {/* Itens */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {icon}
                          <span className="font-semibold text-slate-600">{text}</span>
                        </div>
                      </td>
                      
                      {/* Recebido em */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {malote.dataRecebimento}
                      </td>
                      
                      {/* Responsável */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6.5 h-6.5 rounded-full bg-slate-100 border border-[#E6EAF0] text-[#334155] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(malote.responsavel)}
                          </div>
                          <span className="text-slate-600 font-semibold">{malote.responsavel}</span>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(malote.status)}`}>
                          {malote.status}
                        </span>
                      </td>
                      
                      {/* Progresso */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(progress)}`} 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 shrink-0 min-w-[32px] text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      
                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/malotes/${malote.id}`)}
                            title="Visualizar malote"
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            title="Mais opções"
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Nenhum malote encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        <div className="bg-slate-50/50 border-t border-[#F1F5F9] px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Info */}
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Mostrando <span className="font-bold text-slate-700">{filteredMalotes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * itemsPerPage, filteredMalotes.length)}
            </span>{' '}
            de <span className="font-bold text-slate-700">{filteredMalotes.length}</span> malotes
          </div>

          {/* Pagination and page size */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            
            {/* Select por página */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Itens:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-[#E6EAF0] text-xs font-semibold text-slate-600 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-[#E6EAF0] bg-white text-slate-500 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${currentPage === idx + 1 ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E6EAF0] text-slate-600 hover:bg-slate-50'}`}
                >
                  {idx + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-[#E6EAF0] bg-white text-slate-500 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

          </div>

        </div>

      </motion.div>

    </motion.div>
  );
}
