export interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  contato?: string;
  contratosAtivos?: number;
  malotesNoMes?: number;
  status?: 'Ativo' | 'Inativo';
  camposObrigatorios?: {
    nome: boolean;
    cpf: boolean;
    endereco: boolean;
    cep: boolean;
    telefone: boolean;
    tipoItem: boolean;
  };
  logotipoUrl?: string;
}

export type StatusMalote =
  | 'Recebido'
  | 'Em conferência'
  | 'Em cadastramento'
  | 'Pronto para distribuição'
  | 'Em distribuição'
  | 'Parcialmente concluído'
  | 'Concluído'
  | 'Concluído com devoluções'
  | 'Cancelado';

export type StatusEntrega =
  | 'Aguardando revisão'
  | 'Com inconsistência'
  | 'Validada'
  | 'Aguardando distribuição'
  | 'Atribuída'
  | 'Em rota'
  | 'Entregue'
  | 'Tentativa sem sucesso'
  | 'Em análise de pendência'
  | 'Aguardando nova tentativa'
  | 'Devolução definitiva'
  | 'Cancelada';

export type Prioridade = 'Baixa' | 'Média' | 'Alta';

export interface EtapaMalote {
  nome: string;
  dataHora?: string;
  responsavel?: string;
  concluida: boolean;
}

export interface Malote {
  id: string;
  codigo: string;
  clienteId: string;
  tipoRecebimento: string; // ex: Cartões, Boletos, Carnês, Cartões e Boletos, etc.
  dataRecebimento: string; // Data ISO ou formatada
  responsavel: string;
  unidade: string;
  qtdCartoes: number;
  qtdBoletos: number;
  qtdCarnes: number;
  observacoes?: string;
  status: StatusMalote;
  prioridade: Prioridade;
  etapas: EtapaMalote[];
}

export interface Beneficiario {
  nome: string;
  cpf: string;
  dataNascimento: string;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface HistoricoEntrega {
  status: StatusEntrega;
  dataHora: string;
  descricao: string;
  responsavel?: string;
}

export interface Tentativa {
  numero: number;
  dataHora: string;
  motoboyId: string;
  resultado: 'Sucesso' | 'Insucesso';
  motivo?: string; // ex: "Cliente ausente", "Endereço incompleto", "Recusado", "Sem contato"
  fotoUrl?: string;
  observacao?: string;
  geo?: {
    lat: number;
    lng: number;
  };
}

export interface Entrega {
  id: string;
  codigo: string; // ITM-...
  maloteId: string;
  beneficiario: Beneficiario;
  endereco: Endereco;
  telefone: string;
  tipoItem: 'Cartão' | 'Boleto' | 'Carnê' | 'Medicamento' | 'Exame' | 'Documento';
  prioridade: Prioridade;
  tentativaAtual: number;
  status: StatusEntrega;
  motoboyId?: string;
  codigoRastreio: string; // MLTBR...
  historico: HistoricoEntrega[];
  valorCorrida: number;
  tentativas?: Tentativa[];
  enderecoOriginal?: Endereco;
  telefoneOriginal?: string;
}

export interface Motoboy {
  id: string;
  nome: string;
  fotoUrl: string;
  capacidadeKg: number;
  entregasHoje: number;
  meta: number;
  regiao: string; // ex: "Zona Sul", "Centro", "Zona Leste", etc.
  status: 'Disponível' | 'Em rota' | 'Indisponível';
}

export interface Pendencia {
  id: string;
  entregaId: string;
  motivo: string;
  abertaEm: string;
  responsavel: string;
  providencias: string[];
  desfecho?: string;
}

export interface EventoAuditoria {
  id: string;
  usuario: string;
  acao: string;
  entidade: string;
  dataHora: string;
  valorAnterior?: string;
  valorNovo?: string;
  origem?: string;
}

export interface MatrizPermissoes {
  criarEditarMalote: Record<string, string>;
  cadastrarRevisarEntrega: Record<string, string>;
  atribuirMotoboy: Record<string, string>;
  registrarTentativa: Record<string, string>;
  tratarPendencia: Record<string, string>;
  alterarTabelaValores: Record<string, string>;
  fecharFaturamento: Record<string, string>;
  consultarRastreio: Record<string, string>;
}

export interface MotivoInsucesso {
  id: string;
  nome: string;
  ativo: boolean;
  exigeJustificativa: boolean;
  exigeFoto: boolean;
  cliente: string; // 'Todos' ou o ID de um cliente específico
}

export interface ConfigState {
  // Parâmetros gerais
  tentativasMaximas: number;
  autorizacaoQuartaTentativa: boolean;
  exigirFotoFachadaInsucesso: boolean;
  exigirFotoEntregaConcluida: boolean;
  capturarLocalizacaoGps: boolean;
  prazoConferenciaHoras: number;
  prazoDespachoHoras: number;
  prazoTotalEntregaDias: number;
  atrasoAposHoras: number;
  retencaoEvidenciasDias: number;
  retencaoLocalizacaoDias: number;
  capacidadePadraoMotoboyKg: number;
  metaDiariaEntregasMotoboy: number;

  // Matriz de permissões
  matrizPermissoes: MatrizPermissoes;

  // Motivos de insucesso
  motivosInsucesso: MotivoInsucesso[];

  // OCR e importação
  ocrRevisaoHumanaObrigatoria: boolean;
  ocrLimiteConfianca: number;
  ocrCamposObrigatorios: string[];
  ocrFormatoArquivo: 'xlsx' | 'csv';
}

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Operação' | 'Motoboy' | 'Financeiro' | 'Contratante';
  unidade: string;
  ultimoAcesso: string;
  ativo: boolean;
}

