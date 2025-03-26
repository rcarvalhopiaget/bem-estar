'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Paper, CircularProgress, 
  Alert, TextField, Card, CardContent, Divider, 
  List, ListItem, ListItemText, Chip
} from '@mui/material';
import { Send as SendIcon, Check as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function TesteEmailPage() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [destinatario, setDestinatario] = useState('');
  const [resultado, setResultado] = useState<any>(null);

  // Carregar configurações ao iniciar
  useEffect(() => {
    verificarConfiguracao();
  }, []);

  // Verificar configuração de email
  const verificarConfiguracao = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teste-email');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      toast.error('Erro ao verificar configuração de email');
    } finally {
      setLoading(false);
    }
  };

  // Enviar email de teste
  const enviarEmailTeste = async () => {
    if (!destinatario) {
      toast.error('Informe um email de destino');
      return;
    }

    try {
      setTestLoading(true);
      const response = await fetch('/api/teste-email?email=' + encodeURIComponent(destinatario), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResultado(data);
      
      if (data.success) {
        toast.success('Email de teste enviado com sucesso!');
      } else {
        toast.error(`Erro ao enviar email: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Teste de Configuração de Email
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuração Atual
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : config ? (
          <>
            <Alert 
              severity={config.configOk ? "success" : "warning"} 
              sx={{ mb: 2 }}
            >
              {config.configOk 
                ? "Configurações de email estão presentes" 
                : "Algumas configurações de email estão faltando"}
            </Alert>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Servidor SMTP" 
                  secondary={config.config.host || "Não configurado"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Porta" 
                  secondary={config.config.port || "Não configurado"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Usuário" 
                  secondary={config.config.user || "Não configurado"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Senha" 
                  secondary={config.config.pass || "Não configurado"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Remetente" 
                  secondary={config.config.from || "Não configurado"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Modo de Teste" 
                  secondary={
                    <Chip 
                      label={config.config.testMode === "true" ? "Ativado" : "Desativado"} 
                      color={config.config.testMode === "true" ? "warning" : "success"} 
                      size="small" 
                    />
                  } 
                />
              </ListItem>
            </List>
            
            <Alert 
              severity={config.transporterInfo.includes("bem-sucedida") ? "success" : "error"} 
              sx={{ mt: 2 }}
            >
              {config.transporterInfo}
            </Alert>
          </>
        ) : (
          <Alert severity="error">Erro ao carregar configurações</Alert>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={verificarConfiguracao} 
            disabled={loading}
          >
            Verificar Novamente
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enviar Email de Teste
        </Typography>
        
        <TextField
          label="Email de Destino"
          variant="outlined"
          fullWidth
          margin="normal"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder="exemplo@email.com"
        />
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={enviarEmailTeste} 
            disabled={testLoading || !config?.configOk}
            startIcon={<SendIcon />}
          >
            {testLoading ? 'Enviando...' : 'Enviar Email de Teste'}
          </Button>
        </Box>
        
        {resultado && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultado do Teste
              </Typography>
              
              <Alert 
                severity={resultado.success ? "success" : "error"} 
                sx={{ mb: 2 }}
                icon={resultado.success ? <CheckIcon /> : <ErrorIcon />}
              >
                {resultado.message}
              </Alert>
              
              {resultado.previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Visualizar Email:
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    component="a" 
                    href={resultado.previewUrl} 
                    target="_blank"
                  >
                    Abrir Visualização
                  </Button>
                </Box>
              )}
              
              {resultado.details && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detalhes:
                  </Typography>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(resultado.details, null, 2)}
                  </pre>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
}
