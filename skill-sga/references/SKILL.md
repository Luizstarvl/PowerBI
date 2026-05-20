---
name: SGA
description: >
  Especialista completo em SQL, scripts, análise de dados e diagnóstico para Sistema de Gerenciamento
  de Abastecimento (SGA) usando PostgreSQL. Base de dados com ~540 tabelas, 30+ stored procedures,
  48 views e regras de negócio documentadas. Use esta skill SEMPRE que o usuário mencionar:
  queries SQL, relatórios, análises, diagnóstico de problemas, scripts do sistema de posto.
  Domínios principais: vendas (vda/vdit), combustíveis (bico/bomb/tanq/lmc/ablg/abpe), 
  caixa (cxa/flux), estoque (estoq/kardex), NFe (nra/nrit), fidelidade (prgc/prgd),
  participantes/clientes (part/e_part), produtos (prod/e_prod), custo (cust), 
  integrações Ipiranga (ipay/ipco) e Mercado Pago (mpapp). Termos-chave: "posto", "abastecimento",
  "bico", "tanque", "LMC", "pista", "encerrante", "aferição", "comanda", "pré-venda", "frota",
  "fidelidade", "TEF", "Abastece Aí", "BR Premmia", "Ipiranga", "automação".
---

# SGA — Sistema de Gerenciamento de Abastecimento

## 📋 Visão Geral do Sistema

**PostgreSQL** com arquitetura multiempresa (~540 tabelas ativas).  
**Regra de ouro**: Quase todas as tabelas possuem campo `xxxempresa` — **sempre filtrar por empresa**.

### Documentação disponível
- `references/schema.md` — Schema completo das tabelas principais
- `references/comentarios-campos.md` — Descrição de 7000+ campos do banco
- `references/functions.md` — 30+ stored procedures documentadas
- `references/views.md` — 48 views disponíveis
- `references/indices.md` — Índices e performance
- `references/regras-negocio.md` — Validações e lógica extraída do banco

---

## 🏗️ Arquitetura e Convenções

### Convenções de nomenclatura

| Padrão | Significado | Exemplo |
|--------|-------------|---------|
| `xxxcodigo` | Chave primária (PK) | `vdacodigo`, `prodcodigo` |
| `xxxempresa` | Código da empresa (SEMPRE filtrar) | `vdaempresa`, `prodempresa` |
| `xxxdata` | Data/hora completa (timestamp) | `vdadata`, `nradata` |
| `xxxdatai` / `xxxdataf` | Data inicial / final | `cxadatai`, `cxadataf` |
| `xxxqtd` | Quantidade | `vditqtd`, `kardexqtd` |
| `xxxvlr` / `xxxtotal` | Valores monetários | `vdatotal`, `cxatotal` |
| `xxxativo` / `xxxinativo` | Datas de ativação/inativação | `prodativo`, `prodinativo` |
| `xxxsituacao` / `xxxstatus` | Estado/status do registro | `vdasituacao`, `nrasituacao` |
| `xxxobs` | Observações | `vdaobs`, `cxaobs` |

### Status e situações conhecidas

**Campos com enum documentado:**
```
• vdasituacao:  NULL = normal, 1 = cancelada
• nrasituacao:  NULL = normal, 1 = cancelada, 2 = inutilizada
• fatusituacaoboleto: 'aberto', 'pago', 'cancelado'
• ipcosituacao: status integração Ipiranga
• ostpsituacao: status ordem de serviço
```

---

## 📊 Módulos e Tabelas Principais

| Módulo | Tabelas-chave | Descrição |
|--------|--------------|-----------|
| **Vendas / PDV** | `vda`, `vdit`, `vdve`, `prvd`, `prit`, `pmvd`, `pmit` | Vendas, itens, veículos, pré-vendas, comandas |
| **Produtos** | `prod`, `e_prod`, `prou`, `prof`, `kits` | Cadastro de produtos por empresa |
| **Participantes** | `part`, `e_part`, `pars`, `parv`, `pard`, `veic` | Clientes, fornecedores, veículos |
| **Combustíveis / Pista** | `bico`, `bomb`, `tanq`, `ablg`, `abpe`, `lmc`, `lmce`, `afer` | Automação, abastecimento, LMC, aferições |
| **Caixa / Financeiro** | `cxa`, `cxab`, `flux`, `rece`, `recj`, `paga`, `pagj`, `mapc` | Caixa, fluxo, contas a receber/pagar |
| **Fiscal / NFe** | `nra`, `nrit`, `nrax`, `nritx`, `entcpa`, `entcpi`, `nsu` | Notas fiscais, entradas, NSU |
| **Estoque / Custo** | `estoq`, `kardex`, `cust`, `lest` | Estoque, movimentação, custeio |
| **Fidelidade** | `prgc`, `prgd`, `pctr`, `ctpt` | Programas de pontos e regras |
| **TEF / Pagamentos** | `cxcp`, `tefp`, `tefb`, `dvcc`, `fdav` | Transações eletrônicas |
| **Ipiranga** | `ipay`, `ipcmn`, `ipco`, `ipiprod`, `ipicabi`, `abbria` | Integração Ipiranga e BR Premmia |
| **Mercado Pago** | `mpapp`, `mpcxa`, `mplja`, `mplog` | Integração Mercado Pago |

### Tabelas críticas de alta complexidade
> Tabelas com 4+ índices e lógica de negócio robusta

**Combustível e Automação:**
- `ablg` — Abastecimento LOG (histórico completo) — 32 campos, PK composta de 8 campos
- `abpe` — Abastecimento PENDENTE (aguardando finalização) — 33 campos
- `afer` — Aferições de bombas — 16 campos, controla calibração
- `ajbc` — Ajustes de bico — 21 campos, correções manuais

**Caixa e Financeiro:**
- `cxa` — Fechamento de caixa — 44 campos incluindo conferência de moedas
- `cxab` — Bicos por caixa — rastreamento por operador
- `cxaq` — Cheques no caixa — 28 campos
- `cxaf` — Carta frete — 20 campos, cálculo (J)á calculado / (A)diantamento / (S)aldo

**Produtos e Custo:**
- `e_prod` — Produtos por empresa — 141 campos (tributação, preços, markup, etc.)
- `cust` — Histórico de custo — 41 campos, rastreio de variações

**Entrada de mercadorias:**
- `entcpa` — Cabeçalho de compra — 62 campos
- `entcpi` — Itens de compra — 108 campos (maior tabela documentada)

**Contas a receber:**
- `fatu` — Fatura a receber — 40 campos incluindo boleto/PIX
- `fatj` — Baixas de fatura — 45 campos

---

## ⚠️ Regras de Negócio Críticas

### 1. Estoque
❌ **NUNCA confie em `estoq.estoqestoque`** — pode estar desatualizado.  
✅ **Saldo real** = sempre calcular pelo kardex:

```sql
SELECT SUM(kardexqtdent) - SUM(kardexqtdsai) AS estoque_real
FROM kardex
WHERE kardexproduto = :produto AND kardexempresa = :empresa;
```

### 2. Média de consumo de veículos
❌ **Campo `vdvemedia` está INCORRETO** — usa litros do abastecimento atual em vez do anterior.  
✅ **Calcular corretamente** via window function:

```sql
SELECT
    vdve.vdveplaca,
    ROUND(
        (vdve.vdvekm - LAG(vdve.vdvekm) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata))::numeric /
        NULLIF(LAG(vdit.vditqtd) OVER (PARTITION BY vdve.vdveplaca ORDER BY vda.vdadata), 0),
        2
    ) AS media_correta_km_l
FROM vda
INNER JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
INNER JOIN vdve ON vdve.vdvecodigovda = vda.vdacodigo
WHERE vdve.vdveplaca = :placa
ORDER BY vda.vdadata;
```

### 3. Vendas e NFe canceladas
```sql
-- Venda cancelada
vda.vdasituacao = 1  -- Sempre filtrar vdasituacao IS NULL para vendas válidas

-- NFe cancelada
nra.nrasituacao = 1  -- Cancelada
nra.nrasituacao = 2  -- Inutilizada

-- Modelos fiscais
nra.nramodelo = 55   -- NFe
nra.nramodelo = 65   -- NFCe
```

### 4. Produtos ativos
```sql
-- Produto ativo globalmente
WHERE prodinativo IS NULL

-- Produto ativo por empresa
WHERE e_prodinativo IS NULL
```

### 5. Multiempresa
🚨 **CRÍTICO**: Sistema é multiempresa. Quase toda query DEVE incluir filtro de empresa:
```sql
WHERE xxxempresa = :codigo_empresa
```

### 6. Abastecimento (ABLG vs ABPE)
```
ablg — Registro permanente (histórico completo)
abpe — Registro temporário (até venda ser finalizada)
```

Abastecimento segue o fluxo:
1. Automação registra em `abpe` (pendente)
2. PDV finaliza venda → cria registro em `ablg`
3. Registro em `abpe` pode ser deletado ou mantido para auditoria

### 7. Carta Frete (cálculo)
```
cxafcalculo / fretcalculo:
  (J) = Já calculado (valor final)
  (A) = Adiantamento (parcial)
  (S) = Saldo (diferença)
```

---

## 🔗 Relacionamentos Principais

```
vda      (1) ----< (N) vdit      vditcodigovda = vdacodigo
vda      (1) ---- (0,1) vdve     vdvecodigovda = vdacodigo
prod     (1) ----< (N) e_prod    e_prodproduto = prodcodigo
part     (1) ----< (N) e_part    e_partparticipante = partcodigo
part     (1) ----< (N) veic      veicparticipante = partcodigo
nra      (1) ----< (N) nrit      nritcodigonra = nracodigo
bico     (N) ----> (1) bomb      bicobomba = bombcodigo
bico     (N) ----> (1) tanq      bicotanque = tanqcodigo
bico     (1) ----< (N) ablg      ablgbico = bicocodigo
lmc      (1) ----< (N) lmce      lmcelmc = lmccodigo
lmc      (1) ----< (N) lmcv      lmcvlmc = lmccodigo
cxa      (1) ----< (N) cxab      cxabcaixa = cxanumero
```

---

## 📚 Functions e Views Disponíveis

### Top Functions
Ver lista completa em `references/functions.md`:
- `abastecimento_pago_brpremmia(empresa, codigo)` — Verifica se abastecimento foi pago via BR Premmia
- `adrccodcompras(periodo, produto, estoquemin)` — Retorna códigos de compras para controle de estoque
- `ajprdiferenca(pcodigo, pretorno)` — Calcula diferenças de ajuste de produtos
- `arquivarentcpa(codigo, tipo)` — Arquiva entrada de compra
- `arredondarvalor(valor, decimais)` — Arredondamento customizado

### Top Views
Ver lista completa em `references/views.md`:
- `vw_categorias_pam` — Categorias para integração PAM
- `vw_caxias_vendas` — Vendas formatadas para Caxias
- `vw_estoqueatual` — Estoque atual consolidado
- `vw_dados_de_custo` — Custos agregados por produto
- `vw_comanda_tecnibra` — Comandas para integração Tecnibra

---

## 🔍 Queries Prontas de Referência

### Vendas do dia com cliente
```sql
SELECT
    vda.vdacodigo,
    vda.vdadata,
    COALESCE(part.partrazao, 'Consumidor') AS cliente,
    vda.vdatotal
FROM vda
LEFT JOIN part ON part.partcodigo = vda.vdacliente
WHERE vda.vdadata::date = CURRENT_DATE
  AND vda.vdaempresa = :empresa
  AND vda.vdasituacao IS NULL
ORDER BY vda.vdadata DESC;
```

### Faturamento por produto no período
```sql
SELECT
    prod.proddescricao,
    SUM(vdit.vditqtd)    AS qtd_total,
    SUM(vdit.vdittotal)  AS faturamento
FROM vdit
INNER JOIN vda  ON vda.vdacodigo   = vdit.vditcodigovda
INNER JOIN prod ON prod.prodcodigo = vdit.vditproduto
WHERE vda.vdadata BETWEEN :data_ini AND :data_fim
  AND vda.vdaempresa = :empresa
  AND vda.vdasituacao IS NULL
GROUP BY prod.proddescricao
ORDER BY faturamento DESC;
```

### LMC — Movimentação de combustível do mês
```sql
SELECT
    prod.proddescricao AS combustivel,
    lmc.lmcabertura,
    lmc.lmccompra,
    lmc.lmcvenda,
    lmc.lmcfechamento,
    lmc.lmcabertura + lmc.lmccompra - lmc.lmcvenda AS calculado,
    lmc.lmcfechamento - (lmc.lmcabertura + lmc.lmccompra - lmc.lmcvenda) AS divergencia
FROM lmc
INNER JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
WHERE lmc.lmcperiodo = TO_CHAR(CURRENT_DATE, 'YYYYMM')::int
  AND lmc.lmcempresa = :empresa;
```

### Saldo de estoque real pelo kardex
```sql
SELECT
    prod.proddescricao,
    SUM(kardexqtdent) - SUM(kardexqtdsai) AS estoque_real,
    estoq.estoqestoque AS estoque_sistema,
    (SUM(kardexqtdent) - SUM(kardexqtdsai)) - COALESCE(estoq.estoqestoque, 0) AS divergencia
FROM kardex
INNER JOIN prod ON prod.prodcodigo = kardex.kardexproduto
LEFT JOIN estoq ON estoq.estoqproduto = prod.prodcodigo 
               AND estoq.estoqempresa = kardex.kardexempresa
WHERE kardex.kardexempresa = :empresa
GROUP BY prod.proddescricao, estoq.estoqestoque
HAVING ABS((SUM(kardexqtdent) - SUM(kardexqtdsai)) - COALESCE(estoq.estoqestoque, 0)) > 0.01
ORDER BY ABS(divergencia) DESC;
```

### Contas a receber em aberto
```sql
SELECT
    rece.rececodigo,
    part.partrazao AS cliente,
    rece.recevencimento,
    rece.recevalor,
    COALESCE(SUM(recj.recjvalor), 0) AS valor_pago,
    rece.recevalor - COALESCE(SUM(recj.recjvalor), 0) AS saldo_aberto,
    CASE
        WHEN rece.recevencimento < CURRENT_DATE THEN 'VENCIDO'
        WHEN rece.recevencimento = CURRENT_DATE THEN 'VENCE HOJE'
        ELSE 'A VENCER'
    END AS status
FROM rece
LEFT JOIN recj ON recj.recjrece = rece.rececodigo
LEFT JOIN part ON part.partcodigo = rece.rececliente
WHERE rece.receempresa = :empresa
GROUP BY rece.rececodigo, part.partrazao, rece.recevencimento, rece.recevalor
HAVING rece.recevalor - COALESCE(SUM(recj.recjvalor), 0) > 0.01
ORDER BY 
    CASE WHEN rece.recevencimento < CURRENT_DATE THEN 1 ELSE 2 END,
    rece.recevencimento;
```

### Encerrantes por bico (comparação automação vs vendas)
```sql
WITH encerrantes_automacao AS (
    SELECT
        ablgbico,
        COUNT(*) AS total_abastecimentos,
        SUM(ablgqtd) AS total_litros_automacao
    FROM ablg
    WHERE ablgdata::date BETWEEN :data_ini AND :data_fim
      AND ablgempresa = :empresa
    GROUP BY ablgbico
),
encerrantes_vendas AS (
    SELECT
        vdit.vditbico,
        COUNT(*) AS total_vendas,
        SUM(vdit.vditqtd) AS total_litros_vendas
    FROM vdit
    INNER JOIN vda ON vda.vdacodigo = vdit.vditcodigovda
    WHERE vda.vdadata::date BETWEEN :data_ini AND :data_fim
      AND vda.vdaempresa = :empresa
      AND vda.vdasituacao IS NULL
      AND vdit.vditbico IS NOT NULL
    GROUP BY vdit.vditbico
)
SELECT
    bico.bicocodigo,
    bico.bicodescricao,
    COALESCE(ea.total_abastecimentos, 0) AS abastecimentos_automacao,
    COALESCE(ev.total_vendas, 0) AS vendas_sistema,
    COALESCE(ea.total_litros_automacao, 0) AS litros_automacao,
    COALESCE(ev.total_litros_vendas, 0) AS litros_vendas,
    COALESCE(ea.total_litros_automacao, 0) - COALESCE(ev.total_litros_vendas, 0) AS divergencia_litros
FROM bico
LEFT JOIN encerrantes_automacao ea ON ea.ablgbico = bico.bicocodigo
LEFT JOIN encerrantes_vendas ev ON ev.vditbico = bico.bicocodigo
WHERE bico.bicoempresa = :empresa
  AND (ea.total_abastecimentos IS NOT NULL OR ev.total_vendas IS NOT NULL)
ORDER BY ABS(COALESCE(ea.total_litros_automacao, 0) - COALESCE(ev.total_litros_vendas, 0)) DESC;
```

---

## 🎯 Boas Práticas ao Gerar SQL

1. **Sempre incluir filtro de empresa** (`xxxempresa = :empresa`)
2. **Usar parâmetros** (`:nome`) em vez de valores fixos, exceto em exemplos
3. **Datas**: usar `::date` para comparar apenas data, `BETWEEN` para intervalos
4. **LEFT JOIN** em clientes/produtos quando podem ser nulos
5. **Comentar** queries complexas com `--`
6. **Window functions** (`LAG`, `LEAD`, `ROW_NUMBER`) para análises sequenciais
7. **NULLIF** para evitar divisão por zero
8. **COALESCE** para valores nulos em somas e exibições
9. **CTEs (WITH)** para queries complexas com múltiplas etapas
10. **ROUND()** para valores monetários (2 casas) e percentuais

---

## 📋 Relatórios Comuns Solicitados

### Operacionais
- Faturamento diário / mensal / por produto / por cliente
- Movimentação de combustível (LMC) / encerrantes por bico
- Histórico de abastecimentos por placa / frota
- Ranking de clientes / produtos mais vendidos

### Financeiros
- Contas a receber / pagar / fluxo de caixa
- Conciliação de pagamentos (cartão, Ipiranga, Mercado Pago)
- Fechamento de caixa / conferência

### Fiscais
- Relatório de NFe emitidas / canceladas
- Inutilizações de numeração
- Entradas de mercadoria

### Estoque
- Estoque atual e histórico (kardex)
- Divergências estoque x kardex
- Custo médio por produto

### Fidelidade
- Pontuação e saldo de fidelidade por cliente
- Campanhas de pontos ativas

---

## 🔧 Diagnóstico de Problemas

### Divergências comuns

**1. Estoque x Kardex**
```sql
-- Identificar divergências
SELECT 
    prod.proddescricao,
    estoq.estoqestoque AS sistema,
    SUM(kardexqtdent) - SUM(kardexqtdsai) AS kardex,
    estoq.estoqestoque - (SUM(kardexqtdent) - SUM(kardexqtdsai)) AS diferenca
FROM estoq
INNER JOIN kardex ON kardex.kardexproduto = estoq.estoqproduto
INNER JOIN prod ON prod.prodcodigo = estoq.estoqproduto
WHERE estoq.estoqempresa = :empresa
GROUP BY prod.proddescricao, estoq.estoqestoque
HAVING ABS(estoq.estoqestoque - (SUM(kardexqtdent) - SUM(kardexqtdsai))) > 0.01;
```

**2. Abastecimento não registrado (ABLG sem VDA correspondente)**
```sql
SELECT
    ablg.ablgcodigo,
    ablg.ablgbico,
    ablg.ablgdata,
    ablg.ablgqtd,
    ablg.ablgunitario,
    ablg.ablgqtd * ablg.ablgunitario AS valor_total,
    'Sem venda correspondente' AS problema
FROM ablg
WHERE ablg.ablgempresa = :empresa
  AND ablg.ablgdata::date = :data
  AND NOT EXISTS (
      SELECT 1 FROM vdit 
      WHERE vdit.vditbico = ablg.ablgbico
        AND vdit.vditqtd = ablg.ablgqtd
        AND EXISTS (
            SELECT 1 FROM vda 
            WHERE vda.vdacodigo = vdit.vditcodigovda
              AND vda.vdadata::date = ablg.ablgdata::date
        )
  );
```

**3. LMC com divergências**
```sql
-- Detectar diferenças entre fechamento informado e calculado
SELECT
    prod.proddescricao,
    lmc.lmcabertura AS abertura,
    lmc.lmccompra AS compras,
    lmc.lmcvenda AS vendas,
    lmc.lmcfechamento AS fechamento_informado,
    lmc.lmcabertura + lmc.lmccompra - lmc.lmcvenda AS fechamento_calculado,
    lmc.lmcfechamento - (lmc.lmcabertura + lmc.lmccompra - lmc.lmcvenda) AS divergencia
FROM lmc
INNER JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
WHERE lmc.lmcempresa = :empresa
  AND lmc.lmcperiodo = :periodo
  AND ABS(lmc.lmcfechamento - (lmc.lmcabertura + lmc.lmccompra - lmc.lmcvenda)) > 0.5;
```

---

## 📖 Documentação Complementar

Consulte os arquivos de referência para informações detalhadas:

- **Schema completo**: `references/schema.md`
- **Comentários de campos**: `references/comentarios-campos.md`
- **Functions**: `references/functions.md`
- **Views**: `references/views.md`
- **Índices**: `references/indices.md`
- **Regras de negócio**: `references/regras-negocio.md`
