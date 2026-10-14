// Prompts for the "Deep Dive" hole (Krillion-style: rarer answers score more).
//
// ⚠️ DRAFT — these lists and especially the rarity tiers are first guesses.
// You know the game: move champions between tiers, add missing ones, add prompts.
// Later, once you have players, you can replace tiers with REAL rarity
// (what % of players gave each answer).
//
// Names must match Riot's champion names exactly ("Nunu & Willump", "Lee Sin").

export type Tier = 'common' | 'uncommon' | 'rare' | 'deep';

export const TIER_POINTS: Record<Tier, number> = { common: 1, uncommon: 2, rare: 3, deep: 4 };
export const TIER_LABEL: Record<Tier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  deep: 'Deep cut',
};

export interface DeepDivePrompt {
  id: string;
  prompt: string;
  answers: Record<Tier, string[]>;
}

export const DEEP_DIVE_PROMPTS: DeepDivePrompt[] = [
  {
    id: 'noxus',
    prompt: 'Name a champion from Noxus',
    answers: {
      common: ['Darius', 'Draven', 'Katarina', 'Swain'],
      uncommon: ['Talon', 'Samira', 'Riven', 'Sion', 'LeBlanc', 'Cassiopeia'],
      rare: ['Kled', 'Vladimir', 'Mordekaiser', 'Rell', 'Briar', 'Ambessa'],
      deep: ['Elise', 'Mel'],
    },
  },
  {
    id: 'ionia',
    prompt: 'Name a champion from Ionia',
    answers: {
      common: ['Yasuo', 'Ahri', 'Zed', 'Lee Sin', 'Master Yi'],
      uncommon: ['Yone', 'Irelia', 'Akali', 'Shen', 'Jhin', 'Karma', 'Kennen', 'Xayah', 'Rakan'],
      rare: ['Syndra', 'Varus', 'Kayn', 'Sett', 'Wukong', 'Soraka', 'Lillia'],
      deep: ['Ivern', 'Hwei'],
    },
  },
  {
    id: 'freljord',
    prompt: 'Name a champion from the Freljord',
    answers: {
      common: ['Ashe', 'Braum', 'Tryndamere', 'Sejuani'],
      uncommon: ['Lissandra', 'Anivia', 'Volibear', 'Olaf', 'Trundle'],
      rare: ['Ornn', 'Udyr', 'Nunu & Willump', 'Gnar'],
      deep: ['Gragas', 'Aurora'],
    },
  },
  {
    id: 'yordles',
    prompt: 'Name a yordle',
    answers: {
      common: ['Teemo', 'Tristana', 'Lulu', 'Veigar'],
      uncommon: ['Poppy', 'Heimerdinger', 'Ziggs', 'Corki', 'Kennen'],
      rare: ['Rumble', 'Gnar', 'Fizz', 'Yuumi', 'Vex'],
      deep: ['Kled'],
    },
  },
  {
    id: 'shadow-isles',
    prompt: 'Name a champion tied to the Shadow Isles',
    answers: {
      common: ['Thresh', 'Viego', 'Hecarim'],
      uncommon: ['Kalista', 'Karthus', 'Yorick', 'Gwen'],
      rare: ['Maokai', 'Vex'],
      deep: ['Elise'],
    },
  },
];
