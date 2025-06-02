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

export function generateAria2cCommand(server: IXtreamServer, movie: IMovie): string {
  const movieName = movie.name || movie.title || 'movie';
  const extension = movie.container_extension || 'mp4';
  const downloadUrl = `${server.url}/movie/${server.username}/${server.password}/${movie.stream_id}.${extension}`;
  const outputFile = `${movieName}.${extension}`;
  
  return `aria2c --continue --max-connection-per-server=4 --split=4 --show-console-readout=true --user-agent="XCIPTV" -o "${outputFile}" "${downloadUrl}"`;
}