import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell, 
  LabelList,
  PieChart, 
  Pie 
} from 'recharts';
import { 
  Mail, 
  Truck, 
  Check, 
  AlertCircle, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Settings, 
  ArrowRight,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // Baseline counts from seed to dynamically scale numbers
  const baseMalotes = 13;
  const baseEmRota = 7;
  const baseConcluidas = 82;
  const basePendencias = 22;
  const basePendentes = 14;
  const baseFalhas = 4;

  const activeConcluidas = state.entregas.filter(e => e.status === 'Entregue').length;
  const activeEmRota = state.entregas.filter(e => e.status === 'Em rota').length;
  const activePendentes = state.entregas.filter(e => 
    ['Com inconsistência', 'Tentativa sem sucesso', 'Em análise de pendência', 'Aguardando nova tentativa'].includes(e.status)
  ).length;
  const activeFalhas = state.entregas.filter(e => 
    ['Devolução definitiva', 'Cancelada'].includes(e.status)
  ).length;

  // Real-time calculated KPIs with offset to match the prototype dashboard numbers
  const malotesRecebidosHoje = 128 + (state.malotes.length - baseMalotes);
  const entregasEmRota = 86 + (activeEmRota - baseEmRota);
  const entregasConcluidas = 215 + (activeConcluidas - baseConcluidas);
  const pendenciasCount = 23 + (state.pendencias.length - basePendencias);

  // Status breakdown totals for the Pie Chart (total = sum of slices)
  const concluidasCount = entregasConcluidas;
  const emRotaCount = entregasEmRota;
  const pendentesCount = 15 + (activePendentes - basePendentes);
  const falhasCount = 8 + (activeFalhas - baseFalhas);
  const totalHojeCount = concluidasCount + emRotaCount + pendentesCount + falhasCount;

  // Pie chart structured data
  const pieChartData = [
    { name: 'Concluídas', value: concluidasCount, color: '#16A34A', percentage: ((concluidasCount / totalHojeCount) * 100).toFixed(1) },
    { name: 'Em rota', value: emRotaCount, color: '#2563EB', percentage: ((emRotaCount / totalHojeCount) * 100).toFixed(1) },
    { name: 'Pendentes', value: pendentesCount, color: '#F59E0B', percentage: ((pendentesCount / totalHojeCount) * 100).toFixed(1) },
    { name: 'Falhas', value: falhasCount, color: '#EF4444', percentage: ((falhasCount / totalHojeCount) * 100).toFixed(1) },
  ];

  // Last 7 days bar chart data
  const barChartData = [
    { label: '20/mai Ter', valor: 148 },
    { label: '21/mai Qua', valor: 162 },
    { label: '22/mai Qui', valor: 176 },
    { label: '23/mai Sex', valor: 189 },
    { label: '24/mai Sáb', valor: 142 },
    { label: '25/mai Dom', valor: 134 },
    { label: '26/mai Seg', valor: entregasConcluidas }, // Dynamic connection
  ];

  // Recent 5 malotes
  const malotesRecentes = state.malotes.slice(0, 5);

  // Alertas operacionais list
  const alerts = [
    {
      title: 'Atraso na entrega',
      desc: '5 entregas estão com atraso superior a 2 horas.',
      time: '09:12',
      color: 'warning',
      icon: Clock,
    },
    {
      title: 'Falha na entrega',
      desc: '8 entregas falharam. Ação necessária.',
      time: '08:47',
      color: 'danger',
      icon: AlertTriangle,
    },
    {
      title: 'Malote aguardando coleta',
      desc: '3 malotes prontos para coleta há mais de 1 hora.',
      time: '08:30',
      color: 'info',
      icon: Mail,
    },
    {
      title: 'Endereço incompleto',
      desc: '6 entregas com endereço incompleto ou inválido.',
      time: '08:15',
      color: 'warning',
      icon: MapPin,
    },
    {
      title: 'Manutenção programada',
      desc: 'Sistema de roteirização em manutenção hoje às 22h.',
      time: '07:50',
      color: 'info',
      icon: Settings,
    },
  ];

  // KPI clicks handler with context filter setting & navigation
  const handleKpiClick = (type: string) => {
    if (type === 'malotes') {
      navigate('/malotes');
    } else if (type === 'em_rota') {
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Em rota' } });
      navigate('/entregas');
    } else if (type === 'concluidas') {
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Entregue' } });
      navigate('/entregas');
    } else if (type === 'pendencias') {
      navigate('/pendencias');
    }
  };

  // Pie slice / legend click handler
  const handleStatusClick = (statusName: string) => {
    if (statusName === 'Concluídas') {
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Entregue' } });
      navigate('/entregas');
    } else if (statusName === 'Em rota') {
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Em rota' } });
      navigate('/entregas');
    } else if (statusName === 'Pendentes') {
      navigate('/pendencias');
    } else if (statusName === 'Falhas') {
      dispatch({ type: 'DEFINIR_FILTROS', payload: { status: 'Devolução definitiva' } });
      navigate('/entregas');
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

  // Helper for malote status badge styles
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

  // Custom Tick renderer for two-line X-Axis layout
  const renderCustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const parts = payload.value.split(' '); // e.g. "20/mai Ter" -> ["20/mai", "Ter"]
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle" fill="#64748B" className="text-[11px] font-medium font-sans">
          <tspan x={0} dy={0}>{parts[0]}</tspan>
          <tspan x={0} dy={14}>{parts[1]}</tspan>
        </text>
      </g>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-[1600px] mx-auto select-none"
    >
      
      {/* LINHA 1 — KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Malotes recebidos hoje */}
        <motion.div 
          variants={cardVariants}
          onClick={() => handleKpiClick('malotes')}
          className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex justify-between items-center shadow-xs hover:border-[#0F6E6E] hover:shadow-md transition-all duration-200 cursor-pointer group"
          id="kpi-malotes-hoje"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Malotes recebidos hoje
            </span>
            <div className="text-[40px] font-bold leading-none tracking-tight text-[#0F6E6E] group-hover:scale-102 transition-transform origin-left">
              {malotesRecebidosHoje}
            </div>
            <div className="text-[#16A34A] text-xs font-semibold flex items-center gap-1 mt-1">
              <span>↑ +12% vs. ontem (114)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E8F4F2] text-[#0F6E6E] flex items-center justify-center shrink-0 group-hover:bg-[#0F6E6E] group-hover:text-white transition-colors duration-200">
            <Mail size={20} />
          </div>
        </motion.div>

        {/* Card 2: Entregas em rota */}
        <motion.div 
          variants={cardVariants}
          onClick={() => handleKpiClick('em_rota')}
          className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex justify-between items-center shadow-xs hover:border-[#2563EB] hover:shadow-md transition-all duration-200 cursor-pointer group"
          id="kpi-entregas-rota"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Entregas em rota
            </span>
            <div className="text-[40px] font-bold leading-none tracking-tight text-[#2563EB] group-hover:scale-102 transition-transform origin-left">
              {entregasEmRota}
            </div>
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-1">
              <span>Em andamento neste momento</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200">
            <Truck size={20} />
          </div>
        </motion.div>

        {/* Card 3: Entregas concluídas */}
        <motion.div 
          variants={cardVariants}
          onClick={() => handleKpiClick('concluidas')}
          className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex justify-between items-center shadow-xs hover:border-[#16A34A] hover:shadow-md transition-all duration-200 cursor-pointer group"
          id="kpi-entregas-concluidas"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Entregas concluídas
            </span>
            <div className="text-[40px] font-bold leading-none tracking-tight text-[#16A34A] group-hover:scale-102 transition-transform origin-left">
              {entregasConcluidas}
            </div>
            <div className="text-[#16A34A] text-xs font-semibold flex items-center gap-1 mt-1">
              <span>↑ +18% vs. ontem (182)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 group-hover:bg-[#16A34A] group-hover:text-white transition-colors duration-200">
            <Check size={20} />
          </div>
        </motion.div>

        {/* Card 4: Pendências */}
        <motion.div 
          variants={cardVariants}
          onClick={() => handleKpiClick('pendencias')}
          className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex justify-between items-center shadow-xs hover:border-[#EA580C] hover:shadow-md transition-all duration-200 cursor-pointer group"
          id="kpi-pendencias"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pendências
            </span>
            <div className="text-[40px] font-bold leading-none tracking-tight text-[#EA580C] group-hover:scale-102 transition-transform origin-left">
              {pendenciasCount}
            </div>
            <div className="text-[#EA580C] text-xs font-semibold flex items-center gap-1 mt-1">
              <span>Requer atenção</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0 group-hover:bg-[#EA580C] group-hover:text-white transition-colors duration-200">
            <AlertCircle size={20} />
          </div>
        </motion.div>

      </section>

      {/* LINHA 2 — Charts (60% / 40%) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Esquerda (60%) — Entregas por dia */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-3 bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between"
          id="chart-entregas-por-dia"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Entregas por dia
              </h3>
              <p className="text-xs text-[#64748B]">
                Últimos 7 dias
              </p>
            </div>
            <select 
              value="concluidas"
              disabled
              className="bg-white border border-[#E6EAF0] text-xs text-slate-600 font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-default"
            >
              <option value="concluidas">Entregas concluídas</option>
            </select>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={renderCustomAxisTick} 
                  height={45} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} 
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0F172A] text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg border border-slate-800">
                          <p className="font-bold mb-0.5">{payload[0].payload.label.replace(/\s+/g, ' ')}</p>
                          <p className="text-[#7DD3CF]">Entregas: <span className="font-bold text-white">{payload[0].value}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={42}>
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === barChartData.length - 1 ? '#0F6E6E' : '#7DD3CF'} 
                    />
                  ))}
                  <LabelList 
                    dataKey="valor" 
                    position="top" 
                    fill="#334155" 
                    className="text-[11px] font-bold" 
                    offset={6}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Direita (40%) — Status das entregas */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-2 bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between relative"
          id="chart-status-entregas"
        >
          <div>
            <h3 className="text-base font-semibold text-[#0F172A] font-display">
              Status das entregas
            </h3>
            <p className="text-xs text-[#64748B] mb-2">
              Total de entregas hoje
            </p>
          </div>

          <div className="flex items-center gap-6 my-4">
            {/* Donut Chart */}
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        onClick={() => handleStatusClick(entry.name)}
                        className="cursor-pointer focus:outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-none">
                  {totalHojeCount}
                </span>
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-widest mt-1">
                  Total
                </span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex-1 space-y-1.5">
              {pieChartData.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleStatusClick(item.name)}
                  className="w-full flex items-center justify-between text-left p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium whitespace-nowrap text-right">
                    <span className="text-slate-900 font-bold">{item.value}</span>
                    <span className="ml-1 text-[10px]">({item.percentage}%)</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] text-center">
            <button 
              onClick={() => {
                dispatch({ type: 'LIMPAR_FILTROS' });
                navigate('/entregas');
              }}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver detalhes do status <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

      </section>

      {/* LINHA 3 — Recent Malotes & Alerts (60% / 40% mirrored) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Malotes recentes (60%) */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-3 bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between"
          id="malotes-recentes-dashboard"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Malotes recentes
              </h3>
              <p className="text-xs text-[#64748B]">
                Últimos malotes recebidos na unidade
              </p>
            </div>
            <button 
              onClick={() => navigate('/malotes')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver todos os malotes <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Código do Malote</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Itens</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Recebido em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {malotesRecentes.map((malote) => {
                  const cliente = state.clientes.find(c => c.id === malote.clienteId);
                  const clienteNome = cliente ? cliente.nome : 'Cliente Desconhecido';
                  const { icon, text } = getItemDetails(malote);
                  
                  return (
                    <tr key={malote.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <button 
                          onClick={() => navigate(`/malotes/${malote.id}`)}
                          className="text-[#2563EB] hover:text-[#1D4ED8] font-bold text-left cursor-pointer"
                        >
                          {malote.codigo}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-[#475569] font-medium max-w-[140px] truncate" title={clienteNome}>
                        {clienteNome}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[#475569]">
                          {icon}
                          <span className="font-semibold text-slate-600">{text}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(malote.status)}`}>
                          {malote.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                        {malote.dataRecebimento}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] text-center mt-4">
            <button 
              onClick={() => navigate('/malotes')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Ver mais malotes →
            </button>
          </div>
        </motion.div>

        {/* Alertas operacionais (40%) */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-2 bg-white rounded-[14px] border border-[#E6EAF0] p-6 shadow-xs flex flex-col justify-between"
          id="alertas-operacionais-dashboard"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Alertas operacionais
              </h3>
              <p className="text-xs text-[#64748B]">
                Monitoramento crítico em tempo real
              </p>
            </div>
            <button 
              onClick={() => navigate('/configuracoes')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver todos <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              let bgClass = 'bg-amber-50 text-[#D97706]';
              let textClass = 'text-[#D97706]';
              if (alert.color === 'danger') {
                bgClass = 'bg-red-50 text-[#EF4444]';
                textClass = 'text-[#EF4444]';
              } else if (alert.color === 'info') {
                bgClass = 'bg-blue-50 text-[#2563EB]';
                textClass = 'text-[#2563EB]';
              }

              return (
                <div 
                  key={index} 
                  className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50/80 transition-all duration-150 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 ${bgClass} group-hover:scale-105 transition-transform`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-medium">
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ml-2 ${textClass}`}>
                    {alert.time}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] text-center mt-4">
            <button 
              onClick={() => navigate('/configuracoes')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
            >
              Ver todos os alertas →
            </button>
          </div>
        </motion.div>

      </section>

    </motion.div>
  );
}
