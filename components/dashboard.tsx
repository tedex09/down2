"use client";

import { useState } from 'react';
import { ServerList } from '@/components/server-list';
import { AddServerForm } from '@/components/add-server-form';
import { MovieSearch } from '@/components/movie-search';
import { SeriesSearch } from '@/components/series-search';
import { ServerSelector } from '@/components/server-selector';
import { IServer } from '@/models/Server';
import { LayoutGrid, Database, Film, Search, Tv } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Dashboard() {
  const [selectedServer, setSelectedServer] = useState<IServer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleServerAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleServerSelected = (server: IServer) => {
    setSelectedServer(server);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IPTV Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Query and manage IPTV servers with Xtream Codes API
            </p>
          </div>
          <ServerSelector 
            onServerSelected={handleServerSelected} 
            refreshTrigger={refreshTrigger} 
          />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full md:col-span-1 bg-card/50 backdrop-blur-sm border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Add New Server
            </CardTitle>
            <CardDescription>
              Add a new IPTV server with Xtream Codes API support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddServerForm onServerAdded={handleServerAdded} />
          </CardContent>
        </Card>

        <Card className="col-span-full md:col-span-2 lg:col-span-2 bg-card/50 backdrop-blur-sm border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Content
            </CardTitle>
            <CardDescription>
              Search movies and series by category, date or name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="movies" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="movies">
                  <Film className="h-4 w-4 mr-2" />
                  Movies
                </TabsTrigger>
                <TabsTrigger value="series">
                  <Tv className="h-4 w-4 mr-2" />
                  Series
                </TabsTrigger>
                <TabsTrigger value="servers">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Manage Servers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="movies" className="mt-4">
                {selectedServer ? (
                  <MovieSearch server={selectedServer} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Film className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium">No Server Selected</h3>
                    <p className="text-muted-foreground mt-2">
                      Please select a server from the dropdown above to search for movies
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="series" className="mt-4">
                {selectedServer ? (
                  <SeriesSearch server={selectedServer} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Tv className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium">No Server Selected</h3>
                    <p className="text-muted-foreground mt-2">
                      Please select a server from the dropdown above to search for series
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="servers" className="mt-4">
                <ServerList 
                  onServerSelected={handleServerSelected} 
                  refreshTrigger={refreshTrigger} 
                  onServerRemoved={handleServerAdded} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}