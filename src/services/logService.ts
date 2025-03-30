import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit as firestoreLimit, where, Timestamp } from 'firebase/firestore';
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

// Modo de simulação para desenvolvimento - definido como false para exibir apenas dados reais
const SIMULATION_MODE = false;

// Dados simulados para quando houver erros de permissão
const getSimulatedLogs = (count: number = 10): SystemLog[] => {
  // Função mantida apenas para referência, não será usada em produção
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
    this.simulationMode = false; // Forçando modo de produção
    console.log(`LogService inicializado em modo ${this.simulationMode ? 'simulação' : 'produção'}`);
  }

  /**
   * Adiciona um novo log ao sistema
   */
  async addLog(log: Omit<SystemLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      console.log('Tentando adicionar log:', log);
      
      if (!db) {
        console.error('Erro: Firestore não inicializado');
        throw new Error('Firestore não inicializado');
      }
      
      const logRef = await addDoc(collection(db, this.collectionName), {
        ...log,
        timestamp: new Date()
      });
      
      console.log(`Log adicionado com ID: ${logRef.id}`);
      return logRef.id;
    } catch (error: any) {
      console.error('Erro ao adicionar log:', error);
      throw error; // Propaga o erro para ser tratado pela aplicação
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
      console.log('LogService: Buscando logs com opções:', options);
      
      // Verificar se o Firestore está inicializado
      if (!db) {
        console.error('Erro: Firestore não inicializado');
        throw new Error('Firestore não inicializado');
      }
      
      const { module, action, userId, startDate, endDate, limit: resultLimit = 100 } = options;
      
      console.log(`LogService: Configurando consulta para coleção ${this.collectionName}`);
      
      // Abordagem alternativa para evitar problemas com índices ausentes
      // 1. Começamos com uma consulta básica ordenada por timestamp, que tem índice automático
      let q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        firestoreLimit(resultLimit)
      );
      
      // 2. Se houver filtro de módulo, usamos o índice composto que acabamos de adicionar,
      // que inclui module e timestamp
      if (module) {
        console.log(`LogService: Adicionando filtro de módulo: ${module}`);
        q = query(
          collection(db, this.collectionName),
          where('module', '==', module),
          orderBy('timestamp', 'desc'),
          firestoreLimit(resultLimit)
        );
      }
      
      console.log('LogService: Executando consulta inicial...');
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('LogService: Nenhum log encontrado na consulta inicial.');
        return [];
      } else {
        console.log(`LogService: ${querySnapshot.size} logs encontrados na consulta inicial.`);
      }
      
      // 3. Aplicamos os demais filtros em memória para evitar necessidade de índices compostos adicionais
      let logs: SystemLog[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const log: SystemLog = {
          id: doc.id,
          action: data.action,
          module: data.module,
          description: data.description,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          timestamp: data.timestamp.toDate(),
          details: data.details
        };
        
        // Aplicamos os demais filtros em memória
        let incluir = true;
        
        if (action && log.action !== action) {
          incluir = false;
        }
        
        if (userId && log.userId !== userId) {
          incluir = false;
        }
        
        if (startDate && log.timestamp < startDate) {
          incluir = false;
        }
        
        if (endDate && log.timestamp > endDate) {
          incluir = false;
        }
        
        if (incluir) {
          logs.push(log);
        }
      });
      
      console.log(`LogService: ${logs.length} logs restantes após filtragem em memória.`);
      
      // 4. Limitamos o resultado final ao número desejado
      return logs.slice(0, resultLimit);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      throw error; // Propaga o erro para forçar a aplicação a tratá-lo
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
    details?: any // Parâmetro opcional
  ) => {
    if (!user) return;
    
    try {
      if (!db) {
        console.error("Erro ao conectar ao banco de dados");
        return;
      }

      // Construir o objeto de log base (sem campos opcionais inicialmente)
      const logData: Omit<SystemLog, 'id' | 'timestamp' | 'userName' | 'details'> & { userName?: string, details?: any } = {
        action,
        module,
        description,
        userId: user.uid,
        userEmail: user.email || 'unknown',
      };

      // Adicionar userName apenas se existir
      if (user.displayName) {
        logData.userName = user.displayName;
      }
      
      // Adicionar details apenas se for fornecido e não for undefined
      if (details !== undefined) { 
        logData.details = details;
      }

      // Adicionar log ao Firestore
      console.log('Tentando adicionar log com dados:', logData); // Log para verificar o objeto final
      await logService.addLog(logData);
      console.log('Log registrado com sucesso (após addLog).');

    } catch (error) {
      console.error('Erro ao registrar log no hook useLogService:', error);
    }
  };
  
  return { logAction };
}
