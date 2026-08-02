// Espelha as listas válidas do backend (starvl-api/routes/metas.js) com
// rótulos amigáveis para os selects.

export const TIPOS_META = [
  { value: 'empresa',        label: 'Empresa' },
  { value: 'filial',         label: 'Filial' },
  { value: 'departamento',   label: 'Departamento' },
  { value: 'equipe',         label: 'Equipe' },
  { value: 'funcionario',    label: 'Funcionário' },
  { value: 'vendedor',       label: 'Vendedor' },
  { value: 'caixa',          label: 'Caixa' },
  { value: 'comprador',      label: 'Comprador' },
  { value: 'produto',        label: 'Produto' },
  { value: 'grupo_produtos', label: 'Grupo de Produtos' },
  { value: 'categoria',      label: 'Categoria' },
  { value: 'marca',          label: 'Marca' },
  { value: 'fornecedor',     label: 'Fornecedor' },
  { value: 'cliente',        label: 'Cliente' },
];

export const INDICADORES_POR_CATEGORIA = {
  Financeiro: [
    { value: 'Faturamento',   label: 'Faturamento' },
    { value: 'Receita',       label: 'Receita' },
    { value: 'Lucro',         label: 'Lucro' },
    { value: 'Margem',        label: 'Margem' },
    { value: 'TicketMedio',   label: 'Ticket Médio' },
    { value: 'Rentabilidade', label: 'Rentabilidade' },
    { value: 'FluxoCaixa',    label: 'Fluxo de Caixa' },
  ],
  Comercial: [
    { value: 'QuantidadeVendida', label: 'Quantidade Vendida' },
    { value: 'NovosClientes',     label: 'Novos Clientes' },
    { value: 'ClientesAtivos',    label: 'Clientes Ativos' },
    { value: 'Conversao',         label: 'Conversão' },
    { value: 'VendasPorHora',     label: 'Vendas por Hora' },
    { value: 'VendasPorDia',      label: 'Vendas por Dia' },
  ],
  Estoque: [
    { value: 'Giro',         label: 'Giro' },
    { value: 'Cobertura',    label: 'Cobertura' },
    { value: 'EstoqueIdeal', label: 'Estoque Ideal' },
    { value: 'Ruptura',      label: 'Ruptura' },
    { value: 'Perdas',       label: 'Perdas' },
    { value: 'Inventario',   label: 'Inventário' },
  ],
  Compras: [
    { value: 'Economia',          label: 'Economia' },
    { value: 'PrazoMedio',        label: 'Prazo Médio' },
    { value: 'ValorComprado',     label: 'Valor Comprado' },
    { value: 'ProdutosComprados', label: 'Produtos Comprados' },
  ],
  Atendimento: [
    { value: 'TempoMedio',          label: 'Tempo Médio' },
    { value: 'Satisfacao',          label: 'Satisfação' },
    { value: 'ChamadosResolvidos',  label: 'Chamados Resolvidos' },
  ],
};

export const CATEGORIAS_META = Object.keys(INDICADORES_POR_CATEGORIA);

export const FREQUENCIAS_META = ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];

export const PRIORIDADES_META = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const STATUS_META = ['Não iniciada', 'Em andamento', 'Concluída', 'Atrasada', 'Cancelada'];

export const RANKING_TIPOS = [
  { value: 'vendedores',     label: 'Vendedores' },
  { value: 'empresas',       label: 'Empresas' },
  { value: 'departamentos',  label: 'Departamentos' },
  { value: 'produtos',       label: 'Produtos' },
  { value: 'clientes',       label: 'Clientes' },
  { value: 'metas',          label: 'Metas' },
];

export const ALERTA_LABELS = {
  atingiu_100:      'Meta atingida',
  abaixo_esperado:  'Abaixo do esperado',
  prazo_proximo:    'Prazo próximo',
  vencida:          'Meta vencida',
  ultrapassada:     'Meta ultrapassada',
};

export function indicadorLabel(categoria, valor) {
  return INDICADORES_POR_CATEGORIA[categoria]?.find(i => i.value === valor)?.label || valor;
}

export function tipoLabel(valor) {
  return TIPOS_META.find(t => t.value === valor)?.label || valor;
}
