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
  stream_id: string;
  stream_type: string;
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
    rating: string;
    releasedate: string;
    tmdb_id: string;
  };
  movie_data: IMovie;
}

export interface ISeries {
  series_id: string;
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
  added: string;
  [key: string]: any;
}

export interface ISeriesInfo {
  info: {
    name: string;
    cover_big: string;
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
      episode_num: number;
      title: string;
      container_extension: string;
      info: {
        title: string;
        plot: string;
      };
      [key: string]: any;
    }[];
  };
  [key: string]: any;
}

export async function fetchCategories(server: IXtreamServer): Promise<ICategory[]> {
  try {
    const url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_vod_categories`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchSeriesCategories(server: IXtreamServer): Promise<ICategory[]> {
  try {
    const url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_series_categories`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching series categories:', error);
    return [];
  }
}

export async function fetchMovies(
  server: IXtreamServer, 
  categoryId?: string
): Promise<IMovie[]> {
  try {
    let url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_vod_streams`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

export async function fetchSeries(
  server: IXtreamServer,
  categoryId?: string
): Promise<ISeries[]> {
  try {
    let url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_series`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching series:', error);
    return [];
  }
}

export async function fetchMovieInfo(
  server: IXtreamServer, 
  movieId: string
): Promise<IMovieInfo | null> {
  try {
    const url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_vod_info&stream_id=${movieId}`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie info:', error);
    return null;
  }
}

export async function fetchSeriesInfo(
  server: IXtreamServer,
  seriesId: string
): Promise<ISeriesInfo | null> {
  try {
    const url = `${server.url}/player_api.php?username=${server.username}&password=${server.password}&action=get_series_info&series_id=${seriesId}`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching series info:', error);
    return null;
  }
}

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
  seriesName: string
): string[] {
  const commands: string[] = [];
  const sanitizedSeriesName = seriesName.replace(/[<>:"/\\|?*]/g, '_');

  commands.push(`mkdir -p "${sanitizedSeriesName}"`);

  Object.entries(seriesInfo.episodes).forEach(([seasonNum, episodes]) => {
    const seasonDir = `${sanitizedSeriesName}/S${seasonNum}`;
    commands.push(`mkdir -p "${seasonDir}"`);

    episodes.forEach((episode) => {
      const paddedEpisodeNum = episode.episode_num.toString().padStart(2, '0');
      const extension = episode.container_extension || 'mp4';
      const episodeName = `S${seasonNum} E${paddedEpisodeNum}`;
      const downloadUrl = `${server.url}/series/${server.username}/${server.password}/${episode.id}.${extension}`;

      commands.push(
        `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -d "${seasonDir}" -o "${episodeName}.${extension}" "${downloadUrl}"`
      );
    });
  });

  return commands;
}