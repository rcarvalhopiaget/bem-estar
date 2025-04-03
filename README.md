# BemEstar - Gestão de Refeições Escolares

Este projeto é uma aplicação web desenvolvida para gerenciar o registro e controle de refeições em um ambiente escolar. O objetivo principal é facilitar o acompanhamento do consumo de refeições pelos alunos, considerando seus planos e dias permitidos.

## Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) 15.2.4 (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [Shadcn/UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Banco de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Formulários:** [React Hook Form](https://react-hook-form.com/)
- **Validação:** [Zod](https://zod.dev/)
- **Notificações:** [React Hot Toast](https://react-hot-toast.com/)
- **Envio de Emails:** [Nodemailer](https://nodemailer.com/) & [EmailJS](https://www.emailjs.com/) (dependendo do fluxo)
- **Utilitários:** date-fns, clsx, lucide-react

## Funcionalidades Principais

- **Cadastro e Gestão de Alunos:**
  - Informações básicas do aluno.
  - Definição do tipo de plano (Integral, Meio Período, etc.).
  - Seleção dos dias da semana permitidos para refeição (para planos específicos).
- **Registro Rápido de Refeições:**
  - Interface otimizada para marcar rapidamente a refeição de um aluno.
  - Busca de alunos por nome ou turma.
  - Validação de limites semanais de refeições por aluno.
  - Diferenciação entre refeições regulares e avulsas (cobradas à parte).
- **Relatórios:**
  - Envio de relatório diário por email com o resumo das refeições servidas (total e avulsas).
  - Geração de arquivo CSV anexo ao email com detalhes do relatório.
- **Controle de Acesso:** Autenticação de usuários para acesso ao sistema.

## Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/rcarvalhopiaget/bem-estar.git
    cd bem-estar
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    # ou
    pnpm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    - Copie o arquivo de exemplo `.env.example` para `.env.local`:
      ```bash
      cp .env.example .env.local
      ```
    - Preencha as variáveis no arquivo `.env.local` com as suas credenciais do Firebase e configurações de email (EmailJS, Nodemailer). Consulte o `.env.example` para saber quais variáveis são necessárias.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    # ou
    pnpm dev
    ```

    Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

## Scripts Disponíveis

- `dev`: Inicia o servidor de desenvolvimento Next.js.
- `build`: Compila a aplicação para produção.
- `start`: Inicia um servidor de produção Next.js.
- `lint`: Executa o linter (ESLint) para verificar a qualidade do código.
- `sendDailyReport`: Executa o script para gerar e enviar o relatório diário de refeições (geralmente configurado como uma tarefa agendada/cron job).

## Estrutura do Projeto (Simplificada)

```
bem-estar/
├── public/               # Arquivos estáticos
├── scripts/              # Scripts Node.js (ex: envio de relatório)
├── src/
│   ├── app/              # Rotas e páginas (Next.js App Router)
│   ├── components/       # Componentes React reutilizáveis (UI, etc.)
│   ├── config/           # Configurações (ex: Firebase)
│   ├── contexts/         # Contextos React (se houver)
│   ├── hooks/            # Hooks React customizados
│   ├── lib/              # Funções utilitárias gerais
│   ├── services/         # Lógica de negócio, interações com APIs/DB
│   └── types/            # Definições de tipos TypeScript
├── .env.local            # Variáveis de ambiente (não versionado)
├── .env.example          # Exemplo de variáveis de ambiente
├── next.config.mjs       # Configuração do Next.js
├── package.json          # Dependências e scripts do projeto
├── tailwind.config.ts    # Configuração do Tailwind CSS
├── tsconfig.json         # Configuração do TypeScript
└── README.md             # Este arquivo
```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto não possui uma licença definida publicamente no momento.
