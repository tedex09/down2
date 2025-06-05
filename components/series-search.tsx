'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Fuse from 'fuse.js';
import { IServer } from '@/models/Server';
import { ICategory, ISeries, fetchSeriesCategories, fetchSeries, fetchSeriesInfoBatch, generateSeriesAria2cCommands } from '@/lib/xtream';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon, Search, Loader2, Download } from 'lucide-react';
import { SeriesResults } from '@/components/series-results';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const searchSchema = z.object({
  searchType: z.enum(['category', 'name', 'date', 'dateCategory']),
  category: z.string().optional(),
  seriesName: z.string().optional(),
  exactMatch: z.boolean().optional(),
  minDate: z.date().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SeriesSearchProps {
  server: IServer;
}

export function SeriesSearch({ server }: SeriesSearchProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [series, setSeries] = useState<ISeries[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCopyingAll, setIsCopyingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchType: 'category',
      exactMatch: false,
    },
  });

  const searchType = form.watch('searchType');
  const selectedCategory = form.watch('category');

  useEffect(() => {
    setSeries([]);
    setFilteredSeries([]);
  }, [searchType]);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const categoryData = await fetchSeriesCategories({
          url: server.url,
          username: server.username,
          password: server.password
        });
        setCategories(categoryData);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar categorias',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (server) {
      loadCategories();
    }
  }, [server, toast]);

  const copyAllCommands = async () => {
    if (!series.length) return;

    setIsCopyingAll(true);
    setLoadingProgress(0);

    try {
      const seriesIds = series.map(show => show.series_id);
      const infoMap = await fetchSeriesInfoBatch(
        server, 
        seriesIds,
        (progress) => setLoadingProgress(progress)
      );

      const allCommands: string[] = [];
      series.forEach(show => {
        const info = infoMap.get(show.series_id);
        if (info) {
          const commands = generateSeriesAria2cCommands(server, info, show.name, true);
          allCommands.push(...commands);
        }
      });

      await navigator.clipboard.writeText(allCommands.join('\n'));
      toast({
        title: 'Sucesso',
        description: `Copiados ${allCommands.length} comandos de download para a área de transferência`,
      });
    } catch (error) {
      console.error('Erro ao copiar comandos:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao copiar para a área de transferência',
        variant: 'destructive'
      });
    } finally {
      setIsCopyingAll(false);
      setLoadingProgress(100);
    }
  };

  const onSubmit = async (data: SearchFormValues) => {
    setIsSearching(true);
    setLoadingProgress(0);
    try {
      let results: ISeries[] = [];
      
      if (data.searchType === 'category' || data.searchType === 'dateCategory') {
        const seriesData = await fetchSeries(
          {
            url: server.url,
            username: server.username,
            password: server.password
          },
          data.category
        );
        results = seriesData;
      } 
      
      if (data.searchType === 'name') {
        const allSeries = await fetchSeries({
          url: server.url,
          username: server.username,
          password: server.password
        });
        
        if (data.seriesName) {
          if (data.exactMatch) {
            results = allSeries.filter(show => 
              (show.name || show.title || '').toLowerCase() === data.seriesName?.toLowerCase()
            );
          } else {
            const fuse = new Fuse(allSeries, {
              keys: ['name', 'title'],
              threshold: 0.4,
            });
            results = fuse.search(data.seriesName).map(result => result.item);
          }
        }
      }
      
      if (data.searchType === 'date' || data.searchType === 'dateCategory') {
        const allSeries = data.searchType === 'date' 
          ? await fetchSeries({
              url: server.url,
              username: server.username,
              password: server.password
            })
          : results;
          
        if (data.minDate) {
          const minDateTimestamp = Math.floor(data.minDate.getTime() / 1000);
          results = allSeries.filter(show => {
            let showTimestamp: number;
            if (show.last_modified) {
              showTimestamp = typeof show.last_modified === 'number' 
                ? show.last_modified 
                : parseInt(show.last_modified, 10);
              
              if (isNaN(showTimestamp)) {
                showTimestamp = new Date(show.last_modified).getTime() / 1000;
              }

              return showTimestamp >= minDateTimestamp;
            }
            return false;
          });
        }
      }
      
      setSeries(results);
      setFilteredSeries(results);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar séries',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="searchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Busca</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="category" id="category" />
                        </FormControl>
                        <FormLabel htmlFor="category" className="cursor-pointer font-normal">
                          Por Categoria
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="name" id="name" />
                        </FormControl>
                        <FormLabel htmlFor="name" className="cursor-pointer font-normal">
                          Por Nome
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="date" id="date" />
                        </FormControl>
                        <FormLabel htmlFor="date" className="cursor-pointer font-normal">
                          Por Data
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dateCategory" id="dateCategory" />
                        </FormControl>
                        <FormLabel htmlFor="dateCategory" className="cursor-pointer font-normal">
                          Data e Categoria
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(searchType === 'category' || searchType === 'dateCategory') && (
              <div className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        disabled={isLoading || categories.length === 0}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.category_id} value={category.category_id}>
                              {category.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {searchType === 'category' && selectedCategory && !isSearching && series.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={copyAllCommands}
                    disabled={isCopyingAll || isSearching || isLoading || series.length === 0}
                  >
                    {isCopyingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Copiando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Copiar Todos os Comandos
                      </>
                    )}
                  </Button>
                )}


              </div>
            )}

            {searchType === 'name' && (
              <>
                <FormField
                  control={form.control}
                  name="seriesName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Série</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome da série..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exactMatch"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Somente nome exato
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </>
            )}

            {(searchType === 'date' || searchType === 'dateCategory') && (
              <FormField
                control={form.control}
                name="minDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Adicionadas após</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSearching || isLoading}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Séries
              </>
            )}
          </Button>
        </form>
      </Form>

      {(isSearching || isCopyingAll) && loadingProgress > 0 && (
        <div className="mt-4 space-y-2">
          <Progress value={loadingProgress} />
          <p className="text-sm text-center text-muted-foreground">
            {isCopyingAll ? 'Gerando comandos...' : 'Carregando séries...'} {loadingProgress}%
          </p>
        </div>
      )}
      
      {filteredSeries.length > 0 && (
        <SeriesResults series={filteredSeries} server={server} />
      )}
      
      {!isSearching && series.length === 0 && (
        <Card className="mt-6 border border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">Nenhuma série encontrada</h3>
            <p className="text-muted-foreground mt-2">
              Tente ajustar seus critérios de busca para encontrar mais resultados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}