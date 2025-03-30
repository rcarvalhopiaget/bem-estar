'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Ajuste o caminho se necessário
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // Ajuste o caminho se necessário
import { Badge } from '@/components/ui/badge'; // Ajuste o caminho se necessário
import { ScrollArea } from '@/components/ui/scroll-area'; // Ajuste o caminho se necessário
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // Ajuste o caminho se necessário
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, type NotificationData } from '@/actions/notificationActions';
import { useToast } from '@/components/ui/use-toast'; // Ajuste o caminho se necessário
import { cn } from '@/lib/utils'; // Ajuste o caminho se necessário

export function NotificationBell() {
  const { user } = useAuth(); // Só opera se o usuário estiver logado
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar notificações não lidas
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return; // Segurança extra
    setIsLoading(true);
    try {
      const unread = await getUnreadNotifications();
      setNotifications(unread);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Erro no componente ao buscar notificações:', error);
      // Evitar toast aqui para não sobrecarregar se houver falha na busca periódica
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Depende do usuário estar logado

  // Busca inicial ao montar, se o usuário estiver logado
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Opcional: Busca periódica (descomente e ajuste o intervalo se necessário)
  // useEffect(() => {
  //   if (!user) return;
  //   const intervalId = setInterval(() => {
  //     fetchNotifications();
  //   }, 60000); // Busca a cada 60 segundos
  //   return () => clearInterval(intervalId);
  // }, [user, fetchNotifications]);

  // Lidar com a abertura/fechamento do popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Busca novamente ao abrir, caso algo tenha mudado
    if (open) {
      fetchNotifications();
    }
  };

  // Marcar uma específica como lida
  const handleMarkOneRead = async (notificationId: string, event?: React.MouseEvent) => {
     // Evita que o clique no botão/link feche o popover imediatamente se for desejado
     if (event) event.stopPropagation();

    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      // Atualiza UI imediatamente (remove da lista ou marca visualmente)
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.error || "Não foi possível marcar a notificação." });
    }
  };

  // Marcar todas como lidas
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const currentNotifications = notifications; // Guarda as notificações atuais para UI
    // Otimismo na UI: Limpa imediatamente
    setNotifications([]);
    setUnreadCount(0);

    const result = await markAllNotificationsAsRead();
    if (!result.success) {
      toast({ variant: "destructive", title: "Erro", description: result.error || "Não foi possível marcar todas as notificações." });
      // Reverte a UI em caso de falha
      setNotifications(currentNotifications);
      setUnreadCount(currentNotifications.length);
    }
  };

  // Não renderiza nada se o usuário não estiver logado
  if (!user) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]"
              aria-label={`${unreadCount} notificações não lidas`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Abrir notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium leading-none">Notificações</h4>
          {unreadCount > 0 && (
             <Button
               variant="link"
               size="sm"
               className="text-xs text-muted-foreground p-0 h-auto"
               onClick={handleMarkAllRead}
               disabled={isLoading} // Desabilitar enquanto carrega
             >
               Marcar todas como lidas
             </Button>
          )}
        </div>
        <ScrollArea className="h-72"> {/* Ajuste a altura conforme necessário */}
          <div className="p-2"> {/* Reduzir padding interno */}
            {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>}
            {!isLoading && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma notificação nova.</p>
            )}
            {!isLoading && notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "mb-2 grid grid-cols-[25px_1fr_auto] items-start gap-3 rounded-lg border p-3 last:mb-0",
                  // Poderia adicionar estilos diferentes aqui baseado em notification.eventType
                )}
              >
                 {/* Ícone (Exemplo simples) */}
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" aria-hidden="true" />

                <div className="space-y-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => {
                        // Marca como lida ao clicar no link, mas permite a navegação
                        handleMarkOneRead(notification.id);
                        setIsOpen(false); // Fecha o popover ao clicar no link
                      }}
                    >
                      Ver detalhes
                    </Link>
                  ) : (
                     // Adiciona um pequeno timestamp se não houver link
                     <p className="text-xs text-muted-foreground/70 pt-1">
                       {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                  )}
                </div>
                {/* Botão para marcar como lida individualmente */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label="Marcar como lida"
                  title="Marcar como lida"
                  onClick={(e) => handleMarkOneRead(notification.id, e)}
                >
                   <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
