'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LockReset as LockResetIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useToast, toast } from '@/components/ui/toast-wrapper';
import { Usuario, PerfilUsuario, PERFIS_USUARIO } from '@/types/usuario';
import { 
  listarUsuarios, 
  criarUsuario, 
  atualizarUsuario, 
  desativarUsuario, 
  ativarUsuario,
  redefinirSenhaUsuario,
  atualizarUsuarioAdmin,
  criarUsuarioAdriana
} from '@/services/usuarioService';
import { useAuth } from '@/contexts/AuthContext';

export default function UsuariosPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
    perfil: PerfilUsuario.OPERADOR,
    senha: '',
    confirmarSenha: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar usuários
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      
      const filtros: any = {};
      if (perfilFiltro) filtros.perfil = perfilFiltro;
      if (busca) filtros.busca = busca;
      if (statusFiltro === 'ativo') filtros.ativo = true;
      if (statusFiltro === 'inativo') filtros.ativo = false;
      
      const data = await listarUsuarios(filtros);
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [perfilFiltro, statusFiltro]);

  // Manipuladores de paginação
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  // Manipulador específico para Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Validação do formulário
  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.nome) errors.nome = 'Nome é obrigatório';
    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!usuarioAtual) {
      if (!formData.senha) {
        errors.senha = 'Senha é obrigatória';
      } else if (formData.senha.length < 6) {
        errors.senha = 'A senha deve ter pelo menos 6 caracteres';
      }
      
      if (formData.senha !== formData.confirmarSenha) {
        errors.confirmarSenha = 'As senhas não coincidem';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Abrir diálogo para criar/editar usuário
  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioAtual(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo || '',
        perfil: usuario.perfil,
        senha: '',
        confirmarSenha: ''
      });
    } else {
      setUsuarioAtual(null);
      setFormData({
        nome: '',
        email: '',
        cargo: '',
        perfil: PerfilUsuario.OPERADOR,
        senha: '',
        confirmarSenha: ''
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenDeleteDialog(false);
    setOpenResetDialog(false);
    setUsuarioAtual(null);
  };

  // Salvar usuário (criar ou atualizar)
  const handleSaveUsuario = async () => {
    if (!validarFormulario()) return;
    
    try {
      setLoading(true);
      
      if (usuarioAtual) {
        // Atualizar usuário existente
        await atualizarUsuario(usuarioAtual.id, {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo,
          perfil: formData.perfil
        });
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso!',
        });
      } else {
        // Criar novo usuário
        await criarUsuario(
          formData.email,
          formData.senha,
          formData.nome,
          formData.perfil,
          formData.cargo
        );
        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso!',
        });
      }
      
      handleCloseDialog();
      carregarUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o usuário. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Alternar status do usuário (ativar/desativar)
  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      setLoading(true);
      if (usuario.ativo) {
        await desativarUsuario(usuario.id);
        toast({
          title: 'Sucesso',
          description: 'Usuário desativado com sucesso!',
        });
      } else {
        await ativarUsuario(usuario.id);
        toast({
          title: 'Sucesso',
          description: 'Usuário ativado com sucesso!',
        });
      }
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo para confirmar exclusão
  const handleOpenDeleteDialog = (usuario: Usuario) => {
    setUsuarioAtual(usuario);
    setOpenDeleteDialog(true);
  };

  // Abrir diálogo para redefinir senha
  const handleOpenResetDialog = (usuario: Usuario) => {
    setUsuarioAtual(usuario);
    setOpenResetDialog(true);
  };

  // Redefinir senha do usuário
  const handleResetPassword = async () => {
    if (!usuarioAtual) return;
    
    try {
      setLoading(true);
      await redefinirSenhaUsuario(usuarioAtual.email);
      toast({
        title: 'Sucesso',
        description: 'Email de redefinição de senha enviado com sucesso!',
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o email de redefinição de senha. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários com base na busca
  const handleSearch = () => {
    carregarUsuarios();
  };

  // Renderizar chip de status
  const renderStatusChip = (ativo: boolean) => {
    return ativo ? (
      <Chip label="Ativo" color="success" size="small" />
    ) : (
      <Chip label="Inativo" color="error" size="small" />
    );
  };

  // Verificar se o usuário atual é admin
  const isAdmin = user?.email && [
    'admin@bemestar.com', 
    'teste@teste.com', 
    'rodrigo.carvalho@jpiaget.com.br'
  ].includes(user.email);

  // Atualizar usuário admin
  const handleAtualizarAdmin = async () => {
    try {
      setLoading(true);
      const resultado = await atualizarUsuarioAdmin();
      
      if (resultado.success) {
        toast({
          title: 'Sucesso',
          description: resultado.message,
        });
        
        // Recarregar a lista de usuários
        await carregarUsuarios();
      } else {
        toast({
          title: 'Erro',
          description: resultado.error || 'Erro ao atualizar usuário admin',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário admin:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar usuário admin',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar usuário Adriana
  const handleCriarAdriana = async () => {
    try {
      setLoading(true);
      const resultado = await criarUsuarioAdriana();
      
      if (resultado.success) {
        toast({
          title: 'Sucesso',
          description: resultado.message,
        });
        
        // Recarregar a lista de usuários
        await carregarUsuarios();
      } else {
        toast({
          title: 'Erro',
          description: resultado.error || 'Erro ao criar usuário Adriana',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar usuário Adriana:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar usuário Adriana',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Gestão de Usuários
        </Typography>
        <Box>
          <Tooltip title="Atualizar usuário admin">
            <IconButton 
              color="primary" 
              onClick={handleAtualizarAdmin}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Criar usuário Adriana">
            <IconButton 
              color="secondary" 
              onClick={handleCriarAdriana}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={!isAdmin || loading}
            >
              Novo Usuário
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros e busca */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Buscar usuário"
          variant="outlined"
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch} edge="end">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />

        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Perfil</InputLabel>
          <Select
            value={perfilFiltro}
            label="Perfil"
            onChange={(e) => setPerfilFiltro(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.values(PERFIS_USUARIO).map((perfil) => (
              <MenuItem key={perfil.valor} value={perfil.valor}>
                {perfil.descricao}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFiltro}
            label="Status"
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ativo">Ativos</MenuItem>
            <MenuItem value="inativo">Inativos</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarUsuarios}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Tabela de usuários */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de usuários">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                    <Typography variant="body2">Carregando usuários...</Typography>
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2">Nenhum usuário encontrado.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((usuario) => (
                    <TableRow key={usuario.id} hover>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.cargo || '-'}</TableCell>
                      <TableCell>
                        {PERFIS_USUARIO[usuario.perfil]?.descricao || usuario.perfil}
                      </TableCell>
                      <TableCell>{renderStatusChip(usuario.ativo)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(usuario)}
                          disabled={!isAdmin}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenResetDialog(usuario)}
                          disabled={!isAdmin}
                        >
                          <LockResetIcon />
                        </IconButton>
                        <IconButton
                          color={usuario.ativo ? "error" : "success"}
                          onClick={() => handleToggleStatus(usuario)}
                          disabled={!isAdmin}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={usuarios.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo para criar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {usuarioAtual ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
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
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Perfil</InputLabel>
              <Select
                name="perfil"
                value={formData.perfil}
                label="Perfil"
                onChange={handleSelectChange}
              >
                {Object.values(PERFIS_USUARIO).map((perfil) => (
                  <MenuItem key={perfil.valor} value={perfil.valor}>
                    {perfil.descricao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!usuarioAtual && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleInputChange}
                  error={!!formErrors.senha}
                  helperText={formErrors.senha}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirmar Senha"
                  name="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  error={!!formErrors.confirmarSenha}
                  helperText={formErrors.confirmarSenha}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUsuario} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar exclusão/desativação */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {usuarioAtual?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {usuarioAtual?.ativo
              ? `Tem certeza que deseja desativar o usuário "${usuarioAtual?.nome}"?`
              : `Tem certeza que deseja ativar o usuário "${usuarioAtual?.nome}"?`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {usuarioAtual?.ativo
              ? 'O usuário não poderá mais acessar o sistema até ser reativado.'
              : 'O usuário poderá acessar o sistema novamente.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={() => {
              if (usuarioAtual) handleToggleStatus(usuarioAtual);
              handleCloseDialog();
            }}
            variant="contained"
            color={usuarioAtual?.ativo ? 'error' : 'success'}
          >
            {usuarioAtual?.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para redefinir senha */}
      <Dialog open={openResetDialog} onClose={handleCloseDialog}>
        <DialogTitle>Redefinir Senha</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja enviar um email de redefinição de senha para "{usuarioAtual?.email}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Um link será enviado para o email do usuário permitindo que ele defina uma nova senha.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
