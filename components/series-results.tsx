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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<{ [key: string]: Season[] }>({});
  const [createFolders, setCreateFolders] = useState<{ [key: string]: boolean }>({});
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

    try {
      const info = await fetchSeriesInfo(server, show.series_id);
      if (!info) throw new Error('Failed to fetch series info');

      const formattedSeasons = Object.entries(info.episodes).map(([number, episodes]) => ({
        number,
        episodes: episodes.map(ep => ({ ...ep, selected: false })),
        expanded: false,
        allSelected: false
      }));

      setSeasons({ ...seasons, [show.series_id]: formattedSeasons });
      setCreateFolders({ ...createFolders, [show.series_id]: true });
    } catch (error) {
      console.error('Error fetching series info:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch series information',
        variant: 'destructive'
      });
    } finally {
      setLoadingInfo(null);
    }
  };

  const toggleSeason = (seriesId: string, seasonIndex: number) => {
    setSeasons(prev => {
      const newSeasons = { ...prev };
      newSeasons[seriesId][seasonIndex].expanded = !newSeasons[seriesId][seasonIndex].expanded;
      return newSeasons;
    });
  };

  const toggleSeasonSelection = (seriesId: string, seasonIndex: number) => {
    setSeasons(prev => {
      const newSeasons = { ...prev };
      const season = newSeasons[seriesId][seasonIndex];
      const newSelected = !season.allSelected;
      season.allSelected = newSelected;
      season.episodes = season.episodes.map(ep => ({ ...ep, selected: newSelected }));
      return newSeasons;
    });
  };

  const toggleEpisode = (seriesId: string, seasonIndex: number, episodeIndex: number) => {
    setSeasons(prev => {
      const newSeasons = { ...prev };
      const episode = newSeasons[seriesId][seasonIndex].episodes[episodeIndex];
      episode.selected = !episode.selected;
      
      // Update season's allSelected state
      const season = newSeasons[seriesId][seasonIndex];
      season.allSelected = season.episodes.every(ep => ep.selected);
      
      return newSeasons;
    });
  };

  const generateCommands = (show: ISeries) => {
    const seriesSeasons = seasons[show.series_id];
    if (!seriesSeasons) return [];

    const commands: string[] = [];
    const sanitizedName = show.name.replace(/[<>:"/\\|?*]/g, '_');

    if (createFolders[show.series_id]) {
      commands.push(`mkdir -p "${sanitizedName}"`);
    }

    seriesSeasons.forEach(season => {
      const seasonDir = `${sanitizedName}/Season ${season.number}`;
      const hasSelectedEpisodes = season.episodes.some(ep => ep.selected);

      if (hasSelectedEpisodes && createFolders[show.series_id]) {
        commands.push(`mkdir -p "${seasonDir}"`);
      }

      season.episodes.forEach(episode => {
        if (!episode.selected) return;

        const paddedEpisodeNum = episode.episode_num.toString().padStart(2, '0');
        const extension = episode.container_extension || 'mp4';
        const episodeName = `S${season.number}E${paddedEpisodeNum}`;
        const downloadUrl = `${server.url}/series/${server.username}/${server.password}/${episode.id}.${extension}`;

        if (createFolders[show.series_id]) {
          commands.push(
            `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -d "${seasonDir}" -o "${episodeName}.${extension}" "${downloadUrl}"`
          );
        } else {
          commands.push(
            `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -o "${sanitizedName}_${episodeName}.${extension}" "${downloadUrl}"`
          );
        }
      });
    });

    return commands;
  };

  const copyToClipboard = async (show: ISeries) => {
    const commands = generateCommands(show);
    if (commands.length === 0) {
      toast({
        title: 'No episodes selected',
        description: 'Please select at least one episode to download',
        variant: 'destructive'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(commands.join('\n'));
      setCopiedId(show.series_id);
      toast({
        title: 'Copied to clipboard',
        description: 'aria2c commands copied successfully'
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    let date: Date;
    
    if (!isNaN(Number(dateString))) {
      date = new Date(Number(dateString) * 1000);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Series ({filteredSeries.length})</h3>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter results..."
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
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSeries.map((show) => {
            const seriesName = show.name || show.title || `Series ${show.series_id}`;
            const isCopied = copiedId === show.series_id;
            const isLoading = loadingInfo === show.series_id;
            const isExpanded = expandedSeries === show.series_id;
            const seriesSeasons = seasons[show.series_id] || [];
            
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
                            <span>Series</span>
                          </div>
                          {show.added && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(show.added)}</span>
                            </div>
                          )}
                          {show.genre && (
                            <div className="flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              <span>{show.genre}</span>
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
                            <span className="animate-spin">⏳</span>
                          ) : isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="ml-2">
                            {isExpanded ? 'Hide Episodes' : 'Show Episodes'}
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
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Selected
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
                            Create season folders
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
                                  <span>Season {season.number}</span>
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
                                        Episode {episode.episode_num.toString().padStart(2, '0')}
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