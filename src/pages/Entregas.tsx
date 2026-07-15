import React from 'react';
import EntregasTable from '../components/EntregasTable';

export default function Entregas() {
  return (
    <div className="space-y-6 fade-in p-1">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] font-sans tracking-tight">Entregas</h2>
          <p className="text-xs text-[#64748B] font-semibold mt-0.5">
            Controle geral de itens de entrega, rotas e motoristas encarregados.
          </p>
        </div>
      </div>

      {/* CORE TABLE */}
      <EntregasTable />
    </div>
  );
}
