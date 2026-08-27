# Sourdough Calculator: Design System & Brand Kit

*Warm, tactile, papery. A recipe card that has lived in a kitchen.*

---

## 1. Brand Identity & Voice

* **Positioning**: A baking companion that feels handled, not installed. Precise where it counts, warm everywhere else.
* **Voice**: Plain, instructive, unhurried. Short sentences. Imperative when guiding (*"Weigh the levain, set your loaf, then start the clock."*).
* **Strict Rule**: **Zero Emojis** anywhere in the product. Use Lucide icons only.
* **Capitalization**: Sentence case for all buttons and labels (*"Start timer"*, not *"START TIMER"*).

---

## 2. Color Palette & Semantic Tokens

### 2.1. Color Tokens Map

```typescript
export const colors = {
  // Canvas & Surfaces
  paper: '#efe8db',      // App background canvas
  card: '#fffdf7',       // Default card surface, tab bar
  linen: '#f7efe0',      // Emphasised card surface (formula tables)
  oat: '#fbf7ee',        // Input field backgrounds
  
  // Typography & Inks
  ink: '#33302a',        // Primary text, primary button background
  muted: '#8a7d68',      // Body copy, secondary text
  faint: '#a89a80',      // Labels, units, percentages, timestamps
  disabled: '#b0a48c',   // Inactive tabs, disabled buttons
  onDark: '#fbf2e9',     // High-contrast text on Ink or Terracotta
  
  // Accents & Semantics
  terracotta: '#b45c3f', // Single brand accent (active tabs, totals bar, icons)
  olive: '#6f7048',      // DERIVED/CALCULATED VALUES ONLY (never user inputs)
  warning: '#c98a3c',    // Warm amber warning
  danger: '#a2472c',     // Deep terracotta destructive state
  
  // Borders & Structural Lines
  border: {
    card: '#e7dcc6',     // Card outer borders
    field: '#e2d6bf',    // Input borders, dashed divider rules
    leader: '#cdbfa2',   // Dotted leaders between label and value
  },
};
```

### 2.2. Critical Palette Rules
1. **One Accent**: `terracotta` (`#b45c3f`) is the only primary accent. Used for active tabs, eyebrows, key icons, and the totals bar.
2. **Olive Means Computed**: `olive` (`#6f7048`) is reserved strictly for values calculated by the app (hydration %, dough weight, timer countdowns). **Never apply to text or numbers a user typed.**
3. **No Pure Black or White**: Ink is warm dark brown; Card is warm off-white.

---

## 3. Typography System

### 3.1. Font Stack

| Family | Role | Tailwind Class | Google Font |
| :--- | :--- | :--- | :--- |
| **Spectral** (Serif) | Headings, screen titles, ingredient names, italic eyebrows | `font-serif` | `Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500` |
| **Hanken Grotesk** (Sans) | Labels, numerical inputs, buttons, UI controls | `font-sans` | `Hanken+Grotesk:wght@400;500;600;700;800` |
| **Space Mono** (Monospace) | Baker's percentages (`%`), technical columns, IDs | `font-mono` | `Space+Mono:wght@400;700` |

### 3.2. Typography Rules
* **Serif names the thing, sans measures it**: *"Main flour"* in `font-serif`, *"450 g"* in `font-sans`.
* **Units Suffix**: Units (`g`, `%`, `°C`, `hrs`) must be rendered as a separate span in faint sans (`text-faint text-xs ml-1`).
* **Eyebrows**: Centered, italic Spectral, uppercase, tracked (`tracking-[0.22em] text-terracotta text-xs italic font-serif`).

---

## 4. Spacing, Radius & Elevation

### 4.1. Radii & Shadows
```javascript
export const shape = {
  radius: {
    card: '20px',
    field: '11px',
    btn: '16px',
    chip: '100px',
  },
  shadow: {
    card: '0 1px 0 rgba(255,255,255,.8) inset, 0 8px 20px -14px rgba(80,60,30,.6)',
    btnInk: '0 10px 22px -10px rgba(51,48,42,.7)',
    btnTerracotta: '0 10px 22px -10px rgba(180,92,63,.8)',
  },
};
```

### 4.2. Canvas Texture (Paper Grain)
The body/canvas features a subtle warm tactile paper grain:
```css
.paper-canvas {
  background-color: #efe8db;
  background-image: radial-gradient(#33302a 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  background-opacity: 0.03;
}
```

---

## 5. Standard Component Specifications

### 5.1. Card (`<Card>`)
* Surface: `bg-card` (`#fffdf7`), `border border-border-card` (`#e7dcc6`), `rounded-[20px]`, `p-[17px]`.
* Header: Lucide Icon (`w-[15px] h-[15px] text-terracotta`) + Uppercase Label (`text-muted text-[11px] font-semibold tracking-wider font-sans`).

### 5.2. Input Field (`<InputField>`)
* Label: Micro label above (`text-faint text-[10px] uppercase font-semibold font-sans mb-1`).
* Field: `bg-oat` (`#fbf7ee`), `border border-border-field` (`#e2d6bf`), `rounded-[11px]`, `px-3 py-2`.
* Value: `text-ink text-[17px] font-bold font-sans`.
* Focus State: `focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 outline-none`.

### 5.3. Formula Row (`<FormulaRow>`)
* Layout: 
  - Ingredient Name (`font-serif font-medium text-[15px] text-ink`).
  - Dotted Leader (`border-b border-dotted border-border-leader flex-grow mx-2 mb-1`).
  - Weight Value (`font-sans font-bold text-[15px] text-ink`).
  - Unit (`text-faint text-xs font-sans ml-0.5`).
  - Baker's % (`font-mono text-[12px] text-muted w-10 text-right`).

### 5.4. Totals Bar (`<TotalsBar>`)
* One per recipe screen. Bleeds edge-to-edge inside the card.
* Background: `bg-terracotta` (`#b45c3f`), `text-onDark` (`#fbf2e9`).
* Label: `font-serif italic text-[15px]`.
* Value: `font-sans font-extrabold text-[16px]`.
* Baker's %: `font-mono text-[13px] text-onDark/90`.

### 5.5. Buttons (`<Button>`)
* **Primary Button**: `bg-ink text-onDark rounded-[16px] py-3.5 px-5 font-sans font-semibold text-[15px] shadow-btnInk flex items-center justify-center gap-2`.
* **Accent Button**: `bg-terracotta text-white rounded-[16px] py-3.5 px-5 font-sans font-semibold text-[15px] shadow-btnTerracotta flex items-center justify-center gap-2`.
* **Secondary Button**: `border-2 border-ink text-ink bg-transparent rounded-[16px] py-3 px-5 font-sans font-semibold`.
* **Icon Position**: Lucide icon sits **after** the label text with `gap-2`.

### 5.6. Bottom Tab Navigation Bar (`<BottomNav>`)
* Container: `bg-card border-t border-border-card fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-2 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex justify-around`.
* Active Tab: `text-terracotta font-semibold font-sans text-[11px] flex flex-col items-center gap-1`.
* Inactive Tab: `text-disabled font-medium font-sans text-[11px] flex flex-col items-center gap-1`.
* Icons: Lucide line icons (`w-5 h-5 stroke-[2]`).

---

## 6. Lucide Icon Registry

All icons must use `lucide-react` with `strokeWidth={2}`:
* ⏳ **Active Bakes**: `<Timer />`
* 📋 **Bake History**: `<ScrollText />` or `<BookOpen />`
* 🍞 **New Bake**: `<Scale />` or `<Flame />`
* 🫙 **Starter Diary**: `<Wheat />` or `<NotebookPen />`
* 💡 **Wake Lock**: `<Lightbulb />`
* ➕ **Actions / Add**: `<Plus />`
* 🌡️ **Temperature**: `<Thermometer />`
* ➡️ **Advance Step**: `<ArrowRight />`

---

## 7. Machine-Ready Tailwind Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#efe8db',
        card: '#fffdf7',
        linen: '#f7efe0',
        oat: '#fbf7ee',
        ink: '#33302a',
        muted: '#8a7d68',
        faint: '#a89a80',
        disabled: '#b0a48c',
        onDark: '#fbf2e9',
        terracotta: '#b45c3f',
        olive: '#6f7048',
        warning: '#c98a3c',
        danger: '#a2472c',
        border: {
          card: '#e7dcc6',
          field: '#e2d6bf',
          leader: '#cdbfa2',
        },
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['Hanken Grotesk', '-apple-system', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        field: '11px',
        btn: '16px',
        chip: '100px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.8) inset, 0 8px 20px -14px rgba(80,60,30,.6)',
        btnInk: '0 10px 22px -10px rgba(51,48,42,.7)',
        btnTerracotta: '0 10px 22px -10px rgba(180,92,63,.8)',
      },
    },
  },
  plugins: [],
};
```
