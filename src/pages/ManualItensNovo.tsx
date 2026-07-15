import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMalote } from '../context/MaloteContext';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  CreditCard, 
  FileText, 
  BookOpen, 
  Save 
} from 'lucide-react';

interface ItemManual {
  id: string;
  beneficiario: string;
  documento: string;
  tipo: 'Cartão' | 'Boleto' | 'Carnê';
  codigoBarras: string;
}

export default function ManualItensNovo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useMalote();

  // Find malote
  const malote = state.malotes.find(m => m.id === id) || state.malotes.find(m => m.codigo === id);
  const clienteName = malote ? (state.clientes.find(c => c.id === malote.clienteId)?.nome || 'Cliente') : 'Cliente';

  // State for items being created
  const [items, setItems] = useState<ItemManual[]>([
    { id: '1', beneficiario: 'Maria Ap. Souza', documento: '123.456.789-00', tipo: 'Cartão', codigoBarras: '34191.79001 01043.513184 91020.150008 7 900000000000' }
  ]);

  // Form states for new item
  const [newBeneficiario, setNewBeneficiario] = useState('');
  const [newDocumento, setNewDocumento] = useState('');
  const [newTipo, setNewTipo] = useState<'Cartão' | 'Boleto' | 'Carnê'>('Cartão');
  const [newCodigoBarras, setNewCodigoBarras] = useState('');
  const [error, setError] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficiario || !newDocumento || !newCodigoBarras) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setError('');

    const newItem: ItemManual = {
      id: `item-${Date.now()}`,
      beneficiario: newBeneficiario,
      documento: newDocumento,
      tipo: newTipo,
      codigoBarras: newCodigoBarras
    };

    setItems([...items, newItem]);
    setNewBeneficiario('');
    setNewDocumento('');
    setNewCodigoBarras('');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleFinalizar = () => {
    // In a real application we would save these items to the context or backend.
    // For now we navigate to the malote details page with a success message!
    navigate(`/malotes/${malote?.id || id || ''}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 select-none">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate('/malotes')}>Malotes</span>
        <span>›</span>
        <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate(`/malotes/${malote?.id || id || ''}`)}>{malote?.codigo || id}</span>
        <span>›</span>
        <span className="text-slate-800 font-semibold">Cadastro Manual</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Cadastro Manual de Itens</h1>
          <p className="text-xs text-slate-500 mt-1">
            Adicione e gerencie os itens do malote <span className="font-mono text-blue-600 font-semibold">{malote?.codigo || id}</span> ({clienteName})
          </p>
        </div>
        <button
          onClick={() => navigate(`/malotes`)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#E6EAF0] hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft size={14} /> Voltar para Malotes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário de Adicionar Item */}
        <div className="bg-white rounded-[14px] border border-[#E6EAF0] p-5 shadow-xs h-fit space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">Novo Item</h2>
          
          <form onSubmit={handleAddItem} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Beneficiário*</label>
              <input
                type="text"
                value={newBeneficiario}
                onChange={e => setNewBeneficiario(e.target.value)}
                placeholder="Nome do beneficiário"
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Documento (CPF)*</label>
              <input
                type="text"
                value={newDocumento}
                onChange={e => setNewDocumento(e.target.value)}
                placeholder="Ex: 000.000.000-00"
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tipo de Item*</label>
              <select
                value={newTipo}
                onChange={e => setNewTipo(e.target.value as any)}
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-semibold text-slate-600 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Cartão">Cartão</option>
                <option value="Boleto">Boleto</option>
                <option value="Carnê">Carnê</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Código de Barras / Linha Digitável*</label>
              <input
                type="text"
                value={newCodigoBarras}
                onChange={e => setNewCodigoBarras(e.target.value)}
                placeholder="Código de barras numérico"
                className="w-full bg-white border border-[#E6EAF0] rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2 rounded-lg font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </form>
        </div>

        {/* Lista de Itens Cadastrados */}
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E6EAF0] p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-[#0F172A]">Itens Cadastrados ({items.length})</h2>
              <span className="text-[11px] font-bold text-[#0F6E6E] bg-teal-50 px-2 py-0.5 rounded-full">
                Em digitação
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] font-bold text-[#64748B] uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Beneficiário</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Código de Barras</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {items.length > 0 ? (
                    items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/20">
                        <td className="py-3 px-3 font-semibold text-slate-700">{item.beneficiario}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{item.documento}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${item.tipo === 'Cartão' ? 'text-teal-700' : item.tipo === 'Boleto' ? 'text-blue-700' : 'text-purple-700'}`}>
                            {item.tipo === 'Cartão' ? <CreditCard size={12} /> : item.tipo === 'Boleto' ? <FileText size={12} /> : <BookOpen size={12} />}
                            {item.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[150px]" title={item.codigoBarras}>
                          {item.codigoBarras}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                        Nenhum item cadastrado manualmente ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-6">
            <span className="text-[11px] font-semibold text-slate-400">
              Certifique-se de que a quantidade inserida bate com os totais informados no malote.
            </span>
            <button
              onClick={handleFinalizar}
              className="flex items-center gap-2 bg-[#0F6E6E] hover:bg-[#0B5757] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Check size={14} /> Salvar e Finalizar Malote
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
