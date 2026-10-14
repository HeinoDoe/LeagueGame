import type { ReactNode } from 'react';
import type { HoleDef } from '../games/types';

interface Props {
  hole: HoleDef;
  number?: number;
  children: ReactNode;
}

/** The header + frame around every hole. */
export function HoleShell({ hole, number, children }: Props) {
  return (
    <section className="hole">
      <header className="hole-header">
        <div className="flag">
          <span className="flag-num">{number ?? '•'}</span>
        </div>
        <div className="hole-titles">
          <span className="eyebrow">
            {number ? `Hole ${number} · ` : ''}Par {hole.par}
          </span>
          <h2>{hole.name}</h2>
          <p className="muted">{hole.howTo}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
