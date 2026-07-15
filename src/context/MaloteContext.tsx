import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Cliente, Malote, Entrega, Motoboy, Pendencia, EventoAuditoria, StatusMalote, StatusEntrega, Prioridade, Tentativa, Endereco, ConfigState, UsuarioSistema, MotivoInsucesso } from '../types';
import { clientesMock, malotesMock, entregasMock, motoboysMock, pendenciasMock, auditoriaMock } from '../data/seed';

export interface FiltrosState {
  data: string;
  regiao: string;
  prioridade: string;
  status: string;
  malote: string;
  busca: string;
}

export interface MaloteState {
  clientes: Cliente[];
  malotes: Malote[];
  entregas: Entrega[];
  motoboys: Motoboy[];
  pendencias: Pendencia[];
  auditoria: EventoAuditoria[];
  filtros: FiltrosState;
  notificacoesCount: number;
  perfil: 'Administrador' | 'Operação' | 'Motoboy' | 'Financeiro' | 'Contratante';
  demoStep: number;
  demoState?: {
    preFillNovoMalote?: boolean;
    ocrRevisaoStep?: boolean;
    preFillRegistrarTentativa?: boolean;
    preFillPendencia?: boolean;
  };
  configuracoes: ConfigState;
  usuarios: UsuarioSistema[];
}

const initialFiltros: FiltrosState = {
  data: '2025-05-26', // Standard representation
  regiao: 'Todas as regiões',
  prioridade: 'Todas',
  status: 'Todos os status',
  malote: 'Todos os malotes',
  busca: '',
};

const initialConfig: ConfigState = {
  tentativasMaximas: 3,
  autorizacaoQuartaTentativa: false,
  exigirFotoFachadaInsucesso: true,
  exigirFotoEntregaConcluida: false,
  capturarLocalizacaoGps: true,
  prazoConferenciaHoras: 2,
  prazoDespachoHoras: 2,
  prazoTotalEntregaDias: 5,
  atrasoAposHoras: 24,
  retencaoEvidenciasDias: 90,
  retencaoLocalizacaoDias: 30,
  capacidadePadraoMotoboyKg: 8,
  metaDiariaEntregasMotoboy: 20,

  matrizPermissoes: {
    criarEditarMalote: { Admin: 'Sim', Operação: 'Sim', Gestor: 'Sim', Motoboy: 'Não', Financeiro: 'Não', Contratante: 'Consulta', Beneficiário: 'Não' },
    cadastrarRevisarEntrega: { Admin: 'Sim', Operação: 'Sim', Gestor: 'Sim', Motoboy: 'Não', Financeiro: 'Não', Contratante: 'Consulta', Beneficiário: 'Não' },
    atribuirMotoboy: { Admin: 'Sim', Operação: 'Sim', Gestor: 'Sim', Motoboy: 'Não', Financeiro: 'Não', Contratante: 'Consulta', Beneficiário: 'Não' },
    registrarTentativa: { Admin: 'Não', Operação: 'Apoio', Gestor: 'Exceção', Motoboy: 'Sim', Financeiro: 'Não', Contratante: 'Consulta', Beneficiário: 'Não' },
    tratarPendencia: { Admin: 'Sim', Operação: 'Sim', Gestor: 'Sim', Motoboy: 'Não', Financeiro: 'Não', Contratante: 'Consulta', Beneficiário: 'Não' },
    alterarTabelaValores: { Admin: 'Sim', Operação: 'Não', Gestor: 'Consulta', Motoboy: 'Não', Financeiro: 'Sim', Contratante: 'Não', Beneficiário: 'Não' },
    fecharFaturamento: { Admin: 'Sim', Operação: 'Não', Gestor: 'Aprova', Motoboy: 'Não', Financeiro: 'Sim', Contratante: 'Consulta', Beneficiário: 'Não' },
    consultarRastreio: { Admin: 'Sim', Operação: 'Sim', Gestor: 'Sim', Motoboy: 'Próprias', Financeiro: 'Consulta', Contratante: 'Sim', Beneficiário: 'Própria' },
  },

  motivosInsucesso: [
    { id: 'mot-1', nome: 'Beneficiário ausente', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-2', nome: 'Endereço não localizado', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-3', nome: 'Endereço incompleto', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-4', nome: 'Endereço incorreto', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-5', nome: 'Contato indisponível', ativo: true, exigeJustificativa: false, exigeFoto: false, cliente: 'Todos' },
    { id: 'mot-6', nome: 'Mudou-se', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-7', nome: 'Recusa de recebimento', ativo: true, exigeJustificativa: true, exigeFoto: false, cliente: 'Todos' },
    { id: 'mot-8', nome: 'Local fechado', ativo: true, exigeJustificativa: false, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-9', nome: 'Área de risco/restrição operacional', ativo: true, exigeJustificativa: true, exigeFoto: false, cliente: 'Todos' },
    { id: 'mot-10', nome: 'Kit/documento com problema', ativo: true, exigeJustificativa: true, exigeFoto: true, cliente: 'Todos' },
    { id: 'mot-11', nome: 'Entrega cancelada pelo contratante', ativo: true, exigeJustificativa: true, exigeFoto: false, cliente: 'Todos' },
    { id: 'mot-12', nome: 'Outro motivo (justificativa obrigatória)', ativo: true, exigeJustificativa: true, exigeFoto: true, cliente: 'Todos' },
  ],

  ocrRevisaoHumanaObrigatoria: true,
  ocrLimiteConfianca: 80,
  ocrCamposObrigatorios: ['Nome', 'CPF', 'Logradouro', 'Número', 'CEP', 'Telefone', 'Tipo de item'],
  ocrFormatoArquivo: 'xlsx',
};

const initialUsuarios: UsuarioSistema[] = [
  { id: 'user-1', nome: 'Ricardo Silva', email: 'ricardo.silva@sistema.com.br', perfil: 'Administrador', unidade: 'Matriz - SP', ultimoAcesso: '15/07/2026 14:30', ativo: true },
  { id: 'user-2', nome: 'Ana Martins', email: 'ana.martins@sistema.com.br', perfil: 'Operação', unidade: 'Central SP', ultimoAcesso: '15/07/2026 13:15', ativo: true },
  { id: 'user-3', nome: 'João Paulo', email: 'joao.paulo@sistema.com.br', perfil: 'Operação', unidade: 'Central SP', ultimoAcesso: '14/07/2026 18:00', ativo: true },
  { id: 'user-4', nome: 'Fernanda Lima', email: 'fernanda.lima@sistema.com.br', perfil: 'Operação', unidade: 'Central SP', ultimoAcesso: '15/07/2026 11:20', ativo: true },
  { id: 'user-5', nome: 'Rafael Santos', email: 'rafael.santos@sistema.com.br', perfil: 'Motoboy', unidade: 'Zona Sul - SP', ultimoAcesso: '15/07/2026 14:10', ativo: true },
  { id: 'user-6', nome: 'Bruno Oliveira', email: 'bruno.oliveira@sistema.com.br', perfil: 'Motoboy', unidade: 'Centro - SP', ultimoAcesso: '15/07/2026 12:05', ativo: true },
  { id: 'user-7', nome: 'Lucas Ferreira', email: 'lucas.ferreira@sistema.com.br', perfil: 'Motoboy', unidade: 'Zona Leste - SP', ultimoAcesso: '14/07/2026 16:45', ativo: true },
];

const initialClientes: Cliente[] = clientesMock.map((c, i) => ({
  ...c,
  contato: i === 0 ? 'Mariana Costa' : i === 1 ? 'Roberto Souza' : 'Ana Carolina',
  contratosAtivos: i % 2 === 0 ? 2 : 1,
  malotesNoMes: (i + 1) * 12,
  status: 'Ativo' as const,
  camposObrigatorios: {
    nome: true,
    cpf: true,
    endereco: true,
    cep: true,
    telefone: i % 2 === 0,
    tipoItem: true,
  }
}));

const initialState: MaloteState = {
  clientes: initialClientes,
  malotes: malotesMock,
  entregas: entregasMock,
  motoboys: motoboysMock,
  pendencias: pendenciasMock,
  auditoria: auditoriaMock.map(a => ({ ...a, origem: 'Sistema' })),
  filtros: initialFiltros,
  notificacoesCount: 3,
  perfil: 'Administrador',
  demoStep: 0,
  demoState: {},
  configuracoes: initialConfig,
  usuarios: initialUsuarios,
};

// Deep clone of the absolute initial state to support demo restarts
const clonedInitialState = JSON.parse(JSON.stringify(initialState));

export const TRANSICOES_PERMITIDAS: Record<StatusEntrega, Record<string, StatusEntrega>> = {
  'Aguardando revisão': {
    'CONCLUIR_REVISAO': 'Validada',
    'SINALIZAR_INCONSISTENCIA': 'Com inconsistência',
  },
  'Com inconsistência': {
    'CORRIGIR_INCONSISTENCIA': 'Validada',
  },
  'Validada': {
    'LIBERAR_MALOTE': 'Aguardando distribuição',
  },
  'Aguardando distribuição': {
    'ATRIBUIR_MOTOBOY': 'Atribuída',
  },
  'Atribuída': {
    'DESPACHAR': 'Em rota',
  },
  'Em rota': {
    'ENTREGAR_SUCESSO': 'Entregue',
    'REGISTRAR_OCORRENCIA': 'Tentativa sem sucesso',
  },
  'Tentativa sem sucesso': {
    'ANALISE_AUTOMATICA': 'Em análise de pendência',
  },
  'Em análise de pendência': {
    'LIBERAR_NOVA_TENTATIVA': 'Aguardando nova tentativa',
    'DEVOLUCAO_DEFINITIVA': 'Devolução definitiva',
    'CANCELAR': 'Cancelada',
  },
  'Aguardando nova tentativa': {
    'VOLTAR_DISTRIBUICAO': 'Aguardando distribuição',
  },
  'Entregue': {},
  'Devolução definitiva': {},
  'Cancelada': {},
};

export function recalcularMalote(malote: Malote, entregasDoMalote: Entrega[]): Malote {
  if (entregasDoMalote.length === 0) return malote;

  const total = entregasDoMalote.length;
  const entregues = entregasDoMalote.filter(e => e.status === 'Entregue').length;
  const emRota = entregasDoMalote.filter(e => e.status === 'Em rota').length;
  const pendentes = entregasDoMalote.filter(e => ['Com inconsistência', 'Tentativa sem sucesso', 'Em análise de pendência', 'Aguardando nova tentativa'].includes(e.status)).length;
  const devolvidos = entregasDoMalote.filter(e => e.status === 'Devolução definitiva').length;
  const canceladas = entregasDoMalote.filter(e => e.status === 'Cancelada').length;
  const validadas = entregasDoMalote.filter(e => e.status === 'Validada').length;
  const aguardandoRevisao = entregasDoMalote.filter(e => e.status === 'Aguardando revisão').length;
  const aguardandoDist = entregasDoMalote.filter(e => e.status === 'Aguardando distribuição').length;
  const atribuidas = entregasDoMalote.filter(e => e.status === 'Atribuída').length;

  const totalFinais = entregues + devolvidos + canceladas;

  let novoStatus: StatusMalote = malote.status;

  if (totalFinais === total) {
    if (devolvidos > 0 || canceladas > 0) {
      novoStatus = 'Concluído com devoluções';
    } else {
      novoStatus = 'Concluído';
    }
  } else if (totalFinais > 0) {
    novoStatus = 'Parcialmente concluído';
  } else if (emRota > 0 || atribuidas > 0 || aguardandoDist > 0) {
    novoStatus = 'Em distribuição';
  } else if (validadas === total) {
    novoStatus = 'Pronto para distribuição';
  } else if (aguardandoRevisao === total) {
    novoStatus = 'Recebido';
  } else if (pendentes > 0) {
    novoStatus = 'Em cadastramento';
  }

  return {
    ...malote,
    status: novoStatus,
  };
}

export function executarTransicaoEstado(state: MaloteState, entregaId: string, evento: string, extra?: any): MaloteState {
  const entrega = state.entregas.find(e => e.id === entregaId);
  if (!entrega) {
    console.error(`Erro: Entrega com ID ${entregaId} não encontrada.`);
    throw new Error(`Erro: Entrega com ID ${entregaId} não encontrada.`);
  }

  const statusAtual = entrega.status;
  const transicoesDoStatus = TRANSICOES_PERMITIDAS[statusAtual];
  
  if (!transicoesDoStatus || !transicoesDoStatus[evento]) {
    const msgErro = `Transição inválida: Não é permitido o evento "${evento}" a partir do status "${statusAtual}" para a entrega ${entregaId}.`;
    console.error(msgErro);
    throw new Error(msgErro);
  }

  const novoStatus = transicoesDoStatus[evento];

  // Guards / Invariants
  // RN-009: tentativaAtual nunca passa de 3. A 4ª é bloqueada.
  if (evento === 'LIBERAR_NOVA_TENTATIVA' && entrega.tentativaAtual >= 3) {
    const msgErro = `Transição bloqueada (RN-009): Entrega ${entregaId} já atingiu o limite máximo de 3 tentativas.`;
    console.error(msgErro);
    throw new Error(msgErro);
  }

  // RN-011: correção de endereço/contato preserva os valores originais em campos separados.
  let enderecoOriginal = entrega.enderecoOriginal;
  let telefoneOriginal = entrega.telefoneOriginal;
  let novoEndereco = { ...entrega.endereco };
  let novoTelefone = entrega.telefone;

  if (extra?.endereco) {
    if (!enderecoOriginal) {
      enderecoOriginal = { ...entrega.endereco };
    }
    novoEndereco = { ...extra.endereco };
  }
  if (extra?.telefone) {
    if (!telefoneOriginal) {
      telefoneOriginal = entrega.telefone;
    }
    novoTelefone = extra.telefone;
  }

  // Handle attempt increment
  let novaTentativaAtual = entrega.tentativaAtual;
  if (evento === 'LIBERAR_NOVA_TENTATIVA') {
    novaTentativaAtual = entrega.tentativaAtual + 1;
  }

  // Description for history
  let descricaoHistorico = `Transição de status para ${novoStatus}`;
  if (evento === 'CONCLUIR_REVISAO') {
    descricaoHistorico = 'Revisão do OCR concluída e dados validados';
  } else if (evento === 'SINALIZAR_INCONSISTENCIA') {
    descricaoHistorico = `Campo obrigatório ausente: ${extra?.motivo || 'dados inconsistentes'}`;
  } else if (evento === 'CORRIGIR_INCONSISTENCIA') {
    descricaoHistorico = 'Correção salva e dados validados';
  } else if (evento === 'LIBERAR_MALOTE') {
    descricaoHistorico = 'Liberação do malote para distribuição';
  } else if (evento === 'ATRIBUIR_MOTOBOY') {
    descricaoHistorico = `Atribuído ao entregador ${extra?.motoboyNome || 'Motoboy'}`;
  } else if (evento === 'DESPACHAR') {
    descricaoHistorico = `Despachado em rota com o entregador ${extra?.motoboyNome || 'Motoboy'}`;
  } else if (evento === 'ENTREGAR_SUCESSO') {
    descricaoHistorico = 'Entrega concluída com sucesso';
  } else if (evento === 'REGISTRAR_OCORRENCIA') {
    descricaoHistorico = `Tentativa sem sucesso: ${extra?.motivo || 'Ocorrência registrada'}`;
  } else if (evento === 'ANALISE_AUTOMATICA') {
    descricaoHistorico = `Análise de pendência iniciada automaticamente (RF-035): ${extra?.motivo || 'Ocorrência registrada'}`;
  } else if (evento === 'LIBERAR_NOVA_TENTATIVA') {
    descricaoHistorico = `Análise de pendência concluída: liberado para nova tentativa (Tentativa ${novaTentativaAtual})`;
  } else if (evento === 'DEVOLUCAO_DEFINITIVA') {
    descricaoHistorico = `Análise de pendência concluída: devolução definitiva efetuada (após 3ª tentativa, RN-010)`;
  } else if (evento === 'CANCELAR') {
    descricaoHistorico = 'Entrega cancelada pelo analista';
  } else if (evento === 'VOLTAR_DISTRIBUICAO') {
    descricaoHistorico = 'Retornado para a fila de distribuição';
  }

  // Build updated delivery
  const updatedEntrega: Entrega = {
    ...entrega,
    status: novoStatus,
    endereco: novoEndereco,
    telefone: novoTelefone,
    enderecoOriginal,
    telefoneOriginal,
    tentativaAtual: novaTentativaAtual,
    motoboyId: extra?.motoboyId !== undefined ? extra.motoboyId : entrega.motoboyId,
    historico: [
      ...entrega.historico,
      {
        status: novoStatus,
        dataHora: new Date().toLocaleString('pt-BR'),
        descricao: descricaoHistorico,
        responsavel: extra?.usuario || 'Ricardo Silva',
      }
    ],
  };

  if (extra?.tentativa) {
    updatedEntrega.tentativas = [...(entrega.tentativas || []), extra.tentativa];
  }

  // Unassign motoboy if going back to distribution
  if (evento === 'LIBERAR_NOVA_TENTATIVA' || evento === 'VOLTAR_DISTRIBUICAO') {
    updatedEntrega.motoboyId = undefined;
  }

  // 1. Update the deliveries list
  const updatedEntregas = state.entregas.map(e => e.id === entregaId ? updatedEntrega : e);

  // 5. Entrar ou sair da fila de pendências conforme o caso.
  let updatedPendencias = [...state.pendencias];
  const statusesPendencia: StatusEntrega[] = ['Com inconsistência', 'Tentativa sem sucesso', 'Em análise de pendência'];

  if (statusesPendencia.includes(novoStatus)) {
    const pendenciaExistente = updatedPendencias.find(p => p.entregaId === entregaId && !p.desfecho);
    if (!pendenciaExistente) {
      updatedPendencias.push({
        id: `PEND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        entregaId,
        motivo: extra?.motivo || `Pendência gerada no status: ${novoStatus}`,
        abertaEm: new Date().toLocaleString('pt-BR'),
        responsavel: extra?.usuario || 'Ricardo Silva',
        providencias: [extra?.providencia || `Entrada automática no fluxo de pendências: ${novoStatus}`],
      });
    }
  } else {
    // Sair da fila de pendências (resolver pendência aberta)
    updatedPendencias = updatedPendencias.map(p => {
      if (p.entregaId === entregaId && !p.desfecho) {
        return {
          ...p,
          desfecho: novoStatus,
          providencias: [...p.providencias, extra?.providencia || `Saída automática para status ${novoStatus}`],
        };
      }
      return p;
    });
  }

  // 4. Gravar EventoAuditoria
  const novoEventoAuditoria: EventoAuditoria = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    usuario: extra?.usuario || 'Ricardo Silva',
    acao: evento,
    entidade: `Entrega ${entregaId}`,
    dataHora: new Date().toLocaleString('pt-BR'),
    valorAnterior: statusAtual,
    valorNovo: novoStatus,
  };
  const updatedAuditoria = [novoEventoAuditoria, ...state.auditoria];

  // 1 (part 2). Recalcular os contadores do malote e o status derivado do malote
  const maloteId = entrega.maloteId;
  const entregasDoMalote = updatedEntregas.filter(e => e.maloteId === maloteId);
  const updatedMalotes = state.malotes.map(m => {
    if (m.id === maloteId) {
      const updatedM = recalcularMalote(m, entregasDoMalote);
      
      // RN-017 guard
      if (['Concluído', 'Concluído com devoluções'].includes(updatedM.status)) {
        const todasFinais = entregasDoMalote.every(e => ['Entregue', 'Devolução definitiva', 'Cancelada'].includes(e.status));
        if (!todasFinais) {
          const msgErro = `Bloqueio RN-017: O malote ${maloteId} não pode ser encerrado/concluído porque há entregas que não estão em estado final.`;
          console.error(msgErro);
          throw new Error(msgErro);
        }
      }
      return updatedM;
    }
    return m;
  });

  let nextState: MaloteState = {
    ...state,
    entregas: updatedEntregas,
    pendencias: updatedPendencias,
    auditoria: updatedAuditoria,
    malotes: updatedMalotes,
  };

  // Handle Automatic Transitions:
  // - Tentativa sem sucesso -> Em análise de pendência
  if (novoStatus === 'Tentativa sem sucesso') {
    nextState = executarTransicaoEstado(nextState, entregaId, 'ANALISE_AUTOMATICA', {
      motivo: extra?.motivo || 'Tentativa sem sucesso',
      providencia: 'Encaminhado automaticamente para análise de pendência (RF-035).',
      usuario: extra?.usuario,
    });
  }
  // - Aguardando nova tentativa -> Aguardando distribuição
  else if (novoStatus === 'Aguardando nova tentativa') {
    nextState = executarTransicaoEstado(nextState, entregaId, 'VOLTAR_DISTRIBUICAO', {
      providencia: 'Retornado automaticamente para a fila de distribuição.',
      usuario: extra?.usuario,
    });
  }

  return nextState;
}

export type MaloteAction =
  | { type: 'ADICIONAR_MALOTE'; payload: Malote }
  | { type: 'ATUALIZAR_STATUS_MALOTE'; payload: { id: string; status: StatusMalote } }
  | { type: 'ADICIONAR_ENTREGA'; payload: Entrega }
  | { type: 'ATUALIZAR_STATUS_ENTREGA'; payload: { id: string; status: StatusEntrega } }
  | { type: 'ATRIBUIR_MOTOBOY'; payload: { entregaIds: string[]; motoboyId: string } }
  | { type: 'DESPACHAR_ENTREGAS'; payload: { entregaIds: string[]; motoboyId: string } }
  | { type: 'REGISTRAR_TENTATIVA'; payload: { entregaId: string; tentativa: Tentativa } }
  | { type: 'RESOLVER_PENDENCIA'; payload: { pendenciaId: string; desfecho: string } }
  | { type: 'DEFINIR_FILTROS'; payload: Partial<FiltrosState> }
  | { type: 'LIMPAR_FILTROS' }
  | { type: 'INCREMENTAR_NOTIFICACOES' }
  | { type: 'LIMPAR_NOTIFICACOES' }
  | { type: 'TRANSICIONAR_ENTREGA'; payload: { entregaId: string; evento: string; extra?: any } }
  | {
      type: 'REGISTRAR_AUDITORIA';
      payload: { acao: string; entidade: string; valorAnterior?: string; valorNovo?: string; usuario?: string };
    }
  | {
      type: 'RESOLVER_ANALISE_PENDENCIA';
      payload: {
        entregaId: string;
        novoStatus: StatusEntrega;
        incrementarTentativa: boolean;
        enderecoCorrigido?: Endereco;
        telefoneCorrigido?: string;
        providencias: string;
        auditorias: { acao: string; entidade: string; valorAnterior?: string; valorNovo?: string }[];
      };
    }
  | { type: 'ALTERAR_STATUS_MOTOBOY'; payload: { motoboyId: string; status: 'Disponível' | 'Em rota' | 'Indisponível' } }
  | { type: 'REATRIBUIR_ENTREGAS'; payload: { entregaIds: string[]; deMotoboyId: string; paraMotoboyId: string; motivo: string; usuario: string } }
  | { type: 'CANCELAR_ENTREGAS'; payload: { entregaIds: string[]; motivo: string; usuario: string } }
  | { type: 'LIBERAR_ENTREGAS'; payload: { entregaIds: string[]; usuario: string } }
  | { type: 'SET_PERFIL'; payload: 'Administrador' | 'Operação' | 'Motoboy' | 'Financeiro' | 'Contratante' }
  | { type: 'PREPARAR_PASSO_DEMO'; payload: number }
  | { type: 'REINICIAR_DEMONSTRACAO' }
  | { type: 'SALVAR_CONFIGURACOES'; payload: ConfigState }
  | { type: 'ATUALIZAR_USUARIOS'; payload: UsuarioSistema[] }
  | { type: 'ATUALIZAR_CLIENTES'; payload: Cliente[] };

export function maloteReducer(state: MaloteState, action: MaloteAction): MaloteState {
  switch (action.type) {
    case 'ADICIONAR_MALOTE':
      return {
        ...state,
        malotes: [action.payload, ...state.malotes],
        auditoria: [
          {
            id: `AUD-${Date.now()}`,
            usuario: 'Ricardo Silva',
            acao: 'Criação',
            entidade: 'Malote',
            dataHora: new Date().toLocaleString('pt-BR'),
            valorNovo: `Malote ${action.payload.codigo} criado para clienteId ${action.payload.clienteId}`
          },
          ...state.auditoria
         ]
      };
    case 'ATUALIZAR_STATUS_MALOTE': {
      // RN-017 guard
      const maloteId = action.payload.id;
      const novoStatus = action.payload.status;
      const entregasDoMalote = state.entregas.filter(e => e.maloteId === maloteId);
      
      if (['Concluído', 'Concluído com devoluções'].includes(novoStatus)) {
        const todasFinais = entregasDoMalote.every(e => ['Entregue', 'Devolução definitiva', 'Cancelada'].includes(e.status));
        if (!todasFinais) {
          const msgErro = `Bloqueio RN-017: O malote ${maloteId} não pode ser encerrado/concluído porque há entregas que não estão em estado final.`;
          console.error(msgErro);
          throw new Error(msgErro);
        }
      }
      return {
        ...state,
        malotes: state.malotes.map((m) =>
          m.id === action.payload.id ? { ...m, status: action.payload.status } : m
        ),
        auditoria: [
          {
            id: `AUD-${Date.now()}`,
            usuario: 'Ricardo Silva',
            acao: 'Alteração de Status',
            entidade: 'Malote',
            dataHora: new Date().toLocaleString('pt-BR'),
            valorNovo: `Status do malote ${action.payload.id} alterado para ${action.payload.status}`
          },
          ...state.auditoria
        ]
      };
    }
    case 'ADICIONAR_ENTREGA':
      return {
        ...state,
        entregas: [action.payload, ...state.entregas],
      };
    case 'ATUALIZAR_STATUS_ENTREGA': {
      const { id, status } = action.payload;
      const entrega = state.entregas.find(e => e.id === id);
      if (!entrega) return state;

      let evento: string | null = null;
      if (entrega.status === 'Aguardando revisão') {
        if (status === 'Validada') evento = 'CONCLUIR_REVISAO';
        else if (status === 'Com inconsistência') evento = 'SINALIZAR_INCONSISTENCIA';
      } else if (entrega.status === 'Com inconsistência') {
        if (status === 'Validada') evento = 'CORRIGIR_INCONSISTENCIA';
      } else if (entrega.status === 'Validada') {
        if (status === 'Aguardando distribuição') evento = 'LIBERAR_MALOTE';
      } else if (entrega.status === 'Aguardando distribuição') {
        if (status === 'Atribuída') evento = 'ATRIBUIR_MOTOBOY';
      } else if (entrega.status === 'Atribuída') {
        if (status === 'Em rota') evento = 'DESPACHAR';
      } else if (entrega.status === 'Em rota') {
        if (status === 'Entregue') evento = 'ENTREGAR_SUCESSO';
        else if (status === 'Tentativa sem sucesso') evento = 'REGISTRAR_OCORRENCIA';
      } else if (entrega.status === 'Tentativa sem sucesso') {
        if (status === 'Em análise de pendência') evento = 'ANALISE_AUTOMATICA';
      } else if (entrega.status === 'Em análise de pendência') {
        if (status === 'Aguardando nova tentativa') evento = 'LIBERAR_NOVA_TENTATIVA';
        else if (status === 'Devolução definitiva') evento = 'DEVOLUCAO_DEFINITIVA';
        else if (status === 'Cancelada') evento = 'CANCELAR';
      } else if (entrega.status === 'Aguardando nova tentativa') {
        if (status === 'Aguardando distribuição') evento = 'VOLTAR_DISTRIBUICAO';
      }

      if (!evento) {
        const msg = `Status de destino "${status}" inválido ou não permitido a partir de "${entrega.status}".`;
        console.error(msg);
        throw new Error(msg);
      }

      return executarTransicaoEstado(state, id, evento, { usuario: 'Ricardo Silva' });
    }
    case 'ATRIBUIR_MOTOBOY': {
      const { entregaIds, motoboyId } = action.payload;
      const motoboy = state.motoboys.find((m) => m.id === motoboyId);
      const motoboyNome = motoboy ? motoboy.nome : 'Desconhecido';

      let tempState = state;
      for (const entregaId of entregaIds) {
        const entrega = tempState.entregas.find(e => e.id === entregaId);
        if (!entrega) continue;

        if (entrega.status === 'Validada') {
          tempState = executarTransicaoEstado(tempState, entregaId, 'LIBERAR_MALOTE', { usuario: 'Ricardo Silva' });
        }

        tempState = executarTransicaoEstado(tempState, entregaId, 'ATRIBUIR_MOTOBOY', {
          motoboyId,
          motoboyNome,
          usuario: 'Ricardo Silva',
        });
      }

      const updatedMotoboys = tempState.motoboys.map((m) => {
        if (m.id === motoboyId) {
          return {
            ...m,
            entregasHoje: m.entregasHoje + entregaIds.length,
          };
        }
        return m;
      });

      return {
        ...tempState,
        motoboys: updatedMotoboys,
      };
    }
    case 'DESPACHAR_ENTREGAS': {
      const { entregaIds, motoboyId } = action.payload;
      const motoboy = state.motoboys.find((m) => m.id === motoboyId);
      const motoboyNome = motoboy ? motoboy.nome : 'Desconhecido';

      let tempState = state;
      for (const entregaId of entregaIds) {
        tempState = executarTransicaoEstado(tempState, entregaId, 'DESPACHAR', {
          motoboyId,
          motoboyNome,
          usuario: 'Ricardo Silva',
        });
      }

      const updatedMotoboys = tempState.motoboys.map((m) => {
        if (m.id === motoboyId) {
          return {
            ...m,
            entregasHoje: m.entregasHoje + entregaIds.length,
            status: 'Em rota' as 'Disponível' | 'Em rota' | 'Indisponível',
          };
        }
        return m;
      });

      return {
        ...tempState,
        motoboys: updatedMotoboys,
      };
    }
    case 'REGISTRAR_TENTATIVA': {
      const { entregaId, tentativa } = action.payload;
      const entrega = state.entregas.find((e) => e.id === entregaId);
      if (!entrega) return state;

      let tempState = state;
      if (tentativa.resultado === 'Sucesso') {
        tempState = executarTransicaoEstado(tempState, entregaId, 'ENTREGAR_SUCESSO', {
          tentativa,
          usuario: 'Ricardo Silva',
        });
      } else {
        tempState = executarTransicaoEstado(tempState, entregaId, 'REGISTRAR_OCORRENCIA', {
          tentativa,
          motivo: tentativa.motivo || 'Tentativa sem sucesso',
          providencia: tentativa.observacao || 'Registrada tentativa malsucedida.',
          usuario: 'Ricardo Silva',
        });
      }

      return tempState;
    }
    case 'RESOLVER_PENDENCIA': {
      const { pendenciaId, desfecho } = action.payload;
      const pendencia = state.pendencias.find((p) => p.id === pendenciaId);
      if (!pendencia) return state;

      const updatedPendencias = state.pendencias.map((p) =>
        p.id === pendenciaId ? { ...p, desfecho, providencias: [...p.providencias, `Desfecho: ${desfecho}`] } : p
      );

      return {
        ...state,
        pendencias: updatedPendencias,
        auditoria: [
          {
            id: `AUD-${Date.now()}`,
            usuario: 'Ricardo Silva',
            acao: 'Resolução de Pendência',
            entidade: 'Pendência',
            dataHora: new Date().toLocaleString('pt-BR'),
            valorNovo: `Pendência ${pendenciaId} resolvida: ${desfecho}`,
          },
          ...state.auditoria,
        ],
      };
    }
    case 'RESOLVER_ANALISE_PENDENCIA': {
      const {
        entregaId,
        novoStatus,
        enderecoCorrigido,
        telefoneCorrigido,
        providencias,
      } = action.payload;

      let evento: string = '';
      if (novoStatus === 'Aguardando nova tentativa' || novoStatus === 'Aguardando distribuição') {
        evento = 'LIBERAR_NOVA_TENTATIVA';
      } else if (novoStatus === 'Devolução definitiva') {
        evento = 'DEVOLUCAO_DEFINITIVA';
      } else if (novoStatus === 'Cancelada') {
        evento = 'CANCELAR';
      } else {
        const msg = `Status de destino "${novoStatus}" inválido na resolução de pendência.`;
        console.error(msg);
        throw new Error(msg);
      }

      return executarTransicaoEstado(state, entregaId, evento, {
        endereco: enderecoCorrigido,
        telefone: telefoneCorrigido,
        motivo: providencias,
        providencia: providencias,
        usuario: 'Ricardo Silva',
      });
    }
    case 'TRANSICIONAR_ENTREGA': {
      const { entregaId, evento, extra } = action.payload;
      return executarTransicaoEstado(state, entregaId, evento, extra);
    }
    case 'REGISTRAR_AUDITORIA': {
      const novaAuditoria: EventoAuditoria = {
        id: `AUD-${Date.now()}`,
        usuario: action.payload.usuario || 'Ricardo Silva',
        acao: action.payload.acao,
        entidade: action.payload.entidade,
        dataHora: new Date().toLocaleString('pt-BR'),
        valorAnterior: action.payload.valorAnterior,
        valorNovo: action.payload.valorNovo,
      };
      return {
        ...state,
        auditoria: [novaAuditoria, ...state.auditoria],
      };
    }
    case 'DEFINIR_FILTROS':
      return {
        ...state,
        filtros: {
          ...state.filtros,
          ...action.payload,
        },
      };
    case 'LIMPAR_FILTROS':
      return {
        ...state,
        filtros: initialFiltros,
      };
    case 'INCREMENTAR_NOTIFICACOES':
      return {
        ...state,
        notificacoesCount: state.notificacoesCount + 1,
      };
    case 'LIMPAR_NOTIFICACOES':
      return {
        ...state,
        notificacoesCount: 0,
      };
    case 'ALTERAR_STATUS_MOTOBOY': {
      const { motoboyId, status } = action.payload;
      const updatedMotoboys = state.motoboys.map((m) => {
        if (m.id === motoboyId) {
          return { ...m, status };
        }
        return m;
      });
      return {
        ...state,
        motoboys: updatedMotoboys,
      };
    }
    case 'REATRIBUIR_ENTREGAS': {
      const { entregaIds, deMotoboyId, paraMotoboyId, motivo, usuario } = action.payload;
      const deMotoboy = state.motoboys.find(m => m.id === deMotoboyId);
      const paraMotoboy = state.motoboys.find(m => m.id === paraMotoboyId);

      const updatedEntregas = state.entregas.map((e) => {
        if (entregaIds.includes(e.id)) {
          const novoHistorico = [
            ...e.historico,
            {
              status: e.status,
              dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              descricao: `Reatribuído do motoboy ${deMotoboy ? deMotoboy.nome : deMotoboyId} para ${paraMotoboy ? paraMotoboy.nome : paraMotoboyId}. Motivo: ${motivo}`,
              responsavel: usuario || 'Ricardo Silva'
            }
          ];
          return {
            ...e,
            motoboyId: paraMotoboyId,
            historico: novoHistorico
          };
        }
        return e;
      });

      const updatedMotoboys = state.motoboys.map((m) => {
        if (m.id === deMotoboyId) {
          return {
            ...m,
            entregasHoje: Math.max(0, m.entregasHoje - entregaIds.length)
          };
        }
        if (m.id === paraMotoboyId) {
          return {
            ...m,
            entregasHoje: m.entregasHoje + entregaIds.length
          };
        }
        return m;
      });

      const auditEvent = {
        id: `AUD-${Date.now()}`,
        usuario: usuario || 'Ricardo Silva',
        acao: 'Reatribuição',
        entidade: 'Entrega',
        dataHora: new Date().toLocaleString('pt-BR'),
        valorAnterior: `Motoboy ${deMotoboy ? deMotoboy.nome : deMotoboyId} (${entregaIds.length} entregas)`,
        valorNovo: `Motoboy ${paraMotoboy ? paraMotoboy.nome : paraMotoboyId} - Motivo: ${motivo}`,
      };

      return {
        ...state,
        entregas: updatedEntregas,
        motoboys: updatedMotoboys,
        auditoria: [auditEvent, ...state.auditoria]
      };
    }
    case 'CANCELAR_ENTREGAS': {
      const { entregaIds, motivo, usuario } = action.payload;
      const updatedEntregas = state.entregas.map((e) => {
        if (entregaIds.includes(e.id)) {
          const novoHistorico = [
            ...e.historico,
            {
              status: 'Cancelada' as StatusEntrega,
              dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              descricao: `Entrega cancelada pelo analista. Motivo: ${motivo}`,
              responsavel: usuario || 'Ricardo Silva'
            }
          ];
          return {
            ...e,
            status: 'Cancelada' as StatusEntrega,
            historico: novoHistorico
          };
        }
        return e;
      });

      const auditEvent = {
        id: `AUD-${Date.now()}`,
        usuario: usuario || 'Ricardo Silva',
        acao: 'Cancelamento em lote',
        entidade: 'Entrega',
        dataHora: new Date().toLocaleString('pt-BR'),
        valorAnterior: `${entregaIds.length} entregas selecionadas`,
        valorNovo: `Status: Cancelada — Motivo: ${motivo}`,
      };

      return {
        ...state,
        entregas: updatedEntregas,
        auditoria: [auditEvent, ...state.auditoria]
      };
    }
    case 'LIBERAR_ENTREGAS': {
      const { entregaIds, usuario } = action.payload;
      let tempState = state;
      for (const id of entregaIds) {
        const entrega = tempState.entregas.find(e => e.id === id);
        if (entrega && entrega.status === 'Validada') {
          try {
            tempState = executarTransicaoEstado(tempState, id, 'LIBERAR_MALOTE', { usuario });
          } catch (e) {
            console.error(e);
          }
        }
      }
      return tempState;
    }
    case 'SET_PERFIL':
      return {
        ...state,
        perfil: action.payload,
      };
    case 'REINICIAR_DEMONSTRACAO': {
      // Clear localStorage demo variables to avoid cache interference
      localStorage.removeItem("motoboy_entregas_list");
      localStorage.removeItem("malote_faturamento_ajustes");
      localStorage.removeItem("malote_faturamento_situacoes");
      localStorage.removeItem("malote_faturamento_regras");
      
      // Return pristine deep clone of clonedInitialState
      return JSON.parse(JSON.stringify(clonedInitialState));
    }
    case 'PREPARAR_PASSO_DEMO': {
      const step = action.payload;
      let updatedEntregas = [...state.entregas];
      let updatedPendencias = [...state.pendencias];
      let updatedMalotes = [...state.malotes];
      let updatedPerfil = state.perfil;
      let updatedDemoState = { ...state.demoState };

      // Helper to ensure ITM-DEMO-001 exists in state.entregas
      const assegurarDemoEntrega = (status: StatusEntrega = 'Validada', extraFields = {}) => {
        const index = updatedEntregas.findIndex(e => e.id === 'ITM-DEMO-001');
        const demoItem: Entrega = {
          id: 'ITM-DEMO-001',
          codigo: 'ITM-0526-9999',
          maloteId: 'MAL-128',
          beneficiario: {
            nome: 'Carlos Eduardo da Silva',
            cpf: '123.456.789-00',
            dataNascimento: '15/08/1987',
          },
          endereco: {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP',
          },
          telefone: '(11) 98765-4321',
          tipoItem: 'Cartão',
          prioridade: 'Média',
          tentativaAtual: 0,
          status,
          codigoRastreio: 'MLTBR9876543210',
          valorCorrida: 15.00,
          historico: [
            {
              status: 'Aguardando revisão',
              dataHora: '26/05/2025 08:30',
              descricao: 'Item importado do lote do Hospital São Lucas.',
              responsavel: 'Hospital São Lucas API',
            },
          ],
          ...extraFields,
        };

        if (index >= 0) {
          updatedEntregas[index] = { ...updatedEntregas[index], status, ...extraFields };
        } else {
          updatedEntregas.unshift(demoItem);
        }
      };

      if (step === 1) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };
      } else if (step === 2) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: true,
          ocrRevisaoStep: false,
        };
      } else if (step === 3) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: true,
        };
      } else if (step === 4) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };
        assegurarDemoEntrega('Validada');
      } else if (step === 5) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };
        assegurarDemoEntrega('Aguardando distribuição');
      } else if (step === 6) {
        updatedPerfil = 'Motoboy';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };
        assegurarDemoEntrega('Em rota', { motoboyId: 'moto-1' });

        // Update localStorage so MinhasEntregas.tsx can sync
        const demoMobileItem = {
          id: "ITM-DEMO-001",
          local: "Hospital São Lucas",
          tipo: "cartões",
          qtd: 120,
          endereco: "Avenida Paulista, 1000 – Bela Vista, São Paulo – SP",
          horario: "14:15",
          status: "Em rota",
          tipoItem: "Cartão",
          tentativas: 0
        };
        localStorage.setItem("motoboy_entregas_list", JSON.stringify([demoMobileItem]));
      } else if (step === 7) {
        updatedPerfil = 'Motoboy';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
          preFillRegistrarTentativa: true,
        };
        assegurarDemoEntrega('Em rota', { motoboyId: 'moto-1' });
        
        const demoMobileItem = {
          id: "ITM-DEMO-001",
          local: "Hospital São Lucas",
          tipo: "cartões",
          qtd: 120,
          endereco: "Avenida Paulista, 1000 – Bela Vista, São Paulo – SP",
          horario: "14:15",
          status: "Em rota",
          tipoItem: "Cartão",
          tentativas: 0
        };
        localStorage.setItem("motoboy_entregas_list", JSON.stringify([demoMobileItem]));
      } else if (step === 8) {
        updatedPerfil = 'Operação';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
          preFillPendencia: true,
        };

        const failedAttempts = [
          {
            numero: 1,
            dataHora: '26/05/2025 15:30',
            motoboyId: 'moto-1',
            resultado: 'Insucesso' as const,
            motivo: 'Cliente ausente',
            observacao: 'Campainha tocada por 10min, portão fechado.',
            fotoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600&h=450',
          }
        ];

        assegurarDemoEntrega('Em análise de pendência', {
          tentativas: failedAttempts,
          tentativaAtual: 1,
          historico: [
            { status: 'Aguardando revisão', dataHora: '26/05/2025 08:30', descricao: 'Item importado do lote do Hospital São Lucas.' },
            { status: 'Validada', dataHora: '26/05/2025 08:45', descricao: 'Item verificado e validado.' },
            { status: 'Aguardando distribuição', dataHora: '26/05/2025 09:00', descricao: 'Disponível para atribuição.' },
            { status: 'Atribuída', dataHora: '26/05/2025 10:15', descricao: 'Item atribuído a Rafael Santos.' },
            { status: 'Em rota', dataHora: '26/05/2025 13:45', descricao: 'Item em rota com Rafael Santos.' },
            { status: 'Tentativa sem sucesso', dataHora: '26/05/2025 15:30', descricao: '1ª tentativa de entrega falhou: Cliente ausente.' },
            { status: 'Em análise de pendência', dataHora: '26/05/2025 15:31', descricao: 'Enviado para análise de pendências.' }
          ]
        });

        // Ensure there is a pendency in pendencias
        const pIndex = updatedPendencias.findIndex(p => p.entregaId === 'ITM-DEMO-001');
        if (pIndex < 0) {
          updatedPendencias.unshift({
            id: 'PEND-DEMO-001',
            entregaId: 'ITM-DEMO-001',
            motivo: 'Cliente ausente',
            abertaEm: '26/05/2025 15:31',
            responsavel: 'Rafael Santos',
            providencias: ['Ausente no local na 1ª tentativa. Foto anexada da fachada do condomínio.'],
          });
        }
      } else if (step === 9) {
        updatedPerfil = 'Administrador';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };

        const failedAttempts = [
          {
            numero: 1,
            dataHora: '26/05/2025 15:30',
            motoboyId: 'moto-1',
            resultado: 'Insucesso' as const,
            motivo: 'Cliente ausente',
            observacao: 'Campainha tocada por 10min, portão fechado.',
            fotoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600&h=450',
          }
        ];

        assegurarDemoEntrega('Entregue', {
          tentativas: failedAttempts,
          tentativaAtual: 2,
          endereco: {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            numero: '1000',
            complemento: 'Apto 42B', // Corrected complement!
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP',
          },
          historico: [
            { status: 'Aguardando revisão', dataHora: '26/05/2025 08:30', descricao: 'Item importado do lote do Hospital São Lucas.' },
            { status: 'Validada', dataHora: '26/05/2025 08:45', descricao: 'Item verificado e validado.' },
            { status: 'Aguardando distribuição', dataHora: '26/05/2025 09:00', descricao: 'Disponível para atribuição.' },
            { status: 'Atribuída', dataHora: '26/05/2025 10:15', descricao: 'Item atribuído a Rafael Santos.' },
            { status: 'Em rota', dataHora: '26/05/2025 13:45', descricao: 'Item em rota com Rafael Santos.' },
            { status: 'Tentativa sem sucesso', dataHora: '26/05/2025 15:30', descricao: '1ª tentativa de entrega falhou: Cliente ausente.' },
            { status: 'Em análise de pendência', dataHora: '26/05/2025 15:31', descricao: 'Enviado para análise de pendências.' },
            { status: 'Aguardando nova tentativa', dataHora: '26/05/2025 16:00', descricao: 'Endereço updated com complemento: Apto 42B.' },
            { status: 'Aguardando distribuição', dataHora: '26/05/2025 16:01', descricao: 'Retornado à fila de expedição.' },
            { status: 'Atribuída', dataHora: '26/05/2025 16:10', descricao: 'Reatribuído a Rafael Santos.' },
            { status: 'Em rota', dataHora: '26/05/2025 16:30', descricao: 'Item em rota com Rafael Santos (2ª tentativa).' },
            { status: 'Entregue', dataHora: '26/05/2025 17:15', descricao: 'Entrega concluída com sucesso na 2ª tentativa.' }
          ]
        });

        // Close pendency if it exists
        updatedPendencias = updatedPendencias.map(p => {
          if (p.entregaId === 'ITM-DEMO-001') {
            return { ...p, desfecho: 'Entregue', providencias: [...p.providencias, 'Endereço retificado com complemento e entregue.'] };
          }
          return p;
        });
      } else if (step === 10) {
        updatedPerfil = 'Financeiro';
        updatedDemoState = {
          preFillNovoMalote: false,
          ocrRevisaoStep: false,
        };

        // Ensure there is a pre-filled adjustment
        const demoAdjustment = {
          id: 'AJ-DEMO-001',
          entregaId: 'ITM-DEMO-001',
          entregaCodigo: 'ITM-0526-9999',
          clienteNome: 'Hospital São Lucas',
          valorOriginal: 15.00,
          valorNovo: 25.00,
          justificativa: 'Acréscimo de R$ 10,00 aprovado pelo contratante devido ao desvio de rota para retorno ao local após correção do endereço de entrega (Apto 42B).',
          quemLancou: 'Ricardo Silva',
          quemAprovou: 'Mariana Costa (Financeiro)',
          dataHora: '26/05/2025 17:45',
        };
        localStorage.setItem("malote_faturamento_ajustes", JSON.stringify([demoAdjustment]));
      }

      return {
        ...state,
        demoStep: step,
        perfil: updatedPerfil,
        demoState: updatedDemoState,
        entregas: updatedEntregas,
        pendencias: updatedPendencias,
        malotes: updatedMalotes,
      };
    }
    case 'SALVAR_CONFIGURACOES': {
      const auditLogs: EventoAuditoria[] = [];
      const prev = state.configuracoes;
      const next = action.payload;

      if (prev.tentativasMaximas !== next.tentativasMaximas) {
        auditLogs.push({
          id: `AUD-${Date.now()}-1`,
          usuario: 'Ricardo Silva',
          acao: 'Alterar Configuração',
          entidade: 'Parâmetros Gerais',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorAnterior: `Tentativas máximas: ${prev.tentativasMaximas}`,
          valorNovo: `Tentativas máximas: ${next.tentativasMaximas}`,
          origem: 'Configurações'
        });
      }
      if (prev.exigirFotoFachadaInsucesso !== next.exigirFotoFachadaInsucesso) {
        auditLogs.push({
          id: `AUD-${Date.now()}-2`,
          usuario: 'Ricardo Silva',
          acao: 'Alterar Configuração',
          entidade: 'Parâmetros Gerais',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorAnterior: `Exigir foto fachada: ${prev.exigirFotoFachadaInsucesso ? 'Ativo' : 'Inativo'}`,
          valorNovo: `Exigir foto fachada: ${next.exigirFotoFachadaInsucesso ? 'Ativo' : 'Inativo'}`,
          origem: 'Configurações'
        });
      }

      if (auditLogs.length === 0) {
        auditLogs.push({
          id: `AUD-${Date.now()}`,
          usuario: 'Ricardo Silva',
          acao: 'Salvar Configurações',
          entidade: 'Configurações Gerais',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorAnterior: 'Configurações anteriores',
          valorNovo: 'Alterações de parâmetros gerais salvas',
          origem: 'Configurações'
        });
      }

      return {
        ...state,
        configuracoes: next,
        auditoria: [...auditLogs, ...state.auditoria],
      };
    }
    case 'ATUALIZAR_USUARIOS': {
      const auditLogs: EventoAuditoria[] = [];
      const prev = state.usuarios;
      const next = action.payload;

      if (next.length > prev.length) {
        const addedUser = next[next.length - 1];
        auditLogs.push({
          id: `AUD-${Date.now()}`,
          usuario: 'Ricardo Silva',
          acao: 'Criar Usuário',
          entidade: 'Usuários',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorAnterior: undefined,
          valorNovo: `Criado usuário ${addedUser.nome} (${addedUser.perfil})`,
          origem: 'Configurações'
        });
      } else {
        for (const nextUser of next) {
          const prevUser = prev.find(u => u.id === nextUser.id);
          if (prevUser && prevUser.ativo !== nextUser.ativo) {
            auditLogs.push({
              id: `AUD-${Date.now()}`,
              usuario: 'Ricardo Silva',
              acao: nextUser.ativo ? 'Ativar Usuário' : 'Inativar Usuário',
              entidade: 'Usuários',
              dataHora: new Date().toLocaleString('pt-BR'),
              valorAnterior: prevUser.ativo ? 'Ativo' : 'Inativo',
              valorNovo: nextUser.ativo ? 'Ativo' : 'Inativo',
              origem: 'Configurações'
            });
          }
        }
      }

      if (auditLogs.length === 0) {
        auditLogs.push({
          id: `AUD-${Date.now()}`,
          usuario: 'Ricardo Silva',
          acao: 'Atualizar Usuários',
          entidade: 'Usuários',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorNovo: 'Lista de usuários atualizada',
          origem: 'Configurações'
        });
      }

      return {
        ...state,
        usuarios: next,
        auditoria: [...auditLogs, ...state.auditoria],
      };
    }
    case 'ATUALIZAR_CLIENTES': {
      const auditLogs: EventoAuditoria[] = [];
      const prev = state.clientes;
      const next = action.payload;

      if (next.length > prev.length) {
        const addedCli = next[next.length - 1];
        auditLogs.push({
          id: `AUD-${Date.now()}`,
          usuario: 'Ricardo Silva',
          acao: 'Criar Cliente',
          entidade: 'Clientes',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorNovo: `Cadastrado cliente ${addedCli.nome} (CNPJ: ${addedCli.cnpj})`,
          origem: 'Configurações'
        });
      } else {
        auditLogs.push({
          id: `AUD-${Date.now()}`,
          usuario: 'Ricardo Silva',
          acao: 'Atualizar Clientes',
          entidade: 'Clientes',
          dataHora: new Date().toLocaleString('pt-BR'),
          valorNovo: 'Lista de clientes / configurações obrigatórias salvas',
          origem: 'Configurações'
        });
      }

      return {
        ...state,
        clientes: next,
        auditoria: [...auditLogs, ...state.auditoria],
      };
    }
    default:
      return state;
  }
}

interface MaloteContextProps {
  state: MaloteState;
  dispatch: React.Dispatch<MaloteAction>;
  transicionar: (entregaId: string, evento: string, extra?: any) => void;
}

const MaloteContext = createContext<MaloteContextProps | undefined>(undefined);

export function MaloteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(maloteReducer, initialState);

  const transicionar = (entregaId: string, evento: string, extra?: any) => {
    dispatch({ type: 'TRANSICIONAR_ENTREGA', payload: { entregaId, evento, extra } });
  };

  return (
    <MaloteContext.Provider value={{ state, dispatch, transicionar }}>
      {children}
    </MaloteContext.Provider>
  );
}

export function useMalote() {
  const context = useContext(MaloteContext);
  if (!context) {
    throw new Error('useMalote deve ser utilizado dentro de um MaloteProvider');
  }
  return context;
}
