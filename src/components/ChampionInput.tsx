import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Champion, GameData } from '../data/types';

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

interface Props {
  data: GameData;
  exclude?: Set<string>;
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (c: Champion) => void;
}

/** Text box with champion autocomplete. Enter picks the highlighted suggestion. */
export function ChampionInput({ data, exclude, disabled, placeholder, onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const pool = data.champions.filter((c) => !exclude?.has(c.id));
    const starts = pool.filter((c) => normalize(c.name).startsWith(q));
    const contains = pool.filter((c) => !normalize(c.name).startsWith(q) && normalize(c.name).includes(q));
    return [...starts, ...contains].slice(0, 6);
  }, [query, data, exclude]);

  function choose(c: Champion) {
    onSubmit(c);
    setQuery('');
    setActive(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && suggestions[active]) {
      e.preventDefault();
      choose(suggestions[active]);
    }
  }

  return (
    <div className="champ-input">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? 'Type a champion…'}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === active ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c)}
              >
                <img src={data.championImg(c)} alt="" loading="lazy" />
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
