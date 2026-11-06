-- ==============================================================================
-- DDL & SEED: Tabela public.crm_isapel_leads (Isapel CRM)
-- Atualizado: 2026-11-05 com inclusão da coluna tipo_cliente (Requisitos R1, R2, R3, R4)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.crm_isapel_leads (
  id text PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  telefone_formatado text,
  ddd integer,
  cidade text,
  regiao text,
  uf text DEFAULT 'SP',
  estagio text DEFAULT 'novo',
  vendedor_id text DEFAULT 'maciel',
  vendedor_nome text DEFAULT 'Gabriel Maciel',
  tipo_cliente text DEFAULT '',
  valor_proposta numeric DEFAULT 0,
  observacoes text DEFAULT '',
  historico jsonb DEFAULT '[]'::jsonb,
  data_cadastro timestamptz DEFAULT NOW(),
  data_atualizacao timestamptz DEFAULT NOW()
);

ALTER TABLE public.crm_isapel_leads ADD COLUMN IF NOT EXISTS tipo_cliente text DEFAULT '';

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-maciel-01', 'Hospital Metropolitano Campinas', '(19) 98845-1234', '(19) 98845-1234', 19, 'Campinas, Piracicaba, Limeira e Americana', 'Região Metropolitana de Campinas (RMC) e Leste Paulista', 'SP', 'negociacao', 'maciel', 'Gabriel Maciel', 'licitacao', 19850, 'Negociação da cláusula de fornecimento contínuo com entrega CIF semanal no CD do hospital.', '[{"id":"hist-1","data":"2026-10-25T08:30:00.000Z","tipo":"contato","canal":"whatsapp","descricao":"Lead prospectado via lista de hospitais RMC. Solicitado levantamento de consumo atual com o comprador Dr. Fernando.","autor":"Gabriel Maciel"},{"id":"hist-2","data":"2026-10-27T10:00:00.000Z","tipo":"proposta","canal":"email","descricao":"Cotação enviada: 180 fardos Interfolha + 80 Rolão com frete CIF incluso na frota Isapel rota Campinas.","autor":"Gabriel Maciel"},{"id":"hist-3","data":"2026-10-28T16:00:00.000Z","tipo":"amostra","canal":"visita","descricao":"Amostras de teste entregues pelo motorista Isapel. Testado na UTI e aprovado sem soltar fiapos.","autor":"Gabriel Maciel"},{"id":"hist-4","data":"2026-10-29T14:20:00.000Z","tipo":"negociacao","canal":"ligacao","descricao":"Alinhamento da minuta contratual e liberação do cadastro de faturamento para fechar primeiro pedido.","autor":"Gabriel Maciel"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-maciel-02', 'Condomínio Empresarial Alpha Tower Barueri', '(11) 97120-4567', '(11) 97120-4567', 11, 'São Paulo e Grande SP', 'Região Metropolitana de São Paulo (Grande SP e ABC)', 'SP', 'fechado', 'maciel', 'Gabriel Maciel', 'consumidor_final', 14720, 'Contrato fechado com vigência de 12 meses. Primeira carga entregue na Rota Grande SP Isapel.', '[{"id":"hist-5","data":"2026-10-20T09:15:00.000Z","tipo":"contato","canal":"ligacao","descricao":"Contato direto com a Mariana de Facilities. Insatisfeitos com atrasos e papel rasgando do antigo fornecedor.","autor":"Gabriel Maciel"},{"id":"hist-6","data":"2026-10-23T11:30:00.000Z","tipo":"proposta","canal":"email","descricao":"Envio de proposta comercial com comodato completo dos dispensers Isapel.","autor":"Gabriel Maciel"},{"id":"hist-7","data":"2026-10-29T11:00:00.000Z","tipo":"fechamento","canal":"visita","descricao":"Contrato assinado! Cliente ativo ganho. Primeiro faturamento emitido.","autor":"Gabriel Maciel"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-maciel-03', 'LogTech Centro de Distribuição Cajamar', '(11) 99432-8877', '(11) 99432-8877', 11, 'São Paulo e Grande SP', 'Região Metropolitana de São Paulo (Grande SP e ABC)', 'SP', 'proposta', 'maciel', 'Gabriel Maciel', 'distribuidor', 23600, 'Proposta enviada há mais de 24h. Necessário alinhar janela de descarregamento na frota própria Isapel.', '[{"id":"hist-8","data":"2026-10-28T14:00:00.000Z","tipo":"contato","canal":"whatsapp","descricao":"Abordagem ao coordenador de almoxarifado do hub de Cajamar.","autor":"Gabriel Maciel"},{"id":"hist-9","data":"2026-10-28T17:45:00.000Z","tipo":"proposta","canal":"email","descricao":"Cotação enviada com preço unitário competitivo para alto volume e frete CIF garantido.","autor":"Gabriel Maciel"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-fernanda-01', 'Rede Hotel Fasano & Suítes São Paulo', '(11) 98341-9988', '(11) 98341-9988', 11, 'São Paulo e Grande SP', 'Região Metropolitana de São Paulo (Grande SP e ABC)', 'SP', 'negociacao', 'fernanda', 'Gabriel Maciel', 'consumidor_final', 13900, 'Pendente envio da minuta de contrato com garantia de lote homogêneo 100% Celulose Virgem.', '[{"id":"hist-10","data":"2026-10-26T10:00:00.000Z","tipo":"contato","canal":"visita","descricao":"Reunião presencial com a governanta Letícia. Foco total em maciez e ausência de odor no papel.","autor":"Fernanda"},{"id":"hist-11","data":"2026-10-27T14:00:00.000Z","tipo":"amostra","canal":"visita","descricao":"Entrega de fardos de teste da linha Luxo 3 Dobras.","autor":"Fernanda"},{"id":"hist-12","data":"2026-10-29T15:30:00.000Z","tipo":"negociacao","canal":"whatsapp","descricao":"Letícia aprovou a qualidade. Ajustando apenas se a entrega pode ser feita no início da manhã.","autor":"Fernanda"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-fernanda-02', 'Complexo Universitário Vale do Paraíba', '(12) 99182-3344', '(12) 99182-3344', 12, 'São José dos Campos e Taubaté', 'Vale do Paraíba e Litoral Norte', 'SP', 'proposta', 'fernanda', 'Gabriel Maciel', 'licitacao', 16250, 'Proposta encaminhada há mais de 24h. Oportunidade perfeita para encaixar na Rota Vale do Paraíba da Frota Isapel.', '[{"id":"hist-13","data":"2026-10-28T09:40:00.000Z","tipo":"contato","canal":"ligacao","descricao":"Contato com setor de compras do campus universitário em Taubaté.","autor":"Fernanda"},{"id":"hist-14","data":"2026-10-28T16:20:00.000Z","tipo":"proposta","canal":"email","descricao":"Proposta formal enviada com tabela de preços diferenciada para instituição de ensino.","autor":"Fernanda"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-fernanda-03', 'Frigorífico Granja do Sul Santos Dumont', '(35) 98822-1100', '(35) 98822-1100', 35, 'Poços de Caldas, Pouso Alegre e Varginha', 'Sul e Sudoeste de Minas Gerais (Divisa SP)', 'MG', 'qualificacao', 'fernanda', 'Gabriel Maciel', 'consumidor_final', 0, 'DDD 35 (Sul de Minas) atendido pela rota direta de frota da divisa de SP. Necessário qualificar exigências do SIF.', '[{"id":"hist-15","data":"2026-10-29T10:15:00.000Z","tipo":"contato","canal":"whatsapp","descricao":"Primeiro contato realizado. Marcelo solicitou laudo de atoxidade do papel toalha bobina para uso em área de desossa.","autor":"Fernanda"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-caio-01', 'Rede OdontoCare Clínicas Especializadas', '(19) 99654-7711', '(19) 99654-7711', 19, 'Campinas, Piracicaba, Limeira e Americana', 'Região Metropolitana de Campinas (RMC) e Leste Paulista', 'SP', 'novo', 'caio', 'Gabriel Maciel', 'consumidor_final', 0, 'Lead captado por prospecção ativa. Alta probabilidade de encaixe logístico na rota diária Campinas/RMC.', '[{"id":"hist-16","data":"2026-10-29T16:30:00.000Z","tipo":"cadastro","canal":"whatsapp","descricao":"Lead inserido via formulário rápido. Fazer ligação de qualificação para mapear consumo exato.","autor":"Caio"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-caio-02', 'Galpões Industriais & Logística RodoVale Sorocaba', '(15) 98112-9922', '(15) 98112-9922', 15, 'Sorocaba e Itapetininga', 'Sudoeste Paulista e Região Metropolitana de Sorocaba', 'SP', 'qualificacao', 'caio', 'Gabriel Maciel', 'outro', 0, 'DDD 15 coberto pela frota própria Isapel Sorocaba. Cláudio confirmou interesse em comodato de 20 toalheiros.', '[{"id":"hist-17","data":"2026-10-28T11:00:00.000Z","tipo":"cadastro","canal":"whatsapp","descricao":"Lead prospectado no condomínio industrial de Sorocaba.","autor":"Caio"},{"id":"hist-18","data":"2026-10-29T09:30:00.000Z","tipo":"contato","canal":"ligacao","descricao":"Qualificação realizada: consumo de 90 fardos de Rolão por mês. Estão insatisfeitos com a entrega do concorrente que quebra com frequência.","autor":"Caio"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();

INSERT INTO public.crm_isapel_leads (id, nome, telefone, telefone_formatado, ddd, cidade, regiao, uf, estagio, vendedor_id, vendedor_nome, tipo_cliente, valor_proposta, observacoes, historico)
  VALUES ('lead-caio-03', 'Rede FarmaMais Distribuidora Paraná', '(41) 98777-6543', '(41) 98777-6543', 41, 'Curitiba e São José dos Pinhais', 'Região Metropolitana de Curitiba (RMC) e Litoral Paranaense', 'PR', 'proposta', 'caio', 'Gabriel Maciel', 'distribuidor', 15400, 'DDD 41 com Rota Direta Isapel. Cotação feita com frete CIF incluso.', '[{"id":"hist-19","data":"2026-10-27T15:20:00.000Z","tipo":"contato","canal":"ligacao","descricao":"Prospecção em Curitiba. Vanessa atendeu prontamente pedindo cotação de fardos fechados.","autor":"Caio"},{"id":"hist-20","data":"2026-10-28T14:10:00.000Z","tipo":"proposta","canal":"email","descricao":"Proposta comercial formalizada. Confirmado frete CIF pela rota PR Isapel.","autor":"Caio"}]'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    telefone_formatado = EXCLUDED.telefone_formatado,
    ddd = EXCLUDED.ddd,
    cidade = EXCLUDED.cidade,
    regiao = EXCLUDED.regiao,
    uf = EXCLUDED.uf,
    estagio = EXCLUDED.estagio,
    vendedor_id = EXCLUDED.vendedor_id,
    vendedor_nome = EXCLUDED.vendedor_nome,
    tipo_cliente = EXCLUDED.tipo_cliente,
    valor_proposta = EXCLUDED.valor_proposta,
    observacoes = EXCLUDED.observacoes,
    historico = EXCLUDED.historico,
    data_atualizacao = NOW();