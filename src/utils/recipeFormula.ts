import { FlourBlendItem } from '../types';

/**
 * The one place bakers' maths lives.
 *
 * The size preset (300/400/500g) is the dry bread flour you physically weigh out.
 * Starter goes in *on top* of it — it is never carved out of the flour total.
 * Percentages are measured against the true flour in the dough, which includes the
 * flour hiding inside the starter, so a stated 75% hydration really is 75%.
 *
 * Both the recipe builder and the saved-recipe panel on an active bake call this,
 * so the numbers you weighed out are the numbers you see later.
 */

export interface FormulaInput {
  /** Flour per loaf, from the size preset or the custom field. */
  totalFlour: number;
  loaves: number;
  hydration: number;
  saltPct: number;
  /** Absolute grams — starter is not scaled by loaf count. */
  starterFlour: number;
  starterWater: number;
  flourBlend: FlourBlendItem[];
}

export interface FormulaRow {
  id: string;
  name: string;
  blendPct: number;
  weightGrams: number;
}

export interface Formula {
  /** Dry bread flour to add, across all loaves. */
  baseFlour: number;
  /** Bread flour + the flour inside the starter — the percentage denominator. */
  trueTotalFlour: number;
  starterTotal: number;
  /** Water to pour, i.e. total water less what the starter already contributes. */
  waterToAdd: number;
  saltGrams: number;
  totalDoughWeight: number;
  /** One row per flour in the blend, split by its share of the blend. */
  flourRows: FormulaRow[];
}

export function computeFormula({
  totalFlour,
  loaves,
  hydration,
  saltPct,
  starterFlour,
  starterWater,
  flourBlend,
}: FormulaInput): Formula {
  const baseFlour = totalFlour * loaves;
  const starterTotal = starterFlour + starterWater;
  const trueTotalFlour = baseFlour + starterFlour;

  const totalWater = Math.round((trueTotalFlour * hydration) / 100);
  const saltGrams = Math.round((trueTotalFlour * saltPct) / 100 * 10) / 10;
  const waterToAdd = Math.max(0, totalWater - starterWater);

  const totalBlendPct =
    flourBlend.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0) || 100;

  const flourRows = flourBlend.map((item) => ({
    id: item.id,
    name: item.name,
    blendPct: item.percentage,
    weightGrams: Math.round(baseFlour * ((Number(item.percentage) || 0) / totalBlendPct)),
  }));

  return {
    baseFlour,
    trueTotalFlour,
    starterTotal,
    waterToAdd,
    saltGrams,
    totalDoughWeight: baseFlour + starterTotal + waterToAdd + saltGrams,
    flourRows,
  };
}
