export interface TempGuidePoint {
  c: number;
  hrs: number;
  rise: number;
}

export const TEMP_GUIDE: TempGuidePoint[] = [
  { c: 27, hrs: 5.5, rise: 30 },
  { c: 26, hrs: 5.5, rise: 30 },
  { c: 25.5, hrs: 6, rise: 40 },
  { c: 25, hrs: 6, rise: 40 },
  { c: 24.5, hrs: 7, rise: 50 },
  { c: 24, hrs: 7, rise: 50 },
  { c: 23, hrs: 8, rise: 55 },
  { c: 22.5, hrs: 9, rise: 60 },
  { c: 22, hrs: 10, rise: 65 },
  { c: 21.5, hrs: 11, rise: 70 },
  { c: 21, hrs: 12, rise: 75 },
  { c: 20.5, hrs: 13, rise: 80 },
  { c: 20, hrs: 14, rise: 85 },
  { c: 19.5, hrs: 15, rise: 90 },
  { c: 19, hrs: 16, rise: 95 },
  { c: 18, hrs: 16, rise: 100 },
];

export function getFermentationSuggestion(celsius: number | string): TempGuidePoint | null {
  const v = parseFloat(String(celsius));
  if (isNaN(v)) return null;
  return TEMP_GUIDE.reduce((best, curr) =>
    Math.abs(curr.c - v) < Math.abs(best.c - v) ? curr : best
  );
}
