'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [resultadoAdmin, setResultadoAdmin] = useState<string[]>([]);

  const handleLimparDuplicados = async () => {
    if (!confirm('Tem certeza que deseja limpar os alunos duplicados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    setResultado([]);
    
    try {
      console.log('Iniciando processo de limpeza...');
      const response = await fetch('/api/admin/limpar-duplicados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        // Verificar se a resposta tem conteúdo antes de tentar parsear
        const text = await response.text();
        console.log('Resposta bruta recebida:', text);
        
        if (text && text.trim() !== '') {
          data = JSON.parse(text);
          console.log('Resposta parseada:', data);
        } else {
          console.warn('Resposta vazia recebida do servidor');
          data = { resultados: ['Resposta vazia recebida do servidor'], totalProcessados: 0 };
        }
      } catch (e) {
        console.error('Erro ao parsear resposta:', e instanceof Error ? e.message : JSON.stringify(e));
        throw new Error('Erro ao processar resposta do servidor. Verifique o console para detalhes.');
      }
      
      if (!response.ok) {
        if (data?.error && data.error.includes('Configuração do Firebase Admin SDK incompleta')) {
          // Erro específico de configuração do Firebase
          toast.error('Erro de configuração do sistema. Contate o administrador.');
          setResultado([data.error]);
          return;
        }
        throw new Error(data?.error || 'Erro ao processar solicitação');
      }

      // Exibir resultados
      if (data?.resultados && Array.isArray(data.resultados)) {
        setResultado(data.resultados);
        toast.success(`Processo concluído! ${data.totalProcessados || 0} registros processados.`);
      } else {
        setResultado(['Resposta inesperada do servidor. Verifique o console para detalhes.']);
        console.warn('Resposta inesperada:', data);
      }
    } catch (error) {
      console.error('Erro ao limpar duplicados:', error);
      toast.error('Erro ao processar solicitação. Verifique o console para detalhes.');
      setResultado([`Erro: ${error instanceof Error ? error.message : JSON.stringify(error)}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarUsuarioAdmin = async () => {
    setLoadingAdmin(true);
    setResultadoAdmin([]);
    
    try {
      // Verificar se o banco de dados e auth estão disponíveis
      if (!db || !auth) {
        toast?.error?.("Erro ao conectar aos serviços necessários");
        return;
      }

      // Dados do usuário admin
      const adminData = {
        email: 'rodrigo.carvalho@jpiaget.com.br',
        nome: 'Rodrigo Carvalho',
        cargo: 'Administrador',
        perfil: 'ADMIN',
        senha: 'Senha@123' // Senha temporária
      };
      
      // Registrar início do processo
      setResultadoAdmin([`Iniciando criação do usuário admin: ${adminData.email}`]);
      
      // Verificar se o usuário já existe
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', adminData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Usuário já existe, atualizar
        const usuarioDoc = querySnapshot.docs[0];
        const usuarioId = usuarioDoc.id;
        
        await updateDoc(doc(db, 'usuarios', usuarioId), {
          nome: adminData.nome,
          cargo: adminData.cargo,
          perfil: adminData.perfil,
          ativo: true,
          updatedAt: serverTimestamp()
        });
        
        setResultadoAdmin([
          ...resultadoAdmin,
          `Usuário ${adminData.email} já existe. ID: ${usuarioId}`,
          'Perfil atualizado para ADMIN e status ativado.'
        ]);
        
        toast.success('Usuário admin atualizado com sucesso!');
      } else {
        // Criar novo usuário
        try {
          // Tentar criar no Auth
          const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.senha);
          await updateProfile(userCredential.user, { displayName: adminData.nome });
          
          // Criar no Firestore
          const novoUsuario = {
            email: adminData.email,
            nome: adminData.nome,
            cargo: adminData.cargo,
            perfil: adminData.perfil,
            ativo: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const docRef = await addDoc(usuariosRef, novoUsuario);
          
          setResultadoAdmin([
            ...resultadoAdmin,
            `Usuário ${adminData.email} criado com sucesso!`,
            `ID: ${docRef.id}`,
            'Perfil: ADMIN',
            'Status: Ativo'
          ]);
          
          toast.success('Usuário admin criado com sucesso!');
        } catch (authError: any) {
          // Se o erro for de usuário já existente no Auth
          if (authError.code === 'auth/email-already-in-use') {
            setResultadoAdmin([
              ...resultadoAdmin,
              `Usuário ${adminData.email} já existe no Auth, mas não no Firestore.`,
              'Criando registro no Firestore...'
            ]);
            
            // Criar apenas no Firestore
            const novoUsuario = {
              email: adminData.email,
              nome: adminData.nome,
              cargo: adminData.cargo,
              perfil: adminData.perfil,
              ativo: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            const docRef = await addDoc(usuariosRef, novoUsuario);
            
            setResultadoAdmin([
              ...resultadoAdmin,
              `Registro criado com sucesso no Firestore.`,
              `ID: ${docRef.id}`
            ]);
            
            toast.success('Registro do usuário admin criado com sucesso!');
          } else {
            throw authError;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao criar usuário admin:', error);
      toast.error('Erro ao criar usuário admin. Verifique o console para detalhes.');
      setResultadoAdmin([
        ...resultadoAdmin,
        `Erro: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      ]);
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Ferramentas de Administração
      </h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Criar/Atualizar Usuário Admin</CardTitle>
            <CardDescription>
              Esta ferramenta cria ou atualiza o usuário admin (rodrigo.carvalho@jpiaget.com.br) com perfil ADMIN e status ativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCriarUsuarioAdmin}
              disabled={loadingAdmin}
            >
              {loadingAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar/Atualizar Usuário Admin'}
            </Button>
            
            {resultadoAdmin.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                {resultadoAdmin.map((linha, index) => (
                  <p key={index} className="font-mono">
                    {linha}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>Limpar Alunos Duplicados</CardTitle>
            <CardDescription>
              Esta ferramenta identifica e remove registros duplicados de alunos no banco de dados.
              Use com cautela, pois esta ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLimparDuplicados}
              disabled={loading}
              variant="destructive"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Limpar Duplicados'}
            </Button>
            
            {resultado.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                {resultado.map((linha, index) => (
                  <p key={index} className="font-mono">
                    {linha}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
