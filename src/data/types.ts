export interface Champion {
  id: string; // "MonkeyKing"
  name: string; // "Wukong"
  title: string; // "the Monkey King"
  blurb: string; // short lore text
  tags: string[]; // ["Fighter", "Tank"]
  hp: number; // base HP at level 1
  moveSpeed: number;
  attackRange: number;
  image: string; // file name on Data Dragon, e.g. "MonkeyKing.png"
}

export interface Item {
  id: string; // "3031"
  name: string; // "Infinity Edge"
  total: number; // total gold cost
  from: string[]; // component item ids
  image: string;
}

export interface GameData {
  version: string; // patch, e.g. "15.20.1"
  source: 'pinned' | 'live';
  champions: Champion[];
  items: Item[];
  itemsById: Map<string, Item>;
  championImg: (c: Champion) => string;
  itemImg: (i: Item) => string;
}
