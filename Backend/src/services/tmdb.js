const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageBaseUrl = "https://image.tmdb.org/t/p/w500";
const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;
const tmdbApiKey = process.env.TMDB_API_KEY;

const genreNames = new Map([
  [12, "adventure"],
  [14, "fantasy"],
  [16, "animation"],
  [18, "drama"],
  [27, "horror"],
  [28, "action"],
  [35, "comedy"],
  [36, "history"],
  [37, "western"],
  [53, "thriller"],
  [80, "crime"],
  [99, "documentary"],
  [878, "sci-fi"],
  [9648, "mystery"],
  [10402, "music"],
  [10749, "romance"],
  [10751, "family"],
  [10752, "war"],
  [10770, "tv movie"],
]);

function buildTmdbUrl(path, params = {}) {
  const url = new URL(`${tmdbBaseUrl}${path}`);
  url.searchParams.set("language", "pt-BR");

  if (tmdbApiKey && !tmdbToken) {
    url.searchParams.set("api_key", tmdbApiKey);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function getTmdbHeaders() {
  if (!tmdbToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${tmdbToken}`,
  };
}

function requireTmdbCredentials() {
  if (!tmdbToken && !tmdbApiKey) {
    const error = new Error(
      "Configure TMDB_READ_ACCESS_TOKEN ou TMDB_API_KEY no Backend/.env para buscar filmes no TMDB.",
    );
    error.status = 503;
    throw error;
  }
}

function toMovieCandidate(movie) {
  const year = movie.release_date
    ? Number(movie.release_date.slice(0, 4))
    : new Date().getFullYear();
  const genres = (movie.genre_ids || [])
    .map((genreId) => genreNames.get(genreId))
    .filter(Boolean);

  return {
    tmdbId: movie.id,
    title: movie.title,
    genre: genres.length ? genres.join(", ") : "sem genero",
    year,
    description: movie.overview || "Descricao indisponivel.",
    image: movie.poster_path
      ? `${tmdbImageBaseUrl}${movie.poster_path}`
      : "https://placehold.co/500x750?text=CineMatch",
  };
}

export async function searchTmdbMovies(query) {
  requireTmdbCredentials();

  const response = await fetch(
    buildTmdbUrl("/search/movie", {
      query,
      include_adult: "false",
      page: "1",
    }),
    {
      headers: getTmdbHeaders(),
    },
  );

  if (!response.ok) {
    const error = new Error("Nao foi possivel buscar filmes no TMDB.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return (data.results || []).slice(0, 8).map(toMovieCandidate);
}
