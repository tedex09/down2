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
          throw new Error('Failed to fetch servers');
        }
        const data = await response.json();
        setServers(data);
      } catch (error) {
        console.error('Error fetching servers:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch servers. Please try again.',
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

  return (
    <Select onValueChange={handleSelectServer} disabled={loading || servers.length === 0}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a server" />
      </SelectTrigger>
      <SelectContent>
        {servers.map((server) => (
          <SelectItem key={server._id} value={server._id || ''}>
            {server.url.replace(/(^\w+:|^)\/\//, '')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}