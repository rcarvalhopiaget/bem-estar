# Correção de Problemas do Firebase com Vercel

Este documento explica como resolver os problemas comuns enfrentados ao implantar aplicações Next.js com Firebase no Vercel.

## Problema: Cannot access ._delegate on the server

Este erro ocorre porque o Firebase Client SDK não pode ser usado diretamente em componentes de servidor do Next.js.

### Solução

1. **Separar código client e server**

   Crie arquivos específicos para cliente e servidor:
   
   - `src/lib/firebase.tsx` - Mantenha marcado com `'use client'`
   - `src/lib/firebase-admin.ts` - Para código seguro no servidor
   - `src/lib/server-safe-firebase.ts` - Para funções de servidor seguras

2. **Use o padrão Server Actions**

   ```typescript
   // Em um arquivo com 'use server'
   export async function getServerData() {
     // Implemente aqui a lógica segura para o servidor
   }
   
   // No componente cliente
   import { getServerData } from './servidor-actions';
   
   function ClientComponent() {
     const handleAction = async () => {
       const data = await getServerData();
       // Use os dados
     };
   }
   ```

3. **Adicione o env correto na Vercel**

   Certifique-se que todas as variáveis de ambiente estão configuradas corretamente no painel da Vercel.

4. **Configuração do vercel.json**

   Adicione o seguinte arquivo `vercel.json` na raiz do projeto:

   ```json
   {
     "buildCommand": "npm run build",
     "installCommand": "npm install",
     "framework": "nextjs",
     "buildOptions": {
       "ignoreDevErrors": true
     },
     "env": {
       "NODE_ENV": "production"
     },
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           }
         ]
       }
     ]
   }
   ```

## Problema: Funções não encontradas (pm não é uma função)

Ocorre quando funções client são importadas em componentes de servidor.

### Solução

1. **Crie wrappers para suas funções**

   Como fizemos no arquivo `src/components/ui/toast-utils.tsx`, crie wrappers compatíveis.

2. **Use 'use client' nos componentes que precisam dessas funções**

   Adicione `'use client'` no topo dos componentes que usam bibliotecas client-side.

3. **Dicas adicionais**
   
   - Use dynamic imports quando possível
   - Evite importar libraries de cliente em componentes de servidor
   - Use `next.config.js` para configurar transpilers quando necessário

## Verificação final antes do deploy

Execute o seguinte checklist antes de tentar implantar:

1. ✅ Build local funciona: `npm run build`
2. ✅ Firebase inicializado apenas no cliente
3. ✅ Todas as variáveis de ambiente configuradas
4. ✅ Componentes server e client separados corretamente
5. ✅ vercel.json configurado corretamente 