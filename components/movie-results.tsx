"use client";

import { useState } from 'react';
import { IServer } from '@/models/Server';
import { IMovie, generateAria2cCommand } from '@/lib/xtream';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Copy,
  Check,
  Search,
  Film,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface MovieResultsProps {
  movies: IMovie[];
  server: IServer;
}

export function MovieResults({ movies, server }: MovieResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const filteredMovies = searchTerm 
    ? movies.filter(movie => {
        const name = (movie.name || movie.title || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      })
    : movies;

  const copyToClipboard = async (movie: IMovie) => {
    const command = generateAria2cCommand(server, movie);
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(movie.stream_id);
      toast({
        title: 'Copiado para a área de transferência',
        description: 'Comando aria2c copiado com sucesso'
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Falha ao copiar:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o comando',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    let date: Date;
    
    if (!isNaN(Number(dateString))) {
      date = new Date(Number(dateString) * 1000);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return 'Data desconhecida';
    }

    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filmes ({filteredMovies.length})</h3>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {filteredMovies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar sua busca
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMovies.map((movie) => {
            const movieName = movie.name || movie.title || `Filme ${movie.stream_id}`;
            const extension = movie.container_extension || 'mp4';
            const isCopied = copiedId === movie.stream_id;
            
            return (
              <Card 
                key={movie.stream_id}
                className="overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-base truncate">{movieName}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Film className="h-3 w-3 mr-1" />
                          <span>{extension.toUpperCase()}</span>
                        </div>
                        {movie.added && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(movie.added)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isCopied ? "default" : "secondary"}
                      className={cn(
                        "transition-all",
                        isCopied && "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => copyToClipboard(movie)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar aria2c
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
