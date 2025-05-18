// handicaps.js

export function getLatestStatusAndRoundCount(newDate, roundHistory) {
  let isLatest = true;
  let fullRounds = 0;
  let nineHoleRounds = 0;

  for (const round of roundHistory) {
    const pastDate = new Date(round.date);
    if (pastDate > newDate) isLatest = false;
    if (round.type === "18 Holes") fullRounds += 1;
    else if (round.type === "9 Holes") nineHoleRounds += 1;
  }

  const pairedNineHoleRounds = Math.floor(nineHoleRounds / 2);
  const validRoundCount = fullRounds + pairedNineHoleRounds;

  return { isLatest, validRoundCount };
}

export function calculatePlayingHandicap(round, hi) {
  if (!hi) return round.type === "18 Holes" ? 54 : 27;

  hi = Math.min(hi, 54); // cap max HI
  const slope = round.slopeRating;
  const rating = round.courseRating;
  const par = round.par;

  const multiplier = round.type === "9 Holes" ? (hi / 2) : hi;
  return Math.round(multiplier * (slope / 113) + (rating - par));
}

export function applyESC(scores, playingHandicap, strokeIndexMap, pars) {
  const strokesPerHole = Math.floor(playingHandicap / scores.length);
  const extraStrokes = playingHandicap % scores.length;

  return scores.map((score, i) => {
    const strokesReceived = strokeIndexMap[i] <= extraStrokes ? strokesPerHole + 1 : strokesPerHole;
    const netDoubleBogey = pars[i] + strokesReceived + 2;
    return Math.min(score, netDoubleBogey);
  });
}

export function calculateAdjustedGrossScore(escScores) {
  return escScores.reduce((a, b) => a + b, 0);
}

export function calculateScoreDifferential(round, ags, hi) {
  const slope = round.slopeRating;
  const rating = round.courseRating;

  if (round.type === "9 Holes") {
    if (hi) {
      return (113 / slope) * (ags - rating) + hi * 0.52 + 1.2;
    } else {
      return (113 / slope) * (ags - rating);
    }
  }

  return (113 / slope) * (ags - rating);
}

export function checkExceptionalScore(diff, hi) {
  if (!hi) return 0;
  const gap = hi - diff;
  if (gap > 10) return -2;
  if (gap > 7) return -1;
  return 0;
}

export function calculateHandicapIndex(diffs) {
  const count = diffs.length;
  diffs.sort((a, b) => a - b);

  if (count < 3) return null;
  if (count === 3) return diffs[0] - 2;
  if (count === 4) return diffs[0] - 1;
  if (count === 5) return diffs[0];
  if (count === 6) return average(diffs.slice(0, 2)) - 1;
  if (count <= 8) return average(diffs.slice(0, 2));
  if (count <= 11) return average(diffs.slice(0, 3));
  if (count <= 14) return average(diffs.slice(0, 4));
  if (count <= 16) return average(diffs.slice(0, 5));
  if (count <= 18) return average(diffs.slice(0, 6));
  if (count === 19) return average(diffs.slice(0, 7));
  return average(diffs.slice(0, 8));
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function recalculateHandicapChronologically(rounds) {
  let hi = null;
  const unpairedNineHoles = [];
  const processed = [];

  for (const round of rounds.sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const isNine = round.type === "9 Holes";
    const strokeIndexMap = round.scores.map(s => s.si);
    const pars = round.scores.map(s => s.par);
    const scores = round.scores.map(s => s.score);

    const playingHandicap = calculatePlayingHandicap(round, hi);
    const esc = applyESC(scores, playingHandicap, strokeIndexMap, pars);
    const ags = calculateAdjustedGrossScore(esc);

    round.playingHandicap = playingHandicap;
    round.adjustedGrossScore = ags;

    let diff = null;
    let isPaired = false;
    let pairedRound = null;

    if (isNine) {
      // Expire pairings older than 40 days
      const fortyDaysAgo = new Date(new Date(round.date).getTime() - 40 * 24 * 60 * 60 * 1000);
      const match = unpairedNineHoles.find(r => !r.isPaired && new Date(r.date) >= fortyDaysAgo);

      if (match) {
        isPaired = true;
        pairedRound = match;

        // Mark both as paired
        round.isPaired = true;
        round.pairedWith = match.id;
        match.isPaired = true;
        match.pairedWith = round.id;

        // Calculate score differentials separately
        const diff1 = calculateScoreDifferential(match, match.adjustedGrossScore, hi);
        const diff2 = calculateScoreDifferential(round, ags, hi);
        diff = diff1 + diff2;
        round.scoreDifferential = diff2;
        match.scoreDifferential = diff1;

        // Store final diff only on the second round
        round.handicapScoreDiff = diff;
        match.handicapScoreDiff = null;

        processed.push(match);
      } else {
        round.isPaired = false;
        round.pairedWith = null;
        round.scoreDifferential = calculateScoreDifferential(round, ags, hi);
        round.handicapScoreDiff = null;
        unpairedNineHoles.push(round);
      }
    } else {
      diff = calculateScoreDifferential(round, ags, hi);
      round.scoreDifferential = diff;
      round.handicapScoreDiff = diff;
    }

    let adjustment = 0;
    if (round.handicapScoreDiff != null && hi && round.handicapScoreDiff < hi - 7) {
      adjustment = checkExceptionalScore(round.handicapScoreDiff, hi);

      for (const r of processed) {
        if (r.handicapScoreDiff != null && (!r.isPaired || r.pairedWith == null)) {
          r.handicapScoreDiff += adjustment;
        } else if (r.isPaired && r.pairedWith != null) {
          r.handicapScoreDiff += adjustment / 2;
        }
      }
    }

    round.isExceptional = adjustment !== 0;

    const fullRounds = processed.filter(r => r.handicapScoreDiff != null).map(r => r.handicapScoreDiff);
    if (round.handicapScoreDiff != null) fullRounds.push(round.handicapScoreDiff);

    const currentHI = calculateHandicapIndex(fullRounds);
    round.handicapIndexAfter = currentHI;
    hi = currentHI;

    processed.push(round);
  }

  return processed;
}
