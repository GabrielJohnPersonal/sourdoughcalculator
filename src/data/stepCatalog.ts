/**
 * The steps offered in the Log step dropdown.
 *
 * Only some steps are worth timing. An autolyse is a fixed rest you want counted
 * down; a coil fold is a thing you did at a moment in time, and starting a timer
 * for it just adds noise. `defaultMins` is a starting point, not a rule — the
 * field stays editable whenever it appears.
 */
export interface StepPreset {
  id: string;
  name: string;
  /** When absent, the step is a bare timestamped note and no timer field shows. */
  defaultMins?: number;
}

export const STEP_PRESETS: StepPreset[] = [
  { id: 'autolyse', name: 'Autolyse', defaultMins: 60 },
  { id: 'mix', name: 'Add starter / Mix' },
  { id: 'salt', name: 'Add salt' },
  { id: 'stretch-fold', name: 'Stretch & fold', defaultMins: 30 },
  { id: 'coil-fold', name: 'Coil fold' },
  { id: 'preshape', name: 'Pre-shape' },
  { id: 'bench-rest', name: 'Bench rest', defaultMins: 25 },
  { id: 'shape', name: 'Shape' },
  { id: 'cold-retard', name: 'Cold retard', defaultMins: 720 },
  { id: 'preheat', name: 'Preheat oven', defaultMins: 45 },
  { id: 'bake-lid-on', name: 'Bake — lid on', defaultMins: 20 },
  { id: 'bake-lid-off', name: 'Bake — lid off', defaultMins: 20 },
];

/** Sentinel for the free-text option at the bottom of the dropdown. */
export const CUSTOM_STEP_ID = 'custom';
