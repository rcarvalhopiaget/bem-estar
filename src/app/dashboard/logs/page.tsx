'use client';

import { useState, useEffect } from 'react';
import { logService, SystemLog, LogModule, LogAction, useLogService } from '@/services/logService';
import { Card, Typography, Box, TextField, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { containsTextNormalized } from '@/utils/stringUtils';

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<LogModule | 'ALL'>('ALL');
  const [actionFilter, setActionFilter] = useState<LogAction | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSimulatedData, setIsSimulatedData] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { logAction } = useLogService();

  // Verificar se o usuário é administrador
  const isAdmin = user?.email && [
    'admin@bemestar.com', 
    'teste@teste.com', 
    'rodrigo.carvalho@jpiaget.com.br'
  ].includes(user.email);

  // useEffect para buscar logs e verificar isAdmin
  useEffect(() => {
    console.log('[LogsPage Effect User Check] User:', user);
    if (user) {
      // Logar o valor de isAdmin ASSIM que o user estiver disponível
      console.log('[LogsPage Effect User Check] isAdmin calculado:', isAdmin, '(Email:', user.email, ')'); 
      console.log('[LogsPage Effect User Check] Chamando fetchLogs.');
      fetchLogs();
    } else {
      console.log('[LogsPage Effect User Check] Usuário ainda não carregado.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depende apenas de user agora

  const fetchLogs = async () => {
    try {
      console.log('[fetchLogs] Iniciando busca de logs...');
      setLoading(true);
      setError(null);
      setIsSimulatedData(false);
      
      const options: any = { limit: 100 };
      
      if (moduleFilter !== 'ALL') {
        options.module = moduleFilter;
      }
      
      if (actionFilter !== 'ALL') {
        options.action = actionFilter;
      }
      
      if (startDate) {
        options.startDate = new Date(startDate);
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        options.endDate = endDateTime;
      }
      
      console.log('Buscando logs com opções:', options);
      const fetchedLogs = await logService.getLogs(options);
      console.log(`Logs encontrados: ${fetchedLogs.length}`);
      
      // Remover verificação de dados simulados pois agora só exibimos dados reais
      setLogs(fetchedLogs);
    } catch (error: any) {
      console.error('[fetchLogs] Erro ao buscar logs:', error);
      let mensagemErro = 'Não foi possível carregar os logs.';
      
      if (error?.code === 'permission-denied') {
        mensagemErro = 'Erro de permissão: Você não tem acesso para visualizar os logs do sistema. Verifique suas permissões no Firebase.';
      } else if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        mensagemErro = 'Erro de índice no Firestore: Faltam índices necessários para buscar logs. Entre em contato com o administrador.';
      }
      
      setError(mensagemErro);
      setLogs([]);
    } finally {
      setLoading(false);
      console.log('[fetchLogs] Busca de logs finalizada.');
    }
  };
  
  // Handler para o botão de teste
  const handleTestLogClick = async () => {
    console.log('[handleTestLogClick] Botão clicado. Tentando registrar log de teste...');
    if (isAdmin && user) {
      try {
        await logAction(
          'CREATE', // Usar uma ação diferente para distinguir
          'SISTEMA', 
          'Log de Teste Manual via Botão'
        );
        console.log('[handleTestLogClick] Chamada logAction concluída. Verifique a lista ou Firestore.');
        // Opcional: chamar fetchLogs() aqui para atualizar a lista imediatamente
        // fetchLogs(); 
      } catch (error) {
        console.error('[handleTestLogClick] Erro ao chamar logAction:', error);
        setError('Falha ao registrar log de teste manual. Verifique o console.');
      }
    } else {
      console.warn('[handleTestLogClick] Tentativa de log de teste sem ser admin ou sem usuário.');
      setError('Apenas administradores podem registrar logs de teste.');
    }
  };

  const handleFilter = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setModuleFilter('ALL');
    setActionFilter('ALL');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    fetchLogs();
  };

  const getModuleLabel = (module: string) => {
    const moduleMap: Record<string, string> = {
      'AUTH': 'Autenticação',
      'ALUNOS': 'Alunos',
      'REFEICOES': 'Refeições',
      'USUARIOS': 'Usuários',
      'RELATORIOS': 'Relatórios',
      'SISTEMA': 'Sistema'
    };
    return moduleMap[module] || module;
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'CREATE': 'Criação',
      'UPDATE': 'Atualização',
      'DELETE': 'Exclusão',
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'VIEW': 'Visualização',
      'EXPORT': 'Exportação',
      'IMPORT': 'Importação',
      'ERROR': 'Erro'
    };
    return actionMap[action] || action;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      'CREATE': '#e6f7e6',
      'UPDATE': '#e6f0ff',
      'DELETE': '#ffe6e6',
      'LOGIN': '#f2e6ff',
      'LOGOUT': '#f2f2f2',
      'VIEW': '#e6ecff',
      'EXPORT': '#fff9e6',
      'IMPORT': '#fff0e6',
      'ERROR': '#ffe6e6'
    };
    return colorMap[action] || '#f2f2f2';
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy HH:mm:ss");
  };

  // Filtrar logs pelo termo de busca
  const filteredLogs = logs.filter((log: SystemLog) => 
    searchTerm === '' || 
    containsTextNormalized(log.description, searchTerm) ||
    containsTextNormalized(log.userEmail, searchTerm) ||
    (log.userName && containsTextNormalized(log.userName, searchTerm))
  );

  return (
    <ProtectedRoute allowedProfiles={['ADMIN', 'admin']}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Logs do Sistema
        </Typography>
        
        {isSimulatedData && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
            <Typography variant="body1" color="warning.dark">
              Nota: Exibindo dados simulados devido a restrições de permissão. Alguns logs podem não refletir atividades reais do sistema.
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f8d7da', borderRadius: 1 }}>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        {/* Botão de Teste */} 
        {isAdmin && (
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleTestLogClick}
            >
              Registrar Log de Teste Manual
            </Button>
          </Box>
        )}
        
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" component="h2" mb={2}>
            Filtros
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(5, 1fr)' }} gap={2}>
            <FormControl fullWidth>
              <InputLabel>Módulo</InputLabel>
              <Select
                value={moduleFilter}
                label="Módulo"
                onChange={(e) => setModuleFilter(e.target.value as LogModule | 'ALL')}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="AUTH">Autenticação</MenuItem>
                <MenuItem value="ALUNOS">Alunos</MenuItem>
                <MenuItem value="REFEICOES">Refeições</MenuItem>
                <MenuItem value="USUARIOS">Usuários</MenuItem>
                <MenuItem value="RELATORIOS">Relatórios</MenuItem>
                <MenuItem value="SISTEMA">Sistema</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Ação</InputLabel>
              <Select
                value={actionFilter}
                label="Ação"
                onChange={(e) => setActionFilter(e.target.value as LogAction | 'ALL')}
              >
                <MenuItem value="ALL">Todas</MenuItem>
                <MenuItem value="CREATE">Criação</MenuItem>
                <MenuItem value="UPDATE">Atualização</MenuItem>
                <MenuItem value="DELETE">Exclusão</MenuItem>
                <MenuItem value="LOGIN">Login</MenuItem>
                <MenuItem value="LOGOUT">Logout</MenuItem>
                <MenuItem value="VIEW">Visualização</MenuItem>
                <MenuItem value="EXPORT">Exportação</MenuItem>
                <MenuItem value="IMPORT">Importação</MenuItem>
                <MenuItem value="ERROR">Erro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Data Final"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Buscar"
              placeholder="Buscar por descrição ou usuário"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
            <Button variant="outlined" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="contained" onClick={handleFilter}>
              Filtrar
            </Button>
          </Box>
        </Card>

        <Card>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <Typography variant="h6">Carregando logs...</Typography>
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px" flexDirection="column">
              <Typography variant="h6" mb={2}>Nenhum log encontrado.</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Os logs são gerados automaticamente conforme as atividades são realizadas no sistema.<br />
                Realize algumas ações como criar alunos ou registrar refeições para gerar logs.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={handleFilter}
              >
                Atualizar
              </Button>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Data/Hora</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Módulo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ação</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Descrição</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getModuleLabel(log.module)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 500,
                          backgroundColor: getActionColor(log.action),
                          color: '#333'
                        }}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.description}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {log.userName ? `${log.userName} (${log.userEmail})` : log.userEmail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Card>
      </Box>
    </ProtectedRoute>
  );
}
