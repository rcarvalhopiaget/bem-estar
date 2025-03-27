'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Paper, 
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon,
  Person as PersonIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { useToast, toast } from '@/components/ui/toast-wrapper';
import { Usuario, PerfilUsuario, PERFIS_USUARIO } from '@/types/usuario';
import { obterUsuarioPorEmail, atualizarUsuario, redefinirSenhaUsuario } from '@/services/usuarioService';
import { useAuth } from '@/contexts/AuthContext';

export default function PerfilPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cargo: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar dados do usuário
  const carregarUsuario = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const userData = await obterUsuarioPorEmail(user.email);
      
      if (userData) {
        setUsuario(userData);
        setFormData({
          nome: userData.nome,
          cargo: userData.cargo || ''
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar seus dados de usuário.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
  }, [user]);

  // Manipuladores de formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpa o erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validação do formulário
  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.nome) errors.nome = 'Nome é obrigatório';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar perfil
  const handleSavePerfil = async () => {
    if (!validarFormulario() || !usuario) return;
    
    try {
      setSaving(true);
      
      // Registrar os dados que serão enviados
      console.log('Salvando perfil com dados:', {
        id: usuario.id,
        dados: {
          nome: formData.nome,
          cargo: formData.cargo
        }
      });
      
      await atualizarUsuario(usuario.id, {
        nome: formData.nome,
        cargo: formData.cargo
      });
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
      
      // Recarregar dados do usuário
      await carregarUsuario();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar seu perfil. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Redefinir senha
  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    try {
      setSaving(true);
      await redefinirSenhaUsuario(user.email);
      toast({
        title: 'Sucesso',
        description: 'Email de redefinição de senha enviado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o email de redefinição de senha. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para obter a descrição do perfil de forma segura
  const getPerfilDescricao = (perfil: PerfilUsuario | undefined | null) => {
    if (!perfil) return 'Não definido';
    return PERFIS_USUARIO[perfil]?.descricao || perfil;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Carregando dados do perfil...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Informações do perfil */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {usuario?.nome}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {usuario?.email}
              </Typography>
              
              {usuario?.cargo && (
                <Typography variant="body2" color="text.secondary">
                  {usuario.cargo}
                </Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="bold">
                Perfil de Acesso
              </Typography>
              <Typography variant="body1">
                {getPerfilDescricao(usuario?.perfil)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="bold">
                Status da Conta
              </Typography>
              <Typography 
                variant="body1" 
                color={usuario?.ativo ? 'success.main' : 'error.main'}
              >
                {usuario?.ativo ? 'Ativo' : 'Inativo'}
              </Typography>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<LockResetIcon />}
                onClick={handleResetPassword}
                disabled={saving}
                sx={{ mt: 3 }}
                fullWidth
              >
                Redefinir Senha
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Formulário de edição */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Editar Informações
            </Typography>
            
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                placeholder="Ex: Professor de Matemática"
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Email"
                value={usuario?.email || ''}
                disabled
                helperText="O email não pode ser alterado"
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSavePerfil}
                disabled={saving}
                sx={{ mt: 3 }}
              >
                {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
