# Deploy no Railway

Este projeto sobe como um unico servico no Railway:

- `starvl-api` roda o Express e responde `/api/*`.
- `starvl-app` e compilado no build e servido pelo Express em producao.

## Variaveis de ambiente

Configure no Railway:

```env
NODE_ENV=production
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_NAME=nome_do_banco
DB_USER=usuario
DB_PASSWORD=senha
DB_SSL=false
```

O Railway fornece `PORT` automaticamente. Nao configure `API_PORT` em producao.

Se o banco exigir SSL, use:

```env
DB_SSL=true
```

## Comandos usados pelo Railway

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

## Observacoes

- Em producao, o frontend usa a API no mesmo dominio do Railway.
- Em desenvolvimento local, o frontend continua usando `http://localhost:3001`.
- O arquivo `.env` real nao deve ser commitado; use as variaveis do Railway.
