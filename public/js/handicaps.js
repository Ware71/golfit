// handicaps.js

function getCourseHandicap(roundType, handicapIndex, courseRating, slopeRating, par) {
  if (handicapIndex === null) {
    return roundType === "9 Holes" ? 27 : 54;
  }
  const base = (handicapIndex * slopeRating) / 113 + (courseRating - par);
  return Math.round(roundType === "9 Holes" ? base / 2 : base);
}

function getESC(courseHandicap, si) {
  if (courseHandicap >= si + 72) return 5;
  if (courseHandicap >= si + 54) return 4;
  if (courseHandicap >= si + 36) return 3;
  if (courseHandicap >= si + 18) return 2;
  if (courseHandicap >= si) return 1;
  return 0;
}

function processRoundScores(scores, courseHandicap) {
  let totalAGS = 0;

  const updatedScores = scores.map(hole => {
    const esc = getESC(courseHandicap, hole.si);
    const max = hole.par + 2 + esc;
    const ags = Math.min(hole.score, max);
    totalAGS += ags;

    return {
      ...hole,
      esc,
      max,
      ags
    };
  });

  return {
    scores: updatedScores,
    AdjustedGrossScore: totalAGS
  };
}

function calculateScoreDifferential({ 
  type, 
  AdjustedGrossScore, 
  SlopeRating, 
  CourseRating 
}) {
  if (AdjustedGrossScore == null || SlopeRating == null || CourseRating == null) {
    throw new Error("Missing required inputs for score differential.");
  }

  const ScoreDifferential = (113 / SlopeRating) * (AdjustedGrossScore - CourseRating);

  if (type === "9 Holes") {
    return {
      ScoreDifferential,
      NineHolePaired: "Available"
    };
  }

  return {
    ScoreDifferential,
    NineHolePaired: null
  };
}

function handleNineHoleDifferential(currentRound, previousRounds) {
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  const currentDate = new Date(currentRound.date).getTime();

  // 1. Try to find a pairing round
  const pair = previousRounds.find(prior =>
    prior.type === "9 Holes" &&
    prior.NineHolePaired === "Available" &&
    new Date(prior.date).getTime() >= currentDate - THIRTY_DAYS
  );

  // 2. If a pair is found, sum base diffs — no HI adjustment!
  if (pair) {
    const total = currentRound.RawScoreDifferential + pair.RawScoreDifferential;

    const currentLater = new Date(currentRound.date) > new Date(pair.date);
    const newer = currentLater ? currentRound : pair;

    newer.HandicapScoreDifferential = total;

    currentRound.NineHolePaired = pair.id;
    pair.NineHolePaired = currentRound.id;

    return {
      paired: true,
      updated: newer,
      other: currentLater ? pair : currentRound
    };
  }

  // 3. No pair found — if player has HI, apply full 9-hole adjustment
  if (currentRound.HandicapIndex !== null) {
    currentRound.HandicapScoreDifferential = currentRound.RawScoreDifferential + (currentRound.HandicapIndex * 0.52 + 1.2);
    currentRound.NineHolePaired = null;
    return {
      paired: false,
      updated: currentRound
    };
  }

  // 4. No HI and no pair — mark as available
  currentRound.HandicapScoreDifferential = null;
  currentRound.NineHolePaired = "Available";

  return {
    paired: false,
    updated: currentRound
  };
}

function getExceptionalAdjustment(handicapIndex, scoreDiff) {
  if (handicapIndex === null || scoreDiff === null) return 0;

  const gap = handicapIndex - scoreDiff;

  if (gap >= 10) return -2;
  if (gap >= 7) return -1;
  return 0;
}

function applyExceptionalAdjustment(rounds, adjustment, triggerIndex) {
  if (adjustment === 0) return;

  for (let i = 0; i < triggerIndex; i++) {
    const round = rounds[i];
    if (round.HandicapScoreDifferential !== null) {
      round.AdjustedScoreDifferential = round.HandicapScoreDifferential + adjustment;
    }
  }

  // Also apply it to the current round (at the trigger index)
  const triggerRound = rounds[triggerIndex];
  if (triggerRound.HandicapScoreDifferential !== null) {
    triggerRound.AdjustedScoreDifferential =
      triggerRound.HandicapScoreDifferential + adjustment;
  }
}

function initialiseHandicap(previousRound) {
  return previousRound?.AfterRoundHandicap ?? null;
}

function calculateHandicapIndex(rounds) {
  const diffs = rounds
    .map(r => r.AdjustedScoreDifferential)
    .filter(d => d !== null)
    .sort((a, b) => a - b);

  const count = diffs.length;
  if (count < 3) return null;

  const matrix = {
    3: [1, -2], 4: [1, -1], 5: [1, 0], 6: [2, -1],
    7: [2, 0], 8: [2, 0], 9: [3, 0], 10: [3, 0], 11: [3, 0],
    12: [4, 0], 13: [4, 0], 14: [4, 0], 15: [5, 0], 16: [5, 0],
    17: [6, 0], 18: [6, 0], 19: [7, 0], 20: [8, 0]
  };

  const [useCount, adjustment] = matrix[count] || [8, 0];
  const best = diffs.slice(0, useCount);

  return adjustment !== 0
    ? Math.min(...best) + adjustment
    : best.reduce((sum, d) => sum + d, 0) / useCount;
}

function refreshAllRoundsForUser(rounds) {
  rounds.sort((a, b) => new Date(a.date) - new Date(b.date));

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const previousRound = i > 0 ? rounds[i - 1] : null;

    const handicapIndex = initialiseHandicap(previousRound);
    round.CurrentHandicap = handicapIndex;

    round.PlayingHandicap = getCourseHandicap(
      round.type,
      handicapIndex,
      round.course_rating,
      round.slope,
      round.par
    );

    const { scores, AdjustedGrossScore } = processRoundScores(round.scores, round.PlayingHandicap);
    round.scores = scores;
    round.AdjustedGrossScore = AdjustedGrossScore;

    const { ScoreDifferential, NineHolePaired } = calculateScoreDifferential({
      type: round.type,
      AdjustedGrossScore,
      SlopeRating: round.slope,
      CourseRating: round.course_rating
    });
    round.RawScoreDifferential = ScoreDifferential;
    round.NineHolePaired = NineHolePaired;

    if (round.type === "9 Holes") {
      const { updated, other } = handleNineHoleDifferential(round, rounds.slice(0, i));
    }

    if (round.HandicapScoreDifferential !== null) {
      const adjustment = getExceptionalAdjustment(handicapIndex, round.HandicapScoreDifferential);
      round.ExceptionalAdjustment = adjustment;

      applyExceptionalAdjustment(rounds, adjustment, i);

      const eligibleRounds = rounds.slice(0, i + 1).filter(r => r.AdjustedScoreDifferential !== null);
      const index = calculateHandicapIndex(eligibleRounds);
      round.AfterRoundHandicap = index;
    } else {
      round.ExceptionalAdjustment = 0;
      round.AdjustedScoreDifferential = null;
      round.AfterRoundHandicap = handicapIndex;
    }
  }

  return rounds;
}

export {
  getCourseHandicap,
  getESC,
  processRoundScores,
  calculateScoreDifferential,
  handleNineHoleDifferential,
  getExceptionalAdjustment,
  applyExceptionalAdjustment,
  initialiseHandicap,
  calculateHandicapIndex,
  refreshAllRoundsForUser
};
