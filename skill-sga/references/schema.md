# SCHEMA COMPLETO - SISTEMA DE POSTO DE COMBUSTÍVEIS
# PostgreSQL - Aproximadamente 400 tabelas

## ÍNDICE
1. Módulo de Vendas / PDV
2. Módulo de Produtos
3. Módulo de Participantes (Clientes/Fornecedores)
4. Módulo de Combustíveis / Pista
5. Módulo de Caixa / Financeiro
6. Módulo Fiscal / NFe
7. Módulo de Estoque
8. Módulo de Fidelidade
9. Módulo de TEF / Pagamentos
10. Integrações (Ipiranga, Mercado Pago)

---

## 1. MÓDULO DE VENDAS / PDV

### vda - Cabeçalho da Venda
Armazena informações gerais da venda/atendimento.

Campos principais:
- vdacodigo (PK) - Código único da venda
- vdadata - Data/hora da venda
- vdamovimento - Data de movimento (dia fiscal)
- vdacliente - Código do cliente
- vdaendereco - Endereço de entrega
- vdadocumento - Número do documento (cupom/nota)
- vdatotal - Valor total da venda
- vdasituacao - Situação (NULL=normal, 1=cancelada)
- vdaempresa - Código da empresa

### vdit - Itens da Venda
Armazena os produtos/serviços vendidos.

Campos principais:
- vditcodigo (PK) - Código único do item
- vditcodigovda (FK) - Código da venda
- vditproduto - Código do produto
- vditqtd - Quantidade vendida
- vditunitario - Preço unitário
- vdittotal - Total do item
- vditempresa - Código da empresa

### vdve - Dados do Veículo na Venda
Armazena placa, KM e média quando há veículo envolvido.

Campos principais:
- vdvecodigovda (PK/FK) - Código da venda
- vdveplaca - Placa do veículo
- vdvekm - Quilometragem atual
- vdvemedia - Média de consumo calculada (KM/L)
- vdveempresa - Código da empresa

⚠️ PROBLEMA CONHECIDO: A média é calculada dividindo pelos litros do abastecimento ATUAL ao invés do ANTERIOR.

### prvd - Pré-Venda / Comanda
Vendas em aberto, ainda não finalizadas.

Campos principais:
- prvdserie (PK) - Série da pré-venda
- prvddata - Data/hora de abertura
- prvdcodcliente - Cliente
- prvdobs - Observações
- prvdempresa - Código da empresa

### prit - Itens da Pré-Venda
Itens da comanda/pré-venda.

Campos principais:
- pritserie (PK) - Série da pré-venda
- prititem (PK) - Número do item
- pritproduto - Código do produto
- pritqtd - Quantidade
- pritunitario - Preço unitário
- prittotal - Total do item

### pmvd - Comandas (Restaurante/Conveniência)
Comandas para restaurante/lanchonete.

Campos principais:
- pmvdcodigo (PK) - Código da comanda
- pmvdterminal - Terminal que abriu
- pmvdcaixa - Caixa responsável
- pmvddata - Data/hora abertura
- pmvdnumeromesa - Número da mesa

### pmit - Itens da Comanda
Produtos consumidos na comanda.

Campos principais:
- pmitcodigo (PK) - Código do item
- pmitcomanda - Código da comanda
- pmitproduto - Produto consumido
- pmitqtd - Quantidade
- pmittotal - Total

---

## 2. MÓDULO DE PRODUTOS

### prod - Cadastro de Produtos
Cadastro principal de produtos.

Campos principais:
- prodcodigo (PK) - Código do produto
- prodbarra - Código de barras
- proddescricao - Nome do produto
- prodtipo - Tipo (combustível, loja, etc)
- prodsecao - Seção/departamento
- prodgrupo - Grupo do produto
- prodncm - Código NCM (fiscal)
- prodanp - Código ANP (combustíveis)
- prodv1 a prodv12 - Tabelas de preço
- prodativo - Data de ativação
- prodinativo - Data de inativação

### e_prod - Produtos por Empresa
Dados específicos do produto por empresa.

Campos principais:
- e_prodcodigo (PK)
- e_prodproduto - Código do produto
- e_prodempresa - Código da empresa
- e_prodcusto - Custo do produto
- e_prodicms - Alíquota ICMS
- e_prodv1 a e_prodv12 - Preços por empresa
- e_prodativo - Ativo nesta empresa
- e_prodinativo - Inativo nesta empresa

### prou - Unidades de Medida do Produto
Conversões de unidade.

Campos principais:
- proucodigo (PK)
- prouproduto - Código do produto
- prouund - Unidade (CX, FD, UN, etc)
- prouqtd - Quantidade de conversão

### prof - Fornecedores do Produto
Vincula produtos a fornecedores.

Campos principais:
- profcodigo (PK)
- profproduto - Código do produto
- proffornecedor - Código do fornecedor

### kits - Combos/Kits
Produtos agrupados em kits.

Campos principais:
- kitscodigo (PK)
- kitscombo - Produto combo
- kitsproduto - Produto componente
- kitsqtd - Quantidade no combo
- kitsvlr - Valor do item

---

## 3. MÓDULO DE PARTICIPANTES

### part - Cadastro de Participantes
Clientes, fornecedores, transportadores, funcionários.

Campos principais:
- partcodigo (PK) - Código do participante
- partrazao - Razão social
- partfantasia - Nome fantasia
- part_cli - É cliente? (SIM/NAO)
- part_for - É fornecedor? (SIM/NAO)
- part_tra - É transportador? (SIM/NAO)
- partcnpjcpf - CPF/CNPJ
- partierg - Inscrição estadual
- partativo - Data de ativação
- partinativo - Data de inativação

### e_part - Participantes por Empresa
Dados específicos por empresa.

Campos principais:
- e_partcodigo (PK)
- e_partparticipante - Código do participante
- e_partempresa - Código da empresa
- e_partlimite - Limite de crédito
- e_partfatura - Gera fatura? (SIM/NAO)
- e_partativo - Ativo nesta empresa

### pars - Endereços de Entrega
Múltiplos endereços por cliente.

Campos principais:
- parscodigo (PK)
- parsparticipante - Código do participante
- parsdescricao - Descrição do endereço
- parslogradouro - Rua/Avenida
- parscep - CEP
- parscidade - Código da cidade

### parv - Veículos do Participante
Veículos vinculados a clientes (frota).

Campos principais:
- parvcodigo (PK)
- parvparticipante - Código do participante
- parvplaca - Placa do veículo
- parvfrota - Código da frota
- parvlimite - Limite de crédito do veículo

### pard - Dependentes/Motoristas
Pessoas autorizadas a abastecer.

Campos principais:
- pardcodigo (PK)
- pardparticipante - Código do participante
- pardnome - Nome do dependente
- pardcpfcnpj - CPF
- pardsenha - Senha para abastecimento

### veic - Cadastro de Veículos
Cadastro completo de veículos.

Campos principais:
- veicplaca (PK) - Placa do veículo
- veicparticipante - Dono do veículo
- veicveiculo - Modelo/marca
- veiccapacidadetanque - Capacidade em litros

---

## 4. MÓDULO DE COMBUSTÍVEIS / PISTA

### bico - Bicos de Abastecimento
Bicos das bombas.

Campos principais:
- bicocodigo (PK) - Código do bico
- bicodescricao - Descrição
- bicobomba - Bomba que pertence
- bicotanque - Tanque que alimenta
- bicoempresa - Código da empresa

### bomb - Bombas
Bombas de combustível.

Campos principais:
- bombcodigo (PK) - Código da bomba
- bombdescricao - Descrição
- bombempresa - Código da empresa

### tanq - Tanques de Combustível
Tanques de armazenamento.

Campos principais:
- tanqcodigo (PK) - Código do tanque
- tanqdescricao - Descrição
- tanqcapacidade - Capacidade em litros
- tanqempresa - Código da empresa

### ablg - Log de Abastecimentos
Registro de todos os abastecimentos.

Campos principais:
- ablgcodigo (PK) - Código do log
- ablgdata - Data/hora do abastecimento
- ablgbico - Bico utilizado
- ablgqtd - Quantidade em litros
- ablgunitario - Preço por litro
- ablgempresa - Código da empresa

### abpe - Abastecimentos Pendentes
Abastecimentos aguardando finalização.

Campos principais:
- abpecodigo (PK)
- abpedata - Data/hora
- abpebico - Bico
- abpeqtd - Quantidade
- abpeempresa - Código da empresa

### lmc - Livro de Movimentação de Combustíveis
Controle mensal de estoque de combustível.

Campos principais:
- lmccodigo (PK)
- lmccombustivel - Produto combustível
- lmcperiodo - Mês/Ano (YYYYMM)
- lmcdata - Data de fechamento
- lmcabertura - Estoque inicial
- lmccompra - Entradas
- lmcvenda - Saídas
- lmcfechamento - Estoque final
- lmcempresa - Código da empresa

### lmce - LMC por Tanque (Estoque)
Detalhamento por tanque.

Campos principais:
- lmcecodigo (PK)
- lmcelmc - Código do LMC
- lmcetanque - Tanque
- lmceabertura - Estoque inicial
- lmcefechamento - Estoque final

### lmcv - LMC por Bico (Vendas)
Detalhamento de vendas por bico.

Campos principais:
- lmcvcodigo (PK)
- lmcvlmc - Código do LMC
- lmcvbico - Bico
- lmcvabertura - Encerrante inicial
- lmcvfechamento - Encerrante final
- lmcvvenda - Total vendido

---

## 5. MÓDULO DE CAIXA / FINANCEIRO

### cxa - Abertura de Caixa
Controle de caixas abertos.

Campos principais:
- cxacodigo (PK) - Código do caixa
- cxadata - Data de abertura
- cxausuario - Usuário responsável
- cxasaldoinicial - Saldo inicial
- cxasaldofinal - Saldo final
- cxafechamento - Data/hora fechamento
- cxaempresa - Código da empresa

### cxab - Abertura por Caixa/Terminal
Detalhamento por terminal.

Campos principais:
- cxabcodigo (PK)
- cxabcaixa - Código do caixa
- cxabterminal - Terminal
- cxabempresa - Código da empresa

### flux - Fluxo de Caixa
Lançamentos do fluxo de caixa.

Campos principais:
- fluxcodigo (PK)
- fluxdata - Data do lançamento
- fluxhistorico - Descrição
- fluxdebito - Valor de débito
- fluxcredito - Valor de crédito
- fluxsaldo - Saldo após lançamento

### rece - Contas a Receber
Títulos a receber de clientes.

Campos principais:
- rececodigo (PK) - Código do título
- recedocumento - Número do documento
- rececliente - Código do cliente
- recevencimento - Data de vencimento
- recevalor - Valor do título
- receempresa - Código da empresa

### recj - Recebimentos (Baixas)
Baixas de contas a receber.

Campos principais:
- recjcodigo (PK)
- recjrece - Código do título
- recjpagamento - Data do pagamento
- recjvalor - Valor pago
- recjempresa - Código da empresa

### paga - Contas a Pagar
Títulos a pagar para fornecedores.

Campos principais:
- pagacodigo (PK)
- pagadocumento - Número do documento
- pagafornecedor - Código do fornecedor
- pagavencimento - Data de vencimento
- pagavalor - Valor do título
- pagaempresa - Código da empresa

### pagj - Pagamentos (Baixas)
Baixas de contas a pagar.

Campos principais:
- pagjcodigo (PK)
- pagjpaga - Código do título
- pagjpagamento - Data do pagamento
- pagjpago - Valor pago
- pagjempresa - Código da empresa

### mapc - Mapa de Caixa
Consolidação de todos os caixas do dia.

Campos principais:
- mapccodigo (PK)
- mapcmapa - Data do mapa
- mapccaixa - Caixa incluído
- mapcempresa - Código da empresa

---

## 6. MÓDULO FISCAL / NFe

### nra - Notas Fiscais Emitidas (Autorizadas)
NFe e NFCe autorizadas.

Campos principais:
- nracodigo (PK) - Código da nota
- nranumero - Número da nota
- nramodelo - Modelo (55=NFe, 65=NFCe)
- nraserie - Série
- nraemissao - Data de emissão
- nrachave - Chave de acesso
- nrasituacao - Situação (0=normal, 1=cancelada)
- nraempresa - Código da empresa

### nrax - Notas Fiscais em Processamento
Notas aguardando autorização.

Campos principais:
- nraxcodigo (PK)
- nraxnumero - Número da nota
- nraxmodelo - Modelo
- nraxsituacao - Situação
- nraxxmlenvio - XML enviado
- nraxxmlretornosefaz - XML de retorno

### nrit - Itens da Nota Fiscal
Produtos/serviços da nota.

Campos principais:
- nritcodigo (PK)
- nritcodigonra - Código da nota
- nritproduto - Produto
- nritqtd - Quantidade
- nrittotal - Total do item
- nritbaseicms - Base de cálculo ICMS
- nritvlricms - Valor ICMS

### nritx - Itens em Processamento
Itens das notas em processamento.

Campos principais:
- (mesma estrutura de nrit)

### entcpa - Notas de Entrada (Compras)
NFe de compra recebidas.

Campos principais:
- entcpacodigo (PK)
- entcpadocumento - Número da nota
- entcpamodelo - Modelo
- entcpachave - Chave de acesso
- entcpaemissao - Data de emissão
- entcpafornecedor - Fornecedor
- entcpaxmlcompra - XML da nota

### entcpi - Itens de Compra
Produtos da nota de entrada.

Campos principais:
- entcpicodigo (PK)
- entcpicompra - Nota de entrada
- entcpiproduto - Produto
- entcpiqtd - Quantidade
- entcpitotal - Total

### nsu - Manifestação de Destinatário
Download de NFe de terceiros (NSU).

Campos principais:
- nsucodigo (PK)
- nsuchave - Chave da nota
- nsucnpj - CNPJ do emitente
- nsuoperacao - Tipo de operação
- nsusituacao - Situação
- nsuxml - XML da nota

---

## 7. MÓDULO DE ESTOQUE

### estoq - Saldo de Estoque
Saldo atual por produto/empresa.

Campos principais:
- estoqcodigo (PK)
- estoqproduto - Código do produto
- estoqempresa - Código da empresa
- estoqestoque - Quantidade em estoque (SALDO ATUAL)

### kardex - Movimentações de Estoque
Histórico de todas as movimentações.

Campos principais:
- kardexcodigo (PK)
- kardexdata - Data/hora da movimentação
- kardexproduto - Produto
- kardexqtdent - Quantidade entrada
- kardexqtdsai - Quantidade saída
- kardexestoque - Saldo após movimento
- kardexempresa - Código da empresa

**IMPORTANTE:** O saldo de estoque CORRETO é calculado pelo kardex:
```sql
SELECT SUM(kardexqtdent) - SUM(kardexqtdsai) 
FROM kardex 
WHERE kardexproduto = X
```

### cust - Custo Médio
Custo médio por produto.

Campos principais:
- custcodigo (PK)
- custproduto - Produto
- custmedcusto - Custo médio
- custdata - Data do cálculo

### lest - Locais de Estoque
Depósitos/locais de armazenamento.

Campos principais:
- lestcodigo (PK)
- lestdescricao - Descrição do local
- lestempresa - Código da empresa

---

## 8. MÓDULO DE FIDELIDADE

### prgc - Créditos de Fidelidade
Créditos de pontos/cashback.

Campos principais:
- prgccodigo (PK)
- prgcdata - Data do crédito
- prgccliente - Cliente
- prgcvalor - Valor creditado
- prgcempresa - Código da empresa

### prgd - Débitos de Fidelidade
Uso de pontos/cashback.

Campos principais:
- prgdcodigo (PK)
- prgddata - Data do débito
- prgdcarteira - Carteira de pontos
- prgdvalor - Valor debitado

### pctr - Extrato de Pontos
Movimentações de pontos.

Campos principais:
- pctrcodigo (PK)
- pctrdatahora - Data/hora
- pctrcnpjcpf - CPF do cliente
- pctrcredito - Pontos creditados
- pctrdebito - Pontos debitados
- pctrsaldo - Saldo de pontos

### ctpt - Carteiras de Pontos
Saldo de pontos por cliente.

Campos principais:
- pctgcodigo (PK)
- pctgcombustivel - Combustível
- pctgacumulado - Pontos acumulados

---

## 9. MÓDULO DE TEF / PAGAMENTOS

### cxcp - Pagamentos com Cartão
Transações de cartão no caixa.

Campos principais:
- cxcpcodigo (PK)
- cxcpdata - Data/hora
- cxcpvalor - Valor da transação
- cxcpoperadora - Operadora
- cxcpbandeira - Bandeira
- cxcpautorizacao - Código de autorização
- cxcpnsu - NSU da transação

### tefp - Transações TEF
Todas as transações via TEF.

Campos principais:
- tefpcodigo (PK)
- tefpdata - Data/hora
- tefpvalor - Valor
- tefpnsu - NSU
- tefpautorizacao - Código autorização

### tefb - Bandeiras
Cadastro de bandeiras de cartão.

Campos principais:
- tefbcodigo (PK)
- tefbdescricao - Nome da bandeira

### dvcc - Devoluções de Cartão
Estornos/cancelamentos.

Campos principais:
- dvcccodigo (PK)
- dvccdatahora - Data/hora
- dvccvalor - Valor devolvido
- dvccnsu - NSU original

### fdav - Formas de Pagamento Avulsas
Outras formas de pagamento.

Campos principais:
- fdavcodigo (PK)
- fdavdata - Data
- fdavvalor - Valor
- fdavforma - Forma de pagamento

---

## 10. INTEGRAÇÕES

### IPIRANGA (Abastece Aí)

#### ipay - Pagamentos Ipiranga
Transações via Abastece Aí.

Campos principais:
- ipaycodigo (PK)
- ipayaut - Código de autorização
- ipaycodigopedido - Código do pedido
- ipaynsu - NSU
- ipaystatus - Status da transação
- ipayempresa - Código da empresa

#### ipcmn - Comunicação Ipiranga
Log de comunicação com Ipiranga.

Campos principais:
- ipcmncodigo (PK)
- ipcmndata - Data/hora
- ipcmnjsonenvio - JSON enviado
- ipcmnjsonretorno - JSON retornado

#### ipco - Dados do Posto Ipiranga
Cadastro do posto na Ipiranga.

Campos principais:
- ipcocodigo (PK)
- ipcorazaosocial - Razão social
- ipcocodigopontovenda - Código na Ipiranga

#### ipiprod - Produtos Ipiranga
Produtos sincronizados com Ipiranga.

Campos principais:
- ipiprodcodigo (PK)
- ipiprodcodigoipiranga - Código Ipiranga
- ipiproddescricao - Descrição
- ipiprodcodigoanp - Código ANP

#### ipicabi - Conciliação Bancária Ipiranga
Recebimentos da Ipiranga.

Campos principais:
- ipicabicodigo (PK)
- ipicabidatahora - Data/hora
- ipicabivalorcompra - Valor da venda
- ipicabivalorreceber - Valor a receber
- ipicabitaxatransacao - Taxa cobrada
- ipicabistatus - Status do recebimento

### MERCADO PAGO

#### mpapp - Transações Mercado Pago
Pagamentos via Mercado Pago.

Campos principais:
- mpappcodigo (PK)
- mpappdata - Data/hora
- mpappqrcode - Código QR
- mpappvalor - Valor
- mpappstatus - Status
- mpappempresa - Código da empresa

#### mpcxa - Caixas Mercado Pago
Caixas vinculados ao Mercado Pago.

Campos principais:
- mpcxacodigo (PK)
- mpcxaidcaixa - ID do caixa no MP
- mpcxanomecaixa - Nome do caixa

#### mplja - Lojas Mercado Pago
Lojas cadastradas no MP.

Campos principais:
- mpljacodigo (PK)
- mpljaid - ID da loja
- mpljanome loja - Nome da loja
- mpljaaccesstoken - Token de acesso

#### mplog - Logs Mercado Pago
Histórico de comunicação.

Campos principais:
- mplogcodigo (PK)
- mplogdata - Data/hora
- mplogendpoint - Endpoint chamado
- mplogbody - Dados enviados
- mplogcontent - Resposta recebida

---

## CAMPOS COMUNS EM TODAS AS TABELAS

Quase todas as tabelas possuem:
- `xxxcodigo` - Chave primária
- `xxxempresa` - Código da empresa (sistema multiempresa)
- `xxxativo` - Data de ativação (quando aplicável)
- `xxxinativo` - Data de inativação (quando aplicável)

---

## CONVENÇÕES DE NOMENCLATURA

- **xxxcodigo** - Chave primária (PK)
- **xxxempresa** - Sempre filtrar por empresa
- **xxxdata** - Data/hora completa
- **xxxdatai/xxxdataf** - Data inicial/final
- **xxxqtd** - Quantidade
- **xxxvlr ou xxxtotal** - Valores monetários
- **xxxobs** - Observações

---

## RELACIONAMENTOS PRINCIPAIS

```
vda (1) ----< (N) vdit    [Venda → Itens]
vda (1) ---- (0,1) vdve   [Venda → Veículo]
prod (1) ----< (N) e_prod [Produto → Por Empresa]
part (1) ----< (N) e_part [Participante → Por Empresa]
part (1) ----< (N) veic   [Cliente → Veículos]
nra (1) ----< (N) nrit    [NFe → Itens]
```

---

## QUERIES ÚTEIS

### Saldo de Estoque Real (via Kardex)
```sql
SELECT 
    prod.proddescricao,
    SUM(kardexqtdent) - SUM(kardexqtdsai) AS estoque_real
FROM kardex
INNER JOIN prod ON prod.prodcodigo = kardex.kardexproduto
WHERE kardex.kardexempresa = 1
GROUP BY prod.proddescricao
ORDER BY prod.proddescricao;
```

### Média de KM Correta
```sql
SELECT 
    vdve.vdveplaca,
    vdve.vdvekm - LAG(vdve.vdvekm) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata) AS km_rodados,
    LAG(vdit.vditqtd) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata) AS litros_anterior,
    ROUND(
        (vdve.vdvekm - LAG(vdve.vdvekm) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata))::numeric / 
        LAG(vdit.vditqtd) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata),
        2
    ) AS media_correta
FROM vda
INNER JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
INNER JOIN vdve ON vdve.vdvecodigovda = vda.vdacodigo
WHERE vdve.vdveplaca = 'ABC1234'
ORDER BY vda.vdadata;
```

### Vendas do Dia
```sql
SELECT 
    vda.vdacodigo,
    vda.vdadata,
    part.partrazao AS cliente,
    vda.vdatotal
FROM vda
LEFT JOIN part ON part.partcodigo = vda.vdacliente
WHERE vda.vdadata::date = CURRENT_DATE
  AND vda.vdaempresa = 1
ORDER BY vda.vdadata DESC;
```

---

**Versão:** 1.0  
**Última atualização:** Abril 2026  
**Total de tabelas:** ~400
