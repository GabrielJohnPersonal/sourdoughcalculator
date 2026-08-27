import { FlourBlendItem } from '../types';

export interface BakerIngredientRow {
  name: string;
  weightGrams: number;
  bakersPercentage: number;
  isFlour: boolean;
}

export interface CalculatedRecipe {
  totalFlour: number;
  loaves: number;
  totalWater: number;
  totalSalt: number;
  starterFlour: number;
  starterWater: number;
  totalStarter: number;
  mainFlour: number;
  mainWater: number;
  totalDoughWeight: number;
  totalDoughPercentage: number;
  flourBreakdown: {
    name: string;
    weightGrams: number;
    bakersPercentage: number;
  }[];
  ingredientRows: BakerIngredientRow[];
}

export function calculateRecipe({
  totalFlour,
  loaves = 1,
  hydration,
  saltPct,
  starterPct,
  starterHydration = 100,
  flourBlend = [],
}: {
  totalFlour: number;
  loaves: number;
  hydration: number;
  saltPct: number;
  starterPct: number;
  starterHydration?: number;
  flourBlend: FlourBlendItem[];
}): CalculatedRecipe {
  const tf = Math.max(0, Number(totalFlour) || 0);
  const n = Math.max(1, Number(loaves) || 1);
  const hyd = Math.max(0, Number(hydration) || 0);
  const sp = Math.max(0, Number(saltPct) || 0);
  const stPct = Math.max(0, Number(starterPct) || 0);
  const stHyd = Math.max(1, Number(starterHydration) || 100);

  // Total recipe quantities per loaf
  const totalWater = Math.round((tf * hyd) / 100);
  const totalSalt = Math.round((tf * sp) / 100 * 10) / 10;

  // Starter breakdown
  // Total Starter = tf * (stPct / 100)
  // Starter flour = totalStarter / (1 + stHyd/100)
  const totalStarter = Math.round((tf * stPct) / 100);
  const starterFlour = Math.round(totalStarter / (1 + stHyd / 100));
  const starterWater = totalStarter - starterFlour;

  // Main Dough ingredients
  const mainFlour = Math.max(0, tf - starterFlour);
  const mainWater = Math.max(0, totalWater - starterWater);

  // Flour blend itemization (summing across main flour)
  const totalBlendPct = flourBlend.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0) || 100;
  const flourBreakdown = flourBlend.map((item) => {
    const itemPct = (Number(item.percentage) || 0) / totalBlendPct;
    const weightGrams = Math.round(mainFlour * itemPct);
    const bakersPercentage = tf > 0 ? Math.round((weightGrams / tf) * 1000) / 10 : 0;
    return {
      name: `${item.name} (${item.percentage}%)`,
      weightGrams: weightGrams * n,
      bakersPercentage,
    };
  });

  const ingredientRows: BakerIngredientRow[] = [];

  // Add individual flour rows
  if (flourBreakdown.length > 0) {
    flourBreakdown.forEach((flour) => {
      ingredientRows.push({
        name: flour.name,
        weightGrams: flour.weightGrams,
        bakersPercentage: flour.bakersPercentage,
        isFlour: true,
      });
    });
  } else {
    ingredientRows.push({
      name: 'Main Flour',
      weightGrams: mainFlour * n,
      bakersPercentage: tf > 0 ? Math.round((mainFlour / tf) * 1000) / 10 : 0,
      isFlour: true,
    });
  }

  // Add starter flour
  ingredientRows.push({
    name: 'Starter Flour',
    weightGrams: starterFlour * n,
    bakersPercentage: tf > 0 ? Math.round((starterFlour / tf) * 1000) / 10 : 0,
    isFlour: true,
  });

  // Add main water
  ingredientRows.push({
    name: 'Main Water',
    weightGrams: mainWater * n,
    bakersPercentage: tf > 0 ? Math.round((mainWater / tf) * 1000) / 10 : 0,
    isFlour: false,
  });

  // Add starter water
  ingredientRows.push({
    name: 'Starter Water',
    weightGrams: starterWater * n,
    bakersPercentage: tf > 0 ? Math.round((starterWater / tf) * 1000) / 10 : 0,
    isFlour: false,
  });

  // Add salt
  ingredientRows.push({
    name: 'Salt',
    weightGrams: Math.round(totalSalt * n * 10) / 10,
    bakersPercentage: sp,
    isFlour: false,
  });

  const singleLoafDoughWeight = tf + totalWater + totalSalt;
  const totalDoughWeight = Math.round(singleLoafDoughWeight * n);
  const totalDoughPercentage = tf > 0 ? Math.round((singleLoafDoughWeight / tf) * 1000) / 10 : 0;

  return {
    totalFlour: tf * n,
    loaves: n,
    totalWater: totalWater * n,
    totalSalt: totalSalt * n,
    starterFlour: starterFlour * n,
    starterWater: starterWater * n,
    totalStarter: totalStarter * n,
    mainFlour: mainFlour * n,
    mainWater: mainWater * n,
    totalDoughWeight,
    totalDoughPercentage,
    flourBreakdown,
    ingredientRows,
  };
}

export function calculateLevain({
  targetWeight,
  ratioSeed = 1,
  ratioFlour = 2,
  ratioWater = 2,
}: {
  targetWeight: number;
  ratioSeed: number;
  ratioFlour: number;
  ratioWater: number;
}) {
  const target = Math.max(0, Number(targetWeight) || 0);
  const totalParts = (Number(ratioSeed) || 1) + (Number(ratioFlour) || 1) + (Number(ratioWater) || 1);
  const part = totalParts > 0 ? target / totalParts : 0;

  const seed = Math.round(part * ratioSeed);
  const flour = Math.round(part * ratioFlour);
  const water = Math.round(part * ratioWater);
  const actualTotal = seed + flour + water;

  return {
    seedGrams: seed,
    flourGrams: flour,
    waterGrams: water,
    totalBuildGrams: actualTotal,
  };
}
