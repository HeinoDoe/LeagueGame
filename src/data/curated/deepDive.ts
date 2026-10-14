// Free-text questions for "Deep Dive" — pro play, Worlds and game trivia.
// (The champion questions come automatically from the Rift Connections groups.)
//
// Each answer sits in a rarity tier: common answers score 1, deep cuts 4.
// The tiers are our best guess until real players' answers can be counted.
// Write extra accepted spellings after a "|": 'T1|SKT|SK Telecom T1'.
// Matching ignores case, spaces and punctuation, and forgives one typo in
// longer answers.
//
// ⚠️ Facts change: keep the year ranges in the questions up to date
// (e.g. add the next Worlds finalists after each Worlds).

export type Tier = 'common' | 'uncommon' | 'rare' | 'deep';

export interface TextQuestion {
  id: string;
  ask: string;
  answers: Partial<Record<Tier, string[]>>;
}

export const DEEP_DIVE_QUESTIONS: TextQuestion[] = [
  {
    id: 'worlds-finalists',
    ask: 'Name a team that reached a Worlds final (2011–2025)',
    answers: {
      common: ['T1|SKT|SK Telecom T1|SKT T1|SK Telecom', 'Fnatic|FNC', 'G2 Esports|G2'],
      uncommon: [
        'Invictus Gaming|IG',
        'DAMWON Gaming|Damwon|DWG|DWG KIA|Dplus KIA|DK',
        'EDward Gaming|EDG',
        'DRX|DragonX',
        'Samsung Galaxy|SSG',
        'FunPlus Phoenix|FPX',
        'Bilibili Gaming|BLG',
        'Weibo Gaming|WBG',
        'KT Rolster|KT',
      ],
      rare: ['Royal Club|Star Horn Royal Club|SHRC', 'Samsung White|SSW', 'Suning|SN|Suning Gaming', 'Taipei Assassins|TPA', 'KOO Tigers|KOO'],
      deep: ['Azubu Frost|Frost', 'against All authority|aAa'],
    },
  },
  {
    id: 'msi-winners',
    ask: 'Name a team that won MSI (2015–2025)',
    answers: {
      common: ['T1|SKT|SK Telecom T1|SKT T1', 'G2 Esports|G2', 'Royal Never Give Up|RNG'],
      uncommon: ['Gen.G|GenG|GEN', 'JD Gaming|JDG'],
      rare: ['EDward Gaming|EDG'],
    },
  },
  {
    id: 'worlds-hosts',
    ask: 'Name a country or region that has hosted Worlds matches (2011–2025)',
    answers: {
      common: ['South Korea|Korea|KR', 'China|CN', 'United States|USA|US|America|United States of America'],
      uncommon: ['Germany', 'France', 'United Kingdom|UK|England|Great Britain|Britain'],
      rare: ['Iceland', 'Spain', 'Belgium'],
      deep: ['Sweden', 'Mexico', 'Taiwan', 'Singapore'],
    },
  },
  {
    id: 'pro-leagues',
    ask: 'Name a professional LoL league, past or present (short name is fine)',
    answers: {
      common: [
        'LCK|League of Legends Champions Korea|Champions Korea',
        'LPL|League of Legends Pro League|Tencent LoL Pro League',
        'LEC|League of Legends EMEA Championship|European Championship',
        'LCS|League Championship Series|League of Legends Championship Series',
      ],
      uncommon: [
        'CBLOL|Campeonato Brasileiro',
        'PCS|Pacific Championship Series',
        'VCS|Vietnam Championship Series',
        'LJL|League of Legends Japan League',
        'LTA|League of the Americas',
      ],
      rare: ['LCP|League of Legends Championship Pacific', 'LLA|Liga Latinoamérica', 'TCL|Turkish Championship League', 'LMS', 'EU LCS', 'NA LCS', 'LFL|La Ligue Française', 'Prime League|PRM', 'Superliga|LVP Superliga'],
      deep: ['OPL|Oceanic Pro League', 'LCO|League of Legends Circuit Oceania', 'LCL|Continental League', 'GPL|Garena Premier League', 'LDL', 'NLC|Northern League of Legends Championship'],
    },
  },
  {
    id: 'worlds-anthems',
    ask: 'Name an official Worlds anthem (2014–2024)',
    answers: {
      common: ['Legends Never Die', 'RISE', 'Warriors', 'GODS', 'STAR WALKIN|Star Walking'],
      uncommon: ['Phoenix', 'Ignite', 'Burn It All Down', 'Heavy Is the Crown', 'Take Over'],
      rare: ['Worlds Collide'],
    },
  },
  {
    id: 'game-modes',
    ask: 'Name a League of Legends game mode, past or present',
    answers: {
      common: ['ARAM|All Random All Mid', 'URF|Ultra Rapid Fire|ARURF|All Random URF', 'Arena', 'One for All|OFA'],
      uncommon: [
        'Nexus Blitz',
        'Ultimate Spellbook|Spellbook',
        'Swarm|Operation Anima',
        'Dominion|Crystal Scar',
        'Twisted Treeline',
        'Clash',
        'Teamfight Tactics|TFT',
      ],
      rare: [
        'Doom Bots|Doom Bots of Doom',
        'Odyssey|Odyssey Extraction',
        'Star Guardian Invasion|Invasion',
        'Hexakill',
        'Ascension',
        'Black Market Brawlers',
        'Brawl',
        'Snowdown Showdown|Showdown',
      ],
      deep: ['Legend of the Poro King|Poro King', 'Nemesis Draft', 'Hunt of the Blood Moon|Blood Moon', 'Definitely Not Dominion'],
    },
  },
  {
    id: 'summoner-spells',
    ask: 'Name a summoner spell, past or present',
    answers: {
      common: ['Flash', 'Ignite', 'Teleport|TP', 'Smite'],
      uncommon: ['Heal', 'Exhaust', 'Barrier', 'Ghost', 'Cleanse'],
      rare: ['Mark|Dash|Snowball|Mark Dash', 'Clarity'],
      deep: ['Clairvoyance', 'Revive', 'Promote', 'Garrison', 'Fortify', 'Rally', 'Surge'],
    },
  },
];
