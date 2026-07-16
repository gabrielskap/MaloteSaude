import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Mail,
  Truck,
  Share2,
  AlertCircle,
  Bike,
  FileText,
  BarChart2,
  Settings,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  Bell,
  ExternalLink,
  ChevronRight,
  Check,
  Play,
  RotateCcw,
  X,
  Menu
} from 'lucide-react';
import { useMalote } from '../context/MaloteContext';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: LayoutProps) {
  const { state, dispatch } = useMalote();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getPermission = (actionKey: string, currentRole: string) => {
    let colName = 'Admin';
    if (currentRole === 'Administrador') colName = 'Admin';
    else if (currentRole === 'Operação') colName = 'Operação';
    else if (currentRole === 'Motoboy') colName = 'Motoboy';
    else if (currentRole === 'Financeiro') colName = 'Financeiro';
    else if (currentRole === 'Contratante') colName = 'Contratante';

    const matrix = state.configuracoes?.matrizPermissoes;
    if (!matrix) return 'Sim';

    const actionRow = (matrix as any)[actionKey];
    if (!actionRow) return 'Sim';

    return actionRow[colName] ?? 'Não';
  };

  // Filter menu items dynamically according to the active profile (role)
  const getFilteredMenuItems = () => {
    const list = [{ name: 'Dashboard', path: '/', icon: LayoutGrid }];

    // 1. Malotes (Criar/editar malote)
    if (getPermission('criarEditarMalote', state.perfil) !== 'Não') {
      list.push({ name: 'Malotes', path: '/malotes', icon: Mail });
    }

    // 2. Entregas (Cadastrar/revisar entrega)
    if (getPermission('cadastrarRevisarEntrega', state.perfil) !== 'Não') {
      list.push({ name: 'Entregas', path: '/entregas', icon: Truck });
    }

    // 3. Distribuição (Atribuir motoboy)
    if (getPermission('atribuirMotoboy', state.perfil) !== 'Não') {
      list.push({ name: 'Distribuição', path: '/distribuicao', icon: Share2 });
    }

    // 4. Pendências (Tratar pendência)
    if (getPermission('tratarPendencia', state.perfil) !== 'Não') {
      list.push({ name: 'Pendências', path: '/pendencias', icon: AlertCircle });
    }

    // 5. Motoboys / Minhas Entregas (Atribuir motoboy ou registrar tentativa)
    if (state.perfil === 'Motoboy') {
      list.push({ name: 'Minhas Entregas', path: '/app/entregas', icon: Bike });
    } else if (getPermission('atribuirMotoboy', state.perfil) !== 'Não' || getPermission('registrarTentativa', state.perfil) !== 'Não') {
      list.push({ name: 'Motoboys', path: '/motoboys', icon: Bike });
    }

    // 6. Faturamento (Fechar faturamento ou alterar tabela de valores)
    if (getPermission('fecharFaturamento', state.perfil) !== 'Não' || getPermission('alterarTabelaValores', state.perfil) !== 'Não') {
      list.push({ name: 'Faturamento', path: '/faturamento', icon: FileText });
    }

    // 7. Relatórios (Consultar rastreamento)
    if (getPermission('consultarRastreio', state.perfil) !== 'Não') {
      list.push({ name: 'Relatórios', path: '/relatorios', icon: BarChart2 });
    }

    // 8. Configurações - only visible to Administrators
    if (state.perfil === 'Administrador') {
      list.push({ name: 'Configurações', path: '/configuracoes', icon: Settings });
    }

    return list;
  };

  const menuItems = getFilteredMenuItems();

  // Dynamically get Title and Subtitle based on route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      return { title: 'Dashboard', subtitle: 'Visão geral das operações de entregas por malote.' };
    }
    if (path === '/malotes') {
      return { title: 'Malotes', subtitle: 'Gerencie todos os malotes recebidos e acompanhe seu processamento.' };
    }
    if (path === '/malotes/novo') {
      return { title: 'Novo malote', subtitle: 'Malotes > Novo malote' }; // As seen in image breadcrumbs
    }
    if (path.startsWith('/malotes/') && path.endsWith('/ocr')) {
      return { title: 'OCR e revisão', subtitle: 'Revise os dados extraídos dos documentos/etiquetas do malote.' };
    }
    if (path.startsWith('/malotes/')) {
      return { title: 'Detalhe do malote', subtitle: 'Acompanhe as informações e o status de cada etapa deste malote.' };
    }
    if (path === '/entregas') {
      return { title: 'Entregas', subtitle: 'Controle geral de itens de entrega, rotas e motoristas encarregados.' };
    }
    if (path.startsWith('/entregas/') && path.endsWith('/tentativa')) {
      return { title: 'Registrar tentativa', subtitle: 'Registro de ocorrência e motivos de tentativa de entrega sem sucesso.' };
    }
    if (path === '/distribuicao') {
      return { title: 'Distribuição', subtitle: 'Atribuição e despacho de entregas para motoboys.' };
    }
    if (path.startsWith('/pendencias/')) {
      return { title: 'Tratativa de Pendência', subtitle: 'Análise detalhada e tomada de providências para a entrega.' };
    }
    if (path === '/pendencias') {
      return { title: 'Pendências', subtitle: 'Controle e tomada de providências para entregas com inconsistência.' };
    }
    if (path === '/motoboys') {
      return { title: 'Motoboys', subtitle: 'Status de disponibilidade, metas e capacidade da frota.' };
    }
    if (path === '/faturamento') {
      return { title: 'Faturamento', subtitle: 'Controle financeiro de corridas e repasses.' };
    }
    if (path === '/relatorios') {
      return { title: 'Relatórios', subtitle: 'Métricas de performance, SLA de entregas e estatísticas.' };
    }
    if (path === '/configuracoes') {
      return { title: 'Configurações', subtitle: 'Ajuste de SLA, regras e parâmetros gerais do sistema.' };
    }
    return { title: 'Malote Saúde', subtitle: 'Sistema de gestão logística.' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen flex text-[#0F172A] font-sans bg-[#F7F9FB]">
      
      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 260px Fixed Sidebar — off-canvas drawer on mobile */}
      <aside className={`w-[260px] fixed top-0 bottom-0 left-0 bg-white border-r border-[#E6EAF0] flex flex-col justify-between z-40 select-none overflow-y-auto transition-transform duration-200 ${sidebarOpen ? '' : 'max-lg:-translate-x-full'}`}>
        <div>
          {/* Brand Logo and Slogan */}
          <div className="p-6 pb-4 border-b border-[#F1F5F9] relative">
            {/* Close drawer button (mobile only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-slate-50 cursor-pointer"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              {/* Logo custom visual element */}
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#2B7FD4] to-[#1E6BB8] flex items-center justify-center relative shadow-sm shrink-0">
                <FileText className="text-white w-5 h-5 absolute top-2 left-2" />
                <span className="text-white text-md font-bold absolute bottom-1 right-2 leading-none">+</span>
              </div>
              <div>
                <h1 className="text-[20px] font-bold text-[#1E6BB8] font-display leading-tight">
                  Malote Saúde
                </h1>
                <p className="text-[10px] text-[#64748B] font-medium leading-tight">
                  Entregas que conectam<br/>saúde e pessoas.
                </p>
              </div>
            </div>
          </div>

          {/* Nav menu links */}
          <nav className="mt-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative group
                    ${isActive 
                      ? 'bg-[#E8F4F2] text-[#0F6E6E]' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Colored Left indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0F6E6E] rounded-r" />
                      )}
                      <Icon size={18} className={isActive ? 'text-[#0F6E6E]' : 'text-[#94A3B8] group-hover:text-[#64748B]'} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer elements */}
        <div className="p-4 border-t border-[#E6EAF0] space-y-4">
          
          {/* Quick link to other portal previews */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60">
            <h4 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2">Simular Portais</h4>
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/rastreio')} 
                className="w-full flex items-center justify-between text-left text-xs text-blue-600 hover:text-blue-800 py-1 font-medium group"
              >
                <span>Acompanhe sua entrega</span>
                <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
              </button>
              <button 
                onClick={() => navigate('/app/entregas')} 
                className="w-full flex items-center justify-between text-left text-xs text-blue-600 hover:text-blue-800 py-1 font-medium group"
              >
                <span>App Motoboy</span>
                <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
              </button>
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_PERFIL', payload: 'Contratante' });
                  navigate('/rastreio?codigo=MLTBR9876543210&contratante=true');
                }} 
                className="w-full flex items-center justify-between text-left text-xs text-blue-600 hover:text-blue-800 py-1 font-medium group"
              >
                <span>Painel do Contratante</span>
                <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Operational Status Card */}
          <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl p-3 flex items-start gap-3">
            <div className="relative mt-1">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#334155] leading-tight">Sistema operacional</p>
              <p className="text-[10px] text-[#64748B] leading-normal mt-0.5">Todos os sistemas operando normalmente</p>
            </div>
          </div>

          {/* Profile Popover and Toggle button */}
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#E8F4F2] text-[#0F6E6E] font-bold text-sm flex items-center justify-center shrink-0">
                  RS
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#1E293B] truncate leading-tight">Ricardo Silva</p>
                  <p className="text-[11px] text-[#64748B] truncate leading-tight mt-0.5">{state.perfil}</p>
                </div>
              </div>
              <ChevronDown size={14} className="text-[#94A3B8] shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#E6EAF0] rounded-xl shadow-lg p-2 z-20 fade-in w-[210px] md:w-[228px]">
                <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Alterar Perfil:
                </div>
                {(['Administrador', 'Operação', 'Motoboy', 'Financeiro', 'Contratante'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      dispatch({ type: 'SET_PERFIL', payload: role });
                      setProfileOpen(false);
                      if (role === 'Motoboy') {
                        navigate('/app/entregas');
                      } else if (role === 'Contratante') {
                        navigate('/rastreio');
                      } else {
                        navigate('/');
                      }
                    }}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center justify-between ${
                      state.perfil === role 
                        ? 'bg-[#E8F4F2] text-[#0F6E6E]' 
                        : 'text-[#334155] hover:bg-slate-50'
                    }`}
                  >
                    <span>{role}</span>
                    {state.perfil === role && <Check size={12} className="text-[#0F6E6E]" />}
                  </button>
                ))}
                <div className="h-px bg-[#F1F5F9] my-1.5" />
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/configuracoes'); }}
                  className="w-full text-left text-xs px-3 py-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-colors font-medium flex items-center justify-between"
                >
                  <span>Configurações</span>
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 min-w-0 lg:ml-[260px] flex flex-col min-h-screen">

        {/* Top Header Section (Topo) */}
        <header className="min-h-[64px] lg:h-[80px] border-b border-[#E6EAF0] bg-white px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 shrink-0 select-none">
          {/* Hamburger + Title + Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Open drawer button (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white border border-[#E6EAF0] hover:bg-slate-50 rounded-xl flex items-center justify-center text-[#475569] cursor-pointer transition-all shrink-0"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-[24px] font-semibold text-[#0F172A] font-display leading-tight truncate">
                {headerInfo.title}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 font-sans hidden md:block">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Date Select Button showing 26 de maio de 2025 */}
            <div className="bg-[#F8FAFC] border border-[#E6EAF0] hover:border-gray-300 rounded-xl px-3 md:px-4 py-2 hidden sm:flex items-center gap-2.5 text-xs font-semibold text-[#475569] cursor-pointer transition-colors">
              <Calendar size={14} className="text-[#64748B]" />
              <span className="hidden md:inline">26 de maio de 2025</span>
              <ChevronDown size={12} className="text-[#94A3B8]" />
            </div>

            {/* Filter Toggle Button */}
            <button className="bg-white border border-[#E6EAF0] hover:bg-slate-50 rounded-xl px-3 md:px-4 py-2 hidden sm:flex items-center gap-2 text-xs font-semibold text-[#475569] transition-all cursor-pointer">
              <SlidersHorizontal size={14} className="text-[#64748B]" />
              <span className="hidden md:inline">Filtros</span>
            </button>

            {/* Notification Badge with "3" */}
            <div className="relative">
              <button 
                onClick={() => {
                  dispatch({ type: 'LIMPAR_NOTIFICACOES' });
                }}
                className="w-10 h-10 bg-white border border-[#E6EAF0] hover:bg-slate-50 rounded-xl flex items-center justify-center text-[#475569] cursor-pointer transition-all relative"
              >
                <Bell size={18} />
                {state.notificacoesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {state.notificacoesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Universal Admin Footer */}
        <footer className="py-6 px-4 border-t border-[#E6EAF0] bg-white text-center select-none text-[12px] text-[#94A3B8]">
          © 2025 Malote Saúde — Sistema de Gestão de Entregas por Malote. Todos os direitos reservados.
        </footer>

      </div>
    </div>
  );
}
