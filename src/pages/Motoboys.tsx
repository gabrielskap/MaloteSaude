import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import {
  Bike,
  CheckCircle2,
  TrendingUp,
  Activity,
  Search,
  Grid,
  List,
  Eye,
  MoreVertical,
  Calendar,
  ArrowLeft,
  X,
  Compass,
  AlertTriangle,
  ChevronRight,
  FileText,
  MapPin,
  Clock,
  User,
} from 'lucide-react';
import MotoboyCard from '../components/MotoboyCard';
import { Motoboy, Entrega, Tentativa, EventoAuditoria } from '../types';

export default function Motoboys() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useMalote();

  // State for search and filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [regionFilter, setRegionFilter] = useState('Todas as regiões');
  const [viewMode, setViewMode] = useState<'cards' | 'tabela'>('cards');

  // State for reassign modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignFromMoto, setReassignFromMoto] = useState<Motoboy | null>(null);
  const [selectedDeliveriesForReassign, setSelectedDeliveriesForReassign] = useState<string[]>([]);
  const [destinationMotoId, setDestinationMotoId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // State for profile view period selection
  const [period, setPeriod] = useState<'Hoje' | '7dias' | 'mes'>('Hoje');

  // State for image viewer lightbox
  const [lightboxImgUrl, setLightboxImgUrl] = useState<string | null>(null);

  // State for kebab menu dropdowns
  const [activeKebabMenu, setActiveKebabMenu] = useState<string | null>(null);

  // Success alert/toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Calculate dynamic statistics & KPIs
  const totalMotoboys = state.motoboys.length;
  const totalAvailable = state.motoboys.filter((m) => m.status === 'Disponível').length;
  const totalInRoute = state.motoboys.filter((m) => m.status === 'Em rota').length;

  // Calculate average occupancy
  const averageOccupancy = totalMotoboys > 0
    ? Math.round(
        state.motoboys.reduce((sum, moto) => {
          const count = state.entregas.filter((e) => e.motoboyId === moto.id).length;
          const occ = moto.meta > 0 ? (count / moto.meta) * 100 : 0;
          return sum + occ;
        }, 0) / totalMotoboys
      )
    : 0;

  // 2. Filter motoboys for the main list
  const filteredMotoboys = state.motoboys.filter((m) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      m.nome.toLowerCase().includes(query) || m.regiao.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'Todos' || m.status === statusFilter;
    const matchesRegion = regionFilter === 'Todas as regiões' || m.regiao === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // 3. Reallocation modal triggers
  const handleOpenReassignModal = (moto: Motoboy, preSelectedId?: string) => {
    setReassignFromMoto(moto);
    const activeDeliveries = state.entregas.filter(
      (e) => e.motoboyId === moto.id && ['Em rota', 'Atribuída'].includes(e.status)
    );
    
    if (preSelectedId) {
      setSelectedDeliveriesForReassign([preSelectedId]);
    } else {
      setSelectedDeliveriesForReassign(activeDeliveries.map((e) => e.id));
    }
    setDestinationMotoId('');
    setReassignReason('');
    setIsReassignModalOpen(true);
  };

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignFromMoto || selectedDeliveriesForReassign.length === 0 || !destinationMotoId || !reassignReason) {
      return;
    }

    dispatch({
      type: 'REATRIBUIR_ENTREGAS',
      payload: {
        entregaIds: selectedDeliveriesForReassign,
        deMotoboyId: reassignFromMoto.id,
        paraMotoboyId: destinationMotoId,
        motivo: reassignReason,
        usuario: 'Ricardo Silva',
      },
    });

    const destMoto = state.motoboys.find((m) => m.id === destinationMotoId);
    showToast(
      `${selectedDeliveriesForReassign.length} ${
        selectedDeliveriesForReassign.length === 1 ? 'entrega' : 'entregas'
      } reatribuída(s) com sucesso para ${destMoto ? destMoto.nome : 'novo entregador'}!`
    );
    setIsReassignModalOpen(false);
  };

  // Helper metrics generator for each motoboy
  const getMotoboyMetrics = (motoId: string) => {
    const deliveries = state.entregas.filter((e) => e.motoboyId === motoId);
    const totalDelivered = deliveries.filter((e) => e.status === 'Entregue').length;

    // Compile attempts belonging to this motoboy
    const motoAttempts = state.entregas
      .flatMap((e) => (e.tentativas || []).map((t) => ({ ...t, entregaId: e.id })))
      .filter((t) => t.motoboyId === motoId);

    const firstAttemptDeliveries = deliveries.filter((e) => {
      if (!e.tentativas || e.tentativas.length === 0) return false;
      const first = e.tentativas.find((t) => t.numero === 1);
      return first && first.resultado === 'Sucesso';
    }).length;

    const totalWithAttempts = deliveries.filter(
      (e) => e.tentativas && e.tentativas.length > 0
    ).length;

    const firstAttemptSuccessRate = totalWithAttempts > 0
      ? Math.round((firstAttemptDeliveries / totalWithAttempts) * 100)
      : 88; // Default realistic high percentage if no attempts recorded yet

    const totalFailedAttempts = motoAttempts.filter((t) => t.resultado === 'Insucesso').length;

    // Derived average time (realistic simulation)
    const baseMinutes = 20;
    const avgTimePerDelivery = deliveries.length > 0 ? baseMinutes + (deliveries.length % 5) : 22;

    return {
      totalDelivered,
      firstAttemptSuccessRate,
      totalFailedAttempts,
      avgTimePerDelivery,
      totalDeliveries: deliveries.length,
      attempts: motoAttempts,
    };
  };

  // If a profile detail is selected via route /motoboys/:id
  const currentProfileMoto = id ? state.motoboys.find((m) => m.id === id) : null;
  const profileMetrics = currentProfileMoto ? getMotoboyMetrics(currentProfileMoto.id) : null;

  // Filter profile deliveries
  const profileDeliveries = currentProfileMoto
    ? state.entregas.filter((e) => e.motoboyId === currentProfileMoto.id)
    : [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-28 relative">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F6E6E] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-teal-500/30">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {currentProfileMoto && profileMetrics ? (
        /* ==================== 1. DETAIL VIEW (/motoboys/:id) ==================== */
        <div className="space-y-6">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/motoboys')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-[#E6EAF0] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              Voltar para Motoboys
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (4 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Profile Card */}
              <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs text-center">
                <div className="relative inline-block">
                  <img
                    src={currentProfileMoto.fotoUrl}
                    alt={currentProfileMoto.nome}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 mx-auto"
                  />
                  <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
                      currentProfileMoto.status === 'Disponível'
                        ? 'bg-emerald-500'
                        : currentProfileMoto.status === 'Em rota'
                        ? 'bg-blue-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-3">{currentProfileMoto.nome}</h3>
                <div className="flex justify-center mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      currentProfileMoto.status === 'Disponível'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : currentProfileMoto.status === 'Em rota'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {currentProfileMoto.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-left space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Região principal</span>
                    <span className="font-bold text-slate-700">{currentProfileMoto.regiao}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Veículo de frota</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Bike size={14} className="text-[#0F6E6E]" /> Moto
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Capacidade limite</span>
                    <span className="font-bold text-slate-700">
                      {currentProfileMoto.capacidadeKg.toFixed(1)} kg
                    </span>
                  </div>

                  {/* Occupancy bar */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>Capacidade ocupada</span>
                      <span className="text-slate-700">
                        {profileMetrics.totalDeliveries}/{currentProfileMoto.meta} entregas (
                        {currentProfileMoto.meta > 0
                          ? Math.round((profileMetrics.totalDeliveries / currentProfileMoto.meta) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    {(() => {
                      const pct =
                        currentProfileMoto.meta > 0
                          ? Math.round((profileMetrics.totalDeliveries / currentProfileMoto.meta) * 100)
                          : 0;
                      const barColor = pct <= 60 ? 'bg-emerald-500' : pct <= 85 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Entregas de Hoje Card */}
              <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
                <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 mb-4">
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">
                    Entregas Atribuídas ({profileDeliveries.length})
                  </h4>
                </div>

                {profileDeliveries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-medium">
                    Nenhuma entrega atribuída a este entregador hoje.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profileDeliveries.map((e) => {
                      // Get some status colors
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'Entregue':
                            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          case 'Em rota':
                            return 'bg-blue-50 text-blue-700 border-blue-200';
                          case 'Tentativa sem sucesso':
                            return 'bg-rose-50 text-rose-700 border-rose-200';
                          default:
                            return 'bg-amber-50 text-amber-700 border-amber-200';
                        }
                      };

                      return (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-lg transition-colors bg-slate-50/30"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{e.codigo}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">• {e.tipoItem}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 truncate max-w-[160px] sm:max-w-[200px]">
                              {e.beneficiario.nome}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${getStatusBadge(
                                  e.status
                                )}`}
                              >
                                {e.status}
                              </span>
                            </div>
                          </div>

                          {['Em rota', 'Atribuída'].includes(e.status) && (
                            <button
                              onClick={() => handleOpenReassignModal(currentProfileMoto, e.id)}
                              className="text-[10px] font-bold text-[#0F6E6E] hover:text-white border border-[#0F6E6E] hover:bg-[#0F6E6E] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Reatribuir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Productivity Card with metrics from Section 11.2 */}
              <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#F1F5F9] pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A] font-display">Produtividade</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Indicadores de performance e taxas de sucesso.
                    </p>
                  </div>

                  {/* Period filter */}
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="bg-slate-50 border border-[#E6EAF0] text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#0F6E6E] text-slate-700"
                  >
                    <option value="Hoje">Hoje</option>
                    <option value="7dias">Últimos 7 dias</option>
                    <option value="mes">Este mês</option>
                  </select>
                </div>

                {/* 11.2 Metrics Grid */}
                {(() => {
                  // Simulate metrics calculation depending on the chosen period
                  const mult = period === 'Hoje' ? 1 : period === '7dias' ? 5.8 : 23.4;
                  const delivered = Math.max(
                    profileMetrics.totalDelivered,
                    Math.round(profileMetrics.totalDelivered * mult)
                  );
                  const failed = Math.max(
                    profileMetrics.totalFailedAttempts,
                    Math.round(profileMetrics.totalFailedAttempts * mult)
                  );
                  // Success rate should remain very realistic with a tiny slight drift per period
                  const successRate =
                    period === 'Hoje'
                      ? profileMetrics.firstAttemptSuccessRate
                      : period === '7dias'
                      ? Math.min(98, profileMetrics.firstAttemptSuccessRate + 1)
                      : Math.max(80, profileMetrics.firstAttemptSuccessRate - 2);

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Metric 1 */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Entregas Realizadas
                        </span>
                        <div className="text-2xl font-bold text-slate-800">{delivered}</div>
                        <span className="text-[9px] text-[#16A34A] font-bold">Concluídas</span>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Sucesso 1ª Tentativa
                        </span>
                        <div className="text-2xl font-bold text-slate-800">{successRate}%</div>
                        <span className="text-[9px] text-emerald-600 font-bold">Meta: &gt;85%</span>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Insucessos
                        </span>
                        <div className="text-2xl font-bold text-slate-800">{failed}</div>
                        <span className="text-[9px] text-rose-500 font-semibold">Tentativas falhas</span>
                      </div>

                      {/* Metric 4 */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          Tempo Médio
                        </span>
                        <div className="text-2xl font-bold text-slate-800">
                          {profileMetrics.avgTimePerDelivery} min
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold">Por parada</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Motivos de insucesso horizontal bar chart */}
                <div className="space-y-4 pt-4 border-t border-[#F1F5F9]">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Motivos de Insucesso mais Frequentes
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Distribuição dos motivos baseada no histórico de tentativas deste entregador.
                    </p>
                  </div>

                  {(() => {
                    const catalog = ['Cliente ausente', 'Endereço incompleto', 'Recusado', 'Sem contato'];
                    // Calculate real counts from profileAttempts
                    const counts = catalog.map((reason) => {
                      const matchCount = profileMetrics.attempts.filter(
                        (t) => t.resultado === 'Insucesso' && t.motivo === reason
                      ).length;
                      return { reason, count: matchCount };
                    });

                    // Proportional scale factor for mock display in case of 0 attempts
                    const totalCounts = counts.reduce((s, c) => s + c.count, 0);
                    const finalCounts =
                      totalCounts > 0
                        ? counts
                        : [
                            { reason: 'Cliente ausente', count: 3 },
                            { reason: 'Endereço incompleto', count: 1 },
                            { reason: 'Recusado', count: 0 },
                            { reason: 'Sem contato', count: 0 },
                          ];

                    const maxCountVal = Math.max(...finalCounts.map((f) => f.count), 1);

                    return (
                      <div className="space-y-3.5">
                        {finalCounts.map((item) => {
                          const pct = Math.round((item.count / maxCountVal) * 100);
                          return (
                            <div key={item.reason} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-600">{item.reason}</span>
                                <span className="text-slate-500">
                                  {item.count} {item.count === 1 ? 'ocorrência' : 'ocorrências'}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#0F6E6E] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Histórico de Tentativas Card (últimas 10) */}
              <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
                <div className="border-b border-[#F1F5F9] pb-3 mb-4">
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">
                    Histórico Recente de Tentativas (Últimas 10)
                  </h4>
                </div>

                {(() => {
                  const sortedAttempts = [...profileMetrics.attempts].reverse().slice(0, 10);
                  const fallbackPhoto =
                    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=300';

                  if (sortedAttempts.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 text-center py-6 font-medium">
                        Nenhuma tentativa registrada recentemente por este entregador.
                      </p>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="pb-2.5">Tentativa</th>
                            <th className="pb-2.5">Entrega</th>
                            <th className="pb-2.5">Resultado</th>
                            <th className="pb-2.5">Motivo</th>
                            <th className="pb-2.5 text-right">Fachada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sortedAttempts.map((att, i) => (
                            <tr key={i} className="text-xs">
                              <td className="py-3 font-bold text-slate-700">
                                {att.numero}ª tentativa
                              </td>
                              <td className="py-3 font-bold text-[#0F6E6E]">
                                {att.entregaCodigo || 'ITM-N/A'}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                    att.resultado === 'Sucesso'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {att.resultado}
                                </span>
                              </td>
                              <td className="py-3 text-slate-500 font-semibold">
                                {att.motivo || '-'}
                              </td>
                              <td className="py-3 text-right">
                                <img
                                  src={att.fotoUrl || fallbackPhoto}
                                  alt="Fachada"
                                  className="h-8 w-8 rounded-md object-cover border border-slate-200 ml-auto cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxImgUrl(att.fotoUrl || fallbackPhoto)}
                                  referrerPolicy="no-referrer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== 2. MAIN LIST VIEW ==================== */
        <div className="space-y-6">
          {/* LINHA 1 — KPI CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Frota Ativa */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex items-center gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#E8F4F2] text-[#0F6E6E] flex items-center justify-center shrink-0">
                <Bike size={24} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Frota ativa
                </span>
                <div className="text-3xl font-bold text-[#0F6E6E]">{totalMotoboys}</div>
                <span className="text-slate-400 text-[10px] font-semibold">Cadastrados</span>
              </div>
            </div>

            {/* Card 2: Disponíveis */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex items-center gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Disponíveis
                </span>
                <div className="text-3xl font-bold text-emerald-700">{totalAvailable}</div>
                <span className="text-emerald-600 text-[10px] font-semibold">No pátio</span>
              </div>
            </div>

            {/* Card 3: Em Rota */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex items-center gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Em rota
                </span>
                <div className="text-3xl font-bold text-blue-700">{totalInRoute}</div>
                <span className="text-blue-500 text-[10px] font-semibold">Nas ruas</span>
              </div>
            </div>

            {/* Card 4: Ocupação Média */}
            <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-6 flex items-center gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Activity size={24} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Ocupação média
                </span>
                <div className="text-3xl font-bold text-amber-700">{averageOccupancy}%</div>
                <span className="text-amber-600 text-[10px] font-semibold">Meta global</span>
              </div>
            </div>
          </section>

          {/* BARRA DE CONTROLE */}
          <div className="bg-white p-4 rounded-xl border border-[#E6EAF0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar motoboy por nome ou região..."
                className="w-full bg-slate-50 border border-[#E6EAF0] focus:border-[#0F6E6E] focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            {/* Selects & View Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-[#E6EAF0] text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0F6E6E] text-slate-700 cursor-pointer"
                >
                  <option value="Todos">Todos</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Em rota">Em rota</option>
                  <option value="Indisponível">Indisponível</option>
                </select>
              </div>

              {/* Region Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase">Região</span>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-slate-50 border border-[#E6EAF0] text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0F6E6E] text-slate-700 cursor-pointer"
                >
                  <option value="Todas as regiões">Todas as regiões</option>
                  <option value="Centro">Centro</option>
                  <option value="Zona Sul">Zona Sul</option>
                  <option value="Zona Norte">Zona Norte</option>
                  <option value="Zona Leste">Zona Leste</option>
                  <option value="Zona Oeste">Zona Oeste</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="h-8 border-l border-[#E6EAF0] mx-1 hidden sm:block" />

              <div className="flex items-center bg-slate-50 border border-[#E6EAF0] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#0F6E6E] shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Visualização em Grid"
                >
                  <Grid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('tabela')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'tabela'
                      ? 'bg-white text-[#0F6E6E] shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Visualização em Tabela"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN RESULTS CONTAINER */}
          {filteredMotoboys.length === 0 ? (
            <div className="bg-white border border-[#E6EAF0] rounded-xl p-12 text-center text-slate-400 font-medium shadow-xs">
              Nenhum motoboy localizado com as opções de filtragem selecionadas.
            </div>
          ) : viewMode === 'cards' ? (
            /* VISÃO EM CARDS (Grid 3 colunas) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMotoboys.map((moto) => (
                <MotoboyCard
                  key={moto.id}
                  moto={moto}
                  showActions={true}
                  editableStatus={true}
                  onVerPerfil={() => navigate(`/motoboys/${moto.id}`)}
                  onReatribuir={() => handleOpenReassignModal(moto)}
                />
              ))}
            </div>
          ) : (
            /* VISÃO EM TABELA */
            <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6EAF0] bg-slate-50/50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Motoboy</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Região</th>
                      <th className="p-4">Veículo</th>
                      <th className="p-4">Capacidade</th>
                      <th className="p-4">Entregas Hoje</th>
                      <th className="p-4">Sucesso 1ª Tent.</th>
                      <th className="p-4">Tempo Médio</th>
                      <th className="p-4 pr-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-xs">
                    {filteredMotoboys.map((moto) => {
                      const metrics = getMotoboyMetrics(moto.id);
                      const occupancy = moto.meta > 0 ? Math.round((metrics.totalDeliveries / moto.meta) * 100) : 0;
                      const progressColor =
                        occupancy <= 60
                          ? 'bg-emerald-500'
                          : occupancy <= 85
                          ? 'bg-amber-500'
                          : 'bg-rose-500';

                      return (
                        <tr key={moto.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={moto.fotoUrl}
                                alt={moto.nome}
                                referrerPolicy="no-referrer"
                                className="h-9 w-9 rounded-full object-cover border border-slate-100"
                              />
                              <span className="font-bold text-slate-800">{moto.nome}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                moto.status === 'Disponível'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : moto.status === 'Em rota'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full ${
                                  moto.status === 'Disponível'
                                    ? 'bg-emerald-500'
                                    : moto.status === 'Em rota'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {moto.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-600">{moto.regiao}</td>
                          <td className="p-4 text-slate-500 font-semibold">Moto</td>
                          <td className="p-4 font-bold text-slate-700">
                            {moto.capacidadeKg.toFixed(1)} kg
                          </td>
                          <td className="p-4 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                <span>
                                  {metrics.totalDeliveries}/{moto.meta}
                                </span>
                                <span>{occupancy}%</span>
                              </div>
                              <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${progressColor}`}
                                  style={{ width: `${Math.min(100, occupancy)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            {metrics.firstAttemptSuccessRate}%
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            {metrics.avgTimePerDelivery} min
                          </td>
                          <td className="p-4 pr-6 text-right relative">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/motoboys/${moto.id}`)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Ver Perfil"
                              >
                                <Eye size={14} />
                              </button>

                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveKebabMenu(activeKebabMenu === moto.id ? null : moto.id)
                                  }
                                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {activeKebabMenu === moto.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setActiveKebabMenu(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E6EAF0] rounded-lg shadow-md py-1.5 z-20 text-left">
                                      <button
                                        onClick={() => {
                                          setActiveKebabMenu(null);
                                          navigate(`/motoboys/${moto.id}`);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                      >
                                        Ver PerfilCompleto
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveKebabMenu(null);
                                          handleOpenReassignModal(moto);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                      >
                                        Reatribuir entregas
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. REASSIGN DELIVERIES MODAL ==================== */}
      {isReassignModalOpen && reassignFromMoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsReassignModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Reatribuir Entregas</h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Origem: <span className="text-slate-600 font-bold">{reassignFromMoto.nome}</span>
                </p>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmReassign} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Deliveries list to select */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Selecione as entregas para reatribuição
                </span>

                {(() => {
                  const activeDeliveries = state.entregas.filter(
                    (e) => e.motoboyId === reassignFromMoto.id && ['Em rota', 'Atribuída'].includes(e.status)
                  );

                  if (activeDeliveries.length === 0) {
                    return (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center text-xs font-semibold text-slate-400">
                        Nenhuma entrega ativa/em rota localizada para este entregador.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                      {activeDeliveries.map((e) => {
                        const isChecked = selectedDeliveriesForReassign.includes(e.id);
                        return (
                          <label
                            key={e.id}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-[#0F6E6E] shadow-2xs'
                                : 'bg-white/80 border-slate-100 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedDeliveriesForReassign(
                                    selectedDeliveriesForReassign.filter((id) => id !== e.id)
                                  );
                                } else {
                                  setSelectedDeliveriesForReassign([
                                    ...selectedDeliveriesForReassign,
                                    e.id,
                                  ]);
                                }
                              }}
                              className="mt-1 accent-[#0F6E6E]"
                            />
                            <div className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{e.codigo}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ({e.tipoItem})
                                </span>
                              </div>
                              <p className="text-slate-600 font-bold mt-0.5">
                                Beneficiário: {e.beneficiario.nome}
                              </p>
                              <div className="text-slate-400 font-semibold text-[10px] flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-slate-300" />{' '}
                                {e.endereco.bairro}, {e.endereco.cidade}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Destination selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Motoboy de Destino
                </span>

                {(() => {
                  // Filter valid targets: exclusion of sender and excluded overloaded (>100% capacity)
                  const validDestinations = state.motoboys.filter((m) => {
                    if (m.id === reassignFromMoto.id) return false;
                    const count = state.entregas.filter((e) => e.motoboyId === m.id).length;
                    const occ = m.meta > 0 ? Math.round((count / m.meta) * 100) : 0;
                    if (occ > 100) return false; // Excluded overloaded destinations!
                    return true;
                  });

                  return (
                    <select
                      value={destinationMotoId}
                      onChange={(e) => setDestinationMotoId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-[#E6EAF0] text-xs font-semibold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#0F6E6E] text-slate-700"
                    >
                      <option value="">Selecione o motoboy de destino...</option>
                      {validDestinations.map((m) => {
                        const count = state.entregas.filter((e) => e.motoboyId === m.id).length;
                        return (
                          <option key={m.id} value={m.id}>
                            {m.nome} ({count}/{m.meta} entregas - {m.regiao})
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>

              {/* Required Reason motive */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Motivo da Reatribuição (Obrigatório)
                </span>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Justifique o motivo de reatribuição destas entregas..."
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-[#E6EAF0] text-xs font-semibold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#0F6E6E] text-slate-700 placeholder:text-slate-400"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#F1F5F9] flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 border border-[#E6EAF0] text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedDeliveriesForReassign.length === 0 || !destinationMotoId || !reassignReason}
                  className="px-4 py-2 bg-[#0F6E6E] text-white hover:bg-[#0C5858] rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Confirmar Reatribuição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 4. PHOTO LIGHTBOX MODAL ==================== */}
      {lightboxImgUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-xs"
            onClick={() => setLightboxImgUrl(null)}
          />
          <div className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-2xl z-10">
            <button
              onClick={() => setLightboxImgUrl(null)}
              className="absolute top-4 right-4 text-white hover:text-slate-300 bg-black/50 p-1.5 rounded-full transition-colors cursor-pointer z-20"
            >
              <X size={20} />
            </button>
            <div className="p-4 bg-slate-900 flex justify-center items-center">
              <img
                src={lightboxImgUrl}
                alt="Fachada ampliada"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-4 bg-white border-t border-[#E6EAF0] text-center text-xs font-bold text-slate-600">
              Visualização de Foto de Fachada / Tentativa
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
