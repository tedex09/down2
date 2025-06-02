"use client";

import { useEffect, useState } from 'react';
import { IServer } from '@/models/Server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Trash2, Globe, User } from 'lucide-react';
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

  const handleDeleteServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete server');
      }

      setServers(servers.filter(server => server._id !== serverId));
      toast({
        title: 'Server removed',
        description: 'The server has been removed successfully.',
      });
      onServerRemoved();
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete server. Please try again.',
        variant: 'destructive'
      });
    }
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
        <h3 className="text-xl font-medium">No Servers Found</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Add your first IPTV server to get started
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
              <CardTitle className="text-lg font-medium truncate">
                {server.url.replace(/(^\w+:|^)\/\//, '')}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => server._id && handleDeleteServer(server._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
                <span className="text-muted-foreground">Username:</span>
                <span className="ml-2 truncate">{server.username}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={() => onServerSelected(server)}
            >
              Select Server
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}