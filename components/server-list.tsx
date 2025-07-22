"use client";

import { useEffect, useState } from 'react';
import { IServer } from '@/models/Server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Trash2, Globe, User, Star, Link } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ServerListProps {
  onServerSelected: (server: IServer) => void;
  onServerRemoved: () => void;
  refreshTrigger: number;
}

export function ServerList({ onServerSelected, onServerRemoved, refreshTrigger }: ServerListProps) {
  const [servers, setServers] = useState<IServer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/servers');
        if (!response.ok) {
          throw new Error('Erro ao buscar os servidores');
        }
        const data = await response.json();
        // Ordenar: favoritos primeiro, depois por data de criação
        const sortedServers = data.sort((a: IServer, b: IServer) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setServers(sortedServers);
      } catch (error) {
        console.error('Erro ao buscar servidores:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os servidores. Tente novamente.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [refreshTrigger, toast]);

  const toggleFavorite = async (server: IServer) => {
    if (!server._id) return;
    
    try {
      const response = await fetch(`/api/servers/${server._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFavorite: !server.isFavorite
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar favorito');
      }

      const updatedServer = await response.json();
      
      setServers(prevServers => {
        const updated = prevServers.map(s => 
          s._id === server._id ? updatedServer : s
        );
        
        // Reordenar após atualizar
        return updated.sort((a: IServer, b: IServer) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      toast({
        title: updatedServer.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
        description: `${getServerDisplayName(updatedServer)} foi ${updatedServer.isFavorite ? 'adicionado aos' : 'removido dos'} favoritos.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o favorito. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir o servidor');
      }

      setServers(servers.filter(server => server._id !== serverId));
      toast({
        title: 'Servidor removido',
        description: 'O servidor foi removido com sucesso.',
      });
      onServerRemoved();
    } catch (error) {
      console.error('Erro ao excluir servidor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o servidor. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const getServerDisplayName = (server: IServer) => {
    if (server.name) return server.name;
    return server.url.replace(/(^\w+:|^)\/\//, '');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-[100px]" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center border border-dashed border-border rounded-lg p-6">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">Nenhum servidor encontrado</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Adicione seu primeiro servidor IPTV para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {servers.map((server) => (
        <Card key={server._id} className="border border-border/60 overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {server.isFavorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                {server.isM3U && (
                  <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <CardTitle className="text-lg font-medium truncate">
                  {getServerDisplayName(server)}
                </CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleFavorite(server)}>
                    <Star className={`mr-2 h-4 w-4 ${server.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    {server.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => server._id && handleDeleteServer(server._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">URL:</span>
                <span className="ml-2 truncate">{server.url}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Usuário:</span>
                <span className="ml-2 truncate">{server.username}</span>
              </div>
              {server.isM3U && (
                <div className="flex items-center">
                  <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 text-blue-600">Lista M3U</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={() => onServerSelected(server)}
            >
              Selecionar Servidor
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}