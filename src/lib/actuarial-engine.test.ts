import { describe, it, expect } from 'vitest';
import { PERIODICITY, primeForPeriodicity, simulatePrime } from './actuarial-engine';

describe('Périodicité — Note Technique SONAM VIE 26/05/2026', () => {
  it('coefficients de périodicité conformes', () => {
    expect(PERIODICITY.annuel.coef).toBe(1);
    expect(PERIODICITY.semestriel.coef).toBe(0.51);
    expect(PERIODICITY.trimestriel.coef).toBe(0.26);
    // Bug historique : 0.087 → doit être 0.09
    expect(PERIODICITY.mensuel.coef).toBe(0.09);
  });

  it('accessoires par périodicité', () => {
    expect(PERIODICITY.annuel.enc).toBe(2500);
    expect(PERIODICITY.semestriel.enc).toBe(1500);
    expect(PERIODICITY.trimestriel.enc).toBe(1000);
    expect(PERIODICITY.mensuel.enc).toBe(500);
  });

  it('primeForPeriodicity(PAC=100000 + accessoire) donne les 4 formules officielles', () => {
    // primeAnnuelle envoyée à la fonction = PC + ENC_A ; on simule PC=100000 → input 102500
    const input = 100000 + 2500;
    expect(primeForPeriodicity(input, 'annuel')).toBe(100000 + 2500);            // PAC' = PAC + 2500
    expect(primeForPeriodicity(input, 'semestriel')).toBe(Math.round(100000 * 0.51 + 1500));  // PSC
    expect(primeForPeriodicity(input, 'trimestriel')).toBe(Math.round(100000 * 0.26 + 1000)); // PTC
    expect(primeForPeriodicity(input, 'mensuel')).toBe(Math.round(100000 * 0.09 + 500));      // PMC
  });
});

describe('Moteur de simulation — non-régression', () => {
  it('renvoie une prime > 0 pour un principal 42 ans, formule A', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 42, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10);
    const res = simulatePrime({
      quoteDate: today.toISOString().slice(0, 10),
      option: 'A',
      principal: { dob },
      enfants: [],
      ascendants: [],
    });
    expect(res.primeAnnuelle).toBeGreaterThan(0);
    expect(res.persons[0].eligible).toBe(true);
    expect(res.persons[0].age).toBe(42);
  });

  it('rejette un principal de 70 ans (> 64)', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate())
      .toISOString().slice(0, 10);
    const res = simulatePrime({
      quoteDate: today.toISOString().slice(0, 10),
      option: 'B',
      principal: { dob },
      enfants: [],
      ascendants: [],
    });
    expect(res.persons[0].eligible).toBe(false);
    expect(res.eligibilityErrors.length).toBeGreaterThan(0);
  });
});
