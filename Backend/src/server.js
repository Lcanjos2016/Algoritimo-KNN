import cors from "cors";
import "dotenv/config";
import express from "express";
import { sampleFavorites, sampleMovies, sampleRatings } from "./data/movies.js";
import { requireAuth } from "./middleware/auth.js";
import { loginUser, registerUser } from "./services/auth.js";
import {
  addFavorite,
  countMovieRatings,
  getFavoritesByUser,
  getMovieRatingsByUser,
  listMovies,
  listRatings,
  removeFavorite,
  saveRating,
} from "./services/repository.js";
import { recommendMoviesByUsers } from "./services/knn.js";

const app = express();
const port = process.env.PORT || 3333;
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://192.168.1.20:5173",
  "http://192.168.1.20:5174",
];
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
  ...defaultAllowedOrigins,
].map((origin) => origin.trim().replace(/\/$/, ""));
const localDevOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):517\d$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin) || localDevOriginPattern.test(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem nao permitida pelo CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok", app: "CineMatch API" });
});

app.post("/api/auth/register", async (request, response) => {
  const { name, email, password } = request.body;

  if (!name || !email || !password) {
    return response.status(400).json({ message: "Nome, email e senha sao obrigatorios." });
  }

  try {
    const session = await registerUser({ name, email, password });
    return response.status(201).json(session);
  } catch (error) {
    return response.status(error.status || 400).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({ message: "Email e senha sao obrigatorios." });
  }

  try {
    const session = await loginUser({ email, password });
    return response.json(session);
  } catch (error) {
    return response.status(error.status || 401).json({ message: error.message });
  }
});

app.get("/api/me", requireAuth, async (request, response) => {
  const favorites = await getFavoritesByUser(request.user.id);
  const ratings = await getMovieRatingsByUser(request.user.id);

  response.json({
    profile: request.user,
    favorites,
    ratings,
  });
});

app.get("/api/movies", async (_request, response) => {
  const movies = await listMovies();
  const ratingCounts = await countMovieRatings();

  response.json(
    movies.map((movie) => ({
      ...movie,
      ratingCount: ratingCounts.get(Number(movie.id)) || 0,
    })),
  );
});

app.post("/api/favorites", requireAuth, async (request, response) => {
  const { movieId } = request.body;

  try {
    const favorites = await addFavorite({
      userId: request.user.id,
      movieId: Number(movieId),
    });
    return response.status(201).json(favorites);
  } catch (error) {
    return response.status(400).json({ message: error.message });
  }
});

app.delete("/api/favorites/:movieId", requireAuth, async (request, response) => {
  const favorites = await removeFavorite({
    userId: request.user.id,
    movieId: Number(request.params.movieId),
  });

  response.json(favorites);
});

app.put("/api/ratings/:movieId", requireAuth, async (request, response) => {
  const rating = Number(request.body.rating);

  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    return response.status(400).json({ message: "A nota deve ser um inteiro entre 0 e 5." });
  }

  try {
    const savedRating = await saveRating({
      userId: request.user.id,
      movieId: Number(request.params.movieId),
      rating,
    });
    return response.json(savedRating);
  } catch (error) {
    return response.status(400).json({ message: error.message });
  }
});

app.get("/api/recommendations", requireAuth, async (request, response) => {
  const movies = await listMovies();
  const ratings = await listRatings();
  const recommendations = recommendMoviesByUsers({
    movies,
    ratings,
    userId: request.user.id,
    k: Number(request.query.k) || 3,
    limit: Number(request.query.limit) || 5,
  });

  response.json(recommendations);
});

if (process.env.NODE_ENV !== "production") {
  console.log(
    `Demo data: ${sampleMovies.length} filmes, ${sampleRatings.length} avaliacoes, ${sampleFavorites.length} favoritos.`,
  );
}

app.listen(port, () => {
  console.log(`CineMatch API running on http://localhost:${port}`);
});
