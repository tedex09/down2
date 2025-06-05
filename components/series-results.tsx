'use client';

import { useState } from 'react';
import { IServer } from '@/models/Server';
import { ISeries, ISeriesInfo, fetchSeriesInfo, generateSeriesAria2cCommands } from '@/lib/xtream';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Copy, 
  Check, 
  Search, 
  Film, 
  Calendar, 
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SeriesResultsProps {
  series: ISeries[];
  server: IServer;
}

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  selected?: boolean;
}

interface Season {
  number: string;
  episodes: Episode[];
  expanded?: boolean;
  allSelected?: boolean;
}

export function SeriesResults({ series, server }: SeriesResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<number | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<{ [key: string]: Season[] }>({});
  const [createFolders, setCreateFolders] = useState<{ [key: string]: boolean }>({});
  const [loadingProgress, setLoadingProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();
  
  const filteredSeries = searchTerm 
    ? series.filter(show => {
        const name = (show.name || show.title || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      })
    : series;

  const toggleSeriesExpansion = async (show: ISeries) => {
    if (expandedSeries === show.series_id) {
      setExpandedSeries(null);
      return;
    }

    setExpandedSeries(show.series_id);
    setLoadingInfo(show.series_id);
    setLoadingProgress({ ...loadingProgress, [show.series_id]: 0 });

    try {
      const info = await fetchSeriesInfo(server, show.series_id);
      if (!info) throw new Error('Falha ao obter informações da série');

      const formattedSeasons = Object.entries(info.episodes).map(([number, episodes]) => ({
        number,
        episodes: episodes.map(ep => ({
          id: ep.id,
          episode_num: ep.episode_num,
          title: ep.title || `Episódio ${ep.episode_num}`,
          container_extension: ep.container_extension || 'mp4',
          selected: false
        })),
        expanded: false,
        allSelected: false
      }));

      setSeasons({ ...seasons, [show.series_id]: formattedSeasons });
      setCreateFolders({ ...createFolders, [show.series_id]: true });
      setLoadingProgress({ ...loadingProgress, [show.series_id]: 100 });
    } catch (error) {
      console.error('Erro ao buscar informações da série:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter informações da série',
        variant: 'destructive'
      });
      setLoadingProgress({ ...loadingProgress, [show.series_id]: 0 });
    } finally {
      setLoadingInfo(null);
    }
  };

  const toggleSeason = (seriesId: number, seasonIndex: number) => {
    setSeasons(prev => {
      const currentSeasons = prev[seriesId] || [];
      const updatedSeasons = currentSeasons.map((season, idx) =>
        idx === seasonIndex
          ? { ...season, expanded: !season.expanded }
          : season
      );

      return {
        ...prev,
        [seriesId]: updatedSeasons
      };
    });
  };

  const toggleSeasonSelection = (seriesId: number, seasonIndex: number) => {
    setSeasons(prev => {
      const seriesSeasons = prev[seriesId];
      if (!seriesSeasons) return prev;

      const newSeasons = [...seriesSeasons];
      const season = { ...newSeasons[seasonIndex] };

      const newSelected = !season.allSelected;
      const newEpisodes = season.episodes.map(ep => ({
        ...ep,
        selected: newSelected
      }));

      season.episodes = newEpisodes;
      season.allSelected = newSelected;
      newSeasons[seasonIndex] = season;

      return {
        ...prev,
        [seriesId]: newSeasons
      };
    });
  };

  const toggleEpisode = (seriesId: number, seasonIndex: number, episodeIndex: number) => {
    setSeasons(prev => {
      const seriesSeasons = prev[seriesId];
      if (!seriesSeasons) return prev;

      const newSeasons = [...seriesSeasons];
      const season = { ...newSeasons[seasonIndex] };
      const newEpisodes = [...season.episodes];

      const episode = { ...newEpisodes[episodeIndex] };
      episode.selected = !episode.selected;
      newEpisodes[episodeIndex] = episode;

      season.episodes = newEpisodes;
      season.allSelected = newEpisodes.every(ep => ep.selected);
      newSeasons[seasonIndex] = season;

      return {
        ...prev,
        [seriesId]: newSeasons
      };
    });
  };

  const copyToClipboard = async (show: ISeries) => {
    const seriesSeasons = seasons[show.series_id];
    if (!seriesSeasons) return;

    const selectedEpisodes: Record<string, any[]> = {};

    for (const season of seriesSeasons) {
      const selected = season.episodes.filter(ep => ep.selected);
      if (selected.length > 0) {
        selectedEpisodes[season.number] = selected.map(ep => ({
          id: ep.id,
          episode_num: ep.episode_num,
          title: ep.title,
          container_extension: ep.container_extension
        }));
      }
    }

    if (Object.keys(selectedEpisodes).length === 0) {
      toast({
        title: 'Nenhum episódio selecionado',
        description: 'Selecione ao menos um episódio para baixar',
        variant: 'destructive'
      });
      return;
    }

    const seriesInfo: ISeriesInfo = {
      episodes: selectedEpisodes,
      info: {
        name: show.name,
        cover_big: '',
        plot: '',
        cast: '',
        director: '',
        genre: '',
        release_date: '',
        rating: '',
        youtube_trailer: ''
      }
    };

    const commands = generateSeriesAria2cCommands(
      server,
      seriesInfo,
      show.name,
      createFolders[show.series_id]
    );

    try {
      await navigator.clipboard.writeText(commands.join('\n'));
      setCopiedId(show.series_id);
      toast({
        title: 'Copiado para a área de transferência',
        description: 'Comandos aria2c copiados com sucesso'
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Falha ao copiar:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar para a área de transferência',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data desconhecida';

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
        <h3 className="text-lg font-medium">Séries ({filteredSeries.length})</h3>
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
      
      {filteredSeries.length === 0 ? (
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
          {filteredSeries.map((show) => {
            const seriesName = show.name || show.title || `Série ${show.series_id}`;
            const isCopied = copiedId === show.series_id;
            const isLoading = loadingInfo === show.series_id;
            const isExpanded = expandedSeries === show.series_id;
            const seriesSeasons = seasons[show.series_id] || [];
            const progress = loadingProgress[show.series_id] || 0;
            
            return (
              <Card 
                key={show.series_id}
                className="overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base truncate">{seriesName}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Film className="h-3 w-3 mr-1" />
                            <span>Série</span>
                          </div>
                          {show.last_modified && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(show.last_modified)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSeriesExpansion(show)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="animate-spin">⏳ {Math.round(progress)}%</span>
                          ) : isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="ml-2">
                            {isExpanded ? 'Ocultar Episódios' : 'Mostrar Episódios'}
                          </span>
                        </Button>
                        {isExpanded && (
                          <Button
                            size="sm"
                            variant={isCopied ? "default" : "secondary"}
                            className={cn(
                              "transition-all whitespace-nowrap",
                              isCopied && "bg-green-600 hover:bg-green-700"
                            )}
                            onClick={() => copyToClipboard(show)}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Selecionados
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-folders-${show.series_id}`}
                            checked={createFolders[show.series_id]}
                            onCheckedChange={(checked) => 
                              setCreateFolders(prev => ({ ...prev, [show.series_id]: !!checked }))
                            }
                          />
                          <label
                            htmlFor={`create-folders-${show.series_id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Criar pastas por temporada
                          </label>
                        </div>

                        <div className="space-y-2">
                          {seriesSeasons.map((season, seasonIndex) => (
                            <div key={season.number} className="border rounded-lg p-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={season.allSelected}
                                  onCheckedChange={() => toggleSeasonSelection(show.series_id, seasonIndex)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSeason(show.series_id, seasonIndex)}
                                  className="flex-1 justify-between"
                                >
                                  <span>Temporada {season.number}</span>
                                  {season.expanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {season.expanded && (
                                <div className="mt-2 ml-6 space-y-1">
                                  {season.episodes.map((episode, episodeIndex) => (
                                    <div key={episode.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={episode.selected}
                                        onCheckedChange={() => 
                                          toggleEpisode(show.series_id, seasonIndex, episodeIndex)
                                        }
                                      />
                                      <span className="text-sm">
                                        Episódio {episode.episode_num.toString().padStart(2, '0')}
                                        {episode.title && ` - ${episode.title}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
