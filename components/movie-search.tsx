"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { IServer } from '@/models/Server';
import { ICategory, IMovie, fetchCategories, fetchMovies, generateAria2cCommand } from '@/lib/xtream';
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
import { MovieResults } from '@/components/movie-results';
import { useToast } from '@/hooks/use-toast';

const searchSchema = z.object({
  searchType: z.enum(['category', 'name', 'date', 'dateCategory']),
  category: z.string().optional(),
  movieName: z.string().optional(),
  exactMatch: z.boolean().optional(),
  minDate: z.date().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface MovieSearchProps {
  server: IServer;
}

export function MovieSearch({ server }: MovieSearchProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<IMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchType: 'category',
      exactMatch: false,
    },
  });

  const searchType = form.watch('searchType');

  // Clear results when search type changes
  useEffect(() => {
    setMovies([]);
    setFilteredMovies([]);
  }, [searchType]);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const categoryData = await fetchCategories({
          url: server.url,
          username: server.username,
          password: server.password
        });
        setCategories(categoryData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories',
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

  const generateBatchCommands = () => {
    if (!movies.length) return;

    const commands = movies.map(movie => {
      const extension = movie.container_extension || 'mp4';
      const downloadUrl = `${server.url}/movie/${server.username}/${server.password}/${movie.stream_id}.${extension}`;
      return `aria2c "${downloadUrl}"`;
    }).join('\n');

    try {
      navigator.clipboard.writeText(commands);
      toast({
        title: 'Batch Commands Copied',
        description: `${movies.length} download commands copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy commands:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy batch commands',
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: SearchFormValues) => {
    setIsSearching(true);
    try {
      let results: IMovie[] = [];
      
      if (data.searchType === 'category' || data.searchType === 'dateCategory') {
        const moviesData = await fetchMovies(
          {
            url: server.url,
            username: server.username,
            password: server.password
          },
          data.searchType === 'category' ? data.category : data.category
        );
        results = moviesData;
      } 
      
      if (data.searchType === 'name') {
        const allMovies = await fetchMovies({
          url: server.url,
          username: server.username,
          password: server.password
        });
        
        if (data.movieName) {
          if (data.exactMatch) {
            results = allMovies.filter(movie => 
              (movie.name || movie.title || '').toLowerCase() === data.movieName?.toLowerCase()
            );
          } else {
            const fuse = new Fuse(allMovies, {
              keys: ['name', 'title'],
              threshold: 0.4,
            });
            results = fuse.search(data.movieName).map(result => result.item);
          }
        }
      }
      
      if (data.searchType === 'date' || data.searchType === 'dateCategory') {
        const allMovies = data.searchType === 'date' 
          ? await fetchMovies({
              url: server.url,
              username: server.username,
              password: server.password
            })
          : results;
          
        if (data.minDate) {
          const minDateTimestamp = Math.floor(data.minDate.getTime() / 1000);
          results = allMovies.filter(movie => {
            let movieTimestamp: number;
            if (movie.added) {
              movieTimestamp = typeof movie.added === 'number' 
                ? movie.added 
                : parseInt(movie.added, 10);
              
              if (isNaN(movieTimestamp)) {
                movieTimestamp = new Date(movie.added).getTime() / 1000;
              }
              
              return movieTimestamp >= minDateTimestamp;
            }
            return false;
          });
        }
      }
      
      setMovies(results);
      setFilteredMovies(results);
    } catch (error) {
      console.error('Error searching movies:', error);
      toast({
        title: 'Error',
        description: 'Failed to search movies',
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
                  <FormLabel>Search Type</FormLabel>
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
                          By Category
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="name" id="name" />
                        </FormControl>
                        <FormLabel htmlFor="name" className="cursor-pointer font-normal">
                          By Name
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="date" id="date" />
                        </FormControl>
                        <FormLabel htmlFor="date" className="cursor-pointer font-normal">
                          By Date
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dateCategory" id="dateCategory" />
                        </FormControl>
                        <FormLabel htmlFor="dateCategory" className="cursor-pointer font-normal">
                          Date & Category
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(searchType === 'category' || searchType === 'dateCategory') && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={isLoading || categories.length === 0}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
            )}

            {searchType === 'name' && (
              <>
                <FormField
                  control={form.control}
                  name="movieName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movie Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter movie title..." {...field} />
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
                        Exact match only
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
                    <FormLabel>Added After Date</FormLabel>
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
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSearching || isLoading}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Movies
                </>
              )}
            </Button>

            {(searchType === 'category' || searchType === 'dateCategory') && movies.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={generateBatchCommands}
                className="whitespace-nowrap"
              >
                <Download className="mr-2 h-4 w-4" />
                Copy All Commands
              </Button>
            )}
          </div>
        </form>
      </Form>
      
      {filteredMovies.length > 0 && (
        <MovieResults movies={filteredMovies} server={server} />
      )}
      
      {!isSearching && movies.length === 0 && (
        <Card className="mt-6 border border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No Movies Found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search criteria to find more results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}