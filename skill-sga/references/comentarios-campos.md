# Comentários de Campos do Banco de Dados

Total: 7257 campos documentados em 538 tabelas

---

## ABBRIA

**20 campos documentados**

- **abbriabico**: Bico Abastecimento
- **abbriacodigo**: Codigo Sequencial
- **abbriacodigoabpe**: Codigo ABPE/ABLG
- **abbriacodigovda**: Código VDA
- **abbriacombustivel**: Código Combustível
- **abbriadataabpe**: Data Abastecimento
- **abbriadatacapturaabpe**: Data Captura Abastecimento
- **abbriaempresa**: Codigo Empresa
- **abbriajsonsupplyenvio**: JSON Envio Supply
- **abbriajsonsupplyretorno**: JSON Retorno Supply
- **abbriajsonsupplystatus**: JSON Status Supply
- **abbriamarcado**: TERMINAL que reservou
- **abbriaquantidade**: Litragem Abastecimento
- **abbriastatus**: Status: 0-Pendente, 1-Enviado Sem Atendente, 2-Enviado Com Atendente, 3-Pré Pagamento, 4-Pago, 5-Emitido Venda, 6-EnviouSellOut
- **abbriasupplyid**: BR Supply ID
- **abbriatotal**: Valor Total
- **abbriavalorunitario**: Valor Unitário
- **abbriavendedor**: Código Vendedor ATDE
- **abbriavendedornomenome**: Nome Vendedor BR Premmia
- **abbriavendedorpremmia**: Código Vendedor BR Premmia

---

## ABLG

**32 campos documentados**

- **ablgbico**: Codigo do Bico (FK)
- **ablgbomba**: Codigo da Bomba (FK)
- **ablgcaixa**: Número do Caixa
- **ablgcaptura**: Data da Captura do Abastecimento
- **ablgcliente**: Codigo do Cliente (FK)
- **ablgclientetag**: Tag do Cliente
- **ablgcodigo**: Codigo Sequencial
- **ablgcombustivel**: Codigo do Combustivel (FK)
- **ablgdata**: Data do Abastecimento
- **ablgempresa**: Código da Empresa (FK)
- **ablgenceraut**: Encerrante da Automacao antes do Abastecimento
- **ablgencerfim**: Encerrante Final capturado no Abastecimento
- **ablgencerfixod**: Encerrante Documento Original
- **ablgencerfixof**: Encerrante Final Fixo em Cancelamento
- **ablgencerini**: Encerrante Inicial capturado no Abastecimento, correto abpeenceraut=abpeencerini
- **ablgencersis**: Encerrante do Sistema no Momento do Abastecimento
- **ablghash**: Hash de integridade
- **ablgid**: Codigo ID do Abastecimento
- **ablglog**: Codigo Log do Abastecimento (LABACODIGO)
- **ablgobs**: Observacoes
- **ablgodometro**: Odometro Informado
- **ablgplaca**: Placa do Veiculo
- **ablgqtd**: Quantidade de Abastecimento
- **ablgrecebido**: Flag do Terminal Marcado como Recebido
- **ablgsorteio**: Numero de Pontos Sorteado no Abastecimento
- **ablgstatus**: Flag de Status
- **ablgtabelafixa**: Tabela Fixa
- **ablgtanque**: Codigo do Tanque (FK)
- **ablgtotal**: Valor Total do Abastecimento
- **ablgunit**: Valor Unitario do Abastecimento
- **ablgvendedor**: Codigo do Vendedor (FK)
- **ablgvendedortag**: Tag do Vendedor

---

## ABPE

**33 campos documentados**

- **abpebico**: Codigo do Bico (FK)
- **abpebomba**: Codigo da Bomba (FK)
- **abpecaixa**: Número do Caixa
- **abpecaptura**: Data da Captura do Abastecimento
- **abpecliente**: Codigo do Cliente (FK)
- **abpeclientetag**: Tag do Cliente
- **abpecodigo**: Codigo Sequencial
- **abpecombustivel**: Codigo do Combustivel (FK)
- **abpedata**: Data do Abastecimento
- **abpeempresa**: Codigo da Empresa (FK)
- **abpeenceraut**: Encerrante da Automacao antes do Abastecimento
- **abpeencerfim**: Encerrante Final capturado no Abastecimento
- **abpeencerfixod**: Encerrante Documento Original
- **abpeencerfixof**: Encerrante Final   Fixo em Cancelamento
- **abpeencerini**: Encerrante Inicial capturado no Abastecimento, correto abpeenceraut=abpeencerini
- **abpeencersis**: Encerrante do Sistema no Momento do Abastecimento
- **abpehash**: Hash de integridade
- **abpeid**: Codigo ID do Abastecimento
- **abpelog**: Codigo Log do Abastecimento (LABACODIGO)
- **abpemarcado**: Flag do Terminal Marcado para Venda
- **abpeobs**: Observacoes
- **abpeoculta**: Oculta abastecimento na grid: 0-Nao 1-Sim
- **abpeodometro**: Odometro Informado
- **abpeplaca**: Placa do Veiculo
- **abpeqtd**: Quantidade de Abastecimento
- **abperecebido**: Flag do Terminal Marcado como Recebido
- **abpesorteio**: Numero de Pontos Sorteado no Abastecimento
- **abpetabelafixa**: Tabela Fixa
- **abpetanque**: Codigo do Tanque (FK)
- **abpetotal**: Valor Total do Abastecimento
- **abpeunit**: Valor Unitario do Abastecimento
- **abpevendedor**: Codigo do Vendedor (FK)
- **abpevendedortag**: Tag do Vendedor

---

## ACRDT

**5 campos documentados**

- **acrdtcodigo**: Codigo Sequencial
- **acrdtdata**: Data Hora
- **acrdtempresa**: Codigo Empresa
- **acrdtjsondiff**: Json Diferença
- **acrdtproduto**: Codigo Produto

---

## ADMTRANSP

**3 campos documentados**

- **admtranspcodigo**: Sequencia da Tabela
- **admtransppartcodigo**: Codigo da Transportadora
- **admtransppartmaster**: Codigo da Administradora

---

## AFER

**16 campos documentados**

- **aferautomacao**: Codigo da Automacao (FK)
- **aferbico**: Codigo do Bico (FK)
- **aferbomba**: Codigo do Bomba (FK)
- **afercaixa**: Numero do Caixa
- **afercodigo**: Codigo
- **aferdata**: Data e hora da Afericao
- **aferempresa**: Codigo da Empresa
- **aferencerranteaut**: Encerrante da Automacao no momento da Afericao
- **aferencerrantesis**: Encerrante do Sistema no momento da Afericao
- **aferhistorico**: Historico da Afericao
- **afermovimento**: Data do Movimento
- **aferproduto**: Codigo do Produto (FK)
- **aferqtd**: Quantidade da Afericao
- **afertanque**: Codigo do Tanque (FK)
- **aferusuario**: usuario ou caixa frentista que realizou a afericao
- **afervenda**: Preço de Venda do combustível no momento da aferição

---

## AGDE

**10 campos documentados**

- **agdeagendadoem**: Data Agendamento
- **agdecampolivre**: Campo Livre
- **agdecodigo**: Código PK tabela
- **agdeemail**: Email destinatário (apenas 1 email)
- **agdeempresa**: Empresa (FK)
- **agdeid**: PK do Item a enviar
- **agdeinfo**: Info do envio
- **agdeprocessadoem**: Data Processamento
- **agdestatus**: Status 0-Pendente | 1-Concluído | 9-Erro
- **agdetipo**: Tipo do Envio

---

## AGDO

**15 campos documentados**

- **agdocodigo**: Codigo PK tabela
- **agdodata**: Data do agendamento
- **agdodataciencia**: Data da Ciência do Agendamento por parte do caixa
- **agdodatafinal**: Data Final do agendamento
- **agdodescricao**: Descricao do agendamento de preco
- **agdoefetuado**: Data da realizacao da alteracao
- **agdoempresa**: Empresa (FK)
- **agdoentcpa**: Codigo da Entcpa(FK)
- **agdoidmobile**: Id retornado pelo Sga Mobile
- **agdoorigem**: Origem 0 - Sga Petro, 1 - Sga Mobile
- **agdorecorrente**: Agendamento Recorrente 0-Não | 1-Sim
- **agdostatus**: Status 0-Pendente | 1-Agendado | 9-Concluido
- **agdotipoproduto**: Tipo Produto 1-Combustivel | 2-Conveniencia
- **agdotprecoauto**: Troca o Preço nas bombas automaticamente quando Combustivel 0-Não | 1-Sim
- **agdousuariociencia**: Usuário que autorizou a Ciência do Agendamento por parte do caixa

---

## AGDP

**28 campos documentados**

- **agdpagdo**: Codigo AGDO FK
- **agdpcodigo**: Codigo PK tabela
- **agdpprodt10**: Tipo Indice Venda 10 %-,%+,$-,$+,VF
- **agdpprodt11**: Tipo Indice Venda 11 %-,%+,$-,$+,VF
- **agdpprodt12**: Tipo Indice Venda 12 %-,%+,$-,$+,VF
- **agdpprodt2**: Tipo Indice Venda 2  %-,%+,$-,$+,VF
- **agdpprodt3**: Tipo Indice Venda 3  %-,%+,$-,$+,VF
- **agdpprodt4**: Tipo Indice Venda 4  %-,%+,$-,$+,VF
- **agdpprodt5**: Tipo Indice Venda 5  %-,%+,$-,$+,VF
- **agdpprodt6**: Tipo Indice Venda 6  %-,%+,$-,$+,VF
- **agdpprodt7**: Tipo Indice Venda 7  %-,%+,$-,$+,VF
- **agdpprodt8**: Tipo Indice Venda 8  %-,%+,$-,$+,VF
- **agdpprodt9**: Tipo Indice Venda 9  %-,%+,$-,$+,VF
- **agdpproduto**: Codigo do produto
- **agdpprodv1**: Preço a vista
- **agdpprodv10**: Vlr Venda 10
- **agdpprodv11**: Vlr Venda 11
- **agdpprodv12**: Vlr Venda 12
- **agdpprodv2**: Vlr Venda 2
- **agdpprodv3**: Vlr Venda 3
- **agdpprodv4**: Vlr Venda 4
- **agdpprodv5**: Vlr Venda 5
- **agdpprodv6**: Vlr Venda 6
- **agdpprodv7**: Vlr Venda 7
- **agdpprodv8**: Vlr Venda 8
- **agdpprodv9**: Vlr Venda 9
- **agdptipoindice**: Tipo de Indice
- **agdpvalorindice**: Vlr Indice

---

## AGPE

**20 campos documentados**

- **agpecodigo**: Codigo Sequencial(PK)
- **agpedataciencia**: Data da Ciência do Agendamento por parte do caixa
- **agpedatafinal**: Data Final do Periodo
- **agpedatainicio**: Data Inicial do Periodo
- **agpedescricao**: Descricao do agendamento de preco
- **agpeempresa**: Empresa (FK)
- **agpefinaloperacao**: Data/Hora em que a operacao se finalizou pelo timer
- **agpehorafinal**: Hora Final do Periodo
- **agpehorainicio**: Hora Inicial do Periodo
- **agpeinicioperacao**: Data/Hora em que a operacao se iniciou pelo timer
- **agpesemanadom**: Periodo Valido no Domingo 0-Não 1-Sim
- **agpesemanaqua**: Periodo Valido na Quarta 0-Não 1-Sim
- **agpesemanaqui**: Periodo Valido na Quinta 0-Não 1-Sim
- **agpesemanasab**: Periodo Valido no Sabado 0-Não 1-Sim
- **agpesemanaseg**: Periodo Valido na Segunda 0-Não 1-Sim
- **agpesemanasex**: Periodo Valido na Sexta 0-Não 1-Sim
- **agpesemanater**: Periodo Valido na Terca 0-Não 1-Sim
- **agpestatus**: Status 0-Pendente | 1-Operando | 9-Finalizado 
- **agpetrocaprecoauto**: Troca o Preço Automaticamente nas Bombas 0-Não | 1-Sim
- **agpeusuariociencia**: Usuário que autorizou a Ciência do Agendamento por parte do caixa

---

## AGPEP

**39 campos documentados**

- **agpepcodigo**: Codigo Sequencial(PK)
- **agpepcodigoagpe**: Codigo AGDO (FK)
- **agpepprodbaset10**: Base de Calculo Indice Venda 10 0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset11**: Base de Calculo Indice Venda 11 0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset12**: Base de Calculo Indice Venda 12 0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset2**: Base de Calculo Indice Venda 2  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset3**: Base de Calculo Indice Venda 3  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset4**: Base de Calculo Indice Venda 4  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset5**: Base de Calculo Indice Venda 5  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset6**: Base de Calculo Indice Venda 6  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset7**: Base de Calculo Indice Venda 7  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset8**: Base de Calculo Indice Venda 8  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodbaset9**: Base de Calculo Indice Venda 9  0-Inativo | 1-AGPEPPRODV1 | 2-PRODV1
- **agpepprodt10**: Tipo Indice Venda 10 %-,%+,$-,$+,VF
- **agpepprodt11**: Tipo Indice Venda 11 %-,%+,$-,$+,VF
- **agpepprodt12**: Tipo Indice Venda 12 %-,%+,$-,$+,VF
- **agpepprodt2**: Tipo Indice Venda 2  %-,%+,$-,$+,VF
- **agpepprodt3**: Tipo Indice Venda 3  %-,%+,$-,$+,VF
- **agpepprodt4**: Tipo Indice Venda 4  %-,%+,$-,$+,VF
- **agpepprodt5**: Tipo Indice Venda 5  %-,%+,$-,$+,VF
- **agpepprodt6**: Tipo Indice Venda 6  %-,%+,$-,$+,VF
- **agpepprodt7**: Tipo Indice Venda 7  %-,%+,$-,$+,VF
- **agpepprodt8**: Tipo Indice Venda 8  %-,%+,$-,$+,VF
- **agpepprodt9**: Tipo Indice Venda 9  %-,%+,$-,$+,VF
- **agpepproduto**: Codigo do produto (FK)
- **agpepprodv1**: Preço a vista
- **agpepprodv10**: Vlr Venda 10
- **agpepprodv11**: Vlr Venda 11
- **agpepprodv12**: Vlr Venda 12
- **agpepprodv2**: Vlr Venda 2
- **agpepprodv3**: Vlr Venda 3
- **agpepprodv4**: Vlr Venda 4
- **agpepprodv5**: Vlr Venda 5
- **agpepprodv6**: Vlr Venda 6
- **agpepprodv7**: Vlr Venda 7
- **agpepprodv8**: Vlr Venda 8
- **agpepprodv9**: Vlr Venda 9
- **agpeptipoindice**: Tipo de Indice
- **agpepvalorindice**: Vlr Indice

---

## AJBC

**21 campos documentados**

- **ajbcautomacao**: Codigo da Automacao (FK)
- **ajbcbico**: Codigo do Bico (FK)
- **ajbcbomba**: Codigo do Bomba (FK)
- **ajbccaixa**: Numero do Caixa
- **ajbccnpj**: Cnpj da Empresa Responsavel
- **ajbccodigo**: Codigo
- **ajbccpf**: Cpf do Tecnico Responsavel
- **ajbcdata**: Data e hora da Afericao
- **ajbcempresa**: Codigo da Empresa
- **ajbcencerranteautant**: Encerrante da Automacao Antes do Ajuste
- **ajbcencerranteautpos**: Encerrante da Automacao Apos o Ajuste
- **ajbcencerrantesisant**: Encerrante do Sistema Antes do Ajuste
- **ajbcencerrantesispos**: Encerrante do Sistema Apos o Ajuste
- **ajbchistorico**: Historico do Ajuste
- **ajbclacreaplicado**: Lacres Aplicados
- **ajbclacreremovido**: Lacres Removidos
- **ajbclaudo**: Laudo
- **ajbcmovimento**: Data do Movimento
- **ajbcproduto**: Codigo do Produto (FK)
- **ajbctanque**: Codigo do Tanque (FK)
- **ajbctecnico**: Tecnico Responsavel pela manutencao

---

## AJBD

**14 campos documentados**

- **ajbdbalanco**: Código do Fechamento Balanço
- **ajbdcodigo**: Codigo Sequencial
- **ajbdcodigonra**: Código da Nota Fiscal(FK)
- **ajbdcodigostajpr**: Código do Setor(FK)
- **ajbddata**: Data e Hora do Ajuste
- **ajbddataf**: Data e Hora de Fechamento do Bordero
- **ajbddreperca**: Conta DRE Perca
- **ajbddresobra**: Conta DRE Sobra
- **ajbdempresa**: Codigo da Empresa
- **ajbdlocal**: Origem do Ajuste 1-Disponível|2-Depósito
- **ajbdmotivo**: Motivo do Ajuste
- **ajbdorigem**: Origem do Ajuste 0-Manual|1-Balanco|2-Coletor
- **ajbdresponsavel**: Responsavel pelo Ajuste
- **ajbdusuariof**: Responsavel pelo Fechamento do Bordero

---

## AJPR

**6 campos documentados**

- **ajprapos**: Estoque Posterior
- **ajprbordero**: Codigo Bordero
- **ajprcodigo**: Codigo Sequencial
- **ajprproduto**: Codigo do Produto (FK)
- **ajprtipo**: Tipo do Ajuste (B)alanco (P)erda (S)obra
- **ajprvenda**: Valor venda no momento do Ajuste

---

## ALUF

**3 campos documentados**

- **alufaliquota**: Aliquota
- **alufdestino**: UF DESTINO
- **aluforigem**: UF Origem

---

## ANPC

**3 campos documentados**

- **anpccodigo**: Codigo
- **anpcdescricao**: Descricao
- **anpcproduto**: Produto

---

## ATDE

**23 campos documentados**

- **atdeabrircomanda**: Liberar Abrir Comanda | 0 - Não | 1 - Sim
- **atdecodigo**: Codigo Sequencial
- **atdecodpremia**: Código premia frentista
- **atdecomissao**: Tem comissão de vendedor Sim/Não
- **atdecpf**: Cpf do Atendente
- **atdefecharcomanda**: Liberar Fechar Comanda | 0 - Não | 1 - Sim
- **atdefone**: Fone Atendente
- **atdefrentista**: Habilitar como Frentista
- **atdegarcon**: Habilitar como Garcon
- **atdeidallb**: Liberacao 0-somente proprio 1-ver todos 2-vender todos
- **atdeidcode**: IDCode de Automacao
- **atdeidusuariobrinks**: ID do usuário no Cofre Brinks
- **atdeidusuariosmartsafe**: ID do usuário no Smart Safe
- **atdeinativo**: Data do Inativo
- **atdeipirangacodigovip**: IPIRANGA código VIP 
- **atdeipirangafuncenvio**: IPIRANGA data da última atualização desse funcionário na API employee 
- **atdeipirangatipocomponente**: IPIRANGA código tipo componente ipiranga 
- **atdenome**: Nome Atendente
- **atdepedidocomanda**: Liberar Fazer Pedido Comanda | 0 - Não | 1 - Sim
- **atdepromoter**: Habilitar como Promoter
- **atderplibera**: Libera Funcionário para o controle de Cartão
- **atderpviradata**: Controle de virada de movimento de Data
- **atdesenha**: Senha Atendente

---

## ATDEEMP

**3 campos documentados**

- **atdecodigo**: Codigo da ATDE(FK)
- **atdeempcod**: Codigo da EMPRESA(FK)
- **atdeempsenha**: Senha Atendente

---

## ATUEXE

**10 campos documentados**

- **atexcodigo**: Codigo Sequencial
- **atexdata**: Data da Atualização
- **atexempresa**: Código da Empresa
- **atexmodoatu**:  1-Automatico ou 2-Click
- **atexnomeexe**: Nome do Exe
- **atexparametro**: Parametro GDPTATUALIZA
- **atexreleaseantes**: Release Antes
- **atexreleasedepois**: Release Depois
- **atexterminal**: Nome do Terminal
- **atexusuario**: Tecnico que clicou

---

## AUTOCONFPROD

**4 campos documentados**

- **autoconfprodcodigo**: Código Sequencial (PK)
- **autoconfprodempresa**: Código da Empresa (FK)
- **autoconfprodprod**: Código da PROD (FK)
- **autoconfprodvenda**: Código da VENDAAUTOCONF (FK)

---

## AVAL

**8 campos documentados**

- **avalavaliacaoc**: Avaliação do Caixa - 0 a 4
- **avalavaliacaop**: Avaliação da Pista - 0 a 4
- **avalcodigo**: Codigo do Avaliação
- **avaldados**: JSON com informações
- **avaldata**: Data da avaliação
- **avaldescricao**: Descricao
- **avalempresa**: Codigo da Empresa
- **avalterminal**: Terminal

---

## AVIL

**6 campos documentados**

- **avilaviso**: Aviso (FK) 
- **avilcnpjcpf**: CNPJ do Cliente
- **avilcodigo**: Codigo Sequencial
- **avildhleitura**: DH Leitura
- **aviltrleitura**: TR Leitura
- **avilusleitura**: US Leitura

---

## AVIS

**8 campos documentados**

- **avisarquivo**: Status Arquivado
- **avisaviso**: Aviso
- **aviscodigo**: Codigo Sequencial
- **avisdatahora**: Data e hora 
- **avislink**: Link
- **avisrepositorio**: Enviado Repositorio 0-Nao 1-Sim
- **avistipo**: Tipo do Aviso 0-Aviso 1-Urgente
- **avistitulo**: Titulo

---

## BALA

**7 campos documentados**

- **balacodigo**: Codigo Sequencial
- **baladata**: Abertura do Balanco
- **balaempresa**: Codigo da Empresa
- **balaestoquelocal**: Local do Balanço: 1-Disponível 2-Depósito
- **balanumero**: Codigo FK conforme o Tipo do Balanço
- **balatipo**: Tipo do Balanço: 1-Seçãp 2-Grupo 3-Localização
- **balavalido**: Validacao do Balanco

---

## BALG

**3 campos documentados**

- **balgdata**: Data do Ultimo Balanco
- **balgempresa**: Codigo da Empresa
- **balggrupo**: Codigo do Grupo (FK)

---

## BALL

**3 campos documentados**

- **balldata**: Data do Ultimo Balanco
- **ballempresa**: Codigo da Empresa
- **balllocalizacao**: Codigo da Localizacao (FK)

---

## BALU

**3 campos documentados**

- **baludata**: Data do Ultimo Balanco
- **baluempresa**: Codigo da Empresa
- **balusecao**: Codigo da Seção (FK)

---

## BAND

**5 campos documentados**

- **bandchavetef**: Chave de Retorno do TEF
- **bandcodigo**: Codigo Sequencial
- **banddescricao**: Descrição da Baneira
- **bandoperacao**: Operacao (DEBITO/CREDITO)
- **bandreservado**: Indica se a bandeira já esta reservada, se sim, não irá atualizar junto com as demais tabelas

---

## BDRA

**3 campos documentados**

- **bdracodigo**: Codigo Sequencia (PK)
- **bdradescricao**: Descrição
- **bdrarepositorio**: Atualiza Repositorio 0-Não|1-Sim

---

## BENEF

**5 campos documentados**

- **benefcodigo**: Codigo do Beneficio Fiscal
- **benefdatafinal**: Final da Vigência
- **benefdatainicial**: Ínicio da Vigência
- **benefdescricao**: Descrição
- **benefobservacao**: Observação

---

## BENEFCST

**2 campos documentados**

- **benefcstcodigobenef**: Codigo do Beneficio Fiscal
- **benefcstcst**: CST do Beneficio Fiscal

---

## BICO

**33 campos documentados**

- **bicoabastecendo**: Bico Abastecendo (Sim/Não)
- **bicoatc**: Bico Requisicao para o ATC
- **bicoativo**: Data do Cadastro
- **bicoautomacao**: Modelo da Automação (FK)
- **bicobomba**: Bomba (FK)
- **bicocanal**: Canal de Comunicacao Automacao
- **bicocanalladobomba**: Canal de Comunicacao Automacao em relaçao a Bomba/Lado da bomba do bico
- **bicocodigo**: Codigo
- **bicodisplay**: Numero de Display do Bico
- **bicoempresa**: Empresa (FK)
- **bicoencerb**: Encerrante Bico
- **bicoencers**: Encerrante Sistema
- **bicofalhadata**: Data da Falha do Bico
- **bicofalhaocbc**: Codigo da Tabela OCBC da Corrente Falha de Comunicacao do Bico (FK)
- **bicogerardiferenca**: Gerar abastecimento com diferenca no encerrante: 0 - Nao, 1 - Sim
- **bicoinativo**: Data do Inativo
- **bicolerencerrante**: Ler encerrante: 0 - Nao, 1 - Solicitar, 2 - Sucesso, 9 - Erro
- **bicomilhao**: Valor da Casa do Milhão dos Encerrantes
- **bicomonitora**: Auto Monitorar Encerrante (Sim/Não)
- **bicoppu**: Valor do Combustivel na Bomba
- **bicoppu2**: Valor do Combustivel na Bomba (Preco Nivel 2)
- **bicoppu3**: Valor do Combustivel na Bomba (Preco Nivel 3)
- **bicoqtdabpe**: Quantidade Abastecimento Presente no PDV
- **bicoqtdpmit**: Quantidade Abastecimento em Comanda no PDV
- **bicoqtdprit**: Quantidade Abastecimento em Venda Pendente no PDV
- **bicoquebraocbc**: Codigo da Tabela OCBC da Corrente Quebra de Encerrante do Bico (FK)
- **bicotabelafixa**: Tabela de Preco Fixa
- **bicotabelafixa2**: Tabela de Preco Fixa 2 (Preco Nivel 2)
- **bicotabelafixa3**: Tabela de Preco Fixa 3 (Preco Nivel 3)
- **bicotanque**: Tanque (FK)
- **bicotrava**: Requisicao Trava 0-Nao 1-Pede Trava 2-Travado 3-Pede Destrava
- **bicotrocafiddata**: Data do momento em que o preço foi alterado por um FID na automação
- **bicotrocapreco**: Trocar preco ppu pela Automacao (Sim/Não)

---

## BMEN

**3 campos documentados**

- **bmencodigo**: Codigo Sequencial
- **bmenmensagem**: Mensagem
- **bmenrepositorio**: Atualiza Repositorio 0-Não | 1-Sim

---

## BOMB

**8 campos documentados**

- **bombcnpjcpf**: Cnpj/Cpf
- **bombcodigo**: Codigo
- **bombdisplay**: Numero de Display da Bomba
- **bombempresa**: Codigo da Empresa (FK)
- **bombimpressora**: Codigo Da Impressora(FK)
- **bombinativo**: Data do Inativo
- **bombmodelo**: Modelo Bomba (FK)
- **bombserie**: Nro Serie da Bomba

---

## BRIAPROD

**4 campos documentados**

- **briaprodcodigobr**: Código Vendedor BR Premmia
- **briaprodempresa**: Codigo Empresa
- **briaprodproduto**: PRODCODIGO Tabela PROD
- **briaprodtipo**: Tipo: 1-Combustível, 2-Conveniência

---

## BRIASELL

**7 campos documentados**

- **briasellcodvda**: Codigo VDA
- **briaselldataenvio**: Data Envio
- **briasellempresa**: Codigo Empresa
- **briasellhash**: Texto Auditoria
- **briaselljsonenvio**: JSON Envio
- **briaselljsonretorno**: JSON Retorno
- **briasellstatuscode**: API Status Code

---

## CADIMP

**4 campos documentados**

- **cadimpcaminho**: Caminho da Impressora
- **cadimpcodigo**: Codigo Sequencial
- **cadimpempresa**: Codigo da Empresa
- **cadimpnome**: Nome da Impressora

---

## CCCE

**10 campos documentados**

- **ccceautorizado**: Autorização 0-Pendente, 1-Autorizado
- **cccechave**: Chave da nota
- **cccecodigo**: Código
- **cccecorrrecao**: Correção
- **cccedata**: Data
- **ccceempresa**: Código da Empresa(FK)
- **cccehora**: Hora
- **cccesequencia**: Sequencia
- **cccexml**: Xml
- **cccexmlenvio**: Xml de envio

---

## CCFG

**50 campos documentados**

- **ccfgagenciacod**: Agência - Codigo
- **ccfgagenciadiv**: Agência - DV
- **ccfgaltdados**: Campo permite alterar dados do emitente do boleto
- **ccfgapisenha**: Informar a Senha da API
- **ccfgapitoken**: Informar o Access Token da API
- **ccfgativo**: Boleto está ativo para emissão? 0-NAO | 1-SIM
- **ccfgbairro**: Campo Bairro do Endereço do boleto
- **ccfgbancocod**: Codigo do Banco 0-Bco Brasil|104-Cef ...
- **ccfgcaracteristica**: Caracteristica 0-Simples|1-Vinculada|2-Caucionada|3-Descontada|4-Vendor
- **ccfgcarteira**: Carteira 0-Simples|1-Registrada
- **ccfgcedentecod**: Cedente - Codigo
- **ccfgcep**: Campo Cep do Endereço do boleto
- **ccfgcertchaveprivada**: Chave Privada do Certificado para comunicacao com as APIs
- **ccfgcertdatavalidade**: Data de validade do Certificado para comunicacao com as APIs
- **ccfgcertificado**: Certificado para comunicacao com as APIs
- **ccfgchavepix**: Chave PIX para Recebimento do Boleto Vinculado
- **ccfgcidade**: Campo Cidade do Endereço do boleto
- **ccfgcnpj**: Campo Cnpj do Endereço do boleto
- **ccfgcodigo**: Codigo Sequencia
- **ccfgcodigobaixa**: Código de Baixa: 1-Baixar e Devolver | 2-Não Baixar e Não Devolver
- **ccfgcontacod**: Conta Corrente - Codigo
- **ccfgcontadiv**: Conta Corrente - DV
- **ccfgconvenio**: Convênio - Codigo
- **ccfgctrlnumero**: Flag de Controlar Numero do Boleto 0-Nao 1-Sim
- **ccfgdescontodiasvencto**: Qtde de dias anteriores ao vencimento para conceder o desconto (0=Dia do Vencimento)
- **ccfgdescontotipo**: Tipo do Desconto a ser concedido: 0-Sem Desconto | 1-Por Valor Fixo | 2-Por Percentual
- **ccfgdescontovalor**: Valor á condeder de desconto conforme o tipo (Valor fixo ou Percentual)
- **ccfgdescricao**: Descrição da Cobrança
- **ccfgemissao**: Responsavel Emissao 0-BancoEmite|1-BancoNaoReemite|2-BancoReemite|3-ClienteEmite
- **ccfgfatunrodocto**: Informar o Numero da Fatura no Numero do Documetno? 0-NAO | 1-SIM
- **ccfglayoutremessa**: Layout do Arquivo de Remessa 0-C240|1-C400
- **ccfglayoutretorno**: Layout do Arquivo de Retorno 0-C240|1-C400
- **ccfglogradouro**: Campo Logradouro do Endereço do boleto
- **ccfgmodalidadecod**: Modalidade da Conta - Codigo
- **ccfgnegativar**: Negativar quando o PARTICIPANTE estiver configurado para PROTESTAR
- **ccfgnro**: Campo Numero do Endereço do boleto
- **ccfgnumeroboleto**: Numero Sequencial do Ultimo Boleto
- **ccfgnumeroboletopdv**: Numero Sequencial do Ultimo Boleto gerado no PDV
- **ccfgnumeroremessa**: Numero Sequencial do Ultimo Arquivo de Remessa
- **ccfgpastaremessa**: Pasta paga Gerar o Arquivo Remessa
- **ccfgpastaretorno**: Pasta para Capturar o Arquivo Retorno
- **ccfgrazao**: Campo Razao social do boleto
- **ccfgremoteid**: Id Unico no SGA Cloud
- **ccfgsync**: Mostra Status da Sincronização com o SGA Cloud
- **ccfgtarifabaixa**: Valor da Tarifa para Baixa do Boleto
- **ccfgtarifaregistro**: Valor da Tarifa para Registro do Boleto
- **ccfgtipoboleto**: Tipo de Geração de Boleto - Flag: 0-Padrão | 1-TecnoSpeed Manual | 3-TecnoSpeed Automático
- **ccfgtipocobranca**: Tipo de Cobrança 0-Cecred|1-BancoDoBrasil|2-BancoDoNordeste ...
- **ccfgtransmissaocod**: Transmissão - Codigo
- **ccfguf**: Campo UF do Endereço do boleto

---

## CCRE

**3 campos documentados**

- **ccrecodigo**: Codigo Sequencial
- **ccreconta**: Codigo da Conta Corrente (FK)
- **ccreempresa**: Codigo da Empresa (FK)

---

## CCRN

**3 campos documentados**

- **ccrncodigo**: Codigo Sequencial
- **ccrnconta**: Codigo da Conta Corrente (FK)
- **ccrnnivel**: Nome do Nivel de Acesso

---

## CCRR

**18 campos documentados**

- **ccrrautoconc**: Auto Conciliacao Sim Nao
- **ccrrcapital**: Utilizar Saldo como Capital
- **ccrrccfgcodigo**: Codigo Configuracao Cobranca (FK)
- **ccrrccfgcodigoapi**: Codigo Configuracao Cobranca API (FK)
- **ccrrchequetroco**: Controle de Cheque Troco - Flag: 0-Nao | 1-Sim
- **ccrrcobranca**: Tem Cobranca Sim Não
- **ccrrcobrancaapi**: Tem Cobranca API Sim Não
- **ccrrcodbanco**: Código do Banco
- **ccrrcodigo**: Codigo Sequencial
- **ccrrdescricao**: Descricao
- **ccrrempresas**: Opção Controle Empresas         : 0-Bloquear Todos | 1-Liberar Todos
- **ccrrniveis**: Opção Controle Niveis           : 0-Bloquear Todos | 1-Liberar Todos
- **ccrrpixbolcodigo**: Código de Configuração PixBoleto
- **ccrrpixboleto**: Habilita Pix Boleto 0-Não|1-Sim
- **ccrrsaldo**: Saldo Atual
- **ccrrsangria**: Permite Sangrias                : 0-Não | 1-Sim
- **ccrrterminais**: Opção Controle Terminais        : 0-Bloquear Todos | 1-Liberar Todos
- **ccrrusuarios**: Opção Controle Usuarios         : 0-Bloquear Todos | 1-Liberar Todos

---

## CCRT

**3 campos documentados**

- **ccrtcodigo**: Codigo Sequencial
- **ccrtconta**: Codigo da Conta Corrente (FK)
- **ccrtterminal**: Nome do Terminal

---

## CCRU

**3 campos documentados**

- **ccrucodigo**: Codigo Sequencial
- **ccruconta**: Codigo da Conta Corrente (FK)
- **ccruusuario**: Nome do Usuario

---

## CDES

**16 campos documentados**

- **cdescodigo**: Codigo Sequencial
- **cdesdata**: Data de inclusão/alteração
- **cdesdescricao**: Descricao
- **cdesgrupo**: Grupo de Despesas (FK)
- **cdesv01**: Valor Mes 01
- **cdesv02**: Valor Mes 02
- **cdesv03**: Valor Mes 03
- **cdesv04**: Valor Mes 04
- **cdesv05**: Valor Mes 05
- **cdesv06**: Valor Mes 06
- **cdesv07**: Valor Mes 07
- **cdesv08**: Valor Mes 08
- **cdesv09**: Valor Mes 09
- **cdesv10**: Valor Mes 10
- **cdesv11**: Valor Mes 11
- **cdesv12**: Valor Mes 12

---

## CEST

**4 campos documentados**

- **cestcest**: Codigo CEST
- **cestcodigo**: Codigo
- **cestdescricao**: Descrição
- **cestncm**: Codigo NCM

---

## CFCD

**4 campos documentados**

- **cfcdcodigo**: Codigo Sequencial
- **cfcddescricao**: Descrição
- **cfcdregime**: Regime
- **cfcdrepositorio**: Regime

---

## CFG

**15 campos documentados**

- **cfgaceitar**: Conteudo Aceitavel
- **cfgcampo**: Nome do Campo
- **cfgcodigo**: Codigo Sequencial
- **cfgconteudo**: Conteudo do Campo
- **cfgdescricao**: Descricao do Campo
- **cfgeditar**: Liberado para Editar (Sim/Não)
- **cfgempresa**: Codigo da Empresa
- **cfgescopo**: Escopo do Campo (0-Geral 1-Terminal)
- **cfggrupo**: Grupo da Configuracao
- **cfghash**: Hash do Registro
- **cfgimportar**: Importar cfg para nova empresa (0 - Não, 1 - Sim)
- **cfginativo**: Registro Inativo
- **cfgmasterslave**: Tipo da Configuração 1-Master 2-Slave
- **cfgrealtime**: Parametro de tempo real(0 - Não, 1 - Sim)
- **cfgterminal**: Descricao do Terminal

---

## CFIT

**4 campos documentados**

- **cfitcadastro**: (Fk) Codigo do Cadastro
- **cfitcampo**: Campo
- **cfitcodigo**: Codigo Sequencial
- **cfitconteudo**: Conteudo

---

## CFOC

**5 campos documentados**

- **cfoccfop**: Codigo CFOP Base (FK)
- **cfoccodigo**: Codigo Sequencial
- **cfoccorresp**: Codigo CFOP Correspondente (FK)
- **cfocsticmsf**: St Icms Final
- **cfocsticmsi**: St Icms Inicial

---

## CFOL

**3 campos documentados**

- **cfolcfop**: CFOP
- **cfolcodigo**: Código
- **cfolstic**: ST Icms

---

## CFOP

**2 campos documentados**

- **cfopcodigo**: Codigo CFOP
- **cfopdescricao**: Descricao

---

## CGD

**6 campos documentados**

- **cgdclientid**: Client ID
- **cgdclientsecret**: Client Secret
- **cgdcodigo**: Codigo
- **cgddescricao**: Descrição
- **cgdrefreshtoken**: Refresh Token
- **cgdrepositorio**: Atualiza Repositorio 0-Não 1-Sim

---

## CHBJ

**15 campos documentados**

- **chbjcaixa**: Numero do Caixa
- **chbjcartao**: Valor Recebido em Cartao
- **chbjccrr**: (FK) Codigo da Ccrr
- **chbjcheque**: Valor Recebido em Cheque
- **chbjcodigo**: Codigo Sequencial
- **chbjdata**: Data do Bordero
- **chbjdescricao**: Descricao do Bordero
- **chbjdevolvido**: Bordero Devolvido(Sim=1, Não=0
- **chbjdinheiro**: Valor Recebido em Dinheiro
- **chbjempresa**: Codigo Empresa
- **chbjfrentista**: Codigo do Frentista Responsavel (FK)
- **chbjfrete**: Valor Recebido em Frete
- **chbjmapa**: Data do Mapa
- **chbjtefchave**: Chave do Tef Destino da Baixa (FK)
- **chbjtroco**: Valor do Troco

---

## CHBP

**4 campos documentados**

- **chbpcodigo**: Codigo Sequencial
- **chbpdata**: Data do Bordero
- **chbpdescricao**: Descricao do Bordero
- **chbpempresa**: Codigo Empresa

---

## CHCS

**10 campos documentados**

- **chcscnpjcpf**: CNPJ/CPF do Emitente ou responsavel
- **chcscodigo**: Codigo Sequencial
- **chcscsatcontrole**: Número de Consulta na CredSAT
- **chcscsatqtdchq**: Quantidade de Cheques com Restrição
- **chcscsatrestricao**: Restrição 0-Não | 1-Sim
- **chcsdata**: Data e hora da Consulta
- **chcsdevolvido**: Qtd Cheques Devolvidos
- **chcsok**: Qtd Cheques OK
- **chcspendente**: Qtd Cheques Pendentes
- **chcsusuario**: Usuario Ativo

---

## CHQJ

**31 campos documentados**

- **chqjagencia**: Agencia
- **chqjalinea**: Alinea do Cheque
- **chqjbanco**: Banco
- **chqjbordero**: Número do Bordero
- **chqjcaixa**: Numero do Caixa de Cadastro do Cheque
- **chqjcc**: Conta Corrente
- **chqjccrr**: Baixa - Codigo da Conta Corrente (FK)  ***inativo***
- **chqjcheque**: Cheque
- **chqjcliente**: Codigo do Cliente (FK)
- **chqjcmc7**: Codigo de Barra Cmc7
- **chqjcnpjcpf**: Cnpj Cpf do Emitente
- **chqjcodigo**: Codigo Sequencial
- **chqjdata**: Data de Emissao
- **chqjdependente**: Nome do Dependente
- **chqjdevolvido**: Cheque Devolvido (0-Não|1-Sim)
- **chqjemitente**: Emitente do Cheque
- **chqjempresa**: Codigo Empresa
- **chqjmapa**: Baixa - Data do Mapa  ***inativo***
- **chqjobs**: Observacoes Gerais
- **chqjorigemcod**: Codigo da origem do cheque (FK)
- **chqjorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **chqjpagamento**: Data de Pagamento  ***inativo***
- **chqjplaca**: Placa Vinculada ao Cheque
- **chqjpredatado**: Flag (0-Vista|1-PreDatado
- **chqjrespcnpjcpf**: Cnpj Cpf do Responsavel
- **chqjrespfone**: Fone do Responsavel
- **chqjrespnome**: Nome do Responsavel
- **chqjterceiro**: Cheque de Terceiros (0-Não|1-Sim)
- **chqjvalor**: Valor do Cheque
- **chqjvencimento**: Data de Vencimento
- **chqjvenda**: Venda de origem do cheque

---

## CHQP

**34 campos documentados**

- **chqpacrescimo**: Valor de Acrescimo do Cheque
- **chqpagencia**: Agencia
- **chqpalinea**: Alinea do Cheque
- **chqpbanco**: Banco
- **chqpbordero**: Numero do Bordero
- **chqpcaixa**: Numero do Caixa de Cadastro do Cheque
- **chqpcc**: Conta Corrente
- **chqpcheque**: Cheque
- **chqpcliente**: Codigo do Cliente ***INATIVO*** (FK)
- **chqpcmc7**: Codigo de Barra Cmc7
- **chqpcnpjcpf**: Cnpj Cpf do Emitente
- **chqpcodigo**: Codigo Sequencial
- **chqpdata**: Data de Cadastro do Cheque
- **chqpdatadev**: Data de Devolução do Cheque
- **chqpdependente**: Nome do Dependente
- **chqpdesconto**: Valor de Desconto do Cheque
- **chqpdevolvido**: Cheque Devolvido (0-Não|1-Sim)
- **chqpemitente**: Emitente do Cheque
- **chqpempresa**: Codigo Empresa
- **chqpmotivodev**: Motivo da Devolução do Cheque
- **chqpobs**: Observacoes Gerais
- **chqporigemcod**: Venda de origem do cheque (FK)
- **chqporigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **chqpplaca**: Placa Vinculada ao Cheque
- **chqppredatado**: Flag (0-Vista|1-PreDatado
- **chqprespcnpjcpf**: Cnpj Cpf do Responsavel
- **chqprespfone**: Fone do Responsavel
- **chqprespnome**: Nome do Responsavel
- **chqpstatus**: Status do Lancamento (0)Liberado (1)Em Lancamento
- **chqpterceiro**: Cheque de Terceiros (0-Não|1-Sim)
- **chqpvalor**: Valor do Cheque
- **chqpvalororiginal**: Valor Original do Cheque
- **chqpvencimento**: Data de Vencimento
- **chqpvenda**: Venda de origem do cheque (FK)

---

## CHQT

**23 campos documentados**

- **chqtcaixa**: Numero do Caixa da Emissão (FK)
- **chqtcc**: Codigo da Conta Corrente (FK)
- **chqtcodigo**: Codigo Sequencial
- **chqtdestinatario**: Descrição do Destinatario do Cheque
- **chqtdtbaixa**: Data da Baixa Deposito
- **chqtdtcadastro**: Data do Cadastro
- **chqtdtcancelado**: Data do Cancelamento
- **chqtdtemissao**: Data da Emissão
- **chqtdtvencimento**: Data do Vencimento
- **chqtempresa**: Codigo da Empresa
- **chqtflux**: Flag de Lancamento Direto em Fluxo CC 0-Nao 1-Sim
- **chqtfrentista**: Codigo do Frentista Responsavel (FK)
- **chqtimpressao**: Flag Impressao na Emissao 0-Pre Impressao 1-Impressao Emissao
- **chqtlibempresas**: 0 Libera Todas | 1 Bloqueia Todas
- **chqtliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-I 2-E 3-S 4-T 5-D 6-P 7-R 10-OK 99-Erro
- **chqtlocal**: Local Cheque 1000-Bloqueado,1001-Liberado,1002-Mapa,1003-Caixa, 1004-Pagamento Somente ou codigo tipo Caixa
- **chqtlote**: Numero do Lote do Cheque
- **chqtmapa**: Data do Mapa da Emissão (FK)
- **chqtmotivodev**: Motivo da devolução do cheque
- **chqtnumero**: Numero do Cheque
- **chqtusuario**: Usuário que Incluiu o Cheque
- **chqtvalor**: Valor do Cheque
- **chqtvenda**: Venda de Destino do cheque (FK)

---

## CHQTT

**4 campos documentados**

- **chqttcodigo**: Codigo Sequencial
- **chqttcodigochqt**: Codigo do Cheque(FK)
- **chqttcodigoemp**: Codigo da Empresa(FK)
- **chqtttterminal**: Nome do Terminal

---

## CIAP

**13 campos documentados**

- **ciapcodigo**: Código PK
- **ciapdatainicio**: Data de inicio
- **ciapempresa**: Código da Empresa
- **ciapnotapatrimonio**: Número da Nota Fiscal do Ativo Imobilizado
- **ciappatrimonio**: Código FK do Ativo Imobilizado
- **ciapqtdeparcelas**: Quantidade de Parcelas
- **ciaptipomovimento**: Tipo de movimentação do bem ou componente, conforme Guia Pratico do SPED Fiscal (Registro G125, campo 04)
- **ciapvalorparcela**: Valor da parcela a ser recuperada
- **ciapvlricmsdif**: Valor do ICMS - Diferencial de Alíquota na entrada do bem ou componente
- **ciapvlricmsfrete**: Valor do ICMS sobre Frete do Conhecimento de Transporte na entrada do bem ou componente
- **ciapvlricmsoperacao**: Valor do ICMS da Operação Própria na entrada do bem ou componente
- **ciapvlricmsst**: Valor do ICMS da Operação por Sub. Tributária na entrada do bem ou componente
- **ciapvlrpatrimonio**: Valor do Ativo Imolizado

---

## CIAPPARC

**7 campos documentados**

- **ciapparccodigo**: Código PK
- **ciapparccodigociap**: FK da tabela CIAP
- **ciapparcempresa**: Código da Empresa
- **ciapparcnumero**: Número da parcela
- **ciapparcperiodo**: Periodo de recuperação da parcela
- **ciapparcutilizado**: 0-Não | 1-Sim
- **ciapparcvalor**: Valor da parcela

---

## CIDA

**6 campos documentados**

- **cidacodcidade**: Codigo da Cidade
- **cidacodibge**: Codigo do Ibge
- **cidacodigo**: Codigo
- **cidacoduf**: Codigo do UF
- **cidadescricao**: Descricao
- **cidauf**: UF

---

## CLD

**64 campos documentados**

- **cldcodigo**: Codigo
- **clddescricao**: Descricao
- **cldempresa**: Código da Empresa (FK)
- **cldevarquivo**: EV. Arquivo
- **cldevbarraalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevbarracoluna**: EV. Barra Coluna
- **cldevbarratamanho**: EV. Barra Tamanho
- **cldevcodigoalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevcodigocoluna**: EV. Codigo Coluna
- **cldevcodigotamanho**: EV. Codigo Tamanho
- **cldevcodintbarras**: EV. Codigo interno no Codigo de Barras 0-Não | 1-Sim
- **cldevcodsecaoalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevcodsecaocoluna**: EV. Cod.Secao Coluna
- **cldevcodsecaotamanho**: EV. Cod.Secao  Tamanho
- **cldevdelimitador**: EV. Delimitador
- **cldevdescricaoalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevdescricaocoluna**: EV. Descricao Coluna
- **cldevdescricaotamanho**: EV. Descricao Tamanho
- **cldevestoquealinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevestoquecoluna**: EV. Estoque Coluna
- **cldevestoquemascara**: EV. Estoque Mascara
- **cldevestoquetamanho**: EV. Estoque Tamanho
- **cldevmultcodbarra**: EV. Multiplos Códigos de Barra 0-Não | 1-Sim
- **cldevpermsembarras**: EV. Permite Produto Sem Cod. Barras 0-Não | 1-Sim
- **cldevsecaoalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevsecaocoluna**: EV. Secao Coluna
- **cldevsecaotamanho**: EV. Secao Tamanho
- **cldevseparadec**: EV. (0) - Ponto (1) - Virgula
- **cldevundalinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevundcoluna**: EV. Und Coluna
- **cldevundtamanho**: EV. Und Tamanho
- **cldevvaloralinha**: EV. 0- Justificar 1- Esquerda 2- Direita
- **cldevvalorcoluna**: EV. Valor Coluna
- **cldevvalormascara**: EV. Valor Mascara
- **cldevvalortamanho**: EV. Valor Tamanho
- **cldrtarquivo**: RT. Arquivo
- **cldrtbarraalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtbarracoluna**: RT. Barra Coluna
- **cldrtbarratamanho**: RT. Barra Tamanho
- **cldrtcodigoalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtcodigocoluna**: RT. Codigo Coluna
- **cldrtcodigotamanho**: RT. Codigo Tamanho
- **cldrtcodsecaoalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtcodsecaocoluna**: RT. Cod.Secao Coluna
- **cldrtcodsecaotamanho**: RT. Cod.Secao  Tamanho
- **cldrtdelimitador**: RT. Delimitador
- **cldrtdescricaoalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtdescricaocoluna**: RT. Descricao Coluna
- **cldrtdescricaotamanho**: RT. Descricao Tamanho
- **cldrtestoquealinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtestoquecoluna**: RT. Estoque Coluna
- **cldrtestoquemascara**: RT. Estoque Mascara
- **cldrtestoquetamanho**: RT. Estoque Tamanho
- **cldrtsecaoalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtsecaocoluna**: RT. Secao Coluna
- **cldrtsecaotamanho**: RT. Secao Tamanho
- **cldrtseparadec**: RT. (0) - Ponto (1) - Virgula
- **cldrtundalinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtundcoluna**: RT. Und Coluna
- **cldrtundtamanho**: RT. Und Tamanho
- **cldrtvaloralinha**: RT. 0- Justificar 1- Esquerda 2- Direita
- **cldrtvalorcoluna**: RT. Valor Coluna
- **cldrtvalormascara**: RT. Valor Mascara
- **cldrtvalortamanho**: RT. Valor Tamanho

---

## CNAB

**5 campos documentados**

- **cnabarquivo**: Arquivo
- **cnabccrr**: (FK) Conta Corrente
- **cnabcodigo**: Codigo Sequencial
- **cnabdata**: Data de Envio/Retorno
- **cnabtipo**: Tipo de Operação E-Envio | R-Retorno

---

## CNAC

**6 campos documentados**

- **cnaccodigo**: Codigo Sequencial
- **cnaccontapk**: Conta à Receber(FK)
- **cnacdata**: Data de Geração do Arquivo
- **cnacoperacao**: Operação
- **cnacsituacao**: Situação
- **cnacstatus**: Status de Resposta

---

## CNAF

**11 campos documentados**

- **cnafcnab**: (FK) Codigo do CNAB
- **cnafcodigo**: Codigo Sequencial
- **cnafdata**: Data
- **cnaffatura**: (FK) Codigo da Fatura
- **cnafjurodesconto**: Juros/Descontos
- **cnaflocalizou**: Localizou 0-Não | 1-Sim
- **cnafocorrencia**: Ocorrencia
- **cnafocorrenciades**: Descricção da Ocorrencia
- **cnafrecebido**: Valor Recebido
- **cnaftaxa**: Taxa
- **cnafvalor**: Valor da Fatura

---

## CNAR

**34 campos documentados**

- **cnaradquirente**: Adquirente
- **cnarantecipado**: Pagamento Antecipado: 0 - Não | 1 - Sim
- **cnarautorizacao**: Autorização
- **cnarcentro**: Centro de Despesas
- **cnarcodigo**: Código Sequencial
- **cnardataprevista**: Data de Previsão do Pagamento
- **cnardatavenda**: Data de Venda
- **cnardre**: DRe
- **cnarempresa**: Código da Empresa(FK)
- **cnarendereco**: Código do Endereco
- **cnargrupo**: Grupo de Despesas
- **cnarnsu**: NSU
- **cnarobservacao**: Observação
- **cnarpagamento**: Data de Movimento de Pagamento
- **cnarparticipante**: Código do Participante
- **cnarproduto**: Produto
- **cnarrece**: Código da Rece(FK)
- **cnarrelacionado**: Conta Relacionada(0-Não  1-Sim)
- **cnarsgabandeira**: Bandeira SGA Petro
- **cnarsgaoperadora**: Operadora SGA Petro
- **cnarsituacao**: Situação: 0 - Não Conciliado | 1 - Conciliado 
- **cnartaxa**: Taxa
- **cnartaxaantecipacao**: Taxa Antecipação
- **cnartaxac**: Taxa
- **cnartefchave**: Tefc Chave(FK)
- **cnartpoperacao**: Tipo Operação: 1 - Pagamento | 2 - Credito | 3 - Cancelado | 4 - Debito 
- **cnarvrbruto**: Valor Bruto
- **cnarvrbrutoc**: Valor Bruto
- **cnarvrdesconto**: Valor Desconto
- **cnarvrdescontoc**: Valor Desconto
- **cnarvrdespesas**: Outras Despesas
- **cnarvrdespesasc**: Outras Despesas
- **cnarvrliquido**: Valor Liquido
- **cnarvrliquidoc**: Valor Liquido

---

## COMS

**6 campos documentados**

- **comscalculo**: Comissão da Venda 0-Subtotal | 1-Total
- **comscodigo**: Codigo Sequencial
- **comsdescricao**: Descricao
- **comsempresas**: Liberar Todas Empresas
- **comsindice**: Indice
- **comstipo**: Tipo da Comissao (%/$)

---

## COMSE

**3 campos documentados**

- **comsecodigo**: Codigo Sequencial
- **comsecoms**: Codigo da Comissao (FK)
- **comseempresa**: Codigo da Empresa (FK)

---

## CONC

**20 campos documentados**

- **concadquirente**: Adquirente
- **concautorizacao**: Autorização
- **concchave**: Chave de Ligação
- **conccodigo**: Codigo
- **concconciliadora**: Conciliadora(1-Conciflex)
- **concdthrmovimento**: Data e Hora de movimento
- **concnomearquivo**: Nome do Arquivo de Conciliação
- **concnsu**: NSU
- **concpagamento**: Data de Pagamento
- **concparcela**: Número Parcela
- **concproduto**: Produto de Transação
- **conctaxa**: Taxa Aplicada na Transação
- **conctipo**: Tipo de Retorno(1-Pagamento / 2-Venda)
- **conctipoconciliacao**: Identificador de Conciliação(0-Não Localizado 1-Divergente 2-Acelerado 10-Correto)
- **conctipostatus**: Descrição do Tipo da Operação
- **conctipotransacao**: Identificador de Transação(1-Venda 2-Pagamento 3-Cancelamento 4-Débito)
- **conctotparcela**: Total Parcela
- **concvenda**: Data de Venda
- **concvlrbruto**: Valor Bruto da Transação
- **concvlrliquido**: Valor Líquido da Transação

---

## CONTROLEATUALIZADOR

**1 campos documentados**

- **cversao**: Versao

---

## CPCX

**2 campos documentados**

- **cpcxsistema**: CST PIS/COFINS Sistema
- **cpcxxml**: CST PIS/COFINS XML

---

## CPT

**21 campos documentados**

- **cptabastordem**: Ordenacao de Abastecimento por Data: 0-Decrescente | B-Crescente
- **cptadquirente**: Adquirente utilizada SGAPAY: 0-REDE | 1-CIELO | 2-GETNET
- **cptcodigo**: Codigo PK tabela
- **cptdescricao**: Descricao terminal
- **cptdocumento**: Tipo de documento: 2-NFCE | 6-SAT
- **cptempresa**: Código da Empresa (Fk)
- **cptfiltro**: Filtro de abastecimento: F-Frentista | B-Bico | N-Numero | T-Todos
- **cptliscomb**: Permite vender combustivel: 1-SIM | 2-NAO
- **cptlisct**: Permite venda com pgto em cartao: 1-SIM | 2-NAO
- **cptlisdin**: Permite venda com pgto em dinheiro: 1-SIM | 2-NAO
- **cptlisprod**: Permite vender produto: 1-SIM | 2-NAO
- **cptnsu**: NSU de controle das requisições POSTEF
- **cptpedircpf**: Perguntar CPF na Venda Rapida: 1-SIM | 2-NAO
- **cptprcpadrao**: Qual preço exibir na tela do equipamento: 1-DINHEIRO | 2-CARTAO
- **cptprcprevalece**: Quando houver 2 formas de pagamento, qual preco deve prevalecer: 1-DINHEIRO | 2-CARTAO
- **cptregrapreco**: Trabalha com preço da bomba? Ou regra de venda: 1-Preco da Bomba | 2-Regra de Venda  
- **cptserie**: Nro de serie do equipamento
- **cptterminalvinculado**: Terminal SGAPAY Vinculado a Equipamento: 0-NAO | 1-SIM
- **cpttipoautenticacao**: Tipo autenticacao frentista: S-SENHA | T-TAG
- **cpttipocaixa**: Tipo do caixa disponível para habilitar o POSTEF
- **cpturlsefaz**: URL Consulta Sefaz

---

## CSOR

**7 campos documentados**

- **csorbaixa**: Data e Hora da Baixa do Sorteio
- **csorbico**: Bico do Sorteio (fk)
- **csorcodigo**: Codigo Sequencia
- **csordata**: Data e Hora do Sorteio
- **csorempresa**: Código da Empresa(FK)
- **csorpontos**: Quantidade de Pontos do Sorteio
- **csorsorteado**: Sorteio já notificado? 0 - Não | 1 - Sim

---

## CSOSN

**3 campos documentados**

- **csosnid**: ID
- **csosnnormal**: Codigo no ST Regime Normal (FK)
- **csosnsimples**: Codigo no Regime Simples

---

## CSOSV

**3 campos documentados**

- **csosvid**: ID
- **csosvnormal**: Codigo no Regime Normal
- **csosvsimples**: Codigo no ST Regime Simples (FK)

---

## CTDR

**26 campos documentados**

- **ctdrbairro**: Bairro
- **ctdrcep**: CEP
- **ctdrcidade**: Codigo da Cidade (FK)
- **ctdrcnpj**: Cnpj
- **ctdrcodigo**: Codigo Sequencia (PK)
- **ctdrcomplemento**: Complemento
- **ctdrcontato**: Contato Contador
- **ctdrcontatonfe**: Contato Nfe
- **ctdrcontatospd**: Contato Sped
- **ctdrcpf**: Cpf
- **ctdrcrc**: CRC do Contador
- **ctdremail**: E-mail do Contador
- **ctdremailnfe**: E-mail da Nfe
- **ctdremailspd**: E-mail do Sped
- **ctdrfoneddd**: Codigo DDD do telefone
- **ctdrfonepre**: Prefixo do telefone
- **ctdrfonerel1**: Telefone Adicional
- **ctdrfonerel2**: Telefone Adicional
- **ctdrfonerel3**: Telefone Adicional
- **ctdrfonesuf**: Sufixo do telefone
- **ctdrie**: Inscricao Estadual
- **ctdrlogradouro**: Logradouro
- **ctdrnome**: Nome do contador
- **ctdrnro**: Numero do Logradouro
- **ctdrrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **ctdrwebpage**: Pagina Web

---

## CTEE

**23 campos documentados**

- **cteealcofins**: Aliquota de Cofins
- **cteealicms**: Aliquota de Icms
- **cteealpis**: Aliquota de Pis
- **cteebaseicms**: Base de Icms
- **cteebasepc**: Base de Pis Cofins
- **cteecfop**: Codigo Tabela CFOP (FK)
- **cteechave**: Chave da CTe
- **cteecidadeibgefin**: Codigo Ibge da Cidade da Rota Final
- **cteecidadeibgeini**: Codigo Ibge da Cidade da Rota Inicial
- **cteecodigo**: Codigo Sequencial
- **cteedata**: Data da CTe
- **cteedataaquisicao**: Data de Aquisicao do Servico
- **cteedocumento**: Numero da CTe
- **cteeempresa**: Empresa FK
- **cteefornecedor**: Codigo do Fornecedor (FK)
- **cteefrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **cteemodelo**: Modelo do Documento (FK)
- **cteepaga**: Codigo Tabela PAGA (FK)
- **cteeserie**: Serie do Documento
- **cteesticms**: ST de Icms
- **cteestpc**: ST de Pis Cofins
- **cteetipodocumento**: Tipo do Documento (0-Normal/1-Compl./2-Anul./3-Subst.
- **cteevalor**: Valor da CTe

---

## CTPC

**4 campos documentados**

- **ctpccliente**: Codigo do Cliente
- **ctpccodigo**: Codigo Sequencial
- **ctpcctpt**: Codigo do Controle
- **ctpcindice**: Indice Multiplicador

---

## CTPI

**6 campos documentados**

- **ctpicodigo**: Codigo Sequencial
- **ctpictpt**: Codigo do Controle
- **ctpiindice**: Indice da Faixa
- **ctpiopcao**: Flag da Opção: 0-Por Unidade 1-Ponto Fixo
- **ctpipontofim**: Faixa de Ponto Final
- **ctpipontoini**: Faixa de Ponto Inicial

---

## CTPP

**4 campos documentados**

- **ctppcodigo**: Codigo Sequencial
- **ctppctpt**: Codigo do Controle
- **ctppindice**: Indice Multiplicador
- **ctppproduto**: Codigo do Produto

---

## CTPT

**25 campos documentados**

- **ctptativo**: Flag Controle 0-Inativo 1-Ativo
- **ctptbonusauto**: Gera BONUS de forma automática: 0-Não 1-Sim
- **ctptcodigo**: Codigo Sequencial
- **ctptcombonus**: Regra trabalha com BONUS: 0-Não 1-Sim
- **ctptcontrole**: Flag de Controle: 0-Ticket impresso 1-Controle Software C/ Impressão 2-Controle Software S/ Impressão
- **ctptdescricao**: Descricao do Controle de pontos
- **ctptdestino**: Flag de Destino: 0-Solicitar 1-Cnpj Cpf 2-Placa
- **ctptempresa**: Codigo da Empresa
- **ctptindicecliente**: Indice Padrao para Clientes
- **ctptindiceproduto**: Indice Padrao para Produtos
- **ctptindicevenda**: Indice Padrao para Venda Sem Cliente
- **ctptminimo**: Pontuação Minima para Controle
- **ctptqtdecupom**: Quantidade de Cupons na Pontuacao
- **ctptticket1**: Texto do Ticket 1
- **ctptticket2**: Texto do Ticket 2
- **ctptticket3**: Texto do Ticket 3
- **ctptticket4**: Texto do Ticket 4
- **ctptticket5**: Texto do Ticket 5
- **ctptticket6**: Texto do Ticket 6
- **ctptticket7**: Texto do Ticket 7
- **ctptticket8**: Texto do Ticket 8
- **ctptticketmoeda**: Texto do Ticket Moeda
- **ctpttickettitulo**: Texto do Ticket Titulo
- **ctptunidade**: Flag de Unidade: 0-Quantidade 1-Valor
- **ctptvlrabaixo**: Flag de Valor Abaixo da Tabela: 0-Liberar Pontos 1-Bloquear Pontos

---

## CUST

**41 campos documentados**

- **custacrescimo**: Valor Acrescimo
- **custantbasest**: Cálculo Anterior da Base ST Médio Sobre as Compras
- **custantcusto**: Valor Custo Anterior
- **custantqtd**: Valor Qtd Anterior
- **custanttotal**: Valor Total Anterior
- **custantvlrst**: Cálculo Anterior do Valor ST Médio Sobre as Compras
- **custbase**: Valor Base
- **custcalculocusto**: Tipo de Cálculo (1-Médio, 2-Último Custo, 3-Não Cálcula, 4-Bonificado)
- **custcodigo**: Codigo
- **custcodigoentcpa**: campo inutilizado
- **custcodigoentcpi**: Código de origem da entcpi (-1 lancamento manual)
- **custcofins**: Valor Cofins
- **custcusto**: Valor Custo
- **custdata**: Data Movimento
- **custdesconto**: Valor Desconto
- **custdocumento**: Documento Origem
- **custempresa**: Empresa(FK)
- **custfcp**: Valor Fundo de Combate Pobreza
- **custfornecedor**: Fornecedor (FK)
- **custfrete**: Valor Frete
- **custicms**: Valor Icms
- **custicmsst**: Valor Icms ST
- **custipi**: Valor Ipi
- **custmedbasest**: Cálculo Atual da Base ST Médio Sobre as Compras
- **custmedcusto**: Valor Custo Medio
- **custmedqtd**: Valor Qtd Medio
- **custmedtotal**: Valor Total Medio
- **custmedvlrst**: Cálculo Atual do Valor ST Médio Sobre as Compras
- **custpedido**: Pedido Origem (FK)
- **custpfacr**: Valor Acrescimo Adicional nao calcula no documento
- **custpfcte**: Valor Frete Adicional nao calcula no documento
- **custpfdes**: Valor Desconto Adicional nao calcula no documento
- **custpffre**: Valor Frete Adicional nao calcula no documento
- **custpis**: Valor Pis
- **custproduto**: Produto (FK)
- **custultbasest**: Cálculo Recebido da Base ST Médio Sobre a Última Compra
- **custultcusto**: Valor Custo Ultimo
- **custultqtd**: Valor Qtd Ultimo
- **custulttotal**: Valor Total Ultimo
- **custultvlrst**: Cálculo Recebido do Valor ST Médio Sobre a Última Compra
- **custvalor**: Valor Valor

---

## CXA

**44 campos documentados**

- **cxa_000_00**: Conferencia - Livre
- **cxa_000_01**: Conferencia -   0,01
- **cxa_000_05**: Conferencia -   0,05
- **cxa_000_10**: Conferencia -   0,10
- **cxa_000_25**: Conferencia -   0,25
- **cxa_000_50**: Conferencia -   0,50
- **cxa_001_00**: Conferencia -   1,00
- **cxa_002_00**: Conferencia -   2,00
- **cxa_005_00**: Conferencia -   5,00
- **cxa_010_00**: Conferencia -  10,00
- **cxa_020_00**: Conferencia -  20,00
- **cxa_050_00**: Conferencia -  50,00
- **cxa_100_00**: Conferencia - 100,00
- **cxa_dinheiro**: Conferencia - Total Dinheiro
- **cxa_e_falta**: Entrada - Falta Consolidada
- **cxa_e_troco**: Entrada - Troco
- **cxa_s_sobra**: Saida - Sobra Consolidada
- **cxa_s_troco**: Saida - Troco
- **cxabloqueiopista**: Data e Hora do Ultimo Bloqueio de Pista para este Caixa
- **cxacaixaposterior**: Numero do caixa pre-aberto posterior a este (FK)
- **cxadatac**: Data e hora da Conferencia
- **cxadataf**: Data e hora do Fechamento
- **cxadatai**: Data e hora da Abertura
- **cxaempresa**: Código da Empresa
- **cxaenvioconctef**: Envio de Conciliação TEF(0-Sem Operação|1-Transmitir|2-Conciliado|3-Erros)
- **cxaignorarmapa**: Ignorar Agregar Caixa ao Mapa
- **cxaliberapdv**: Flag Status de Liberacao PDV 0-N 1-Fechamento 10-OK 99-Erro
- **cxamapa**: Data do Mapa Agregado
- **cxanumero**: Codigo
- **cxaobs**: Observacoes
- **cxaresponsavel**: Responsavel
- **cxaresponsavelconf**: Responsavel Conferencia do Caixa
- **cxasomarec0**: Soma contas a receber a prazo
- **cxasomarec0atual**: Soma contas a receber a prazo com juros e multa
- **cxasomarec1**: Soma contas a receber cartao
- **cxasomarec1atual**: Soma contas a receber cartao com desconto de taxas
- **cxasomarec2**: Soma contas a receber carta frete
- **cxasomarec3**: Soma contas a receber receitas
- **cxasomarecc**: Soma cheques pendentes
- **cxastatus**: Status atual do Caixa (0-Normal|1-Pre-Aberto)
- **cxatipo**: Tipo do Caixa (FK)
- **cxaturno**: Turno do Caixa (FK)
- **cxavdaf**: Sequencia de Venda Final
- **cxavdai**: Sequencia de Venda Inicial

---

## CXAB

**11 campos documentados**

- **cxabbico**: Codigo do Bico (FK)
- **cxabbomba**: Codigo da Bomba (FK)
- **cxabcaixa**: Numero do Caixa (FK)
- **cxabcodigo**: Codigo
- **cxabcombustivel**: Codigo do Combustivel (FK)
- **cxabempresa**: Código da Empresa
- **cxabencerranteautf**: Encerrante da Automacao no Final do Caixa
- **cxabencerranteauti**: Encerrante da Automacao no Inicio do Caixa
- **cxabencerrantesisf**: Encerrante do Sistema no Final do Caixa
- **cxabencerrantesisi**: Encerrante do Sistema no Inicio do Caixa
- **cxabtanque**: Codigo do Tanque (FK)

---

## CXAC

**23 campos documentados**

- **cxacautorizacao**: Numero de Autorizacao
- **cxacbandeira**: Codigo da Bandeira (FK)
- **cxaccaixa**: Numero do Caixa (FK)
- **cxacchave**: Chave do Cartao (FK)
- **cxaccodigo**: Codigo
- **cxaccodigoconciliacao**: Código usado para rastrear a conciliação
- **cxacconferido**: Flag p/ marcar registros conferidos no caixa
- **cxacdatapagamento**: Data de Pagamento do Cartao (Conforme Arquivo)
- **cxacempresa**: Código da Empresa
- **cxacfrentista**: Codigo do Frentista Responsavel (FK)
- **cxacipirangatipocomponente**: IPIRANGA: Tipo Componente 1-Pista/2-AmPm/5-JetOil
- **cxacmapa**: Data do Mapa (FK)
- **cxacnumterminal**: Número do Terminal da Operadora
- **cxacoperacao**: Flag Operacao (Debito) (Credito)
- **cxacoperadora**: Codigo da Operadora (FK)
- **cxacorigemcod**: Venda de origem do cheque (FK)
- **cxacorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 4VDPG 5VdPrg 6bxChq
- **cxacparcela**: Quantidade de Parcelas
- **cxacperfiltef**: Perfil de configuração do TEF
- **cxacrece**: Codigo da Conta a Receber Destino (FK)
- **cxactipo**: Flag Tipo (TEF) (POS)
- **cxacvalor**: Valor do lancamento
- **cxacvenda**: Venda Vinculada

---

## CXAD

**15 campos documentados**

- **cxadcaixa**: Numero do Caixa (FK)
- **cxadccrr**: Conta Corrente de Destino do Lancamento em CC (FK)
- **cxadcodigo**: Codigo
- **cxadconferido**: Flag p/ marcar registros conferidos no caixa
- **cxadcpf**: Cpf do Motorista
- **cxaddescricao**: Descrição do Deposito Bancario Antecipado
- **cxadempresa**: Código da Empresa
- **cxadfluf**: Codigo do Fluxo Gerado pelo Lancamento (FK)
- **cxadfrentista**: Codigo do Frentista Responsavel (FK)
- **cxadmotorista**: Nome do Motorista
- **cxadorigemcod**: Codigo de origem do Lancamento (FK)
- **cxadorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **cxadplaca**: Placa do Veiculo
- **cxadvalor**: Valor do Deposito
- **cxadvenda**: Sequencia da Venda que originou o lancamento

---

## CXAE

**11 campos documentados**

- **cxaecodigo**: Codigo
- **cxaecodret**: Codigo do Retorno
- **cxaecodserv**: variavel CODSERV
- **cxaecomprovc**: comprovante cliente
- **cxaecomprove**: comprovante estabelecimento
- **cxaedata**: variaveis DATA e HORA
- **cxaeempresa**: Código da Empresa
- **cxaenomeband**: variavel NOMEBAND
- **cxaenomerede**: variavel NOMEREDE
- **cxaensu**: variavel NSU
- **cxaetipoparc**: Tipo Parcelamento 0-Estabelecimento 1-Administradora

---

## CXAF

**20 campos documentados**

- **cxafcaixa**: Numero do Caixa (FK)
- **cxafcalculo**: Calculo Carta Frete (J)aCalculado (A)diantamento (S)aldo
- **cxafcodigo**: Codigo
- **cxafconferido**: Flag p/ marcar registros conferidos no caixa
- **cxafcpf**: Cpf do Motorista
- **cxafempresa**: Código da Empresa
- **cxaffrentista**: Codigo do Frentista Responsavel (FK)
- **cxafmapa**: Data do Mapa (FK)
- **cxafmotorista**: Nome do Motorista
- **cxafnumero**: Numero da Carta Frete
- **cxafobs**: Observacoes da Carta Frete
- **cxaforigemcod**: Venda de origem do cheque (FK)
- **cxaforigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **cxafpesoc**: Peso Chegada
- **cxafpesos**: Peso Saida
- **cxafplaca**: Placa do Veiculo
- **cxafrece**: Codigo da Conta a Receber Destino (FK)
- **cxaftransportadora**: Codigo da Transportadora (FK)
- **cxafvalor**: Valor da Carta Frete
- **cxafvenda**: Venda Vinculada (FK)

---

## CXAP

**5 campos documentados**

- **cxapcaixa**: Numero do Caixa (FK)
- **cxapcodigo**: Codigo
- **cxapempresa**: Código da Empresa
- **cxapestoque**: Estoque Atual
- **cxapproduto**: Produto (FK)

---

## CXAQ

**28 campos documentados**

- **cxaqagencia**: Agencia
- **cxaqbanco**: Banco
- **cxaqcaixa**: Numero do Caixa (FK)
- **cxaqcc**: CC
- **cxaqcheque**: Numero do Cheque
- **cxaqchqp**: Codigo da CHQP Destino (FK)
- **cxaqcmc7**: Barra CMC7 do cheque
- **cxaqcodigo**: Codigo
- **cxaqconferido**: Flag p/ marcar registros conferidos no caixa
- **cxaqdataemissao**: Data de emissão
- **cxaqdepositado**: Flag De Pre-Depositado Informado no PDV 0-Nao 1-Sim
- **cxaqemitcnpjcpf**: Emitente - Cnpj/Cpf
- **cxaqemitnome**: Emitente - Nome
- **cxaqempresa**: Código da Empresa
- **cxaqfrentista**: Codigo do Frentista Responsavel (FK)
- **cxaqmapa**: Data do Mapa (FK)
- **cxaqobs**: Observacoes
- **cxaqorigemcod**: Venda de origem do cheque (FK)
- **cxaqorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **cxaqplaca**: Placa Vinculada
- **cxaqpredatado**: Flag Pre-Datado 0-Nao 1-Sim
- **cxaqrespcnpjcpf**: Responsavel - Cnpj/Cpf
- **cxaqrespfone**: Responsavel - Fone
- **cxaqrespnome**: Responsavel - Nome
- **cxaqterceiros**: Flag Terceiros 0-Nao 1-Sim
- **cxaqvalor**: Valor do Cheque
- **cxaqvencimento**: Data de Vencimento
- **cxaqvenda**: Numero da Venda (FK)

---

## CXAT

**9 campos documentados**

- **cxatcaixa**: Numero do Caixa (FK)
- **cxatcodigo**: Codigo
- **cxatcombustivel**: Codigo do Combustivel (FK)
- **cxatempresa**: Código da Empresa
- **cxatestoquef**: Estoque no Final do Caixa
- **cxatestoquei**: Estoque no Inicio do Caixa
- **cxatmedicao**: Estoque Fisico no Final do Caixa
- **cxatmedicaoini**: Estoque Fisico no Inicio do Caixa
- **cxattanque**: Codigo do Tanque (FK)

---

## CXATEDE

**6 campos documentados**

- **cxatedecaixa**: Número do Caixa
- **cxatededataf**: Data e hora do Fechamento
- **cxatededatai**: Data e hora da Abertura
- **cxatedeempresa**: Código da Empresa
- **cxatedeterminal**: Nome do Terminal
- **cxatedetipocxa**: Tipo de Caixa

---

## CXAV

**4 campos documentados**

- **cxavcodcaixa**: Codigo do Caixa
- **cxavcodigo**: Codigo Sequencial
- **cxavempresa**: Codigo da Empresa(FK)
- **cxavfrentista**: Codigo do Frentista

---

## CXCP

**28 campos documentados**

- **cxcpautorizacao**: Numero de Autorizacao
- **cxcpcaixa**: Código Caixa que gerou a transação
- **cxcpcarteirasstatus**: Status que retornou da carteira digital
- **cxcpchave**: Chave do Cartao (FK)
- **cxcpcodigo**: Código PK CXCP
- **cxcpcodret**: Codigo do Retorno
- **cxcpcodserv**: variavel CODSERV
- **cxcpcomprovc**: comprovante cliente
- **cxcpcomprove**: comprovante estabelecimento
- **cxcpdata**: variaveis DATA e HORA
- **cxcpempresa**: Código da Empresa (FK)
- **cxcpfrentista**: Codigo do Frentista Responsavel (FK)
- **cxcpipirangaidcesta**: Ipiranga: ID CESTA, código UUID usado para identificacao da cesta Ipiranga, usar nos pagamentos também
- **cxcpipirangatipocomponente**: IPIRANGA: Tipo Componente 1-Pista/2-AmPm/5-JetOil
- **cxcpmapa**: Data do Mapa (FK)
- **cxcpnomeband**: variavel NOMEBAND
- **cxcpnomerede**: variavel NOMEREDE
- **cxcpnsu**: variavel NSU
- **cxcpoperacao**: Flag Operacao (Debito) (Credito)
- **cxcporigemcod**: Venda de origem do cheque (FK)
- **cxcporigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **cxcpparcela**: Quantidade de Parcelas
- **cxcpperfiltef**: Perfil de configuração do TEF
- **cxcpstatus**: 0-Pendente | 1-Cancelamento TEF | 2-Cancelamento Manual
- **cxcptipo**: Flag Tipo (TEF) (POS)
- **cxcptipoparc**: Tipo Parcelamento 0-Estabelecimento 1-Administradora
- **cxcpvalor**: Valor do lancamento
- **cxcpvenda**: Venda Vinculada

---

## CXNT

**12 campos documentados**

- **cxntagencia**: Agencia
- **cxntbanco**: Banco
- **cxntcaixa**: (FK) Numero do Caixa
- **cxntcc**: Conta Corrente
- **cxntcodigo**: Codigo Sequencial
- **cxntdatahora**: Data e Hora
- **cxnteditavel**: Obs. Editavel 1-Cxa Aberto 2-Cxa Fechado 3-Cxa Processado
- **cxntempresa**: Codigo da Empresa
- **cxntobs**: Observação
- **cxnttipo**: Tipo de Anotação de Depósito 0-Comum 1-Dinheiro 2-Cheque
- **cxntusuario**: Usuario
- **cxntvalor**: Valor

---

## CXTP

**16 campos documentados**

- **cxtpautorizador**: Nome do Autorizador da Transação
- **cxtpcaixa**: Numero do Caixa
- **cxtpchave**: Chave do Tipo de Transação (FK)
- **cxtpcodigo**: Codigo Sequencial
- **cxtpcomprovante**: Comprovante
- **cxtpcpfcontato**: CPF do Contato
- **cxtpdata**: Data/Hora da Transação
- **cxtpempresa**: Codigo da Empresa (FK)
- **cxtpfonecontato**: Fone do Contato
- **cxtpidtransacao**: Codigo ID da Transação na Operadora
- **cxtpnomecontato**: Nome do Contato
- **cxtpobscontato**: Obs do Contato
- **cxtpstatus**: Status 0-Pendente 1-Autorizado 2-Não Aprovado
- **cxtptipo**: Tipo 1-Pix
- **cxtpvalor**: Valor da Transação
- **cxtpvenda**: Codigo da Venda

---

## DCBI

**5 campos documentados**

- **dcbicodigo**: Código
- **dcbidcbo**: Código pai DCBO
- **dcbiestoq**: Código da ESTOQ(FK)
- **dcbiproduto**: Código da Matéria Prima (FK)
- **dcbiquantidade**: Quantidade Consumida

---

## DCBO

**9 campos documentados**

- **dcbocodigo**: Código
- **dcbodata**: Data
- **dcboempresa**: Código da Empresa
- **dcbolocal**: Local Estoque
- **dcboobservacao**: Observação
- **dcbooperacao**: 0-Decompor(Materia Prima -> Produto) e 1-Compor(Produto -> Materia Prima)
- **dcboproduto**: Produto (FK)
- **dcboquantidade**: Quantidade
- **dcbovditcodigo**: Código do item da venda

---

## DIFC

**18 campos documentados**

- **difcagencia**: Nro. Agência
- **difcautorizacao**: Nro. Autorização
- **difcbanco**: Nro. Banco
- **difcchaverece**: Rece (Fk)
- **difccodigo**: Codigo Sequencial
- **difcconta**: Nro. Conta
- **difchoratransacao**: Data e hora da Transação
- **difcnrocartao**: Nro. Cartão
- **difcnsu**: Nro. NSU
- **difctaxa**: Taxa
- **difctaxapagto**: Valor Taxa no Pagamento da Conciliação
- **difctaxavenda**: Valor Taxa na Venda da Conciliação
- **difcvalorbruto**: Valor Bruto
- **difcvalorbrutopagto**: Valor Bruto no Pagamento da Conciliação
- **difcvalorbrutovenda**: Valor Bruto na Venda da Conciliação
- **difcvalorliquido**: Valor Líquido
- **difcvalorliquidopagto**: Valor Líquido no Pagamento da Conciliação
- **difcvalorliquidovenda**: Valor Líquido na Venda da Conciliação

---

## DOCPEND

**6 campos documentados**

- **docpendcodigovda**: Codigo da venda (FK)
- **docpendempresa**: Codigo da Empresa (FK)
- **docpendmodelo**: Modelo Documento
- **docpendnumero**: Numero Documento
- **docpendserie**: Serie Documento
- **docpendtipo**: Tipo Documento

---

## DREC

**3 campos documentados**

- **dreccodigo**: Codigo Sequencial
- **drecdescricao**: Descricao
- **drectitulo**: Titulo (FK)

---

## DREP

**9 campos documentados**

- **drepcodigo**: Codigo Sequencial
- **drepconta**: Conta(FK)
- **drepdata**: Data do Resultado
- **drepempresa**: Código da Empresa (FK)
- **drepoperacao**: Operação(FK)
- **drepterminal**: Terminal de Processamento
- **dreptipo**: Tipo de DRE
- **dreptitulo**: Título(FK)
- **drepvalor**: Valor do Resultado

---

## DRET

**3 campos documentados**

- **dretcodigo**: Codigo Sequencial
- **dretdescricao**: Descricao
- **dretoperacao**: Operacao

---

## DREXC

**16 campos documentados**

- **drexcabr**: Valor DRE Abril
- **drexcago**: Valor DRE Agosto
- **drexcconta**: Conta(FK)
- **drexcdescricao**: Descrição
- **drexcdez**: Valor DRE Dezembro
- **drexcfev**: Valor DRE Fevereiro
- **drexcjan**: Valor DRE Janeiro
- **drexcjul**: Valor DRE Julho
- **drexcjun**: Valor DRE Junho
- **drexcmai**: Valor DRE Maio
- **drexcmar**: Valor DRE Março
- **drexcnov**: Valor DRE Novembro
- **drexcoperacao**: Operação
- **drexcout**: Valor DRE Outubro
- **drexcset**: Valor DRE Setembro
- **drexctitulo**: Título(FK)

---

## DREXD

**6 campos documentados**

- **drexdcodigo**: Codigo Sequencia
- **drexdconta**: Conta(FK)
- **drexddescricao**: Descrição
- **drexdmes**: Mes de Referencia
- **drexdorigem**: Origem do Lancamento
- **drexdvalor**: Valor DRE

---

## DREXO

**14 campos documentados**

- **drexoabr**: Valor DRE Abril
- **drexoago**: Valor DRE Agosto
- **drexodescricao**: Descrição
- **drexodez**: Valor DRE Dezembro
- **drexofev**: Valor DRE Fevereiro
- **drexojan**: Valor DRE Janeiro
- **drexojul**: Valor DRE Julho
- **drexojun**: Valor DRE Junho
- **drexomai**: Valor DRE Maio
- **drexomar**: Valor DRE Março
- **drexonov**: Valor DRE Novembro
- **drexooperacao**: Operação
- **drexoout**: Valor DRE Outubro
- **drexoset**: Valor DRE Setembro

---

## DREXT

**15 campos documentados**

- **drextabr**: Valor DRE Abril
- **drextago**: Valor DRE Agosto
- **drextdescricao**: Descrição
- **drextdez**: Valor DRE Dezembro
- **drextfev**: Valor DRE Fevereiro
- **drextjan**: Valor DRE Janeiro
- **drextjul**: Valor DRE Julho
- **drextjun**: Valor DRE Junho
- **drextmai**: Valor DRE Maio
- **drextmar**: Valor DRE Março
- **drextnov**: Valor DRE Novembro
- **drextoperacao**: Operação
- **drextout**: Valor DRE Outubro
- **drextset**: Valor DRE Setembro
- **drexttitulo**: Título(FK)

---

## DRTQ

**9 campos documentados**

- **drtqagua**: Presença de Água (Sim - Não)
- **drtqcodigo**: Código PK tabela
- **drtqdata**: Data da Drenagem
- **drtqempresa**: Código FK da Empresa
- **drtqimpureza**: Presença de Impurezas (Sim - Não)
- **drtqmedidas**: Medidas adotadas
- **drtqqtd**: Quantidade Drenada
- **drtqresponsavel**: Nome do Responsável
- **drtqtanque**: Código FK do Tanque

---

## DVCC

**18 campos documentados**

- **dvccbandeira**: Bandeira da Transacao EX: MASTERCARD | VISA | ELO | ETC...
- **dvccchavecartao**: Codigo da Chave de Cartoes
- **dvcccodigo**: Código PK tabela
- **dvcccodigocxa**: Código do Vinculo com o Caixa
- **dvcccodigovdpg**: Código do Vinculo com a Venda Formas de Pagto
- **dvccdatahora**: Data/Hora da Transacao
- **dvccdataprocessamento**: Data do Processamento do Vinculo
- **dvccdatavencimento**: Data do Vencimento da Transacao
- **dvccempresa**: Código da Empresa
- **dvccmodalidade**: Modalidde da Transacao: C-Credito | D-Debito
- **dvccnsu**: Codigo NSU da Transacao
- **dvccnumeroautorizacao**: Numero da Autorizacao da Transacao
- **dvccnumterminal**: Número do Terminal
- **dvccoperadora**: Operadora da Transacao: REDE | GETNET ... 
- **dvcctaxapercentual**: Taxa de Desconto em Percentual da Transacao
- **dvcctaxavalor**: Taxa de Desconto em Valor da Transacao
- **dvcctipoimp**: Tipo de Importacao dos Dados. ARQ ou CONC
- **dvccvalor**: Valor da Transacao

---

## E_PARS

**7 campos documentados**

- **e_parscodigo**: Codigo Sequencial
- **e_parsempresa**: Codigo da Empresa
- **e_parsendereco**: Codigo do Endereco (fk)
- **e_parslimite**: Limite de Credito a Prazo
- **e_parslimiteadic**: Limite de Credito Adicional a Prazo
- **e_parspdvsaldolimite**: Saldo de Contas a Receber por Endereço
- **e_parspermitevenda**: Permite vender para o endereço 0-Não | 1-Sim

---

## E_PART

**102 campos documentados**

- **e_part_trv_cfr**: [#p09] Permite trocar carta frete: 1-SIM | 0-NAO
- **e_part_trv_chq**: [#p09] Permite trocar cheque: 1-SIM | 0-NAO
- **e_part_trv_cre**: [#p09] Permite trocar credito: 1-SIM | 0-NAO
- **e_part_trv_deb**: [#p09] Permite trocar debito: 1-SIM | 0-NAO
- **e_part_trv_dep**: [#p09] Permite trocar deposito: 1-SIM | 0-NAO
- **e_part_trv_pre**: [#p09] Permite trocar cheque pré-datado: 1-SIM | 0-NAO
- **e_part_trv_prz**: [#p09] Permite trocar dinheiro: 1-SIM | 0-NAO
- **e_part_trv_val**: [#p09] Permite trocar Vale: 1-SIM | 0-NAO
- **e_partagregarda**: [#p06] Agregar Desconto/Acrescimo no Produto 0-Não Agregar | 1-Sim Agregar
- **e_partativo**: Data do Cadastro
- **e_partbloqdesctotal**: Bloqueia Todo Tipo de Desconto Para o Participante (0=Não | 1=Sim)
- **e_partbloqincond**: [#p17] Bloqueio Inondicional (S/N)
- **e_partbloqmotivo**: [#p17] Motivo do Bloqueio Inondicional
- **e_partbloqueiototalapp**: Flag para Bloquar Totalmente Aplicativos, 1 = Libera os descontos SGA e APP, 0 = Só libera desconto SGA, bloqueando os descontos APP
- **e_partboleto**: [#p11] Gerar boleto (S/N)
- **e_partboletocc**: [#p11] Conta Corrente (FK)
- **e_partboletopb**: [#p11] Flag do Boleto 0-Baixar | 1-Protestar | 2-Expirar
- **e_partboletopbdias**: [#p11] Quantidade de Dias para Baixar ou Protestar
- **e_partbolpdvtpenvio**: Indica se o Boleto Pdv é impresso, enviado por email ou ambos: 0-Impresso | 1-E-mail | 2-Ambos
- **e_partcodigo**: Codigo Sequencial
- **e_partcodpremia**: [#p07] Código premia frentista
- **e_partcodrapido**: Codigo Rapido do Participante
- **e_partcomissao**: [#p07] Tem comissão de vendedor Sim/Não
- **e_partdatacredito**: [#p19] Data da Ultima consulta de Credito
- **e_partdesconto**: [#p12] Taxa de Desconto por Pagamento em Dia
- **e_partdesconto_app**: Flag para liberar os descontos do PDV, 1 = Libera os descontos SGA e APP, 0 = Só libera desconto SGA, bloqueando os descontos APP
- **e_partdocfpadrao**: [#p06] Flag de Documento Fiscal Padrão 6)Consumidor 7)NFe 8)Consumidor+5929
- **e_partdocfprint**: [#p06] Flag de Impressão de NFC-e (0)Não Imprimir (1)Impressao Resumida (2)Impressao Completa
- **e_partduplicata**: [#p10] Flag de Impressão de Duplicata 0-Não 1-Sim
- **e_partempresa**: Codigo da Empresa
- **e_partexpira**: [#p12] Quantidade de Dias para expirar o cliente
- **e_partexpiradata**: [#p18] Data limite para expiração de cadastro
- **e_partexpiradias**: [#p18] Quantidade de dias sem venda p/ Expirar cadastro
- **e_partexpiratipo**: [#p18] Tipo de Expiração. 0-Não Expirar | 1-Data Fixa | 3-Periodo sem Venda
- **e_partfatura**: [#p10] Gerar fatura (S/N)
- **e_partfpgto**: [#p03] Forma de Pagamento (FK)
- **e_partfreteaceita**: [#p08] Aceita Carta Frete (Sim/Não)
- **e_partfretepeso**: [#p08] Tipo do Calculo de Peso (0)Peso Saida (1)Peso Chegada (3)Calculo Livre
- **e_partfretequebra**: [#p08] Porcentagem de Quebra Aceita
- **e_partfretetipo**: [#p08] Tipo do Calculo de Quebra (0)Quebra Livre (1)Quebra Fixa
- **e_partgrupo**: [#p01] Grupo de Cliente (FK)
- **e_partidallb**: [#p07] ID Visualizar Abastecimentos 0-Somente Proprio 1-ver Todos 2-Vender Todos
- **e_partidcode**: [#p07] ID CODE do funcionario
- **e_partidpass**: [#p07] ID SENHA do funcionario
- **e_partimpinfcredito**: Imprimir Crédito/Saldo Devedor/Qtd Dias da Conta Mais Antiga na Venda a Prazo
- **e_partimprimirmediakm**: Imprime média KM na venda
- **e_partinativo**: Data do Inativo
- **e_partinativomotivo**: Motivo da inativação
- **e_partipirangacodigovip**: IPIRANGA código VIP 
- **e_partipirangafuncenvio**: IPIRANGA data da última atualização desse funcionário na API employee 
- **e_partipirangatipocomponente**: IPIRANGA código tipo componente ipiranga 
- **e_partjuros**: [#p12] Taxa de Juros ao Dia por Atraso
- **e_partlibemprestimo**: [#p13] Liberar Empréstimo (S/N)
- **e_partlimite**: Limite de Credito a Prazo
- **e_partlimiteadic**: Limite de Credito Adicional a Prazo
- **e_partlimitechq**: Limite de Credito em Cheque
- **e_partlimitechqadic**: Limite de Credito Adicional em Cheque
- **e_partmesfaturaok**: [#p16] Faturamento Mensal de Servicos, ultimo mes gerado
- **e_partmesfatuvenc**: [#p16] Dia de Vencimento da Fatura Mensal de Servicos
- **e_partmeslotefatu**: [#p16] Gera Lote de Fatura Mensal de Servicos0-Não | 1-Sim
- **e_partmulta**: [#p12] Taxa de Multa por Atraso
- **e_partnferesumo**: [#p15] Gera Nota Fiscal Resumo (Sim/Não)
- **e_partobrigapedido**: Obriga Vincular Pedido na NFe de Entrada?
- **e_partobrigavdaprog**: [#p06] Obrigatório Venda Programada. 0-Não | 1-Sim
- **e_partordemcompra**: [#p04] Solicitar Ordem de Compra na Venda 0-Nao 1-Sim
- **e_partorgaopublico**: Indica se o Participante é Orgão Público: 0-Não e 1-Sim
- **e_partparticipante**: Codigo do Participante
- **e_partpdvdataexpira**: PDV Data de Expiracao por Pendencia Financeira
- **e_partpdvqtdprgc**: PDV Quantidade de Carteiras de Venda Programada
- **e_partpdvsaldochqp**: PDV Saldo de Cheques pre-Datado
- **e_partpdvsaldoprgc**: PDV Saldo de Venda Programada
- **e_partpdvsaldorece**: PDV Saldo de Contas a Receber
- **e_partpermiterecpdv**: [#p14] Quando habilitado permite recebimento no PDV
- **e_partpersonal**: Tabela Interna de Personalizacoes
- **e_partpersonalnovo**: Tabela Interna de Personalizacoes Tela Nova
- **e_partpgtocheque**: [#p05] Permitir Vender em  Cheque (S)im (N)ao
- **e_partpgtocredito**: [#p05] Permitir Vender em  Credito (S)im (N)ao
- **e_partpgtodebito**: [#p05] Permitir Vender em  Debito (S)im (N)ao
- **e_partpgtodeposito**: [#p05] Permitir Vender em  Deposito (S)im (N)ao
- **e_partpgtofrete**: [#p05] Permitir Vender em  Frete (S)im (N)ao
- **e_partpgtoprazo**: [#p05] Permitir Vender em  Prazo (S)im (N)ao
- **e_partpgtopre**: [#p05] Permitir Vender em  Cheque Pre (S)im (N)ao
- **e_partpgtovale**: [#p05] Permitir Vender em  Vda Prg (S)im (N)ao
- **e_partprintlc**: [#p06] Imprimir Posição de Limite de Crédito 0-Não | 1-Sim
- **e_partptsfidelidadedependente**: Indica se o Participante vai gerar pts fidelidade para dependente: 0-Não e 1-Sim
- **e_partregra**: [#p02] Regras de Precos (FK)
- **e_partrplibera**: [#p07] Libera Funcionário para o controle de Cartão
- **e_partrpviradata**: [#p07] Controle de virada de movimento de Data
- **e_parttabelafixa**: [#p02] Tabela de Preco Fixa
- **e_parttempocob**: [#p20] Codito da Linha do Tempo de Cobranca (FK)
- **e_parttipocobranca**: [#p11] Tipo Cobrança 1 - Boleto | 2 - PixBoleto | 3 - Boleto PDV
- **e_parttolera**: [#p12] Quantidade de Dias de Tolerancia apos o vencimento
- **e_partvdactrlprazo**: [#p06] Flag de Controle Venda a Prazo 4 digitos, 1D-Visual 2D-Whats 3D-APP 4D-Assinatura
- **e_partvdadoc**: [#p06] Flag de Envio de Documento na Venda (0)Enviar (1)Não Enviar (2)Permite Trocar
- **e_partvdaenviaemail**: [#p06] Flag de Envio de e.Mail na Venda (0)Todos (1)Somente NFCe (2)Somente NFe (3)Nenhum
- **e_partvdaenviawhats**: [#p06] Flag de Envio de Whats na Venda (0)Todos (1)Somente NFCe (2)Somente NFe (3)Nenhum
- **e_partvendacapacidadetanque**: [#p04] Vender somente conforme a capacidade do tanque do veiculo (S/N)
- **e_partvendadependente**: [#p04] Vender somente com Seleção de Dependentes (Sim/Não/Inf)
- **e_partvendakm**: [#p04] Vender somente com km (S/N)
- **e_partvendaplaca**: [#p04] Vender somente com Placa (Sim/Não/Inf)
- **e_partvendareq**: [#p04] Vender somente com requisicao (S/N)
- **e_partvendavistarestr**: [#p04] Vender a Vista Mesmo com Restricao (S/N)

---

## E_PARV

**12 campos documentados**

- **e_parvcodigo**: Codigo Sequencial
- **e_parvempresa**: Codigo da Empresa
- **e_parvlimite**: Limite de credito
- **e_parvlimiteadic**: Limite de Credito Adicional a Prazo
- **e_parvlimitechq**: Limite de Credito em Cheque
- **e_parvlimitechqadic**: Limite de Credito Adicional em Cheque
- **e_parvlimitelt**: Limite de Credito em Litros
- **e_parvlimiteltadic**: Limite Adicional de Credito em Litros
- **e_parvpdvsaldochqp**: Saldo de Cheques pre-Datado por placa
- **e_parvpdvsaldolts**: Saldo de Litros por placa
- **e_parvpdvsaldorece**: Saldo de Contas a Receber por placa
- **e_parvveiculo**: Codigo do Veiculo (fk)

---

## E_PROD

**141 campos documentados**

- **e_prodaceitetrib**: [#p09] Aceita a Tributação do Produto Sugerida pelo Sistema 0-Não 1-Sim
- **e_prodacreditecodinterno**: ACREDITE: Código Interno ACREDITE
- **e_prodacreditefimvigencia**: ACREDITE: Data fim vigência
- **e_prodacrediteultatu**: Data da Ultima atualização fiscal da ACREDITE
- **e_prodadulto**: Produto destinado a adultos 0-Não | 1-Sim
- **e_prodagrupitensficha**: Flag para definir se os itens da impressão da ficha serão agrupados: 0 = Não | 1 = Sim | 2 = Individualizar
- **e_prodaliqadrem**: Alíquota AdRem do imposto retido anteriormente estabelecida em legislação
- **e_prodaliqirrf**: Aliquota IRRF
- **e_prodalterarapice**: Data da última sincronização com sistema APICE
- **e_prodaltpreco**: Data da Ultima Alteracao de Preco (Campo Exclusivo p/ Combustivel)
- **e_prodamecashback**: [#p12] Percentual Cashback Ame
- **e_prodanp**: [#p06] Anp (FK)
- **e_prodativo**: Data do Cadastro
- **e_prodatualizapostoaki**: Flag para enviar produto após alteração para o Posto Aki 0-Não | 1-Sim
- **e_prodbalanca**: [#p01] Produto de Balanca 0-Nao 1-Sim
- **e_prodbenef**: [#p06] Codigo Beneficio Fiscal
- **e_prodbloqnegativo**: [#p01] Permite venda de produto estoque negativo 0-Não | 1-Sim
- **e_prodbloqueado**: [#p01] Bloquear Movimentacao no cadastro de produto 0-Não/1-Sim
- **e_prodcalcbasest**: Cálculo de Base ST Médio Sobre as Compras
- **e_prodcalcvlrst**: Cálculo do Valor ST Médio Sobre as Compras
- **e_prodcest**: [#p06] Codigo Cest
- **e_prodcfop**: [#p07] Codigo CFOP DE SAIDA 
- **e_prodcfope**: [#p08] Codigo CFOP DE ENTRADA
- **e_prodcodigo**: Codigo
- **e_prodcodigorapido**: Código Rapido do Produto Por Empresa
- **e_prodcomissao**: [#p02] Comissao (FK)
- **e_prodcustcod**: [#p04] Código da Última Cust Deste Produto
- **e_prodcusto**: [#p04] Valor de Custo
- **e_proddataalteracao**: Data da última alteração da E_PROD
- **e_proddensidade**: [#p11] Densidade
- **e_proddescmaximo**: [#p11] Desconto Maximo do Produto na venda
- **e_proddestprod**: Codigo do Setor de Produção (FK)
- **e_proddiasantvencto**: Quantidade de Dias Para Avisar Antes do Vencimento
- **e_proddrecmv**: [#p10] Código da Conta de CMV (FK)
- **e_proddrevenda**: [#p10] Código da Conta de venda (FK)
- **e_prodempresa**: Codigo da Empresa
- **e_prodfabricante**: IPIRANGA: Código do Fabricante
- **e_prodfcp**: [#p06] Percentual de Fundo de Combate a Pobreza
- **e_prodfornecedor**: [#p02] Código do principal fornecedor do respectivo produto
- **e_prodgeralmc**: [#p06] Gera LMC do Produto 0-Não | 1-Sim | 2 - Somente Encerrante
- **e_prodgerasped**: [#p07] Gera Sped do Produto 0-Não | 1-Sim
- **e_prodglp**: [#p06] Percentual de GLP derivado do petroleo
- **e_prodgni**: [#p06] Percentual de Gás Natural Importado
- **e_prodgnn**: [#p06] Percentual de Gás Natural Nacional
- **e_prodgoaldom**: [#p03] Proposito de Venda Deste Combustivel para Domingo
- **e_prodgoalqua**: [#p03] Proposito de Venda Deste Combustivel para Quarta
- **e_prodgoalqui**: [#p03] Proposito de Venda Deste Combustivel para Quinta
- **e_prodgoalsab**: [#p03] Proposito de Venda Deste Combustivel para Sabado
- **e_prodgoalseg**: [#p03] Proposito de Venda Deste Combustivel para Segunda
- **e_prodgoalsex**: [#p03] Proposito de Venda Deste Combustivel para Sexta
- **e_prodgoalter**: [#p03] Proposito de Venda Deste Combustivel para Terca
- **e_prodicms**: [#p07] Aliquota ICMS
- **e_prodicmsrep**: [#p07] Aliquota ICMS Repasse
- **e_prodimendescodinterno**: IMENDES: Código Interno IMENDES
- **e_prodimendesfimvigencia**: IMENDES: Data fim vigência
- **e_prodimendesinivigencia**: IMENDES: Data início vigência
- **e_prodimendesultatu**: Data da Ultima atualização fiscal da IMENDES
- **e_prodimpficha**: Flag para impressão da ficha do produto: 0 = Não | 1 = Sim | 2 = Perguntar
- **e_prodinativo**: Data do Inativo
- **e_prodinforlub**: [#p01] Integração com InforLub 0-Não/1-Sim
- **e_prodipirangaatividadecomponente**: IPIRANGA: Código Atividade Componente
- **e_prodipirangacodinterno**: IPIRANGA: Código Interno
- **e_prodipirangacodlivre**: IPIRANGA: Código Livre
- **e_prodipirangaempresa**: IPIRANGA: Código Empresa D=DPPI ou C=CBPI
- **e_prodipirangaespecificacao1**: IPIRANGA: Agrupador de Características de um determinado produto
- **e_prodipirangaespecificacao2**: IPIRANGA: Agrupador de Características de um determinado produto
- **e_prodipirangaestoqueenvio**: IPIRANGA: Data envio estoque
- **e_prodipirangagrupo**: IPIRANGA: Código Livre
- **e_prodipirangahash**: IPIRANGA: Hash de sincronismo
- **e_prodipirangajetoilpreco**: IPIRANGA: Vlr Venda Enviado Ipiranga JetOil
- **e_prodipirangasecao**: IPIRANGA: Código Livre
- **e_prodipirangavinculomanual**: IPIRANGA: Vínculo Manual 1-Sim|2-Não
- **e_prodlibcomanda**: Liberar Uso na Comanda 0-Não | 1-Sim
- **e_prodliberapdv**: Flag Status de Liberacao PDV 0-N 1-Inc 10-OK 99-Erro
- **e_prodliberaunitvda**: [#p01] Permite liberar valor na venda
- **e_prodlocal**: [#p02] Localizacao (FK)
- **e_prodmaximo**: [#p11] Venda Maxima
- **e_prodminimo**: [#p11] Estoque Minimo
- **e_prodmkpmax**: [#p04] Faixa de Markup Maximo
- **e_prodmkpmin**: [#p04] Faixa de Markup Minimo
- **e_prodnatrec**: [#p07] Codigo da Natureza de Receita (FK)
- **e_prodncm**: [#p06] Ncm (FK)
- **e_prodncmexcecao**: [#p06] Codigo Ncm Excecao
- **e_prodnroordemlmc**: Número da Última Ordem do LMC
- **e_prodorigemmonof**: Indicador de importação do produto 0-Nacional | 1-Importado (para produtos monofásicos)
- **e_prodpauta**: [#p04] Valor de Pauta
- **e_prodpcce**: [#p09] (FK) Codigo Plano de Conta Contabil EFD Entrada
- **e_prodpccs**: [#p09] (FK) Codigo Plano de Conta Contabil EFD Saida
- **e_prodpercbiocombustivel**: Indica o índice de Mistura do Biodiesel no combustível
- **e_prodpercuforigemmonof**: Percentual do produto para a UF de origem (para produtos monofásicos)
- **e_prodpersonal**: Tabela Interna de Personalizacoes
- **e_prodpersonalnew**: Tabela Interna de Personalizacoes Tela Nova
- **e_prodpreco99taxi**: 99 TAXI: Vlr Venda Enviado 99 Taxi
- **e_prodprecovalue4u**: Value4u: Vlr Venda Enviado para a Value4u
- **e_prodproduto**: Codigo do Produto
- **e_prodprofrota**: IPIRANGA: Vlr Venda Enviado Pro-Frotas
- **e_prodpromocod**: [#p12] Codigo pai que o produto verifica a promocao
- **e_prodpromoqtd**: [#p12] Qtd em Promocao
- **e_prodpromovlr**: [#p12] Vlr em Promocao
- **e_prodredicmsefet**: [#p07] Percentual de reducao da base de calculo efetiva
- **e_prodreposicao**: [#p11] Quantidade de Reposição do Estoque
- **e_prodstcs**: [#p07] ST CS
- **e_prodstic**: [#p07] ST ICMS DE SAIDA
- **e_prodstice**: [#p08] ST ICMS DE ENTRADA
- **e_prodsticorigement**: [#p08] ORIGEM ST ICMS DE ENTRADA
- **e_prodsticorigemsai**: [#p07] ORIGEM ST ICMS DE SAIDA
- **e_prodstip**: [#p07] ST IPI DE SAIDA
- **e_prodstipe**: [#p08] ST IPI DE ENTRADA
- **e_prodstpc**: [#p07] ST Pis Cofins de Saida
- **e_prodstpce**: [#p08] ST Pis Cofins de Entrada
- **e_prodt10**: [#p05] Tipo Indice Venda 10 %-,%+,$-,$+,VF
- **e_prodt11**: [#p05] Tipo Indice Venda 11 %-,%+,$-,$+,VF
- **e_prodt12**: [#p05] Tipo Indice Venda 12 %-,%+,$-,$+,VF
- **e_prodt2**: [#p05] Tipo Indice Venda 2  %-,%+,$-,$+,VF
- **e_prodt3**: [#p05] Tipo Indice Venda 3  %-,%+,$-,$+,VF
- **e_prodt4**: [#p05] Tipo Indice Venda 4  %-,%+,$-,$+,VF
- **e_prodt5**: [#p05] Tipo Indice Venda 5  %-,%+,$-,$+,VF
- **e_prodt6**: [#p05] Tipo Indice Venda 6  %-,%+,$-,$+,VF
- **e_prodt7**: [#p05] Tipo Indice Venda 7  %-,%+,$-,$+,VF
- **e_prodt8**: [#p05] Tipo Indice Venda 8  %-,%+,$-,$+,VF
- **e_prodt9**: [#p05] Tipo Indice Venda 9  %-,%+,$-,$+,VF
- **e_produforigemmonof**: UF de origem do produto (para produtos monofásicos)
- **e_produltalicms**: Ultima Aliquota icms de entrada
- **e_produltalipi**: Ultima Aliquota ipi de Entrada
- **e_produltsticms**: Ultima ST icms de entrada (FK)
- **e_produltstipi**: Ultima ST ipi de entrada (FK)
- **e_produltstpis**: Ultima ST pis de Entrada (FK)
- **e_produsabalanca**: Flag para saber se vai utilizar balança para pesagem de produto 0-Não | 1-Sim 
- **e_prodv1**: [#p05] Vlr Venda 1
- **e_prodv10**: [#p05] Vlr Venda 10
- **e_prodv11**: [#p05] Vlr Venda 11
- **e_prodv12**: [#p05] Vlr Venda 12
- **e_prodv2**: [#p05] Vlr Venda 2
- **e_prodv3**: [#p05] Vlr Venda 3
- **e_prodv4**: [#p05] Vlr Venda 4
- **e_prodv5**: [#p05] Vlr Venda 5
- **e_prodv6**: [#p05] Vlr Venda 6
- **e_prodv7**: [#p05] Vlr Venda 7
- **e_prodv8**: [#p05] Vlr Venda 8
- **e_prodv9**: [#p05] Vlr Venda 9
- **e_prodvalida**: [#p01] Validade Produto(Balanca)

---

## E_VSQL

**4 campos documentados**

- **e_vsqlcodigo**: Codigo PK tabela
- **e_vsqlcodigovsql**: Codigo da tabela VSQL
- **e_vsqlempresa**: Codigo da Empresa
- **e_vsqlstatus**: 0-Inativo | 1-Ativo

---

## EMA

**3 campos documentados**

- **emacodigo**: Codigo Ponto de Acesso
- **emadescricao**: Descricao do Ponto de Acesso
- **emahd**: Identificacao do HD

---

## EMF

**5 campos documentados**

- **emfcodigo**: Codigo da Fatura
- **emfid**: Identificacao da Empresa
- **emfmesbase**: Mes Base da Fatura
- **emfvalor**: Valor da Fatura
- **emfvencimento**: Vencimento da Fatura

---

## EMP

**35 campos documentados**

- **empapelido**: Apelido da Empresa
- **empbairro**: Bairro
- **empbandeiracodigo**: Codigo da Bandeira do Posto
- **empcep**: CEP
- **empcertarquivo**: Arquivo PFX Certificado
- **empcertcaminho**: Caminho Certificado
- **empcertsenha**: Senha Certificado
- **empcertvalidade**: Validade Certificado
- **empchave**: Chave de Operacao
- **empcidade**: Codigo Cidade
- **empcnpj**: CNPJ da Empresa
- **empcnpjatualizador**: CNPJ da Empresa Para Atualizar a Rede
- **empcodigo**: Codigo Sequencial
- **empcomplemento**: Complemento
- **empcor**: Codigo da Cor do PDV por empresa
- **empemail**: e.Mail
- **empfantasia**: Nome Fantasia
- **empfone**: Número do Telefone
- **emphash**: Chave Hash
- **empid**: ID da Licenca SGAPETRO
- **empie**: Inscrição Estadual da Empresa
- **empim**: Inscrição Municipal da Empresa
- **empinativo**: Data do Inativo
- **emplicencaok**: Licença OK
- **emplogradouro**: Logradouro
- **empmatrizpart**: Ligacao com a Empresa Matriz na tabela de Participante
- **empmatrizprod**: Ligacao com a Empresa Matriz na Tabela de Produto
- **empnro**: Número
- **emprazao**: Razão Social da Empresa
- **emprepcod**: Codigo Representante
- **emprepnom**: Nome Representante
- **empsigla**: Sigla da Empresa
- **empsyncinativo**: Data do Inativo
- **emptoken**: Token
- **empuf**: UF

---

## ENTCPA

**62 campos documentados**

- **entcpaaceitardata**: Aceitar Data
- **entcpaaceite**: Documento com Aceite de Liberação para Lancamento 0Nao 1Sim
- **entcpacaixa**: Caixa Lancamento (FK)
- **entcpacalculocusto**: Calculo do Custo (1)Custo Medio (2)Ultimo Custo (3)Nao Calcula Custo
- **entcpacalculofrete**: Calculo do Frete
- **entcpacancdominio**: ID do Envio da Nota(Cancelada) para API Dominio
- **entcpachave**: Chave do Documento
- **entcpachavecte**: Chave do Documento
- **entcpachavenferef**: Chave da NFe Referenciada
- **entcpachegada**: data Chegada
- **entcpacienciadatahora**: Data/Hora ciencia do cancelamento pendente
- **entcpacienciausucancelpend**: Usuario que deu ciencia do cancelamento pendente
- **entcpacodigo**: Codigo Sequencial
- **entcpacte**: Codigo FK do Cte, usado na versao nova da Compra
- **entcpactmodelo**: Modelo do Conhecimento de Transporte
- **entcpadocumento**: Data e Hora do Ajuste
- **entcpadominio**: ID do Envio da Nota para API Dominio
- **entcpaemissao**: data Emissao
- **entcpaempresa**: Codigo da Empresa
- **entcpafinalidadenfe**: Finalidade (1)Normal (2)Complemento (3)Ajuste (4)DevolucaoRetorno
- **entcpafornecedor**: Codigo do Fornecedor (FK)
- **entcpafornecedorxml**: Fornecedor XML
- **entcpageraramostra**: (0)Não (1)Sim
- **entcpaipirangadatasync**: Data da Envio
- **entcpaipirangahash**: IPIRANGA: Controle de envio
- **entcpalancamento**: Manual/Xml/Manifesto
- **entcpamodelo**: Codigo do Documento (FK)
- **entcpanatureza**: 1comb/2prod/3Serv/4imob/5consum/6brind/90outras
- **entcpansu**: Numero do NSU do Manifesto
- **entcpaobservacao**: Observacao
- **entcpapedido**: Número do Pedido
- **entcpapedidocodigo**: Código do Pedido Vinculado na Nota
- **entcpaplaca**: Placa do Veiculo Transportador
- **entcpaproceminfe**: Processo de Emissao (0) App Proprio (1) Avulso Fisco (2) Avulso Fisco Certificado Proprio (3) App Fisco (Emissao Propria) 
- **entcpaprocessada**: data Processamento
- **entcpaschema**: Schema XML
- **entcpaserie**: Numero de Serie
- **entcpastsarqdata**: Data do Arquivo
- **entcpastsarqtipo**: (0)Não (1)Processo (10)Arquivo
- **entcpastsarqusuario**: Usuario do Arquivo
- **entcpastsauto**: Status de Processos Automaticos (0-Liberado / 1-Bloqueado)
- **entcpastsciedata**: Data da Ciencia
- **entcpastscieusuario**: Usuario da Ciencia
- **entcpastsgeral**: Status Geral com origem em trigger (0) Erro (1) Aguard Ciencia (2) Aguard Xml (3) em Lancamento (4) Ignorada (10) Arquivada
- **entcpastslerdata**: Data da Leitura
- **entcpastslertipo**: (1)Sefaz (2)Nsu (3)Chave (4)Xml (5)Manual
- **entcpastslerusuario**: Usuario da Leitura
- **entcpastsmandata**: Data da Manifestação
- **entcpastsmantipo**: (0)Pendente (1)Confirmado (2)Rejeitado (3)Cancelado (4)Esquecida (5)Não Manifestada
- **entcpastsmanusuario**: Usuario da manifestação
- **entcpastsmanxml**: Xml do Manifesto
- **entcpastsxmldata**: Data do Xml
- **entcpastsxmlusuario**: Usuario do XML
- **entcpatotalxml**: Valor Total da Nota(XML)
- **entcpatpfrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **entcpatppgto**: Tipo Pagamento (0)Vista (1)Prazo (2)Outros
- **entcpatransportador**: Codigo do Transportador (FK)
- **entcpatransportadoracnpj**: Transportadora Cnpj
- **entcpausuariopedido**: Usuario que deu aceitou diferenca no pedido x nfe
- **entcpavalorrateio**: Valor de rateio do documento de compra
- **entcpavlrtotal**: Valor Total da Compra com origem em trigger
- **entcpaxmlcompra**: Xml de Compra

---

## ENTCPAX

**26 campos documentados**

- **entcpaxaceitachegada**: Aceita Data de Chegada Diferente da data de Emissao
- **entcpaxcdespesa**: Centro de Despesas do Financeiro
- **entcpaxchave**: Chave do Documento
- **entcpaxchegada**: data Chegada
- **entcpaxcodigo**: Codigo Sequencial
- **entcpaxdatacad**: Data Hora do Inicio do Processo
- **entcpaxdocumento**: Data e Hora do Ajuste
- **entcpaxdre**: Conta do DRE
- **entcpaxemissao**: data Emissao
- **entcpaxempresa**: Codigo da Empresa(FK)
- **entcpaxfornecedor**: Codigo do Fornecedor (FK)
- **entcpaxgdespesa**: Grupo  de Despesas do Financeiro
- **entcpaxlancamento**: Manual/Xml/Manifesto
- **entcpaxliberado**: Processamento Liberado
- **entcpaxmodelo**: Codigo do Documento (FK)
- **entcpaxnatureza**: 1comb/2prod/3Serv/4imob/5consum/6brind/7comodato/8bonificacao/9Devolução de Compra/10Cesta Básica / Uniformes/90outras
- **entcpaxnsu**: Numero do NSU do Manifesto
- **entcpaxobsfinanc**: Observação Financeira
- **entcpaxplaca**: Placa do Veiculo Transportador
- **entcpaxrateio**: Valor Temporario para Rateio
- **entcpaxserie**: Numero de Serie
- **entcpaxtpfrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **entcpaxtppgto**: Tipo Pagamento (0)Vista (1)Prazo (2)Outros
- **entcpaxtransportador**: Codigo do Transportador (FK)
- **entcpaxxmlcompra**: Xml de Compra
- **entcpaxxmltotal**: Valor Total da importacao da NF

---

## ENTCPI

**108 campos documentados**

- **entcpiaceitabalanco**: Aceita Entrada Com Balanço Posterior a Chegada
- **entcpiaceitacusto**: Aceita Variacao de Custo Sim/Nao
- **entcpiacrescimo**: Valor de Acrescimos Totais do Item
- **entcpiacrescimocusto**: Valor de Acrescimo no Custo dos Item não pertencente ao Documento
- **entcpiagendatroca**: Agenda troca de preco
- **entcpialiqcofins**: Aliquota Cofins
- **entcpialiqfcp**: Aliquota FCP
- **entcpialiqicms**: Aliquota Icms
- **entcpialiqipi**: Aliquota Ipi
- **entcpialiqpis**: Aliquota Pis
- **entcpialiqst**: Aliquota ST
- **entcpialiqstret**: Aliquota ST Retido
- **entcpibasefcp**: Base de FCP
- **entcpibaseicms**: Base de Icms
- **entcpibaseipi**: Base de Ipi
- **entcpibasepc**: Base de Pis Cofins
- **entcpibasest**: Base de ST
- **entcpibasestret**: Base de ST Retido
- **entcpicalculacusto**: Calcula Custo
- **entcpicfop**: Codigo Cfop (FK)
- **entcpicodigo**: Codigo Sequencial
- **entcpicompra**: Codigo da Compra (FK)
- **entcpicustcod**: Código da Cust Referente a Este Produto
- **entcpidesconto**: Valor de Descontos Totais do Item
- **entcpidescontocusto**: Valor de Desconto no Custo dos Item não pertencente ao Documento
- **entcpiempresa**: Codigo da Empresa
- **entcpifisico**: Movimentacao Fisica Sim/Nao
- **entcpifrete**: Valor de Frete Total do Item
- **entcpifretecusto**: Valor de Frete no Custo dos Item não pertencente ao Documento
- **entcpiipirangaatividadecomponente**: IPIRANGA: Código Atividade Componente
- **entcpiipirangacodinterno**: IPIRANGA: Código Interno
- **entcpiipirangacodlivre**: IPIRANGA: Código Livre
- **entcpiivaaliqcbs**: IVA - Aliquota de CBS
- **entcpiivaaliqibs**: IVA - Aliquota de IBS
- **entcpiivaaliqis**: IVA - Aliquota de IS
- **entcpiivabase**: IVA - Base de Calculo para Impostos
- **entcpiivaclass**: IVA - Classificacao Fiscal
- **entcpiivavlrcbs**: IVA - Valor de CBS
- **entcpiivavlribs**: IVA - Valor de IBS
- **entcpiivavlris**: IVA - Valor de IS
- **entcpilocalentrada**: Multi-Estoque 0-Não | 1-Disponível | 2-Depósito
- **entcpipcc**: (Fk) Plano de Conta Contabil
- **entcpiproduto**: Codigo do Produto (FK)
- **entcpiqtd**: Quantidade
- **entcpisequencia**: Sequencia de Lancamento
- **entcpistic**: Sitrib de Icms (FK)
- **entcpisticorigement**: ORIGEM ST ICMS DE ENTRADA
- **entcpistip**: Sitrib de Ipi (FK)
- **entcpistpc**: Sitrib de Pis Cofins (FK)
- **entcpisubtotal**: Valor Sub Total do Item
- **entcpitemestoqvalid**: POSSUI ESTOQUE DESSA NFe COM ESTA VALIDADE(0-Nao | 1-Sim)
- **entcpitipotributacao**: Tipo de Tributação Considerada 0-Nao Definido/1-Compra Padrao/2-Cadastro/3-XML
- **entcpitotal**: Valor total do Item
- **entcpitq1**: Tanque 1 (FK)
- **entcpitq2**: Tanque 2 (FK)
- **entcpitq3**: Tanque 3 (FK)
- **entcpitq4**: Tanque 4 (FK)
- **entcpitrocaanp**: (0)Manter Cadastro/(1)Atualizar
- **entcpitrocabarra**: (0)Manter Cadastro/(1)Atualizar
- **entcpitrocancm**: (0)Manter Cadastro/(1)Atualizar
- **entcpitrocavenda**: (0)Manter Cadastro/(1)Atualizar
- **entcpiv1**: Vlr Venda 1
- **entcpivaliddat**: Data de validade do Produto
- **entcpivlrcofins**: Valor Cofins
- **entcpivlrcte**: Valor custo CTE 
- **entcpivlrdeson**: Valor ICMS Desonerado
- **entcpivlrfcp**: Valor FCP
- **entcpivlricms**: Valor Icms
- **entcpivlripi**: Valor Ipi
- **entcpivlrpis**: Valor Pis
- **entcpivlrst**: Valor ST
- **entcpivlrstret**: Valor ST Retido
- **entcpivol1**: Volume 1
- **entcpivol2**: Volume 2
- **entcpivol3**: Volume 3
- **entcpivol4**: Volume 4
- **entcpixmlaliqcofins**: Aliquota Cofins
- **entcpixmlaliqfcp**: Aliquota FCP
- **entcpixmlaliqicms**: Aliquota Icms
- **entcpixmlaliqipi**: Aliquota Ipi
- **entcpixmlaliqpis**: Aliquota Pis
- **entcpixmlaliqst**: Aliquota ST
- **entcpixmlaliqstret**: Aliquota ST Retido
- **entcpixmlanp**: ANP XML
- **entcpixmlbarra**: Barra XML
- **entcpixmlbasefcp**: Base de FCP
- **entcpixmlbaseicms**: Base de Icms
- **entcpixmlbaseipi**: Base de Ipi
- **entcpixmlbasepc**: Base de Pis Cofins
- **entcpixmlbasest**: Base de ST
- **entcpixmlbasestret**: Base de ST Retido
- **entcpixmlcest**: CEST XML
- **entcpixmlcfop**: CFOP XML
- **entcpixmlcodigo**: Codigo cProd XML
- **entcpixmldescricao**: Descricao xProd XML
- **entcpixmlncm**: NCM XML
- **entcpixmlqtd**: Qtd XML
- **entcpixmlstic**: STIC XML
- **entcpixmlstip**: Sitrib de Ipi (FK)
- **entcpixmlstpc**: STPC XML
- **entcpixmlund**: Und XML
- **entcpixmlvlrcofins**: Valor Cofins
- **entcpixmlvlrfcp**: Valor FCP
- **entcpixmlvlricms**: Valor Icms
- **entcpixmlvlripi**: Valor Ipi
- **entcpixmlvlrpis**: Valor Pis
- **entcpixmlvlrst**: Valor ST
- **entcpixmlvlrstret**: Valor ST Retido

---

## ENTCPIX

**63 campos documentados**

- **entcpixaceitacusto**: Aceita Variacao de Custo Sim/Nao
- **entcpixacrescimo**: Valor de Acrescimos Totais do Item
- **entcpixaliqcofins**: Aliquota Cofins
- **entcpixaliqfcp**: Aliquota FCP
- **entcpixaliqicms**: Aliquota Icms
- **entcpixaliqipi**: Aliquota Ipi
- **entcpixaliqpis**: Aliquota Pis
- **entcpixaliqst**: Aliquota ST
- **entcpixbasefcp**: Base de FCP
- **entcpixbaseicms**: Base de Icms
- **entcpixbaseipi**: Base de Ipi
- **entcpixbasepc**: Base de Pis Cofins
- **entcpixbasest**: Base de ST
- **entcpixcfop**: Codigo Cfop (FK)
- **entcpixcodigo**: Codigo Sequencial
- **entcpixcompra**: Codigo da Compra (FK)
- **entcpixdesconto**: Valor de Descontos Totais do Item
- **entcpixempresa**: Codigo da Empresa (FK)
- **entcpixfisico**: Movimentacao Fisica Sim/Nao
- **entcpixfrete**: Valor de Frete Total do Item
- **entcpixproduto**: Codigo do Produto (FK)
- **entcpixqtd**: Quantidade
- **entcpixsequencia**: Sequencia de Lancamento
- **entcpixstic**: Sitrib de Icms (FK)
- **entcpixstip**: Sitrib de Ipi (FK)
- **entcpixstpc**: Sitrib de Pis Cofins (FK)
- **entcpixsubtotal**: Valor Sub Total do Item
- **entcpixtotal**: Valor total do Item
- **entcpixtq1**: Tanque 1 (FK)
- **entcpixtq2**: Tanque 2 (FK)
- **entcpixtq3**: Tanque 3 (FK)
- **entcpixtq4**: Tanque 4 (FK)
- **entcpixtrocaanp**: (0)Manter Cadastro/(1)Atualizar
- **entcpixtrocabarra**: (0)Manter Cadastro/(1)Atualizar
- **entcpixtrocancm**: (0)Manter Cadastro/(1)Atualizar
- **entcpixtrocavenda**: (0)Manter Cadastro/(1)Atualizar
- **entcpixvda1**: Valor de Venda 1
- **entcpixvda2**: Valor de Venda 2
- **entcpixvda3**: Valor de Venda 3
- **entcpixvda4**: Valor de Venda 4
- **entcpixvda5**: Valor de Venda 5
- **entcpixvda6**: Valor de Venda 6
- **entcpixvlrcofins**: Valor Cofins
- **entcpixvlrfcp**: Valor FCP
- **entcpixvlricms**: Valor Icms
- **entcpixvlripi**: Valor Ipi
- **entcpixvlrpis**: Valor Pis
- **entcpixvlrst**: Valor ST
- **entcpixvol1**: Volume 1
- **entcpixvol2**: Volume 2
- **entcpixvol3**: Volume 3
- **entcpixvol4**: Volume 4
- **entcpixxmlanp**: ANP XML
- **entcpixxmlbarra**: Barra XML
- **entcpixxmlcfop**: CFOP XML
- **entcpixxmlcodigo**: Codigo XML
- **entcpixxmldescricao**: Descricao XML
- **entcpixxmlicms**: Icms XML
- **entcpixxmlncm**: NCM XML
- **entcpixxmlqtd**: Qtd XML
- **entcpixxmlstic**: STIC XML
- **entcpixxmlstpc**: STPC XML
- **entcpixxmlund**: Und XML

---

## ENTCPOC

**8 campos documentados**

- **entcpoccodigo**: Codigo Sequencial
- **entcpoccompra**: Codigo da Compra (FK)
- **entcpoccompraitem**: Codigo Item da Compra (FK)
- **entcpocempresa**: Codigo da Empresa (FK)
- **entcpocindimportado**: Indicacao de Combustivel monofásico importado 0-Nacional | 1-Importado
- **entcpocpercuf**: Percentual pertencente a UF
- **entcpocproduto**: Codigo do Produto (FK)
- **entcpocuf**: UF do Combustivel monofásico

---

## ENTCPP

**13 campos documentados**

- **entcppacrescimo**: Valor de Acréscimo
- **entcppcdescodigo**: Código Centro de despesas CDES
- **entcppcodigo**: Codigo Sequencial
- **entcppcompra**: Codigo da Compra (FK)
- **entcppctee**: Codigo da CTEE (FK)
- **entcppdesconto**: Valor de Descontos
- **entcppdre**: Código DRE
- **entcppgdescodigo**: Código Grupo de despesas GDES
- **entcppobs**: Observação
- **entcpppaga**: Código Tabela PAGA (FK)
- **entcppvalor**: Valor da Parcela
- **entcppvencimento**: Vencimento da Parcela
- **entcppvinculadapagj**: Flag: 0-NAO 1-SIM

---

## ENTCPPX

**4 campos documentados**

- **entcppxcodigo**: Codigo Sequencial
- **entcppxcompra**: Codigo da Compra (FK)
- **entcppxvalor**: Valor da Parcela
- **entcppxvencimento**: Vencimento da Parcela

---

## ESTOQ

**21 campos documentados**

- **estoqatualizapdv**: flag de Atualizacao do PDV 0-Nao 1-Sim
- **estoqbalancocol**: Em Balanco - no Coletor 0-Nao 1-Sim
- **estoqbalanconro**: Em Balanco - Numero de Contagens
- **estoqbalancoqtd**: Em Balanco - Quantidade em Contagem
- **estoqcodigo**: Codigo Sequencial
- **estoqconfigpadrao**: Respeita Configuração Padrão do Ponto de Estoque: 0-Não 1-Sim
- **estoqdataalteracao**: Data da última alteração da ESTOQ
- **estoqempresa**: Codigo da Empresa (FK)
- **estoqpadraocompra**: Local Padrao para Compra   0-Nao 1-Sim
- **estoqpadraoproducao**: Local Padrao para Producao 0-Nao 1-Sim
- **estoqpadraoreposicao**: Ponto de Estoque Padrão para Reposição 0-Nao 1-Sim
- **estoqpadraovenda**: Local Padrao para Venda    0-Nao 1-Sim
- **estoqpermitecompra**: Permite efetuar compra neste ponto 0-Nao 1-Sim 3-Padrao Ponto
- **estoqpermiteproducao**: Permite efetuar producao neste ponto 0-Nao 1-Sim
- **estoqpermitevenda**: Permite efetuar venda neste ponto 0-Nao 1-Sim
- **estoqponto**: Codigo do Ponto de Estoque (FK)
- **estoqpontoreposicao**: Codigo do Ponto de Estoque Para Reposição (FK)
- **estoqproduto**: Codigo do Produto (FK)
- **estoqqtdreposicao**: Quantidade de Reposição Para o Ponto de Estoque
- **estoqvalidactrl**: Controlar Validade do Estoque 0-Nao 1-Sim
- **estoqvalidadata**: Data da Validade do Estoque

---

## ETQP

**5 campos documentados**

- **etqpcodigo**: Codigo Sequencial
- **etqpempresa**: Código da Empresa (FK)
- **etqpproduto**: Codigo Produto
- **etqpqtd**: Quantidade
- **etqpvlr**: Valor

---

## EVOP

**41 campos documentados**

- **evop_ad_ccf**: (Ativo,Disponivel)Saldo CC Final
- **evop_ad_cci**: (Ativo,Disponivel)Saldo CC Inicial
- **evop_ad_futurof**: (Ativo,Disponivel)Saldo FuturoCC Final
- **evop_ad_futuroi**: (Ativo,Disponivel)Saldo Futuro Inicial
- **evop_ad_mapaf**: (Ativo,Disponivel)Saldo Mapa Final
- **evop_ad_mapai**: (Ativo,Disponivel)Saldo Mapa Inicial
- **evop_ae_antecipadof**: (Ativo,Estoque)Saldo Antecipado Final
- **evop_ae_antecipadoi**: (Ativo,Estoque)Saldo Antecipado Inicial
- **evop_ae_combustivelf**: (Ativo,Estoque)Saldo Combustivel Final
- **evop_ae_combustiveli**: (Ativo,Estoque)Saldo Combustivel Inicial
- **evop_ae_produtof**: (Ativo,Estoque)Saldo Produto Final
- **evop_ae_produtoi**: (Ativo,Estoque)Saldo Produto Inicial
- **evop_ar_cartaof**: (Ativo,Receber)Saldo Cartao Final
- **evop_ar_cartaoi**: (Ativo,Receber)Saldo Cartao Inicial
- **evop_ar_chequef**: (Ativo,Receber)Saldo Cheque Recebido Final
- **evop_ar_chequei**: (Ativo,Receber)Saldo Cheque Recebido Inicial
- **evop_ar_fretef**: (Ativo,Receber)Saldo Frete Final
- **evop_ar_fretei**: (Ativo,Receber)Saldo Frete Inicial
- **evop_ar_prazof**: (Ativo,Receber)Saldo Prazo Final
- **evop_ar_prazoi**: (Ativo,Receber)Saldo Prazo Inicial
- **evop_ar_receitaf**: (Ativo,Receber)Saldo Receita Final
- **evop_ar_receitai**: (Ativo,Receber)Saldo Receita Inicial
- **evop_pc_chequef**: (Passivo,CurtoPrazo)Saldo Cheque Emitido Final
- **evop_pc_chequei**: (Passivo,CurtoPrazo)Saldo Cheque Emitido Inicial
- **evop_pc_fidelidadef**: (Passivo,CurtoPrazo)Saldo Ponto Fidelidade Final
- **evop_pc_fidelidadei**: (Passivo,CurtoPrazo)Saldo Ponto Fidelidade Inicial
- **evop_pc_fornecedorf**: (Passivo,CurtoPrazo)Saldo Fornecedor Final
- **evop_pc_fornecedori**: (Passivo,CurtoPrazo)Saldo Fornecedor Inicial
- **evop_pc_valef**: (Passivo,CurtoPrazo)Saldo Vale Adiantamento Final
- **evop_pc_valei**: (Passivo,CurtoPrazo)Saldo Vale Adiantamento Inicial
- **evop_pc_vdaprgf**: (Passivo,CurtoPrazo)Saldo Venda Programada Final
- **evop_pc_vdaprgi**: (Passivo,CurtoPrazo)Saldo Venda Programada Inicial
- **evop_pl_chequef**: (Passivo,LongoPrazo)Saldo Cheque Emitido Final
- **evop_pl_chequei**: (Passivo,LongoPrazo)Saldo Cheque Emitido Inicial
- **evop_pl_fornecedorf**: (Passivo,LongoPrazo)Saldo Fornecedor Final
- **evop_pl_fornecedori**: (Passivo,LongoPrazo)Saldo Fornecedor Inicial
- **evopcodigo**: Codigo do Lancamento da Evolucao
- **evopdata**: Data da Evolucao
- **evopempresa**: Código da Empresa (FK)
- **evopprocessado**: Data do Processamento
- **evopterminal**: Terminal de Processamento

---

## FACB

**61 campos documentados**

- **facbamostra1**: Número da Amostra1
- **facbamostra2**: Número da Amostra2
- **facbamostra3**: Número da Amostra3
- **facbamostra4**: Número da Amostra4
- **facbamostra5**: Número da Amostra5
- **facbanalista**: Analista
- **facbaspecto1**: Aspecto 1
- **facbaspecto2**: Aspecto2
- **facbaspecto3**: Aspecto3
- **facbaspecto4**: Aspecto4
- **facbaspecto5**: Aspecto5
- **facbchave**: Chave
- **facbchegada**: Data Chegada
- **facbcnpjcpftransp**: CnpjCpf do Transportador
- **facbcodigo**: Código
- **facbcor1**: Cor 1
- **facbcor2**: Cor2
- **facbcor3**: Cor3
- **facbcor4**: Cor4
- **facbcor5**: Cor5
- **facbdensrel20c4c1**: Densidade Relativa 20C e 4C 1
- **facbdensrel20c4c2**: Densidade Relativa 20C e 4C 2
- **facbdensrel20c4c3**: Densidade Relativa 20C e 4C 3
- **facbdensrel20c4c4**: Densidade Relativa 20C e 4C 4
- **facbdensrel20c4c5**: Densidade Relativa 20C e 4C 5
- **facbempresa**: Código da Empresa
- **facbfornecedor**: Fornecedor (FK)
- **facbmassa1**: Massa 1
- **facbmassa2**: Massa 2
- **facbmassa3**: Massa 3
- **facbmassa4**: Massa 3
- **facbmassa5**: Massa 5
- **facbmotorista**: Motorista
- **facbnrolacre1**: Número de lacre 1
- **facbnrolacre2**: Número de lacre 2
- **facbnrolacre3**: Número de lacre 3
- **facbnrolacre4**: Número de lacre 4
- **facbnrolacre5**: Número de lacre 5
- **facbplaca**: Placa
- **facbproduto1**: Produto 1
- **facbproduto2**: Produto2
- **facbproduto3**: Produto3
- **facbproduto4**: Produto4
- **facbproduto5**: Produto5
- **facbqtd1**: Quantidade 1
- **facbqtd2**: Quantidade2
- **facbqtd3**: Quantidade3
- **facbqtd4**: Quantidade4
- **facbqtd5**: Quantidade5
- **facbrgmotorista**: RG do Motorista
- **facbteoraehc1**: Teor AEHC1
- **facbteoraehc2**: Teor AEHC2
- **facbteoraehc3**: Teor AEHC3
- **facbteoraehc4**: Teor AEHC4
- **facbteoraehc5**: Teor AEHC5
- **facbteoralcool1**: Teor Alcool1
- **facbteoralcool2**: Teor Alcool2
- **facbteoralcool3**: Teor Alcool3
- **facbteoralcool4**: Teor Alcool4
- **facbteoralcool5**: Teor Alcool5
- **facbtransportador**: Transportador

---

## FATBC

**21 campos documentados**

- **fatbccodigo**: Código PK tabela
- **fatbccodigoccrr**: Código da Conta Corrente (FK)
- **fatbccodigofatu**: Código da Fatura (FK)
- **fatbcdataconsulta**: Data da Consulta
- **fatbcdatacredito**: Data do Crédito no Banco
- **fatbcdataemissao**: Data de Emissao do Boleto
- **fatbcdatamovimento**: Data do Movimento do Boleto
- **fatbcdatapagamento**: Data de Pagamento do Boleto
- **fatbcdatavencimento**: Data de Vencimento do Boleto
- **fatbcempresa**: Código da Empresa
- **fatbcendereco**: Endereco do Cliente
- **fatbcnossonumero**: Nosso Número do Boleto
- **fatbcnumeroboleto**: Número do Boleto
- **fatbcocorrenciacodigo**: Codigo da Ocorrencia
- **fatbcocorrenciadescricao**: Descricao da Ocorrencia
- **fatbcrazao**: Nome do Cliente
- **fatbcvalordescontos**: Valor de Descontos Concedidos no Boleto
- **fatbcvalorjuros**: Valor de Juros Recebidos no Boleto
- **fatbcvalororiginal**: Valor Original do Boleto
- **fatbcvalorrecebido**: Valor Recebido
- **fatbcvalortaxa**: Valor de Taxa Cobrada no Boleto

---

## FATJ

**45 campos documentados**

- **fatjbarra**: Linha Digitavel do boleto
- **fatjbxcaixa**: Caixa Destino da Baixa (FK)
- **fatjbxccrr**: CC destino da Baixa (FK)
- **fatjbxempresa**: Código da Empresa que Efetuou a Baixa (FK)
- **fatjbxfrentista**: Codigo do Frentista Responsavel (FK)
- **fatjbxmapa**: Mapa Destino da Baixa (FK)
- **fatjbxtefb**: Bandeira Cartao Destino da Baixa (FK)
- **fatjbxtefchave**: Chave do Tef Destino da Baixa (FK)
- **fatjbxtefp**: Operadora Cartao Destino da Baixa (FK)
- **fatjbxterminal**: Terminal que realizou a Baixa do Recebimento 
- **fatjbxusuario**: Usuario que realizou a Baixa do Recebimento 
- **fatjcartao**: Valor Recebido em Cartao
- **fatjcheque**: Valor Recebido em Cheque
- **fatjcliente**: Codigo do cliente (FK)
- **fatjcobranca**: CC do boleto (FK)
- **fatjcodigo**: Codigo Sequencial
- **fatjcodigoccfg**: Codigo Da Configuracao do Boleto
- **fatjdinheiro**: Valor Recebido em Dinheiro
- **fatjemailb**: Data envio Email Boleto
- **fatjemailf**: Data envio Email Fatura
- **fatjemissao**: Data de Emissao
- **fatjempresa**: Código da Empresa (FK)
- **fatjendereco**: Codigo do endereco (FK)
- **fatjfrete**: Valor Recebido em Frete
- **fatjidmulti**: Codigo Da Fatura Multipla
- **fatjmesbase**: Data de Vencimento Base
- **fatjnaoprg**: Lancamento direto em contas recebidas 0-Nao|1-Sim
- **fatjnossonr**: Nosso Numero do boleto
- **fatjnroboleto**: Numero do Boleto
- **fatjobs**: Observacoes Diversas
- **fatjobsbaixacartao**: Observacoes Tipo Baixa de Cartões(1-Operadora|2-Bandeira|3-Conta Corrente)
- **fatjpagamento**: Data de Pagamento
- **fatjpixurl**: Url Pix Copia e Cola
- **fatjprintb**: Data impressao Boleto
- **fatjprintf**: Data impressao Fatura
- **fatjpxblid**: Codigo PXBL (FK)
- **fatjsituacaoboleto**: Situação Boleto
- **fatjstsbol**: Situação do Boleto  0-Não Gerado 1-Pendente 10-Gerado 
- **fatjstseml**: Situação do E-mail  0-Não Enviado 1-Pendente 10-Ja Enviado 
- **fatjstsnfe**: Situação da Nfe  0-Não Gerada 1-Pendente 10-Gerada 
- **fatjstsprt**: Situação da Impressão  0-Não Impresso 1-Pendente 10-Ja Impresso 
- **fatjtroco**: Valor do Troco
- **fatjvaletr**: Valor Recebido em Vale
- **fatjvdaprg**: Valor Recebido em Vda Programada
- **fatjvencimento**: Data de Vencimento

---

## FATU

**40 campos documentados**

- **fatubarra**: Linha Digitavel do boleto
- **fatubolobs**: Observacao para o Boleto
- **fatubolpdf**: PDF impressao do Boleto
- **fatubolpiximagem**: Imagem QrCode do Boleto
- **fatucliente**: Codigo do cliente (FK)
- **fatucobranca**: CC do boleto (FK)
- **fatucodigo**: Codigo Sequencial
- **fatucodigoccfg**: Codigo Da Configuracao do Boleto
- **fatuemailb**: Data envio Email Boleto
- **fatuemailf**: Data envio Email Fatura
- **fatuemissao**: Data de Emissao
- **fatuempresa**: Codigo Empresarial (PK)
- **fatuendereco**: Codigo do endereco (FK)
- **fatuidintegracao**: ID de identificação da fatura com o componente tecnospeed
- **fatuidmulti**: Codigo Da Fatura Multipla
- **fatumesbase**: Data de Vencimento Base
- **fatunferesumo**: Sequencia da NFe Resumo (FK)
- **fatunossonr**: Nosso Numero do boleto
- **fatunroboleto**: Numero do Boleto
- **fatuobs**: Observacoes Diversas
- **fatuobsbaixacartao**: Observacoes Tipo Baixa de Cartões(1-Operadora|2-Bandeira|3-Conta Corrente)
- **fatupixurl**: Url Pix Copia e Cola
- **fatuprintb**: Data impressao Boleto
- **fatuprintf**: Data impressao Fatura
- **fatuprotocoloalteracao**: Protocolo de Alteração componente tecnospeed
- **fatuprotocolobaixa**: Protocolo de Baixa componente tecnospeed
- **fatuprotocoloemail**: Protocolo de Solicitacao de Email com o componente tecnospeed
- **fatuprotocoloimpressao**: Protocolo de Impressão para imprimir ou gerar pdf com o componente tecnospeed
- **fatuprotocoloupload**: Protocolo de UpLoad componente tecnospeed
- **fatupxblid**: Codigo PXBL (FK)
- **faturejeicao**: Descricao da Rejeicao do Boleto pelo Banco
- **fatusgadocrecnr**: Numero do Recibo - Sequencial
- **fatusgadocrecst**: Situacao do Recibo 0 - Normal | 1 - Cancelado
- **fatusitboletotecno**: Situação Boleto S-Salvo|E-Emitido|F-Falha|R-Rejeitado|B-Baixado|H-Registrado|L-Liquidado
- **fatusituacaoboleto**: Situação Boleto A-Remessa|B-Retorno|C-Registrado|E-Rejeitado|G-rem pror|H-ret pror|J-rem bx|K-ret bx|Q-Simples
- **fatustsbol**: Situação do Boleto  0-Não Gerado 1-Pendente 10-Gerado 
- **fatustseml**: Situação do E-mail  0-Não Enviado 1-Pendente 10-Ja Enviado 
- **fatustsnfe**: Situação da Nfe  0-Não Gerada 1-Pendente 10-Gerada 
- **fatustsprt**: Situação da Impressão  0-Não Impresso 1-Pendente 10-Ja Impresso 
- **fatuvencimento**: Data de Vencimento

---

## FDAV

**15 campos documentados**

- **fdavautorizacao**: Numero de Autorizacao
- **fdavbandeira**: Codigo da bandeira venda de cartão POS
- **fdavcaixa**: Codigo do caixa
- **fdavchave**: Chave da venda de cartao
- **fdavcodigo**: Codigo Sequencial
- **fdavdata**: Data e Hora do adiantamento
- **fdavempresa**: Codigo da Empresa
- **fdavforma**: Flag (0-Dinheiro,1-Debito,2-Credito)
- **fdavidentificacao**: Identificação do adiantamento
- **fdavoperadora**: Codigo da operadora venda de cartão POS
- **fdavparcela**: Quantidade de parcelas que foi dividido no cartao
- **fdavvalor**: Valor do adiantamento
- **fdavvendapmvd**: Codigo da Venda (PMVD) (PK)
- **fdavvendaprvd**: Codigo da Venda (PRVD) (PK)
- **fdavvendavda**: Codigo da Venda (VDA) (PK)

---

## FDCC

**7 campos documentados**

- **fdcccodigo**: Codigo Sequencial
- **fdcccpf**: CPF do Consumidor
- **fdccfone**: Fone
- **fdccgenero**: Genero (M)asculino (F)eminino (N)ao Informar
- **fdccmarketing**: Flag Ação de Marketing (0-Nao,1-Sim)
- **fdccnascimento**: Data de Nascimento
- **fdccnome**: Nome

---

## FDFP

**9 campos documentados**

- **fdfpcodigo**: Codigo sequencial
- **fdfpdemaisitens**: Sair os demais itens na impressão por setor(0-Sim/1-Não)
- **fdfpdescricao**: Descrição do Setor de Produção
- **fdfpempresa**: Codigo da Empresa
- **fdfpimpcabecalho**: Imprimir Cabeçalho no cupom(0-Sim/1-Não)
- **fdfpimpressora**: Codigo Da Impressora(FK)
- **fdfpimprodape**: Imprimir Rodapé no cupom(0-Sim/1-Não)
- **fdfpsizeitens**: Tamanho da Fonte apenas dos itens no cupom
- **fdfptmimpagrupar**: Agrupar os itens do pedido em um unico cupom(0-Sim/1-Não)

---

## FDIO

**9 campos documentados**

- **fdiocodigo**: Codigo Sequencial
- **fdiodescricao**: Descrição do Opcional ou Adicional no momento da venda
- **fdioempresa**: Codigo da Empresa
- **fdioitempmit**: Codigo do Item (PMIT) (PK)
- **fdioitemprit**: Codigo do Item (PRIT) (PK)
- **fdioitempritserie**: Codigo do Item (PRVD) (PK)
- **fdioitemvdit**: Codigo do Item (VDIT) (PK)
- **fdioqtd**: Quantidade de Opcional/Adicional
- **fdiovalor**: Valor Cobrado pelo Opcional ou Adicional

---

## FDMS

**5 campos documentados**

- **fdmscodigo**: Codigo Sequencial
- **fdmsempresa**: Codigo da Empresa
- **fdmslugar**: Quantidade de lugares na mesa
- **fdmsnumero**: Numero da mesa
- **fdmssetor**: Codigo do Setor (PK)

---

## FDPF

**23 campos documentados**

- **fdpfcodigo**: Codigo do Perfil
- **fdpfconsumacao**: Valor da Consumacao
- **fdpfdescricao**: Descricao do Perfil
- **fdpfempresa**: Codigo da Empresa
- **fdpfgenero**: Genero Masculino Feminino Indiferente
- **fdpfhoraf**: Horario Final
- **fdpfhorai**: Horario Inicial
- **fdpfidadef**: Idade Final
- **fdpfidadei**: Idade Inicial
- **fdpfperiodof**: Periodo Final
- **fdpfperiodoi**: Periodo Inicial
- **fdpfpromoter**: Codigo do Promoter (FK)
- **fdpfsemana1**: Domingo (0-Nao,1-Sim)
- **fdpfsemana2**: Segunda (0-Nao,1-Sim)
- **fdpfsemana3**: Terca (0-Nao,1-Sim)
- **fdpfsemana4**: Quarta (0-Nao,1-Sim)
- **fdpfsemana5**: Quinta (0-Nao,1-Sim)
- **fdpfsemana6**: Sexta (0-Nao,1-Sim)
- **fdpfsemana7**: Sabado (0-Nao,1-Sim)
- **fdpftaxaservico**: Porcentagem de Taxa de Servico
- **fdpftaxavinculo**: Produto Vinculado a Taxa de Servico
- **fdpfvalorinicio**: Valor de Taxa Inicial
- **fdpfvalorvinculo**: Produto Vinculado ao Valor Inicial

---

## FDST

**3 campos documentados**

- **fdstcodigo**: Codigo Sequencial
- **fdstdescricao**: Descrição do Setor de Venda
- **fdstempresa**: Codigo da Empresa

---

## FERD

**2 campos documentados**

- **ferddata**: Data do Feriado
- **ferddescricao**: Descricao do Feriado

---

## FITY

**5 campos documentados**

- **fityarquivo**: Nome do arquivo, ddmmyyhhmmsszz
- **fitycodigo**: Codigo do Log
- **fityoperacao**: Tipo de operacao 0 - CONSULTA | 1 - VENDA | 2 - ESTORNO
- **fitytipo**: Tipo de comunicacao 0 - REQ | 1 - RET
- **fityxml**: Arquivo gerado no processo

---

## FK

**5 campos documentados**

- **fkcampobase**: Nome do Campo Base
- **fkcampofk**: Nome do Campo Estrangeiro
- **fkcodigo**: Codigo Sequencial
- **fktablebase**: Nome da Tabela Base
- **fktablefk**: Nome da Tabela Estrangeira

---

## FLCP

**16 campos documentados**

- **flcpchave**: Chave da Nota Fiscal
- **flcpcodigo**: Codigo
- **flcpcstat**: Codigo do Status retornado pela Sefaz
- **flcpdatahora**: Data e Hora
- **flcpdocumento**: Numero ENTCPA
- **flcpformapagto**: Tipo Pagamento (-1)Indisponivel (0)Vista (1)Prazo (2)Outros
- **flcpfornecedor**: Descricao Fornecedor
- **flcpnatureza**: Natureza 1-Comb 2-Prod 3-Serv 4-Imob 5-Uso 6-Brinde
- **flcpnsu**: Numero do NSU do Manifesto
- **flcpnumero**: Numero NF
- **flcpobservacao**: Observacao
- **flcpserie**: Serie
- **flcpsituacao**: Situação 0-Leitura 1-Ciencia 2-Download 3-Confimada 7-cancelado/denegado 8-Esquecida 9-Rejeitada
- **flcptipolct**: Identificação do Lançamento
- **flcpvalor**: Valor
- **flcpxml**: Xml Nota Fiscal

---

## FLUF

**8 campos documentados**

- **flufccrr**: Conta Corrente (FK)
- **flufcodigo**: Codigo Sequencial
- **flufcredito**: Valor do Credito
- **flufdata**: Data do Lancamento
- **flufdebito**: Valor do Debito
- **flufhistorico**: Historico do Lancamento
- **fluforigempk**: Codigo da PK da Origem
- **fluforigemtp**: Flag Origem 0-Manual 1-Fatj 2-Pagj 3-Supr

---

## FLUX

**12 campos documentados**

- **fluxccrr**: Conta Corrente (FK)
- **fluxcheque**: Numero do Cheque Emitido
- **fluxcodigo**: Codigo Sequencial
- **fluxcredito**: Valor do Credito
- **fluxdata**: Data do Lancamento
- **fluxdebito**: Valor do Debito
- **fluxdocumento**: Documento do Lancamento
- **fluxemissao**: Data de entrada do Lancamento
- **fluxhistorico**: Historico do Lancamento
- **fluxsaldo**: Valor do Saldo
- **fluxstatus**: Flag de Status 0-Consolidado 1-Previsao
- **fluxvlrmarcado**: Valor Marcado

---

## FPGT

**9 campos documentados**

- **fpgtcodigo**: Codigo Sequencial
- **fpgtcondicao**: Forma do Pagamento (D)ias (S)emanal (M)ensal
- **fpgtdescricao**: Descricao
- **fpgtdias**: Quantidade de Dias
- **fpgtempresas**: Liberar Todas Empresas
- **fpgtmes1**: Mes 1 Vencimento
- **fpgtmes2**: Mes 2 Vencimento
- **fpgtmes3**: Mes 3 Vencimento
- **fpgtsemana**: Dia da Semana (1=Dom,2=Seg,3=Ter,4=Qua,5=Qui,6=Sex,7=Sab)

---

## FPGTE

**3 campos documentados**

- **fpgtecodigo**: Codigo Sequencial
- **fpgteempresa**: Codigo da Empresa (FK)
- **fpgteforma**: Codigo da Forma Pagamento (FK)

---

## FRET

**37 campos documentados**

- **fretacrescimo1**: Valor Acrescimo I
- **fretacrescimo2**: Valor Acrescimo II
- **fretadiantado**: Valor Desconto Adiantado
- **fretcaixa**: Caixa do Lancamento
- **fretcalculo**: Calculo (J)a Calculado / (A)diantamento / (S)aldo
- **fretcodigo**: Codigo Sequencial
- **fretcpf**: Cpf do Motorista
- **fretdata**: Data/Hora Lancamento da Carta Frete
- **fretdesconto1**: Valor Desconto I
- **fretdesconto2**: Valor Desconto II
- **fretdesconto3**: Valor Desconto III
- **fretempresa**: Codigo Sequencial
- **fretinss**: Valor Desconto Inss
- **fretmercadoria**: Valor Total da Mercadoria
- **fretmotorista**: Nome do Motorista
- **fretnumero**: Numero da Carta Frete
- **fretobs**: Observacoes Diversas
- **fretpedagio**: Valor Desconto Pedagio
- **fretpesochegada**: Peso de Chegada em Kg
- **fretpesosaida**: Peso de Saida em Kg
- **fretpesotipo**: Base Calculo peso (S)aida / (C)hegada
- **fretplaca**: Placa do Veiculo
- **fretquebraaceita**: Porcentagem de Quebra Aceita
- **fretquebraaceitapeso**: Quebra Aceita em Kg
- **fretquebraexcessopeso**: Quebra Excesso em Kg
- **fretstatus**: Status do Lancamento (0)Liberada (1)Em Lancamento
- **frettarifa**: Tarifa do Frete por Tonelada
- **frettipopeso**: Tipo do Calculo de Peso (0)Peso Saída (1)Peso Chegada
- **frettotalacrescimo**: Valor Total Acrescimo
- **frettotalbruto**: Valor Total Bruto
- **frettotaldesconto**: Valor Total Desconto
- **frettotalliquido**: Valor Total Liquido
- **frettotalquebra**: Valor Total Quebra
- **frettransportadora**: Codigo da Transportadora (FK)
- **fretvenda**: Sequencia da Venda
- **fretvlrad**: Valor em Adiantamento
- **fretvlrja**: Valor ja Calculado

---

## GDES

**2 campos documentados**

- **gdescodigo**: Codigo Sequencial
- **gdesdescricao**: Descricao

---

## GFLX

**6 campos documentados**

- **gflxativo**: Inativar Cadastro
- **gflxcodigo**: Codigo Sequencial
- **gflxdescricao**: Descrição do Grupo de Fluxos de Caixa e Mapa
- **gflxdreconta**: Conta do DRE
- **gflxempresa**: Codigo da Empresa (FK)
- **gflxoperacao**: (E)Entrada - (S)Saida

---

## GGA

**2 campos documentados**

- **ggacodigo**: Código
- **ggadescricao**: Descricao

---

## GLL

**5 campos documentados**

- **gllcodigo**: Codigo Sequencial
- **glldata**: Data e Hora da Execucao
- **gllsql**: Instrução SQL executada
- **gllterminal**: Terminal Origem
- **gllusuario**: Usuario Responsavel

---

## GOPC

**7 campos documentados**

- **gopcccusto**: Array de Centro de Despesa
- **gopccodigo**: Codigo Sequencial(PK)
- **gopcdescricao**: Descrição da Operação
- **gopcdre**: Array de DRE
- **gopcgcusto**: Array de Grupo de Despesa
- **gopcoperacao**: Operação(0-Despesas|1-Receitas|2-Fazer Empréstimo|3-Receber Empréstimo|4-Suprimento|5-Sangria|6-Pagamento|7-Recebimento)
- **gopcparticipante**: Array de Participantes

---

## GPAR

**2 campos documentados**

- **gparcodigo**: Codigo Sequencial
- **gpardescricao**: Descricao

---

## GPRO

**6 campos documentados**

- **gprocodigo**: Codigo Sequencial
- **gprodescricao**: Descricao
- **gproipirangaatividade**: Tipo do produto na ipiranga (codigo componente Atividade)
- **gproipirangacodigo**: Vinculo com a Ipiranga (CODIGO GRUPO)
- **gproipirangacodigo2**: Vinculo com a Ipiranga (CODIGO SECAO ASSOCIADO GRUPO)
- **gprosecao**: Secao de Produto (FK)

---

## HVLC

**5 campos documentados**

- **hvlccodigo**: Codigo Sequencial
- **hvlccombustivel**: Codigo do Combustivel (FK)
- **hvlcdata**: Data do Historico
- **hvlcempresa**: Codigo Empresa (FK)
- **hvlcvenda**: Valor de Venda do Combustivel

---

## HVLP

**7 campos documentados**

- **hvlpcodigo**: Codigo Sequencial
- **hvlpdata**: Data do Historico
- **hvlpempresa**: Codigo Empresa (FK)
- **hvlpproduto**: Codigo do Combustivel (FK)
- **hvlptab**: Tabela de Venda
- **hvlptip**: Tipo do Valor
- **hvlpvlr**: Valor de Venda

---

## IBPT

**16 campos documentados**

- **ibptchave**: Chave
- **ibptcodigo**: Codigo
- **ibptdataatualizacao**: Data e Hora da Ultima Atualizacao
- **ibptdescricao**: Descrição
- **ibptestadual**: Alíquota Estadual
- **ibptexcecao**: Exceção do TIPI
- **ibptfinalvigencia**: Fim da Vigência
- **ibptfonte**: Fonte
- **ibptimportadofederal**: Alíquota Importado Federal
- **ibptiniciovigencia**: Ínicio da Vigência
- **ibptmunicipal**: Alíquota Municipal
- **ibptnacionalfederal**: Alíquota Nacional Federal
- **ibptncm**: NCM
- **ibpttipo**: Tipo do NCM(0-NCM | 1-NBS)
- **ibptuf**: UF
- **ibptversao**: Versão

---

## IMDS

**10 campos documentados**

- **imdsbody**: Conteúdo envio
- **imdscodigo**: Codigo Sequencial
- **imdscontent**: Conteúdo retorno
- **imdsdata**: Data
- **imdsdescricao**: Descricao erro
- **imdsempresa**: Codigo Empresa
- **imdsendpoint**: URL EndPoint
- **imdsmetodo**: Método
- **imdsstatuscode**: Status Código
- **imdsstatustext**: Status Texto

---

## IMOB

**11 campos documentados**

- **imobcentrocusto**: Código do Centro de Custo - SPED FISCAL (Fk)
- **imobcodigo**: Codigo Sequencial
- **imobconta**: Codigo Plano de Conta Contabil SPED FISCAL (FK)
- **imobdataaquisicao**: Data de Aquisição
- **imobdescricao**: Descrição
- **imobempresa**: Código da Empresa (Fk)
- **imobetiqueta**: Etiqueta
- **imobnf**: Número da NF
- **imobsetor**: Chave do Setor (FK)
- **imobtitulo**: Título
- **imobvalor**: Valor

---

## IMOI

**3 campos documentados**

- **imoicodigo**: Codigo Sequencial
- **imoiimagem**: Conteudo Imagem
- **imoiimobilizado**: Chave IMOB (FK)

---

## IPAY

**36 campos documentados**

- **ipayaut**: Autorização
- **ipaybase64**: QrCode Base64
- **ipaycodigo**: Codigo Sequencial
- **ipaycodigopedido**: ´Codigo do Pedido
- **ipaycodret**: ID TRANSACAO (CODIGO RETORNO)
- **ipaycompautorizacao**: Comprovante Autorizacao
- **ipaycompbase64qrcode**: QrCode Base64
- **ipaycompcnpj**: Comprovante CNPJ
- **ipaycompcodvip**: Comprovante COD VIP
- **ipaycompcpfcliente**: Comprovante CPF CLIENTE
- **ipaycompcpfvip**: Comprovante CPF VIP
- **ipaycompdata**: Comprovante Data 
- **ipaycompkmacumulado**: Comprovante KM Acumulado
- **ipaycompnomecliente**: Comprovante NOME CLIENTE
- **ipaycompnsuautorizacao**: Comprovante NSU Autorizacao
- **ipaycomppedido**: Comprovante Pedido
- **ipaycomprazao**: Comprovante Razao
- **ipaycomprovc**: Comprovante cliente
- **ipaycomprove**: Comprovante estabelecimento
- **ipaycompterminal**: Comprovante Terminal
- **ipaycomptextoqrcode**: QrCode String
- **ipaydadosclienteprofrota**: Informações de cliente para emissao de nota pro frotas
- **ipaydataexpira**: Data Expiração QrCode
- **ipayempresa**: Codigo da Empresa (Fk)
- **ipayimpabasteceaiviacliente**: Comprovante de Impressao AbasteceAi (Via Cliente)
- **ipayimpabasteceaiviaestabelecimento**: Comprovante de Impressao AbasteceAi (Via Estabelecimento)
- **ipayjsonimpressao**: JSON com Objetos para Impressao
- **ipayjsonimpressaovenda**: JSON com informações da transação (Aí)
- **ipaymsg**: Mensagem de Alerta/Aviso/Erro
- **ipaynsu**: NSU
- **ipaypseudoqrcode**: Pseudo QrCode
- **ipayqrcodestr**: QrCode String
- **ipaystatus**: STATUS - 0-Pendente 1-Sucesso 2-Erro
- **ipayterminal**: Nome do Terminal SgaPay
- **ipayvlrapr**: Valor da Transação (Aprovado)
- **ipayvlrdin**: Valor da Transação (Dinheiro)

---

## IPCMN

**16 campos documentados**

- **ipcmncodigo**: Codigo Sequencial
- **ipcmncodigoatde**: Código Atendente
- **ipcmncodigohttp**: Código HTTP
- **ipcmncpfconsumidor**: CPF Consumidor
- **ipcmndata**: Data Resgate
- **ipcmnempresa**: Codigo Empresa
- **ipcmnjsonenvio**: JSON Envio
- **ipcmnjsonretorno**: JSON Retorno
- **ipcmnnsudestino**: NSU Destino
- **ipcmnnsuorigem**: NSU Origem
- **ipcmnpdvmovel**: PDV Móvel 1-Sim|0-Não
- **ipcmnproduto**: Código Produto
- **ipcmnpromocao**: Código Promoção
- **ipcmnquantidade**: Quantidade
- **ipcmnterminal**: Terminal
- **ipcmnvip**: VIP ID

---

## IPCO

**42 campos documentados**

- **ipcoan8**: Dados Corporate
- **ipcobairro**: Dados Corporate
- **ipcocentrocusto**: Dados Corporate
- **ipcocep**: Dados Corporate
- **ipcocnae**: Dados Corporate
- **ipcocnpjraiz**: Dados Corporate
- **ipcocodigo**: Codigo da tabela
- **ipcocodigobandeiraposto**: Dados Corporate
- **ipcocodigocomponente**: Dados Corporate
- **ipcocodigointernoatividadenegocio**: Dados Corporate
- **ipcocodigointernotiponegocio**: Dados Corporate
- **ipcocodigopontodevendaabadi**: Dados Corporate
- **ipcocodigopontovenda**: Dados Corporate
- **ipcocodigotipocomponente**: Dados Corporate
- **ipcocodigozonavenda**: Dados Corporate
- **ipcodddfax**: Dados Corporate
- **ipcodddtelefone**: Dados Corporate
- **ipcodescricaobandeiraposto**: Dados Corporate
- **ipcodescricaocentrocusto**: Dados Corporate
- **ipcodescricaointernoatividadenegocio**: Dados Corporate
- **ipcodescricaointernotiponegocio**: Dados Corporate
- **ipcodescricaotipocomponente**: Dados Corporate
- **ipcodescricaozonavenda**: Dados Corporate
- **ipcodvcnpjraiz**: Dados Corporate
- **ipcoemailcontato**: Dados Corporate
- **ipcoendereco**: Dados Corporate
- **ipcofax**: Dados Corporate
- **ipcofilialabastecedora**: Dados Corporate
- **ipcoimagemposto**: Dados Corporate
- **ipcoinscricaoestadual**: Dados Corporate
- **ipcoinscricaomunicipal**: Dados Corporate
- **ipcolistacomponentekey**: Dados Corporate
- **ipcomunicipio**: Dados Corporate
- **ipconomecontato**: Dados Corporate
- **ipcopontoentrega**: Dados Corporate
- **ipcopropriedadebandeira**: Dados Corporate
- **ipcorazaosocial**: Dados Corporate
- **ipcorazaosocialpontovenda**: Dados Corporate
- **ipcosiglauf**: Dados Corporate
- **ipcosituacao**: Dados Corporate
- **ipcotelefone**: Dados Corporate
- **ipcotipopessoa**: Dados Corporate

---

## IPICABI

**21 campos documentados**

- **ipicabiagencia**: Agência
- **ipicabibanco**: Banco
- **ipicabicnpj**: CNPJ Conciliação
- **ipicabicodigo**: Código PK tabela
- **ipicabicodigotransacao**: Código Transação
- **ipicabiconta**: Conta
- **ipicabicreditorecebido**: Crédito Recebido
- **ipicabidatahora**: Data Hora Transação
- **ipicabidatapagamento**: Data Efetiva Repasse
- **ipicabidataprevisao**: Data Previsão Repasse
- **ipicabiempresa**: Empresa (FK)
- **ipicabiestorno**: Valor Estorno
- **ipicabimeiopagamento**: Meio de Pagamento
- **ipicabirazaosocial**: Razão Social Conciliação
- **ipicabistatus**: Status
- **ipicabistatustransacao**: Status Transação
- **ipicabitarifatransferencia**: Tarifa Transferência
- **ipicabitaxatransacao**: Taxa Transação
- **ipicabivalorcompra**: Valor da Compra
- **ipicabivalorpagamento**: Valor Pagamento
- **ipicabivalorreceber**: Valor à Receber

---

## IPICRED

**15 campos documentados**

- **ipicredambiente**: Codigo Ambiente 1-Produção|2-Homologação|3-Laboratório
- **ipicredclientid**: Client ID
- **ipicredclientname**: Client Name
- **ipicredclientsecret**: Client Secret
- **ipicredcodigoabadi**: Còdigo Abadi Ipiranga
- **ipicredcodigocomponente**: Código Componente Ipiranga
- **ipicredempresa**: Codigo Empresa
- **ipicredsessioncode**: Session Code
- **ipicredsessioncodedata**: Data Session Code
- **ipicredterminal**: Terminal Sistema
- **ipicredterminaluuid**: Terminal UUID
- **ipicredtipo**: Codigo Tipo Credencial: 1-Retaguarda|2-PDV|3-POS
- **ipicredtipocomponente**: Codigo Tipo Componente: 1-Pista|2-AmPm|5-JetOl
- **ipicredtoken**: Token Web Socket
- **ipicredtokendata**: Data Token

---

## IPIPCMP

**8 campos documentados**

- **ipipcmpcodigo**: Código Sequencial
- **ipipcmpcodigoproduto**: Código Produto
- **ipipcmpcomponenteproduto**: Força Preço 1,2,3
- **ipipcmpdataregistro**: Data Registro
- **ipipcmpempresa**: Código Empresa
- **ipipcmpjson**: Json Backup
- **ipipcmpqtdproduto**: Valor Referencial
- **ipipcmpversaojson**: Versão JSON

---

## IPIPFBR

**7 campos documentados**

- **ipipfbrcodigo**: Código Sequencial
- **ipipfbrcodigofabricante**: Código Fabricante Ipiranga
- **ipipfbrdataregistro**: Data Registro
- **ipipfbrdescricaofabricante**: Descrição Fabricante
- **ipipfbrempresa**: Código Empresa
- **ipipfbrjson**: Json Backup
- **ipipfbrversaojson**: Versão JSON

---

## IPIPGRP

**8 campos documentados**

- **ipipgrpatividadecomponente**: Código Atividade Ipiranga Componente
- **ipipgrpcodigo**: Código Sequencial
- **ipipgrpcodigogrupo**: Código Grupo Ipiranga
- **ipipgrpdataregistro**: Data Registro
- **ipipgrpdescricaogrupo**: Descrição Grupo Ipiranga
- **ipipgrpempresa**: Código Empresa
- **ipipgrpjson**: Json Backup
- **ipipgrpversaojson**: Versão JSON

---

## IPIPKMV

**10 campos documentados**

- **ipipkmvcodigo**: Código Sequencial
- **ipipkmvcodigoproduto**: Código Produto
- **ipipkmvdataregistro**: Data Registro
- **ipipkmvempresa**: Código Empresa
- **ipipkmvfimvigencia**: Fim Vigência
- **ipipkmviniciovigencia**: Inicio Vigência
- **ipipkmvjson**: Json Backup
- **ipipkmvqtdkm**: Quantidade KM
- **ipipkmvtipokm**: Tipo KM 1,2
- **ipipkmvversaojson**: Versão JSON

---

## IPIPPRF

**10 campos documentados**

- **ipipprfcodigo**: Código Sequencial
- **ipipprfcodigoproduto**: Código Produto
- **ipipprfdataregistro**: Data Registro
- **ipipprfempresa**: Código Empresa
- **ipipprffimvigencia**: Fim Vigência
- **ipipprfforcapreco**: Força Preço 1,2,3
- **ipipprfiniciovigencia**: Início Vigência
- **ipipprfjson**: Json Backup
- **ipipprfvalorreferencial**: Valor Referencial
- **ipipprfversaojson**: Versão JSON

---

## IPIPROD

**10 campos documentados**

- **ipiprodcodigo**: Codigo Sequencial
- **ipiprodcodigoanp**: Data Envio Ipiranga
- **ipiprodcodigobarras**: Data
- **ipiprodcodigocomponente**: Placa Jet Oil
- **ipiprodcodigoipiranga**: Código VDA
- **ipiproddataregistro**: Data Registro
- **ipiproddescricao**: Número Atendimento Automotivo Jet Oil
- **ipiprodempresa**: Codigo Empresa
- **ipiprodjson**: JSON ATENDIMENTO PUT
- **ipiprodversaojson**: Data Atendimento String

---

## IPIPSEC

**9 campos documentados**

- **ipipsecatividadecomponente**: Código Atividade Ipiranga Componente
- **ipipseccodigo**: Código Sequencial
- **ipipseccodigogrupo**: Código Grupo Ipiranga
- **ipipseccodigosecao**: Código Seção Ipiranga
- **ipipsecdataregistro**: Data Registro
- **ipipsecdescricaosecao**: Descrição Seção
- **ipipsecempresa**: Código Empresa
- **ipipsecjson**: Json Backup
- **ipipsecversaojson**: Versão JSON

---

## IPLOG

**10 campos documentados**

- **iplogbody**: Conteúdo envio
- **iplogcodigo**: Codigo Sequencial
- **iplogcontent**: Conteúdo retorno
- **iplogdata**: Data
- **iplogdescricao**: Descricao erro
- **iplogempresa**: Codigo Empresa
- **iplogendpoint**: URL EndPoint
- **iplogmetodo**: Método
- **iplogstatuscode**: Status Código
- **iplogstatustext**: Status Texto

---

## IPOFER

**21 campos documentados**

- **ipofercelular**: CELULAR KMV
- **ipofercodigo**: Codigo Sequencial
- **ipofercodigovda**: Codigo VDA
- **ipofercpfconsumidor**: CPF CONSUMIDOR
- **ipofercpfvip**: CPF VIP
- **ipoferdata**: Data Venda
- **ipoferdatanascimento**: Data Nascimento KMV
- **ipoferdesconto**: Ipiranga Oferta é Sua Valor Desconto
- **ipoferemail**: E-MAIL KMV
- **ipoferempresa**: Codigo Empresa
- **ipoferidcampanha**: ID CAMPANHA SELECIONADO
- **ipoferidcampanhadesc**: ID CAMPANHA DESCRIÇÃO SELECIONADO
- **ipoferidcesta**: VDA ID CESTA
- **ipoferjsoncriarenvio**: JSON Criar pedido Envio
- **ipoferjsoncriarretorno**: JSON Criar pedido Retorno
- **ipoferjsonvalidaenvio**: JSON Valida Envio
- **ipoferjsonvalidaretorno**: JSON Valida Retorno
- **ipofernome**: NOME KMV
- **ipoferpdvmovel**: PDV Móvel 1-Sim|0-Não
- **ipoferstatus**: Status 1-Voucher Validar|2-Voucher Queimar
- **ipoferterminal**: Terminal Venda

---

## ITGA

**18 campos documentados**

- **itgacodigo**: Código PK tabela
- **itgaexcetoemp**: Gerar Arquivo Exceto essas empresas(Cod da Emp): Ex: 111,222,333
- **itgagerarapos**: Gerar Arquivo após o horário estabelecido: Ex: 08:30:00
- **itgaintervalo**: Intervalo de Tempo em minutos que será gerado Arq: Minimo 10 min
- **itganomearq**: Nome do Arquivo: Ex: lista_[ID_PHOTHEUS]_[ID_SGA]_[DATA_HORA] (Tudo entre [] e inclusive eles, são tags que seram substituidas)
- **itgapassftp**: Senha FTP
- **itgapathftp**: Path FTP que será salvo o Arquivo: Ex: arquivos/[ID_PROTHEUS]/0001 (Tudo entre [] e inclusive eles, são tags que seram substituidas)
- **itgapathlocal**: Path Local que será salvo o Arquivo: Ex: C:/arquivos/[ID_PROTHEUS]/0001 (Tudo entre [] e inclusive eles, são tags que seram substituidas)
- **itgaportftp**: Porta do FTP
- **itgaprotocoloftp**: Protocolo FTP: Ex: FTP | SFTP | FTPS 
- **itgaquery**: Query para gerar o Arquivo
- **itgaquerydesc**: Descrição da Query
- **itgaseparadorarq**: Separador do Arquivo: Ex: [;] ou [|] e etc (Sem os conchetes)
- **itgastatus**: Status (0 - Ativo, 1 - Inativo)
- **itgatipoarq**: Tipo do Arquivo: Ex: TXT|CSV|JSON
- **itgaultimageracao**: Data Ultima Geração do Arquivo
- **itgaurlftp**: URL FTP: Ex: teste.com.br ou 127.0.0.1
- **itgauserftp**: Usuário FTP

---

## IVA

**10 campos documentados**

- **ivacbsreducao**: Reducao do CBS
- **ivaclassificacao**: Classificação Tributaria
- **ivacodigo**: Codigo da Classificacao Fiscal
- **ivaibsreducao**: Reducao do IBS
- **ivaleicomplementar**: Lei Complementar
- **ivaliberavender**: Libera Vender nesta Classificacao Fiscal
- **ivaredacao**: Redacao
- **ivasituacao**: Situação Tributaria
- **ivavigenciafinal**: Vigencia Final
- **ivavigenciainicio**: Vigencia Inicial

---

## IVAUF

**3 campos documentados**

- **ivaufestaliquota**: Aliquota IBS Estadual
- **ivaufmunaliquota**: Aliquota IBS Municipal
- **ivaufuf**: UF

---

## KARDEX

**11 campos documentados**

- **kardexcodigo**: Codigo
- **kardexdata**: Data Movimento
- **kardexempresa**: Empresa (FK)
- **kardexestoque**: Estoque apos a Operacao
- **kardexlocal**: Local do Estoque (FK)
- **kardexoperacao**: Operacao (FK) 1-entcpi 2-ajpr 3-dcbo 4-dcbi 5-tede 6-nrit/ 11-vdit 12-ajpr 13-dcbo 14-dcbi 15-tede 16-nrit/ 21-ajpr
- **kardexproduto**: Produto (FK)
- **kardexqtdent**: Quantidade Entrada
- **kardexqtdsai**: Quantidade Saida
- **kardexraiz**: Operacao (FK) 1-entcpa 2-ajbd 3-dcbo 4-dcbo 5-tede 6-nra / 11-vda  12-ajbd 13-dcbo 14-dcbo 15-tede 16-nra / 21-ajbd
- **kardextipo**: Tipo de Operacao 1-Compra 2-Sobra 3-EntraACAB 4-EntraMP 5-EntraTransferencia 6-EntraComplement/ 11-Venda 12-Perda 13-SaiuACAB 14-SaiuMP 15-SaiuTransferencia 16-SaiuComplement / 21-Balanco

---

## KITS

**6 campos documentados**

- **kitscodigo**: Codigo
- **kitscombo**: Produto origem do Combo (FK)
- **kitsempresa**: Codigo da Empresa
- **kitsproduto**: Produto pertencente ao Combo (FK)
- **kitsqtd**: Quantidade no Combo
- **kitsvlr**: Valor no Combo

---

## KMMD

**5 campos documentados**

- **kmmddata**: Data da Venda
- **kmmdkm**: KM Atual
- **kmmdmedia**: Ultima Media
- **kmmdplaca**: Placa do Veiculo
- **kmmdvenda**: Numero da Venda

---

## LABA

**25 campos documentados**

- **labaabpe**: Numero de Sequencia do ABPE e ABLG
- **labaage**: Campo Age
- **lababico**: Código do Bico
- **labacaixarm**: Código do Caixa que removeu combustivel
- **labacanal**: Canal do Abastecimento
- **labacaptura**: Data da Captura do Abastecimento
- **labacliente**: Tag do Cliente
- **labacodigo**: Codigo Sequencial
- **labacodigomaut**: Codigo da Automacao (FK)
- **labadata**: Data do Processo do Abastecimento
- **labaduration**: Campo Duration
- **labaempresa**: Código da Empresa(FK)
- **labaencerrante**: Encerrante do Abastecimento
- **labaid**: ID do Abastecimento
- **labaliberapdv**: LiberaPDV 0=nada 1-Liberado pra Enviar 10-Enviado
- **labalocked**: Campo Locked
- **labaobs**: Observacoes
- **labaqtd**: Volume do Abastecimento
- **labareserved**: Campo Reserved
- **labastate**: Campo State
- **labatag**: Campo Tag
- **labatype**: Campo Type
- **labaunit**: Unitario do Abastecimento
- **labavalor**: Valor do Abastecimento
- **labavendedor**: Tag do Vendedor

---

## LACB

**5 campos documentados**

- **lacbaplicacao**: Data da Aplicacao
- **lacbativo**: Situação do Lacre: 0-Não 1-Sim
- **lacbbomba**: Bomba (FK)
- **lacbcodigo**: Codigo
- **lacblacre**: Nro do Lacre

---

## LEST

**16 campos documentados**

- **lestbalanco**: Se está em balanço
- **lestcodigo**: Código PK e local do estoque
- **lestdescricao**: Descrição da ponta de estoque
- **lestgerasped**: Esse Estoque vai para o Sped? 0-Não 1-Sim
- **lestinativo**: Data que local foi inativo
- **lestniveis**: Opção Controle Niveis: 0-Não Utilizar Controle | 1-Liberar Todos | 2-Bloquear Todos
- **lestpadraocompra**: Local Padrao para Compra 0-Nao 1-Sim
- **lestpadraoproducao**: Local Padrao para Produção 0-Nao 1-Sim
- **lestpadraoreposicao**: Local Padrao para Reposição 0-Nao 1-Sim
- **lestpadraovenda**: Local Padrao para Venda 0-Nao 1-Sim
- **lestpermitecompra**: Permite efetuar compra neste ponto 0-Nao 1-Sim
- **lestpermiteproducao**: Permite efetuar produção neste ponto 0-Nao 1-Sim
- **lestpermitevenda**: Permite efetuar venda neste ponto 0-Nao 1-Sim
- **lestterminais**: Opção Controle Terminais: 0-Não Utilizar Controle | 1-Liberar Todos | 2-Bloquear Todos
- **lesttiposcaixa**: Opção Controle Tipos de Caixa: 0-Não Utilizar Controle | 1-Liberar Todos | 2-Bloquear Todos
- **lestusuarios**: Opção Controle Usuarios: 0-Não Utilizar Controle | 1-Liberar Todos | 2-Bloquear Todos

---

## LESTC

**3 campos documentados**

- **lestccodigo**: Codigo Sequencial
- **lestccodigolest**: Codigo do Ponto de Estoque (FK)
- **lestccodigotcxa**: Codigo do Tipo de Caixa (FK)

---

## LESTN

**3 campos documentados**

- **lestncodigo**: Codigo Sequencial
- **lestncodigolest**: Codigo do Ponto de Estoque (FK)
- **lestnnivel**: Nome do Nivel de Acesso

---

## LESTT

**3 campos documentados**

- **lesttcodigo**: Codigo Sequencial
- **lesttcodigolest**: Codigo do Ponto de Estoque (FK)
- **lesttterminal**: Nome do Terminal

---

## LESTU

**3 campos documentados**

- **lestucodigo**: Codigo Sequencial
- **lestucodigolest**: Codigo do Ponto de Estoque (FK)
- **lestuusuario**: Nome do Usuario

---

## LGCM

**9 campos documentados**

- **lgcmcaixa**: Caixa (FK)
- **lgcmcodigo**: Codigo Sequencial(PK)
- **lgcmdata**: Data e Hora da Operação
- **lgcmdescricao**: Descrição da Operação
- **lgcmempresa**: Codigo da Empresa(PK)
- **lgcmmapa**: Mapa (FK))
- **lgcmmodulo**: Módulo
- **lgcmoperacao**: Operação
- **lgcmusuario**: Usuário da Operação

---

## LIC

**4 campos documentados**

- **liccodigo**: Codigo
- **licempresa**: Empresa (FK)
- **lichash**: HASH
- **licservico**: Servico (codigo da tabela Servico do Gestor)

---

## LMC

**31 campos documentados**

- **lmcabertura**: Soma de Estoques de Abertura
- **lmcacumuladoabq**: Quantidade Acumulada na Abertura
- **lmcacumuladoabv**: Valor Acumulado na Abertura
- **lmcacumuladofcq**: Quantidade Acumulada no Fechamento
- **lmcacumuladofcv**: Valor Acumulado no Fechamento
- **lmcafericao**: Soma de Afericoes
- **lmcancora**: Ancora (Sim/Nao)
- **lmccodigo**: Codigo
- **lmccombustivel**: Combustivel (FK)
- **lmccompra**: Soma de Compras
- **lmcconferido**: Folha de LMC conferido 0-Não | 1-Sim
- **lmcdata**: Data
- **lmcempresa**: Codigo da Empresa
- **lmcfechamento**: Soma de Estoques de Fechamento
- **lmcfisico**: Soma de Estoques Fisicos
- **lmcfolha**: Folha (A/B/C/D)
- **lmcnumero**: Numero da Folha
- **lmcobs1**: OBS 1
- **lmcobs2**: OBS 2
- **lmcobs3**: OBS 3
- **lmcobs4**: OBS 4
- **lmcperiodo**: Periodo do LMC (FK)
- **lmcps**: Soma de Perdas e Sobras
- **lmctipo**: Tipo (E/V)
- **lmcunitario**: Vlr Medio Unitario
- **lmcvenda**: Soma de Vendas
- **lmcxmlchave**: XML Chave de Acesso
- **lmcxmldata**: Data de Processamento
- **lmcxmlenvio**: XML de Envio
- **lmcxmlretorno**: XML de Retorno
- **lmcxmlstatus**: Flag de Status de Enviao 0-Pendente 1-Enviado 2-Retificado 9-Rejeitado

---

## LMCC

**8 campos documentados**

- **lmcccnpj**: CNPJ do Fornecedor
- **lmcccodigo**: Codigo
- **lmcccompra**: Numero de Sequencia Nota Fiscal de Compra (FK)
- **lmccemissao**: Data de Emissao da Nota Fiscal de Compra
- **lmcclmc**: LMC (FK)
- **lmccnf**: Documento da Nota Fiscal de Compra
- **lmcctanque**: Tanque (FK)
- **lmccvolume**: Volume Descarregado

---

## LMCE

**11 campos documentados**

- **lmceabertura**: Estoque de Abertura
- **lmceancora**: Ancora (Sim/Nao)
- **lmcecodigo**: Codigo
- **lmcecompra**: Compras por Tanque
- **lmcefechamento**: Estoque Fechamento
- **lmcefisico**: Estoque Fisico
- **lmcelmc**: LMC (FK)
- **lmcemedicao**: Estoque Medido
- **lmceps**: Perdas e Sobras
- **lmcetanque**: Tanque (FK)
- **lmcevenda**: Vendas por Tanque

---

## LMCV

**9 campos documentados**

- **lmcvabertura**: Encerrante Abertura
- **lmcvafericao**: Volume Afericao
- **lmcvancora**: Ancora (Sim/Nao)
- **lmcvbico**: Bico (FK)
- **lmcvcodigo**: Codigo
- **lmcvfechamento**: Encerrante Fechamento
- **lmcvlmc**: LMC (FK)
- **lmcvtanque**: Tanque (FK)
- **lmcvvenda**: Volume Venda

---

## LMP

**4 campos documentados**

- **lmpativo**: Periodo Ativo
- **lmpempresa**: Código da Empresa
- **lmpperiodo**: Periodo
- **lmpvalido**: Periodo Validado

---

## LNC

**11 campos documentados**

- **lnccoo**: Numero do COO do cupom
- **lncdata**: Data da Venda
- **lncecf**: Numero da ECF
- **lncempresa**: Codigo da Empresa (FK) 
- **lncmarcado**: Flag 0-livre,1-marcado
- **lncnferesumo**: Numero da NF-e resumo
- **lncplaca**: Placa do Veiculo da venda
- **lncselecionado**: Flag 0-livre,1-marcado
- **lncserie**: Numero de Serie do Terminal
- **lncvalor**: Valor da Venda
- **lncvdacodigo**: Codigo VDA 

---

## LNI

**33 campos documentados**

- **lnialiqcofins**: Aliquota Cofins
- **lnialiqfcp**: Aliquota FCP
- **lnialiqicms**: Aliquota Icms
- **lnialiqipi**: Aliquota Ipi
- **lnialiqpis**: Aliquota Pis
- **lnialiqred**: Aliquota Reducao Icms 020
- **lnialiqst**: Aliquota St
- **lnibasefcp**: Base Calculo FCP
- **lnibaseicms**: Base Calculo Icms
- **lnibaseipi**: Base Calculo Ipi
- **lnibasepc**: Base Calculo Pis/Cofins
- **lnibasest**: Base Calculo St
- **lnicfop**: Codigo CFOP do Item
- **lnicodigo**: Sequencia do LNI
- **lniempresa**: Código da Empresa(FK)
- **lniimpostosaproxe**: Valor dos Tributos Estaduais
- **lniimpostosaproxf**: Valor dos Tributos Federais
- **lniimpostosaproxm**: Valor dos Tributos Municipais
- **lninatrec**: Natureza Receita (FK)
- **lniproduto**: Codigo do Produto
- **lniqtd**: Quantidade
- **lniserie**: Numero de Serie do Terminal
- **lnisticms**: st Icms (FK)
- **lnistipi**: st Ipi (FK)
- **lnistpc**: st Pis/cofins (FK)
- **lnitotal**: Valor Total
- **lniunitario**: Valor Unitario
- **lnivlrcofins**: Valor Cofins
- **lnivlrfcp**: Valor FCP
- **lnivlricms**: Valor Icms
- **lnivlripi**: Valor Ipi
- **lnivlrpis**: Valor Pis
- **lnivlrst**: Valor St

---

## LOCZ

**2 campos documentados**

- **loczcodigo**: Codigo Sequencial
- **loczdescricao**: Descricao

---

## LOGO

**4 campos documentados**

- **logocodigo**: Codigo Sequencial
- **logoconteudo**: Conteudo Imagem
- **logoempresa**: Codigo da Empresa
- **logohash**: hash do repositorio

---

## LOGP

**10 campos documentados**

- **logpcodigo**: Codigo Sequencial
- **logpdatahora**: Data e Hora do Log
- **logpdesenvolvimento**: Flag 0-Não 1-Sim
- **logpempresa**: Empresa
- **logphash**: Hash do Registro
- **logphistorico**: Historico do Log
- **logpoperacao**: Descricao da Operacao
- **logpterminal**: Terminal Ativo
- **logptitulo**: Titulo de Identificacao
- **logpusuario**: Usuario Ativo

---

## LTEP

**2 campos documentados**

- **ltepcodigo**: Codigo Sequencial
- **ltepdescricao**: Descricao

---

## MAPA

**14 campos documentados**

- **mapacalculoinicial**: 0-Mapa Calculado 1-Necessita de Calculo Inicial
- **mapacedulaentrada**: Total de Entrada em Cedula do Mapa
- **mapacedulafinal**: Saldo em Cedula Final do Mapa
- **mapacedulainicio**: Saldo em Cedula Inicial do Mapa
- **mapacedulasaida**: Total de Saida   em Cedula do Mapa
- **mapaconferencia**: Data Hora da Conferencia do Mapa
- **mapadata**: Data do Mapa
- **mapaempresa**: Código da Empresa
- **mapamoedaentrada**: Total de Entrada em Moeda do Mapa
- **mapamoedafinal**: Saldo em Moeda Final do Mapa
- **mapamoedainicio**: Saldo em Moeda Inicial do Mapa
- **mapamoedasaida**: Total de Saida   em Moeda do Mapa
- **mapaobs**: Observacoes
- **maparecalculo**: Mapa necessita de Recalculo

---

## MAPC

**4 campos documentados**

- **mapccaixa**: Numero do Caixa Agregado ao Mapa (FK)
- **mapccodigo**: Codigo Sequencial do Caixa Agregado ao Mapa
- **mapcempresa**: Código da Empresa
- **mapcmapa**: Data do Caixa (FK)

---

## MAPF

**7 campos documentados**

- **mapfcc**: Conta Corrente da Contra Partida (FK)
- **mapfcodigo**: Codigo Sequencial do Fluxo do Mapa
- **mapfempresa**: Código da Empresa
- **mapfhistorico**: Historico do Fluxo do Mapa
- **mapfmapa**: Data do Caixa (FK)
- **mapfoperacao**: Flag de Operacao (S)aque (D)eposito (M)oeda+ (C)edula+
- **mapfvalor**: Valor do Lancamento

---

## MAUT

**18 campos documentados**

- **mautativo**: Flag de Automação - Ativa 1 | Inativa 0
- **mautatualizadata**: Flag de Atualização de data/hora - 1-Atualizar | 0-Não Atualizar
- **mautbaixarlog**: Flag de Baixa do Log - 1-Baixar | 0-Não Baixar
- **mautbloqueiopista**: Flag de Bloqueio de Pista 0-liberada|1-pede bloq|2-bloqueada|3-pede lib
- **mautcaptec**: Modo de Captura Encerrantes Flag 0-Não 1-Manual 2-Equipamento
- **mautcaptpr**: Imprimir Encerrantes no Documento Fiscal Flag 0-Não 1-Sim
- **mautcaptqv**: Modo de Captura Valores Flag 0-Qtd 1-Total
- **mautcodigo**: Codigo
- **mautdatahoramedicao**: Data/Hora da Solicitação de Medição dos Tanques
- **mautempresa**: Código da Empresa (Fk)
- **mautexecutavel**: Nome do Executavel Responsavel pela Comunicação Fisica
- **mautmedidorputty**: Flag de Conexão com Medidor de Tanques, utilizando PuTTy - 0-Não | 1-Sim
- **mautmedidortq**: Medidor de Tanque Ativo flag tabela interna ver na Classe
- **mautmodelo**: Modelo Automacao flag tabela interna ver na Classe
- **mautmultprecos**: Flag para identificar se a Bomba trabalha Vários Preços - 1-Sim | 0-Não
- **mautporta**: Porta de Comunicacao com a Automacao
- **mautportamedidor**: Porta de Comunicacao com o Medidor de Combustivel
- **mautrealizamedicao**: Flag de Leitura da Medição de Tanques - 0-Não | 1-Fechamento | 2-Abertura | 3-Conferencia

---

## MBBA

**4 campos documentados**

- **mbbacodigo**: Codigo
- **mbbafabrica**: Fabricante
- **mbbamodelo**: Modelo
- **mbbatipo**: Tipo (M)ecanica (D)igital

---

## MBUS

**5 campos documentados**

- **mbuscodigo**: Código
- **mbusdepto**: Departamento
- **mbusemail**: E.mail
- **mbusnome**: Nome
- **mbussenha**: Senha

---

## MDMA

**15 campos documentados**

- **mdmacodigo**: Codigo Sequencial
- **mdmacodigopart**: Codigo Participante (FK)
- **mdmacodigopdv**: Código MDMA do PDV para controle
- **mdmacombustivel**: Código do Combustivel PROD
- **mdmadata**: Data e hora abastecimento
- **mdmadocumento**: Documento de venda
- **mdmaempresa**: Codigo Empresa (FK)
- **mdmakm**: Km Atual
- **mdmaliberapdv**: LiberaPDV 0=nada 1-Liberado pra Enviar 10-Enviado
- **mdmalitros**: Litros abastecidos
- **mdmamedia**: Média calculada
- **mdmamotorista**: Nome do motorista
- **mdmaobs**: Observação do Abastecimento
- **mdmaorigemvda**: Código da VDA
- **mdmaplaca**: Placa para destinguir veículo

---

## MDOC

**2 campos documentados**

- **mdoccodigo**: Codigo
- **mdocdescricao**: Descricao

---

## MENS

**3 campos documentados**

- **menscodigo**: Codigo
- **mensddata**: Data e hora da Alteração
- **mensmensagem**: Mensagem

---

## MEXCPO

**4 campos documentados**

- **mexcpoadicional**: Quantidade Adicional do FK
- **mexcpocampo**: Nome do Campo
- **mexcpotabela**: Nome da Tabela
- **mexcpotipo**: Tipo do Campo

---

## MEXTAB

**4 campos documentados**

- **mextabgerador**: Gerador ID da Tabela
- **mextabpk**: Nome da PK da Tabela
- **mextabsequencia**: Ultimo Codigo da Tabela
- **mextabtabela**: Nome da Tabela

---

## MOB

**7 campos documentados**

- **mobcodigo**: Codigo
- **mobemp**: Codigo Empresa
- **mobgraphql**: GraphQL a ser enviado para api
- **mobop**: Operacao: 1 - Inclusao, 2 - Alteracao, 3 - Exclusão
- **mobpk**: Primary do registro a enviar
- **mobsql**: SQL executado na retaguarda
- **mobtabela**: Tabela a enviar para o mobile

---

## MPAPP

**14 campos documentados**

- **mpappcodigo**: Codigo Sequencial
- **mpappcodigovda**: Codigo VDA
- **mpappcpf**: CPF Cliente
- **mpappdata**: Data Venda
- **mpappempresa**: Codigo Empresa
- **mpappidpagamento**: ID Pagamento
- **mpappjsonenvio**: JSON Valida Envio
- **mpappjsonretorno**: JSON Valida Retorno
- **mpappnome**: Nome Cliente
- **mpapppdvmovel**: PDV Móvel 1-Sim|0-Não
- **mpappqrcode**: QR Code
- **mpappstatus**: Status: 1-Aprovado|0-Cancelado
- **mpappterminal**: Terminal Venda
- **mpappvalorresgate**: Meu Posto App Valor Resgatado

---

## MPCXA

**10 campos documentados**

- **mpcxacodigo**: Codigo Sequencial
- **mpcxacodigomplja**: Codigo Loja MPLJA FK
- **mpcxaempresa**: Codigo Empresa
- **mpcxaexternalidcaixa**: EXTERNAL ID CAIXA
- **mpcxaexternalidloja**: EXTERNAL ID LOJA
- **mpcxaidcaixa**: ID Caixa
- **mpcxaidloja**: ID Loja
- **mpcxajsonenvio**: Json Envio Caixa
- **mpcxajsonretorno**: Json Retorno Caixa
- **mpcxanomecaixa**: Nome Caixa

---

## MPLJA

**8 campos documentados**

- **mpljaaccesstoken**: Access Token
- **mpljacodigo**: Codigo Sequencial
- **mpljaempresa**: Codigo Empresa
- **mpljaexternalid**: ID EXTERNO LOJA MERCADO PAGO
- **mpljaid**: ID LOJA MERCADO PAGO
- **mpljajsonenvio**: Json Envio Loja
- **mpljajsonretorno**: Json Retorno Loja
- **mpljanomeloja**: Nome Loja

---

## MPLOG

**10 campos documentados**

- **mplogbody**: Conteúdo envio
- **mplogcodigo**: Codigo Sequencial
- **mplogcontent**: Conteúdo retorno
- **mplogdata**: Data
- **mplogdescricao**: Descricao erro
- **mplogempresa**: Codigo Empresa
- **mplogendpoint**: URL EndPoint
- **mplogmetodo**: Método
- **mplogstatuscode**: Status Código
- **mplogstatustext**: Status Texto

---

## MTNQ

**6 campos documentados**

- **mtnqcapacidade**: Capacidade de Combustivel
- **mtnqcodigo**: Codigo
- **mtnqcomprimento**: Comprimento do Tanque
- **mtnqfabrica**: Fabricante
- **mtnqlargura**: Largura do Tanque
- **mtnqmodelo**: Modelo

---

## NATR

**2 campos documentados**

- **natrcodigo**: Codigo
- **natrdescricao**: Descricao

---

## NATV

**4 campos documentados**

- **natvcodigo**: Codigo Sequencial)
- **natvnatureza**: Natureza de Receita (FK)
- **natvncmfinal**: Codigo Ncm Final
- **natvncminicio**: Codigo Ncm Inicio

---

## NATZ

**3 campos documentados**

- **natzcfop**: CFOP Dessa Natureza
- **natzdescricao**: Natureza de Operacao
- **natzenviapdv**: 0-Não | 1-Sim

---

## NCMC

**14 campos documentados**

- **ncmcauditor**: Auditor
- **ncmccalculast**: Calcula ST  0-Não 1-Sim
- **ncmccest**: Codigo CEST
- **ncmccfop**: Codigo do CFOP (FK)
- **ncmccodigo**: Codigo (PK)
- **ncmcdescricao**: Descricao
- **ncmcexcecao**: Codigo Exceção (PK)
- **ncmcibpt**: Imposto Aproximado pela Tabela IBPT
- **ncmcicms**: Aliquota de ICMS
- **ncmcreservado**: Reserva NCM para o Cliente - 0-Liberado | 1-Reservado
- **ncmcstipi**: Situacao Tributaria IPI  (FK)
- **ncmcstpc**: Situacao Tributaria PIS COFINS (FK)
- **ncmctitulo**: Flag 0-Liberado 1-Titulo
- **ncmcund**: Und de Medida

---

## NPAG

**7 campos documentados**

- **npagacrescimo**: Acrescimo
- **npagcodigo**: Codigo Sequencial
- **npagdescricao**: Descricao
- **npagdias1venc**: Dia do 1 Vencimento
- **npagintervalo**: Intervalo
- **npagintervalotipo**: 0 Dias/1 Semana/2 Meses
- **npagqtdparc**: Quantidade de Parcelas

---

## NRA

**53 campos documentados**

- **nraauditoria**: Data da Auditoria
- **nraautorizacao**: Data e Hora da Autorizacao
- **nracancdominio**: ID do Envio da Nota(Cancelada) para API Dominio
- **nrachave**: Chave do Documento
- **nracliente**: Codigo do Cliente (FK)
- **nracodigo**: Codigo Sequencial
- **nracontingencia**: Contingencia 1-Normal 2-FS 3-SCAN 4-DPEC 5-FSDA 9-OFFLINE
- **nracontingenciadata**: Data e Hora da Entrada na Contingencia
- **nradatahoraepec**: Data Hora Envio EPEC
- **nradominio**: ID do Envio da Nota para API Dominio
- **nraemissao**: data Emissao
- **nraemissaoh**: Hora Emissao
- **nraempresa**: Código da Empresa
- **nraendereco**: Codigo do Endereco (FK)
- **nrafaturaorigem**: Numero da Fatura de Origem do documento
- **nrafinalidade**: Finalidade (1)Normal (2)Complemento (3)Ajuste (4)DevolucaoRetorno
- **nraimportacaons**: Importação Nota Segura 0-Nao 1-Sim
- **nrainfogeral**: Informacoes Gerais
- **nraloteepec**: Lote Envio EPEC
- **nramanip**: Flag de Manipulacao 0-Original 1-Manipulada
- **nramodelo**: Codigo do Documento (FK)
- **nramotivocanc**: Motivo do Cancelamento
- **nranaoauditar**: Flag Nao Auditar 0-Auditar 1-NaoAuditar
- **nranatureza**: Natureza da Nota Fiscal
- **nranitemped**: ORDEM DE COMPRA - Numero do Item
- **nranumero**: Numero da Nota Fiscal
- **nraorigem**: Flag de Origem 0Manual 1SubDoc 2Periodo 3Fatura 4Devolucao
- **nraprotocolo**: Protocolo de autorizacao
- **nraprotocoloepec**: Protocolo Envio EPEC
- **nrarecibo**: Recibo de Transmissao
- **nrasaida**: data Saida
- **nrasaidah**: Hora Saida
- **nraserie**: Numero de Serie
- **nrasituacao**: Situacao: 0-Dig, 10-Aut, 11-Canc, 12-Denegada, 20-Inutilizada
- **nratipo**: Tipo de Documento (0)Entrada (1)Saida
- **nrauploadxmlaut**: Data e Hora do Upload do XML autorizacao
- **nrauploadxmlautns**: Data e Hora do Upload do XML autorizacao (Nota Segura)
- **nrauploadxmlcan**: Data e Hora do Upload do XML cancelamento
- **nrauploadxmlcanns**: Data e Hora do Upload do XML cancelamento (Nota Segura)
- **nrauploadxmlinu**: Data e Hora do Upload do XML inutilizacao
- **nrauploadxmlinuns**: Data e Hora do Upload do XML inutilizacao (Nota Segura)
- **nrausuariocanc**: Usuario que Cancelou o Documento
- **nravlbcretprev**: Base de Cálculo da Retenção da Previdência Social
- **nravlretprev**: Valor da Retenção da Previdência Social
- **nraxmlcancel**: XML de Cancelamento do Documento
- **nraxmlemail**: Data e Hora do Envio do e.mail do documento
- **nraxmlenvio**: XML de Envio do documento
- **nraxmlepec**: XML EPEC Montado
- **nraxmlepecassinado**: XML EPEC Assinado
- **nraxmlepecenvio**: XML EPEC Enviado
- **nraxmlinutil**: XML de Inutilizacao do Documento
- **nraxmlprint**: Data e Hora da Impressao do documento
- **nraxped**: ORDEM DE COMPRA - Numero da Ordem de Compra

---

## NRAEDOC

**14 campos documentados**

- **nraedocautocorrecao**: SgaEdoc aplica possivel auto correção de dados
- **nraedoccodigonra**: Codigo da venda (FK)
- **nraedocempresa**: Codigo da Empresa (FK)
- **nraedocoriginalchave**: Chave de acesso do arquivo original
- **nraedocprocessando**: Data do Processamento
- **nraedocstscancelado**: Status: 00-Sem Ação|10-Solicitar Descarte|30-Falha no Descarte|100-Numero Inutilizado|101-Documento Cancelado|102-Documento Substituido
- **nraedocstscontingencia**: Status: 00-Sem Ação|100-Contingencia OFF|101-Contingencia FS|102-Contingencia SCAN|103-Contingencia DPEC|104-Contingencia FSDA
- **nraedocstsdestino**: Status: 00-Sem Ação|10-Solicitar e-mail|11-Solicitar Whats|30-Falha no Envio|100-Documento Destinado
- **nraedocstsenvio**: Status: 00-Sem Ação|10-Gerar XML|11-Enviar Sefaz|30-Falha Envio|31-Documento Rejeitado|32-Documento Denegado|100-Documento Autorizado
- **nraedocstsimpressao**: Status: 00-Sem Ação|10-Solicitar Bobina|11-Solicitar A4|30-Falha na Impressao|100-Documento Impresso
- **nraedoctagrejeicao**: cStat de rejeição da NFCe/NFe
- **nraedoctentativaproxima**: Data da Proxima Tentativa
- **nraedoctentativavezes**: Quantidade de Tentativas
- **nraedocterminalimpressao**: Nome do Terminal Destino da Impressao

---

## NRAPDOC

**9 campos documentados**

- **nrapdoccodigo**: Codigo (PK)
- **nrapdoccodigonra**: Codigo da venda (FK)
- **nrapdocdata**: Data
- **nrapdocempresa**: Codigo da Empresa (FK)
- **nrapdocprocesso**: Status
- **nrapdocstatus**: Status
- **nrapdocversao**: Codigo da Versao
- **nrapdocxmlenvio**: XML de Envio
- **nrapdocxmlretorno**: XML de Retorno

---

## NRAX

**57 campos documentados**

- **nraxantt**: Registro na ANTT
- **nraxautorizacao**: Data e Hora da Autorizacao
- **nraxchave**: Chave do Documento
- **nraxcliente**: Codigo do Cliente (FK)
- **nraxcodigo**: Codigo Sequencial
- **nraxcontingencia**: Contingencia 1-Normal 2-FS 3-SCAN 4-DPEC 5-FSDA 9-OFFLINE
- **nraxcontingenciadata**: Data e Hora da Entrada na Contingencia
- **nraxdatahoraepec**: Data Hora Envio EPEC
- **nraxemissao**: data Emissao
- **nraxemissaoh**: Hora Emissao
- **nraxempresa**: Código da Empresa
- **nraxendereco**: Codigo do Endereco (FK)
- **nraxespecie**: Transporte - Especie
- **nraxfaturaorigem**: Numero da Fatura de Origem do documento
- **nraxfinalidade**: Finalidade (0)Normal (1)Complemento (2)Ajuste (3)DevolucaoRetorno
- **nraxinfogeral**: Informacoes Gerais
- **nraxlacres**: Transporte - Lacres
- **nraxliberado**: Processamento Liberado
- **nraxliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Liberado 10-OK 99-Erro
- **nraxloteepec**: Lote Envio EPEC
- **nraxmanip**: Flag de Manipulacao 0-Original 1-Manipulada
- **nraxmarca**: Transporte - Marca
- **nraxmodelo**: Codigo do Documento (FK)
- **nraxnatureza**: Natureza da Nota Fiscal
- **nraxnitemped**: ORDEM DE COMPRA - Numero do Item
- **nraxnumeracao**: Transporte - Numeracao
- **nraxnumero**: Numero da Nota Fiscal
- **nraxorigem**: Flag de Origem 0Manual 1SubDoc 2Periodo 3Fatura 4Devolucao 5AjCancel
- **nraxpesobruto**: Transporte - Peso Bruto
- **nraxpesoliquido**: Transporte - Peso Liquido
- **nraxplaca**: Placa do Veiculo Transportador
- **nraxprotocolo**: Protocolo de autorizacao
- **nraxprotocoloepec**: Protocolo Envio EPEC
- **nraxquantidade**: Transporte - Quantidade
- **nraxrecibo**: Recibo de Transmissao
- **nraxrejeicao**: Descricao da Rejeicao
- **nraxsaida**: data Saida
- **nraxsaidah**: Hora Saida
- **nraxserie**: Numero de Serie
- **nraxsituacao**: Situacao: 00-Digit 01-Valid 02-Process 03-Rejeit 10-Autoriz 11-Cancel 12-Deneg 20-Inutiliz
- **nraxtagretornosefaz**: TAG de Retorno da Sefaz
- **nraxtipo**: Tipo de Documento (0)Entrada (1)Saida
- **nraxtpfrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **nraxtransportador**: Codigo do Transportador (FK)
- **nraxufveiculo**: UF do veiculo
- **nraxvlbcretprev**: Base de Cálculo da Retenção da Previdência Social
- **nraxvlretprev**: Valor da Retenção da Previdência Social
- **nraxxmlcancel**: XML de Cancelamento do Documento
- **nraxxmlemail**: Data e Hora do Envio do e.mail do documento
- **nraxxmlenvio**: XML de Envio do documento
- **nraxxmlepec**: XML EPEC Montado
- **nraxxmlepecassinado**: XML EPEC Assinado
- **nraxxmlepecenvio**: XML EPEC Enviado
- **nraxxmlinutil**: XML de Inutilizacao do Documento
- **nraxxmlprint**: Data e Hora da Impressao do documento
- **nraxxmlretornosefaz**: XML de Retorno da Sefaz
- **nraxxped**: ORDEM DE COMPRA - Numero da Ordem de Compra

---

## NRCP

**13 campos documentados**

- **nrcpchavenfe**: Chave da NFe
- **nrcpcnpjnf**: Cnpj da NF Manual
- **nrcpcodigo**: Codigo Sequencial
- **nrcpcodigonra**: Codigo da NFe (FK)
- **nrcpcodigovda**: Codigo FK de referencia com a Vda
- **nrcpcoo**: Numero do COO
- **nrcpecf**: Numero da ECF
- **nrcpemissaonf**: Emissao da NF Manual
- **nrcpempresa**: Codigo da Empresa
- **nrcpmodelo**: Modelo do Documento (FK)
- **nrcpnumeronf**: Numero da NF Manual
- **nrcpplaca**: Placa do Veiculo
- **nrcpufnf**: UF da NF Manual

---

## NRCPX

**14 campos documentados**

- **nrcpxchavenfe**: Chave da NFCe
- **nrcpxcnpjnf**: Cnpj da NF Manual
- **nrcpxcodigo**: Codigo Sequencial
- **nrcpxcodigonrax**: Codigo da NFe (FK)
- **nrcpxcodigovda**: Codigo FK de referencia com a Vda
- **nrcpxcoo**: Numero do COO
- **nrcpxecf**: Numero da ECF
- **nrcpxemissaonf**: Emissao da NF Manual
- **nrcpxempresa**: Código da EMpresa (FK)
- **nrcpxkm**: KM do Veiculo
- **nrcpxmodelo**: Modelo do Documento (FK)
- **nrcpxnumeronf**: Numero da NF Manual
- **nrcpxplaca**: Placa do Veiculo
- **nrcpxufnf**: UF da NF Manual

---

## NRIT

**52 campos documentados**

- **nritacrescimo**: Acrescimo Total do Item
- **nritadicional**: Descricao Adicional
- **nritaliqadrem**: Aliquota AdRem do combustível monofásico
- **nritaliqcbs**: Aliquota CBS
- **nritaliqcofins**: Aliquota Cofins
- **nritaliqfcp**: Aliquota FCP
- **nritaliqibs**: Aliquota IBS
- **nritaliqicms**: Aliquota Icms
- **nritaliqicmsdif**: Percentual do diferimento do ICMS (tag pDif)
- **nritaliqipi**: Aliquota Ipi
- **nritaliqirrf**: Aliquota IRRF
- **nritaliqpis**: Aliquota Pis
- **nritaliqred**: Aliquota Reducao Icms 020
- **nritaliqst**: Aliquota St
- **nritbasefcp**: Base Calculo FCP
- **nritbaseicms**: Base Calculo Icms
- **nritbaseipi**: Base Calculo Ipi
- **nritbasepc**: Base Calculo Pis/Cofins
- **nritbasest**: Base Calculo St
- **nritcfop**: Codigo CFOP do Item
- **nritcodigo**: Codigo Sequencial
- **nritcodigonra**: Codigo da NFe (FK)
- **nritdesconto**: Desconto Total do Item
- **nritempresa**: Codigo da Empresa
- **nritfisico**: Movimenta Estoque Fisico (S)im/(N)ao
- **nritfrete**: Frete Total do Item
- **nriticmsoperacao**: Valor do ICMS como se não tivesse o diferimento
- **nritipipercdev**: Percentual de Devolucao de Produtos (Máximo 100%)
- **nritipivalordev**: Valor do Ipi a ser Devolvido
- **nrititem**: Sequencia do Item
- **nritiva**: Classificacao Fiscal do IVA
- **nritpercbiocomb**: Percentual do Bio Combustivel
- **nritpontoestoque**: Código do Ponto de Estoque(FK)
- **nritproduto**: Codigo do Produto (FK)
- **nritqtd**: Quantidade
- **nritredbcst**: Percentual da Reducao da Base de Calculo do ICMS ST
- **nritsticms**: st Icms (FK)
- **nritstipi**: st Ipi (FK)
- **nritstnatr**: st Natureza Receita (FK)
- **nritstpc**: st Pis/cofins (FK)
- **nritsubtotal**: Valor Total do Item
- **nrittotal**: Valor Total do Item
- **nritunitario**: Valor Unitario
- **nritvlrcofins**: Valor Cofins
- **nritvlrfcp**: Valor FCP
- **nritvlricms**: Valor Icms
- **nritvlricmsdif**: Valor do diferimento do ICMS (tag vICMSDif)
- **nritvlricmsmonoret**: Valor ICMS cobrado anteriormente combustivel monofasico
- **nritvlripi**: Valor Ipi
- **nritvlrirrf**: Valor IRRF
- **nritvlrpis**: Valor Pis
- **nritvlrst**: Valor St

---

## NRITX

**53 campos documentados**

- **nritxacrescimo**: Acrescimo Total do Item
- **nritxadicional**: Descricao Adicional
- **nritxaliqadrem**: Aliquota AdRem do combustível monofásico
- **nritxaliqcofins**: Aliquota Cofins
- **nritxaliqfcp**: Aliquota FCP
- **nritxaliqicms**: Aliquota Icms
- **nritxaliqicmsdif**: Percentual do diferimento do ICMS (tag pDif)
- **nritxaliqipi**: Aliquota Ipi
- **nritxaliqirrf**: Aliquota IRRF
- **nritxaliqpis**: Aliquota Pis
- **nritxaliqred**: Aliquota Reducao Icms 020
- **nritxaliqst**: Aliquota St
- **nritxbasefcp**: Base Calculo FCP
- **nritxbaseicms**: Base Calculo Icms
- **nritxbaseipi**: Base Calculo Ipi
- **nritxbasepc**: Base Calculo Pis/Cofins
- **nritxbasest**: Base Calculo St
- **nritxcfop**: Codigo CFOP do Item
- **nritxcodigo**: Codigo Sequencial
- **nritxcodigonrax**: Codigo da NFe (FK)
- **nritxdesconto**: Desconto Total do Item
- **nritxempresa**: Código da Empresa
- **nritxfisico**: Movimenta Estoque Fisico (S)im/(N)ao
- **nritxfrete**: Frete Total do Item
- **nritxicmsoperacao**: Valor do ICMS como se não tivesse o diferimento
- **nritximpostosaproxe**: Valor dos Tributos Estaduais
- **nritximpostosaproxf**: Valor dos Tributos Federais
- **nritximpostosaproxm**: Valor dos Tributos Municipais
- **nritxipipercdev**: Percentual de Devolucao de Produtos (Máximo 100%)
- **nritxipivalordev**: Valor do Ipi a ser Devolvido
- **nritxitem**: Sequencia do Item
- **nritxpercbiocomb**: Percentual do Bio Combustivel
- **nritxpontoestoque**: Código do Ponto de Estoque(FK)
- **nritxproduto**: Codigo do Produto (FK)
- **nritxqtd**: Quantidade (desabilitado, mantem apenas por compatibilidade)
- **nritxquantedit**: Edita Quantidade 0-Não | 1-Sim
- **nritxredbcst**: Percentual da Reducao da Base de Calculo do ICMS ST
- **nritxsticms**: st Icms (FK)
- **nritxstipi**: st Ipi (FK)
- **nritxstnatr**: st Natureza Receita (FK)
- **nritxstpc**: st Pis/cofins (FK)
- **nritxsubtotal**: Valor Sub-Total do Item
- **nritxtotal**: Valor Total do Item (subtotal-desconto+acrescimo+frete+vlripi+vlrst010e070
- **nritxunitario**: Valor Unitario
- **nritxvlrcofins**: Valor Cofins
- **nritxvlrfcp**: Valor FCP
- **nritxvlricms**: Valor Icms
- **nritxvlricmsdif**: Valor do diferimento do ICMS (tag vICMSDif)
- **nritxvlricmsmonoret**: Valor ICMS cobrado anteriormente combustivel monofasico
- **nritxvlripi**: Valor Ipi
- **nritxvlrirrf**: Valor IRRF
- **nritxvlrpis**: Valor Pis
- **nritxvlrst**: Valor St

---

## NRLE

**14 campos documentados**

- **nrlebairro**: Bairro do Endereco de Entrega
- **nrlecep**: Cep do Endereco de Entrega
- **nrlecidade**: Cidade do Endereco de Entrega
- **nrlecnpjcpf**: CNPJ/CPF do Recebedor
- **nrlecodigonra**: Codigo da NFe (FK)
- **nrlecomplemento**: Complemento do Endereco de Entrega
- **nrleemail**: Email do Recebedor
- **nrleempresa**: Codigo da Empresa
- **nrleie**: IE do Recebedor
- **nrlelogradouro**: Logradouro do Endereco de Entrega
- **nrlenumero**: Numero do Endereco de Entrega
- **nrlerecebedor**: Nome do Recebedor
- **nrletelefone**: Telefone do Recebedor
- **nrleuf**: UF do Endereco de Entrega

---

## NRLEX

**14 campos documentados**

- **nrlexbairro**: Bairro do Endereco de Entrega
- **nrlexcep**: Cep do Endereco de Entrega
- **nrlexcidade**: Cidade do Endereco de Entrega
- **nrlexcnpjcpf**: CNPJ/CPF do Recebedor
- **nrlexcodigonrax**: Codigo da NFe (FK)
- **nrlexcomplemento**: Complemento do Endereco de Entrega
- **nrlexemail**: Email do Recebedor
- **nrlexempresa**: Código da Empresa
- **nrlexie**: IE do Recebedor
- **nrlexlogradouro**: Logradouro do Endereco de Entrega
- **nrlexnumero**: Numero do Endereco de Entrega
- **nrlexrecebedor**: Nome do Recebedor
- **nrlextelefone**: Telefone do Recebedor
- **nrlexuf**: UF do Endereco de Entrega

---

## NRPG

**5 campos documentados**

- **nrpgcodigo**: Codigo Sequencial
- **nrpgcodigonra**: Codigo da NFe (FK)
- **nrpgempresa**: Codigo da Empresa
- **nrpgvalor**: Valor da Parcela
- **nrpgvencimento**: Vencimento da Parcela

---

## NRPGX

**5 campos documentados**

- **nrpgxcodigo**: Codigo Sequencial
- **nrpgxcodigonrax**: Codigo da NFe (FK)
- **nrpgxempresa**: Código da Empresa (FK)
- **nrpgxvalor**: Valor da Parcela
- **nrpgxvencimento**: Vencimento da NF Manual

---

## NRTR

**14 campos documentados**

- **nrtrantt**: Registro na ANTT
- **nrtrcodigonra**: Codigo da NFe (FK)
- **nrtrempresa**: Codigo da Empresa (FK)
- **nrtrespecie**: Transporte - Especie
- **nrtrlacres**: Transporte - Lacres
- **nrtrmarca**: Transporte - Marca
- **nrtrnumeracao**: Transporte - Numeracao
- **nrtrpesobruto**: Transporte - Peso Bruto
- **nrtrpesoliquido**: Transporte - Peso Liquido
- **nrtrplaca**: Placa do Veiculo Transportador
- **nrtrquantidade**: Transporte - Quantidade
- **nrtrtpfrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **nrtrtransportador**: Codigo do Transportador (FK)
- **nrtrufveiculo**: UF do veiculo

---

## NSU

**20 campos documentados**

- **nsuchave**: Chave do Documento
- **nsucnpj**: Cnpj do Emitente
- **nsucodigo**: Codigo do NSU
- **nsudata**: Data e Hora do Lancamento
- **nsudocumento**: Numero do Documento
- **nsuemissao**: Data e Hora da Emissao
- **nsuemitente**: Nome do Emitente
- **nsuempresa**: Empresa (FK)
- **nsuevento**: Descricao do Evento
- **nsueventocod**: Codigo do Evento
- **nsumanifesto**: Manifesto 0-...
- **nsumanifestodt**: Manifesto - Data
- **nsumanifestost**: Manifesto - Status 1-Confirmada 2-Descartada
- **nsumanifestous**: Manifesto - Usuario
- **nsuoperacao**: Operacao 0-Entrada 1-Saida
- **nsuschema**: Identificacao do SCHEMA
- **nsuserie**: Serie do Documento
- **nsusituacao**: Situacao 1-Autorizado 2-Denegado
- **nsuvalor**: Valor do Documento
- **nsuxml**: XML com o Conteudo do NSU

---

## OCBC

**17 campos documentados**

- **ocbcbico**: Codigo do Bico (FK)
- **ocbcbomba**: Codigo do Bomba (FK)
- **ocbccienciadata**: Data e hora em que foi dada ciência da ocorrencia
- **ocbccienciausuario**: Usuário que deu ciência quanto a ocorrencia. Vazio ou nulo, significa que nao foi dado ciência ainda
- **ocbccodigo**: Codigo
- **ocbcdata**: Data e hora da Afericao
- **ocbcempresa**: Codigo da Empresa
- **ocbcencerranteautant**: Encerrante da Automacao Antes do Ajuste
- **ocbcencerranteautpos**: Encerrante da Automacao Apos o Ajuste
- **ocbcencerrantesisant**: Encerrante do Sistema Antes do Ajuste
- **ocbcencerrantesispos**: Encerrante do Sistema Apos o Ajuste
- **ocbcnotificawpp**: Status de notificacao mediante numeros TELWHATSCOMUNICAFALHABICO: 0-Não notificado 1-Notificado 2-Notificado Ciência do usuário com permissao PDV_CIENCFALHABICO 3-Notificado recuperação de comunicação
- **ocbcquebralaba**: Codigo PK da LABA onde foi identificada a Quebra de Encerrante
- **ocbcquebrarelacao**: Codigo PK da Tabela especificada na coluna OCBCQUEBRARESOLVIDA
- **ocbcquebraresolvida**: Quebra de Encerrante resolvida: 0-Não | 1-Emitido Cupom(VDA) | 2-Informado Intervenção Técnica(AJBC) 3-Informado Intercorrência(AJBC)
- **ocbctanque**: Codigo do Tanque (FK)
- **ocbctipoevento**: Tipo de evento: 1-Perda de comunicação 2-Retorno de Comunicação 3-Quebra de Encerrante

---

## OPTF

**6 campos documentados**

- **optfapenasnfe**: Apenas TEF gerando NFE | 0 - Não | 1 - Sim
- **optfchave**: Chave do parametro que habilita o tipo de transacao
- **optfcodigo**: Codigo PK tabela
- **optfdescricao**: Descrição do tipo de transacao
- **optfempresa**: Empresa (FK)
- **optftipo**: Tipo da transacao D - Debito | C - Credito

---

## ORPG

**3 campos documentados**

- **orpgcodigo**: Codigo Sequencia (PK)
- **orpgdescricao**: Descrição
- **orpgrepositorio**: Atualiza Repositorio 0-Não 1-Sim

---

## OSPH

**7 campos documentados**

- **osphanotacao**: Anotações
- **osphcodigo**: Codigo
- **osphinicio**: Data de Inicio
- **osphos**: Ordem de Serviço (fk)
- **osphtarefa**: Codigo da Tarefa 
- **osphtermino**: Data de termino
- **osphusuario**: Usuario

---

## OSPP

**18 campos documentados**

- **osppcliente**: Cliente Solicitante
- **osppcodigo**: Codigo
- **osppdatahora**: Data E Hora Inicio
- **osppdescricao**: Descricao da O.S.
- **osppdescricaorel**: Descricao do release
- **osppimagem**: Imagem da O.S.
- **osppinicio**: Data de Inicio
- **ospplinkrel**: Link do video para release
- **osppprioridade**: Prioridade da O.S.
- **osppresumo**: Resumo da O.S.
- **osppsituacao**: Situação da O.S.
- **osppsolicitante**: Nome do Solicitante
- **ospptecnico**: Tecnico da O.S. (Fk)
- **ospptermino**: Data E Hora Termino
- **ospptipo**: Tipo da O.S. (Fk)
- **ospptiporel**: Tipo 1 - Correcao 2 - Melhoria
- **ospptitulorel**: Titulo do release
- **osppversao**: Versão da O.S.

---

## OSPT

**8 campos documentados**

- **osptanotacao**: Anotação
- **osptcodigo**: Codigo
- **osptdata**: Data do Teste
- **osptdescricao**: Descrição do Teste
- **osptordem**: Ordem do Teste
- **osptos**: Ordem de Serviço (fk)
- **osptprocessado**: Processado(0-Não, 1-Sim, 2-Problema
- **osptusuario**: Usuario

---

## OSTH

**7 campos documentados**

- **osthanotacao**: Anotações
- **osthcodigo**: Código
- **osthinicio**: Data de Inicio
- **osthos**: Ordem de Serviço (FK)
- **osthtarefa**: Codigo da Tarefa 
- **osthtermino**: Data de termino
- **osthusuario**: Usuario

---

## OSTP

**14 campos documentados**

- **ostpcliente**: Cliente (FK)
- **ostpcodigo**: Código
- **ostpconclusao**: Data e Hora Conclusão do Serviço
- **ostpdatahora**: Data e Hora Inicio do Serviço
- **ostpdescricao**: Descricao da O.S.
- **ostpimagem**: Imagem da O.S.
- **ostpinicio**: Data de Inclusão do Serviço
- **ostpprioridade**: Prioridade da O.S.(0-Standby, 1-Normal, 2-Atenção e 3-Urgente)
- **ostpresumo**: Resumo da O.S.
- **ostpsituacao**: Situação da O.S.
- **ostpsolicitante**: Nome do Solicitante
- **ostptecnico**: Tecnico (FK)
- **ostptermino**: Data e Hora Termino do Serviço
- **ostptipo**: Tipo da O.S. (FK)

---

## PABP

**3 campos documentados**

- **pabpcodigo**: Codigo Sequencial
- **pabpdata**: Data de Emissao
- **pabptitulo**: Título do bordero

---

## PAFA2

**9 campos documentados**

- **pafa2cnpjcpf**: CNPJ/CPF do cliente relacionado caso Modelo seja 3 (Não tributável)
- **pafa2codigo**: Código da Tabela
- **pafa2data**: Data do movimento
- **pafa2documento**: Número do documento relacionado caso Modelo seja 3 (Não tributável)
- **pafa2empresa**: Código da Empresa
- **pafa2hash**: Hash de integridade
- **pafa2meiopagto**: Meio de pagamento registrado nos documentos emitidos
- **pafa2modelo**: Modelo do documento: 1-NFCe, 2-NFe e 3-Não tributável
- **pafa2valor**: Valor total dos documentos agrupados por Data, Meio e Modelo

---

## PAFDC

**14 campos documentados**

- **pafdcbico**: Código do Bico
- **pafdccodigo**: Código da Tabela
- **pafdccodigovda**: Codigo PK de Venda onde o VR foi emitido
- **pafdcdata**: Data do movimento
- **pafdcef**: Encerrante Final correspondente ao último abastecimento do dia do movimento
- **pafdcei**: Encerrante Inicial correspondente ao primeiro abastecimento do dia do movimento
- **pafdcempresa**: Código da Empresa
- **pafdchash**: Hash de integridade
- **pafdcterminal**: Terminal que iniciou e realizou operação de emissão do VR
- **pafdcveit**: Valor da Variação do Encerrante ocasionado por Intervenção Técnica ou Intercorrência
- **pafdcvr**: Volume Remanescente correspondente a quantidade diária não contemplada
- **pafdcvtadf**: Volume Total dos Abastecimentos emitidos por DFe do dia do movimento
- **pafdcvtafe**: Volume Total dos Abastecimentos Aferidos do dia do movimento
- **pafdcvtap**: Volume Total dos Abastecimentos Pendentes do dia do movimento

---

## PAGA

**26 campos documentados**

- **pagabalpat**: Valor Será Apresentado no Balanco Patrinonial (Flag) 0-Nao|1-Sim
- **pagacdesp**: Codigo do Centro de Despesas (FK)
- **pagacienteatraso**: Ciente de Atraso 0-Não | 1-Sim
- **pagacienteemissao**: Ciente de Emissão 0 - Não | 1 - Sim
- **pagacodigo**: Codigo Sequencial
- **pagacodigopabp**: Codigo do Bordero de pagamento
- **pagacodigoparb**: Codigo da Ordem de Pagamento
- **pagacodigoserv**: Codigo da SERV (FK)
- **pagacodigotlen**: Codigo da TLEN (FK)
- **pagacompra**: Codigo da Compra (FK)
- **pagacpaantecipada**: Flag: 0-Compra Vinculada 1-Compra Antecipada
- **pagadesconto**: Descontos Agregados
- **pagadocumento**: Documento
- **pagadreconta**: Plano de Contas do DRE (FK)
- **pagaemissao**: Data de Emissao
- **pagaempresa**: Codigo da Empresa (FK)
- **pagafornecedor**: Codigo do Fornecedor (FK)
- **pagagdesp**: Codigo do Grupo de Despesas (FK)
- **pagajuro**: Juros Agregados
- **pagaobs**: Observacoes Gerais
- **pagaordemcod**: Codigo da Ordem de Pagamento SUPR (FK)
- **pagaorigem**: Flag de Origem 0-Pagamento|1-Ordem Pagamento
- **pagapkconciliacao**: (PK) Conciliação
- **pagavalor**: Valor da Conta
- **pagavencimento**: Data de Vencimento
- **pagavlrmarcado**: campo inutilizado

---

## PAGJ

**32 campos documentados**

- **pagjbalpat**: Valor Será Apresentado no Balanco Patrinonial (Flag) 0-Nao|1-Sim
- **pagjbxcaixa**: Codigo do Caixa (FK)
- **pagjbxccrr**: Codigo da Conta Corrente (FK)
- **pagjbxempresa**: Codigo da Empresa que Efetuou Baixa(FK)
- **pagjbxmapa**: Data do Mapa (FK)
- **pagjcdesp**: Codigo do Centro de Despesas (FK)
- **pagjcodigo**: Codigo Sequencial
- **pagjcodigopabp**: Codigo do Bordero de pagamento
- **pagjcodigoparb**: Codigo da Ordem de Pagamento
- **pagjcodigoserv**: Codigo da SERV (FK)
- **pagjcompra**: Codigo da Compra (FK)
- **pagjcpaantecipada**: Flag: 0-Compra Vinculada 1-Compra Antecipada
- **pagjdesconto**: Descontos Agregados
- **pagjdocumento**: Documento
- **pagjdreconta**: Plano de Contas do DRE (FK)
- **pagjemissao**: Data de Emissao
- **pagjempresa**: Codigo da Empresa (FK)
- **pagjfkchq**: (FK)Tabela de Cheque (CHQT)
- **pagjfornecedor**: Codigo do Fornecedor (FK)
- **pagjgdesp**: Codigo do Grupo de Despesas (FK)
- **pagjjuro**: Juros Agregados
- **pagjnaoprg**: Lancamento direto em contas pagas 0-Nao|1-Sim
- **pagjobs**: Observacoes Gerais
- **pagjordemcod**: Codigo da Ordem de Pagamento SUPR (FK)
- **pagjorigem**: Flag de Origem 0-Pagamento|1-Ordem Pagamento
- **pagjpagamento**: Data do Pagamento
- **pagjpago**: Valor Pago
- **pagjpkconciliacao**: (PK) Conciliação
- **pagjvalor**: Valor da Conta
- **pagjvencimento**: Data de Vencimento
- **pagjvlrmarcado**: Valor Marcado na Tela de Consulta
- **pagjvlrmarcadogeral**: Valor Marcado na Tela de Consulta Geral

---

## PAKI

**5 campos documentados**

- **pakichaveaut**: Chave Autenticação
- **pakicodigo**: Codigo Sequencial
- **pakiempresa**: Codigo Empresa
- **pakistatus**: Status Cupom 0-Cancelado, 1-Confirmado
- **pakivenda**: Codigo VDA

---

## PARB

**9 campos documentados**

- **parbagencia**: Agência
- **parbbanco**: Código do Banco
- **parbcodigo**: Codigo Sequencial
- **parbcontacorrente**: Codigo da Conta Corrente
- **parbdescricao**: Descrição / Identificação da conta bancária
- **parbparticipante**: Participante PART (FK)
- **parbpixnumero**: Codigo PIX
- **parbpixtipo**: Tipo de Conta PIX: 1 - Email  2 - Telefone  3 - CNPJ/CPF  4 - Aleatório
- **parbtipoconta**: Tipo de Conta: 1 - Dinheiro  2 - Conta Corrente  3 - Poupança  4 - PIX

---

## PARC

**18 campos documentados**

- **parcbairro**: Bairro
- **parccadpro**: CadPro do Participante
- **parccep**: CEP
- **parccidade**: Codigo do municipio
- **parccnpjcpf**: CNPJCPF
- **parccodigo**: Codigo PK tabela
- **parccomplemento**: Complemento
- **parcdocfprint**: Doc F Print
- **parcemail**: E-mail
- **parcfantasia**: Noem Fantasia
- **parcfoneddd**: Fone DDD
- **parcfonepre**: Fone PREFIXO
- **parcfonesuf**: Fone Sufixo
- **parcfonewhats**: Numero do Telefone de Whatsapp
- **parcierg**: Inscricao Estadual ou Rg
- **parclogradouro**: Logradouro
- **parcnro**: Nro
- **parcrazao**: Razao social

---

## PARD

**17 campos documentados**

- **pardcnh**: Número da CNH
- **pardcodigo**: Código
- **pardcpfcnpj**: CPF/CNPJ
- **parddatanasc**: Data de Nascimento
- **pardemail**: e.Mail para envio de Token
- **pardfonew**: Numero Telefone WhattsApp para envio de Token
- **pardfoto**: Foto para Midia de Comparacao
- **pardgeratoken**: Liberado pra Gerar Token 0-Nao 1-Sim
- **pardgrau**: (FK) Grau de Relação
- **pardlimite**: Limite de credito
- **pardlimiteadic**: Limite de Credito Adicional a Prazo
- **pardlimitechq**: Limite de Credito em Cheque
- **pardlimitechqadic**: Limite de Credito Adicional em Cheque
- **pardnome**: Nome
- **pardparticipante**: (FK) Codigo Participante
- **pardsenha**: Senha de Liberação
- **pardvalidadecnh**: Validade da CNH

---

## PARF

**4 campos documentados**

- **parfcampo**: Campo
- **parfcodigo**: Codigo Sequencia (PK)
- **parfconteudo**: Conteúdo
- **parfparticipante**: Codigo do Participante (FK)

---

## PARG

**5 campos documentados**

- **pargcodigo**: Codigo Sequencial
- **pargempresa**: Codigo da Empresa (FK)
- **pargparticipante**: Codigo do Participante (FK)
- **pargregra**: Codigo da Regra de Preco (FK)
- **pargsequencia**: Sequencia de Pesquisa

---

## PARL

**4 campos documentados**

- **parlcodigo**: Codigo Sequencial
- **parldata**: Data da Baixa
- **parllicenca**: Licenca
- **parlparticipante**: Codigo Participante (FK)

---

## PARM

**9 campos documentados**

- **parmcodigo**: Codigo Sequencia (PK)
- **parminicio**: Inicio do Servico
- **parmparticipante**: Codigo do Participante (FK)
- **parmproduto**: Produto (FK)
- **parmreajuste**: Reajuste do valor
- **parmrepositorio**: Atualiza Repositorio 0-Não| 1-Sim
- **parmtermino**: Termino do Servico
- **parmticket**: Valor do Ticket
- **parmvalor**: Valor

---

## PARS

**20 campos documentados**

- **parsativo**: Data do Cadastro
- **parsbairro**: Bairro do Endereco
- **parscadpro**: Inscricao no CadPro
- **parscep**: Cep do Endereco
- **parscidade**: Codigo da Cidade (FK)
- **parscodigo**: Codigo
- **parscomplemento**: Complemento do Endereco
- **parsdescricao**: Descricao do Endereco
- **parsenderecocob**: Codigo do Endereço de Cobrança
- **parsfaturasetor**: Faturar por Setor (S/N)
- **parsinativo**: Data do Inativo
- **parslimite**: Limite de Credito a Prazo
- **parslimiteadic**: Limite de Credito Adicional a Prazo
- **parslogradouro**: Logradouro
- **parsnro**: Nro Endereco
- **parsparticipante**: Participante (FK)
- **parspdvsaldolimite**: Saldo de Contas a Receber por Endereço
- **parspermitevenda**: Permite vender para o endereço 0-Não | 1-Sim
- **parsrepositorio**: Flag Repositorio
- **parssetor**: Descricao do Setor

---

## PART

**100 campos documentados**

- **part_cli**: Tipo Cliente (S/N)
- **part_con**: Tipo Consumidor (S/N)
- **part_for**: Tipo Fornecedor (S/N)
- **part_fun**: Tipo Funcionario (S/N)
- **part_rep**: Tipo Representante (S/N)
- **part_tra**: Tipo Transportadora (S/N)
- **partadmcartafrete**: Administradora de Carta Frete (0 - Não | 1 - Sim)
- **partanivers**: Data de Aniversario
- **partativo**: Data do Cadastro
- **partbairro**: Bairro do Endereco
- **partcadpro**: CadPro do Endereco
- **partcep**: Cep do Endereco
- **partcidade**: Codigo da Cidade (FK)
- **partcnpjcpf**: Cnpj/Cpf
- **partcodigo**: Codigo
- **partcomplemento**: Complemento do Endereco
- **partconjuge**: Nome do Conjuge
- **partcredchqhdqtd**: Controle Credito - Historico Cheques Devolvidos Qtd
- **partcredchqhdvlr**: Controle Credito - Historico Cheques Devolvidos Vlr
- **partcredchqhpqtd**: Controle Credito - Historico Cheques Pendentes  Qtd
- **partcredchqhpvlr**: Controle Credito - Historico Cheques Pendentes  Vlr
- **partcredchqhqqtd**: Controle Credito - Historico Cheques Quitados   Qtd
- **partcredchqhqvlr**: Controle Credito - Historico Cheques Quitados   Vlr
- **partcredchqlimuso**: Controle Credito - Limite Cheque  em Uso
- **partcredexpiradat**: Controle Credito - Data da Expiracao do Cadastro
- **partcredprgcsaldo**: Controle Credito - Saldo de Venda Programada
- **partcredprzatrdat**: Controle Credito - Venc  Contas a Prazo em Atraso
- **partcredprzatrqtd**: Controle Credito - Quant Contas a Prazo em Atraso
- **partcredprzatrvlr**: Controle Credito - Valor Contas a Prazo em Atraso
- **partcredprzlimuso**: Controle Credito - Limite a Prazo em Uso
- **partdepara**: Codigo Depara XML SPED
- **partemail**: e.Mail
- **partemailfin**: e.Mail Financeiro
- **partemailnfe**: e.Mail NFe
- **partemailsped**: e.Mail Sped
- **partendereco**: Descricao do Endereco
- **partenderecopri**: Flag Endereco Principal (FK)
- **partfantasia**: Nome Fantasia
- **partfiliacaomae**: Nome da Mae
- **partfiliacaopai**: Nome do Pai
- **partfone**: Numero do Telefone Principal
- **partfonecontato**: Fone Sufixo
- **partfoneddd**: Fone DDD
- **partfonelista**: Lista de Telefones Secundarios
- **partfonepre**: Fone Prefixo
- **partfonerel1**: Fone Relacao
- **partfonerel2**: Fone Relacao
- **partfonerel3**: Fone Relacao
- **partfonesuf**: Fone Sufixo
- **partfonewhats**: Numero do Telefone de Whatsapp
- **partierg**: Ie/Rg
- **partim**: Insc.Municipal
- **partinativo**: Data do Inativo
- **partlimite**: Limite de Credito a Prazo
- **partlimiteadic**: Limite de Credito Adicional a Prazo
- **partlimitechq**: Limite de Credito em Cheque
- **partlimitechqadic**: Limite de Credito Adicional em Cheque
- **partlocaltrabalho**: Local de trabalho
- **partlogradouro**: Logradouro
- **partnro**: Nro Endereco
- **partobsfin**: OBS Financeiro
- **partobsger**: OBS Gerais
- **partobsnfe**: OBS Nfe
- **partobssped**: Observação do Sped
- **partobsvda**: OBS Vendas
- **partrazao**: Razao Social
- **partrefbancarias**: Referencias Bancarias
- **partrefcomerciais**: Referencias Comerciais
- **partrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **partreprbairro**: Bairro do Representante
- **partreprcep**: CEP do Representante
- **partreprcidade**: (FK) Codigo da Cidade do Representante
- **partreprcomplemento**: Complemento do Representante
- **partreprcpf**: CPF do Representante
- **partreprlogradouro**: Logradouro do Representante
- **partreprnome**: Nome do Representante
- **partreprnro**: Numero do Logradouro do Representante
- **partreprrg**: RG do Representante
- **partsgaarlg**: Login do AR
- **partsgaarpw**: Senha do AR
- **partsgabandeira**: Codigo da Bandeira (FK)
- **partsgacontagd**: (Fk) Conta Google Drive
- **partsgacontrato**: 0-Não   1-Sim
- **partsgadiacob**: 0 A 28
- **partsgafuson**: Fuso Horario Normal
- **partsgafusov**: Fuso Horario Verao
- **partsgalicenca**: 0Normal 1Teste 2Instalacao 3Liberacao 4AvisoBloq 5BloqParcial 6BloqTotal 7ModoCons
- **partsgamatriz**: Codigo da Matriz
- **partsgaorigemprg**: Codigo da Origem do Programa (FK)
- **partsgaperfil**: 0-SGA PETRO 1-GESTOR 2-EASY
- **partsgarede**: Codigo da Rede (FK)
- **partsgaregime**: Identifica Tipo de Regime Tributário da Empresa. 0-Normal Real | 1-Normal Presumido | 2-Simples Real | 3-Simples Presumido
- **partsgarepacesso**: Repositorio - Ultimo Acesso
- **partsgarepdoccon**: Repositorio - Documentos Contingencia
- **partsgarepdocrej**: Repositorio - Documentos Rejeitados
- **partsgarepres**: Codigo do Representante (FK)
- **partsgarepversao**: Repositorio - Versão
- **partusuariodata**: Data que  o Usuario que realizou o Cadastro
- **partusuarioinc**: Usuario que realizou o Cadastro
- **partwebpage**: Web Page

---

## PARTH

**4 campos documentados**

- **parthcodclie**: Codigo do Cliente (FK)
- **parthcodigo**: Codigo
- **parthdata**: Data do Cadastro
- **parthhisto**: Historico

---

## PARV

**13 campos documentados**

- **parvcodigo**: Código
- **parvfrota**: Frota
- **parvidcode**: Código Identificador (TAG)
- **parvinativo**: Data do Inativo
- **parvlimite**: Limite de credito
- **parvlimiteadic**: Limite de Credito Adicional a Prazo
- **parvlimitechq**: Limite de Credito em Cheque
- **parvlimitechqadic**: Limite de Credito Adicional em Cheque
- **parvparticipante**: (FK) Codigo Participante
- **parvpdvsaldochqp**: Saldo de Cheques pre-Datado por placa
- **parvpdvsaldorece**: Saldo de Contas a Receber por placa
- **parvplaca**: Placa do Veiculo
- **parvsetor**: Código do endereço vinculado ao carro

---

## PCC

**9 campos documentados**

- **pcccnpj**: CNPJ
- **pcccodigo**: Codigo
- **pccdata**: Data
- **pccdescricao**: Descrição
- **pccest**: (E)Entrada|(S)Saída|(T)Totalizador
- **pccnatureza**: Natureza
- **pccnivel**: Nivel
- **pccrfb**: RFB
- **pcctipo**: Tipo

---

## PCTE

**3 campos documentados**

- **pctecodigo**: Codigo Sequencia
- **pcteempresa**: Codigo da Empresa
- **pctesorteio**: Codigo do Sorteio (FK)

---

## PCTG

**9 campos documentados**

- **pctgacumulado**: Acumulado
- **pctgcodigo**: Codigo Sequencia
- **pctgcombustivel**: Combustivel(FK)
- **pctgcomptodoscomb**: Computador todos os combustiveis 0-Nao | 1-Sim
- **pctgformacont**: Forma do Contador para o Sorteio 0-Litros | 1-Abastecidas
- **pctgpontos**: Pontos
- **pctgqtd**: Quantidade
- **pctgultimoab**: Ultimo abastecimento(FK)
- **pctgultimodt**: Ultima Data

---

## PCTR

**12 campos documentados**

- **pctrcnpjcpf**: Cnpj/Cpf/Placa do Consumidor
- **pctrcodigo**: Codigo Sequencia
- **pctrcorrecao**: Flag de monitoramento de Alteracao
- **pctrcredito**: Pontos de Credito
- **pctrdatahora**: Data e Hora da Pontuacao
- **pctrdebito**: Pontos de Debito
- **pctrempresa**: Código Empresa (FK)
- **pctrfrentista**: Frentista Responsavel (FK)
- **pctrhistorico**: Historico da Operacao
- **pctrorigem**: Flag de Origem 1-Venda 2-Cancelamento 3-Resgate 4-Avulso
- **pctrsaldo**: Saldo da Operacao
- **pctrusuario**: usuario responsavel pela Operacao

---

## PEDE

**22 campos documentados**

- **pedecodigo**: Codigo Sequencia
- **pededata**: Data e Hora 
- **pededataanalise**: Data da Realização da Análise da Requisição. Isto Libera o Pedido para ser Feito (Pedido).
- **pededataemail**: Data do Envio de Email
- **pededatapedido**: Data da Efetivação do Pedido. Isto Libera o Pedido para Aguardar Recebimento
- **pededatarecebimento**: Data do Recebimento do Pedido. Isto Conclui o Ciclo do Pedido
- **pededatarequisicao**: Data da Requisição do Pedido de Compra. Isto Libera o Pedido para ser Análisado
- **pededatavencimento**: Data de Vencimento Parametrizado para Usar
- **pedeempresa**: Codigo da Empresa (FK)
- **pedeentrega**: Entrega
- **pedefornecedor**: Fornecedor (FK)
- **pedefrete**: Frete
- **pedemotivorecusar**: Descrição do Motivo de Recusa. A Recusa faz com que o Pedido em Análise volte para Status de Requisição
- **pedeobservacao**: Observação
- **pedeparcela**: Qtd de parcelas do valor total do pedido
- **pedepgto**: Forma de Pagamento
- **pedeusuarioanalise**: Usuário que Efetuou a Análise
- **pedeusuarioemail**: Usuário que Envio a Email
- **pedeusuariopedido**: Usuário que Efetuou o Pedido
- **pedeusuariorecebimento**: Usuário que Efetuou o Recebimento da Compra
- **pedeusuariorequisicao**: Usuário que Efetuou a Requisição
- **pedevendedor**: Vendedor

---

## PEDI

**10 campos documentados**

- **pedicalccusto**: 0- Nao Calcula, 1-Ultimo Custo, 2-Custo Medio
- **pedicodigo**: Codigo Sequencia
- **pedicodigopede**: Pedido de Compra(FK)
- **pedicustotot**: Custo Total
- **pediempresa**: Codigo da Empresa (FK)
- **pediobservacao**: Observação
- **pediproduto**: Produto(FK)
- **pediqtd**: Quantidade
- **peditotal**: Total
- **pediunitario**: Título

---

## PEDTEDE

**6 campos documentados**

- **ptdcodigo**: Codigo Sequencial
- **ptddataok**: Data de Conclusão do Pedido
- **ptddataped**: Data da Crição do Pedido
- **ptdempresa**: Codigo da Empresa
- **ptdusuariook**: Usuário que concluiu o Pedido
- **ptdusuarioped**: Usuário que criou o Pedido

---

## PEDTEDI

**7 campos documentados**

- **ptdicodigo**: Codigo Sequencial
- **ptdicodigoptd**: Codigo Do Pedido(FK)
- **ptdiempresa**: Codigo da Empresa
- **ptdilocaldestino**: Local Destino Transferência
- **ptdilocalorigem**: Local Origem Transferência
- **ptdiproduto**: Código do produto
- **ptdiqtd**: Qtd transferida

---

## PIXBOL

**15 campos documentados**

- **pixbolaccesskey**: Access Key
- **pixbolaccesstoken**: Access Token
- **pixbolclientid**: Client Id
- **pixbolcodigo**: Codigo Sequencial
- **pixboldatatoken**: Data da última atualização Token
- **pixboldescricao**: Descrição da Configuração
- **pixbolempresa**: Codigo da Empresa (Fk)
- **pixbolinstrucaobol1**: Instrução Boleto 1
- **pixbolinstrucaobol2**: Instrução Boleto 2
- **pixbolinstrucaobol3**: Instrução Boleto 3
- **pixbollimitepgtodias**: Limite de dias para pgto após o vencimento
- **pixbolperfil**: Perfil de Configuração
- **pixbolpixdictkey**: Pix Dict Key é a chave pix que ajuda a distringuir o PSP quando houver mais de 1 vinculado
- **pixbolrefreshtoken**: Refresh Token
- **pixbolsecretkey**: Secret Key

---

## PLCF

**4 campos documentados**

- **plcfcfop**: (FK) Codigo CFOP
- **plcfcodigo**: Codigo
- **plcfpcc**: Plano de Conta EFD
- **plcfstpc**: (FK) Codigo STPC

---

## PLNR

**2 campos documentados**

- **plnrnatrec**: (FK) Codigo NATR
- **plnrpcc**: Plano de conta EFD

---

## PLPC

**2 campos documentados**

- **plpcpcc**: Plano de Conta EFD
- **plpcstpc**: (FK) Codigo STPC

---

## PLST

**19 campos documentados**

- **plst_ap_apg**: Valor a Pagar
- **plst_ap_res**: Valor a Restituir
- **plst_cp_bcu**: Base de Calculo Unitario sobre a compra
- **plst_cp_qtd**: Quantidade de itens comprados
- **plst_cp_tot**: Valor de ICMS ST sobre a compra
- **plst_ef_per**: Percas no Estoque
- **plst_ef_qtd**: Estoque Final
- **plst_ef_sos**: Sobras no Estoque
- **plst_ef_vst**: Valor de ICMS ST sobre o Estoque Final
- **plst_ei_qtd**: Estoque Inicial
- **plst_ei_vst**: Valor de ICMS ST sobre o Estoque Inicial
- **plst_vd_alq**: Aliquota de ICMS ST utilizada
- **plst_vd_icd**: Valor Total de ICMS ST das vendas com base no calculo de compras
- **plst_vd_idv**: Valor Total de ICMS ST Efetivo das vendas
- **plst_vd_qtd**: Quantidade de itens vendidos
- **plst_vd_tot**: Valor total em vendas
- **plstcodigo**: Codigo
- **plstdata**: Data
- **plstproduto**: Produto (FK)

---

## PMCO

**3 campos documentados**

- **pmcocatraca**: Codigo Comanda Catraca
- **pmcocodigo**: Codigo Comanda Interna
- **pmcoempresa**: Codigo da Empresa (Fk)

---

## PMIT

**26 campos documentados**

- **pmitacrescimocad**: Valor Total de Acrescimos(+) ou Descontos(-) por Cadastro Fixo
- **pmitacrescimoite**: Valor Total de Acrescimos(+) ou Descontos(-) por Item Manual
- **pmitacrescimotab**: Valor Total de Acrescimos(+) ou Descontos(-) por Tabela de Preco
- **pmitapicecoditem**: Codigo do item no sistema APICE
- **pmitautomacao**: Codigo da Automacao (FK)
- **pmitbase**: Valor unitario Base da mercadoria
- **pmitbico**: Codigo do Bico (FK)
- **pmitcodigo**: Codigo Sequencial do Item
- **pmitcomanda**: Codigo da Comanda (FK)
- **pmitcombo**: Codigo do Combo
- **pmitcomissao**: Valor Total da Comissao
- **pmitdatapedido**: Data e Hora do Pedido
- **pmitempresa**: Codigo da Empresa (FK)
- **pmitestoq**: Codigo do Estoq (FK)
- **pmithash**: Hash para controle de agregar ou nao os produtos
- **pmitimprimir**: Identificação para imprimir o item ou não 0 - Não imprimir | 1 - imprimir
- **pmitimprimirproducao**: Status Impressão Produção (0-Não Imprimir, 1-Aguardando Impressão, 2-Impresso, 9-Erro)
- **pmititem**: Numero do Item com origem do PRIT
- **pmitobservacao**: Observação do item da comanda
- **pmitproduto**: Codigo do Produto (FK)
- **pmitqtd**: Quantidade
- **pmitsubtotal**: Valor SubTotal do Item (qtd x base)
- **pmittabelafixa**: Tabela de Preço Fixa de (1 a 12) ou 99-Digitado Manual
- **pmittotal**: Valor Total do Item (qtd x unitario) = (subtotal+-acrescimos)
- **pmitunitario**: Valor unitario de venda da mercadoria
- **pmitvendedor**: Codigo do Vendedor (FK)

---

## PMVD

**36 campos documentados**

- **pmvdapicecodcomanda**: Codigo da comanda do sistema APICE
- **pmvdbairro**: Bairro do Cliente
- **pmvdcaixa**: Numero do Caixa da Comanda
- **pmvdcartao**: Numero do Cartao de Identificacao da Comanda
- **pmvdcep**: CEP do Cliente
- **pmvdcidade**: Codigo da Cidade do Cliente (FK)
- **pmvdcnpjcpf**: Cnpj/Cpf do Cliente
- **pmvdcodcliente**: Codigo do Cliente (FK)
- **pmvdcodendereco**: Codigo do Endereco (FK)
- **pmvdcodfdcc**: Código do Consumidor FK fdcc
- **pmvdcodigo**: Codigo Sequencial da Comanda
- **pmvdcomplemento**: Complemento do Endereco do Cliente
- **pmvddata**: Data e Hora da Comanda
- **pmvdemail**: e.Mail do Cliente
- **pmvdempresa**: Codigo da Empresa (FK)
- **pmvdendnro**: Numero Residencial do Cliente
- **pmvdfoneddd**: Fone DDD do Cliente
- **pmvdfonepre**: Fone PREFIXO do Cliente
- **pmvdfonesuf**: Fone SUFIXO do Cliente
- **pmvdfonewhats**: Fone Whatsapp do Cliente
- **pmvdierg**: Inscrição Estadual/RG do Cliente
- **pmvdkm**: KM do Veiculo
- **pmvdlogradouro**: Logradouro do Cliente
- **pmvdnome**: Nome do Cliente
- **pmvdnumeromesa**: Numero da Mesa
- **pmvdobs**: Observacoes
- **pmvdpedefecha**: 0 - Liberado para Venda | 1 - Pedido Fechamento
- **pmvdperfil**: Codigo do Perfil FK fdpf
- **pmvdplaca**: Placa do Veiculo
- **pmvdpromoter**: Codigo do Promoter FK part
- **pmvdselecionado**: Coluna utilizada para saber as comandas que serão agrupadas
- **pmvdtabelafixa**: Tabela Fixa
- **pmvdterminal**: Terminal de Identificacao da Comanda
- **pmvdterminalselecionado**: Terminal de Identificacao da Comanda selecionada
- **pmvdtipo**: Flag 1-Geral 2-Cliente 3-Cartao 4-InforLub
- **pmvdveiculo**: Descricao do Veiculo

---

## PORT

**2 campos documentados**

- **portcodigo**: Codigo Sequencial
- **portdescricao**: Descricao

---

## PPIPI

**7 campos documentados**

- **ppipiativo**: PROMOÇÃO 1-ATIVO | 0-INATIVO
- **ppipicodigo**: Codigo Sequencial
- **ppipiempresa**: Codigo Empresa
- **ppipikmv**: Qtd KM Para Ativar Promoção
- **ppipiproduto**: Código Produto
- **ppipiqtd**: Quantidade Mínima Item
- **ppipivalor**: Novo Preço

---

## PRCB

**8 campos documentados**

- **prcbcodigo**: Codigo Sequencial da venda do combo
- **prcbcombo**: Código do cadastro de combo
- **prcbempresa**: Codigo da Empresa(FK)
- **prcbqtd**: Quantidade vendida do combo
- **prcbterminal**: Terminal de Identificacao da venda do combo
- **prcbtotal**: Valor total do combo
- **prcbunit**: Preço do combo
- **prcbvendedor**: Vendedor do combo

---

## PRGC

**29 campos documentados**

- **prgcajuste**: Valor de Ajuste sobre Valor Total Retirado
- **prgccaixa**: Numero do Caixa (FK)
- **prgccartafrete**: Valor pago em carta frete
- **prgccartao**: Valor pago em cartão
- **prgcccrr**: Conta Corrente Destino(FK)
- **prgccheque**: Valor pago em cheque
- **prgccliente**: Codigo do Cliente (FK)
- **prgccodigo**: Código Sequencial da Carteira
- **prgccodigoorigem**: Código de origem de acordo com o tipo
- **prgcdata**: Data e Hora da Carteira
- **prgcdinheiro**: Valor pago em dinheiro
- **prgcempresa**: Código da Empresa
- **prgcendereco**: Codigo do Endereco (FK)
- **prgcfinalizado**: Data da Finalização da Carteira
- **prgcfrentista**: Codigo do Frentista Responsavel (FK)
- **prgcglobal**: Indicador para definir se todos endereços do cliente pode ser utilizado. 0-Normal / 1-Global
- **prgcliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Corrigir 10-OK 99-Erro
- **prgcmapa**: Data do Mapa (FK)
- **prgcnrachavesimpfat**: Chave de Acesso da Nota Fiscal de Simples Faturamento
- **prgcnraemisimpfat**: Data de Emissao da Nota de Simples Faturamento
- **prgcnrasimpfat**: Codigo da Nota Fiscal de Simples Faturamento (Remessa Futura)
- **prgcobs**: Observações Gerais
- **prgcorigemtipo**: 0-Vale Avulso, 1-Troco Venda, 2-Troco Recebimento Fatura, 3-Troco Geral, 4-Troco Venda
- **prgcproduto**: Codigo do Produto (FK), se Tipo=P
- **prgcqtd**: Quantidade de Produto, se Tipo=P
- **prgctipo**: Flag do Tipo da Carteira (P)roduto (V)alor
- **prgctroco**: Valor pago em troco
- **prgcunit**: Valor Unitario do Produto, se Tipo=P
- **prgcvalor**: Valor Total da Carteira

---

## PRGD

**14 campos documentados**

- **prgdcaixa**: Numero do Caixa (FK)
- **prgdcarteira**: Codigo Relacional da Carteira (FK)
- **prgdcarteiraemp**: Codigo Relacional da Empresa da Carteira (FK)
- **prgdccrr**: Conta Corrente Destino(FK)
- **prgdcodigo**: Código Sequencial da Retirada da Carteira
- **prgddata**: Data e Hora da Retirada
- **prgdempresa**: Código da Empresa de Retirada
- **prgdfrentista**: Codigo do Frentista Responsavel (FK)
- **prgdliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Corrigir 10-OK 99-Erro
- **prgdmapa**: Data do Mapa (FK)
- **prgdobs**: Observações Gerais
- **prgdqtd**: Quantidade de Produto, se Tipo=P
- **prgdunit**: Valor Unitario do Produto, se Tipo=P
- **prgdvalor**: Valor Total da Retirada

---

## PRGE

**5 campos documentados**

- **prgecodigo**: Código Sequencial Empresa Permitida da Carteira
- **prgecodigoprgc**: Código da Carteira Programada (FK)
- **prgeempresa**: Código da Empresa Permitida (FK)
- **prgeempresaprgc**: Código da Empresa da Carteira Programada (FK)
- **prgeliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Corrigir 10-OK 99-Erro

---

## PRIT

**83 campos documentados**

- **pritacrescimocad**: Valor Total de Acrescimos(+) ou Descontos(-) por Cadastro Fixo
- **pritacrescimoite**: Valor Total de Acrescimos(+) ou Descontos(-) por Item Manual
- **pritacrescimostec**: Valor de Desconto da Promoção Scanntech
- **pritacrescimotab**: Valor Total de Acrescimos(+) ou Descontos(-) por Tabela de Preco
- **pritacrescimotot**: Valor Total de Acrescimos(+) ou Descontos(-) por Total Manual
- **pritaliqadrem**: Aliquota AdRem do combustível monofásico
- **pritaliqcofins**: Aliquota de Cofins
- **pritaliqicms**: Aliquota de Icms
- **pritaliqipi**: Aliquota de Ipi
- **pritaliqirrf**: Aliquota IRRF
- **pritaliqpis**: Aliquota de Pis
- **pritaliqst**: Aliquota de ST
- **pritapicecoditem**: Codigo do item no sistema APICE
- **pritautomacao**: Codigo da Automacao (FK)
- **pritbase**: Valor unitario Base da mercadoria
- **pritbaseicms**: Base de Icms
- **pritbaseipi**: Base de Ipi
- **pritbasepc**: Base de Pis Cofins
- **pritbasest**: Base de ST
- **pritbico**: Codigo do Bico (FK)
- **pritbomba**: Codigo da Bomba (FK)
- **pritcfop**: Codigo CFOP (FK)
- **pritcodbarrasdig**: Código de Barras digitado
- **pritcodigoprcb**: Código do combo PRCB
- **pritcodigoprvd**: Codigo da PRVD (FK)
- **pritcomandaorigem**: Comanda Origem do item pendente
- **pritcombo**: Código do combo PROD
- **pritcomissao**: Valor Total da Comissao
- **pritcusto**: CMV - custo unitario da mercadoria vendida 
- **pritdatapedido**: Data e Hora Inclusão Item
- **pritdescontostec**: Valor de Desconto da Promoção Scanntech
- **pritdescricao**: Descricao do Produto
- **pritempresa**: Código da Empresa(FK)
- **pritenceraut**: Encerrante da Automacao
- **pritencerfixod**: Encerrante Documento Original
- **pritestoq**: Código do Estoq(FK)
- **pritimpostosaproxe**: Valor de Impostos Aproximados Estadual
- **pritimpostosaproxf**: Valor de Impostos Aproximados Federal
- **pritimpostosaproxm**: Valor de Impostos Aproximados Municipal
- **pritimprimirproducao**: Status Impressão Produção (0-Não Imprimir, 1-Aguardando Impressão, 2-Impresso, 9-Erro)
- **pritipirangaatividadecomponente**: IPIRANGA: Código Atividade Componente
- **pritipirangacodinterno**: IPIRANGA: Código Interno
- **pritipirangacodlivre**: IPIRANGA: Código Livre
- **pritipirangaproduto**: Código Ipiranga
- **prititem**: Sequencia do Item
- **pritnatrec**: Natureza de Receita (FK)
- **pritobservacao**: Observação do item pendente
- **pritpercbiocomb**: Percentual do Bio Combustivel
- **pritproduto**: Codigo do Produto (FK)
- **pritpromocod**: Código promocional PROD
- **pritpromodesconto**: Valor Total de Desconto Promocional
- **pritpromotem**: Flag 0-Nao Tem preco promocional por Qtd | 1-Tem preco promocional por Qtd
- **pritqtd**: Quantidade
- **pritserie**: Serie da Venda (FK)
- **pritsorteio**: Pontos por Sorteio
- **pritstatus**: Status 0-Normal 1-Cancelado
- **pritstatuspafr5**: ***DESCONTINUADO***
- **pritstecid**: Código da Promoção Scanntech Aplicado
- **pritstecpromostatus**: Status da Promoção Scanntech. (0-SEM PROMOCAO | 1-ACEITA | 2-REJEITADA)
- **pritstic**: Sitrib de Icms (FK)
- **pritstip**: Sitrib de Ipi (FK)
- **pritstpc**: Sitrib de Pis Cofins (FK)
- **pritsubtotal**: Valor SubTotal do Item (qtd x base)
- **prittabelafixa**: Tabela de Preço Fixa de (1 a 12) ou 99-Digitado Manual
- **prittanque**: Codigo do Tanque (FK)
- **prittotal**: Valor Total do Item (qtd x unitario) = (subtotal+-acrescimos)
- **prittotparcial**: Totalizador Parcial do ECF
- **pritund**: Und do Produto
- **pritunitario**: Valor unitario de venda da mercadoria
- **pritvdajet**: Código VDAJET (FK) Ipiranga JetOil
- **pritvdikmvcod**: Código VDA KMV (FK)
- **pritvendedor**: Codigo do Vendedor (FK)
- **pritvl4ucodigo**: Código VL4U (FK) Value4u app
- **pritvlrcofins**: Valor de Cofins
- **pritvlricms**: Valor de Icms
- **pritvlricmsmonoret**: Valor ICMS cobrado anteriormente combustivel monofasico
- **pritvlripi**: Valor de Ipi
- **pritvlrirrf**: Valor de IRRF
- **pritvlrpis**: Valor de Pis
- **pritvlrst**: Valor de ST
- **pritvlrtab9**: Valor unitario original em Vendas sem Tabela Fixa
- **pritvlrtotalstec**: Valor total do Item para a Promoção Scanntech
- **pritvlrunitariostec**: Valor Unitario para Scanntech

---

## PROD

**132 campos documentados**

- **prodaltpreco**: Data da Ultima Alteracao de Preco (Campo Exclusivo p/ Combustivel)
- **prodamecashback**: Percentual Cashback Ame
- **prodanp**: Anp (FK)
- **prodativo**: Data do Cadastro
- **prodautoproducao**: [#p06] Consome automaticamente a materia prima ao realizar a venda 0-Não | 1-Sim
- **prodbalanca**: Produto de Balanca 0-Nao 1-Sim
- **prodbalancocol**: Balanco - Produto com Carga no Coletor
- **prodbalancodat**: Balanco - Data Contagem
- **prodbalancodepqtd**: Balanco - Quantidade Contagem Deposito
- **prodbalanconrocont**: Balanco - Quantidade de vezes que o produto foi contado
- **prodbalancoqtd**: Balanco - Quantidade Contagem Disponivel
- **prodbarra**: Codigo de Barra
- **prodbenef**: Codigo Beneficio Fiscal
- **prodbloqnegativo**: Permite venda de produto estoque negativo 0-Não | 1-Sim
- **prodbloqueado**: Bloquear venda no cadastro de produto 0-Não/1-Sim
- **prodcalcbasest**: Cálculo de Base ST Médio Sobre as Compras
- **prodcalcvlrst**: Cálculo do Valor ST Médio Sobre as Compras
- **prodcest**: Codigo Cest
- **prodcfop**: Codigo CFOP DE SAIDA 
- **prodcfope**: Codigo CFOP DE ENTRADA
- **prodcodigo**: Codigo
- **prodcodigorapido**: Código Rapido do Produto
- **prodcombo**: Código do Produto Destino na Combo (FK)
- **prodcomissao**: Comissao (FK)
- **prodcontroladeposito**: [#p06] Controlar saldo em depósito 0-Não | 1-Sim
- **prodcor**: Codigo da Cor do Combustivel
- **prodcustcod**: Código da Última Cust Deste Produto
- **prodcusto**: Valor de Custo
- **proddataalteracao**: Data da última alteração da PROD
- **proddensidade**: Densidade
- **proddepara**: Codigo Depara XML SPED
- **proddeposito**: Estoque no depósito
- **proddescmaximo**: Desconto Maximo do Produto na venda
- **proddescricao**: Descricao Completa
- **proddrecmv**: Código da Conta de CMV (FK)
- **proddrevenda**: Código da Conta de venda (FK)
- **prodentradapadrao**: [#p06] Estoque padrão para compra 1-Disponível | 2-Deposito
- **prodestoque**: Estoque Atual
- **prodfavorito**: Produto Favorito
- **prodfcp**: Percentual de Fundo de Combate a Pobreza
- **prodfornecedor**: Código do principal fornecedor do respectivo produto
- **prodglp**: Percentual de GLP derivado do petroleo
- **prodgni**: Percentual de Gás Natural Importado
- **prodgnn**: Percentual de Gás Natural Nacional
- **prodgoaldom**: Proposito de Venda Deste Combustivel para Domingo
- **prodgoalqua**: Proposito de Venda Deste Combustivel para Quarta
- **prodgoalqui**: Proposito de Venda Deste Combustivel para Quinta
- **prodgoalsab**: Proposito de Venda Deste Combustivel para Sabado
- **prodgoalseg**: Proposito de Venda Deste Combustivel para Segunda
- **prodgoalsex**: Proposito de Venda Deste Combustivel para Sexta
- **prodgoalter**: Proposito de Venda Deste Combustivel para Terca
- **prodgrupo**: Grupo (FK)
- **prodicms**: Aliquota ICMS
- **prodicmsrep**: Aliquota ICMS Repasse
- **prodinativo**: Data do Inativo
- **prodinforlub**: Integração com InforLub 0-Não/1-Sim
- **prodiva**: Codigo da Tributação IVA (FK)
- **prodliberapdv**: Flag Status de Liberacao PDV 0-N 1-Inc 10-OK 99-Erro
- **prodliberaunitvda**: Permite liberar valor na venda
- **prodlocal**: Localizacao (FK)
- **prodmatprima**: [#p06] Produto é Matéria Prima 0-Não | 1-Sim
- **prodmaximo**: Venda Maxima
- **prodminimo**: Estoque Minimo
- **prodmkpmax**: Faixa de Markup Maximo
- **prodmkpmin**: Faixa de Markup Minimo
- **prodnatrec**: Codigo da Natureza de Receita (FK)
- **prodncm**: Ncm (FK)
- **prodncmexcecao**: Codigo Ncm Excecao
- **prodnroordemlmc**: Número da Última Ordem do LMC
- **prodobservacao**: Observacoes Gerais
- **prodpauta**: Valor de Pauta
- **prodpcce**: (FK) Codigo Plano de Conta Contabil EFD
- **prodpccs**: (FK) Codigo Plano de Conta Contabil EFD
- **prodpontos**: [#p04] Pontuacao
- **prodpromocod**: [#p04] Codigo pai que o produto verifica a promocao
- **prodpromoqtd**: Qtd em Promocao
- **prodpromovlr**: Vlr em Promocao
- **prodredicmsefet**: Percentual de reducao da base de calculo efetiva
- **prodremoteid**: Id unico no Sga_Cloud
- **prodreposicao**: Quantidade de Reposição do Estoque
- **prodrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **prodresumo**: Descricao Resumida
- **prodsecao**: Secao (FK)
- **prodsigla**: Sigla do Combustivel
- **prodstcs**: ST CS
- **prodstic**: ST ICMS DE SAIDA
- **prodstice**: ST ICMS DE ENTRADA
- **prodsticorigement**: [#p08] ORIGEM ST ICMS DE ENTRADA
- **prodsticorigemsai**: [#p09] ORIGEM ST ICMS DE SAIDA
- **prodstip**: ST IPI DE SAIDA
- **prodstipe**: ST IPI DE ENTRADA
- **prodstpc**: ST Pis Cofins de Saida
- **prodstpce**: ST Pis Cofins de Entrada
- **prodsync**: Mosta o Status da sincronizacao com o Sga_Cloud
- **prodt10**: Tipo Indice Venda 10 %-,%+,$-,$+,VF
- **prodt11**: Tipo Indice Venda 11 %-,%+,$-,$+,VF
- **prodt12**: Tipo Indice Venda 12 %-,%+,$-,$+,VF
- **prodt2**: Tipo Indice Venda 2  %-,%+,$-,$+,VF
- **prodt3**: Tipo Indice Venda 3  %-,%+,$-,$+,VF
- **prodt4**: Tipo Indice Venda 4  %-,%+,$-,$+,VF
- **prodt5**: Tipo Indice Venda 5  %-,%+,$-,$+,VF
- **prodt6**: Tipo Indice Venda 6  %-,%+,$-,$+,VF
- **prodt7**: Tipo Indice Venda 7  %-,%+,$-,$+,VF
- **prodt8**: Tipo Indice Venda 8  %-,%+,$-,$+,VF
- **prodt9**: Tipo Indice Venda 9  %-,%+,$-,$+,VF
- **prodtipo**: Tipo (FK)
- **prodtiposervico**: Tipo de Serviço 0-Contratado 1-Prestado
- **prodtiposped**: Tipo do Produto para o SPED
- **produltalicms**: Ultima Aliquota icms de entrada
- **produltalipi**: Ultima Aliquota ipi de Entrada
- **produltsticms**: Ultima ST icms de entrada (FK)
- **produltstipi**: Ultima ST ipi de entrada (FK)
- **produltstpis**: Ultima ST pis de Entrada (FK)
- **prodund**: Unidade Medida
- **produnmed**: Und. Medida Produto(balanca)
- **prodv1**: Vlr Venda 1
- **prodv10**: Vlr Venda 10
- **prodv11**: Vlr Venda 11
- **prodv12**: Vlr Venda 12
- **prodv2**: Vlr Venda 2
- **prodv3**: Vlr Venda 3
- **prodv4**: Vlr Venda 4
- **prodv5**: Vlr Venda 5
- **prodv6**: Vlr Venda 6
- **prodv7**: Vlr Venda 7
- **prodv8**: Vlr Venda 8
- **prodv9**: Vlr Venda 9
- **prodvalida**: Validade Produto(Balanca)
- **prodvaliddat**: Data de Validade do Produto
- **prodvalidest**: Especificar Data de Validade do Produto no Estoque 0-Não | 1-Sim
- **prodvdafracao**: Permite a Venda de Itens com Valores Fracionados 0-Não | 1-Sim
- **prodwslmccodigo**: Código do Produto no WS LMC

---

## PRODMETA

**9 campos documentados**

- **prodmetacodigo**: Codigo (PK)
- **prodmetaempresa**: Codigo da Empresa (PK)
- **prodmetafim**: Mês/Ano de Fim da Meta
- **prodmetagrupo**: Codigo do Grupo (FK)
- **prodmetainicio**: Mês/Ano de Inicio da Meta
- **prodmetaproduto**: Codigo do Produto (FK)
- **prodmetaqtd**: Meta em Quantidade para o Produto
- **prodmetasecao**: Codigo da Seção (FK)
- **prodmetavalor**: Meta em Valor para o Produto

---

## PRODN

**4 campos documentados**

- **prodncodigo**: Codigo Sequencial
- **prodnprod**: Cadastro de Produtos PROD (FK)
- **prodnpron**: Cadastro PRON (FK)
- **prodnqtd**: Quantidade de Produto

---

## PROF

**4 campos documentados**

- **profcodigo**: Codigo
- **proffornecedor**: Fornecedor (FK)
- **proforigem**: Codigo de Origem
- **profproduto**: Produto (FK)

---

## PRON

**6 campos documentados**

- **proncodigo**: Codigo Sequencial
- **prondefault**: Flag 0-Desmarcado 1-Marcado por Padrão na hora da escolha
- **prondescricao**: Descrição do Item Opcional ou Adicional
- **pronliberacao**: Flag 0-Liberado 1-Bloqueado pra uso na PROP
- **pronprop**: Cadastro de Opcional/Adicional PROP (FK)
- **pronvalor**: Valor Cobrado pelo Opcional ou Adicional

---

## PROP

**4 campos documentados**

- **propcodigo**: Codigo Sequencial
- **propdescricao**: Descrição do Opcional ou Adicional
- **propliberacao**: Flag 0-Liberado Todos 1-Bloqueado Todos
- **proptipo**: Flag do Tipo (O)pcional (A)dicional

---

## PROPD

**3 campos documentados**

- **propdcodigo**: Codigo Sequencial
- **propdprod**: Cadastro de Produtos PROD (FK)
- **propdprop**: Cadastro de Opcional/Adicional PROP (FK)

---

## PROPE

**3 campos documentados**

- **propecodigo**: Codigo Sequencial
- **propeempresa**: Codigo da Empresa EMP (FK)
- **propeprop**: Cadastro de Opcional/Adicional PROP (FK)

---

## PROT

**7 campos documentados**

- **protcodigo**: Codigo
- **protorigem**: Produto Acabado(FK)
- **protperda**: Percentual de Quebra/Perda normal
- **protproduto**: Matéria prima utilizada para criar o produto Acabado(FK)
- **protquantidade**: Quantidade de matéria prima
- **prottoleranciaperda**: Tolerancia para Perda
- **prottoleranciasobra**: Tolerancia para Sobra

---

## PROU

**4 campos documentados**

- **proucodigo**: Codigo
- **prouproduto**: Produto (FK)
- **prouqtd**: Quantidade
- **prouund**: Und

---

## PRPAY

**13 campos documentados**

- **prpayautorizacao**: Numero de Autorizacao da transacao
- **prpaybaixado**: Local pre pagamento foi baixado: 0 - SGAPAY | 1 - PDV
- **prpaybandeira**: Bandeira
- **prpaycodigo**: Código PK tabela
- **prpaydataprepagamento**: Data em que o pagamento foi realizado
- **prpayempresa**: Código da Empresa
- **prpaynsu**: NSU
- **prpayoperadora**: Operadora
- **prpayparcelas**: Parcelas
- **prpayterminal**: Nome do terminal em que foi realizado a transacao
- **prpaytipo**: Tipo da Transacao: (2) C-Credito | (3) D-Debito
- **prpayusuario**: Codigo do usuário que baixou o pre pagamento
- **prpayvalor**: Valor da Transacao

---

## PRTF

**31 campos documentados**

- **prtfbandeira**: Codigo da Bandeira (FK)
- **prtfcliente**: Codigo do Cliente (FK)
- **prtfcodaut**: TEF 13: variavel CODAUT
- **prtfcodigo**: Codigo Interno
- **prtfcodigoconciliacao**: Código usado para rastrear a conciliação
- **prtfcodigovda**: Codigo da venda (FK)
- **prtfcodret**: TEF 09
- **prtfcodserv**: TEF 11: variavel CODSERV
- **prtfcomprovc**: TEF 29: comprovante cliente
- **prtfcomprove**: TEF XX: comprovante estabelecimento
- **prtfdata**: TEF 22e23: variaveis DATA e HORA
- **prtfempresa**: Coidgo da Empresa (FK)
- **prtfidterminal**: ID do terminal de pagamento
- **prtfipirangatipocomponente**: IPIRANGA: Tipo Componente 1-Pista/2-AmPm/5-JetOil
- **prtfjsonvenda**: JSON PAGAMENTO
- **prtfnomeband**: TEF XX: variavel NOMEBAND
- **prtfnomerede**: TEF 40: variavel NOMEREDE
- **prtfnsu**: TEF 12: variavel NSU
- **prtfoperacao**: (D)ebito (C)redito
- **prtfoperadora**: Codigo da Operadora (FK)
- **prtfoptf**: PRTF x OPTF - FK
- **prtforigem**: Flag Origem Operacao 1-Venda 2-Rcbto 3-TrocaVlr
- **prtfparcela**: TEF 18: Quantidade de Parcelas
- **prtfperfiltef**: Perfil de configuração TEF
- **prtfstatus**: Status da Transacao: 0-Pendente 1-Efetivada
- **prtftefchave**: Chave do TEF (FK)
- **prtfterminal**: Identificacao do Terminal
- **prtftipoparc**: TEF 17: Tipo Parcelamento 0-Estabelecimento 1-Administradora
- **prtftipotransacao**: Tipo de Transacao 1-TEF/2-PIX/5-C Digital
- **prtfusuarioliberou**: Nome do Usuario que Liberou a Transação sem Aprovação da Operadora
- **prtfvalor**: Valor do Cartao

---

## PRTO

**9 campos documentados**

- **prtocheque**: Codigo do Cheque (FK)
- **prtocodigo**: Codigo Sequencial
- **prtocodparb**: Código de Dado Bancário PARB (PK)
- **prtoempresa**: Codigo da Empresa (FK)
- **prtoserie**: Nome do Terminal a qual a venda pertence (PK)
- **prtotipo**: Tipo do Troco: 1-Dinheiro 2-Vale 3-Cheque
- **prtovale**: Codigo do Vale (FK)
- **prtovalor**: Valor do Troco
- **prtovencimento**: Vencimento do Cheque

---

## PRVD

**102 campos documentados**

- **prvdapicecodcomanda**: Codigo da comanda do sistema APICE
- **prvdbairro**: Bairro do Cliente
- **prvdbrpremmiacodigo**: Código ABBRIA (FK) Abastecimento BR Premmia
- **prvdbrpremmiacpf**: CPF Informado BR Premmia
- **prvdcadpro**: Numero do CADPRO do Cliente
- **prvdcartaoid**: Numero do Cartao Comanda ou OS do InforLub
- **prvdcarteiraprg**: Codigo da Carteira de Venda Programada (FK)
- **prvdcep**: CEP do Cliente
- **prvdchnfsimpfaturamento**: Chave de Acesso da NFe de Simples Faturamento
- **prvdcidade**: Codigo da Cidade do Cliente (FK)
- **prvdcnpjcpf**: Cnpj/Cpf do Cliente
- **prvdcodcliente**: Codigo do Cliente (FK)
- **prvdcoddependente**: Código do Dependente (pardcodigo)
- **prvdcodendereco**: Codigo do Endereco (FK)
- **prvdcodfdcc**: Código do Consumidor FK fdcc
- **prvdcodigo**: Codigo Sequencial (PK)
- **prvdcodigologs**: Código dos logs (Banco de Log)
- **prvdcomplemento**: Complemento do Endereco do Cliente
- **prvddata**: Data de Emissao da Venda
- **prvddependente**: Nome do Dependente
- **prvddocumento**: Flag 0-Sem Doc 1-Ecf 2-nfce 3-nfe 4-nfs 5-d1 6-sat
- **prvdedoccontingencia**: EDOC - Flag 1-Normal 9-Contingencia
- **prvdemail**: e.Mail do Cliente
- **prvdeminfsimpfaturamento**: Data de Emissao da NFe de Simples Faturamento
- **prvdempresa**: Código da Empresa(FK)
- **prvdendnro**: Numero Residencial do Cliente
- **prvdflagconcli**: Flag 0-Sem 1-Cliente 2-Consumidor
- **prvdfoneddd**: Fone DDD do Cliente
- **prvdfonepre**: Fone PREFIXO do Cliente
- **prvdfonesuf**: Fone SUFIXO do Cliente
- **prvdfonewhats**: Fone Whatsapp do Cliente
- **prvdformafecha**: Flag Forma do Fechamento: 1-normal|2-rapida|3-direta|4-Timer|5-Caixa|6-RedZ|99-outros
- **prvdfrota**: Frota do Veiculo
- **prvdfydcartao**: Numero do Cartao Fidelity
- **prvdierg**: Inscrição Estadual/RG do Cliente
- **prvdinforlub**: Flag de Origem InforLub 0-Nao 1-Sim
- **prvdipirangaidcesta**: Ipiranga: ID CESTA, código UUID usado para identificacao da cesta Ipiranga, usar nos pagamentos também
- **prvdipirangavouchercodigo**: IPIRANGA VOUCHER - Código
- **prvdipirangavouchercomponente**: IPIRANGA VOUCHER - COMPONENTE
- **prvdipirangavouchercpf**: IPIRANGA VOUCHER - CPF Consumidor
- **prvdipirangavoucherjson**: IPIRANGA VOUCHER - JSON VALIDAR
- **prvdipirangavoucherplaca**: IPIRANGA VOUCHER - Placa Veículo
- **prvdipofercodigo**: Código IPOFER (FK) Ipiranga Oferta é Sua APP
- **prvdkm**: KM do Veiculo
- **prvdlogradouro**: Logradouro do Cliente
- **prvdmedia**: Media do Veiculo
- **prvdmirrorassinatura**: Assinatura capturada do Mirror
- **prvdmirroravaliacxa**: Avaliacao do Caixa
- **prvdmirroravaliapst**: Avaliacao da Pista
- **prvdmirrorchavepix**: Chave Pix para o Mirror
- **prvdmirrorchavepixtipo**: Tipo da Chave Pix para o Mirror
- **prvdmirrorstatus**: Status do Mirror 2-Itens 10-Mostra Pix 15-Leu Pix 11-Aguarda Assinatura 16-Assinou 20-Fechando
- **prvdmirrorupdcpf**: Status do Mirror upd CPF
- **prvdmirrorupdfone**: Status do Mirror upd FONE
- **prvdmirrorupdfrota**: Status do Mirror upd FROTA
- **prvdmirrorupdkm**: Status do Mirror upd KM
- **prvdmirrorupdplaca**: Status do Mirror upd PLACA
- **prvdmotivoacre**: Motivo de Acréscimo
- **prvdmotivodesc**: Motivo de Desconto
- **prvdmovimento**: Data do Movimento da Venda
- **prvdmpappcodigo**: Código MPAPP (FK) Meu Posto App
- **prvdnfantt**: NF - Registro na ANTT
- **prvdnfcfop**: NF - Cfop Fixo da Venda
- **prvdnfespecie**: NF - Transporte - Especie
- **prvdnflacres**: NF - Transporte - Lacres
- **prvdnfmarca**: NF - Transporte - Marca
- **prvdnfnatureza**: NF - Natureza da Nota Fiscal
- **prvdnfnumeracao**: NF - Transporte - Numeracao
- **prvdnfpesobruto**: NF - Transporte - Peso Bruto
- **prvdnfpesoliquido**: NF - Transporte - Peso Liquido
- **prvdnfplaca**: NF - Placa do Veiculo Transportador
- **prvdnfquantidade**: NF - Transporte - Quantidade
- **prvdnfsimpfaturamento**: Codigo da NFe de Simples Faturamento
- **prvdnftpfrete**: NF - (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **prvdnftransportador**: NF - Codigo do Transportador (FK)
- **prvdnfufveiculo**: NF - UF do veiculo
- **prvdnitemped**: ORDEM DE COMPRA - Numero do Item
- **prvdnome**: Nome do Cliente
- **prvdnroserie**: Numero de Serie da Ecf ***DESCONTINUADO***
- **prvdnumeromesa**: Numero da Mesa
- **prvdobs**: Observações Gerais
- **prvdperfil**: Codigo do Perfil FK fdpf
- **prvdplaca**: Placa do Veiculo
- **prvdpostoakichaveaut**: POSTO AKI - Chave Autenticação
- **prvdpromoter**: Codigo do Promoter FK part
- **prvdprzvencimento**: PRAZO - Vencimento Fixo
- **prvdptofidelidade**: Pontos por Fidelidade
- **prvdrequisicao**: Requisicao do Veiculo
- **prvdseqvenda**: Numero de Sequencia da Venda
- **prvdserie**: Nome do Terminal a qual a venda pertence (PK)
- **prvdstartpost**: Iniciou processo de gravacao 0-Nao 1-Sim
- **prvdtabelafixa**: Tabela Fixa a ser Seguida
- **prvdtipoprint**: Flag 0-Completa/A4 1-Resumida/Bobina 2-Nao Imprimir
- **prvdtokenprazo**: Numero do Token liberacao a Prazo
- **prvdvalidamensagem**: Descrição da Mensagem de Falha de Validação
- **prvdvalidastatus**: 00-Sem Ação|10-Solicita Validação|20-Validando|30-Falha Validação|100-Validação OK
- **prvdvchr99codigo**: Código VCHR99 (FK) Voucher 99 App
- **prvdvdajet**: Código VDAJET (FK) Ipiranga JetOil
- **prvdvdakmv**: Código VDA KMV (FK)
- **prvdveiculo**: Descricao do Veiculo
- **prvdvl4ucodigo**: Código VL4U (FK) Value4u app
- **prvdxped**: ORDEM DE COMPRA - Numero da Ordem de Compra

---

## PRVDE

**14 campos documentados**

- **prvdebairro**: Bairro do Endereco de Entrega
- **prvdecep**: Cep do Endereco de Entrega
- **prvdecidade**: Cidade do Endereco de Entrega
- **prvdecnpjcpf**: CNPJ/CPF do Recebedor
- **prvdecomplemento**: Complemento do Endereco de Entrega
- **prvdeemail**: Email do Recebedor
- **prvdeempresa**: Código da Empresa(FK)
- **prvdeie**: IE do Recebedor
- **prvdelogradouro**: Logradouro do Endereco de Entrega
- **prvdenumero**: Numero do Endereco de Entrega
- **prvderecebedor**: Nome do Recebedor
- **prvdeserie**: Nome do Terminal a qual a venda pertence (PK)
- **prvdetelefone**: Telefone do Recebedor
- **prvdeuf**: UF do Endereco de Entrega

---

## PS_PA1

**5 campos documentados**

- **ps_pa1equipamento**: Descricao terminal
- **ps_pa1gravacao**: Data e hora da gravação do registro
- **ps_pa1leitura**: Data e hora da leitura do registro
- **ps_pa1nsu**: Nro de serie do equipamento
- **ps_pa1sequencia**: Codigo PK tabela

---

## PS_PB1

**7 campos documentados**

- **ps_pb1codigo_filtro**: Descricação Pendente
- **ps_pb1equipamento**: Descricao terminal
- **ps_pb1filtro_tipo_abastecimento**: Descricação Pendente
- **ps_pb1gravacao**: Data e hora da gravação do registro
- **ps_pb1leitura**: Data e hora da leitura do registro
- **ps_pb1nsu**: Nro de serie do equipamento
- **ps_pb1sequencia**: Codigo PK tabela

---

## PS_PC1

**7 campos documentados**

- **ps_pc1equipamento**: Descricao terminal
- **ps_pc1gravacao**: Data e hora da gravação do registro
- **ps_pc1leitura**: Data e hora da leitura do registro
- **ps_pc1marcar_desmarcar**: Descricação Pendente
- **ps_pc1nro_abastec**: Descricação Pendente
- **ps_pc1nsu**: Nro de serie do equipamento
- **ps_pc1sequencia**: Codigo PK tabela

---

## PS_PD1

**9 campos documentados**

- **ps_pd1cod_produto**: Descricação Pendente
- **ps_pd1equipamento**: Descricao terminal
- **ps_pd1flag**: Descricação Pendente
- **ps_pd1gravacao**: Data e hora da gravação do registro
- **ps_pd1leitura**: Data e hora da leitura do registro
- **ps_pd1nsu**: Nro de serie do equipamento
- **ps_pd1numero_pedido**: Descricação Pendente
- **ps_pd1quantidade**: Descricação Pendente
- **ps_pd1sequencia**: Codigo PK tabela

---

## PS_PE1

**15 campos documentados**

- **ps_pe1cnpj_cpf**: Descricação Pendente
- **ps_pe1codcliente**: Código do cliente
- **ps_pe1equipamento**: Descricao terminal
- **ps_pe1flag_impressao**: Descricação Pendente
- **ps_pe1frota**: Descricação Pendente
- **ps_pe1gravacao**: Data e hora da gravação do registro
- **ps_pe1km**: Descricação Pendente
- **ps_pe1leitura**: Data e hora da leitura do registro
- **ps_pe1liberavda**: Descricação Pendente
- **ps_pe1nsu**: Nro de serie do equipamento
- **ps_pe1numero_pedido**: Descricação Pendente
- **ps_pe1placa**: Descricação Pendente
- **ps_pe1requisicao**: Descricação Pendente
- **ps_pe1sequencia**: Codigo PK tabela
- **ps_pe1vendedor**: Descricação Pendente

---

## PS_PE2

**10 campos documentados**

- **ps_pe2abastecimento**: Descricação Pendente
- **ps_pe2equipamento**: Descricao terminal
- **ps_pe2gravacao**: Data e hora da gravação do registro
- **ps_pe2leitura**: Data e hora da leitura do registro
- **ps_pe2nsu**: Nro de serie do equipamento
- **ps_pe2produto**: Descricação Pendente
- **ps_pe2qtd**: Descricação Pendente
- **ps_pe2seq_produto**: Descricação Pendente
- **ps_pe2sequencia**: Codigo PK tabela
- **ps_pe2vlr_unit**: Descricação Pendente

---

## PS_PE3

**15 campos documentados**

- **ps_pe3bandeira**: Descricação Pendente
- **ps_pe3cod_retorno**: Descricação Pendente
- **ps_pe3equipamento**: Descricao terminal
- **ps_pe3gravacao**: Data e hora da gravação do registro
- **ps_pe3leitura**: Data e hora da leitura do registro
- **ps_pe3nro_autorizacao**: Descricação Pendente
- **ps_pe3nsu**: Nro de serie do equipamento
- **ps_pe3nsucartao**: Descricação Pendente
- **ps_pe3operacao**: Descricação Pendente
- **ps_pe3operadora**: Descricação Pendente
- **ps_pe3parcelas**: Descricação Pendente
- **ps_pe3seq_pgto**: Descricação Pendente
- **ps_pe3sequencia**: Codigo PK tabela
- **ps_pe3tipo**: Descricação Pendente
- **ps_pe3valor**: Descricação Pendente

---

## PS_PF1

**6 campos documentados**

- **ps_pf1ean**: Descricação Pendente
- **ps_pf1equipamento**: Descricao terminal
- **ps_pf1gravacao**: Data e hora da gravação do registro
- **ps_pf1leitura**: Data e hora da leitura do registro
- **ps_pf1nsu**: Nro de serie do equipamento
- **ps_pf1sequencia**: Codigo PK tabela

---

## PS_RA1

**15 campos documentados**

- **ps_ra1equipamento**: Descricao terminal
- **ps_ra1filtro_tipo_abastecimento**: Descricação Pendente
- **ps_ra1gravacao**: Data e hora da gravação do registro
- **ps_ra1leitura**: Data e hora da leitura do registro
- **ps_ra1lis_comb**: Descricação Pendente
- **ps_ra1lis_ct**: Descricação Pendente
- **ps_ra1lis_din**: Descricação Pendente
- **ps_ra1lis_prod**: Descricação Pendente
- **ps_ra1nsu**: Nro de serie do equipamento
- **ps_ra1prc_padrao**: Descricação Pendente
- **ps_ra1prc_prevalece**: Descricação Pendente
- **ps_ra1quebra_linha_xml**: Descricação Pendente
- **ps_ra1sequencia**: Codigo PK tabela
- **ps_ra1tipo_autenticacao**: Descricação Pendente
- **ps_ra1url_consultapublica**: Descricação Pendente

---

## PS_RA2

**9 campos documentados**

- **ps_ra2cod_bico**: Descricação Pendente
- **ps_ra2cod_ws_combustivel**: Descricação Pendente
- **ps_ra2comb**: Descricação Pendente
- **ps_ra2equipamento**: Descricao terminal
- **ps_ra2gravacao**: Data e hora da gravação do registro
- **ps_ra2leitura**: Data e hora da leitura do registro
- **ps_ra2nsu**: Nro de serie do equipamento
- **ps_ra2sequencia**: Codigo PK tabela
- **ps_ra2sigla**: Descricação Pendente

---

## PS_RA3

**9 campos documentados**

- **ps_ra3cod_frentista**: Descricação Pendente
- **ps_ra3equipamento**: Descricao terminal
- **ps_ra3gravacao**: Data e hora da gravação do registro
- **ps_ra3leitura**: Data e hora da leitura do registro
- **ps_ra3nome**: Descricação Pendente
- **ps_ra3nsu**: Nro de serie do equipamento
- **ps_ra3rfid**: Descricação Pendente
- **ps_ra3senha**: Descricação Pendente
- **ps_ra3sequencia**: Codigo PK tabela

---

## PS_RB1

**12 campos documentados**

- **ps_rb1bico**: Descricação Pendente
- **ps_rb1equipamento**: Descricao terminal
- **ps_rb1gravacao**: Data e hora da gravação do registro
- **ps_rb1leitura**: Data e hora da leitura do registro
- **ps_rb1nro_abastec**: Descricação Pendente
- **ps_rb1nsu**: Nro de serie do equipamento
- **ps_rb1qtd**: Descricação Pendente
- **ps_rb1sequencia**: Codigo PK tabela
- **ps_rb1vlr_total_ct**: Descricação Pendente
- **ps_rb1vlr_total_din**: Descricação Pendente
- **ps_rb1vlr_unit_ct**: Descricação Pendente
- **ps_rb1vlr_unit_din**: Descricação Pendente

---

## PS_RC1

**7 campos documentados**

- **ps_rc1aceite**: Descricação Pendente
- **ps_rc1equipamento**: Descricao terminal
- **ps_rc1gravacao**: Data e hora da gravação do registro
- **ps_rc1leitura**: Data e hora da leitura do registro
- **ps_rc1nro_abastec**: Descricação Pendente
- **ps_rc1nsu**: Nro de serie do equipamento
- **ps_rc1sequencia**: Codigo PK tabela

---

## PS_RD1

**15 campos documentados**

- **ps_rd1cod_produto**: Descricação Pendente
- **ps_rd1descricao**: Descricação Pendente
- **ps_rd1equipamento**: Descricao terminal
- **ps_rd1flag_aceite**: Descricação Pendente
- **ps_rd1gravacao**: Data e hora da gravação do registro
- **ps_rd1leitura**: Data e hora da leitura do registro
- **ps_rd1motivo_recusa**: Descricação Pendente
- **ps_rd1nsu**: Nro de serie do equipamento
- **ps_rd1numero_pedido**: Descricação Pendente
- **ps_rd1quantidade**: Descricação Pendente
- **ps_rd1sequencia**: Codigo PK tabela
- **ps_rd1vlr_total_ct**: Descricação Pendente
- **ps_rd1vlr_total_din**: Descricação Pendente
- **ps_rd1vlr_unit_ct**: Descricação Pendente
- **ps_rd1vlr_unit_din**: Descricação Pendente

---

## PS_RE1

**10 campos documentados**

- **ps_re1chave_xml**: Descricação Pendente
- **ps_re1cod_venda**: Descricação Pendente
- **ps_re1equipamento**: Descricao terminal
- **ps_re1gravacao**: Data e hora da gravação do registro
- **ps_re1leitura**: Data e hora da leitura do registro
- **ps_re1mensagem_retorno**: Descricação Pendente
- **ps_re1nsu**: Nro de serie do equipamento
- **ps_re1numero_pedido**: Descricação Pendente
- **ps_re1sequencia**: Codigo PK tabela
- **ps_re1xml**: Descricação Pendente

---

## PS_RF1

**8 campos documentados**

- **ps_rf1ean**: Descricação Pendente
- **ps_rf1equipamento**: Descricao terminal
- **ps_rf1gravacao**: Data e hora da gravação do registro
- **ps_rf1leitura**: Data e hora da leitura do registro
- **ps_rf1nsu**: Nro de serie do equipamento
- **ps_rf1sequencia**: Codigo PK tabela
- **ps_rf1vlr_unit_ct**: Descricação Pendente
- **ps_rf1vlr_unit_din**: Descricação Pendente

---

## PSAT

**8 campos documentados**

- **psatavaliacaoc**: Avaliação do Caixa - 0 a 4
- **psatavaliacaop**: Avaliação da Pista - 0 a 4
- **psatcodigo**: Codigo do Pesquisa Satisfação
- **psatdados**: JSON com informações
- **psatdata**: Data da pesquisa
- **psatdescricao**: Descricao
- **psatempresa**: Codigo da Empresa
- **psatvda**: Codigo da Venda FK

---

## PTOP

**8 campos documentados**

- **ptopbaixacaixa**: Caixa da Baixa
- **ptopbaixadatahora**: Data Hora da Baixa
- **ptopcaixa**: Caixa da Geracao
- **ptopcodigo**: Codigo Sequencial
- **ptopdatahora**: Data Hora da Geracao
- **ptopempresa**: Código da Empresa
- **ptoppontos**: Pontos
- **ptopvenda**: Numero da Venda

---

## PWDA

**4 campos documentados**

- **pwdacaixa**: Caixa Logado
- **pwdadata**: Data do login
- **pwdalogin**: Login PK tabela
- **pwdaterminal**: Terminal do login

---

## PWDE

**4 campos documentados**

- **pwdebloqueado**: Situacao 0-Normal 1-Bloqueado
- **pwdecodigo**: Codigo da Liberação da Empresa
- **pwdeempresa**: Codigo da Empresa (FK)
- **pwdelogin**: Login Reponsavel (FK)

---

## PWDL

**11 campos documentados**

- **pwdlacesso**: Acesso a Operação (Sim/Nao)
- **pwdlcodigo**: Codigo da Liberação no Plano de Senha
- **pwdldescricao**: Descrição da Operação
- **pwdlgrupo1**: Grupo 1
- **pwdlgrupo2**: Grupo 2
- **pwdlgrupo3**: Grupo 3
- **pwdlhash**: Hash do Registro
- **pwdlinativo**: Registro Inativo
- **pwdlliberapdv**: Libera PDV(Sim/Não)
- **pwdlnivel**: Codigo do Nivel (FK)
- **pwdloperacao**: Variavel com o Nome da Operação

---

## PWDN

**6 campos documentados**

- **pwdnbloquear**: Bloquear tela após X segundos. Zero (0) desabilita
- **pwdncodigo**: Codigo do Nivel no Plano de Senha
- **pwdndescricao**: Descrição do Nivel no Plano de Senha
- **pwdnenviarpdv**: Flag para identificar as pendencias de envio: 0 - Nao | 1 - Sim
- **pwdnhash**: Hash do Registro
- **pwdntipo**: Tipo do Nivel no Plano de Senha (Admin/Operador)

---

## PWDU

**40 campos documentados**

- **pwduativo**: Terminal Ativo com o Usuario
- **pwdubloqueio**: Usuario Bloqueado (Sim/Nao)
- **pwduemailcom**: e.mail Comercial do Usuario
- **pwduemailpes**: e.mail Pessoal do Usuario
- **pwdufone**: Telefone do Usuario
- **pwduforcatrocasenha**: Forca trocar senha proximo login 0-Não | 1-Sim
- **pwduguardaskin**: Grava a Skin das telas escolhida pelo Usuario
- **pwduhash**: Hash do Registro
- **pwduidusuariobrinks**: ID do usuário no Cofre Brinks
- **pwduidusuariosmartsafe**: ID do usuário no Smart Safe
- **pwdulembra**: Lista de Empresas do Ultimo Login
- **pwduliberadom**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberadomf**: Hora Final para Acesso no Domingo
- **pwduliberadomi**: Hora Inicial para Acesso no Domingo
- **pwduliberapdv**: Libera PDV(Sim/Não)
- **pwduliberaqua**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberaquaf**: Hora Final para Acesso na Quarta
- **pwduliberaquai**: Hora Inicial para Acesso na Quarta
- **pwduliberaqui**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberaquif**: Hora Final para Acesso na Quinta
- **pwduliberaquii**: Hora Inicial para Acesso na Quinta
- **pwduliberasab**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberasabf**: Hora Final para Acesso no Sabado
- **pwduliberasabi**: Hora Inicial para Acesso no Sabado
- **pwduliberaseg**: Liberar Uso na Segunda (Sim/Nao)
- **pwduliberasegf**: Hora Final para Acesso na Segunda
- **pwduliberasegi**: Hora Inicial para Acesso na Segunda
- **pwduliberasex**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberasexf**: Hora Final para Acesso na Sexta
- **pwduliberasexi**: Hora Inicial para Acesso na Sexta
- **pwduliberater**: Liberar Uso no Domingo (Sim/Nao)
- **pwduliberaterf**: Hora Final para Acesso na Terca
- **pwduliberateri**: Hora Inicial para Acesso na Terca
- **pwdulogin**: Login do Usuario
- **pwdunivel**: Codigo do Nivel (FK)
- **pwduremoto**: Acesso Remoto 0-Não | 1-Sim
- **pwdurepositorio**: Atualiza Repositorio
- **pwdusenha**: Login+Senha do Usuario
- **pwdusimultaneo**: Permitir Acesso Simultaneo ao Sistema (Sim/Nao)
- **pwduultimologin**: Data e Hora do Ultimo Acesso

---

## PXBL

**25 campos documentados**

- **pxblcfg**: FK PIXBOLCODIGO
- **pxblcodigo**: Codigo Sequencial
- **pxblcontacorrente**: FK CCRRCODIGO código conta corrente
- **pxbldataconsulta**: Data Consulta Status
- **pxbldataemail**: Data Envio E-mail Pix Boleto
- **pxbldataimpressao**: Data Impressão Pix Boleto
- **pxbldatalimite**: Limite de dias para pagamento após vencimento
- **pxblemissao**: Data Emissão
- **pxblempresa**: Código Empresa
- **pxblexpiration**: Data Expiração
- **pxblfatu**: Código Fatu
- **pxblid**: ID
- **pxbljsonenvio**: Json Envio
- **pxbljsonretorno**: Json Retorno
- **pxblorderid**: Shipay Order ID
- **pxblpagamento**: Data Pagamento
- **pxblpart**: Código Participante
- **pxblpaymentid**: Shipay Payment ID
- **pxblpixdictkey**: Shipay Pix Dict Key
- **pxblpsp**: Shipay PSP
- **pxblstatus**: Shipay Status
- **pxblvalor**: Valor Documento
- **pxblvalorpago**: Valor Pago
- **pxblvencimento**: Data Vencimento
- **pxblwallet**: Shipay Wallet

---

## PXIT

**7 campos documentados**

- **pxitbico**: Codigo do Bico (FK)
- **pxitcaixa**: Codigo do Caixa
- **pxitcodigo**: Codigo Sequencial do Item
- **pxitempresa**: Codigo da Empresa (FK)
- **pxitproduto**: Codigo do Produto (FK)
- **pxitqtd**: Quantidade
- **pxittotal**: Valor Total do Item

---

## PZCC

**3 campos documentados**

- **pzcccodigo**: Codigo
- **pzccperiodo**: Código do Periodo
- **pzccsaldo**: Saldo

---

## PZCH

**12 campos documentados**

- **pzchagencia**: Agencia
- **pzchbanco**: Banco
- **pzchccrr**: Conta Corrente
- **pzchcheque**: Cheque
- **pzchcmc7**: Cmc7
- **pzchcodigo**: Codigo
- **pzchemissao**: Emissão
- **pzchemitente**: Emitente
- **pzchorigem**: Origem
- **pzchperiodo**: Periodo
- **pzchresponsavel**: Responsavel
- **pzchvalor**: Valor

---

## PZES

**7 campos documentados**

- **pzescodigo**: Codigo
- **pzesdifqtd**: Diferença Qtd
- **pzesdifvlr**: Diferença Vlr
- **pzesperiodo**: Periodo
- **pzesproduto**: Código do Produto
- **pzesqtd**: Quantidade
- **pzesvlr**: Valor

---

## PZMX

**8 campos documentados**

- **pzmxcodigo**: Codigo
- **pzmxdata**: Data
- **pzmxdescricao**: Descrição
- **pzmxdetalhe**: Detalhe
- **pzmxoperacao**: Operação
- **pzmxperiodo**: Periodo
- **pzmxterminal**: Terminal
- **pzmxusuario**: Usuário

---

## PZPG

**8 campos documentados**

- **pzpgcodigo**: Codigo
- **pzpgconta**: Numero da Conta
- **pzpgdescricao**: Descrição
- **pzpgdocumento**: Número Documento
- **pzpgfornecedor**: Fornecedor
- **pzpgorigem**: Origem
- **pzpgperiodo**: Periodo
- **pzpgvalor**: Valor

---

## PZPS

**8 campos documentados**

- **pzpscodigo**: Codigo
- **pzpsconta**: Conta
- **pzpsdescricao**: Descrição
- **pzpsdocumento**: Número Documento
- **pzpsfornecedor**: Fornecedor
- **pzpsorigem**: Origem
- **pzpsperiodo**: Periodo
- **pzpsvalor**: Valor

---

## PZPZ

**5 campos documentados**

- **pzpzlucbrant**: Lucro Bruto Anterior
- **pzpzluclqant**: Lucro Liquido Anterior
- **pzpzperiodo**: Codigo
- **pzpzprocessado**: Status Do Periodo (S)im / (N)ão
- **pzpzsldatant**: Saldo Anterior

---

## PZRC

**6 campos documentados**

- **pzrccliente**: Cliente
- **pzrccodigo**: Codigo
- **pzrcdocumento**: Documento
- **pzrcorigem**: Origem
- **pzrcperiodo**: Código do Periodo
- **pzrcvalor**: Valor

---

## PZRT

**7 campos documentados**

- **pzrtcodigo**: Codigo
- **pzrtconta**: Numero da Conta
- **pzrtdescricao**: Descricao da Receita
- **pzrtdocumento**: Número Documento
- **pzrtorigem**: Origem
- **pzrtperiodo**: Periodo
- **pzrtvalor**: Valor

---

## PZVD

**6 campos documentados**

- **pzvdcodigo**: Codigo
- **pzvdcusto**: Custo
- **pzvdperiodo**: Periodo
- **pzvdproduto**: Codigo do Produto
- **pzvdqtd**: Quantidade
- **pzvdvalor**: Valor

---

## QRY

**13 campos documentados**

- **qrycodigo**: Codigo da Query
- **qryliberado**: 1-Liberado 0-Testando
- **qrypersonalizada**: Query Personalizada (0-Não | 1-Sim)
- **qryresumo**: Resumo onde Esta sendo usado a Query
- **qrytabelabase**: Tabela base em Processos Globais
- **qrytags**: Tags de Regras do Usuário
- **qrytagsme**: Tags de Regras do Usuário Multi Empresa
- **qrytagssgapetro**: Tags de Regras Sga Petro
- **qryusar**: Usar a Tag: 1 - Sga Petro, 2 - Usuário
- **qryversao**: Data da versão miníma da qry
- **qryversaor**: Release do executável
- **qryversaoraiz**: Letra da versão raiz
- **qryversaov**: Versão do executável

---

## QRYTIME

**1 campos documentados**

- **qrytimedata**: Data da Última Atualização

---

## QSDF

**3 campos documentados**

- **qsdfmodelo**: Modelo documento fiscal
- **qsdfnumero**: Número documento fiscal
- **qsdfserie**: Série documento fiscal

---

## RCCL

**25 campos documentados**

- **rcclboleto**: Verifica se há boletos a emitir
- **rcclcelular**: Número do celular
- **rcclcodigo**: Codigo Sequencial
- **rcclcodigorv**: Código da recarga da RV
- **rcclcomprovante**: Comprovante
- **rcclcusto**: Custo da recarga
- **rccldatarv**: DATA RV da transação
- **rcclddd**: Código DDD do celular
- **rcclempresa**: Codigo da Empresa
- **rcclidrvhub**: Identificador único da transação baseado em UUIDs V4
- **rcclmensagempinrv**: Mensagem
- **rcclnsurv**: NSU da transaçaõ
- **rccloperadora**: Codigo Operadora
- **rcclpin**: Número PIN
- **rcclpinlote**: Número Lote do PIN
- **rcclpinserie**: Série do PIN
- **rcclproduto**: Nome do produto
- **rcclprodutorv**: Código Produto RV (pode ser diferente da consulta de produtos)
- **rcclstatuspgtorv**: Status Pgto
- **rcclterminal**: Terminal que efetuou a recarga
- **rcclusuario**: Usuário que efetuou a recarga
- **rcclvalor**: Valor da recarga
- **rcclvencimentorv**: Vencimento RV
- **rcclxmlconfirma**: XML confirmação da recarga
- **rcclxmlrecarga**: XML respota da recarga

---

## RCEL

**9 campos documentados**

- **rcelautorizacao**: Autorização
- **rcelcodigo**: Codigo
- **rcelcomprovante**: Comprovante
- **rceldata**: Data
- **rcelempresa**: Código da Empresa
- **rcelnsu**: NSU
- **rcelrede**: Rede
- **rcelsupr**: Supr
- **rcelvalor**: Valor

---

## RECA

**9 campos documentados**

- **recacodigo**: Código Sequencial
- **recadtfinal**: Maior data da Venda Informada dentro do Lote
- **recadtinicial**: Menor data da Venda Informada dentro do Lote
- **recaempresa**: Código da Empresa (FK)
- **recalote**: Codigo Lote
- **recapodeenviar**: Identificador se pode enviar a Conciliação(0-Não|1-Sim)
- **recaversao**: Versão do WebService(Fixo=3)
- **recaxmlenvio**: XML de Envio para Conciliadora
- **recaxmlretorno**: XML de Retorno da Conciliadora

---

## RECC

**26 campos documentados**

- **reccautorizacao**: Código de Autorização
- **reccbandeira**: Código da Bandeira
- **recccaixa**: Caixa
- **recccaixaf**: Data do Caixa Final
- **recccaixai**: Data do Caixa Inicial
- **recccliente**: Código do Cliente
- **recccodigo**: Codigo
- **reccdeparabandeira**: Depara Operadora
- **reccdeparaoperadora**: Depara Operadora
- **reccdescbandeira**: Descrição da Bandeira
- **reccdescoperadora**: Descrição da Operadora
- **reccdocumento**: Documento da Conta
- **reccemissao**: Data de Emissão
- **reccendereco**: Código do Endereco
- **reccmeiocaptura**: Meio de Captura
- **reccmodalidade**: Modalidade(0=Débito | 1=Crédito)
- **reccoperadora**: Código da Operadora
- **reccparcela**: Parcela
- **reccpartrazao**: Razão Social
- **reccstatus**: Situação do Registro
- **recctaxa**: Taxa do Cartão
- **recctefchave**: Chave TEF
- **reccvencimento**: Data de Vencimento
- **reccvlrbruto**: Valor Bruto da Transação
- **reccvlrdesconto**: Valor Desconto da Transação
- **reccvlrliquido**: Valor Líquido da Transação

---

## RECE

**56 campos documentados**

- **receantecipadoc**: Valor Antecipado
- **recebalpat**: Valor Sera Apresentado no Balanco Patrimonial (Flag) 0-Nao|1-Sim
- **rececaixa**: Caixa (FK)
- **rececfcalculo**: Calculo (J)a Calculado / (A)diantamento / (S)aldo
- **rececfcpf**: Cpf do Motorista
- **rececfmotorista**: Nome do Motorista
- **rececfpesoc**: Peso Chegada
- **rececfpesos**: Peso Saida
- **recechaveconc**: Campo composto do nro de autorização concatenado com NSU da conciliacao
- **rececliente**: Codigo do cliente (FK)
- **rececodigo**: Codigo Sequencial
- **recedependente**: Nome do Dependente
- **recedesconto**: Valor Pre estabelecido de Desconto
- **recedescontoc**: Valor de Desconto (Conciliacao de Cartoes)
- **recedocumento**: Numero da conta
- **recedreconta**: Plano de Contas do DRE (FK)
- **receemissao**: Data de Emissao
- **receempresa**: Codigo Empresarial (PK)
- **receendereco**: Codigo do endereco (FK)
- **recefatura**: Codigo da Fatura (FK)
- **recefaturavinculo**: Codigo da Fatura Vinculada (Em caso de Divisão de Fatura)
- **recefechamento**: Data de Fechamento
- **recefixarmj**: Flag 0-Nao|1-Fixar Multa Juros
- **recejuros**: Valor Pre estabelecido de Juros
- **recemulta**: Valor Pre estabelecido de Multa
- **receobs**: Observacoes Diversas
- **receobsconciliadora**: Observação Conciliadora
- **receorigem**: Flag de Origem 0-Prazo|1-Cartao|2-CartaFrete|3-Receita
- **receorigemcod**: Codigo da origem da conta (FK)
- **receorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 4vdpg 5VdPrg 6bxChq
- **receoriginal**: Valor Original
- **receoutrasdesp**: Valor de Outras Despesas
- **receoutrasrec**: Valor de Outros Recebimentos
- **receoutrasrecs**: Valor de Outras Receitas
- **recepkconciliacao**: Chave PK da Conciliadora
- **receplaca**: Placa do Veiculo
- **recepreferencia**: Flag de Preferencia 0-Nao|1-Sim
- **receprevista**: Data Prevista para Pagamento
- **receremoteid**: ID único no SGA Cloud
- **recesgaservico**: MODO GESTOR - Codigo do Servico (FK)
- **recestatusconc**: Status Conciliação da Venda(0-Sem Operação|1-Transmitir|2-Transmitido|3-Erros|4-Correto|5-Gerar Fatura|6-Finalizado)
- **recesync**: Mostra o status da Syncronização
- **recetaxaconc**: Taxa Conciliação
- **recetefautorizacao**: Codigo da Autorizacao
- **recetefb**: Codigo da Bandeira (FK)
- **recetefchave**: Chave do TEF (FK)
- **recetefp**: Codigo da Operadora (FK)
- **recetentativa**: Tentativa de Retorno de Status da Conciliação
- **recetituendold**: Codigo Do Endereço do Participante (FK)
- **recetitupartold**: Codigo Do Participante (FK)
- **recetransacao**: Tipo de Transação(0-Pendente|1-Pagamento|2-Crédito|3-Cancelamento|4-Débito
- **recevalor**: Valor Principal
- **recevencimento**: Data de Vencimento
- **recevenda**: Codigo da Venda (FK)
- **recevlrmarcado**: Valor Marcado
- **recevlrmarcfatu**: Valor Marcado no Lote de Faturamento

---

## RECI

**25 campos documentados**

- **reciautorizacao**: Código da Autorização
- **recicodigo**: Código Sequencia
- **recicodigoreca**: Código do Lote(FK)
- **recicodigorece**: Código Rece(FK)
- **reciconciliar**: Conciliar Pagamento(1-Sim/0-Não)
- **recideparaband**: Depara Bandeira
- **recideparaoper**: Depara Operadora
- **recidesconto**: Desconto
- **recidocumento**: Documento do Rece
- **recidthrenvio**: Data e Hora do Envio
- **reciemissao**: Emissão do Rece
- **reciempresa**: Código da Empresa (FK)
- **recifaturamento**: Data do Faturamento
- **recijuros**: Juros
- **recimulta**: Multa
- **recinrocartao**: Número do Cartão
- **reciobs**: Observações do Rece
- **reciobservacao**: Observação
- **recipartrazao**: Razao Social
- **recistatus**: Situação(0-Não Transmitir|1-Transmitir)
- **recitaxaind**: Taxa do Cartao por Indice
- **recitefchave**: Chave do TEF
- **recivalor**: Valor Principal
- **recivaloratual**: Valor Atual
- **recivencimento**: Vencimento do Rece

---

## RECIA

**16 campos documentados**

- **reciabandeira**: Bandeira da Transacao EX: MASTERCARD | VISA | ELO | ETC...
- **reciachavecartao**: Codigo da Chave de Cartoes
- **reciacodigo**: Código PK tabela
- **reciacodigooperadora**: Codigo da Operadora da Transacao: CIELO ... 
- **reciacodigorece**: Código Rece(FK)
- **reciadatahora**: Data/Hora da Transacao
- **reciadatapagamento**: Data do Pagamento da Transacao
- **reciadataprocessamento**: Data do Processamento do Vinculo
- **reciaempresa**: Código da Empresa
- **reciamodalidade**: Modalidde da Transacao: C-Credito | D-Debito
- **reciansu**: Codigo NSU da Transacao
- **recianumeroautorizacao**: Numero da Autorizacao da Transacao
- **reciataxapercentual**: Taxa de Desconto em Percentual da Transacao
- **reciataxavalor**: Taxa de Desconto em Valor da Transacao
- **reciavalor**: Valor da Transacao
- **reciavalorliquido**: Valor da Transacao Liquido

---

## RECJ

**48 campos documentados**

- **recjantecipadoc**: Valor Antecipado
- **recjbalpat**: Valor Será Apresentado no Balanco Patrinonial (Flag) 0-Nao|1-Sim
- **recjcaixa**: Caixa (FK)
- **recjcfcalculo**: Calculo (J)a Calculado / (A)diantamento / (S)aldo
- **recjcfcpf**: Cpf do Motorista
- **recjcfmotorista**: Nome do Motorista
- **recjcfpesoc**: Peso Chegada
- **recjcfpesos**: Peso Saida
- **recjcliente**: Codigo do cliente (FK)
- **recjcodigo**: Codigo Sequencial
- **recjconferido**: Flag p/ marcar registros conferidos
- **recjdependente**: Nome do Dependente
- **recjdesconto**: Valor Desconto
- **recjdescontoc**: Valor de Desconto (Conciliacao de Cartoes)
- **recjdocumento**: Numero da conta
- **recjdreconta**: Plano de Contas do DRE (FK)
- **recjemissao**: Data de Emissao
- **recjempresa**: Codigo Empresarial (PK)
- **recjendereco**: Codigo do endereco (FK)
- **recjfatura**: Codigo da Fatura (FK)
- **recjfechamento**: Data de Fechamento
- **recjjuros**: Valor Juros
- **recjmulta**: Valor Multa
- **recjobs**: Observacoes Diversas
- **recjobsconciliadora**: Observação Conciliadora
- **recjorigem**: Flag de Origem 0-Prazo|2-Cartao|3-CartaFrete
- **recjorigemcod**: Codigo da origem da conta (FK)
- **recjorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **recjoriginal**: Valor Original
- **recjoutrasdesp**: Valor de Outras Despesas
- **recjoutrasrec**: Valor de Outros Recebimentos
- **recjoutrasrecs**: Valor de Outras Receitas
- **recjpkconciliacao**: Chave PK da Conciliadora
- **recjplaca**: Placa do Veiculo
- **recjprevista**: Data Prevista para Pagamento
- **recjprincipal**: Valor Principal
- **recjremoteid**: ID único no SGA Cloud
- **recjsgaservico**: MODO GESTOR - Codigo do Servico (FK)
- **recjsync**: Mostra o status da Syncronização com o SGA Clould
- **recjtaxaconc**: Taxa Conciliação
- **recjtefautorizacao**: Codigo da Autorizacao
- **recjtefb**: Codigo da Bandeira (FK)
- **recjtefchave**: Chave do TEF (FK)
- **recjtefp**: Codigo da Operadora (FK)
- **recjtransacao**: Tipo de Transação(1-Pagamento / 2-Crédito / 3-Cancelamento / 4-Débito
- **recjvalor**: Valor Recebido
- **recjvencimento**: Data de Vencimento
- **recjvenda**: Codigo da Venda (FK)

---

## REDP

**3 campos documentados**

- **redpcodigo**: Codigo Sequencia (PK)
- **redpdescricao**: Descrição
- **redprepositorio**: Atualiza Repositorio

---

## REDZ

**17 campos documentados**

- **redzbruta**: Venda Bruta
- **redzcaptura**: Data e Hora da Captura
- **redzcodigo**: Numero Sequencial
- **redzcoofim**: Numero do coo final
- **redzcooini**: Numero do coo inicial
- **redzcro**: Numero do CRO
- **redzcrz**: Numero da Reducao Z
- **redzecf**: Numero de sequencia da ECF
- **redzempresa**: Código da Empresa(FK)
- **redzgt**: Grande Total
- **redzloja**: Numero da loja
- **redzmodelo**: Modelo da ECF
- **redzmotivo**: Motivo pelo qual foi tirado a reducao Z
- **redzmovimento**: Data do Movimento
- **redzproprietario**: Numero do proprietario/usuario atual
- **redzresponsavel**: Login do Responsavel pela reducao Z
- **redzserie**: Numero de Serie da Impressora

---

## REGP

**39 campos documentados**

- **regpbandeiras**: Opção Controle Bandeiras: 0-Bloquear Todos | 1-Liberar Todos
- **regpcodigo**: Codigo Sequencial
- **regpdatafinal**: Data Final da Regra de Preço
- **regpdatainicial**: Data Inicial da Regra de Preço
- **regpdescricao**: Descricao da Regra de Preço
- **regpdestino**: Codigo da Regra Conforme Opção
- **regpempresa**: Codigo da Empresa (INATIVO)
- **regpempresas**: Opção Controle Empresas: 0-Bloquear Todos | 1-Liberar Todos
- **regphorafinal**: Horario Final para Regra de Preço
- **regphorainicio**: Horario inicial para Regra de Preço
- **regpindice**: Indice da Regra de Preco
- **regpopcao**: Opcao da Regra: 0-Todos 1-Tipo 2-Seção 3-Grupo 4-Produto
- **regppagtocartdigi**: Regra Valida para Pgto em: Carteira Digital 0-Não 1-Sim
- **regppagtopix**: Regra Valida para Pgto em: Pix 0-Não 1-Sim
- **regppgtochq**: Regra Valida para Pgto em: Cheque a Vista 0-Não 1-Sim
- **regppgtocmp**: Regra Valida para Pgto em: Composição 0-Não 1-Sim
- **regppgtoctc**: Regra Valida para Pgto em: Cartao/TEF Credito 0-Não 1-Sim
- **regppgtoctd**: Regra Valida para Pgto em: Cartao/TEF Debito 0-Não 1-Sim
- **regppgtodepbanc**: Regra Valida para Pgto em: DEPOSITO BANCÁRIO 0-Não 1-Sim
- **regppgtodin**: Regra Valida para Pgto em: Dinheiro 0-Não 1-Sim
- **regppgtofre**: Regra Valida para Pgto em: Carta Frete 0-Não 1-Sim
- **regppgtopre**: Regra Valida para Pgto em: Cheque PRE 0-Não 1-Sim
- **regppgtoprz**: Regra Valida para Pgto em: Prazo 0-Não 1-Sim
- **regppgtoval**: Regra Valida para Pgto em: Vale 0-Não 1-Sim
- **regppgtovdaprgc**: Regra Válida para pgto em: Venda Programda 0-Não 1-Sim
- **regpprevalece**: Em Caso de Regras Aplicaveis Simultaneamente, Prevalece 0-Cliente 1-Geral
- **regpregrageral**: Regra Geral 0-Não 1-Sim
- **regpsemanadom**: Regra Valida para Vendas no Domingo 0-Não 1-Sim
- **regpsemanafer**: Regra Valida para Vendas em Feriados 0-Não 1-Sim
- **regpsemanaqua**: Regra Valida para Vendas na Quarta 0-Não 1-Sim
- **regpsemanaqui**: Regra Valida para Vendas na Quinta 0-Não 1-Sim
- **regpsemanasab**: Regra Valida para Vendas no Sabado 0-Não 1-Sim
- **regpsemanaseg**: Regra Valida para Vendas na Segunda 0-Não 1-Sim
- **regpsemanasex**: Regra Valida para Vendas na Sexta 0-Não 1-Sim
- **regpsemanater**: Regra Valida para Vendas na Terca 0-Não 1-Sim
- **regpsequencia**: Sequência da Regra de Preço Geral
- **regpsuspenso**: Regra Suspensa 0-Nao 1-Sim
- **regptipo**: Tipo da Regra de Preço: %C %- %+ $C $- $+ VF
- **regptiporegra**: Tipo da Regra de Venda (0=Regra de Preço/1=Restrição de Venda)

---

## REGPBAND

**4 campos documentados**

- **regpbandcodbandeira**: Código da Bandeira (TEFDCODIGO)
- **regpbandcodigo**: Codigo Sequencial
- **regpbandcodregra**: Código da Regra de Venda (REGPCODIGO)
- **regpbandoperacao**: 1-Credito 2-Debito 3-Cart. Digital

---

## REGPE

**3 campos documentados**

- **regpecodigo**: Codigo Sequencial
- **regpeempresa**: Codigo da Empresa
- **regperegra**: Codigo da Regra

---

## REGU

**5 campos documentados**

- **regucm**: Centimentros
- **regucodigo**: Codigo Sequencia
- **reguempresa**: Código Empresa(FK)
- **regumedida**: Medida
- **regutanque**: Tanque(FK)

---

## RELG

**6 campos documentados**

- **relgcodigo**: Codigo Sequencia
- **relgdata**: Data e Hora 
- **relgpktipo**: Pk Tipo
- **relgterminal**: Terminal
- **relgtipo**: Tipo
- **relgusuario**: Usuario

---

## REPF

**8 campos documentados**

- **repfcaixa**: Numero do Caixa
- **repfcodigo**: Codigo Sequencial do Repasse
- **repfdata**: Data e Hora do Repasse
- **repfempresa**: Numero da Empresa
- **repffrentista**: Codigo do Frentista (FK)
- **repfinicio**: Valor Inicial
- **repfsangria**: Codigo da Sangria Vinculada
- **repfvalor**: Valor do Repasse

---

## REPR

**7 campos documentados**

- **reprcodigo**: Codigo Sequencia (PK)
- **reprcodpart**: Codigo do Representante na tabela de Participante
- **reprdescricao**: Descrição
- **reprfatuvenc**: Dia de Vencimento da Fatura
- **reprlotefatu**: Gera Lote de Fatura 0-Não | 1-Sim
- **reprrepositorio**: Atualiza Repositorio 0-Nao| 1-Sim
- **reprsenha**: ID SENHA do Representante

---

## REPRDA

**7 campos documentados**

- **reprdacodigo**: Codigo Sequencia (PK)
- **reprdacodigopart**: (FK) Codigo Participante
- **reprdadescricao**: Descrição do Serviço
- **reprdafinal**: Final do Serviço
- **reprdainicio**: Inicio do Serviço
- **reprdatipo**: Tipo D - Desconto | A - Acrescimo
- **reprdavalor**: Valor do Serviço

---

## RGGR

**5 campos documentados**

- **rggrcodigo**: Codigo Sequencial
- **rggrgrupo**: Codigo do Grupo (FK)
- **rggrindice**: Indice %+ %- $+ $-
- **rggrregra**: Codigo da Regra (FK)
- **rggrvlr**: Valor

---

## RGPR

**5 campos documentados**

- **rgprcodigo**: Codigo Sequencial
- **rgprindice**: Indice %+ %- $+ $- VF
- **rgprproduto**: Codigo do Produto (FK)
- **rgprregra**: Codigo da Regra (FK)
- **rgprvlr**: Valor

---

## RGRA

**4 campos documentados**

- **rgracodigo**: Codigo Sequencial
- **rgradescricao**: Descricao
- **rgraempresa**: Empresa Liberadas
- **rgrasuspenso**: Regra Suspensa (S)im (N)ao

---

## RGRAE

**3 campos documentados**

- **rgraecodigo**: Codigo Sequencial
- **rgraeempresa**: Codigo da Empresa (FK)
- **rgraeregra**: Codigo da Regra (FK)

---

## RGSC

**5 campos documentados**

- **rgsccodigo**: Codigo Sequencial
- **rgscindice**: Indice %+ %- $+ $-
- **rgscregra**: Codigo da Regra (FK)
- **rgscsecao**: Codigo do Secao (FK)
- **rgscvlr**: Valor

---

## RGTP

**5 campos documentados**

- **rgtpcodigo**: Codigo Sequencial
- **rgtpindice**: Indice %+ %- $+ $-
- **rgtpregra**: Codigo da Regra (FK)
- **rgtptipo**: Codigo do Tipo (FK)
- **rgtpvlr**: Valor

---

## RIDZ

**6 campos documentados**

- **ridzcodigo**: Numero Sequencial
- **ridzempresa**: Código da Empresa(FK)
- **ridzreducaoz**: Numero fk da reducao Z
- **ridzsintegra**: Descricao do Totalizador usado no sintegra
- **ridztotalizador**: Descricao do Totalizador
- **ridzvalor**: Valor do Totalizador

---

## RPT

**10 campos documentados**

- **rptarquivo**: Arquivo do relatório
- **rptcodigo**: Codigo Sequencial
- **rptdescricao**: Descrição
- **rpteditavel**: Relatório pode ser alterado: 1 - Sim, 2 - Não
- **rptgrupo**: Grupo
- **rptinterface**: Interface: 0 - Profissional, 1 - Especialista
- **rptnivel**: Nível: Cadastro, Documentos Fiscais, Estoque, Livros, Financeiro, Utilitários, Acesso Restrito
- **rptobservacoes**: Observações
- **rptsequencia**: Sequencia de Exibição
- **rptvisivel**: Relatório pode ser visualizado pelo Usuário: 1 - Sim, 2 - Não

---

## RPTC

**20 campos documentados**

- **rptccamposql1**: Nome do campo 1. Deve ser o mesmo nome do Parametro SQL ex. :Param1 
- **rptccamposql2**: Nome do campo 2. Deve ser o mesmo nome do Parametro SQL ex. :Param2 
- **rptccodigo**: Codigo Sequencial
- **rptccodigorpt**: Codigo do SQL - FK
- **rptcdecimais**: Casas Decimais
- **rptcdescricao**: Descrição
- **rptcfixo1**: Valor 1 fixo/Valor Combo box(Valores separador por |)
- **rptcfixo2**: Valor 2 fixo/Valor Combo box(Valores separador por |)
- **rptchint1**: Hint do campo 1
- **rptchint2**: Hint do campo 2
- **rptcmacro**: Macro
- **rptcobrigatorio**: Obrigatório: 0-Sim,1-Não
- **rptcoperador**: Operador: 0 - Like, 1 - Igual, 2 - Intervalo, 3 - Maior ou Igual, 4 - Menor Igual, 5 - Diferente
- **rptcoperadorlinha**: Operador de linha 0-AND ,1-OR
- **rptcpadrao1**: Valor padrão para o campo 1
- **rptcpadrao2**: Valor padrão para o campo 2
- **rptcpesquisa**: Tipo de Pesquisa
- **rptcsequencia**: Sequencia de Exibição
- **rptcsimbolo**: Simbolo: 0-Cifrao, 1-Porcentagem, 2-SemSinal
- **rptctipo**: Tipo: 0-Texto,1-Inteiro,2-Numero,3-Lista,4-Data,5-Data/Hora,6-Pesquisa

---

## RPTE

**4 campos documentados**

- **rptecodigo**: Codigo Sequencial
- **rptecodigorpt**: Codigo do Relatório - FK
- **rpteempresa**: Codigo da empresa - FK
- **rpteliberado**: Liberado: 1 - Liberado, 2 - Bloqueado

---

## RPTF

**11 campos documentados**

- **rptfcodigo**: Código
- **rptfcodigopdv**: Código PK(PDV)
- **rptfcorrigido**: Situacao Corrigido 0-Não 1-Sim
- **rptfdata**: Data
- **rptfempresa**: Código PK(EMP)
- **rptffuncionario**: (FK) Codigo Funcionário
- **rptfhora1**: Hora 1
- **rptfhora2**: Hora 2
- **rptfhora3**: Hora 3
- **rptfhora4**: Hora 4
- **rptfliberapdv**: Libera PDV 0-Aguardando | 1-Pendente | 10-Sincronizado

---

## RPTN

**7 campos documentados**

- **rptncampo**: Campo retornado no nivel
- **rptncampodescricao**: Descrição retornado no nivel
- **rptncodigo**: Codigo Sequencial
- **rptncodigorpt**: Codigo do SQL - FK
- **rptncodigorpts**: Codigo do SQL - FK
- **rptndescricao**: Descrição
- **rptnsequencia**: Sequencia de Exibição/Valor SQL

---

## RPTO

**5 campos documentados**

- **rptocampo**: Campo a ordenar
- **rptocodigo**: Codigo Sequencial
- **rptocodigorpt**: Codigo do Relatório - FK
- **rptodescricao**: Descrição
- **rptoindice**: Indice para ordenação

---

## RPTP

**3 campos documentados**

- **rptpcodigo**: Codigo Sequencial
- **rptpcodigopwdn**: Codigo do Relatório - FK
- **rptpcodigorpt**: Codigo do Relatório - FK

---

## RPTR

**27 campos documentados**

- **rptralinhamento**: Alinhar texto: 0 - Esquerda, 1 - Direita, 2 - Centro
- **rptraltura**: Altura do campo
- **rptrbordabaixo**: Borda Altura: 0 - Não, 1 - Sim
- **rptrbordadireita**: Borda Direita: 0 - Não, 1 - Sim
- **rptrbordaesquerda**: Borda Esquerda: 0 - Não, 1 - Sim
- **rptrbordatopo**: Borda Topo: 0 - Não, 1 - Sim
- **rptrcampo**: Campo
- **rptrcodigo**: Codigo Sequencial
- **rptrcodigorpts**: Codigo do SQL do Relatório - FK
- **rptrdecimais**: Casas Decimais
- **rptrfonte**: Fonte
- **rptrfontecor**: Cor da fonte
- **rptrfonteitalico**: Fonte Italico: 0 - Não, 1 - Sim
- **rptrfontenegrito**: Fonte Negrito: 0 - Não, 1 - Sim
- **rptrfonteriscado**: Fonte Riscado: 0 - Não, 1 - Sim
- **rptrfontesublinhado**: Fonte Sublinhado: 0 - Não, 1 - Sim
- **rptrfontetamanho**: Tamanho da fonte
- **rptrfundocor**: Cor do fundo
- **rptrhabilitar**: Habilitar: 0 - Não, 1 - Sim
- **rptrposicao**: Posição do campo
- **rptrsimbolo**: Simbolo: 0-Cifrao, 1-Porcentagem, 2-SemSinal
- **rptrtabela**: Tabela
- **rptrtamanho**: Tamanho do campo
- **rptrtipocampo**: Tipo do campo: 0-Texto,1-Inteiro,2-Numero,3-Data,4-Data/Hora
- **rptrtitulo**: Título do Campo
- **rptrtopo**: Topo do campo
- **rptrtotalizar**: Totalizar: 0 - Não, 1 - Somar, 2 - Contar, 3 - Média, 4 - Menor, 5 - Maior

---

## RPTS

**10 campos documentados**

- **rptsalterado**: SQL Alterado: 1 - Sim, 2 - Não
- **rptscodigo**: Codigo Sequencial
- **rptscodigorpt**: Codigo do relatório
- **rptsdescricao**: Descrição
- **rptsnome**: Nome da query
- **rptsordem**: SQL Pode ser ordenado: 1 - Sim, 2 - Não
- **rptspaifilho**: Campo desse SQL que será relacionado com o pai
- **rptspaimaster**: Campo de relacionamento com o SQL pai
- **rptspainome**: Nome da query pai
- **rptssql**: SQL

---

## RVCO

**8 campos documentados**

- **rvcocodigo**: Codigo Sequencial
- **rvcoempresa**: Codigo da Empresa
- **rvcoestados**: Estados habilitados
- **rvcoinativo**: Data Inativo
- **rvcoishub**: Operadora RVHub 0-Não | 1-Sim
- **rvcomodelooperadora**: Modelo Operadora
- **rvconome**: Nome do produto
- **rvcooperadora**: Codigo Operadora

---

## RVCP

**13 campos documentados**

- **rvcpbonus**: Valor Bônus
- **rvcpcodigo**: Código Sequencial
- **rvcpcodigoarea**: Codigo de area que o produto atente. EX 11|18
- **rvcpcusto**: Custo Produto
- **rvcpempresa**: Código da Empresa
- **rvcpishub**: Operadora RVHub 0-Não | 1-Sim
- **rvcpmensagem**: Mensagem Produto
- **rvcpmodelorecarga**: Modelo Recarga
- **rvcpnome**: Nome Produto
- **rvcpoperadora**: Código Operadora (FK)
- **rvcpproduto**: Código Produto
- **rvcpvalidade**: Validade em dias
- **rvcpvenda**: Valor de Venda Produto

---

## RVND

**8 campos documentados**

- **rvndcodigo**: Codigo Sequencial
- **rvnddata**: Data e Hora da Reserva
- **rvndmodelo**: Modelo do Documento 55,65
- **rvndmotivo**: Motivo da Reserva
- **rvndnumero**: Numero do Documento
- **rvndsequenciauso**: Sequencia de Venda usada Reserva
- **rvndserie**: Serie do Documento
- **rvndusuario**: Usuario Responsavel pela Reserva

---

## SAQPAY

**17 campos documentados**

- **saqpaycodigo**: Codigo Sequencial
- **saqpaycodigovda**: Codigo VDA
- **saqpaydata**: Data Transação
- **saqpayempresa**: Codigo Empresa
- **saqpayidexterno**: ID Externo Transação
- **saqpayjsoncancelenvio**: Json Cancelamento Envio
- **saqpayjsoncancelretorno**: Json Cancelamento Retorno
- **saqpayjsonstatusretorno**: Json Status Retorno
- **saqpayjsonvendaenvio**: Json Venda Envio
- **saqpayjsonvendaretorno**: Json Venda Retorno
- **saqpaypdvmovel**: PDV Móvel 1-Sim|0-Não
- **saqpayqrcode**: QR Code
- **saqpaystatus**: Status Transação
- **saqpayterminal**: Identificação Terminal
- **saqpaytipo**: Tipo Transação 1-Venda|2-Saque
- **saqpayuuid**: UUID Transação
- **saqpayvalor**: Valor Transação

---

## SAT

**14 campos documentados**

- **satambiente**: 0-Indisponivel | 1-Producao | 2-Emulador | 3-Tanca SDK | 4-Producao (MFE) |5-Homologacao (MFE)
- **satassinatura**: Assinatura SAT
- **satcodigo**: Codigo Sequencial
- **satempresa**: Código da Empresa (Fk)
- **satextratoavancado**: Extrato Avançado
- **satextratoimpressora**: Nome da impressora
- **satextratoitens**: Exibir Detalhamento dos Itens 0-Não | 1-Sim
- **satimpressorasweda**: Correcao Bug Sweda 0-Não | 1-Sim
- **satindregra**: Ind Regra SAT A-Arredondar | T-Truncar
- **satlayoutxml**: Layout Padrão XML
- **satlinedelimiter**: Delimitador de linhas XML SAT
- **satmodoprint**: MODO DE IMPRESSãO DO EXTRATO SEM CLIENTE 1.DIGITO:FECHAMENTO NORMAL 2.DIGITO:FECHAMENTO RAPIDO 0-Não Imprimir 1-Impressão Resumida 2-Impressão Completa 3-Solicitar Impressao
- **satobservacao**: OBSERVACAO PADRAO DO SAT
- **satversaoesquema**: VERSAO DO ESQUEMA DE LIBERACAO (SCHEMAS XML) 0-ve0006|1-ve0007

---

## SERI

**26 campos documentados**

- **serialiqcofins**: Alíquota COFINS
- **serialiqcsll**: Alíquota CSLL
- **serialiqinss**: Alíquota INSS
- **serialiqirpf**: Alíquota IRPF
- **serialiqirpj**: Alíquota IRPJ
- **serialiqissqn**: Alíquota ISSQN
- **serialiqpis**: Alíquota PIS
- **seribasecofins**: Base de Cálculo COFINS
- **seribasecsll**: Base de Cálculo CSLL
- **seribaseinss**: Base de Cálculo INSS
- **seribaseirpf**: Base de Cálculo IRPF
- **seribaseirpj**: Base de Cálculo IRPJ
- **seribaseissqn**: Base de Cálculo ISSQN
- **seribasepis**: Base de Cálculo PIS
- **sericodigo**: Código
- **sericodigoserv**: Codigo Servico (FK)
- **sericstpc**: Codigo CSTPC
- **seriservico**: Servico
- **serivalor**: Cliente
- **serivlrcofins**: Valor COFINS
- **serivlrcsll**: Valor INSS
- **serivlrinss**: Valor INSS
- **serivlrirpf**: Valor IRPF
- **serivlrirpj**: Valor IRPJ
- **serivlrissqn**: Valor ISSQN
- **serivlrpis**: Valor PIS

---

## SERV

**30 campos documentados**

- **servaliqcofins**: Alíquota COFINS
- **servaliqcsll**: Alíquota CSLL
- **servaliqinss**: Alíquota INSS
- **servaliqirpf**: Alíquota IRPF
- **servaliqirpj**: Alíquota IRPJ
- **servaliqissqn**: Alíquota ISSQN
- **servaliqpis**: Alíquota PIS
- **servbasecofins**: Base de Cálculo COFINS
- **servbasecsll**: Base de Cálculo CSLL
- **servbaseinss**: Base de Cálculo INSS
- **servbaseirpf**: Base de Cálculo IRPF
- **servbaseirpj**: Base de Cálculo IRPJ
- **servbaseissqn**: Base de Cálculo ISSQN
- **servbasepis**: Base de Cálculo PIS
- **servchave**: Chave da Nota
- **servcliente**: Cliente
- **servcodigo**: Código
- **servcodigoemp**: Código da Empresa
- **servdata**: Data
- **servemitente**: 0(Emissão Própria) e 1(Emissão Terceiros)
- **servnumero**: Numero Servico
- **servoperacao**: 0(Serviço Contratado) e 1(Serviço Prestado)
- **servpagamento**: 0(À Vista) 1(À Prazo) 9(Sem Pagamento)
- **servvlrcofins**: Valor COFINS
- **servvlrcsll**: Valor INSS
- **servvlrinss**: Valor INSS
- **servvlrirpf**: Valor IRPF
- **servvlrirpj**: Valor IRPJ
- **servvlrissqn**: Valor ISSQN
- **servvlrpis**: Valor PIS

---

## SERVPP

**10 campos documentados**

- **servppcdescodigo**: Código Centro de despesas CDES
- **servppcodigo**: Codigo Sequencial
- **servppdre**: Código DRE
- **servppempresa**: Código Tabela EMP (FK)
- **servppgdescodigo**: Código Grupo de despesas GDES
- **servppobs**: Obs
- **servpporigem**: Codigo da TLEN (FK)
- **servpppaga**: Código Tabela PAGA (FK)
- **servppvalor**: Valor da Parcela
- **servppvencimento**: Vencimento da Parcela

---

## SHAV

**10 campos documentados**

- **shavaviso**: Descrição do Aviso
- **shavcodigo**: Codigo Sequencial
- **shavdata**: Data e Hora do Aviso
- **shavleituradt**: Leitura do Aviso - Data e Hora
- **shavleiturarp**: Leitura do Aviso - Envio Repositorio 0-Atualizado 1-Pendente
- **shavleituratr**: Leitura do Aviso - Terminal
- **shavleituraus**: Leitura do Aviso - Usuario
- **shavlink**: Link do Aviso
- **shavtipo**: Tipo do Aviso 0-Aviso | 1-Urgente
- **shavtitulo**: Titulo do Aviso

---

## SHLC

**3 campos documentados**

- **shlccodigo**: Codigo Sequencial
- **shlcdescricao**: Descrição da Licenca
- **shlcstatus**: Status : 0-Verde:OK 1-Vermelho:NãoLocalizado 2-Cinza:Inativo

---

## SHRL

**8 campos documentados**

- **shrlcaption**: Caption Original do Relatorio
- **shrlcodigo**: Codigo Sequencial
- **shrldescricao**: Descrição do Relatorio
- **shrlid**: ID do Relatorio
- **shrlnivelgrupo**: Nível de Grupo
- **shrlnivelgrupox**: Descrição do Nível do Grupo
- **shrlparametros**: Parametros
- **shrltitulo**: Titulo do Relatorio

---

## SHTF

**4 campos documentados**

- **shtfcodigo**: Codigo da Tarefa
- **shtfdescricao**: Descrição da Tarefa
- **shtfempresa**: Código da Empresa(FK)
- **shtflibera**: Liberação do Acesso

---

## SHVC

**9 campos documentados**

- **shvcano**: Ano
- **shvccodigo**: Codigo Sequencial
- **shvccombustivel**: Combustivel
- **shvcdia**: Dia
- **shvchora**: Hora
- **shvcmes**: Mes
- **shvcqtd**: Qtd
- **shvcrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **shvcvlr**: Vlr

---

## SHVP

**9 campos documentados**

- **shvpano**: Ano
- **shvpcodigo**: Codigo Sequencial
- **shvpdia**: Dia
- **shvphora**: Hora
- **shvpmes**: Mes
- **shvppgto**: Forma de Pagamento
- **shvpqtd**: Qtd
- **shvprepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **shvpvlr**: Vlr

---

## SHVS

**9 campos documentados**

- **shvsano**: Ano
- **shvscodigo**: Codigo Sequencial
- **shvsdia**: Dia
- **shvshora**: Hora
- **shvsmes**: Mes
- **shvsqtd**: Qtd
- **shvsrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **shvssecao**: Secao
- **shvsvlr**: Vlr

---

## SHVV

**9 campos documentados**

- **shvvano**: Ano
- **shvvcodigo**: Codigo Sequencial
- **shvvdia**: Dia
- **shvvhora**: Hora
- **shvvmes**: Mes
- **shvvqtd**: Qtd
- **shvvrepositorio**: Atualiza Repositorio 0-Não | 1-Sim
- **shvvvendedor**: Vendedor
- **shvvvlr**: Vlr

---

## SIGC

**2 campos documentados**

- **sigccor**: Codigo da Cor
- **sigcsigla**: Sigla do Cadastro

---

## SLTB

**7 campos documentados**

- **sltbarquivado**: Arquivado (Data)
- **sltbcodigo**: Código
- **sltbcompetencia**: Competência
- **sltbdatabase**: Data Base
- **sltbdescricao**: Descricao
- **sltbtemarquivo**: Tem Arquivo Sim-Não
- **sltbtememail**: Tem Email Sim-Não

---

## SLTE

**6 campos documentados**

- **sltecodigo**: Código
- **sltedatahora**: Data e hora do registro
- **sltedestinatario**: E-mail do destinatario
- **slteemail**: Descricao do Email
- **slteservico**: Codigo do Servico (fk)
- **slteusuario**: Usuario

---

## SLTH

**5 campos documentados**

- **slthcodigo**: Código
- **slthdatahora**: Data e hora do registro
- **slthdescricao**: Descricao
- **slthservico**: Codigo do Servico (fk)
- **slthusuario**: Usuario

---

## SLTQ

**5 campos documentados**

- **sltqarquivo**: Caminho do Arquivo
- **sltqcodigo**: Código
- **sltqdata**: Data
- **sltqservico**: Servico (Fk)
- **sltqusuario**: Usuario

---

## SLTS

**5 campos documentados**

- **sltscliente**: Codigo do Cliente (FK)
- **sltscodigo**: Código
- **sltsconcluido**: Ano Base
- **sltslote**: Codigo (FK)
- **sltsusuario**: Usuario

---

## SPED

**17 campos documentados**

- **spedcartao**: Gerar CARTAO no Sped
- **spedciap**: Gerar Bloco G - CIAP
- **speddiafinal**: Dia de Apuração Final
- **speddiainicial**: Dia de Apuração Inicial
- **spedempresa**: Código da Empresa
- **spedenvio**: Arquivo Envidado
- **spedestoque**: Periodo do Estoque
- **spedlmc**: Gerar LMC no Sped
- **spedmovimento**: Gerar Movimento(Bloco C/D) no Sped
- **spedperiodo**: Periodo do Sped
- **spedresumo**: Resumo Envidado
- **spedsaldocofins**: Saldo de COFINS do Periodo Anterior
- **spedsaldoicms**: Saldo de ICMS   do Periodo Anterior
- **spedsaldopis**: Saldo de PIS    do Periodo Anterior
- **spedvalido**: Periodo Validado
- **spedvlrsaidatribciap**: Valor do somatório das saídas tributadas e saídas para exportação
- **spedvlrtotalsaidaciap**: Valor total de saídas

---

## SPEDCONFIG

**9 campos documentados**

- **spedconfigcartao**: Gerar CARTAO no Sped
- **spedconfigcodigo**: Sequencia do SPEDCONFIG
- **spedconfigdiafinal**: Dia de Apuração Final
- **spedconfigdiainicial**: Dia de Apuração Inicial
- **spedconfigencerperiodo**: Tipo de encerramento do Periodo (Bloco H) no Sped -> 1-Fechamento Periodo(31/12) | 2-Mês Corrente (Ultimo dia do Mês do SPED) | 3-Data (Data configurada pelo Cliente)
- **spedconfigestoque**: Periodo do Estoque
- **spedconfiglmc**: Gerar LMC no Sped
- **spedconfigmovimento**: Gerar Movimento(Bloco C/D) no Sped
- **spedconfigperiodo**: Periodo do Sped

---

## SPEDCONFIGEMP

**2 campos documentados**

- **spedconfigempcodigo**: Sequencia do SPEDCONFIG
- **spedconfigempcodigoconfig**: Sequencia do SPEDCONFIG

---

## SPEDP_0000

**15 campos documentados**

- **cnpj**: CNPJ
- **cod_mun**: Código Municipio
- **cod_ver**: Código da Versão
- **dt_fin**: Data Final das Informações
- **dt_ini**: Data Inicial das Informações
- **ind_ativ**: Indicador de Tipo de Atividade
- **ind_nat_pj**: Indicador da Natureza Pessoa Jurídica
- **ind_sit_esp**: Indicador de Situação Especial
- **index**: Codigo Sequencial
- **nome**: Empresa
- **num_rec_anterior**: Número do Recebido da Escrituração
- **reg**: Registro
- **suframa**: Código Suframa
- **tipo_escrit**: Tipo de Escrituração
- **uf**: UF

---

## SPEDP_0100

**15 campos documentados**

- **bairro**: Bairro
- **cep**: CEP
- **cnpj**: CNPJ
- **cod_mun**: Código Município
- **compl**: Complemento
- **cpf**: CPF
- **crc**: CRC
- **email**: Email
- **endereco**: Endereço
- **fax**: Fax
- **fone**: Fone
- **index**: Codigo Sequencial
- **nome**: Nome do Contador
- **num**: Número do Imóvel
- **reg**: Registro

---

## SPEDP_0140

**10 campos documentados**

- **cnpj**: CNPJ
- **cod_est**: Código Identificação do Estabelecimento
- **cod_mun**: Código do Município
- **ie**: IE
- **im**: Inscrição Municipal
- **index**: Codigo Sequencial
- **nome**: Nome
- **reg**: Registro
- **suframa**: Código Suframa
- **uf**: UF

---

## SPEDP_0150

**14 campos documentados**

- **bairro**: Bairro
- **cnpj**: CNPJ
- **cod_mun**: Código Município
- **cod_pais**: Código do País
- **cod_part**: Código do Participante
- **compl**: Complemento
- **cpf**: CPF
- **endereco**: Endereço
- **ie**: Inscrição Estadual
- **index**: Codigo Sequencial
- **nome**: Nome
- **num**: Número do Imóvel
- **reg**: Registro
- **suframa**: Código Suframa

---

## SPEDP_0190

**4 campos documentados**

- **descr**: Descrição
- **index**: Codigo Sequencial
- **reg**: Registro
- **unid**: Código da Unidade de Medida

---

## SPEDP_0200

**13 campos documentados**

- **aliq_icms**: Aliquota de ICMS
- **cod_ant_ite**: Código Anterior do Item
- **cod_barra**: Código Barra
- **cod_gen**: Código do Gênero
- **cod_item**: Código
- **cod_lst**: Código do Serviço
- **cod_ncm**: Código NCM
- **descr_item**: Descrição
- **ex_ipi**: Código EX
- **index**: Codigo Sequencial
- **reg**: Registro
- **tipo_item**: Tipo do Item
- **unid_inv**: Unidade de Medida

---

## SPEDP_0206

**3 campos documentados**

- **cod_comb**: Código combustível ANP
- **index**: Codigo Sequencial
- **reg**: Registro

---

## SPEDP_0400

**4 campos documentados**

- **cod_nat**: Código Natureza de Operação
- **descr_nat**: Descrição da Natureza
- **index**: Codigo Sequencial
- **reg**: Registro

---

## SPEDP_0500

**10 campos documentados**

- **cnpj_est**: Cnpj do Estabelecimento, no Caso da Conta Informada no Campo COD_CTA
- **cod_cta**: Código da Conta Analitica / Grupo de Contas
- **cod_cta_ref**: Codigo da Conta Correlacionada no Plano de Contas
- **cod_nat_cc**: Código da Natureza da Conta / Grupo de Contas
- **dt_alt**: Data da Inclusão/Alteração
- **ind_cta**: Tipo de indicador
- **index**: Codigo Sequencial
- **nivel**: Nivel da Conta Analitica
- **nome_cta**: Nome da Conta Analitica / Grupo de Contas
- **reg**: Registro

---

## SPEDP_C100

**30 campos documentados**

- **chv_nfe**: Chave Nota Fiscal Eletrônica
- **cod_mod**: Código Modelo Fiscal
- **cod_part**: Código do Participante
- **cod_sit**: Código da Situação do Documento Fiscal
- **dt_doc**: Data de Emissão
- **dt_e_s**: Data de Entrada ou Saída
- **ind_emit**: Indicador do Emitente
- **ind_frt**: Indicador do Tipo de Frete
- **ind_oper**: Indicador do Tipo de Operação
- **ind_pgto**: Indicador do Tipo de Pagamento
- **index**: Codigo Sequencial
- **num_doc**: Número do Documento Fiscal
- **reg**: Registro
- **ser**: Série do Documento Fiscal
- **vl_abat_nt**: Valor de Abatimento
- **vl_bc_icms**: Valor de Base do ICMS
- **vl_bc_icms_st**: Valor de Base do ICMS ST
- **vl_cofins**: Valor Total do COFINS
- **vl_cofins_st**: Valor Total do COFINS retido por ST
- **vl_desc**: Valor do Desconto
- **vl_doc**: Valor do Documento
- **vl_frt**: Valor do Frete
- **vl_icms**: Valor do ICMS
- **vl_icms_st**: Valor do ICMS retido por ST
- **vl_ipi**: Valor Total do IPI
- **vl_merc**: Valor da Mercadoria/Serviço
- **vl_out_da**: Valor de Outras Despesas
- **vl_pis**: Valor Total do PIS
- **vl_pis_st**: Valor Total do PIS retido por ST
- **vl_seg**: Valor do Seguro

---

## SPEDP_C170

**39 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofinss**: Alíquota da COFINS(R$)
- **aliq_icms**: Alíquota do ICMS
- **aliq_ipi**: Alíquota do IPI
- **aliq_pis**: Alíquota do PIS(%)
- **aliq_piss**: Alíquota do PIS(R$)
- **aliq_st**: Alíquota do ICMS
- **cfop**: CFOP
- **cod_cta**: Código da Conta Analítica Contábil(creditada/debitada)
- **cod_enq**: Código do Enquadramento
- **cod_item**: Código do Item
- **cod_nat**: Código da Natureza de Operação
- **cst_cofins**: Código da ST referente ao COFINS
- **cst_icms**: Código da ST referente ao ICMS
- **cst_ipi**: Código da ST
- **cst_pis**: Código da ST referente ao PIS
- **descr_compl**: Descrição do Item
- **ind_apur**: Indicador de Período de Apuração
- **ind_mov**: Indicador de Movimentação do Item
- **index**: Codigo Sequencial
- **indexc100**: Chave estrangeira com o C100
- **num_item**: Número Sequencial do Item
- **qtd**: Quantidade
- **quant_bc_cofins**: Quantidade Base de Cálculo COFINS
- **quant_bc_pis**: Quantidade Base de Cálculo PIS/PASEP
- **reg**: Registro
- **unid**: Unidade
- **vl_bc_cofins**: Valor de Base de Cálculo da COFINS
- **vl_bc_icms**: Valor da Base de Cálculo do ICMS
- **vl_bc_icms_st**: Valor da Base de Cálculo referente à ST
- **vl_bc_ipi**: Valor de Base de Cálculo do IPI
- **vl_bc_pis**: Valor de Base de Cálculo do PIS
- **vl_cofins**: Valor da COFINS
- **vl_desc**: Valor de Desconto
- **vl_icms**: Valor do ICMS(creditado/debitado)
- **vl_icms_st**: Valor do ICMS referente à ST
- **vl_ipi**: Valor do IPI(creditado/debitado)
- **vl_item**: Valor do Item
- **vl_pis**: Valor do PIS

---

## SPEDP_C175

**20 campos documentados**

- **aliq_cofins**: Alíquota do COFINS
- **aliq_cofins_quant**: Quantidade Alíquota do COFINS
- **aliq_pis**: Alíquota do PIS/PASEP
- **aliq_pis_quant**: Quantidade Alíquota do PIS/PASEP
- **cfop**: Cfop
- **cod_cta**: Código da Conta Analítica Contábil(creditada/debitada)
- **cst_cofins**: Código da ST referente ao COFINS
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **indexc100**: Chave estrangeira com o C100
- **info_compl**: Informação Complementar
- **quant_bc_cofins**: Base de Cálculo COFINS
- **quant_bc_pi**: Base de Cálculo PIS/PASEP
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo COFINS
- **vl_bc_pis**: Valor da Base de Cálculo PIS/PASEP
- **vl_cofins**: Valor do COFINS
- **vl_desc**: Valor Desconto
- **vl_opr**: Valor da Operação
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C180

**9 campos documentados**

- **cod_item**: Código Item
- **cod_mod**: Código Modelo da Nota Fiscal Eletrônica
- **cod_ncm**: Código NCM
- **dt_doc_fin**: Data de Emissão Final
- **dt_doc_ini**: Data de Emissão Inicial
- **ex_ipi**: Código EX
- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_tot_item**: Valor Total do Item

---

## SPEDP_C181

**13 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **aliq_pis_quant**: Alíquota do PIS/PASEP(R$)
- **cfop**: CFOP
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **indexc180**: Chave estrangeira com o C180
- **quant_bc_pis**: Quantidade Base de Cálculo PIS/PASEP
- **reg**: Registro
- **vl_bc_pis**: Valor da Base de Cálculo do PIS/PASEP
- **vl_desc**: Valor do Desconto
- **vl_item**: Valor do Item
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C185

**13 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cfop**: CFOP
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **indexc180**: Chave estrangeira com o C180
- **quant_bc_cofins**: Quantidade Base de Cálculo COFINS
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_desc**: Valor do Desconto
- **vl_item**: Valor do Item

---

## SPEDP_C190

**9 campos documentados**

- **cod_item**: Código Item
- **cod_mod**: Código Modelo da Nota Fiscal Eletrônica
- **cod_ncm**: Código NCM
- **dt_ref_fin**: Data Final de Referência da Consolidação
- **dt_ref_ini**: Data Inicial de Referência da Consolidação
- **ex_ipi**: Código EX
- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_tot_item**: Valor Total do Item

---

## SPEDP_C191

**14 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **aliq_pis_quant**: Alíquota do PIS/PASEP(R$)
- **cfop**: CFOP
- **cnpj_cpf_part**: CNPJ/CPF do Participante
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **indexc190**: Chave estrangeira com o C190
- **quant_bc_pis**: Quantidade Base de Cálculo PIS/PASEP
- **reg**: Registro
- **vl_bc_pis**: Valor da Base de Cálculo do PIS/PASEP
- **vl_desc**: Valor do Desconto
- **vl_item**: Valor do Item
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C195

**14 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cfop**: CFOP
- **cnpj_cpf_part**: CNPJ/CPF do Participante
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **indexc190**: Chave estrangeira com o C190
- **quant_bc_cofins**: Quantidade Base de Cálculo COFINS
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_desc**: Valor do Desconto
- **vl_item**: Valor do Item

---

## SPEDP_C400

**6 campos documentados**

- **cod_mod**: Código Modelo Fiscal
- **ecf_cx**: Número do Caixa atribuído ao ECF
- **ecf_fab**: Número de Série de Fabricação do ECF
- **ecf_mod**: Modelo do Equipamento
- **index**: Codigo Sequencial
- **reg**: Registro

---

## SPEDP_C405

**9 campos documentados**

- **cro**: Posição do Contador de Reinicio de Operação
- **crz**: Posição do Contador de Redução Z
- **dt_doc**: Data Movimento
- **gt_fin**: Valor do Grande Total Final
- **index**: Codigo Sequencial
- **indexc400**: Chave estrangeira com o C400
- **num_coo_fin**: Número do Contador de Ordem de Operação
- **reg**: Registro
- **vl_brt**: Valor da Venda Burta

---

## SPEDP_C481

**12 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **aliq_pis_quant**: Alíquota do PIS/PASEP(R$)
- **cod_cta**: Código da Conta Análitica Contábil(debitada/creditada)
- **cod_item**: Código do Item
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **indexc405**: Chave estrangeira com o C405
- **quant_bc_pis**: Quantidade Base de Cálculo PIS/PASEP
- **reg**: Registro
- **vl_bc_pis**: Valor Base de Cálculo do PIS/PASEP
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C485

**12 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cod_cta**: Código da Conta Análitica Contábil(debitada/creditada)
- **cod_item**: Código do Item
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **indexc405**: Chave estrangeira com o C405
- **quant_bc_cofins**: Quantidade Base de Cálculo COFINS
- **reg**: Registro
- **vl_bc_cofins**: Valor Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_item**: Valor Total dos Itens

---

## SPEDP_C490

**5 campos documentados**

- **cod_mod**: Código do Modelo de Documento Fiscal
- **dt_doc_fin**: Data de Emissão Final dos Documentos
- **dt_doc_ini**: Data de Emissão Inicial dos Documentos
- **index**: Codigo Sequencial
- **reg**: Registro

---

## SPEDP_C491

**12 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **aliq_pis_quant**: Alíquota do PIS/PASEP(R$)
- **cfop**: CFOP
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cod_item**: Código do Item
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **quant_bc_pis**: Quantidade Base de Cálculo PIS/PASEP
- **reg**: Registro
- **vl_bc_pis**: Valor da Base de Cálculo do PIS/PASEP
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C495

**12 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cfop**: CFOP
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cod_item**: Código do Item
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **quant_bc_cofins**: Quantidade Base de Cálculo COFINS
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_item**: Valor Total dos Itens

---

## SPEDP_C500

**14 campos documentados**

- **cod_inf**: Código da Informação Complementar
- **cod_part**: Código do Participante
- **cod_sit**: Código da Situação do Documento
- **dt_doc**: Data de Emissão do Documento Fiscal
- **dt_ent**: Data de Entrada
- **index**: Codigo Sequencial
- **num_doc**: Número do Documento Fiscal
- **reg**: Registro
- **ser**: Série do Documento Fiscal
- **sub**: SubSérie do Documento Fiscal
- **vl_cofins**: Valor da COFINS
- **vl_doc**: Valor Total do Documento
- **vl_icms**: Valor Acumulado ICMS
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C501

**9 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito
- **reg**: Registro
- **vl_bc_pis**: Valor Base de Cálculo do PIS/PASEP
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_C505

**9 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito
- **reg**: Registro
- **vl_bc_cofins**: Valor Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_item**: Valor Total dos Itens

---

## SPEDP_C860

**7 campos documentados**

- **cod_mod**: Código do Modelo de Documento Fiscal
- **doc_fim**: Número do Documento Final
- **doc_ini**: Número do Documento Inicial
- **dt_doc**: Data da Emissão do Cupom Fiscal
- **index**: Codigo Sequencial
- **nr_sat**: Número de Série do Equipamento SAT
- **reg**: Registro

---

## SPEDP_C870

**16 campos documentados**

- **aliq_cofins**: Alíquota do COFINS
- **aliq_pis**: Alíquota do PIS/PASEP
- **cfop**: Código Fiscal de Operação e Prestação
- **cod_cta**: Código da Conta Analítica Contábil D/C
- **cod_item**: Código do Item
- **cst_cofins**: Código da Situação Tributária referente ao COFINS
- **cst_pis**: Código da Situação Tributária referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **indexc860**: Chave C860
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo da COFINS
- **vl_bc_pis**: Valor da Base de Cálculo do PIS/PASEP
- **vl_cofins**: Valor da COFINS
- **vl_desc**: Valor da Exclusão/Desconto comercial dos Itens
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_D010

**3 campos documentados**

- **cnpj**: CNPJ
- **index**: Codigo Sequencial
- **reg**: Registro

---

## SPEDP_D100

**24 campos documentados**

- **chv_cte**: Chave do Conhecimento de Transporte Eletrônico
- **chv_cte_ref**: Chave do CT-e
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cod_inf**: Código da Informação Complementar
- **cod_mod**: Código do Modelo de Documento Fiscal
- **cod_part**: Código do Participante
- **cod_sit**: Código da Situação do Documento Fiscal
- **dt_a_p**: Data da Aquisição ou da Prestação de Serviço
- **dt_doc**: Data de Emissão do Documento Fiscal
- **ind_emit**: Indicador do Emitente
- **ind_frt**: Indicador do Tipo de Frete
- **ind_oper**: Indicador do Tipo de Operação
- **index**: Codigo Sequencial
- **num_doc**: Número do Documento Fiscal
- **reg**: Registro
- **ser**: Série do Documento Fiscal
- **sub**: SubSérie do Documento Fiscal
- **tp_cte**: Tipo de Conhecimento de Transporte Eletrônico
- **vl_bc_icms**: Valor Base de Cálculo do ICMS
- **vl_desc**: Valor do Desconto
- **vl_doc**: Valor Total do Documento Fiscal
- **vl_icms**: Valor do ICMS
- **vl_nt**: Valor Não tributado do ICMS
- **vl_serv**: Valor Total da Prestação de Serviço

---

## SPEDP_D101

**10 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **ind_nat_frt**: Indicador da Natureza do Frete
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código Base de Cálculo de Crédito
- **reg**: Registro
- **vl_bc_pis**: Valor Base de Cálculo do PIS/PASEP
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_D105

**10 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS
- **ind_nat_frt**: Indicador da Natureza do Frete
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código Base de Cálculo de Crédito
- **reg**: Registro
- **vl_bc_cofins**: Valor Base de Cálculo do COFINS
- **vl_cofins**: Valor do COFINS
- **vl_item**: Valor Total dos Itens

---

## SPEDP_D500

**23 campos documentados**

- **cod_inf**: Código da Informação Complementar
- **cod_mod**: Código do Modelo do Documento Fiscal
- **cod_part**: Código do Participante
- **cod_sit**: Código da Situação do Documento Fiscal
- **dt_a_p**: Data da Entrada(Aquisição)
- **dt_doc**: Data de Emissão do Documento Fiscal
- **ind_emit**: Indicador do Emitente
- **ind_oper**: Indicador do Tipo de Operação
- **index**: Codigo Sequencial
- **num_doc**: Número do Documento Fiscal
- **reg**: Registro
- **ser**: Série do Documento Fiscal
- **sub**: SubSérie do Documento Fiscal
- **vl_bc_icms**: Valor Base de Cálculo do ICMS
- **vl_cofins**: Valor da COFINS
- **vl_da**: Valor de Outras Despesas
- **vl_desc**: Valor de Desconto
- **vl_doc**: Valor Total do Documento Fiscal
- **vl_icms**: Valor do ICMS
- **vl_pis**: Valor do PIS/PASEP
- **vl_serv**: Valor da Prestação de Serviços
- **vl_serv_nt**: Valor Total dos Serviços Não tributados pelo ICMS
- **vl_terc**: Valor Cobrado em Nome de Terceiros

---

## SPEDP_D501

**9 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito
- **reg**: Registro
- **vl_bc_pis**: Valor da Base de Cálculo PIS/PASEP
- **vl_item**: Valor Total dos Itens
- **vl_pis**: Valor do PIS/PASEP

---

## SPEDP_D505

**9 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo COFINS
- **vl_cofins**: Valor do COFINS
- **vl_item**: Valor Total dos Itens

---

## SPEDP_M100

**16 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(%)
- **aliq_pis_quant**: Alíquota do PIS(R$)
- **cod_cred**: Código de Tipo de Crédito Apurado no Período
- **ind_cred_ori**: Indicador de Crédito
- **ind_desc_cred**: Indicador de Crédito
- **index**: Codigo Sequencial
- **quant_bc_pis**: Quantidade - Base de Cálculo PIS
- **reg**: Registro
- **sld_cred**: Saldo de Créditos a utilizar em Períodos futuros
- **vl_ajus_acres**: Valor Total dos Ajustes de Acréscimo
- **vl_ajus_reduc**: Valor Total dos Ajustes de Redução
- **vl_bc_pis**: Valor da Base de Cálculo do Crédito
- **vl_cred**: Valor Total do Crédito Apurado no Período
- **vl_cred_desc**: Valor do Crédito disponível
- **vl_cred_dif**: Valor Total do Crédito diferido no Período
- **vl_cred_disp**: Valor Total do Crédito disponível relativo ao Período

---

## SPEDP_M105

**12 campos documentados**

- **cod_cred**: Código de Tipo de Crédito Apurado no Período
- **cst_pis**: Código da Situação Tributária referente ao Crédito de PIS/PASEP
- **desc_cred**: Descrição do Crédito
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito Apurado no Período
- **quant_bc_pis**: Parcela da Base de Cálculo do Crédito
- **quant_bc_pis_tot**: Quantidade Total da Base de Cálculo do Crédito Apurado
- **reg**: Registro
- **vl_bc_pis**: Valor da Base de Cálculo do Crédito
- **vl_bc_pis_cum**: Parcela do Valor Total da Base de Cálculo
- **vl_bc_pis_nc**: Valor Total da Base de Cálculo do Crédito
- **vl_bc_pis_tot**: Valor Total da Base de Cálculo Escriturada

---

## SPEDP_M200

**14 campos documentados**

- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_cont_cum_rec**: Valor da Contribuição Cumulativa a Recolher/Pagar
- **vl_cont_nc_rec**: Valor da Contribuição Não cumulativa a Recolher/Pagar
- **vl_out_ded_cum**: Outras DEDUÇÕES no Período
- **vl_out_ded_nc**: Outras DEDUÇÕES no Período
- **vl_ret_cum**: Valor Retido na Fonte Deduzido no Período
- **vl_ret_nc**: Valor Retido na Fonte Deduzido no Período
- **vl_tot_cont_cum_per**: Valor Total da Contribuição cumulativa do Período
- **vl_tot_cont_nc_dev**: Valor Total da Contribuição Não cumulativa devida
- **vl_tot_cont_nc_per**: Valor Total da Contribuição Não cumulativa do Período
- **vl_tot_cont_rec**: Valor Total da Contribuição a Recolher/Pagar no Período
- **vl_tot_cred_desc**: Valor do Crédito Descontado, Apurado no Próprio Período da Escrituração
- **vl_tot_cred_desc_ant**: Valor do Crédito Descontado, Apurado em Período de Apuração anterior

---

## SPEDP_M210

**14 campos documentados**

- **aliq_pis**: Alíquota do PIS/PASEP(em percentual)
- **aliq_pis_quant**: Alíquota do PIS(R$)
- **cod_cont**: Código da Contribuição Social apurada no Período
- **index**: Codigo Sequencial
- **quant_bc_pis**: Quantidade - Base de Cálculo PIS
- **reg**: Registro
- **vl_ajus_acres**: Valor Total dos Ajustes de Acréscimo
- **vl_ajus_reduc**: Valor Total dos Ajustes de Redução
- **vl_bc_cont**: Valor da Base de Cálculo da Contribuição
- **vl_cont_apur**: Valor Total da Contribuição Social Apurada
- **vl_cont_difer**: Valor da Contribuição a diferir no Período
- **vl_cont_difer_ant**: Valor da Contribuição diferida em Período anteriores
- **vl_cont_per**: Valor Total da Contribuição do Período
- **vl_rec_brt**: Valor da Receita Bruta

---

## SPEDP_M400

**6 campos documentados**

- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Código da ST referente ao PIS/PASEP
- **desc_compl**: Descrição Complementar da Nautreza da Receita
- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_tot_rec**: Valor Total da Receita Bruta

---

## SPEDP_M410

**7 campos documentados**

- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_pis**: Cst Pis do M400
- **desc_compl**: Descrição Complementar da Nautreza da Receita
- **index**: Codigo Sequencial
- **nat_rec**: Natureza da Operação
- **reg**: Registro
- **vl_rec**: Valor da Receita Bruta

---

## SPEDP_M500

**16 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(%)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cod_cred**: Código de Tipo de Crédito Apurado no Período
- **ind_cred_ori**: Indicador de Crédito
- **ind_desc_cred**: Indicador de Crédito
- **index**: Codigo Sequencial
- **quant_bc_cofins**: Quantidade - Base de Cálculo COFINS
- **reg**: Registro
- **sld_cred**: Saldo de Créditos a utilizar em Períodos futuros
- **vl_ajus_acres**: Valor Total dos Ajustes de Acréscimo
- **vl_ajus_reduc**: Valor Total dos Ajustes de Redução
- **vl_bc_cofins**: Valor da Base de Cálculo do Crédito
- **vl_cred**: Valor Total do Crédito Apurado no Período
- **vl_cred_desc**: Valor do Crédito disponível
- **vl_cred_difer**: Valor Total do Crédito diferido no Período
- **vl_cred_disp**: Valor Total do Crédito disponível relativo ao Período

---

## SPEDP_M505

**12 campos documentados**

- **cod_cred**: Código de Tipo de Crédito Apurado no Período
- **cst_cofins**: Código da Situação Tributária referente ao Crédito de COFINS
- **desc_cred**: Descrição do Crédito
- **index**: Codigo Sequencial
- **nat_bc_cred**: Código da Base de Cálculo do Crédito Apurado no Período
- **quant_bc_cofins**: Parcela da Base de Cálculo do Crédito
- **quant_bc_cofins_tot**: Quantidade Total da Base de Cálculo do Crédito Apurado
- **reg**: Registro
- **vl_bc_cofins**: Valor da Base de Cálculo do Crédito
- **vl_bc_cofins_cum**: Parcela do Valor Total da Base de Cálculo
- **vl_bc_cofins_nc**: Valor Total da Base de Cálculo do Crédito
- **vl_bc_cofins_tot**: Valor Total da Base de Cálculo Escriturada

---

## SPEDP_M600

**14 campos documentados**

- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_cont_cum_rec**: Valor da Contribuição Cumulativa a Recolher/Pagar
- **vl_cont_nc_rec**: Valor da Contribuição Não cumulativa a Recolher/Pagar
- **vl_out_ded_cum**: Outras DEDUÇÕES no Período
- **vl_out_ded_nc**: Outras DEDUÇÕES no Período
- **vl_ret_cum**: Valor Retido na Fonte Deduzido no Período
- **vl_ret_nc**: Valor Retido na fonte Deduzido no Período
- **vl_tot_cont_cum_per**: Valor Total da Contribuição Cumulativa do Período
- **vl_tot_cont_nc_dev**: Valor Total da Contribuição Não Cumulativa devida
- **vl_tot_cont_nc_per**: Valor Total da Contribuição Não cumulativa no Período
- **vl_tot_cont_rec**: Valor Total da Contribuição a Recolher/Pagar no Período
- **vl_tot_cred_desc**: Valor do Crédito Descontado, Apurado no Próprio Período da Escrituração
- **vl_tot_cred_desc_ant**: Valor do Crédito Descontado, Apurado no Período de Apuração Anterior

---

## SPEDP_M610

**15 campos documentados**

- **aliq_cofins**: Alíquota do COFINS(em percentual)
- **aliq_cofins_quant**: Alíquota do COFINS(R$)
- **cod_cont**: Código da Contribuição Social apurada no Período
- **index**: Codigo Sequencial
- **indexm600**: Chave Estrangeira M600
- **quant_bc_cofins**: Quantidade - Base de Cálculo COFINS
- **reg**: Registro
- **vl_ajus_acres**: Valor Total dos Ajustes de Acréscimo
- **vl_ajus_reduc**: Valor Total dos Ajustes de Redução
- **vl_bc_cont**: Valor da Base de Cálculo da Contribuição
- **vl_cont_apur**: Valor Total da Contribuição Social Apurada
- **vl_cont_difer**: Valor da Contribuição a diferir no Período
- **vl_cont_difer_ant**: Valor da Contribuição diferida em Período anteriores
- **vl_cont_per**: Valor Total da Contribuição do Período
- **vl_rec_brt**: Valor da Receita Bruta

---

## SPEDP_M800

**6 campos documentados**

- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Código da ST referente ao COFINS 
- **desc_compl**: Descrição Complementar da Nautreza da Receita
- **index**: Codigo Sequencial
- **reg**: Registro
- **vl_tot_rec**: Valor Total da Receita Bruta

---

## SPEDP_M810

**7 campos documentados**

- **cod_cta**: Código da Conta Analítica Contábil(debitada/creditada)
- **cst_cofins**: Cst Cofins do M800
- **desc_compl**: Descrição Complementar da Nautreza da Receita
- **index**: Codigo Sequencial
- **nat_rec**: Natureza da Operação
- **reg**: Registro
- **vl_rec**: Valor da Receita Bruta

---

## SPEE

**6 campos documentados**

- **speecodigo**: Codigo do Estoque no Sped
- **speeempresa**: Codigo da Empresa (FK)
- **speeperiodo**: Periodo do Sped
- **speeproduto**: Codigo do Produto (FK)
- **speeqtd**: Quantidade de Estoque
- **speeunitario**: Valor Unitario

---

## SPER

**6 campos documentados**

- **spercampos**: Quantidade de Estoque
- **spercodigo**: Codigo do Registro no Sped
- **sperdescricao**: Descricao do Registro
- **sperregistro**: Registro do Sped
- **sperregistropai**: Codigo do Registro Pai no Sped (FK)
- **sperstatus**: Status do Registro (0 - Ativo, 1 - Inativo)

---

## SPET

**7 campos documentados**

- **spetcodigo**: Codigo do cartao no Sped
- **spetcredito**: Valor em Credito
- **spetdebito**: Valor em Debito
- **spetempresa**: Código da Empresa (FK)
- **spetfornecedor**: Fornecedor Operadora de Cartao (FK)
- **spetintermediador**: Participante Intermediador da transação (FK)
- **spetperiodo**: Periodo do Sped

---

## SPL

**6 campos documentados**

- **splcodigo**: Codigo
- **spldescricao**: Descrição
- **splfinal**: Data Final
- **splimagem**: Imagem
- **splinicio**: Data Inicio
- **splrepositorio**: Atualiza Repositorio 0-Não | 1-Sim

---

## SPRO

**5 campos documentados**

- **sprocodigo**: Codigo Sequencial
- **sprodescricao**: Descricao
- **sproipirangaatividade**: Tipo do produto na ipiranga (codigo componente Atividade)
- **sproipirangacodigo**: Vinculo com a Ipiranga
- **sprotipo**: Tipo de Produto (FK)

---

## STAJPR

**2 campos documentados**

- **stajprcodigo**: Codigo Sequencial
- **stajprnome**: Nome do Setor

---

## STEC

**23 campos documentados**

- **steccodigo**: Codigo Sequencial
- **stecempresa**: Codigo Empresa
- **stecepfechamento**: EndPoint do Fechamento
- **steceppromocao**: EndPoint da Promoção
- **stecepreenviofechamento**: EndPoint do Reenvio do Fechamento
- **stecepreenviovenda**: EndPoint do Reenvio das Vendas
- **stecepvenda**: EndPoint da Venda
- **stecidempresa**: Codigo ID da Empresa na Scanntech
- **steclocal**: Local
- **stectsfechamento**: Tempo de Sincronismo Fechamento (em segundos)
- **stectspromocao**: Tempo de Sincronismo da Promoção (em segundos)
- **stectsreenviofechamento**: Tempo de Sincronismo do Reenvio do Fechamento (em segundos)
- **stectsreenviovenda**: Tempo de Sincronismo do Reenvio das Vendas (em segundos)
- **stectsvenda**: Tempo de Sincronismo da Venda (em segundos)
- **stecuefechamento**: Data/Hora da ultima execucao do EndPoint Fechamento
- **stecuepromocao**: Data/Hora da ultima execucao do EndPoint Promoção
- **stecuereenviofechamento**: Data/Hora da ultima execucao do EndPoint do Reenvio do Fechamento
- **stecuereenviovenda**: Data/Hora da ultima execucao do EndPoint Reenvio das Vendas
- **stecuevenda**: Data/Hora da ultima execucao do EndPoint Venda
- **stecurlbase**: URL Base
- **stecurlbase2**: URL Base Reserva
- **stecurlbase3**: URL Base Reserva
- **stecurlbaseativa**: Url Base Ativa? 1,2,3

---

## STIC

**4 campos documentados**

- **sticcodigo**: Codigo
- **sticdescricao**: Descricao
- **sticlibicms**: Libera Aliquota Icms 0-Não 1-Sim
- **sticlibicmsrep**: Libera Aliquota Icms Repasse 0-Não 1-Sim

---

## STIP

**3 campos documentados**

- **stipcodigo**: Codigo
- **stipdescricao**: Descricao
- **stiplibaliq**: Libera Aliquota IPI 0-Não 1-Sim

---

## STPC

**3 campos documentados**

- **stpccodigo**: Codigo
- **stpcdescricao**: Descricao
- **stpclibnatr**: Libera Natureza de Receita 0-Não 1-Sim

---

## STPG

**5 campos documentados**

- **stpgcodigo**: Codigo Sequencial
- **stpgcodigostvd**: Codigo da Venda
- **stpgempresa**: Codigo Empresa
- **stpgformapgto**: Forma de Pagamento: 9-DIN/10-CRE/11-CHQ/12-VALE/13-DEB
- **stpgvalor**: Valor do Pagamento

---

## STPR

**17 campos documentados**

- **stprautor**: Nome da Empresa Responsavel pela Promoção
- **stprbarrasprod**: Código de Barras do Produto
- **stprcodigo**: Codigo Sequencial
- **stprcondicaoqtde**: Quantidade da Condição (Ex: Leve 3 para Pagar 2)
- **stprdesconto**: Desconto do Item
- **stprdescricao**: Descrição da Promoção
- **stprdescricaoprod**: Descrição do Produto
- **stprempresa**: Codigo Empresa
- **stprid**: Id da Promoção
- **stprlimiteporcupom**: Quantidade Limite de Promoção por Cupom
- **stprpagaqtde**: Quantidade Paga (EX: Leve 3 Pague 2
- **stprpreco**: Preço do Item
- **stprpromocaotipo**: Tipo de Promoção
- **stprtipoitem**: Tipo de Registro: C-CONDICAO/B-BENEFICIO
- **stprtitulo**: Titulo da Promoção
- **stprvigenciafinal**: Data Final da Vigência
- **stprvigenciainicial**: Data Inicial da Vigência

---

## STT

**1 campos documentados**

- **sttstatus**: START INICIAL 0-Nao 1-Sim

---

## STVD

**15 campos documentados**

- **stvdcaixa**: Código do Caixa
- **stvdclientedocto**: Documento do Cliente
- **stvdcodigo**: Codigo Sequencial
- **stvddata**: Data/Hora da Venda
- **stvddatacancelamento**: Data/Hora do Cancelamento
- **stvddatacancelamentoenvio**: Data/Hora do Envio do Cancelamento
- **stvddataenvio**: Data/Hora do Envio
- **stvddatafechamento**: Data/Hora do Fechamento
- **stvddatafechamentoenvio**: Data/Hora do Envio do Fechamento
- **stvdempresa**: Codigo Empresa
- **stvderroenvio**: 0-Normal|1-Erro
- **stvderrofechamentoenvio**: 0-Normal|1-Erro
- **stvdlocalvenda**: Local de Venda: 1-LOJA / 2-E-COMMERCE / 3-OUTRO / 4-RAPPI
- **stvdnumero**: Código da Venda
- **stvdterminal**: Código do Terminal

---

## STVI

**14 campos documentados**

- **stviacrescimo**: Acréscimo
- **stvibarrasprod**: Codigo de Barras do Produto
- **stvicodigo**: Codigo Sequencial
- **stvicodigoprod**: Codigo do Produto
- **stvicodigostpr**: Codigo da Promoção
- **stvicodigostvd**: Codigo da Venda
- **stvidesconto**: Desconto
- **stvidescricaoprod**: Descrição do Produto
- **stviempresa**: Codigo Empresa
- **stvipromostatus**: Status da Promoção. (0-SEM PROMOCAO | 1-ACEITA | 2-REJEITADA)
- **stviquantidade**: Quantidade
- **stvisubtotal**: SubTotal
- **stvitotal**: Total
- **stvivalorunitario**: Valor Unitário

---

## SUPR

**42 campos documentados**

- **suprcaixa**: Numero do Caixa (FK)
- **suprccrr**: Codigo da Conta Corrente
- **suprchqbordero**: Codigo do Bordero em Operacoes (Q)
- **suprchqcodigo**: Codigo do Cheque  em Operacoes (Q)
- **suprcliente**: Codigo do Cliente (FK)
- **suprcodbrinks**: Identificador do movimento recebido no Cofre Brinks
- **suprcodigo**: Codigo Sequencial
- **suprcodigoparb**: Código de Dado Bancário PARB (PK)
- **suprcodigopdv**: Codigo PK do PDV (campo usado somente em MB)
- **suprcodsmartsafe**: Identificador do movimento recebido no Smart Safe Cofre
- **suprcofrebrinks**: Código do Cofre Brinks
- **suprcofresmartsafe**: Código do Smart Safe Cofre
- **suprdata**: Data do Movimento
- **suprdatabrinks**: Data do Cofre Brinks
- **suprdatadeposito**: Data de Depósito da Ordem de Pagamento
- **suprdatasmartsafe**: Data do Smart Safe Cofre
- **suprdependente**: Nome do Dependente
- **suprdestinoret**: Codigo PK gerado no Retaguarda (campo usado somente em MB)
- **suprempresa**: Código da Empresa
- **suprendereco**: Codigo do Endereco (FK)
- **suprfrentista**: Codigo do Frentista Responsavel (FK)
- **suprgrupo**: Codigo do Grupo de Lancamento (FK)
- **suprhistorico**: Historico
- **suprlote**: Numero Lote Sangria
- **suprmapa**: Data do Mapa (FK)
- **suprmarcado**: Registro marcado 1-marcado
- **suprmodalidade**: Flag Modalidade 1-Dinh 2-Prazo ...
- **suproperacao**: Flag de Operação (D)eb|(C)red|(S)aidas O|(E)ntr O|e(M)prest|Bx Ch(Q)|estorno c(H)qe|(P)gto|res(G)ate pt
- **suprordempag**: Tipo de Ordem de Pagamento informado manualmente no fechamento da venda
- **suprorigemcod**: Código de Origem da Ordem de Pagamento
- **suprorigemtip**: Tipo de Origem da Ordem de Pagamento: 1 - VDA  2 - TDV
- **suprplaca**: Placa
- **suprreceber**: Codigo Destino do Contas a Receber (FK)
- **suprsaqpaycodigo**: Código SAQPAY (FK) SaqPay Pix
- **suprtefautorizacao**: Numero de Autorizacao do Cartao
- **suprtefband**: Codigo da Bandeira (FK)
- **suprtefchave**: Chave Tef (FK)
- **suprtefoper**: Codigo da Operadora (FK)
- **suprusuario**: Usuario Responsavel
- **suprvalor**: Valor do Movimento
- **suprvenda**: Código vda
- **suprvl4ucodigo**: Código VL4U (FK) Value4u app

---

## SYNC

**7 campos documentados**

- **synccodigo**: Codigo Sequencial
- **syncdata**: Data e Hora do Cadastro
- **syncdescricao**: Descricao do Registro
- **syncempresa**: Codigo da Empresa (FK)
- **syncoperacao**: Flag M-Manutencao E-Exclusao
- **syncpk**: Codigo PK da Tabela Origem
- **synctabela**: Tabela Origem

---

## TANQ

**17 campos documentados**

- **tanqativo**: Data do Cadastro
- **tanqatualizapdv**: Flag Atualizar PDV 0-Nao 1-Sim
- **tanqcanal**: Canal de Medição do Tanque
- **tanqcapacidade**: Capacidade do Tanque
- **tanqcodigo**: Codigo
- **tanqconjugado**: Qtd Tanques Conjugados
- **tanqdisplay**: Numero de Display do Tanque
- **tanqempresa**: Empresa (FK)
- **tanqestoque**: Estoque Atual
- **tanqinativo**: Data do Inativo
- **tanqmeddat**: Data da Ultima Medicao do Tanque
- **tanqmedqtd**: Volume da Ultima Medicao do Tanque
- **tanqmedtem**: Temperatura da Ultima Medicao do Tanque
- **tanqmodelo**: Modelo Tanque (FK)
- **tanqpedido**: Pedido de Leitura de Tanque 0-Livre | 1-Pedido | 2-Aguardando
- **tanqpedidodat**: Data e Hota do Pedido de Leitura de Tanque
- **tanqproduto**: Produto (FK)

---

## TCXA

**14 campos documentados**

- **tcxabloqpista**: Permitir bloqueio de pista para este tipo de caixa: 0-Não | 1-Sim
- **tcxabloqvenda**: Bloquear Operacoes de Venda     : 0-Não | 1-Sim
- **tcxacodigo**: Codigo Sequencial
- **tcxadescricao**: Descrição do Tipo de Caixa
- **tcxaempresas**: Opção Controle Terminais        : 0-Bloquear Todos | 1-Liberar Todos
- **tcxaignoranolmc**: Ignorar Caixa no LMC            : 0-Não | 1-Sim
- **tcxaniveis**: Opção Controle Niveis           : 0-Bloquear Todos | 1-Liberar Todos
- **tcxaterminais**: Opção Controle Terminais        : 0-Bloquear Todos | 1-Liberar Todos
- **tcxausoabpemassa**: Uso Exclusivo para emissoes de abpe em massa: 0-Não | 1-Sim
- **tcxausocxafrentista**: Habilita Uso Caixa Frentista    : 0-Não | 1-Sim
- **tcxausopdvtotem**: Uso Liberado para 0-Ambos 1-Somente PDV 2-Somente Totem
- **tcxausopostef**: Habilita Uso POSTEF             : 0-Não | 1-Sim
- **tcxausorestrito**: Somente podera operar o Caixa o Usuario Proprietario: 0-Não | 1-Sim | 2-Admin
- **tcxausuarios**: Opção Controle Usuarios         : 0-Bloquear Todos | 1-Liberar Todos

---

## TCXE

**3 campos documentados**

- **tcxecodigo**: Codigo Sequencial
- **tcxeempresa**: Codigo da Empresa
- **tcxetipo**: Codigo do Tipo de Caixa (FK)

---

## TCXN

**3 campos documentados**

- **tcxncodigo**: Codigo Sequencial
- **tcxnnivel**: Nome do Nivel de Acesso
- **tcxntipo**: Codigo do Tipo de Caixa (FK)

---

## TCXR

**11 campos documentados**

- **tcxralerta**: Alerta Tempo Excedido de Uso em Horas
- **tcxrcargacompletarel**: Forçar Carga completa dos Relatórios no Fechamento do Turno 0-Não 1-Sim
- **tcxrcodigo**: Codigo Sequencial
- **tcxrdescricao**: Descrição do Turno de Caixa
- **tcxrempresa**: Código da empresa (FK)
- **tcxrfinal**: Horario Final do Turno
- **tcxrinicial**: Horario Inicial do Turno
- **tcxrmedicao**: Solicitar Medição Fisica dos Tanques ao Fechar o Caixa 0-Não 1-Permitir 2-Obrigar
- **tcxrmedicaoini**: Solicitar Medição Fisica dos Tanques ao Abrir  o Caixa 0-Não 1-Permitir 2-Obrigar
- **tcxrretsangria**: Solicitar Sangria 0-Monitorar 1-Obrigar
- **tcxrsangria**: Valor Maximo para Alerta de Sangria

---

## TCXT

**3 campos documentados**

- **tcxtcodigo**: Codigo Sequencial
- **tcxtterminal**: Nome do Terminal
- **tcxttipo**: Codigo do Tipo de Caixa (FK)

---

## TCXU

**3 campos documentados**

- **tcxucodigo**: Codigo Sequencial
- **tcxutipo**: Codigo do Tipo de Caixa (FK)
- **tcxuusuario**: Nome do Usuario

---

## TDV

**2 campos documentados**

- **tdvcodigo**: Codigo Sequencial
- **tdvcodigopart**: Participante PART (FK)

---

## TDVI

**7 campos documentados**

- **tdvicodigo**: Codigo Sequencial
- **tdvicodigotdv**: Código de Troca de Valor TDV (PK)
- **tdviempresa**: Codigo da Empresa (Fk)
- **tdviorigemcod**: Código de Origem da Forma
- **tdviorigemtip**: Tipo de Origem da Forma: 1 - Dinheiro  2 - CXAQ  3 - CXAC  4 - VALE  5 - CXAF  6 - CXAD
- **tdvitipo**: Tipo do Registro: 1 - Entrada 2 - Saída
- **tdvivalor**: Valor da Forma

---

## TEDE

**19 campos documentados**

- **tedecaixa**: Número do Caixa Quando parâmetrizado para agregar caixa na transf
- **tedecodigo**: Codigo Sequencial
- **tededata**: Data da transferência
- **tedeempresa**: Codigo da Empresa
- **tedeempresadestino**: Codigo da Empresa Destino
- **tedelocaldestino**: Local Destino Transferência
- **tedelocalorigem**: Local Origem Transferência
- **tedeoperacao**: Tipo da operação 1-depósito p/ disponível | 2-disponível p/ depósito
- **tedeproduto**: Código do produto
- **tedeqtd**: Qtd transferida
- **tedeqtdantesdepo**: Quantidade Anterior Deposito
- **tedeqtdantesdispo**: Qtuantidade Anterior Disponivel
- **tedeqtddestinoantes**: Estoque Destino Anterior à transferência***INUTILIZADO***
- **tedeqtddestinodepois**: Estoque Destino Posterior à transferência***INUTILIZADO***
- **tedeqtdorigemantes**: Estoque Origem Anterior à transferência***INUTILIZADO***
- **tedeqtdorigemdepois**: Estoque Origem Posterior à transferência***INUTILIZADO***
- **tedeqtdpostdepo**: Qtuantidade Posterior Deposito
- **tedeqtdpostdispo**: Qtuantidade Posterior Disponivel
- **tedeusuario**: Usuário que realizou a operação

---

## TEFB

**8 campos documentados**

- **tefbbandeira**: Codigo da Bandeira (FK)
- **tefbccrrpadrao**: Conta Corrente Padrao para Baixa (FK)
- **tefbchavecon**: Chave Depara da Conciliação
- **tefbcodigo**: Codigo Sequencial
- **tefbdias**: Quantidade de Dias para Vencimento
- **tefbdretaxa**: Conta Desconto DRE (FK)
- **tefboperadora**: Codigo da Operadora (FK)
- **tefbtaxa**: Taxa Administrativa em %

---

## TEFC

**38 campos documentados**

- **tefcaltoperacao**: Permite alterar Operacao da chave do TEF 0-Nao 10-Sim
- **tefcbandeira**: Codigo da Bandeira (FK)
- **tefcbandeirafiscal**: 01=Visa, 02=Mastercard, 03=American Express, 04=Sorocred, 05=Diners Club, 06=Elo, 07=Hipercard, 08=Aura, 09=Cabal, 99=Outros
- **tefcccrrpadrao**: Codigo da Conta Corrente Padrão para Baixa (FK)
- **tefcchave**: Chave de Acesso
- **tefccomprovante**: Descricao da Ultima Transacao
- **tefcconciliar**: Conciliar Cartão 0-Não/1-Sim
- **tefccontrolaraut**: Controlar numero de autorizacao (OBS: para funcionar precisa do parametro CTRLCARTAONRO = 2) 0-Nao 1-Sim 
- **tefcdeparaband**: Codigo Depara Bandeira  x Conciliadora
- **tefcdeparabanddesc**: Descricao Depara Bandeira  x Conciliadora
- **tefcdeparaoper**: Codigo Depara Operadora x Conciliadora
- **tefcdeparaoperdesc**: Descricao Depara Operadora x Conciliadora
- **tefcdias**: Quantidade de Dias para Vencimento
- **tefcdoccancelamento**: Qual documento será enviado primordialmente no cancelamento do TEF 0-(Não definido, envia padrão codigo autorizacao) 1-Codigo Autorização 2-Código NSU
- **tefcdretaxa**: Codigo do Dre para Taxas (FK)
- **tefcempresa**: Código da empresa
- **tefcenviacnpjxmlnfce**: Envia o CNPJ do FORNECEDOR no XML da NFC-E 0-Nao 1-Sim
- **tefcenviarnotaticketlog**: Enviar a Nota para Ticket Log 0-Nao 1-Sim
- **tefcenviarnsuconciliacao**: Informar NSU ou não na Conciliação de Cartões (Depende da Bandeira) 0-Nao 1-Sim
- **tefcformapgtoxmlnfce**: Código de forma de pagamento NFC-e
- **tefcformapgtoxmlsat**: Código de forma de pagamento SAT
- **tefcfornecedor**: Codigo do Fornecedor (FK)
- **tefchabilitaviacliente**: Habilita Imprimir Via Cliente  0-Nao 1-Sim
- **tefchabilitaviaestabelecimento**: Habilita Imprimir Via Estabelecimento 0-Nao 1-Sim
- **tefcinativo**: Data do Inativo
- **tefclibera**: Flag de Liberação (T)ef / (P)os
- **tefcliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Liberacao 2-Depara 10-OK 99-Erro
- **tefclinkversao**: Registro de Compatibilidade com Versao 0-Nao 1-Sim
- **tefcnomeagrupamento**: Caso relatorio em grupo de operadora, separar estes que possuirem um nome aqui. Ex.: Operadora CIELO, nome agrupamento PIX, entao sera uma nova coluna PIX ao inves de CIELO
- **tefcoperacao**: Flag de Operacao (D)ebito / (C)redito
- **tefcoperadora**: Codigo da Operadora (FK)
- **tefcposicao**: Numero da Posicao em que a chave se exibira em relatorio
- **tefcshbgrupo**: Codigo do Grupo de outras Saidas (FK)
- **tefcshbindice**: Indice do CashBack (%)
- **tefcshbtipo**: Gerar CashBack na Venda com esta Chave 0-Não 1-Gerar por Porcentagem
- **tefctaxaind**: Taxa do Cartao por Indice
- **tefctaxavlr**: Taxa do Cartao por Valor
- **tefctpcfrete**: Cartao tipo Carta Frete

---

## TEFD

**2 campos documentados**

- **tefdcodigo**: Codigo Sequencial
- **tefddescricao**: Descricao

---

## TEFG

**48 campos documentados**

- **tefgameaccesstoken**: AME DIGITAL Access Token
- **tefgameclientid**: AME DIGITAL Client ID
- **tefgameclientsecret**: AME DIGITAL Client Secret
- **tefgameqrcode**: AME DIGITAL Imprimir QR Code Automaticamente
- **tefgcodigo**: Codigo Sequencial
- **tefgcodloja**: Código Loja TEF DLL
- **tefgcodterminal**: Código Terminal TEF DLL
- **tefgcomb3casa**: Em branco: duas casas decimais | preenchido: sistema envia 3 casas decimais no combustível e exibe um menu de seleção para OUTROS CARTÕES(2 casas) TEXTO PARÂMETRO(3 casas)
- **tefgebankpixaccesskey**: EBANKPIX Access Key
- **tefgebankpixchavepix**: EBANKPIX Chave Pix
- **tefgebankpixconfigurationid**: EBANKPIX Configuration Id
- **tefgebankpiximprimirqrcode**: EBANKPIX Imprimir QR Code Automaticamente
- **tefgebankpixnumeroagencia**: EBANKPIX Numero da Agencia Vinculada ao PIX
- **tefgebankpixnumeroconta**: EBANKPIX Numero da Conta Vinculada ao PIX
- **tefgebankpixsecretkey**: EBANKPIX Secret Key
- **tefgempresa**: Código da Empresa (Fk)
- **tefgenviacnpj**: Envia o CNPJ no campo 565-008
- **tefgipirangacodigocorporate**: Ipiranga Codigo Corporate
- **tefgipirangaimprimirqrcode**: Ipiranga Imprimir QR Code Automaticamente
- **tefgmercadopagocodigocaixa**: Mercado Pago Código Caixa
- **tefgmercadopagocodigoloja**: Mercado Pago Código Loja
- **tefgmercadopagoimprimirqrcode**: Mercado Pago imprimir Qr Code Automaticamente
- **tefgpartintermediador**: INtermediador (FK)
- **tefgperfil**: Codigo Perfil do TEF
- **tefgpicpayimprimirqrcode**: PICPAY Imprimir QR Code Automaticamente
- **tefgpicpaysellertoken**: PICPAY x-seller-token
- **tefgpicpaysgatoken**: PICPAY SGA Token
- **tefgpicpaytoken**: PICPAY x-picpay-token
- **tefgreq**: Diretório REQ do TEF
- **tefgresp**: Diretório RESP do TEF
- **tefgservidor**: IP Servidor TEF
- **tefgsgapipayclientepinbank**: SGA PIPAY Código Cliente PinBank
- **tefgsgapipaycodigocliente**: SGA PIPAY Código Cliente SGA
- **tefgsgapipayimprimirqrcode**: SGA PIPAY imprimir Qr Code Automaticamente
- **tefgsgapipaytimeout**: SGA PIPAY TimeOut em Segundos
- **tefgsgatoken**: AME DIGITAL SGA Token
- **tefgshipayaccesskey**: SHIPAY Access Key
- **tefgshipayaccesstoken**: SHIPAY Access Token
- **tefgshipaycaixatoken**: SHIPAY último caixa que atualizou as credenciais
- **tefgshipayclientid**: SHIPAY Client Id
- **tefgshipaydatatoken**: SHIPAY Data da última atualização das credenciais
- **tefgshipayimprimirqrcode**: SHIPAY Imprimir QR Code Automaticamente
- **tefgshipayjsonwallet**: SHIPAY Backup Carteiras
- **tefgshipayrefreshtoken**: SHIPAY Refresh Token
- **tefgshipaysecretkey**: SHIPAY Secret Key
- **tefgsitefdllexibirqrcode**: SITEF DLL Exibir QR Code na tela ao invés do PINPAD
- **tefgsitefdllimprimirqrcode**: SITEF DLL imprimir Qr Code Automaticamente
- **tefgterminal**: Nome dos terminais habilitados

---

## TEFO

**2 campos documentados**

- **tefocodigo**: Codigo Sequencial
- **tefodescricao**: Descricao

---

## TEFP

**7 campos documentados**

- **tefpchavecon**: Chave Depara da Conciliação
- **tefpchavetef**: Chave de Retorno do TEF
- **tefpcodigo**: Codigo Sequencial
- **tefpdescricao**: Descricao
- **tefpfornecedor**: Fornecedor (FK)
- **tefplibera**: Libera (POS/TEF)
- **tefpligatefo**: Ligação Tefp com Tefo

---

## TEFTC

**5 campos documentados**

- **teftcchave**: Chave de Acesso (FK)
- **teftccodigo**: Codigo Sequencial
- **teftccontacorrente**: Codigo da Conta Corrente (FK)
- **teftcempresa**: Código da empresa (FK)
- **teftctipocaixa**: Codigo dO Tipo Caixa (FK)

---

## TEFX

**11 campos documentados**

- **tefxcodigo**: Numero Sequencial
- **tefxdata**: Data do Cancelamento
- **tefxhistorico**: Motivo pelo cancelamento
- **tefxresponsavel**: Login do Responsavel pelo cancelamento
- **tefxtefcodaut**: TEF : 13 - Variaveis CODAUT codigo da autorizacao
- **tefxtefcodret**: TEF : 09 - codigo do retorno
- **tefxtefcomprovante**: TEF : 29 - comprovante do cancelamento
- **tefxtefdata**: TEF : 22 - Variaveis DATA da transacao
- **tefxtefnsu**: TEF : 12 - Variaveis NSU
- **tefxtefrede**: TEF : 40 - Variaveis REDE nome da rede
- **tefxvalor**: Valor do Cancelamento

---

## TENF

**5 campos documentados**

- **tenfacaonfc**: Ação NFC 0-Abortar 1-Contingencia 2-Autorizar 3-Pendente
- **tenfacaonfe**: Ação NFE 0-Abortar 1-Contingencia 2-Autorizar 3-Pendente
- **tenfcodigo**: Codigo Sequencial
- **tenfdescricao**: Descrição
- **tenfsolucao**: Possiveis Solucoes

---

## TERM

**2 campos documentados**

- **termdata**: Data da última abertura
- **termdescricao**: Nome do Terminal

---

## TFK

**8 campos documentados**

- **tfkcodigo**: Codigo Sequencial
- **tfkdata**: Data e Hora
- **tfkemp1**: Código da Empresa da Tabela1
- **tfkemp2**: Código da Empresa da Tabela2
- **tfkpk1**: PK da Tabela1
- **tfkpk2**: PK da Tabela2
- **tfktab1**: Tabela1
- **tfktab2**: Tabela2

---

## TKL

**17 campos documentados**

- **tklcliente**: Cliente do Token (FK)
- **tklcodigo**: Codigo Sequencial (PK)
- **tkldatahora**: Data e Hora do Token
- **tkldependente**: Dependente do Token (FK)
- **tklempresa**: Codigo da Empresa (FK)
- **tklendereco**: Endereco do Token (FK)
- **tklidvisual**: Identidade Visual do Token
- **tklliberacao**: Fone Responsavel pela Liberacao
- **tklorigem**: Flag ORIGEM do Token 1-Pdv 2-Totem 3-SgaPay 4-PortalFrota 5-ChatBot
- **tkltipo**: Flag tipo do Token 1-idVisual 2-Whats 3-App 4-Assinatura
- **tklvalid_it**: Validade: 0-Liberado 1-Liberar Somente Combustiveis 2-Liberar Somente Produtos
- **tklvalid_pf**: Validade: Periodo Final
- **tklvalid_pi**: Validade: Periodo Inicial
- **tklvalid_pkr**: Validade: 1Digito=exige Placa 2Digito=exige km 3Digito=exige requisicao
- **tklvalid_vf**: Validade: Valor Final
- **tklvalid_vi**: Validade: Valor Inicial
- **tklvenda**: Venda Vinculada

---

## TLEN

**18 campos documentados**

- **tlenaliqcofins**: Aliquota Base Cofins
- **tlenaliqicms**: Aliquota Icms
- **tlenaliqpis**: AliquotaBase Pis
- **tlenbaseicms**: Base de Icms
- **tlenbasepc**: Base de Pis Cofins
- **tlencfop**: Cfop
- **tlenchavedoc**: Chave Eletronica
- **tlencodigo**: Codigo Sequencial
- **tlendata**: Data da Fatura
- **tlendatachegada**: Data de chegada
- **tlendocumento**: Numero da Fatura
- **tlenempresa**: Codigo Empresa FK
- **tlenfornecedor**: Codigo do Fornecedor (FK)
- **tlenserie**: Serie Nota Fiscal
- **tlenstic**: St Icms
- **tlenstpc**: St Pis/Cofins
- **tlentipo**: Telefonia/Telecomunicao
- **tlenvalor**: Valor da Fatura

---

## TLENP

**9 campos documentados**

- **tlenpcdescodigo**: Código Centro de despesas CDES
- **tlenpcodigo**: Codigo Sequencial
- **tlenpdre**: Código DRE
- **tlenpgdescodigo**: Código Grupo de despesas GDES
- **tlenpobs**: Obs
- **tlenporigem**: Codigo da TLEN (FK)
- **tlenppaga**: Código Tabela PAGA (FK)
- **tlenpvalor**: Valor da Parcela
- **tlenpvencimento**: Vencimento da Parcela

---

## TOKM

**5 campos documentados**

- **tokmdata**: Data e hora da utilização do Token
- **tokmfrentista**: Codigo do Frentista Responsavel (FK)
- **tokmliberacao**: Nome da Operação
- **tokmtoken**: Token Gerado pelo Mobile
- **tokmusuario**: Usuario Responsavel

---

## TPRE

**2 campos documentados**

- **tpredescricao**: Descricao
- **tpresigla**: (PK) Sigla

---

## TPRO

**3 campos documentados**

- **tprocodigo**: Codigo Sequencial
- **tprodataalteracao**: Data da última alteração da TPRO
- **tprodescricao**: Descricao

---

## TPTP

**3 campos documentados**

- **tptpcodigo**: Código
- **tptpdescricao**: Descrição do Tipo de O.S.
- **tptplibera**: Tipo de Liberação(1-Programação, 2-Suporte e 3-Comercial)

---

## TQM

**9 campos documentados**

- **tqmcodigo**: Codigo Sequencial
- **tqmdata**: Data
- **tqmempresa**: Codigo da Empresa
- **tqmobs**: Observação
- **tqmqtd**: Quantidade
- **tqmtanque**: (Fk) Tanque
- **tqmtipo**: Tipo de Medição: 1-Fechamento Caixa | 2-Abertura Caixa | 3-Sol. Manual | 4-Timer | 5-Entrada de Nota
- **tqmultimavda**: Data
- **tqmusuario**: Usuario

---

## TRCF

**6 campos documentados**

- **trcfcodigo**: Codigo PK tabela
- **trcfporcentagemdn**: Valor maximo de troco em porcentagem
- **trcftipovalor**: Valor Maximo ou Valor Minimo de troco, preencher com V+ ou V-
- **trcfvalordn**: Valor maximo de troco em dinheiro
- **trcfvlrmaximo**: Range maximo
- **trcfvlrminimo**: Range minimo

---

## TRL

**7 campos documentados**

- **trlcodigo**: Codigo Sequencial
- **trldestinocodigo**: Codigo Destino
- **trldestinodescricao**: Descricao Destino
- **trlorigemcodigo**: Codigo Origem
- **trlorigemdescricao**: Descricao Origem
- **trlterminal**: Terminal do Processo
- **trltrt**: Codigo TRT FK

---

## TRT

**6 campos documentados**

- **trtcodigo**: Codigo Sequencial
- **trtdata**: Data e Hora da Transferencia
- **trtpk**: Campo PK da Tabela
- **trttabela**: Tabela Base
- **trtupdate**: Relacao de Updates
- **trtusuario**: Usuario Responsavel

---

## TSER

**2 campos documentados**

- **tsercodigo**: Codigo Sequencial
- **tserdescricao**: Descrição

---

## TWCA

**9 campos documentados**

- **twcaabpeid**: Codigo ID do Abastecimento
- **twcabico**: Bico
- **twcaclientefid**: Cliente (Tag)
- **twcacodigo**: Codigo
- **twcacpf**: Cnpj/Cpf
- **twcaflag**: 0| Registro Nao Lido   2| Registro lido
- **twcafrentistafid**: Frentista (Tag)
- **twcaodometro**: Odometro
- **twcaterminal**: Terminal

---

## UNDP

**2 campos documentados**

- **undpcodigo**: Codigo
- **undpdescricao**: Descricao

---

## VALE

**24 campos documentados**

- **valebxcaixa**: Baixa - Numero do Caixa
- **valebxdata**: Baixa - Data da baixa
- **valebxempresa**: Empresa que Efetuou a Baixa do Vale
- **valebxfrentista**: Codigo do Frentista Responsavel pela Baixa (FK)
- **valebxmapa**: Baixa - Data do Mapa
- **valebxorigemcod**: Documento de origem do cheque (FK)
- **valebxorigemtip**: Tipo Origem 0Avulso 1Venda 2Rcbto 3OEntradas 5VdPrg 6bxChq
- **valecaixa**: Numero do Caixa de geracao (FK)
- **valecodigo**: Codigo Sequencial
- **valedata**: Data do Movimento de geracao
- **valeempresa**: Código da Empresa
- **valefrentista**: Codigo do Frentista Responsavel pela Emissao (FK)
- **valehistorico**: Historico
- **valeliberapdv**: Flag Status de Liberacao RETxPDV 0-N 1-Corrigir 2-Baixa 10-OK 99-Erro
- **valemapa**: Data Mapa de geracao (FK)
- **valemodalidade**: Flag Modalidade 1-Dinh 2-Prazo ...
- **valemotorista**: Motorista
- **valeplaca**: Placa
- **valetefautorizacao**: Numero de Autorizacao do Cartao
- **valetefband**: Codigo da Bandeira (FK)
- **valetefchave**: Chave Tef (FK)
- **valetefoper**: Codigo da Operadora (FK)
- **valevalor**: Valor do Vale
- **valevenda**: Numero da venda destino da baixa (FK)

---

## VCHR99

**12 campos documentados**

- **vchr99codigo**: Codigo Sequencial
- **vchr99codigovda**: Código VDA
- **vchr99cupom**: 99 Voucher Código Cupom
- **vchr99desconto**: 99 Voucher Valor Desconto
- **vchr99empresa**: Codigo Empresa
- **vchr99jsoncancelaenvio**: Json Cancela Envio
- **vchr99jsoncancelaretorno**: Json Cancela Retorno
- **vchr99jsonconfirmaenvio**: Json Confirma Envio
- **vchr99jsonconfirmaretorno**: Json Confirma Retorno
- **vchr99jsonvalidaenvio**: Json Valida Envio
- **vchr99jsonvalidaretorno**: Json Valida Retorno
- **vchr99status**: 99 Voucher Status 0-Venda Pendente|1-Confirma Pendente|2-Confirma Concluído|3-Cancela Pendente|4-Cancela Concluído|5-Confirma Com Erro|6-Cancela Com Erro|7-TimeOutConfirmacao

---

## VDA

**55 campos documentados**

- **vdaagregadesc**: Indica se Houve ou não agregação de desconto: 0-Não 1-Sim
- **vdaassinatura**: Imagem da Assinatura Liberacao de Prazo
- **vdaauditoria**: Data da Auditoria
- **vdabrpremmiacpf**: CPF Informado BR Premmia
- **vdacaixa**: Numero do Caixa (FK)
- **vdacarteiraprg**: Codigo da Carteira de Venda Programada (FK)
- **vdacliente**: Codigo do Cliente (FK)
- **vdacoddependente**: Código do Dependente (pardcodigo)
- **vdacodigo**: Codigo
- **vdacomunicauso**: Flag Status de Comunicacao Sefaz 0-liberado 2-em uso
- **vdaconfsgapay**: Data/Hora da conferencia da venda SGAPAY em DINHEIRO no caixa
- **vdacpftroca**: Cpf ou Cnpj de Troca
- **vdadata**: Data e hora da Venda
- **vdadependente**: Nome do Dependente
- **vdadestcont**: Sequencia da Venda Destino da Contingencia
- **vdadocumento**: Flag 0-Sem Doc 1-Ecf 2-nfce 3-nfe 4-nfs 5-d1 6-sat
- **vdaempresa**: Código da Empresa
- **vdaendereco**: Codigo do Endereco (FK)
- **vdaflagconcli**: Flag 0-Sem Informacao 1-Inicio Venda 2-Fechamento Venda
- **vdaformafecha**: Flag Forma do Fechamento: 1-normal|2-rapida|3-direta|4-Timer|5-Caixa|6-RedZ|7-PosTef|99-outros
- **vdaidentidade**: Identidade SQ. CP. NC. NF. NS. D1.
- **vdaipirangaidcesta**: Ipiranga: ID CESTA, código UUID usado para identificacao da cesta Ipiranga, usar nos pagamentos também
- **vdaipirangavouchercodigo**: IPIRANGA VOUCHER - Código
- **vdaipirangavouchercomponente**: IPIRANGA VOUCHER - COMPONENTE
- **vdaipirangavouchercpf**: IPIRANGA VOUCHER - CPF Consumidor
- **vdaipirangavoucherjsonqueima**: IPIRANGA VOUCHER - JSON QUEIMA
- **vdaipirangavoucherjsonqueimacancel**: IPIRANGA VOUCHER - JSON QUEIMA CANCEL
- **vdaipirangavoucherplaca**: IPIRANGA VOUCHER - Placa Veículo
- **vdaipirangavoucherstatus**: IPIRANGA VOUCHER - STATUS 1-Queima Concluída|2-Queima Pendente|3-Cancelamento Queima Concluído|4-Cancelamento Queima Pendente
- **vdaliberapdv**: Flag Status de Liberacao PDV 0-N 1-Inc 2-Alt 3-Canc 4-TrocaPgto 10-OK 99-Erro
- **vdalmcdata**: Data da Venda no LMC
- **vdamotivocanc**: Motivo de Cancelamento
- **vdamotivodesc**: Motivo de Desconto
- **vdamovimento**: Data do Movimento
- **vdanaoauditar**: Flag Nao Auditar 0-Auditar 1-NaoAuditar
- **vdanferesumo**: ID da NFe resumo (FK)
- **vdanumeromesa**: Numero da Mesa
- **vdaobs**: Observacoes
- **vdaperfil**: Codigo do Perfil FK fdpf
- **vdapromoter**: Codigo do Promoter FK part
- **vdaptofidelidade**: Pontos por Fidelidade
- **vdaremoteid**: Id unico no Sga_Cloud
- **vdarepositorio**: Repositorio
- **vdascanntechenvio**: Data de envio da Venda para a Integração Scanntech
- **vdastatus**: Status 0-Normal 1-Cancelado 2-Inutilizado
- **vdasync**: Mosta o Status da sincronizacao com o Sga_Cloud
- **vdaterminal**: Terminal origem da Venda
- **vdatipocashback**: Tipo do CashBack executado 0-ManualNao 1-Scantech 2-Value 3-99Taxi 4-PostoAki 5-IpirangaVoucher 6-MeuPostoAPP 7-BRpremia
- **vdatipoptsfidelidade**: 0-Sem Fidelidade 1-Participante 2-Dependente 3-Placa
- **vdatipovenda**: 0-PDV 1-SGAPAY
- **vdatokenprazo**: Token Liberacao de Prazo
- **vdausuario**: Usuario Responsavel pela Venda
- **vdausuariocanc**: Usuario que fez o Cancelamento da Venda
- **vdausuarioconfsgapay**: Usuario que fez a conferencia da venda em DINHEIRO do SGAPAY
- **vdavendedor**: Codigo do Vendedor (FK)

---

## VDAINUTILIZA

**5 campos documentados**

- **vdainutilizacodigo**: Código PK
- **vdainutilizaempresa**: Código da Empresa
- **vdainutilizamarcado**: 0 - Desmarcado | 1 - Marcado
- **vdainutilizanro**: Número do Documento
- **vdainutilizaserie**: Serie do Documento

---

## VDAJET

**12 campos documentados**

- **vdajetcodigo**: Codigo Sequencial
- **vdajetcodigovda**: Código VDA
- **vdajetdata**: Data
- **vdajetdataatendimento**: Data Atendimento String
- **vdajetdatasync**: Data Envio Ipiranga
- **vdajetempresa**: Codigo Empresa
- **vdajethash**: Controle Ipiranga
- **vdajetjson**: JSON ATENDIMENTO
- **vdajetjsonput**: JSON ATENDIMENTO PUT
- **vdajetnumeroatendimento**: Número Atendimento Automotivo Jet Oil
- **vdajetplaca**: Placa Jet Oil
- **vdajetstatuscode**: Http Status Code

---

## VDAKMV

**25 campos documentados**

- **vdakmvcancelamentoenvio**: Conteúdo retorno
- **vdakmvcancelamentoretorno**: Conteúdo retorno
- **vdakmvcheckinenvio**: Conteúdo envio
- **vdakmvcheckinretorno**: Método
- **vdakmvcheckoutenvio**: Status Código
- **vdakmvcheckoutretorno**: Status Texto
- **vdakmvcodigo**: Codigo Sequencial
- **vdakmvcodigoabadi**: Código Ipiranga Abadi
- **vdakmvcodigoerro**: Código Erro
- **vdakmvcodigopdv**: Código Ipiranga PDV
- **vdakmvcodigovda**: Código VDA
- **vdakmvcodigovip**: CODIGO VIP
- **vdakmvcpfconsumidor**: CPF Consumidor
- **vdakmvcpfvip**: CPF VIP
- **vdakmvdataterminal**: Data Terminal
- **vdakmvempresa**: Codigo Empresa
- **vdakmvmsgkmv**: Mensagem KMV
- **vdakmvpedido**: Pedido Ipiranga
- **vdakmvresgateavulso**: Tipo Resgate 1-Sim|0-Não
- **vdakmvsenhaconsumidor**: SENHA Consumidor
- **vdakmvsenhavip**: SENHA VIP
- **vdakmvsubtotal**: SubTotal
- **vdakmvtelefoneconsumidor**: Telefone Consumidor
- **vdakmvtentarreenviar**: 11-Não Envia Mais
- **vdakmvtotal**: Total

---

## VDCB

**8 campos documentados**

- **vdcbcodigo**: Codigo Sequencial da venda do combo
- **vdcbcodigovda**: Código da VDA
- **vdcbcombo**: Código do cadastro de combo
- **vdcbempresa**: Código da Empresa
- **vdcbqtd**: Quantidade vendida do combo
- **vdcbtotal**: Valor total do combo
- **vdcbunit**: Preço do combo
- **vdcbvendedor**: Vendedor do combo

---

## VDCL

**17 campos documentados**

- **vdclbairro**: Bairro do Endereco
- **vdclcadpro**: CadPro
- **vdclcep**: Cep
- **vdclcidade**: Codigo da Cidade (FK)
- **vdclcnpjcpf**: CNPJ ou CPF
- **vdclcodigovda**: Codigo da venda (FK)
- **vdclcomplemento**: Complemento do Endereco
- **vdclemail**: e.mail
- **vdclempresa**: Codigo da empresa (FK)
- **vdclfoneddd**: DDD do fone
- **vdclfonepre**: Prefixo do fone
- **vdclfonesuf**: Sufixo do fone
- **vdclfonewhats**: Numero do Telefone de Whatsapp
- **vdclierg**: IE ou RG
- **vdcllogradouro**: Logradouro
- **vdclnome**: Nome do Cliente
- **vdclnro**: Nro do Endereco

---

## VDCT

**8 campos documentados**

- **vdctautorizacao**: Codigo da Autorizacao
- **vdctbandeira**: Codigo da Bandeira (FK)
- **vdctcodigo**: Codigo Interno
- **vdctcodigovda**: Codigo da venda (FK)
- **vdctoperacao**: Flag Operacao (Debito) (Credito)
- **vdctoperadora**: Codigo da Operadora (FK)
- **vdctparcela**: Quantidade de Parcelas
- **vdctvalor**: Valor do Cartao

---

## VDD1

**4 campos documentados**

- **vdd1codigovda**: Codigo da venda (FK)
- **vdd1empresa**: Codigo da Empresa (FK)
- **vdd1modelo**: Modelo do Documento (FK)
- **vdd1numero**: Numero do Documento

---

## VDEC

**9 campos documentados**

- **vdecccf**: CCF
- **vdeccodigovda**: Codigo da venda (FK)
- **vdeccoo**: COO
- **vdeccro**: CRO
- **vdeccrz**: CRZ
- **vdececf**: Numero da ECF
- **vdecempresa**: Codigo da empresa
- **vdecgt**: Valor do GT
- **vdecserie**: Numero de Serie

---

## VDEDOC

**15 campos documentados**

- **vdedocautocorrecao**: SgaEdoc aplica possivel auto correção de dados
- **vdedoccodigovda**: Codigo da venda (FK)
- **vdedocempresa**: Codigo da Empresa (FK)
- **vdedocoriginalchave**: Chave de acesso do arquivo original
- **vdedocoriginalxml**: XML do arquivo original
- **vdedocprocessando**: Data do Processamento
- **vdedocstscancelado**: Status: 00-Sem Ação|10-Solicitar Descarte|30-Falha no Descarte|100-Numero Inutilizado|101-Documento Cancelado|102-Documento Substituido
- **vdedocstscontingencia**: Status: 00-Sem Ação|100-Contingencia OFF|101-Contingencia FS|102-Contingencia SCAN|103-Contingencia DPEC|104-Contingencia FSDA
- **vdedocstsdestino**: Status: 00-Sem Ação|10-Solicitar e-mail|11-Solicitar Whats|30-Falha no Envio|100-Documento Destinado
- **vdedocstsenvio**: Status: 00-Sem Ação|10-Gerar XML|11-Enviar Sefaz|30-Falha Envio|31-Documento Rejeitado|32-Documento Denegado|100-Documento Autorizado
- **vdedocstsimpressao**: Status: 00-Sem Ação|10-Solicitar Bobina|11-Solicitar A4|12-Solicitar Romaneio|13-Solicitar A4+Bobina|30-Falha na Impressao|100-Documento Impresso
- **vdedoctagrejeicao**: cStat de rejeição da NFCe/NFe
- **vdedoctentativaproxima**: Data da Proxima Tentativa
- **vdedoctentativavezes**: Quantidade de Tentativas
- **vdedocterminalimpressao**: Nome do Terminal Destino da Impressao

---

## VDESQ

**6 campos documentados**

- **vdesqcodigo**: Codigo Sequencial
- **vdesqempresa**: Empresa
- **vdesqmodelo**: Modelo
- **vdesqnumero**: Numero
- **vdesqorigem**: Origem
- **vdesqserie**: Serie

---

## VDFL

**14 campos documentados**

- **vdflauditado**: Data da Auditoria
- **vdflchave**: Chave do Documento Fiscal
- **vdflcodigo**: Código Sequencial da Auditoria
- **vdfldata**: Data do Documento
- **vdfldocumento**: tipo do Documento (55,65,...)
- **vdflempresa**: Código da Empresa
- **vdflhistorico**: Historico da Auditoria
- **vdflnumero**: Numero do Documento Fiscal
- **vdflorigem**: Flag de Origem da Sequencia (VDA,NRA,...)
- **vdflprotocolo**: Protocolo de Envio do Documento Fiscal
- **vdflretornosefaz**: Xml de Retorno da Sefaz
- **vdflsequencia**: Numero de Sequencia do Documento
- **vdflstatus**: Flag Status 0-Inexistente 1-Inconsistente 2-Sem Xml
- **vdflvalor**: Valor do Documento

---

## VDFY

**3 campos documentados**

- **vdfycodigovda**: Codigo da venda (FK)
- **vdfyempresa**: Codigo da Empresa (FK)
- **vdfyfidelity**: Numero do Fidelity

---

## VDIC

**67 campos documentados**

- **vdicacrescimocad**: Valor Total de Acrescimos(+) ou Descontos(-) por Cadastro Fixo
- **vdicacrescimoite**: Valor Total de Acrescimos(+) ou Descontos(-) por Item Manual
- **vdicacrescimotab**: Valor Total de Acrescimos(+) ou Descontos(-) por Tabela de Preco
- **vdicacrescimotot**: Valor Total de Acrescimos(+) ou Descontos(-) por Total Manual
- **vdicaliqadrem**: Aliquota AdRem do combustível monofásico
- **vdicaliqcofins**: Aliquota de Cofins
- **vdicaliqfcp**: Aliquota FCP
- **vdicaliqicms**: Aliquota de Icms
- **vdicaliqipi**: Aliquota de Ipi
- **vdicaliqirrf**: Aliquota IRRF
- **vdicaliqpis**: Aliquota de Pis
- **vdicaliqst**: Aliquota de ST
- **vdicautomacao**: Codigo da Automacao (FK)
- **vdicbase**: Valor unitario Base da mercadoria
- **vdicbasefcp**: Base de FCP
- **vdicbaseicms**: Base de Icms
- **vdicbaseipi**: Base de Ipi
- **vdicbasepc**: Base de Pis Cofins
- **vdicbasest**: Base de ST
- **vdicbico**: Codigo do Bico (FK)
- **vdicbomba**: Codigo da Bomba (FK)
- **vdiccalcbasest**: Cálculo de Base ST Médio Sobre as Compras
- **vdiccalcvlrst**: Cálculo do Valor ST Médio Sobre as Compras
- **vdiccfop**: Codigo CFOP (FK)
- **vdiccodigo**: Codigo Interno
- **vdiccodigovda**: Codigo da venda (FK)
- **vdiccombo**: Código do combo PRODCODIGO
- **vdiccomissao**: Valor Total da Comissao
- **vdiccusto**: CMV - custo unitario da mercadoria vendida
- **vdicdatapedido**: Data e Hora Inclusão Item
- **vdicempresa**: Codigo da Empresa
- **vdicencerranteaut**: Encerrante da Automacao no Momento da Venda
- **vdicencerrantesis**: Encerrante do Sistema no Momento da Venda
- **vdicencerrantetip**: Encerrante Tipo de Calculo
- **vdicestoq**: Código do Estoq(FK)
- **vdicestoque**: Estoque do produto no Momento da Venda
- **vdicimpostosaproxe**: Valor de Impostos Aproximados Estadual
- **vdicimpostosaproxf**: Valor de Impostos Aproximados Federal
- **vdicimpostosaproxm**: Valor de Impostos Aproximados Municipal
- **vdicipirangaatividadecomponente**: IPIRANGA: Código Atividade Componente
- **vdicipirangacodinterno**: IPIRANGA: Código Interno
- **vdicipirangacodlivre**: IPIRANGA: Código Livre
- **vdicitem**: Sequencia do Item
- **vdicnatrec**: Natureza de Receita
- **vdicpercbiocomb**: Percentual do Bio Combustivel
- **vdicproduto**: Codigo do Produto (FK)
- **vdicpromodesconto**: Valor do desconto promocional
- **vdicqtd**: Quantidade
- **vdicstatus**: Status 0-Normal 1-Cancelado
- **vdicstic**: Sitrib de Icms (FK)
- **vdicstip**: Sitrib de Ipi (FK)
- **vdicstpc**: Sitrib de Pis Cofins (FK)
- **vdicsubtotal**: Valor SubTotal do Item (qtd x base)
- **vdictabela**: Tabela de Preço Fixa de (1 a 12) ou 99-Digitado Manual
- **vdictanque**: Codigo do Tanque (FK)
- **vdictotal**: Valor Total do Item (qtd x unitario) = (subtotal+-acrescimos)
- **vdictotparcial**: Totalizador Parcial do ECF
- **vdicunitario**: Valor unitario de venda da mercadoria
- **vdicvendedor**: Codigo do Vendedor (FK)
- **vdicvlrcofins**: Valor de Cofins
- **vdicvlrfcp**: Valor FCP
- **vdicvlricms**: Valor de Icms
- **vdicvlricmsmonoret**: Valor ICMS cobrado anteriormente combustivel monofasico
- **vdicvlripi**: Valor de Ipi
- **vdicvlrirrf**: Valor de IRRF
- **vdicvlrpis**: Valor de Pis
- **vdicvlrst**: Valor de ST

---

## VDIKMV

**23 campos documentados**

- **vdikmvcheckoutenvio**: Json Resgate Avulso Envio
- **vdikmvcheckoutretorno**: Json Resgate Avulso Retorno
- **vdikmvcodigo**: Codigo Sequencial
- **vdikmvcodigoerro**: Código Erro
- **vdikmvcodigovdakmv**: Codigo VDAKMV
- **vdikmvdesconto**: Desconto
- **vdikmvempresa**: Codigo Empresa
- **vdikmvipirangaatividade**: Código Atividade Componente 1-Pista|2-AM/PM|3-JetOil
- **vdikmvipirangaproduto**: Produto Ipiranga
- **vdikmvmsgkmv**: Mensagem KMV
- **vdikmvnsu**: NSU Origem
- **vdikmvnsucancelamento**: NSU Cancelamento
- **vdikmvnsudestino**: NSU Destino
- **vdikmvproduto**: Produto SGA
- **vdikmvprodutonome**: Nome Produto
- **vdikmvqtd**: Qtd
- **vdikmvsaldokm**: Saldo KM
- **vdikmvsaldoreais**: Saldo Reais
- **vdikmvsubtotal**: SubTotal
- **vdikmvtipo**: Tipo: 1-Resgate Pendente|2-Acúmulo Pendente|3-Resgate Realizado|4-Acúmulo Realizado|5 - Cancelamento Resgate Pendente|6-Cancelamento Resgate Realizado|7-Cancelamento Acúmulo Pendente|8-Cancelamento Acúmulo Realizado
- **vdikmvtotal**: Total
- **vdikmvvalorresgatado**: Valor Resgatado
- **vdikmvvlrunitario**: Vlr Unitario

---

## VDIT

**72 campos documentados**

- **vditacrescimocad**: Valor Total de Acrescimos(+) ou Descontos(-) por Cadastro Fixo
- **vditacrescimoite**: Valor Total de Acrescimos(+) ou Descontos(-) por Item Manual
- **vditacrescimotab**: Valor Total de Acrescimos(+) ou Descontos(-) por Tabela de Preco
- **vditacrescimotot**: Valor Total de Acrescimos(+) ou Descontos(-) por Total Manual
- **vditaliqadrem**: Aliquota AdRem do combustível monofásico
- **vditaliqcbs**: Aliquota CBS
- **vditaliqcofins**: Aliquota de Cofins
- **vditaliqfcp**: Aliquota FCP
- **vditaliqibs**: Aliquota IBS
- **vditaliqicms**: Aliquota de Icms
- **vditaliqipi**: Aliquota de Ipi
- **vditaliqirrf**: Aliquota IRRF
- **vditaliqpis**: Aliquota de Pis
- **vditaliqst**: Aliquota de ST
- **vditautomacao**: Codigo da Automacao (FK)
- **vditbase**: Valor unitario Base da mercadoria
- **vditbasefcp**: Base de FCP
- **vditbaseicms**: Base de Icms
- **vditbaseipi**: Base de Ipi
- **vditbasepc**: Base de Pis Cofins
- **vditbasest**: Base de ST
- **vditbico**: Codigo do Bico (FK)
- **vditbomba**: Codigo da Bomba (FK)
- **vditcalcbasest**: Cálculo de Base ST Médio Sobre as Compras
- **vditcalcvlrst**: Cálculo do Valor ST Médio Sobre as Compras
- **vditcfop**: Codigo CFOP (FK)
- **vditcodigo**: Codigo Interno
- **vditcodigovda**: Codigo da venda (FK)
- **vditcombo**: Código do combo PRODCODIGO
- **vditcomissao**: Valor Total da Comissao
- **vditcusto**: CMV - custo unitario da mercadoria vendida
- **vditdatapedido**: Data e Hora Inclusão Item
- **vditempresa**: Codigo da Empresa
- **vditencerranteaut**: Encerrante da Automacao no Momento da Venda
- **vditencerrantesis**: Encerrante do Sistema no Momento da Venda
- **vditencerrantetip**: Encerrante Tipo de Calculo
- **vditestoq**: Código do Estoq(FK)
- **vditestoque**: Estoque do produto no Momento da Venda
- **vditignoraestoque**: Flag de Estoque 0-calcula 1-ignora
- **vditimpostosaproxe**: Valor de Impostos Aproximados Estadual
- **vditimpostosaproxf**: Valor de Impostos Aproximados Federal
- **vditimpostosaproxm**: Valor de Impostos Aproximados Municipal
- **vditipirangaatividadecomponente**: IPIRANGA: Código Atividade Componente
- **vditipirangacodinterno**: IPIRANGA: Código Interno
- **vditipirangacodlivre**: IPIRANGA: Código Livre
- **vdititem**: Sequencia do Item
- **vditiva**: Classificacao Fiscal do IVA
- **vditnatrec**: Natureza de Receita
- **vditpercbiocomb**: Percentual do Bio Combustivel
- **vditproduto**: Codigo do Produto (FK)
- **vditpromodesconto**: Valor do desconto promocional
- **vditqtd**: Quantidade
- **vditstatus**: Status 0-Normal 1-Cancelado
- **vditstic**: Sitrib de Icms (FK)
- **vditsticorigemsai**: ORIGEM ST ICMS DE SAIDA
- **vditstip**: Sitrib de Ipi (FK)
- **vditstpc**: Sitrib de Pis Cofins (FK)
- **vditsubtotal**: Valor SubTotal do Item (qtd x base)
- **vdittabela**: Tabela de Preço Fixa de (1 a 12) ou 99-Digitado Manual
- **vdittanque**: Codigo do Tanque (FK)
- **vdittotal**: Valor Total do Item (qtd x unitario) = (subtotal+-acrescimos)
- **vdittotparcial**: Totalizador Parcial do ECF
- **vditunitario**: Valor unitario de venda da mercadoria
- **vditvendedor**: Codigo do Vendedor (FK)
- **vditvlrcofins**: Valor de Cofins
- **vditvlrfcp**: Valor FCP
- **vditvlricms**: Valor de Icms
- **vditvlricmsmonoret**: Valor ICMS cobrado anteriormente combustivel monofasico
- **vditvlripi**: Valor de Ipi
- **vditvlrirrf**: Valor de IRRF
- **vditvlrpis**: Valor de Pis
- **vditvlrst**: Valor de ST

---

## VDLE

**14 campos documentados**

- **vdlebairro**: Bairro do Endereco de Entrega
- **vdlecep**: Cep do Endereco de Entrega
- **vdlecidade**: Cidade do Endereco de Entrega
- **vdlecnpjcpf**: CNPJ/CPF do Recebedor
- **vdlecodigovda**: Codigo da venda (FK)
- **vdlecomplemento**: Complemento do Endereco de Entrega
- **vdleemail**: Email do Recebedor
- **vdleempresa**: Codigo da Empresa (FK)
- **vdleie**: IE do Recebedor
- **vdlelogradouro**: Logradouro do Endereco de Entrega
- **vdlenumero**: Numero do Endereco de Entrega
- **vdlerecebedor**: Nome do Recebedor
- **vdletelefone**: Telefone do Recebedor
- **vdleuf**: UF do Endereco de Entrega

---

## VDMT

**12 campos documentados**

- **vdmtcaixa**: Caixa
- **vdmtcodigo**: Codigo Interno
- **vdmtcodigovda**: Codigo da venda (FK)
- **vdmtcodmot**: 1-Desc 2-Acr 3-Canc Item 4-Canc Vda At 5-Canc Vda Conc 6-LctoItem
- **vdmtdata**: Data e hora do motivo
- **vdmtempresa**: Codigo da empresa (FK)
- **vdmtliberapdv**: LiberaPDV 0=nada 1-Liberado pra Enviar 10-Enviado
- **vdmtmotivo**: Motivo
- **vdmtproduto**: Produto (FK)
- **vdmtqtd**: Quantidade
- **vdmtusuario**: Usuário Ativo
- **vdmtvlr**: Valor Total

---

## VDNF

**60 campos documentados**

- **vdnfajtecnico**: Observações de Ajustes Tecnicos
- **vdnfajustecancel**: Numero da NRA de ajuste de cancelamento
- **vdnfautocontultdt**: Data e Hora da Ultima Tentativa de Auto Envio da Contingencia
- **vdnfautocontultvx**: Quantidade de Tentativas de Auto Envio da Contingencia
- **vdnfautorizacao**: Data e Hora da Autorizacao
- **vdnfcancdominio**: ID do Envio da Nota(Cancelada) para API Dominio
- **vdnfchave**: Chave da NFe
- **vdnfchavecancel**: Chave de Cancelamento
- **vdnfcnpjcpfcancelsat**: Cnpj ou Cpf de Cancelamento do SAT
- **vdnfcodigovda**: Codigo da venda (FK)
- **vdnfcontingencia**: Contingencia 1-Normal 2-FS 3-SCAN 4-DPEC 5-FSDA 9-OFFLINE
- **vdnfcontingenciadata**: Data e Hora da Entrada na Contingencia
- **vdnfdataextemporaneo**: Data de movimento para Documento Extemporâneo 
- **vdnfdatahoraepec**: Data Hora Envio EPEC
- **vdnfdescarte**: Flag de Descarte: 0-nao 1-sim
- **vdnfdominio**: ID do Envio da Nota para API Dominio
- **vdnfempresa**: Codigo da Empresa (FK)
- **vdnfimportacaons**: Importação Nota Segura 0-Nao 1-Sim
- **vdnfinfoadicional**: Informações Adicionais da Nota Fiscal
- **vdnfipirangacomponente**: Ipiranga: Código Componente Venda
- **vdnfipirangadatasync**: Data Envio Ipiranga
- **vdnfipirangahash**: Controle Ipiranga
- **vdnfipirangahttpcodigo**: Ipiranga: Código do Erro que retornou o envio da SALES V2
- **vdnfipirangajsonsalesretorno**: Ipiranga: Json com o objeto de retorno da Sales V2 quando ocorre erro no envio
- **vdnfipirangaprofrotadatasync**: Data Envio Ipiranga Pro Frota
- **vdnfipirangaprofrotahash**: Controle Ipiranga Pro Frota
- **vdnfloteepec**: Lote Envio EPEC
- **vdnfmodelo**: Modelo do Documento (FK)
- **vdnfnatureza**: Descricao da natureza da operacao
- **vdnfnumero**: Numero do Documento
- **vdnfprocesso**: 0-Pend,1-Valid,2-Sefaz,3-Rejei,10-Aut,11-Canc,12-Dene,20-Inut,80-Incons,99-Ag.Descarte, 0 com vdnfcontingencia 9 = nota em contingencia
- **vdnfprotocolo**: Protocolo de autorizacao
- **vdnfprotocoloepec**: Protocolo Envio EPEC
- **vdnfrecibo**: Recibo de Transmissao
- **vdnfsaida**: Data e Hora da Saida
- **vdnfserie**: Serie
- **vdnfsimpfaturamento**: Codigo da NFe (NRA) de Simples Faturamento
- **vdnftagretornosefaz**: TAG de Retorno da Sefaz
- **vdnfticketlogdatasync**: Data Envio Nota para Ticket Log
- **vdnfticketloghash**: Valor codificado HASH MD5 do arquivo XML enviado
- **vdnfticketloghttpcodigo**: TicketLog: Código do Erro que retornou o envio da Nota
- **vdnfticketlogjsonretorno**: TicketLog: Json com o objeto de retorno da Nota quando ocorre erro no envio
- **vdnftipoprint**: Flag 0-Completa/A4 1-Resumida/Bobina 2-Nao Imprimir
- **vdnfuploadxmlaut**: Data e Hora do Upload do XML autorizacao
- **vdnfuploadxmlautns**: Data e Hora do Upload do XML autorizacao  (Nota Segura)
- **vdnfuploadxmlcan**: Data e Hora do Upload do XML cancelamento
- **vdnfuploadxmlcanns**: Data e Hora do Upload do XML cancelamento (Nota Segura)
- **vdnfuploadxmlinu**: Data e Hora do Upload do XML inutilizacao
- **vdnfuploadxmlinuns**: Data e Hora do Upload do XML inutilizacao (Nota Segura)
- **vdnfxmlcancel**: XML de Cancelamento do Documento
- **vdnfxmldescarte**: XML de Descarte do Documento
- **vdnfxmlemail**: Data e Hora do Envio do e.mail do documento
- **vdnfxmlenvio**: XML de Envio do documento
- **vdnfxmlepec**: XML EPEC Montado
- **vdnfxmlepecassinado**: XML EPEC Assinado
- **vdnfxmlepecenvio**: XML EPEC Enviado
- **vdnfxmlinutil**: XML de Inutilizacao do Documento
- **vdnfxmlprint**: Data e Hora da Impressao do documento
- **vdnfxmlretornosefaz**: XML de Retorno da Sefaz
- **vdnfxmlrps**: XML do RPS do Documento

---

## VDOC

**4 campos documentados**

- **vdoccodigovda**: Codigo da venda (FK)
- **vdocempresa**: Codigo da empresa (FK)
- **vdocnitemped**: Numero do Item
- **vdocxped**: Numero da Ordem de Compra

---

## VDPDOC

**9 campos documentados**

- **vdpdoccodigo**: Codigo (PK)
- **vdpdoccodigovda**: Codigo da venda (FK)
- **vdpdocdata**: Data
- **vdpdocempresa**: Codigo da Empresa (FK)
- **vdpdocprocesso**: Status
- **vdpdocstatus**: Status
- **vdpdocversao**: Codigo da Versao
- **vdpdocxmlenvio**: XML de Envio
- **vdpdocxmlretorno**: XML de Retorno

---

## VDPG

**24 campos documentados**

- **vdpgaltpgto**: Flag Alteracao Forma Pgto 0-Nao 1-Sim
- **vdpgautorizacao**: Numero de Autorizacao
- **vdpgbolapiccrrcodigo**: Codigo da Conta Corrente ao Qual foi Gerado Boleto via API (PDV) OffLine
- **vdpgbolapilinhadigitavel**: Linha Digitavel Gerada no Boleto Registrado via API (PDV) OffLine
- **vdpgbolapinossonumero**: Nosso Numero Gerado no Boleto Registrado Via API (PDV) OffLine
- **vdpgbolapinumeroboleto**: Numero do Boleto Gerado Registrado Via API (PDV) OffLine
- **vdpgbolapiurlpix**: Pix Url Gerada no Boleto Registrado via API (PDV) OffLine
- **vdpgchavetef**: Chave do Cartao (FK)
- **vdpgcodigo**: Codigo Sequencial
- **vdpgcodigoconciliacao**: Código usado para rastrear a conciliação
- **vdpgcodigonpag**: Codigo do Parcelamento a Prazo(FK)
- **vdpgcodigovda**: Codigo da venda (FK)
- **vdpgcodret**: Codigo do Retorno
- **vdpgconferido**: Flag p/ marcar registros conferidos no caixa
- **vdpgempresa**: Codigo da Empresa
- **vdpgforma**: 1-Din 2-Prz 3-Chq 4-Pre 5-CtD 6-CtC 7-TfD 8-TfC 9-Vales 10-Frete 11-VdPrg 12-Deposito
- **vdpgidfechmfe**: IDFechamento da MFE
- **vdpgidpgtomfe**: IDPagamento da MFE
- **vdpgidterminal**: ID do terminal de pagamento
- **vdpgnsu**: variavel NSU
- **vdpgperfiltef**: Perfil TEF utilizado na transação da venda
- **vdpgradical**: Radical do Cadastro
- **vdpgvalor**: Valor da Forma de Pagamento
- **vdpgvencimento**: Vencimento do Prazo

---

## VDSF

**11 campos documentados**

- **vdsfcodigo**: Codigo Sequencial
- **vdsfcodigovda**: Codigo da venda (FK)
- **vdsfcomsefaz**: Flag Comunicacao Sefaz 0-Nao 1-Sim
- **vdsfdata**: Data e Hora
- **vdsfempresa**: Codigo da empresa (FK)
- **vdsfobs**: Observacoes
- **vdsfprocesso**: Processo de Comunicacao
- **vdsfretorno**: Retorno da Sefaz
- **vdsfterminal**: Terminal
- **vdsfusuario**: Usuario
- **vdsfxml**: XML da Sefaz

---

## VDSV

**4 campos documentados**

- **vdsvcodigovda**: Codigo da venda (FK)
- **vdsvempresa**: Codigo da Empresa (FK)
- **vdsvmodelo**: Modelo do Documento (FK)
- **vdsvnumero**: Numero do Documento

---

## VDTO

**10 campos documentados**

- **vdtocheque**: Codigo do Cheque (FK)
- **vdtocodigo**: Codigo Sequencial
- **vdtocodigovda**: Codigo da Venda (PK)
- **vdtocodordempagamento**: Codigo da Ordem de Pagamento
- **vdtoempresa**: Codigo da Empresa
- **vdtoradical**: Radical do Cadastro
- **vdtotipo**: Tipo do Troco: 1-Dinheiro 2-Vale 3-Cheque 4-Vda Prg
- **vdtovale**: Codigo do Vale (FK)
- **vdtovalor**: Valor do Troco
- **vdtovencimento**: Vencimento do Cheque

---

## VDTR

**13 campos documentados**

- **vdtrbruto**: Peso Bruto dos Volumes
- **vdtrcodigovda**: Codigo da venda (FK)
- **vdtrempresa**: Codigo da Empresa (FK)
- **vdtrespecie**: Especide dos Volumes
- **vdtrfrete**: (0)Emitente (1)Destinatario (2)Terceiros (9)Sem frete
- **vdtrlacres**: Lacres dos Volumes
- **vdtrliquido**: Peso Liquido dos Volumes
- **vdtrmarca**: Marca dos Volumes
- **vdtrnumeracao**: Numeracao dos Volumes
- **vdtrplaca**: Placa do Veiculo transportador
- **vdtrqtd**: Qtd dos Volumes
- **vdtrtransportador**: Codigo do Transportador (FK)
- **vdtrufveiculo**: UF do Veiculo

---

## VDVE

**8 campos documentados**

- **vdvecodigovda**: Codigo da venda (FK)
- **vdveempresa**: Codigo da Empresa (FK)
- **vdvefrota**: Frota
- **vdvekm**: KM
- **vdvemedia**: Media
- **vdveplaca**: Placa do Veiculo
- **vdverequisicao**: Numero da Requisicao
- **vdveveiculo**: Veiculo

---

## VEIC

**10 campos documentados**

- **veiccapacidadetanque**: Capacidade do tanque do veículo
- **veiccodpatrimonio**: Código de patrimônio do veículo
- **veiccor**: Cor do Veiculo
- **veicexmediadoc**: Exibir Media do Consumo no Doc Fiscal 0-Não | 1-Sim
- **veicfrota**: Frota do Veiculo
- **veicidcode**: ID CODE do Veiculo
- **veicobsvenda**: Observação exibida na venda para esta placa
- **veicparticipante**: Participante (FK)
- **veicplaca**: Placa
- **veicveiculo**: Descricao do Veiculo

---

## VEIP

**3 campos documentados**

- **veipcodigo**: Codigo
- **veipprodcodigo**: Produto (FK)
- **veipveicplaca**: Veiculo (FK)

---

## VENDAAUTOCONF

**6 campos documentados**

- **vendaautoconfcodigo**: Código Sequencial (PK)
- **vendaautoconfempresa**: Código da Empresa (FK)
- **vendaautoconfintervalo**: Intervalo em Minutos entre vendas em segundos
- **vendaautoconfpausepdv**: Pause no PDV 0 - Liberado | 1 - Pausado
- **vendaautoconfterm**: Nome do Terminal
- **vendaautoconftimer**: Tempo em Minutos para Realizar a venda automática

---

## VER

**1 campos documentados**

- **verrodatrigger**: Flag 0-Enabled 1-Disable

---

## VERO

**9 campos documentados**

- **verocodigo**: Codigo Sequencial
- **verodataultimologin**: Data e Hora do último Login
- **veroforcaatualizar**: Força Atualizar: 0-Não | 1-Sim
- **veroidmaquina**: ID unico da Máquina rodando o Executável
- **veronomeexe**: Nome do Executável
- **veronomemaquina**: Nome da Máquina rodando o Executável
- **veroversaoatual**: Versão Atual do Executável
- **veroversaodisponivel**: Versão Disponível do Executável
- **veroversaoexigida**: Versão Exigida do Executável

---

## VERS

**5 campos documentados**

- **verscodigo**: Codigo da Versão
- **versconteudo**: Conteudo da Versão
- **versdata**: Data da Versão
- **versfechado**: Versão  Fechada 0-Não | 1-Sim
- **versrepositorio**: Atualiza Repositorio 0-Não | 1-Sim

---

## VL4U

**16 campos documentados**

- **vl4uchaveautenticacao**: Chave Autenticação
- **vl4ucodigo**: Codigo Sequencial
- **vl4ucodigovda**: Codigo VDA
- **vl4ucupom**: Cupom Desconto
- **vl4udata**: Data Transação
- **vl4udesconto**: Value4u Valor Desconto
- **vl4uempresa**: Codigo Empresa
- **vl4ujsoncancelaenvio**: Json Cancela Envio
- **vl4ujsoncancelaretorno**: Json Cancela Retorno
- **vl4ujsonconfirmaenvio**: Json Confirma Envio
- **vl4ujsonconfirmaretorno**: Json Confirma Retorno
- **vl4ujsonvalidaenvio**: Json Valida Envio
- **vl4ujsonvalidaretorno**: Json Valida Retorno
- **vl4uorigem**: Origem 1-TEF|2-DescontoAcumulo
- **vl4ustatus**: Status Cupom 0-VendaPendente|1-ConfirmaPendente|2-ConfirmaConcluido|3-CancelaPendente|4-CancelaConcluida|5-ConfirmaComErro|6-CancelaComErro
- **vl4uupdatevenda**: Enviou os dados da Venda para Value4u 0-Não|1-Sim

---

## VLCX

**14 campos documentados**

- **vlcxcombustivel**: Codigo do combustivel
- **vlcxempresa**: Codigo da Empresa (FK)
- **vlcxv1**: Vlr Venda 1
- **vlcxv10**: Vlr Venda 10
- **vlcxv11**: Vlr Venda 11
- **vlcxv12**: Vlr Venda 12
- **vlcxv2**: Vlr Venda 2
- **vlcxv3**: Vlr Venda 3
- **vlcxv4**: Vlr Venda 4
- **vlcxv5**: Vlr Venda 5
- **vlcxv6**: Vlr Venda 6
- **vlcxv7**: Vlr Venda 7
- **vlcxv8**: Vlr Venda 8
- **vlcxv9**: Vlr Venda 9

---

## VPAY

**16 campos documentados**

- **vpayacumulokmvbase64**: Imagem/JSON Comprovante Acumulo KMV
- **vpaycodigo**: Codigo Sequencial
- **vpaycodigovda**: Codigo VDA
- **vpaycupomfiscalbase64**: Imagem Base64 do Cupom fiscal
- **vpaycustomjson**: Custom JSON
- **vpaydata**: Data e hora da Venda
- **vpayempresa**: Codigo da Empresa (Fk)
- **vpayhash**: Chave Hash para controle de vendas
- **vpayjsonvenda**: JSON Venda
- **vpayjsonvendapay**: JSON Venda PAY
- **vpaymensagem**: Descrição de Alerta/Aviso/Erro
- **vpaypontuacaobase64**: Imagem Base64 da pontuação
- **vpaystatus**: Status Venda 0-Pendente 1-Sucesso 2-Erro
- **vpaytentativa**: Numero de Tentativas
- **vpayterminal**: Nome do Terminal SgaPay
- **vpayxmlvenda**: XML Venda

---

## VSQL

**6 campos documentados**

- **vsqlcodigo**: Codigo PK tabela
- **vsqldescricao**: Descricao
- **vsqlinstrucao**: Descricao
- **vsqlordem**: Ordem de Execução de Sql (Apenas para tipo 3) 
- **vsqlstatus**: 0-Inativo | 1-Ativo
- **vsqltipo**: Tipo 1- Sped Fiscal | 2-Sped Contribuicoes | 3-Correções Sped | 4-Ambos | 5-Validar Compras |6-Correções Compra

---

