const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses simple duration strings used for JWT `expiresIn` values (e.g. "15m",
 * "7d") into a millisecond count, for use as a cookie `maxAge`.
 */
export const parseDurationToMs = (duration: string): number => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(duration.trim());

  if (!match) {
    throw new Error(`Invalid duration string: "${duration}"`);
  }

  const [, value, unit] = match;
  return Number(value) * UNIT_TO_MS[unit.toLowerCase()];
};
