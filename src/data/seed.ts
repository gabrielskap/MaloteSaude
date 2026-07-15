import { Cliente, Motoboy, Malote, Entrega, Pendencia, EventoAuditoria, StatusMalote, StatusEntrega, Prioridade } from '../types';

// Clientes Mock
export const clientesMock: Cliente[] = [
  { id: 'cli-1', nome: 'Hospital São Lucas', cnpj: '12.345.678/0001-90', endereco: 'Av. Paulista, 1250, Bela Vista, São Paulo - SP, CEP 01310-200' },
  { id: 'cli-2', nome: 'Clínica Vida Plena', cnpj: '98.765.432/0001-10', endereco: 'Rua Vergueiro, 1500, Vila Mariana, São Paulo - SP, CEP 04101-000' },
  { id: 'cli-3', nome: 'Laboratório Saúde+', cnpj: '45.678.901/0001-20', endereco: 'Rua Augusta, 1500, Consolação, São Paulo - SP, CEP 01305-100' },
  { id: 'cli-4', nome: 'Hospital Santa Helena', cnpj: '23.456.789/0001-30', endereco: 'Av. Brasil, 1580, Jardim América, São Paulo - SP, CEP 01430-001' },
  { id: 'cli-5', nome: 'Clínica Bem Viver', cnpj: '34.567.890/0001-40', endereco: 'Rua Domingos de Morais, 980, Vila Mariana, São Paulo - SP, CEP 04010-100' },
  { id: 'cli-6', nome: 'Rede Saúde Total', cnpj: '56.789.012/0001-50', endereco: 'Rua Tuiuti, 1250, Tatuapé, São Paulo - SP, CEP 03307-000' },
  { id: 'cli-7', nome: 'Hospital Central', cnpj: '67.890.123/0001-60', endereco: 'Rua Conselheiro Ramalho, 400, Bela Vista, São Paulo - SP, CEP 01325-000' }
];

// Motoboys Mock
export const motoboysMock: Motoboy[] = [
  { id: 'moto-1', nome: 'Rafael Santos', fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 8.0, entregasHoje: 12, meta: 22, regiao: 'Zona Sul', status: 'Disponível' },
  { id: 'moto-2', nome: 'Bruno Oliveira', fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 7.0, entregasHoje: 9, meta: 20, regiao: 'Centro', status: 'Disponível' },
  { id: 'moto-3', nome: 'Lucas Ferreira', fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 8.0, entregasHoje: 18, meta: 22, regiao: 'Zona Leste', status: 'Em rota' },
  { id: 'moto-4', nome: 'Carlos Lima', fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 6.5, entregasHoje: 14, meta: 20, regiao: 'Zona Oeste', status: 'Em rota' },
  { id: 'moto-5', nome: 'Ana Beatriz', fotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 7.5, entregasHoje: 10, meta: 18, regiao: 'Zona Norte', status: 'Em rota' },
  { id: 'moto-6', nome: 'Ricardo Silva', fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120', capacidadeKg: 8.0, entregasHoje: 15, meta: 22, regiao: 'Centro', status: 'Disponível' }
];

// Operadores de Conferência
export const operadoresMock = ['Ana Martins', 'João Paulo', 'Fernanda Lima'];

// Bairros de São Paulo para as Entregas
const bairrosSP = [
  { nome: 'Vila Mariana', cep: '04010', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Bela Vista', cep: '01310', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Consolação', cep: '01302', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Ipiranga', cep: '04208', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Tatuapé', cep: '03307', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Jardim América', cep: '01430', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Cerqueira César', cep: '01414', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Moema', cep: '04515', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Pinheiros', cep: '05402', uf: 'SP', cidade: 'São Paulo' }
];

const logradouros = [
  'Rua das Acácias', 'Av. Paulista', 'Rua Augusta', 'Rua Vergueiro', 'Rua Tuiuti',
  'Av. Brasil', 'Rua Bela Cintra', 'Av. Ibirapuera', 'Rua Fradique Coutinho',
  'Rua Domingos de Morais', 'Rua Guararapes', 'Rua Tupi', 'Av. Angélica', 'Rua Pamplona'
];

const nomesBeneficiarios = [
  'Maria Ap. Souza', 'João Batista Lima', 'Ana Carla Mendes', 'Carlos Eduardo R.',
  'Luciana Ferreira', 'Paulo Henrique S.', 'Beatriz Oliveira', 'Roberto Almeida',
  'Juliana Costa', 'Marcos Antônio Reis', 'Sandra Mara Pereira', 'Fernando Ramos',
  'Carla Rodrigues', 'Ricardo Vasconcelos', 'Patrícia Neves', 'Sérgio Gouveia',
  'Fábio Guimarães', 'Renata Fonseca', 'Thiago Moreira', 'Letícia Borges',
  'Amanda Barbosa', 'Diego Silveira', 'Gabriel Gustavo', 'Julio Cesar Cruz',
  'Estela Marinho', 'Vitor Rezende', 'Priscila Cardoso', 'Rodrigo Antunes',
  'Camila Toledo', 'Bruno Nogueira', 'Tatiane Farias', 'Marcelo Xavier'
];

// Geração de Malotes e Entregas Determinísticas
// Total: 13 malotes (MAL-2025-0525-119 a MAL-2025-0526-131)
export const malotesMock: Malote[] = [];
export const entregasMock: Entrega[] = [];
export const pendenciasMock: Pendencia[] = [];
export const auditoriaMock: EventoAuditoria[] = [];

// Gerador de CPF válido em formato string
const formatCPF = (index: number): string => {
  const base = String(123456789 + index * 17).padStart(9, '0');
  let d1 = 0, d2 = 0;
  for (let i = 0; i < 9; i++) d1 += Number(base[i]) * (10 - i);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  for (let i = 0; i < 9; i++) d2 += Number(base[i]) * (11 - i);
  d2 += d1 * 2;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${d1}${d2}`;
};

// Gerador de CEP
const getCEP = (bairroName: string, index: number): string => {
  const findB = bairrosSP.find(b => b.nome === bairroName);
  const prefix = findB ? findB.cep : '01000';
  const suffix = String(100 + (index % 800)).padStart(3, '0');
  return `${prefix}-${suffix}`;
};

// Criação dos 13 malotes
const maloteConfigs = [
  { id: 'MAL-119', codigo: 'MAL-2025-0525-119', cliId: 'cli-1', status: 'Concluído' as StatusMalote, data: '25/05/2025 09:50', responsavel: 'Ana Martins', pri: 'Média' as Prioridade, itens: '110 cartões' },
  { id: 'MAL-120', codigo: 'MAL-2025-0525-120', cliId: 'cli-3', status: 'Concluído' as StatusMalote, data: '25/05/2025 13:05', responsavel: 'Fernanda Lima', pri: 'Alta' as Prioridade, itens: '180 carnês' },
  { id: 'MAL-121', codigo: 'MAL-2025-0525-121', cliId: 'cli-2', status: 'Concluído' as StatusMalote, data: '25/05/2025 14:11', responsavel: 'João Paulo', pri: 'Baixa' as Prioridade, itens: '95 boletos' },
  { id: 'MAL-122', codigo: 'MAL-2025-0525-122', cliId: 'cli-7', status: 'Parcialmente concluído' as StatusMalote, data: '25/05/2025 15:22', responsavel: 'Ana Martins', pri: 'Média' as Prioridade, itens: '220 cartões' },
  { id: 'MAL-123', codigo: 'MAL-2025-0525-123', cliId: 'cli-6', status: 'Em conferência' as StatusMalote, data: '25/05/2025 16:40', responsavel: 'Fernanda Lima', pri: 'Baixa' as Prioridade, itens: '300 carnês' },
  { id: 'MAL-124', codigo: 'MAL-2025-0526-124', cliId: 'cli-5', status: 'Em distribuição' as StatusMalote, data: '26/05/2025 07:10', responsavel: 'João Paulo', pri: 'Média' as Prioridade, itens: '60 boletos' },
  { id: 'MAL-125', codigo: 'MAL-2025-0526-125', cliId: 'cli-4', status: 'Concluído' as StatusMalote, data: '26/05/2025 07:30', responsavel: 'Ana Martins', pri: 'Média' as Prioridade, itens: '150 cartões' },
  { id: 'MAL-126', codigo: 'MAL-2025-0526-126', cliId: 'cli-3', status: 'Em conferência' as StatusMalote, data: '26/05/2025 07:45', responsavel: 'Fernanda Lima', pri: 'Alta' as Prioridade, itens: '200 carnês' },
  { id: 'MAL-127', codigo: 'MAL-2025-0526-127', cliId: 'cli-2', status: 'Em distribuição' as StatusMalote, data: '26/05/2025 08:02', responsavel: 'João Paulo', pri: 'Média' as Prioridade, itens: '85 boletos' },
  { id: 'MAL-128', codigo: 'MAL-2025-0526-128', cliId: 'cli-1', status: 'Em distribuição' as StatusMalote, data: '26/05/2025 08:15', responsavel: 'Ana Martins', pri: 'Alta' as Prioridade, itens: '120 cartões' },
  { id: 'MAL-129', codigo: 'MAL-2025-0526-129', cliId: 'cli-4', status: 'Em cadastramento' as StatusMalote, data: '26/05/2025 09:30', responsavel: 'Fernanda Lima', pri: 'Alta' as Prioridade, itens: '80 cartões' },
  { id: 'MAL-130', codigo: 'MAL-2025-0526-130', cliId: 'cli-1', status: 'Recebido' as StatusMalote, data: '26/05/2025 10:15', responsavel: 'João Paulo', pri: 'Média' as Prioridade, itens: '140 exames' },
  { id: 'MAL-131', codigo: 'MAL-2025-0526-131', cliId: 'cli-6', status: 'Recebido' as StatusMalote, data: '26/05/2025 11:00', responsavel: 'Ana Martins', pri: 'Baixa' as Prioridade, itens: '90 medicamentos' }
];

let itemGlobalIndex = 1;

maloteConfigs.forEach((config, idx) => {
  // Parsing card, boleto, carne counters from itens string
  let qtdCartoes = 0;
  let qtdBoletos = 0;
  let qtdCarnes = 0;
  if (config.itens.includes('cartões')) qtdCartoes = parseInt(config.itens);
  if (config.itens.includes('boletos')) qtdBoletos = parseInt(config.itens);
  if (config.itens.includes('carnês')) qtdCarnes = parseInt(config.itens);

  // Default steps (etapas)
  const etapas: Malote['etapas'] = [
    { nome: 'Recebido', dataHora: config.data, responsavel: config.responsavel, concluida: true },
    { nome: 'Triagem', dataHora: config.status !== 'Recebido' ? config.data : undefined, responsavel: config.responsavel, concluida: config.status !== 'Recebido' },
    { nome: 'Separacão', dataHora: ['Em distribuição', 'Concluído', 'Parcialmente concluído'].includes(config.status) ? config.data : undefined, responsavel: config.responsavel, concluida: ['Em distribuição', 'Concluído', 'Parcialmente concluído'].includes(config.status) },
    { nome: 'Em distribuição', dataHora: ['Concluído', 'Parcialmente concluído'].includes(config.status) ? config.data : undefined, responsavel: config.responsavel, concluida: ['Concluído', 'Parcialmente concluído'].includes(config.status) },
    { nome: 'Concluído', concluida: config.status === 'Concluído' }
  ];

  const malote: Malote = {
    id: config.id,
    codigo: config.codigo,
    clienteId: config.cliId,
    tipoRecebimento: qtdCartoes > 0 ? 'Cartões' : qtdBoletos > 0 ? 'Boletos' : 'Carnês',
    dataRecebimento: config.data,
    responsavel: config.responsavel,
    unidade: 'São Paulo - Centro',
    qtdCartoes,
    qtdBoletos,
    qtdCarnes,
    observacoes: `Malote com itens para entrega rápida. Código de envio ${config.codigo}.`,
    status: config.status,
    prioridade: config.pri,
    etapas
  };
  
  malotesMock.push(malote);

  // Generate ~8 to ~12 deliveries per malote to reach exactly ~120 deliveries in total
  // Let's generate a precise count to equal 122 deliveries in total
  const countDeliveries = [9, 10, 8, 11, 10, 8, 9, 11, 8, 12, 8, 9, 9][idx];

  for (let d = 0; d < countDeliveries; d++) {
    const currentItemIndex = itemGlobalIndex++;
    const itemCode = `ITM-0526-${String(currentItemIndex).padStart(4, '0')}`;
    const trackingCode = `MLTBR250526${String(100 + currentItemIndex).padStart(3, '0')}BR`;
    
    const bIdx = (currentItemIndex) % bairrosSP.length;
    const lIdx = (currentItemIndex * 3) % logradouros.length;
    const nIdx = (currentItemIndex * 7) % nomesBeneficiarios.length;
    
    const bairro = bairrosSP[bIdx];
    const logradouro = logradouros[lIdx];
    const nomeBen = nomesBeneficiarios[nIdx];
    const num = String(10 + (currentItemIndex * 23) % 1500);

    // Distribute delivery status based on targets:
    // ~66% delivered (Entregue), ~26% in route (Em rota), ~5% pending (Com inconsistência/Tentativa sem sucesso), ~3% returned (Devolução definitiva)
    // We can assign status based on currentItemIndex:
    let status: StatusEntrega = 'Aguardando distribuição';
    let motoboyId: string | undefined = undefined;
    let tentativas: Entrega['tentativas'] = [];

    if (config.status === 'Concluído') {
      // Almost all delivered, except very few returned or failed
      if (currentItemIndex % 15 === 0) {
        status = 'Devolução definitiva';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
        tentativas = [{
          numero: 1,
          dataHora: '25/05/2025 15:30',
          motoboyId: motoboyId,
          resultado: 'Insucesso',
          motivo: 'Endereço incompleto',
          observacao: 'Número de condomínio não existe na avenida.',
          geo: { lat: -23.561, lng: -46.655 }
        }];
      } else {
        status = 'Entregue';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
      }
    } else if (config.status === 'Parcialmente concluído') {
      if (currentItemIndex % 3 === 0) {
        status = 'Tentativa sem sucesso';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
        tentativas = [{
          numero: 1,
          dataHora: '25/05/2025 14:00',
          motoboyId: motoboyId,
          resultado: 'Insucesso',
          motivo: 'Cliente ausente',
          observacao: 'Porteiro informou que morador viajou.',
          geo: { lat: -23.563, lng: -46.652 }
        }];
      } else {
        status = 'Entregue';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
      }
    } else if (config.status === 'Em distribuição') {
      // Let's put some in 'Em rota' (Active delivery) or 'Atribuída' or 'Entregue' (since 70% progress)
      if (currentItemIndex % 4 === 0) {
        status = 'Em rota';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
      } else if (currentItemIndex % 5 === 0) {
        status = 'Tentativa sem sucesso';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
        tentativas = [{
          numero: 1,
          dataHora: '26/05/2025 10:20',
          motoboyId: motoboyId,
          resultado: 'Insucesso',
          motivo: 'Cliente ausente',
          observacao: 'Ninguém atendeu ao interfone.',
          geo: { lat: -23.585, lng: -46.635 }
        }];
      } else {
        status = 'Entregue';
        motoboyId = `moto-${1 + (currentItemIndex % 6)}`;
      }
    } else if (config.status === 'Em conferência' || config.status === 'Em cadastramento') {
      status = currentItemIndex % 6 === 0 ? 'Com inconsistência' : 'Validada';
    } else {
      // Recebido
      status = 'Aguardando revisão';
    }

    // Determine type of item based on malote configuration or random index
    let tipoItem: Entrega['tipoItem'] = 'Cartão';
    if (qtdBoletos > 0) tipoItem = 'Boleto';
    if (qtdCarnes > 0) tipoItem = 'Carnê';
    if (config.itens.includes('exames')) tipoItem = 'Exame';
    if (config.itens.includes('medicamentos')) tipoItem = 'Medicamento';

    // Tracking history
    const historico: Entrega['historico'] = [
      { status: 'Aguardando revisão', dataHora: config.data, descricao: 'Item importado do faturamento do plano de saúde', responsavel: config.responsavel }
    ];
    if (status !== 'Aguardando revisão') {
      historico.push({ status: 'Validada', dataHora: config.data, descricao: 'Dados cadastrais validados via sistema', responsavel: 'Sistema OCR' });
    }
    if (motoboyId && status !== 'Aguardando revisão' && status !== 'Validada') {
      historico.push({ status: 'Atribuída', dataHora: config.data, descricao: `Item atribuído ao entregador ${motoboyId === 'moto-1' ? 'Rafael Santos' : 'Ricardo Silva'}`, responsavel: config.responsavel });
    }
    if (status === 'Em rota') {
      historico.push({ status: 'Em rota', dataHora: '26/05/2025 09:15', descricao: 'Saída para entrega do motoboy', responsavel: 'Sistema Logístico' });
    } else if (status === 'Entregue') {
      historico.push({ status: 'Em rota', dataHora: '26/05/2025 09:15', descricao: 'Saída para entrega do motoboy', responsavel: 'Sistema Logístico' });
      historico.push({ status: 'Entregue', dataHora: '26/05/2025 11:30', descricao: 'Entregue com sucesso ao beneficiário', responsavel: 'Sistema Logístico' });
    } else if (status === 'Tentativa sem sucesso') {
      historico.push({ status: 'Em rota', dataHora: '26/05/2025 09:15', descricao: 'Saída para entrega do motoboy', responsavel: 'Sistema Logístico' });
      historico.push({ status: 'Tentativa sem sucesso', dataHora: '26/05/2025 10:20', descricao: 'Tentativa de entrega sem sucesso: Cliente ausente', responsavel: 'Sistema Logístico' });
    } else if (status === 'Devolução definitiva') {
      historico.push({ status: 'Em rota', dataHora: '25/05/2025 11:00', descricao: 'Saída para entrega do motoboy', responsavel: 'Sistema Logístico' });
      historico.push({ status: 'Tentativa sem sucesso', dataHora: '25/05/2025 13:00', descricao: 'Tentativa falha: Endereço incompleto', responsavel: 'Sistema Logístico' });
      historico.push({ status: 'Devolução definitiva', dataHora: '25/05/2025 15:30', descricao: 'Retorno ao faturamento do plano de saúde', responsavel: 'Sistema Logístico' });
    }

    const entrega: Entrega = {
      id: `itm-${currentItemIndex}`,
      codigo: itemCode,
      maloteId: config.id,
      beneficiario: {
        nome: nomeBen,
        cpf: formatCPF(currentItemIndex),
        dataNascimento: '15/08/1985'
      },
      endereco: {
        cep: getCEP(bairro.nome, currentItemIndex),
        logradouro,
        numero: num,
        complemento: currentItemIndex % 3 === 0 ? `Apto ${(currentItemIndex % 15) * 10 + 2}` : undefined,
        bairro: bairro.nome,
        cidade: 'São Paulo',
        uf: 'SP'
      },
      telefone: `(11) 98765-${String(1000 + currentItemIndex * 9).slice(0, 4)}`,
      tipoItem,
      prioridade: currentItemIndex % 5 === 0 ? 'Alta' : currentItemIndex % 3 === 0 ? 'Baixa' : 'Média',
      tentativaAtual: tentativas.length,
      status,
      motoboyId,
      codigoRastreio: trackingCode,
      historico,
      valorCorrida: 12.50 + (currentItemIndex % 5) * 1.50,
      tentativas
    };

    entregasMock.push(entrega);

    // If there's an active failure or inconsistency, add a Pendência
    if (status === 'Com inconsistência') {
      const pendenciaId = `PEND-${20250500 + currentItemIndex}`;
      pendenciasMock.push({
        id: pendenciaId,
        entregaId: entrega.id,
        motivo: 'Endereço sem número ou sem complemento de condomínio detectado no OCR.',
        abertaEm: '26/05/2025 09:15',
        responsavel: config.responsavel,
        providencias: ['Aguardando contato telefônico com o beneficiário para confirmar dados.'],
      });
    } else if (status === 'Tentativa sem sucesso') {
      const pendenciaId = `PEND-${20250500 + currentItemIndex}`;
      pendenciasMock.push({
        id: pendenciaId,
        entregaId: entrega.id,
        motivo: 'Cliente ausente em 1ª tentativa.',
        abertaEm: '26/05/2025 10:25',
        responsavel: 'Sistema Logístico',
        providencias: ['Registrada ocorrência', 'Notificação de tentativa enviada por SMS'],
      });
    }
  }
});

// Audit events
auditoriaMock.push(
  { id: 'AUD-001', usuario: 'Ana Martins', acao: 'Importação de Planilha', entidade: 'Malotes', dataHora: '26/05/2025 08:15', valorNovo: 'Malote MAL-2025-0526-128 criado' },
  { id: 'AUD-002', usuario: 'João Paulo', acao: 'Atualização de Status', entidade: 'Entregas', dataHora: '26/05/2025 09:15', valorAnterior: 'Atribuída', valorNovo: 'Em rota' },
  { id: 'AUD-003', usuario: 'Fernanda Lima', acao: 'Revisão OCR', entidade: 'Entregas', dataHora: '26/05/2025 09:30', valorAnterior: 'Aguardando revisão', valorNovo: 'Validada' }
);
