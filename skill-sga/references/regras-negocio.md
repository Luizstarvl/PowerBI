# Regras de Negócio Extraídas do Banco

Informações de lógica de negócio identificadas através de campos de status, constraints e estrutura do banco.

---

## Campos de Status/Situação

Campos que controlam o estado de registros no sistema:

### cnac.cnacsituacao
- **Tipo:** character varying
- **Uso comum:** Controle de situação/status do registro

### cnar.cnarsituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### fatj.fatjsituacaoboleto
- **Tipo:** character varying
- **Uso comum:** Controle de situação/status do registro

### fatu.fatusituacaoboleto
- **Tipo:** character varying
- **Uso comum:** Controle de situação/status do registro

### flcp.flcpsituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### ipco.ipcosituacao
- **Tipo:** character varying
- **Uso comum:** Controle de situação/status do registro

### iva.ivasituacao
- **Tipo:** character varying
- **Uso comum:** Controle de situação/status do registro

### nra.nrasituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### nrax.nraxsituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### nsu.nsusituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### ospp.osppsituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

### ostp.ostpsituacao
- **Tipo:** integer
- **Uso comum:** Controle de situação/status do registro

---

## Tabelas de Alta Complexidade

Tabelas com 4+ índices indicam complexidade e importância no sistema:

### ABLG
- **Índices:** 8
- **Campos documentados:** 32
- **Primary Key:** ablgbico, ablgbomba, ablgcliente, ablgcodigo, ablgcombustivel, ablgempresa, ablgtanque, ablgvendedor

### ABPE
- **Índices:** 7
- **Campos documentados:** 33
- **Primary Key:** abpebico, abpebomba, abpecliente, abpecodigo, abpecombustivel, abpetanque, abpevendedor

### AFER
- **Índices:** 7
- **Campos documentados:** 16
- **Primary Key:** aferautomacao, aferbico, aferbomba, afercodigo, aferempresa, aferproduto, afertanque

### AJBC
- **Índices:** 7
- **Campos documentados:** 21
- **Primary Key:** ajbcautomacao, ajbcbico, ajbcbomba, ajbccodigo, ajbcempresa, ajbcproduto, ajbctanque

### ATUEXE
- **Índices:** 5
- **Campos documentados:** 10
- **Primary Key:** atexcodigo, atexempresa, atexnomeexe, atexreleasedepois, atexterminal

### CHQP
- **Índices:** 6
- **Campos documentados:** 34
- **Primary Key:** chqpagencia, chqpbanco, chqpbordero, chqpcc, chqpcheque, chqpcodigo

### CHQT
- **Índices:** 4
- **Campos documentados:** 23
- **Primary Key:** chqtcc, chqtcodigo, chqtempresa, chqtnumero

### CUST
- **Índices:** 5
- **Campos documentados:** 41
- **Primary Key:** custcodigo, custdata, custempresa, custproduto

### CXA
- **Índices:** 7
- **Campos documentados:** 44
- **Primary Key:** cxadataf, cxadatai, cxaempresa, cxamapa, cxanumero

### CXAB
- **Índices:** 7
- **Campos documentados:** 11
- **Primary Key:** cxabbico, cxabbomba, cxabcaixa, cxabcodigo, cxabcombustivel, cxabempresa, cxabtanque

### CXAF
- **Índices:** 5
- **Campos documentados:** 20
- **Primary Key:** cxafcaixa, cxafcodigo, cxafempresa, cxafmapa, cxaftransportadora

### CXAQ
- **Índices:** 4
- **Campos documentados:** 28
- **Primary Key:** cxaqcaixa, cxaqcodigo, cxaqempresa, cxaqmapa

### CXAT
- **Índices:** 5
- **Campos documentados:** 9
- **Primary Key:** cxatcaixa, cxatcodigo, cxatcombustivel, cxatempresa, cxattanque

### E_PROD
- **Índices:** 5
- **Campos documentados:** 141
- **Primary Key:** e_prodcodigo, e_prodempresa, e_prodproduto

### ENTCPA
- **Índices:** 6
- **Campos documentados:** 62
- **Primary Key:** entcpachegada, entcpacodigo, entcpaempresa, entcpastsgeral

### ENTCPI
- **Índices:** 5
- **Campos documentados:** 108
- **Primary Key:** entcpicodigo, entcpicompra, entcpiproduto

### ESTOQ
- **Índices:** 4
- **Campos documentados:** 21
- **Primary Key:** estoqcodigo, estoqempresa, estoqponto, estoqproduto

### FATJ
- **Índices:** 9
- **Campos documentados:** 45
- **Primary Key:** fatjbxcaixa, fatjbxccrr, fatjbxmapa, fatjbxtefb, fatjbxtefp, fatjcliente, fatjcobranca, fatjcodigo, fatjendereco

### FATU
- **Índices:** 4
- **Campos documentados:** 40
- **Primary Key:** fatucliente, fatucobranca, fatucodigo, fatuendereco

### FRET
- **Índices:** 4
- **Campos documentados:** 37
- **Primary Key:** fretcaixa, fretcodigo, fretempresa, frettransportadora

### IPICRED
- **Índices:** 5
- **Campos documentados:** 15
- **Primary Key:** ipicredambiente, ipicredempresa, ipicredterminal, ipicredtipo, ipicredtipocomponente

### KARDEX
- **Índices:** 10
- **Campos documentados:** 11
- **Primary Key:** kardexcodigo, kardexdata, kardexempresa, kardexlocal, kardexoperacao, kardexproduto, kardextipo

### LMC
- **Índices:** 9
- **Campos documentados:** 31
- **Primary Key:** lmccodigo, lmccombustivel, lmcdata, lmcempresa, lmcfolha, lmcperiodo

### LMCV
- **Índices:** 4
- **Campos documentados:** 9
- **Primary Key:** lmcvbico, lmcvcodigo, lmcvlmc, lmcvtanque

### MAPF
- **Índices:** 4
- **Campos documentados:** 7
- **Primary Key:** mapfcc, mapfcodigo, mapfempresa, mapfmapa

### NRA
- **Índices:** 5
- **Campos documentados:** 53
- **Primary Key:** nracliente, nracodigo, nraempresa, nraendereco, nramodelo

### NRAX
- **Índices:** 6
- **Campos documentados:** 57
- **Primary Key:** nraxcliente, nraxcodigo, nraxempresa, nraxendereco, nraxmodelo, nraxtransportador

### NRCP
- **Índices:** 4
- **Campos documentados:** 13
- **Primary Key:** nrcpcodigo, nrcpcodigonra, nrcpempresa, nrcpmodelo

### NRCPX
- **Índices:** 4
- **Campos documentados:** 14
- **Primary Key:** nrcpxcodigo, nrcpxcodigonrax, nrcpxempresa, nrcpxmodelo

### NRIT
- **Índices:** 7
- **Campos documentados:** 52
- **Primary Key:** nritcodigo, nritcodigonra, nritempresa, nritproduto, nritsticms, nritstipi, nritstpc

---

## Padrões Identificados

### Estrutura Multiempresa
- Praticamente todas as tabelas possuem campo `xxxempresa`
- Sempre necessário filtrar por empresa nas queries

### Auditoria e Rastreamento
- Muitas tabelas possuem campos de data de criação/alteração
- Campos de usuário responsável pela operação

### Relacionamentos Complexos
- PKs compostas em tabelas críticas (ablg, abpe, cxa, etc.)
- FKs múltiplas para garantir integridade referencial

