# Views do Sistema

Total: 48 views disponíveis

---

## 1. vw_categorias_pam

**Definição (primeiros 200 caracteres):**

```sql
 SELECT tprocodigo AS id,
    tprodescricao AS categoria,
    tprodataalteracao AS dtatualizacao
   FROM tpro
  WHERE (tprocodigo IN ( SELECT prod.prodtipo
           FROM (prod
             JOIN e_pr
```

---

## 2. vw_caxias_vendas

**Definição (primeiros 200 caracteres):**

```sql
 SELECT vda.vdacodigo AS codigo,
    vda.vdaidentidade AS documento,
    vda.vdamovimento AS data,
    vda.vdavendedor AS frentistacodigo,
    v.partrazao AS frentistanome,
        CASE
            WH
```

---

## 3. vw_comanda_tecnibra

**Definição (primeiros 200 caracteres):**

```sql
 SELECT pmvdcartao
   FROM pmvd;
```

---

## 4. vw_combos_pam

**Definição (primeiros 200 caracteres):**

```sql
 SELECT DISTINCT prod.prodcodigo AS id,
    prod.proddescricao AS combo,
    prod.proddataalteracao AS dtatualizacao,
    kits.kitsempresa AS idempresa
   FROM (prod
     JOIN kits ON ((kits.kitscombo
```

---

## 5. vw_dados_de_custo

**Definição (primeiros 200 caracteres):**

```sql
 SELECT ( SELECT cfg.cfgconteudo
           FROM cfg
          WHERE ((cfg.cfgcampo)::text = 'LICRAZAO'::text)
         LIMIT 1) AS empresa,
    ( SELECT cfg.cfgconteudo
           FROM cfg
          
```

---

## 6. vw_dados_de_custo_combustivel

**Definição (primeiros 200 caracteres):**

```sql
 SELECT ( SELECT cfg.cfgconteudo
           FROM cfg
          WHERE ((cfg.cfgcampo)::text = 'LICRAZAO'::text)
         LIMIT 1) AS cfgconteudo,
    (cust.custdata)::date AS custdata,
    prod.prodcod
```

---

## 7. vw_donuz_clientes

**Definição (primeiros 200 caracteres):**

```sql
 SELECT part.partcnpjcpf AS cpfcnpj,
    part.partrazao AS nome,
    (
        CASE
            WHEN ((((('('::text || part.partfoneddd) || ') '::text) || part.partfonepre) || part.partfonesuf) = '(0)
```

---

## 8. vw_donuz_vendas

**Definição (primeiros 200 caracteres):**

```sql
 SELECT vda.vdacodigo AS codigo,
    vda.vdamovimento AS data,
        CASE
            WHEN (vda.vdacliente > 0) THEN part.partcnpjcpf
            ELSE vdcl.vdclcnpjcpf
        END AS cpfcnpj,
    ( 
```

---

## 9. vw_estoqueatual

**Definição (primeiros 200 caracteres):**

```sql
 SELECT DISTINCT ON (kardexproduto, kardexempresa, kardexlocal) kardexproduto AS vwproduto,
    kardexempresa AS vwempresa,
    kardexlocal AS vwlocal,
    kardexestoque AS vwestoque,
    kardexdata A
```

---

## 10. vw_estoquegeral

**Definição (primeiros 200 caracteres):**

```sql
 WITH ultimos AS (
         SELECT DISTINCT ON (kardex.kardexproduto, kardex.kardexempresa, kardex.kardexlocal) kardex.kardexproduto,
            kardex.kardexempresa,
            kardex.kardexlocal,

```

---

## 11. vw_estoques_pam

**Definição (primeiros 200 caracteres):**

```sql
 SELECT DISTINCT prod.prodcodigo AS id,
    prod.prodgrupo,
    estoq.estoqempresa AS idempresa,
    0 AS estoque,
    estoq.estoqdataalteracao AS dtatualizacao
   FROM ((estoq
     JOIN prod ON ((pro
```

---

## 12. vw_fidelidade_clientes

**Definição (primeiros 200 caracteres):**

```sql
 SELECT part.partcnpjcpf AS cpfcnpj,
    part.partrazao AS nome,
    (
        CASE
            WHEN ((((('('::text || part.partfoneddd) || ') '::text) || part.partfonepre) || part.partfonesuf) = '(0)
```

---

## 13. vw_fidelidade_vendas

**Definição (primeiros 200 caracteres):**

```sql
 SELECT vda.vdacodigo AS codigo,
    vda.vdamovimento AS data,
        CASE
            WHEN (vda.vdacliente > 0) THEN part.partcnpjcpf
            ELSE vdcl.vdclcnpjcpf
        END AS cpfcnpj,
    ( 
```

---

## 14. vw_gertecleitorpreco

**Definição (primeiros 200 caracteres):**

```sql
 WITH codigosseparados AS (
         SELECT TRIM(BOTH FROM cod.cod) AS codbarra,
            prod.prodresumo AS descricao,
            e_prod.e_prodv1 AS preco1,
            calcularegrapreco((e_prod.
```

---

## 15. vw_postef_abastec

**Definição (primeiros 200 caracteres):**

```sql
 SELECT abpecodigo AS nro_abastec,
    abpedata AS data,
    abpebico AS bico,
    abpecombustivel AS produto,
    abpevendedor AS vendedor,
    abpeqtd AS qtd,
    COALESCE(abpemarcado, ''::character
```

---

## 16. vw_postef_bico

**Definição (primeiros 200 caracteres):**

```sql
 SELECT b.bicocodigo AS cod_bico,
    substring"((p.prodresumo)::text, 1, 20) AS comb,
```

---

## 17.     "substring"((p.prodsigla)::text, 1, 3) AS sigla,

---

## 18.     p.prodwslmccodigo AS cod_ws_combustivel

---

## 19.    FROM ((bico b

---

## 20.      JOIN tanq t ON ((b.bicotanque = t.tanqcodigo)))

---

## 21.      JOIN prod p ON ((t.tanqproduto = p.prodcodigo)))

---

## 22.   ORDER BY b.bicocodigo;"

---

## 23. vw_postef_config

**Definição (primeiros 200 caracteres):**

```sql
 SELECT cptserie AS equipamento,
    cptfiltro AS filtro_tipo_abastecimento,
    cptlisdin AS lis_din,
    cptliscomb AS lis_ct,
    cptliscomb AS lis_comb,
    cptlisprod AS lis_prod,
    cptprcpadra
```

---

## 24. vw_postef_produto

**Definição (primeiros 200 caracteres):**

```sql
 SELECT prod.prodcodigo AS codigo,
    translate(translate((prod.proddescricao)::text, '&'::text, 'E'::text), '*;.'::text, ''::text) AS descricao,
    prod.prodbarra AS barra,
    prod.prodv1 AS vlr_u
```

---

## 25. vw_precos_pam

**Definição (primeiros 200 caracteres):**

```sql
 SELECT DISTINCT ep.e_prodproduto AS id,
    ep.e_prodv1 AS preco,
    p.prodgrupo,
    ep.e_proddataalteracao AS dtatualizacao,
    ep.e_prodempresa AS idempresa
   FROM (e_prod ep
     JOIN prod p O
```

---

## 26. vw_prod_id_nome_preco

**Definição (primeiros 200 caracteres):**

```sql
 SELECT prod.prodcodigo AS ID",
```

---

## 27.     prod.prodresumo AS "NOME",

---

## 28.     vlcx.vlcxv1 AS "PREÇO"

---

## 29.    FROM (prod

---

## 30.      JOIN vlcx ON ((prod.prodcodigo = vlcx.vlcxcombustivel)))

---

## 31.   WHERE (prod.prodtipo = 1)

---

## 32.   ORDER BY prod.prodcodigo;"

---

## 33. vw_produtos_pam

**Definição (primeiros 200 caracteres):**

```sql
 SELECT DISTINCT ON (prod.prodcodigo) prod.prodcodigo AS id,
    prod.proddescricao AS produto,
    prod.prodtipo,
    prod.prodgrupo,
        CASE
            WHEN (prod.proddataalteracao > e_prod.e_
```

---

## 34. vw_tank_pay_vendas

**Definição (primeiros 200 caracteres):**

```sql
 WITH itens AS (
         SELECT a_1.vdaempresa,
            a_1.vdacodigo,
            vdit.vdititem AS cd_item,
            vdit.vditproduto AS cd_product,
            prod.proddescricao AS ds_produ
```

---

## 35. vw_tank_pay_vendas_canceladas

**Definição (primeiros 200 caracteres):**

```sql
 WITH nf AS (
         SELECT DISTINCT ON (vdnf.vdnfempresa, vdnf.vdnfcodigovda) vdnf.vdnfempresa,
            vdnf.vdnfcodigovda,
            vdnf.vdnfnumero,
            vdnf.vdnfserie,
            
```

---

## 36. vw_telnet_produto

**Definição (primeiros 200 caracteres):**

```sql
 SELECT prod.prodcodigo,
    prod.proddescricao,
    e_prod.e_prodv1
   FROM (prod
     JOIN e_prod ON ((prod.prodcodigo = e_prod.e_prodproduto)))
  WHERE ((prod.prodtipo = 1) AND (e_prod.e_prodinativ
```

---

## 37. vw_vendascartao

**Definição (primeiros 200 caracteres):**

```sql
 SELECT (vda.vdacodigo)::character varying(40) AS cderp,
    (((((tefo.tefocodigo)::character varying(4))::text || '-'::text) || ((tefd.tefdcodigo)::character varying(5))::text))::character varying(10
```

---

## 38. vw_vendascartaotitulos

**Definição (primeiros 200 caracteres):**

```sql
 WITH titulos AS (
         SELECT rece.rececodigo AS codrec,
            (rece.recevenda)::character varying(40) AS codvenda,
            rece.receempresa AS codempresa,
            NULL::date AS dat
```

---

## 39.             ELSE NULL::integer

---

## 40.         END) AND (cxac.cxacempresa = titulossemvenda.codempresa) AND ((cxac.cxacchave)::text = (titulossemvenda.chave)::text))))

---

## 41.      LEFT JOIN cxae ON (((cxae.cxaecodigo = cxac.cxaccodigo) AND (cxae.cxaeempresa = cxac.cxacempresa))))

---

## 42.      LEFT JOIN tefc ON ((((tefc.tefcchave)::text = (cxac.cxacchave)::text) AND (tefc.tefcempresa = cxac.cxacempresa))))

---

## 43.      LEFT JOIN cxa ON (((cxa.cxanumero = cxac.cxaccaixa) AND (cxa.cxaempresa = cxac.cxacempresa))))

---

## 44.      LEFT JOIN tcxr ON (((tcxr.tcxrcodigo = cxa.cxaturno) AND (tcxr.tcxrempresa = cxac.cxacempresa))))

---

## 45.      LEFT JOIN tefd ON ((tefd.tefdcodigo = tefc.tefcbandeira)))

---

## 46.      LEFT JOIN tefo ON ((tefo.tefocodigo = tefc.tefcoperadora)))

---

## 47.      LEFT JOIN emp ON ((emp.empcodigo = cxac.cxacempresa)))

---

## 48.   WHERE (1 = 1);"

---

