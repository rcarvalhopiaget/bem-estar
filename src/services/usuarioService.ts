import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  deleteUser, 
  updateEmail, 
  sendPasswordResetEmail, 
  User
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Usuario, PerfilUsuario } from '@/types/usuario';
import { checkUserAuthenticated } from '@/lib/auth';

const COLLECTION_NAME = 'usuarios';

// Converter do Firestore para o modelo Usuario
const converterFirestoreParaUsuario = (id: string, data: any): Usuario => {
  return {
    id,
    email: data.email,
    nome: data.nome,
    cargo: data.cargo,
    perfil: data.perfil,
    ativo: data.ativo,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date()
  };
};

// Listar usuários com filtros opcionais
export const listarUsuarios = async (filtros?: {
  perfil?: PerfilUsuario;
  ativo?: boolean;
  busca?: string;
}): Promise<Usuario[]> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  const usuariosRef = collection(db, COLLECTION_NAME);
  let constraints: any[] = [];

  if (filtros?.perfil) {
    constraints.push(where('perfil', '==', filtros.perfil));
  }

  if (filtros?.ativo !== undefined) {
    constraints.push(where('ativo', '==', filtros.ativo));
  }

  const q = constraints.length > 0 
    ? query(usuariosRef, ...constraints)
    : query(usuariosRef);

  const querySnapshot = await getDocs(q);
  
  let usuarios = querySnapshot.docs.map(doc => 
    converterFirestoreParaUsuario(doc.id, doc.data())
  );

  // Filtra por busca se fornecido (feito no cliente para maior flexibilidade)
  if (filtros?.busca) {
    const termoBusca = filtros.busca.toLowerCase();
    usuarios = usuarios.filter(usuario => 
      usuario.nome.toLowerCase().includes(termoBusca) || 
      usuario.email.toLowerCase().includes(termoBusca) ||
      (usuario.cargo && usuario.cargo.toLowerCase().includes(termoBusca))
    );
  }

  // Ordenar por nome
  usuarios.sort((a, b) => a.nome.localeCompare(b.nome));

  return usuarios;
};

// Obter usuário por ID
export const obterUsuarioPorId = async (id: string): Promise<Usuario | null> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return converterFirestoreParaUsuario(docSnap.id, docSnap.data());
  }

  return null;
};

// Obter usuário por email
export const obterUsuarioPorEmail = async (email: string): Promise<Usuario | null> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  const usuariosRef = collection(db, COLLECTION_NAME);
  const q = query(usuariosRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return converterFirestoreParaUsuario(doc.id, doc.data());
  }

  return null;
};

// Criar um novo usuário
export const criarUsuario = async (
  email: string, 
  senha: string, 
  nome: string, 
  perfil: PerfilUsuario,
  cargo?: string
): Promise<Usuario> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Verifica se já existe um usuário com este email
  const usuarioExistente = await obterUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error('Já existe um usuário com este email.');
  }

  // Cria o usuário no Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
  const user = userCredential.user;
  
  // Atualiza o nome de exibição no Auth
  await updateProfile(user, { displayName: nome });

  // Cria o documento do usuário no Firestore
  const novoUsuario = {
    email,
    nome,
    cargo,
    perfil,
    ativo: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), novoUsuario);
  
  return {
    id: docRef.id,
    email,
    nome,
    cargo,
    perfil,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Atualizar um usuário existente
export const atualizarUsuario = async (
  id: string, 
  dados: {
    nome?: string;
    email?: string;
    cargo?: string;
    perfil?: PerfilUsuario;
    ativo?: boolean;
  }
): Promise<Usuario> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Obtém o usuário atual
  const usuarioAtual = await obterUsuarioPorId(id);
  if (!usuarioAtual) {
    throw new Error('Usuário não encontrado.');
  }

  // Prepara os dados para atualização
  const dadosAtualizacao: any = {
    ...dados,
    updatedAt: serverTimestamp()
  };

  // Atualiza o documento no Firestore
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, dadosAtualizacao);

  // Retorna o usuário atualizado
  return {
    ...usuarioAtual,
    ...dados,
    updatedAt: new Date()
  };
};

// Redefinir senha do usuário
export const redefinirSenhaUsuario = async (email: string): Promise<void> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Envia email de redefinição de senha
  await sendPasswordResetEmail(auth, email);
};

// Desativar um usuário
export const desativarUsuario = async (id: string): Promise<void> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Atualiza o status do usuário para inativo
  await atualizarUsuario(id, { ativo: false });
};

// Ativar um usuário
export const ativarUsuario = async (id: string): Promise<void> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Atualiza o status do usuário para ativo
  await atualizarUsuario(id, { ativo: true });
};

// Excluir um usuário (apenas para administradores)
export const excluirUsuario = async (id: string): Promise<void> => {
  // Verifica se o usuário está autenticado
  await checkUserAuthenticated();

  // Obtém o usuário a ser excluído
  const usuario = await obterUsuarioPorId(id);
  if (!usuario) {
    throw new Error('Usuário não encontrado.');
  }

  // Exclui o documento do Firestore
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);

  // Nota: Não estamos excluindo o usuário do Firebase Auth
  // Isso é intencional para manter o histórico e evitar problemas com referências
  // Em vez disso, o usuário é marcado como inativo no Firestore
};

// Atualizar o usuário admin
export const atualizarUsuarioAdmin = async () => {
  try {
      // Verificar se o banco de dados está disponível
      if (!db) {
        throw new Error("Erro ao conectar ao banco de dados. Serviço indisponível.");
      }

    const email = 'rodrigo.carvalho@jpiaget.com.br';
    const nome = 'Rodrigo Carvalho';
    const cargo = 'Administrador';
    const perfil = 'ADMIN';
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = collection(db, COLLECTION_NAME);
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuário já existe, atualizar
      const usuarioDoc = querySnapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      await updateDoc(doc(db, COLLECTION_NAME, usuarioId), {
        nome,
        cargo,
        perfil,
        ativo: true,
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true,
        message: 'Usuário admin atualizado com sucesso',
        id: usuarioId
      };
    } else {
      // Criar o documento do usuário no Firestore
      const novoUsuario = {
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoUsuario);
      
      return { 
        success: true,
        message: 'Usuário admin criado com sucesso',
        id: docRef.id
      };
    }
    
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário admin:', error);
    return {
      success: false,
      error: 'Erro ao criar/atualizar usuário admin',
      details: error
    };
  }
};

// Criar usuário Adriana
export const criarUsuarioAdriana = async () => {
  try {
      // Verificar se o banco de dados está disponível
      if (!db) {
        throw new Error("Erro ao conectar ao banco de dados. Serviço indisponível.");
      }

    const email = 'adriana.diari@jpiaget.com.br';
    const nome = 'Adriana Diari';
    const cargo = 'Coordenadora';
    const perfil = 'COORDENADOR';
    
    // Verificar se o usuário já existe no Firestore
    const usuariosRef = collection(db, COLLECTION_NAME);
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuário já existe, atualizar
      const usuarioDoc = querySnapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      await updateDoc(doc(db, COLLECTION_NAME, usuarioId), {
        nome,
        cargo,
        perfil,
        ativo: true,
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true,
        message: 'Usuário Adriana atualizado com sucesso',
        id: usuarioId
      };
    } else {
      // Criar o documento do usuário no Firestore
      const novoUsuario = {
        email,
        nome,
        cargo,
        perfil,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), novoUsuario);
      
      return { 
        success: true,
        message: 'Usuário Adriana criado com sucesso',
        id: docRef.id
      };
    }
    
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário Adriana:', error);
    return {
      success: false,
      error: 'Erro ao criar/atualizar usuário Adriana',
      details: error
    };
  }
};
