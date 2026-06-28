function groupRatingsByUser(ratings) {
  return ratings.reduce((groups, rating) => {
    const userRatings = groups.get(rating.userId) || new Map();
    userRatings.set(Number(rating.movieId), Number(rating.rating));
    groups.set(rating.userId, userRatings);
    return groups;
  }, new Map());
}

function cosineSimilarity(currentUserRatings, otherUserRatings) {
  const commonMovieIds = [...currentUserRatings.keys()].filter((movieId) =>
    otherUserRatings.has(movieId),
  );

  if (commonMovieIds.length === 0) {
    return 0;
  }

  const dotProduct = commonMovieIds.reduce(
    (sum, movieId) => sum + currentUserRatings.get(movieId) * otherUserRatings.get(movieId),
    0,
  );
  const currentMagnitude = Math.sqrt(
    commonMovieIds.reduce((sum, movieId) => sum + currentUserRatings.get(movieId) ** 2, 0),
  );
  const otherMagnitude = Math.sqrt(
    commonMovieIds.reduce((sum, movieId) => sum + otherUserRatings.get(movieId) ** 2, 0),
  );

  if (currentMagnitude === 0 || otherMagnitude === 0) {
    return 0;
  }

  return dotProduct / (currentMagnitude * otherMagnitude);
}

function popularRecommendations({ movies, ratings, ratedMovieIds, limit }) {
  const movieScores = new Map();

  for (const rating of ratings) {
    const movieId = Number(rating.movieId);

    if (ratedMovieIds.has(movieId)) {
      continue;
    }

    const score = movieScores.get(movieId) || { total: 0, count: 0 };
    score.total += Number(rating.rating);
    score.count += 1;
    movieScores.set(movieId, score);
  }

  return movies
    .filter((movie) => !ratedMovieIds.has(Number(movie.id)))
    .map((movie) => {
      const score = movieScores.get(Number(movie.id)) || { total: 0, count: 0 };
      return {
        ...movie,
        recommendationScore: score.count ? Number((score.total / score.count).toFixed(2)) : 0,
        reason: "popular",
      };
    })
    .sort((movieA, movieB) => movieB.recommendationScore - movieA.recommendationScore)
    .slice(0, limit);
}

export function recommendMoviesByUsers({ movies, ratings, userId, k = 3, limit = 5 }) {
  const ratingsByUser = groupRatingsByUser(ratings);
  const currentUserRatings = ratingsByUser.get(userId) || new Map();
  const ratedMovieIds = new Set(currentUserRatings.keys());

  if (currentUserRatings.size < 2) {
    return popularRecommendations({ movies, ratings, ratedMovieIds, limit });
  }

  const neighbors = [...ratingsByUser.entries()]
    .filter(([otherUserId]) => otherUserId !== userId)
    .map(([otherUserId, otherUserRatings]) => ({
      userId: otherUserId,
      similarity: cosineSimilarity(currentUserRatings, otherUserRatings),
      ratings: otherUserRatings,
    }))
    .filter((neighbor) => neighbor.similarity > 0)
    .sort((neighborA, neighborB) => neighborB.similarity - neighborA.similarity)
    .slice(0, k);

  if (neighbors.length === 0) {
    return popularRecommendations({ movies, ratings, ratedMovieIds, limit });
  }

  const scores = new Map();

  for (const neighbor of neighbors) {
    for (const [movieId, rating] of neighbor.ratings.entries()) {
      if (ratedMovieIds.has(movieId) || rating < 3) {
        continue;
      }

      const current = scores.get(movieId) || { weightedTotal: 0, similarityTotal: 0 };
      current.weightedTotal += rating * neighbor.similarity;
      current.similarityTotal += neighbor.similarity;
      scores.set(movieId, current);
    }
  }

  const movieMap = new Map(movies.map((movie) => [Number(movie.id), movie]));

  return [...scores.entries()]
    .map(([movieId, score]) => ({
      ...movieMap.get(movieId),
      recommendationScore: Number((score.weightedTotal / score.similarityTotal).toFixed(2)),
      reason: "knn",
    }))
    .filter((movie) => movie.id)
    .sort((movieA, movieB) => movieB.recommendationScore - movieA.recommendationScore)
    .slice(0, limit);
}
