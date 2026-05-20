# STARVL - Sistema de Gestão de Postos

Sistema completo de gestão para postos de combustíveis com design industrial dark theme e efeitos neon.

## 🚀 Características

- ✨ Design industrial dark theme com efeitos neon vermelhos
- 🔐 Tela de login com glow pulsante
- 📊 Dashboard com múltiplos gráficos interativos
- 📋 Controle de movimentação de combustível
- ⛽ Visualização de posição de estoque com tanque animado
- 👥 Gerenciamento completo de usuários
- 📱 Interface responsiva

## 🛠️ Tecnologias

- React 18
- Recharts (gráficos)
- Lucide React (ícones)
- CSS-in-JS com styled-jsx

## 📦 Instalação

### Método 1: Usando os arquivos .BAT (Windows - RECOMENDADO)

1. Extraia o arquivo ZIP
2. **Duplo clique em `menu.bat`** - Menu interativo completo
   
   OU use os atalhos individuais:
   - `install.bat` - Instala as dependências
   - `start.bat` - Inicia o servidor
   - `stop.bat` - Para o servidor na porta 3000

### Método 2: Via Terminal (Windows/Linux/Mac)

1. Extraia o arquivo ZIP
2. Abra o terminal na pasta do projeto
3. Instale as dependências:

```bash
npm install
```

## ▶️ Executar

### Windows (Fácil):
Duplo clique em `start.bat`

### Terminal:
```bash
npm start
```

O app abrirá automaticamente em [http://localhost:3000](http://localhost:3000)

## 🛑 Parar o Servidor

### Windows:
Duplo clique em `stop.bat`

### Terminal:
Pressione `CTRL + C` na janela onde o servidor está rodando

## 🏗️ Build para Produção

```bash
npm run build
```

Isso criará uma pasta `build` com os arquivos otimizados para produção.

## 📱 Estrutura

```
starvl-app/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx       # Componente principal
│   └── index.js      # Entry point
├── install.bat       # Instala dependências (Windows)
├── start.bat         # Inicia servidor (Windows)
├── stop.bat          # Para servidor (Windows)
├── menu.bat          # Menu interativo completo (Windows)
├── package.json
└── README.md
```

## 🎨 Telas Implementadas

1. **Login** - Autenticação com efeito glow neon pulsante
2. **Dashboard** - Visão geral com gráficos de vendas e estoque
3. **Controle** - Tabela de movimentação diária de combustível
4. **Posição Estoque** - Visual do tanque + projeções + valores
5. **Usuários** - Gestão completa de usuários do sistema

## 🎯 Credenciais de Teste

Qualquer usuário/senha funciona para demonstração.

## 💡 Dicas

- Use Chrome ou Edge para melhor performance
- A aplicação é totalmente responsiva
- Todos os gráficos são interativos (hover para detalhes)

## 🔧 Próximos Passos

Para conectar a um backend real:

1. Configure as APIs no arquivo `App.jsx`
2. Substitua os dados mock por chamadas reais
3. Adicione autenticação JWT
4. Configure variáveis de ambiente

## 📄 Licença

Desenvolvido para STARVL - Todos os direitos reservados.

---

**MOVIMENTO QUE CONECTA.**
