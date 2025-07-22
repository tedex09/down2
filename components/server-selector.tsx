"use client";

import { useEffect, useState } from 'react';
import { IServer } from '@/models/Server';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ServerSelectorProps {
  onServerSelected: (server: IServer) => void;
  refreshTrigger: number;
}

export function ServerSelector({ onServerSelected, refreshTrigger }: ServerSelectorProps) {
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

  const handleSelectServer = (serverId: string) => {
    const server = servers.find(s => s._id === serverId);
    if (server) {
      onServerSelected(server);
    }
  };

  const getServerDisplayName = (server: IServer) => {
    if (server.name) return server.name;
    return server.url.replace(/(^\w+:|^)\/\//, '');
  };

  const getServerLabel = (server: IServer) => {
    const displayName = getServerDisplayName(server);
    const prefix = server.isFavorite ? '⭐ ' : '';
    const suffix = server.isM3U ? ' (M3U)' : '';
    return `${prefix}${displayName}${suffix}`;
  };
  return (
    <Select onValueChange={handleSelectServer} disabled={loading || servers.length === 0}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione um servidor" />
      </SelectTrigger>
      <SelectContent>
        {servers.map((server) => (
          <SelectItem key={server._id} value={server._id || ''}>
            {getServerLabel(server)} - {server.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
