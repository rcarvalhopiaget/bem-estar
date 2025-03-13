import { auth } from '@/lib/firebase';
import { User, signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';

export async function configureSession(user: User): Promise<boolean> {
  try {
    // Força a atualização do token
    const token = await user.getIdToken(true);
    
    // Força a atualização do usuário
    await user.reload();
    
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao configurar sessão:', error);
    return false;
  }
}

export async function removeSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao remover sessão:', error);
    return false;
  }
}

export async function handleSignIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  
  // Força a atualização do usuário para ter os dados mais recentes
  await result.user.reload();
  
  const sessionConfigured = await configureSession(result.user);
  
  if (!sessionConfigured) {
    throw new Error('Falha ao configurar sessão');
  }
  
  return result.user;
}

export async function handleSignOut(): Promise<void> {
  await removeSession();
  await signOut(auth);
}

export async function sendVerificationEmailWithRetry(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não está autenticado');
  }

  if (auth.currentUser.emailVerified) {
    throw new Error('Email já foi verificado');
  }

  try {
    // Força a atualização do usuário antes de enviar o email
    await auth.currentUser.reload();
    
    // Configuração do email em português
    await sendEmailVerification(auth.currentUser, {
      url: window.location.origin + '/dashboard/refeicoes',
      handleCodeInApp: false,
    });
  } catch (error: any) {
    console.error('Erro ao enviar email de verificação:', error);
    
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido. Por favor, verifique o endereço de email.');
    } else {
      throw new Error('Erro ao enviar email de verificação. Por favor, tente novamente.');
    }
  }
}

export async function refreshUserToken(): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Usuário não está autenticado');
  }

  try {
    // Força a atualização do usuário
    await auth.currentUser.reload();
    
    // Força a atualização do token
    const token = await auth.currentUser.getIdToken(true);
    
    // Atualiza a sessão com o novo token
    await configureSession(auth.currentUser);
    
    return token;
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    throw new Error('Erro ao atualizar token. Por favor, faça login novamente.');
  }
}
