// Handicap.js

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
