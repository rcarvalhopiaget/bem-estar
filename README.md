# BemEstar - Sistema de Bem-Estar e Saúde Mental

![BemEstar Logo](https://firebasestorage.googleapis.com/v0/b/bem-estar-saude.appspot.com/o/logo.png?alt=media)

## Sobre o Projeto

BemEstar é uma aplicação web moderna desenvolvida com Next.js e React para apoiar o bem-estar e a saúde mental. O sistema oferece funcionalidades para acompanhamento de humor, meditações guiadas, exercícios de respiração, e muito mais.

## Tecnologias Utilizadas

- **Frontend**: Next.js 13, React 18, TypeScript
- **UI/Estilos**: Material UI, Emotion
- **Armazenamento**: Firebase (Firestore, Authentication, Storage)
- **Deploy**: Vercel

## Pré-requisitos

- Node.js (versão 16.x ou superior)
- npm (versão 8.x ou superior)
- Git

## Instalação e Execução

### Clonando o Repositório

```bash
git clone https://github.com/seu-usuario/bem-estar.git
cd bem-estar
```

### Instalando Dependências

```bash
npm install
```

### Configurando Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

### Modo de Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
# ou
./desenvolvimento.ps1  # se estiver usando Windows
```

Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

### Modo de Produção

Para compilar e iniciar o servidor em modo de produção:

```bash
npm run build
npm run start
# ou
./producao.ps1  # se estiver usando Windows
```

## Estrutura do Projeto

```
bem-estar/
├── public/           # Arquivos estáticos
├── src/
│   ├── components/   # Componentes React
│   │   ├── ui/       # Componentes de UI reutilizáveis
│   │   └── ...       # Outros componentes
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Bibliotecas e utilidades
│   ├── pages/        # Páginas da aplicação
│   ├── styles/       # Estilos globais
│   └── types/        # Tipos TypeScript
├── scripts/          # Scripts de automação
├── .env.example      # Exemplo de variáveis de ambiente
├── .gitignore        # Arquivos e pastas ignorados pelo Git
├── next.config.js    # Configuração do Next.js
├── package.json      # Dependências e scripts do projeto
└── tsconfig.json     # Configuração do TypeScript
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor em modo de produção
- `npm run lint` - Executa o ESLint para verificar problemas de código

## Scripts PowerShell (Windows)

- `./desenvolvimento.ps1` - Inicia o servidor em modo de desenvolvimento
- `./producao.ps1` - Compila e inicia o servidor em modo de produção
- `./preparar-deploy.ps1` - Prepara o projeto para deploy na Vercel
- `./corrigir-dependencias-mui.ps1` - Instala as dependências corretas do Material UI
- `./corrigir-nextjs.ps1` - Corrige problemas comuns com o Next.js

## Documentação

Consulte os seguintes documentos para informações específicas:

- [Instruções de Produção](./INSTRUÇÕES-PRODUÇÃO.md) - Guia para executar o projeto em ambiente de produção
- [Deploy na Vercel](./DEPLOY-VERCEL.md) - Instruções detalhadas para deploy na Vercel
- [Resolução de Problemas](./RESOLVER-PROBLEMAS.md) - Soluções para problemas comuns
- [Histórico de Correções](./HISTORICO-CORRECOES.md) - Registro das correções realizadas no projeto

## Funcionalidades Principais

- **Registro de Humor**: Acompanhe seu estado emocional diariamente
- **Meditações Guiadas**: Acesse meditações para diferentes objetivos
- **Exercícios de Respiração**: Aprenda técnicas de respiração para reduzir o estresse
- **Diário de Gratidão**: Registre momentos e coisas pelas quais você é grato
- **Estatísticas e Insights**: Visualize padrões e tendências do seu bem-estar ao longo do tempo

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contato

Para suporte ou dúvidas, entre em contato pelo email: seu-email@exemplo.com
