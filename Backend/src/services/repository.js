import { isSupabaseConfigured, supabaseAdmin } from "./supabase.js";

const memoryMovies = [];
const memoryFavorites = [];
const memoryRatings = [];

function toMovie(row) {
  return {
    id: row.id,
    tmdbId: row.tmdb_id || row.tmdbId,
    title: row.title || row.titulo,
    genre: row.genre || row.genero,
    year: row.year || row.ano,
    description: row.description || row.descricao,
    image: row.image || row.imagem,
  };
}

function toRating(row) {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    movieId: row.movie_id || row.movieId,
    rating: row.rating ?? row.nota,
    ratedAt: row.rated_at || row.data_avaliacao || row.ratedAt,
  };
}

function toFavorite(row) {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    movieId: row.movie_id || row.movieId,
  };
}

export async function listMovies() {
  if (!isSupabaseConfigured) {
    return memoryMovies;
  }

  const { data, error } = await supabaseAdmin.from("movies").select("*").order("title");

  if (error) {
    console.error("Erro ao listar filmes:", error.message);
    return [];
  }

  return data.map(toMovie);
}

export async function importMovie(movie) {
  if (!movie?.tmdbId || !movie?.title) {
    throw new Error("Dados do filme do TMDB invalidos.");
  }

  if (!isSupabaseConfigured) {
    const existing = memoryMovies.find((item) => Number(item.tmdbId) === Number(movie.tmdbId));

    if (existing) {
      return existing;
    }

    const newMovie = {
      id: memoryMovies.length + 1,
      ...movie,
    };
    memoryMovies.push(newMovie);
    return newMovie;
  }

  const { data, error } = await supabaseAdmin
    .from("movies")
    .upsert(
      {
        tmdb_id: movie.tmdbId,
        title: movie.title,
        genre: movie.genre,
        year: movie.year,
        description: movie.description,
        image: movie.image,
      },
      { onConflict: "tmdb_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toMovie(data);
}

export async function listRatings() {
  if (!isSupabaseConfigured) {
    return memoryRatings;
  }

  const { data, error } = await supabaseAdmin.from("ratings").select("*");

  if (error) {
    console.error("Erro ao listar avaliacoes:", error.message);
    return [];
  }

  return data.map(toRating);
}

export async function getMovieRatingsByUser(userId) {
  if (!userId) {
    return [];
  }

  if (!isSupabaseConfigured) {
    return memoryRatings.filter((rating) => rating.userId === userId);
  }

  const { data, error } = await supabaseAdmin
    .from("ratings")
    .select("id,user_id,movie_id,rating,rated_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao listar avaliacoes do usuario:", error.message);
    return [];
  }

  return data.map(toRating);
}

export async function countMovieRatings() {
  const ratings = await listRatings();
  const counts = new Map();

  for (const rating of ratings) {
    const movieId = Number(rating.movieId);
    counts.set(movieId, (counts.get(movieId) || 0) + 1);
  }

  return counts;
}

export async function getFavoritesByUser(userId) {
  if (!userId) {
    return [];
  }

  if (!isSupabaseConfigured) {
    return memoryFavorites.filter((favorite) => favorite.userId === userId);
  }

  const { data, error } = await supabaseAdmin
    .from("favorites")
    .select("id,user_id,movie_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao listar favoritos:", error.message);
    return [];
  }

  return data.map(toFavorite);
}

export async function addFavorite({ userId, movieId }) {
  const currentFavorites = await getFavoritesByUser(userId);

  if (currentFavorites.some((favorite) => Number(favorite.movieId) === movieId)) {
    return currentFavorites;
  }

  if (currentFavorites.length >= 5) {
    throw new Error("Cada usuario pode adicionar no maximo 5 filmes favoritos.");
  }

  if (!isSupabaseConfigured) {
    memoryFavorites.push({
      id: memoryFavorites.length + 1,
      userId,
      movieId,
    });
    return getFavoritesByUser(userId);
  }

  const { error } = await supabaseAdmin.from("favorites").insert({
    user_id: userId,
    movie_id: movieId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return getFavoritesByUser(userId);
}

export async function removeFavorite({ userId, movieId }) {
  if (!isSupabaseConfigured) {
    const index = memoryFavorites.findIndex(
      (favorite) => favorite.userId === userId && Number(favorite.movieId) === movieId,
    );

    if (index >= 0) {
      memoryFavorites.splice(index, 1);
    }

    return getFavoritesByUser(userId);
  }

  await supabaseAdmin
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("movie_id", movieId);

  return getFavoritesByUser(userId);
}

export async function saveRating({ userId, movieId, rating }) {
  if (!isSupabaseConfigured) {
    const existing = memoryRatings.find(
      (item) => item.userId === userId && Number(item.movieId) === movieId,
    );

    if (existing) {
      existing.rating = rating;
      existing.ratedAt = new Date().toISOString();
      return existing;
    }

    const newRating = {
      id: memoryRatings.length + 1,
      userId,
      movieId,
      rating,
      ratedAt: new Date().toISOString(),
    };
    memoryRatings.push(newRating);
    return newRating;
  }

  const { data, error } = await supabaseAdmin
    .from("ratings")
    .upsert(
      {
        user_id: userId,
        movie_id: movieId,
        rating,
        rated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toRating(data);
}
