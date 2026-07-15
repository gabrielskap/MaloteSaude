import React from 'react';
import { useMalote } from '../context/MaloteContext';
import { Motoboy } from '../types';
import { Compass, Check } from 'lucide-react';

interface MotoboyCardProps {
  key?: any;
  moto: Motoboy;
  isSelected?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  onVerPerfil?: () => void;
  onReatribuir?: () => void;
  editableStatus?: boolean;
}

export default function MotoboyCard({
  moto,
  isSelected = false,
  onClick,
  showActions = false,
  onVerPerfil,
  onReatribuir,
  editableStatus = false,
}: MotoboyCardProps) {
  const { state, dispatch } = useMalote();

  // Derive dynamic deliveries from context state.entregas
  const totalEntregasMoto = state.entregas.filter((e) => e.motoboyId === moto.id).length;

  // Occupancy percentage based on derived deliveries count and meta
  const occupancy = moto.meta > 0 ? Math.round((totalEntregasMoto / moto.meta) * 100) : 0;

  // "Cor da barra de ocupação: verde até 60%, âmbar de 61% a 85%, vermelho acima de 85%."
  const getOccupancyColor = (pct: number) => {
    if (pct <= 60) return 'bg-emerald-500';
    if (pct <= 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Em rota':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Indisponível':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-emerald-500';
      case 'Em rota':
        return 'bg-blue-500';
      case 'Indisponível':
      default:
        return 'bg-slate-400';
    }
  };

  const handleStatusChange = (newStatus: 'Disponível' | 'Em rota' | 'Indisponível') => {
    dispatch({
      type: 'ALTERAR_STATUS_MOTOBOY',
      payload: { motoboyId: moto.id, status: newStatus },
    });
  };

  const isOverloaded = occupancy > 100;

  return (
    <div
      onClick={isOverloaded && !showActions ? undefined : onClick}
      className={`p-4 border rounded-xl transition-all duration-300 relative select-none flex flex-col justify-between ${
        showActions ? 'bg-white border-[#E6EAF0]' : 'h-[210px]'
      } ${
        isOverloaded && !showActions ? 'opacity-70 border-rose-300 bg-rose-50/10 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-2 border-[#0F6E6E] bg-[#E8F4F2]/20 shadow-xs'
          : !showActions && !(isOverloaded && !showActions)
          ? 'border-[#E6EAF0] bg-white hover:bg-slate-50'
          : ''
      }`}
    >
      {/* Top row: Status/Dropdown + Selection checkmark */}
      <div className="flex items-center justify-between mb-2">
        {editableStatus ? (
          <div className="relative inline-block">
            <select
              value={moto.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className={`appearance-none text-[10px] font-extrabold pl-6 pr-8 py-1 rounded-full border cursor-pointer outline-none transition-colors ${getStatusColor(
                moto.status
              )}`}
            >
              <option value="Disponível">Disponível</option>
              <option value="Em rota">Em rota</option>
              <option value="Indisponível">Indisponível</option>
            </select>
            <span
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${getStatusDotColor(
                moto.status
              )}`}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-[3.5px] border-r-[3.5px] border-t-4 border-l-transparent border-r-transparent border-t-current w-0 h-0" />
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusColor(
              moto.status
            )}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(moto.status)}`} />
            {moto.status}
          </span>
        )}

        {isSelected && (
          <span className="h-4 w-4 bg-[#0F6E6E] text-white rounded-full flex items-center justify-center p-0.5">
            <Check size={10} strokeWidth={3} />
          </span>
        )}

        {isOverloaded && !showActions && (
          <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
            Sobrecarga (&gt;100%)
          </span>
        )}
      </div>

      {/* Profile Pic & Name */}
      <div className="flex items-center gap-3 my-2">
        <img
          src={moto.fotoUrl}
          alt={moto.nome}
          referrerPolicy="no-referrer"
          className="h-10 w-10 rounded-full object-cover border border-slate-200"
        />
        <div>
          <p className="text-xs font-bold text-slate-800">{moto.nome}</p>
          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
            <Compass size={12} className="text-[#0F6E6E]" /> Moto
          </p>
        </div>
      </div>

      {/* Info & occupancy */}
      <div className="mt-2 space-y-2">
        <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
          <div>
            Capacidade: <span className="font-bold text-slate-700">{moto.capacidadeKg.toFixed(1)} kg</span>
          </div>
          <div>
            Entregas hoje: <span className="font-bold text-slate-700">{totalEntregasMoto}/{moto.meta}</span>
          </div>
          <div className="truncate">
            Região: <span className="font-bold text-slate-700">{moto.regiao}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400">
            <span>Ocupação</span>
            <span className={isSelected ? 'text-[#0F6E6E]' : 'text-slate-500'}>{occupancy}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getOccupancyColor(occupancy)}`}
              style={{ width: `${Math.min(100, occupancy)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Optional Action Buttons for /motoboys page */}
      {showActions && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-[#F1F5F9] shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerPerfil?.();
            }}
            className="flex-1 text-center py-1.5 border border-[#E6EAF0] text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Ver perfil
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReatribuir?.();
            }}
            className="flex-1 text-center py-1.5 border border-[#E6EAF0] text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Reatribuir entregas
          </button>
        </div>
      )}
    </div>
  );
}
