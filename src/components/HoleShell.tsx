import type { ReactNode } from 'react';
import type { HoleDef } from '../games/types';

interface Props {
  hole: HoleDef;
  number?: number;
  children: ReactNode;
}

/** The header + frame around every game. */
export function HoleShell({ hole, number, children }: Props) {
  return (
    <section className="hole">
      <header className="hole-header">
        <div className="game-badge">
          <span>{number ?? '•'}</span>
        </div>
        <div className="hole-titles">
          {number && <span className="eyebrow">Game {number}</span>}
          <h2>{hole.name}</h2>
          <p className="muted">{hole.howTo}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
