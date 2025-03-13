# BemEstar - Sistema de Gerenciamento de Refeições 🍽️

Sistema web moderno para gerenciamento de refeições, desenvolvido com Next.js 14, Firebase e Tailwind CSS.

## 🚀 Tecnologias

- [Next.js 14](https://nextjs.org/) - Framework React com SSR
- [React 18](https://reactjs.org/) - Biblioteca JavaScript para interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript com tipagem
- [Firebase](https://firebase.google.com/)
  - Authentication - Autenticação de usuários
  - Firestore - Banco de dados NoSQL
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [React Query](https://tanstack.com/query/latest) - Gerenciamento de estado e cache
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Formulários e validação

## 📋 Pré-requisitos

- Node.js (versão LTS recomendada)
- npm ou yarn
- Conta no Firebase
- Variáveis de ambiente configuradas

## 🔧 Instalação

1. Clone o repositório
```bash
git clone https://github.com/rcarvalhopiaget/bem-estar.git
cd bem-estar
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```
Edite o arquivo `.env.local` com suas configurações do Firebase.

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## 🌟 Funcionalidades

- ✅ Autenticação de usuários
  - Login/Registro com email e senha
  - Verificação de email
  - Recuperação de senha
- 📝 Gerenciamento de Refeições
  - Registro de refeições diárias
  - Categorização por tipo (café, almoço, jantar)
  - Histórico de refeições
- 👥 Gestão de Alunos
  - Cadastro e gerenciamento de alunos
  - Associação com refeições
- 🏪 Gestão de Restaurante
  - Informações do estabelecimento
  - Configurações operacionais
- 📊 Relatórios
  - Visualização de estatísticas
  - Exportação de dados

## 🔐 Segurança

- Autenticação robusta com Firebase
- Verificação de email obrigatória
- Regras de segurança no Firestore
- Proteção de rotas no frontend

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para rcarvalhopiaget@gmail.com ou abra uma issue no GitHub.
