export interface IXtreamServer {
  url: string;
  username: string;
  password: string;
}

export interface ICategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface IMovie {
  stream_id: number;
  name: string;
  title?: string;
  category_id: string;
  container_extension: string;
  added: string;
  [key: string]: any;
}

export interface IMovieInfo {
  info: {
    movie_image: string;
    plot: string;
    genre: string;
    cast: string;
    director: string;
    rating: number;
    releasedate: string;
    tmdb_id: number;
  };
  movie_data: IMovie;
}

export interface ISeries {
  series_id: number;
  name: string;
  title?: string;
  category_id: string;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  release_date: string;
  rating: string;
  last_modified?: string;
  [key: string]: any;
}

export interface ISeriesInfo {
  info: {
    name: string;
    cover_big?: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    release_date: string;
    rating: string;
    youtube_trailer: string;
  };
  episodes: {
    [seasonNumber: string]: {
      id: string;
      episode_num: string;
      title: string;
      container_extension: string;
      info: {
        plot: string;
      };
      [key: string]: any;
    }[];
  };
  [key: string]: any;
}

async function api<T>(endpoint: string, body: any): Promise<T> {
  const res = await fetch(`/api/xtream/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

export const fetchCategories = (server: IXtreamServer) =>
  api<ICategory[]>('categories', { server });

export const fetchSeriesCategories = (server: IXtreamServer) =>
  api<ICategory[]>('series-categories', { server });

export const fetchMovies = (server: IXtreamServer, categoryId?: string) =>
  api<IMovie[]>('movies', { server, categoryId });

export const fetchSeries = (server: IXtreamServer, categoryId?: string) =>
  api<ISeries[]>('series', { server, categoryId });

export const fetchMovieInfo = (server: IXtreamServer, movieId: string) =>
  api<IMovieInfo>('movie-info', { server, movieId });

export const fetchSeriesInfo = (server: IXtreamServer, seriesId: number) =>
  api<ISeriesInfo>('series-info', { server, seriesId });

export function generateAria2cCommand(server: IXtreamServer, movie: IMovie): string {
  const movieName = movie.name || movie.title || 'movie';
  const extension = movie.container_extension || 'mp4';
  const downloadUrl = `${server.url}/movie/${server.username}/${server.password}/${movie.stream_id}.${extension}`;
  const outputFile = `${movieName}.${extension}`;

  return `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -o "${outputFile}" "${downloadUrl}"`;
}

export function generateSeriesAria2cCommands(
  server: IXtreamServer,
  seriesInfo: ISeriesInfo,
  seriesName: string,
  createFolders: boolean = true
): string[] {
  const commands: string[] = [];
  const sanitizedSeriesName = seriesName.replace(/[<>:"/\\|?*]/g, '_');

  if (createFolders) {
    commands.push(`mkdir -p "${sanitizedSeriesName}"`);
  }

  Object.entries(seriesInfo.episodes).forEach(([seasonNum, episodes]) => {
    const paddedSeasonNum = seasonNum.toString().padStart(2, '0');

    if (createFolders) {
      const seasonDir = `${sanitizedSeriesName}/S${paddedSeasonNum}`;
      commands.push(`mkdir -p "${seasonDir}"`);
    }

    episodes.forEach((episode) => {
      const paddedEpisodeNum = episode.episode_num.toString().padStart(2, '0');
      const extension = episode.container_extension || 'mp4';
      const episodeName = `S${paddedSeasonNum}E${paddedEpisodeNum}`;
      const downloadUrl = `${server.url}/series/${server.username}/${server.password}/${episode.id}.${extension}`;

      if (createFolders) {
        commands.push(
          `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -d "${sanitizedSeriesName}/S${paddedSeasonNum}" -o "${episodeName}.${extension}" "${downloadUrl}"`
        );
      } else {
        commands.push(
          `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -o "${episodeName}.${extension}" "${downloadUrl}"`
        );
      }
    });
  });

  return commands;
}
