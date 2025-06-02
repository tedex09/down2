"use client";

import { useState } from 'react';
import { IServer } from '@/models/Server';
import { ISeries, ISeriesInfo, fetchSeriesInfo, generateSeriesAria2cCommands } from '@/lib/xtream';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  Copy, 
  Check, 
  Search, 
  Film, 
  Calendar, 
  AlertCircle,
  Info
} from 'lucide-react';

interface SeriesResultsProps {
  series: ISeries[];
  server: IServer;
}

export function SeriesResults({ series, server }: SeriesResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<string | null>(null);
  const { toast } = useToast();
  
  const filteredSeries = searchTerm 
    ? series.filter(show => {
        const name = (show.name || show.title || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      })
    : series;

  const copyToClipboard = async (show: ISeries) => {
    try {
      setLoadingInfo(show.series_id);
      const info = await fetchSeriesInfo(server, show.series_id);
      
      if (!info) {
        throw new Error('Failed to fetch series info');
      }

      const commands = generateSeriesAria2cCommands(server, info, show.name);
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
    } finally {
      setLoadingInfo(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    // First try to parse as timestamp
    let date: Date;
    
    if (!isNaN(Number(dateString))) {
      // It's a timestamp
      date = new Date(Number(dateString) * 1000);
    } else {
      // Try to parse as a date string
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
            
            return (
              <Card 
                key={show.series_id}
                className="overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-4">
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
                    <Button
                      size="sm"
                      variant={isCopied ? "default" : "secondary"}
                      className={cn(
                        "transition-all whitespace-nowrap",
                        isCopied && "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => copyToClipboard(show)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Loading...
                        </>
                      ) : isCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy aria2c
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