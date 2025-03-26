import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemLog {
  id?: string;
  action: string;
  module: string;
  description: string;
  userId: string;
  userEmail: string;
  userName?: string;
  timestamp: Date;
  details?: any;
}

export type LogModule = 'AUTH' | 'ALUNOS' | 'REFEICOES' | 'USUARIOS' | 'RELATORIOS' | 'SISTEMA';
export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'IMPORT' | 'ERROR';

// Modo de simulação para desenvolvimento
const SIMULATION_MODE = false; // Temporariamente desativado para mostrar logs verdadeiros

// Dados simulados para quando houver erros de permissão
const getSimulatedLogs = (count: number = 10): SystemLog[] => {
  const modules: LogModule[] = ['AUTH', 'ALUNOS', 'REFEICOES', 'USUARIOS', 'RELATORIOS', 'SISTEMA'];
  const actions: LogAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'ERROR'];
  
  return Array.from({ length: count }, (_, i) => {
    const module = modules[Math.floor(Math.random() * modules.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 72)); // Últimas 72 horas
    
    return {
      id: `simulated-${Date.now()}-${i}`,
      action,
      module,
      description: `Log simulado para ${module} - ${action}`,
      userId: 'simulated-user',
      userEmail: 'usuario@exemplo.com',
      userName: 'Usuário Simulado',
      timestamp,
      details: { simulado: true, motivo: 'Erro de permissão' }
    };
  });
};

class LogService {
  private collectionName = 'system_logs';
  private simulationMode: boolean;

  constructor() {
    this.simulationMode = SIMULATION_MODE;
    console.log(`LogService inicializado em modo ${this.simulationMode ? 'simulação' : 'produção'}`);
  }

  /**
   * Adiciona um novo log ao sistema
   */
  async addLog(log: Omit<SystemLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const logRef = await addDoc(collection(db, this.collectionName), {
        ...log,
        timestamp: new Date()
      });
      
      console.log(`Log adicionado com ID: ${logRef.id}`);
      return logRef.id;
    } catch (error: any) {
      // Verificar se é um erro de permissão
      if (error?.code === 'permission-denied') {
        console.warn('Erro de permissão ao adicionar log, continuando fluxo');
        return `simulated-${Date.now()}`;
      }
      
      console.error('Erro ao adicionar log:', error);
      // Em modo de simulação, retorna um ID falso para não quebrar o fluxo
      if (this.simulationMode) {
        return `simulated-${Date.now()}`;
      }
      throw error;
    }
  }

  /**
   * Busca logs com filtros opcionais
   */
  async getLogs(options: {
    module?: LogModule;
    action?: LogAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<SystemLog[]> {
    try {
      const { module, action, userId, startDate, endDate, limit: resultLimit = 100 } = options;
      
      let q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(resultLimit)
      );
      
      // Adicionar filtros se fornecidos
      if (module) {
        q = query(q, where('module', '==', module));
      }
      
      if (action) {
        q = query(q, where('action', '==', action));
      }
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      if (startDate) {
        q = query(q, where('timestamp', '>=', startDate));
      }
      
      if (endDate) {
        q = query(q, where('timestamp', '<=', endDate));
      }
      
      const querySnapshot = await getDocs(q);
      
      const logs: SystemLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          action: data.action,
          module: data.module,
          description: data.description,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          timestamp: data.timestamp.toDate(),
          details: data.details
        });
      });
      
      return logs;
    } catch (error: any) {
      // Verificar se é um erro de permissão
      if (error?.code === 'permission-denied') {
        console.warn('Erro de permissão ao buscar logs, retornando dados simulados');
        return getSimulatedLogs(options.limit || 10);
      }
      
      console.error('Erro ao buscar logs:', error);
      
      // Em modo de simulação ou se houver erro, retorna dados simulados
      if (this.simulationMode) {
        console.log('Retornando logs simulados devido ao modo de simulação');
        return getSimulatedLogs(options.limit || 10);
      }
      
      // Se não estiver em modo de simulação e não for erro de permissão, retorna array vazio
      return [];
    }
  }

  /**
   * Obtém os logs mais recentes
   */
  async getRecentLogs(count: number = 20): Promise<SystemLog[]> {
    return this.getLogs({ limit: count });
  }

  /**
   * Obtém logs de um módulo específico
   */
  async getModuleLogs(module: LogModule, count: number = 50): Promise<SystemLog[]> {
    return this.getLogs({ module, limit: count });
  }

  /**
   * Obtém logs de um usuário específico
   */
  async getUserLogs(userId: string, count: number = 50): Promise<SystemLog[]> {
    return this.getLogs({ userId, limit: count });
  }
}

export const logService = new LogService();

/**
 * Hook para facilitar o registro de logs
 */
export function useLogService() {
  const { user } = useAuth();
  
  const logAction = async (
    action: LogAction,
    module: LogModule,
    description: string,
    details?: any
  ) => {
    if (!user) return;
    
    try {
      await logService.addLog({
        action,
        module,
        description,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        userName: user.displayName || undefined,
        details
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
      // Erros de log não devem interromper o fluxo da aplicação
    }
  };
  
  return { logAction };
}
