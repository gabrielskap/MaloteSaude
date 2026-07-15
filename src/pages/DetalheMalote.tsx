import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { motion, AnimatePresence } from 'motion/react';
import EntregasTable from '../components/EntregasTable';
import {
  ArrowLeft,
  Mail,
  MoreVertical,
  Printer,
  Navigation,
  Building,
  Tag,
  AlertCircle,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  FileText,
  Paperclip,
  Clock,
  CheckCircle2,
  FileDown,
  MapPin,
  CreditCard,
  FileCheck,
  Truck,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Entrega, Tentativa, Prioridade, StatusEntrega } from '../types';

// Seed names for generating 120 items
const SEED_NAMES = [
  "Claudio Roberto Silva", "Aline Mendes Souza", "Rodrigo Alves Santos", "Patricia Rocha Oliveira",
  "Thiago Henrique Santos", "Juliana Maria Ferreira", "Marcos Vinicius Costa", "Beatriz Pinheiro Lima",
  "Gabriel Barbosa Gouveia", "Lucas Oliveira Santos", "Fernanda Ribeiro Lima", "Renato Guimarães Silva",
  "Mariana Fonseca Costa", "Felipe Augusto Borges", "Isabela Cristina Neves", "Gustavo Henrique Reis",
  "Camila Toledo Ramos", "Bruno Henrique Nogueira", "Tatiane Farias Silva", "Marcelo Xavier Cruz",
  "Leticia Moreira Silveira", "Diego Silveira Ramos", "Amanda Barbosa Reis", "Julio Cesar Cruz",
  "Estela Marinho Toledo", "Vitor Rezende Farias", "Priscila Cardoso Xavier", "Rodrigo Antunes",
  "Carla Rodrigues", "Ricardo Vasconcelos", "Patricia Neves", "Sergio Gouveia"
];

const SEED_LOGRADOUROS = [
  "Av. Paulista", "Rua Augusta", "Rua Vergueiro", "Rua Tuiuti", "Av. Brasil", 
  "Rua Bela Cintra", "Av. Ibirapuera", "Rua Fradique Coutinho", "Rua Domingos de Morais", 
  "Rua Guararapes", "Rua Tupi", "Av. Angélica", "Rua Pamplona"
];

const SEED_BAIRROS = [
  { nome: "Vila Mariana", cep: "04010" },
  { nome: "Bela Vista", cep: "01310" },
  { nome: "Consolação", cep: "01302" },
  { nome: "Ipiranga", cep: "04208" },
  { nome: "Tatuapé", cep: "03307" },
  { nome: "Jardim América", cep: "01430" },
  { nome: "Moema", cep: "04515" },
  { nome: "Pinheiros", cep: "05402" }
];

export default function DetalheMalote() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useMalote();

  // Active state tab: 'itens' | 'historico' | 'documentos'
  const [activeTab, setActiveTab] = useState<'itens' | 'historico' | 'documentos'>('itens');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterType, setFilterType] = useState<string>('Todos');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected items checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detailed selected item for side drawer/slide-over
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Entrega | null>(null);

  // Actions dropdown state
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Close actions dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActionsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Retrieve malote or fallback
  const malote = useMemo(() => {
    const found = state.malotes.find(m => m.id === id || m.codigo === id);
    if (found) return found;
    return state.malotes.find(m => m.id === 'MAL-128') || {
      id: 'MAL-128',
      codigo: 'MAL-2025-0526-128',
      clienteId: 'cli-1',
      tipoRecebimento: 'Cartões',
      dataRecebimento: '26/05/2025 08:15',
      responsavel: 'Ricardo Silva',
      unidade: 'Filial Central - São Paulo',
      qtdCartoes: 120,
      qtdBoletos: 0,
      qtdCarnes: 0,
      status: 'Em distribuição',
      prioridade: 'Média',
      etapas: []
    };
  }, [state.malotes, id]);

  // Generate 120 items for MAL-2025-0526-128
  const allItens = useMemo(() => {
    const items: Entrega[] = [];
    
    // Status counts: 72 delivered, 28 in route, 16 pending, 4 returned = 120 total
    const getStatusForIndex = (i: number): 'Entregue' | 'Em rota' | 'Tentativa sem sucesso' | 'Devolução definitiva' => {
      if (i < 72) return 'Entregue';
      if (i < 72 + 28) return 'Em rota';
      if (i < 72 + 28 + 16) return 'Tentativa sem sucesso';
      return 'Devolução definitiva';
    };

    for (let i = 0; i < 120; i++) {
      const status = getStatusForIndex(i);
      const itemId = `itm-128-${i + 1}`;
      const codeNumber = String(3000 + i + 1).padStart(4, '0');
      const codigo = `ITM-0526-${codeNumber}`;
      const nome = SEED_NAMES[i % SEED_NAMES.length];

      // Format CPF
      const cpfNumber = String(100200300 + i * 47).padStart(9, '0');
      const cpf = `${cpfNumber.slice(0, 3)}.${cpfNumber.slice(3, 6)}.${cpfNumber.slice(6, 9)}-00`;

      // Format Address
      const logradouro = SEED_LOGRADOUROS[i % SEED_LOGRADOUROS.length];
      const num = String(100 + (i * 23) % 1800);
      const bairroObj = SEED_BAIRROS[i % SEED_BAIRROS.length];
      const cep = `${bairroObj.cep}-${String(100 + (i * 7) % 899).padStart(3, '0')}`;

      // Alternate type: Cartão / Boleto
      const tipoItem = i % 2 === 0 ? 'Cartão' : 'Boleto';

      // Tentativa atual: 1ª, 2ª, or 3ª
      let tentativaAtual = 1;
      if (status === 'Tentativa sem sucesso') {
        tentativaAtual = (i % 2 === 0) ? 2 : 3;
      } else if (status === 'Devolução definitiva') {
        tentativaAtual = 3;
      } else if (status === 'Entregue') {
        tentativaAtual = (i % 5 === 0) ? 2 : 1;
      }

      // Motoboy assignment
      const motoboys = ["Ricardo Silva", "Rafael Santos", "Bruno Oliveira", "Lucas Ferreira", "Carlos Lima", "Ana Beatriz"];
      const motoboy = motoboys[i % motoboys.length];

      // Timeline Attempts data
      const tentativas: Tentativa[] = [];
      if (status === 'Entregue') {
        if (tentativaAtual === 2) {
          tentativas.push(
            {
              numero: 1,
              dataHora: '26/05/2025 10:30',
              motoboyId: 'moto-6',
              resultado: 'Insucesso',
              motivo: 'Cliente ausente',
              observacao: 'Interfone tocado, ninguém atendeu ao chamado.',
              geo: { lat: -23.561, lng: -46.655 }
            },
            {
              numero: 2,
              dataHora: '26/05/2025 14:15',
              motoboyId: 'moto-6',
              resultado: 'Sucesso',
              observacao: 'Entregue diretamente ao próprio beneficiário na recepção.',
              geo: { lat: -23.561, lng: -46.655 }
            }
          );
        } else {
          tentativas.push({
            numero: 1,
            dataHora: '26/05/2025 11:20',
            motoboyId: 'moto-6',
            resultado: 'Sucesso',
            observacao: 'Entregue sob assinatura da recepção do edifício.',
            geo: { lat: -23.561, lng: -46.655 }
          });
        }
      } else if (status === 'Em rota') {
        // Active transit, no finished attempts yet
      } else if (status === 'Tentativa sem sucesso') {
        if (tentativaAtual === 2) {
          tentativas.push(
            {
              numero: 1,
              dataHora: '26/05/2025 09:40',
              motoboyId: 'moto-6',
              resultado: 'Insucesso',
              motivo: 'Cliente ausente',
              observacao: 'Tentativa malsucedida, casa fechada.',
              geo: { lat: -23.563, lng: -46.652 }
            },
            {
              numero: 2,
              dataHora: '26/05/2025 14:50',
              motoboyId: 'moto-6',
              resultado: 'Insucesso',
              motivo: 'Recusado pelo recebedor',
              observacao: 'Destinatário desconhecido no local indicado.',
              geo: { lat: -23.563, lng: -46.652 }
            }
          );
        } else {
          tentativas.push({
            numero: 1,
            dataHora: '26/05/2025 10:15',
            motoboyId: 'moto-6',
            resultado: 'Insucesso',
            motivo: 'Endereço incorreto',
            observacao: 'Número predial não localizado na rua informada pelo faturamento.',
            geo: { lat: -23.563, lng: -46.652 }
          });
        }
      } else if (status === 'Devolução definitiva') {
        tentativas.push(
          {
            numero: 1,
            dataHora: '26/05/2025 09:15',
            motoboyId: 'moto-6',
            resultado: 'Insucesso',
            motivo: 'Cliente mudou-se',
            observacao: 'O morador atual informou que o beneficiário se mudou há meses.',
            geo: { lat: -23.562, lng: -46.654 }
          },
          {
            numero: 2,
            dataHora: '26/05/2025 13:00',
            motoboyId: 'moto-6',
            resultado: 'Insucesso',
            motivo: 'Cliente mudou-se',
            observacao: 'Confirmado por vizinhos que o destinatário se mudou.',
            geo: { lat: -23.562, lng: -46.654 }
          },
          {
            numero: 3,
            dataHora: '26/05/2025 16:30',
            motoboyId: 'Insucesso',
            resultado: 'Insucesso',
            motivo: 'Devolução definitiva',
            observacao: 'Devolução finalizada e encaminhada de volta à triagem central.',
            geo: { lat: -23.562, lng: -46.654 }
          }
        );
      }

      items.push({
        id: itemId,
        codigo,
        maloteId: 'MAL-128',
        beneficiario: {
          nome,
          cpf,
          dataNascimento: '25/08/1987'
        },
        endereco: {
          logradouro,
          numero: num,
          bairro: bairroObj.nome,
          cidade: 'São Paulo',
          uf: 'SP',
          cep
        },
        telefone: '(11) 98765-4321',
        tipoItem: tipoItem as 'Cartão' | 'Boleto',
        prioridade: 'Média',
        tentativaAtual,
        status,
        motoboyId: motoboy,
        codigoRastreio: `MLTBR250526${String(2500 + i).padStart(4, '0')}BR`,
        historico: [
          { status: 'Aguardando revisão' as StatusEntrega, dataHora: '26/05/2025 08:15', descricao: 'Item recebido no malote físico', responsavel: 'Ricardo Silva' },
          { status: 'Validada' as StatusEntrega, dataHora: '26/05/2025 08:45', descricao: 'Triagem e leitura OCR concluídas', responsavel: 'Ana Martins' },
          { status: 'Atribuída' as StatusEntrega, dataHora: '26/05/2025 09:30', descricao: `Encaminhado ao motoboy ${motoboy}`, responsavel: 'Fernanda Lima' },
          { status: 'Em rota' as StatusEntrega, dataHora: '26/05/2025 10:15', descricao: 'Saída para entrega em andamento', responsavel: 'Sistema Logístico' },
          ...(status === 'Entregue' ? [
            { status: 'Entregue' as StatusEntrega, dataHora: '26/05/2025 11:30', descricao: 'Entregue com sucesso ao beneficiário', responsavel: 'Sistema Logístico' }
          ] : []),
          ...(status === 'Tentativa sem sucesso' ? [
            { status: 'Tentativa sem sucesso' as StatusEntrega, dataHora: '26/05/2025 10:20', descricao: 'Tentativa sem sucesso: Cliente ausente', responsavel: 'Sistema Logístico' }
          ] : []),
          ...(status === 'Devolução definitiva' ? [
            { status: 'Devolução definitiva' as StatusEntrega, dataHora: '26/05/2025 16:30', descricao: 'Retorno físico à base administrativa', responsavel: 'Sistema Logístico' }
          ] : [])
        ],
        valorCorrida: 12.50,
        tentativas
      });
    }

    return items;
  }, []);

  // Filtered list based on Search & Status/Type Filters
  const filteredItens = useMemo(() => {
    return allItens.filter(item => {
      // Search Box matching Name, CPF, Code or Street/Bairro
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        item.codigo.toLowerCase().includes(query) ||
        item.beneficiario.nome.toLowerCase().includes(query) ||
        item.beneficiario.cpf.includes(query) ||
        item.endereco.logradouro.toLowerCase().includes(query) ||
        item.endereco.bairro.toLowerCase().includes(query);

      // Status dropdown matching
      let matchesStatus = true;
      if (filterStatus !== 'Todos') {
        if (filterStatus === 'Entregue') {
          matchesStatus = item.status === 'Entregue';
        } else if (filterStatus === 'Em rota') {
          matchesStatus = item.status === 'Em rota';
        } else if (filterStatus === 'Pendente') {
          // Both Tentativa sem sucesso & Com inconsistência act as Pendentes
          matchesStatus = item.status === 'Tentativa sem sucesso' || item.status === 'Com inconsistência';
        } else if (filterStatus === 'Devolvido') {
          matchesStatus = item.status === 'Devolução definitiva';
        }
      }

      // Type matching
      let matchesType = true;
      if (filterType !== 'Todos') {
        matchesType = item.tipoItem === filterType;
      }

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allItens, searchQuery, filterStatus, filterType]);

  // Recalculate pagination details
  const totalPages = Math.ceil(filteredItens.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredItens.length, totalPages, currentPage]);

  const paginatedItens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItens.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItens, currentPage, itemsPerPage]);

  // Checkboxes select toggle handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const idsOnPage = paginatedItens.map(item => item.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      const idsOnPage = paginatedItens.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const isAllSelectedOnPage = useMemo(() => {
    if (paginatedItens.length === 0) return false;
    return paginatedItens.every(item => selectedIds.includes(item.id));
  }, [paginatedItens, selectedIds]);

  // Document attachments static details
  const documents = [
    { name: 'termo_recebimento_MAL128.pdf', format: 'PDF', size: '1.4 MB', date: '26/05/2025 08:20', owner: 'Ricardo Silva' },
    { name: 'etiqueta_postagem_MAL128.pdf', format: 'PDF', size: '840 KB', date: '26/05/2025 08:25', owner: 'Ricardo Silva' },
    { name: 'planilha_faturamento_HospSaoLucas.xlsx', format: 'XLSX', size: '2.1 MB', date: '26/05/2025 08:15', owner: 'Hospital São Lucas API' }
  ];

  // Audit event history static details
  const auditHistory = [
    { date: '26/05/2025 16:30', user: 'Ricardo Silva', action: 'Devolução Física de Itens', description: 'Registro de retorno físico de 4 cartões com devolução definitiva finalizados pelos motoboys.' },
    { date: '26/05/2025 11:30', user: 'Sistema Logístico', action: 'Atualização Automática', description: '72 itens atualizados com status de Entregue via sincronização de aplicativos mobile.' },
    { date: '26/05/2025 10:15', user: 'Sistema Logístico', action: 'Início de Rota de Entregas', description: 'Criação de ordens de serviço em trânsito. 28 motoboys iniciaram rota física de entrega.' },
    { date: '26/05/2025 09:30', user: 'Fernanda Lima', action: 'Distribuição e Roteirização', description: 'Associação de 120 itens a motoboys disponíveis e emissão de folhas de serviço.' },
    { date: '26/05/2025 08:45', user: 'Ana Martins', action: 'Triagem e Conferência OCR', description: 'Leitura digital por scanner completada para todos os cartões. 120 registros validados com faturamento.' },
    { date: '26/05/2025 08:15', user: 'Ricardo Silva', action: 'Recebimento de Malote Físico', description: 'Código MAL-2025-0526-128 recebido na central de distribuição.' }
  ];

  // Stepper horizontal data
  const steps = [
    { nome: 'Recebido', data: '26/05 08:15', status: 'concluida' },
    { nome: 'Triagem', data: '26/05 08:45', status: 'concluida' },
    { nome: 'Separação', data: '26/05 09:30', status: 'concluida' },
    { nome: 'Em distribuição', data: '26/05 10:15', status: 'atual' },
    { nome: 'Concluído', data: '—', status: 'futura' },
    { nome: 'Encerrado', data: '—', status: 'futura' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none p-4 md:p-6 pb-20 relative">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 text-xs font-semibold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header BackLink & Page Info */}
      <div className="space-y-1.5">
        <button 
          onClick={() => navigate('/malotes')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors focus:outline-none"
          id="btn-voltar-malotes"
        >
          <ArrowLeft size={14} /> Voltar para malotes
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Detalhe do malote</h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Acompanhe as informações e o status de cada etapa deste malote.
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        
        {/* Content Column (78% / 7.8 out of 10) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Card (Header Details + Counters + Stepper) */}
          <div className="bg-white rounded-2xl border border-[#E6EAF0] p-6 shadow-xs space-y-6">
            
            {/* Upper line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[22px] font-semibold text-[#0F172A] tracking-tight font-mono">
                      {malote.codigo}
                    </span>
                    <span className="bg-[#DBEAFE] text-[#2563EB] text-[10.5px] font-bold px-2.5 py-1 rounded-full">
                      Em distribuição
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                  className="px-3.5 py-1.5 border border-[#E6EAF0] text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Mais ações <ChevronDown size={14} className={`transition-transform ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* More Actions Dropdown Menu */}
                <AnimatePresence>
                  {isActionsDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-[38px] z-20 w-44 bg-white border border-slate-100 rounded-xl shadow-xl p-1 text-xs divide-y divide-slate-50"
                    >
                      <div className="py-1">
                        <button 
                          onClick={() => {
                            setIsActionsDropdownOpen(false);
                            showToast("Fluxo de edição de prioridade ativado.");
                          }}
                          className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
                        >
                          Editar prioridade
                        </button>
                        <button 
                          onClick={() => {
                            setIsActionsDropdownOpen(false);
                            showToast("Encaminhado para redistribuição.");
                          }}
                          className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
                        >
                          Alterar responsável
                        </button>
                      </div>
                      <div className="py-1">
                        <button 
                          onClick={() => {
                            setIsActionsDropdownOpen(false);
                            showToast("Solicitação de cancelamento enviada.");
                          }}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
                        >
                          Cancelar malote
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => {
                    showToast("Enviando solicitação de impressão ao sistema de relatórios...");
                    setTimeout(() => window.print(), 1000);
                  }}
                  className="px-3.5 py-1.5 border border-[#E6EAF0] text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} /> Imprimir resumo
                </button>

                <button 
                  onClick={() => {
                    showToast("Rastreando percurso em tempo real...");
                    navigate('/rastreio');
                  }}
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Navigation size={14} /> Rastrear malote
                </button>
              </div>
            </div>

            {/* Three key info blocks separated by vertical borders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-1 bg-slate-50/50 rounded-xl p-4 border border-[#F1F5F9]">
              
              {/* Cliente Block */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente</div>
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-[#64748B]" />
                  <span className="font-bold text-slate-800 text-sm">Hospital São Lucas</span>
                </div>
              </div>

              {/* Tipo do malote Block */}
              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo do malote</div>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[#64748B]" />
                  <span className="font-bold text-slate-800 text-sm">Cartões e Boletos</span>
                </div>
              </div>

              {/* Prioridade Block */}
              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prioridade</div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold text-slate-800 text-sm">Normal</span>
                </div>
              </div>

            </div>

            {/* Five Counting Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              
              {/* Total Card */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de itens</span>
                <span className="text-3xl font-extrabold text-[#0F172A] mt-2 tracking-tight">120</span>
                <span className="text-[10.5px] text-slate-500 mt-1.5 font-semibold">100% do malote</span>
              </div>

              {/* Entregues Card (Green) */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregues</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-2 tracking-tight">72</span>
                <span className="text-[10.5px] text-slate-500 mt-1.5 font-semibold">60,0% do total</span>
              </div>

              {/* Em rota Card (Blue) */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em rota</span>
                <span className="text-3xl font-extrabold text-blue-600 mt-2 tracking-tight">28</span>
                <span className="text-[10.5px] text-slate-500 mt-1.5 font-semibold">23,3% do total</span>
              </div>

              {/* Pendentes Card (Amber) */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendentes</span>
                <span className="text-3xl font-extrabold text-amber-500 mt-2 tracking-tight">16</span>
                <span className="text-[10.5px] text-slate-500 mt-1.5 font-semibold">13,3% do total</span>
              </div>

              {/* Devolvidos Card (Red) */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Devolvidos</span>
                <span className="text-3xl font-extrabold text-red-600 mt-2 tracking-tight">4</span>
                <span className="text-[10.5px] text-slate-500 mt-1.5 font-semibold">3,3% do total</span>
              </div>

            </div>

            {/* Stepper Horizontal Progress */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                Progresso do malote
              </span>

              {/* Stepper Grid Container */}
              <div className="relative pt-2 pb-5 px-1 overflow-x-auto">
                <div className="flex items-start justify-between min-w-[700px] relative">
                  
                  {steps.map((step, idx) => {
                    const isConcluida = step.status === 'concluida';
                    const isAtual = step.status === 'atual';
                    const isFutura = step.status === 'futura';

                    return (
                      <div key={idx} className="flex-1 relative flex flex-col items-center text-center">
                        
                        {/* Connector line */}
                        {idx < steps.length - 1 && (
                          <div 
                            className={`absolute top-4 left-1/2 right-[-50%] h-[2px] z-0 ${
                              idx < 3 
                                ? 'bg-emerald-500' // Solid green for completed steps (0->1, 1->2, 2->3)
                                : isAtual 
                                  ? 'bg-[#2563EB]' // Solid blue from current to Concluído is actually dotted/dashed
                                  : 'border-t-2 border-dashed border-slate-200' // Dotted for future
                            }`} 
                          />
                        )}

                        {/* Step Circle */}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold text-xs shadow-xs transition-colors duration-300 ${
                            isConcluida 
                              ? 'bg-emerald-500 text-white' 
                              : isAtual 
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isConcluida || isAtual ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Title and date */}
                        <div className="mt-3.5 space-y-1">
                          <span className={`text-[11.5px] font-bold block ${isAtual ? 'text-blue-600' : isConcluida ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.nome}
                          </span>
                          <span className="text-[10px] font-medium text-[#64748B] block bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                            {step.data}
                          </span>
                        </div>

                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

          </div>

          {/* Cards with Tabs Options */}
          <div className="bg-white rounded-2xl border border-[#E6EAF0] overflow-hidden shadow-xs">
            
            {/* Tabs Header */}
            <div className="bg-slate-50/70 border-b border-[#E6EAF0] px-6 flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('itens')}
                className={`py-4 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'itens' ? 'border-[#2563EB] text-[#2563EB] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
              >
                Itens do malote
              </button>
              <button 
                onClick={() => setActiveTab('historico')}
                className={`py-4 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'historico' ? 'border-[#2563EB] text-[#2563EB] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
              >
                Histórico
              </button>
              <button 
                onClick={() => setActiveTab('documentos')}
                className={`py-4 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'documentos' ? 'border-[#2563EB] text-[#2563EB] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
              >
                Documentos (3)
              </button>
            </div>

            {/* TAB CONTENT: Itens do malote */}
            {activeTab === 'itens' && (
              <div className="p-6">
                <EntregasTable maloteId={id} hideMaloteAndCliente={true} />
              </div>
            )}

            {/* TAB CONTENT: Histórico */}
            {activeTab === 'historico' && (
              <div className="p-6">
                <div className="space-y-6 max-w-3xl pl-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  
                  {auditHistory.map((item, index) => (
                    <div key={index} className="relative pl-8 space-y-1">
                      
                      {/* Timeline dot */}
                      <div className="absolute left-1.5 top-1.5 w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-300 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      </div>

                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-bold font-mono">
                        <Clock size={11} />
                        <span>{item.date}</span>
                        <span className="text-slate-300">|</span>
                        <span>{item.user}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800">
                        {item.action}
                      </h4>

                      <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                        {item.description}
                      </p>

                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* TAB CONTENT: Documentos */}
            {activeTab === 'documentos' && (
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Arquivos digitais e anexos de comprovação administrativa vinculados a este recebimento.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="border border-[#E6EAF0] rounded-xl p-4 bg-white flex flex-col justify-between min-h-[140px] hover:border-slate-300 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[10px] ${doc.format === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {doc.format}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{doc.size}</span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={doc.name}>
                            {doc.name}
                          </h4>
                          <div className="text-[10px] text-slate-400 font-semibold mt-1">
                            Anexado em: {doc.date}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">Por: {doc.owner}</span>
                        <button 
                          onClick={() => {
                            showToast(`Download de ${doc.name} iniciado...`);
                          }}
                          className="text-[#2563EB] hover:text-[#1d4ed8] text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <FileDown size={14} /> Baixar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Informações do malote Side Panel (22% / 2.2 out of 10) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-[#E6EAF0] p-5 shadow-xs space-y-5">
            
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-slate-100">
              Informações do malote
            </h3>

            {/* Block 1: Data de recebimento */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                <Calendar size={15} />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recebido em</div>
                <div className="text-[11.5px] font-bold text-slate-800 leading-tight">
                  26/05/2025 08:15
                </div>
              </div>
            </div>

            {/* Block 2: Responsável */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Responsável</div>
                <div className="text-[11.5px] font-bold text-slate-800 leading-tight">
                  Ricardo Silva
                </div>
              </div>
            </div>

            {/* Block 3: Origem */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                <Building size={15} />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Origem</div>
                <div className="text-[11.5px] font-bold text-slate-800 leading-normal space-y-0.5">
                  <div>Hospital São Lucas</div>
                  <div className="text-slate-500 font-semibold text-[10.5px]">Rua das Palmeiras, 1200</div>
                  <div className="text-slate-500 font-medium text-[10px]">Centro, São Paulo - SP</div>
                  <div className="text-slate-400 font-semibold text-[9.5px]">CEP 01234-567</div>
                </div>
              </div>
            </div>

            {/* Block 4: Observações */}
            <div className="flex items-start gap-3 pt-1">
              <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                <FileText size={15} />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Observações</div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "Malote com cartões de plano de saúde e boletos de mensalidade."
                </p>
              </div>
            </div>

          </div>

          {/* Quick Help box */}
          <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-[#2563EB]" />
              <span className="text-[11px] font-bold text-[#1E40AF]">Suporte Operacional</span>
            </div>
            <p className="text-[10px] text-[#1E40AF] leading-normal font-semibold">
              Precisa resolver alguma divergência com a triagem? Acione o SAC pelo canal direto no menu superior.
            </p>
          </div>

        </div>

      </div>

      {/* SLIDE-OVER DRAWER: Detalhe de item de entrega individual */}
      <AnimatePresence>
        {selectedItemForDetail && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItemForDetail(null)}
              className="fixed inset-0 bg-black z-40 cursor-default"
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-[#E6EAF0] flex flex-col"
            >
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detalhes da Entrega</div>
                    <div className="text-sm font-bold text-[#0F172A] font-mono">{selectedItemForDetail.codigo}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemForDetail(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-5 space-y-6">
                
                {/* Status indicator row */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-[#F1F5F9]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status da Entrega</span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedItemForDetail.status === 'Entregue' 
                        ? 'Item entregue com sucesso' 
                        : selectedItemForDetail.status === 'Em rota' 
                          ? 'Item em trânsito com motoboy' 
                          : selectedItemForDetail.status === 'Tentativa sem sucesso' 
                            ? 'Pendente - Aguardando ação' 
                            : 'Devolvido à base administrativa'}
                    </span>
                  </div>
                  <span className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full ${
                    selectedItemForDetail.status === 'Entregue' 
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedItemForDetail.status === 'Em rota'
                        ? 'bg-blue-50 text-blue-700'
                        : selectedItemForDetail.status === 'Tentativa sem sucesso'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedItemForDetail.status === 'Tentativa sem sucesso' ? 'Pendente' : selectedItemForDetail.status === 'Devolução definitiva' ? 'Devolvido' : selectedItemForDetail.status}
                  </span>
                </div>

                {/* Beneficiário details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">
                    Beneficiário
                  </h4>
                  <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 space-y-2.5 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nome completo</span>
                      <span className="text-slate-800 font-bold">{selectedItemForDetail.beneficiario.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CPF do titular</span>
                      <span className="text-slate-800 font-mono">{selectedItemForDetail.beneficiario.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo do envio</span>
                      <span className="text-slate-800">{selectedItemForDetail.tipoItem}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Código de Rastreio</span>
                      <span className="text-[#2563EB] font-mono">{selectedItemForDetail.codigoRastreio}</span>
                    </div>
                  </div>
                </div>

                {/* Endereço details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">
                    Endereço de Entrega
                  </h4>
                  <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 flex items-start gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div className="font-semibold text-slate-700 leading-relaxed space-y-1">
                      <div className="text-slate-800 font-bold">
                        {selectedItemForDetail.endereco.logradouro}, {selectedItemForDetail.endereco.numero}
                      </div>
                      <div className="text-slate-500">
                        {selectedItemForDetail.endereco.bairro} · {selectedItemForDetail.endereco.cidade} - {selectedItemForDetail.endereco.uf}
                      </div>
                      <div className="text-slate-400 font-bold font-mono">
                        CEP {selectedItemForDetail.endereco.cep}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linha do tempo das tentativas (Rastreamento) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">
                    Linha do Tempo das Tentativas ({selectedItemForDetail.tentativaAtual})
                  </h4>

                  {selectedItemForDetail.tentativas && selectedItemForDetail.tentativas.length > 0 ? (
                    <div className="space-y-5 pl-3.5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {selectedItemForDetail.tentativas.map((tentativa, idx) => {
                        const isSucesso = tentativa.resultado === 'Sucesso';

                        return (
                          <div key={idx} className="relative pl-6 space-y-1 text-xs">
                            
                            {/* Dot indicator */}
                            <div className={`absolute left-[3px] top-[3px] w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                              isSucesso ? 'border-emerald-500' : 'border-red-500'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isSucesso ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {idx + 1}ª Tentativa de Entrega
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isSucesso ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {isSucesso ? 'Sucesso' : 'Insucesso'}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1.5">
                              <span>{tentativa.dataHora}</span>
                              <span>·</span>
                              <span>Entregador: {selectedItemForDetail.motoboyId || 'Ricardo Silva'}</span>
                            </div>

                            {tentativa.motivo && (
                              <div className="text-[10.5px] font-semibold text-slate-500 mt-1">
                                Motivo: <span className="text-slate-800">{tentativa.motivo}</span>
                              </div>
                            )}

                            {tentativa.observacao && (
                              <p className="text-[11px] text-[#64748B] italic bg-slate-50 p-2 rounded-lg border border-slate-100/50 font-medium mt-1">
                                "{tentativa.observacao}"
                              </p>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                      <Truck size={15} className="text-slate-400 animate-bounce" />
                      <span>O item está em rota de entrega primária. Nenhuma tentativa anterior registrada.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedItemForDetail(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Fechar detalhe
                </button>
                <button 
                  onClick={() => {
                    setSelectedItemForDetail(null);
                    showToast(`Sincronização forçada iniciada para ${selectedItemForDetail.codigo}`);
                  }}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Sincronizar dados
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
