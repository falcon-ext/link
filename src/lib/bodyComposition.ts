export type Sex = 'M' | 'F';
export type Protocol = 'pollock3' | 'pollock7' | 'guedes';

export type SFKey =
  | 'sfPeitoral'
  | 'sfAxilarMedia'
  | 'sfTriceps'
  | 'sfSubescapular'
  | 'sfAbdominal'
  | 'sfSuprailiaca'
  | 'sfCoxa';

export type ProtocolField = { key: SFKey; label: string };

export const PROTOCOL_FIELDS: Record<Protocol, Record<Sex, ProtocolField[]>> = {
  pollock3: {
    M: [
      { key: 'sfPeitoral',    label: 'Peitoral' },
      { key: 'sfAbdominal',   label: 'Abdominal' },
      { key: 'sfCoxa',        label: 'Coxa' },
    ],
    F: [
      { key: 'sfTriceps',     label: 'Tríceps' },
      { key: 'sfSuprailiaca', label: 'Suprailíaca' },
      { key: 'sfCoxa',        label: 'Coxa' },
    ],
  },
  pollock7: {
    M: [
      { key: 'sfPeitoral',     label: 'Peitoral' },
      { key: 'sfAxilarMedia',  label: 'Axilar média' },
      { key: 'sfTriceps',      label: 'Tríceps' },
      { key: 'sfSubescapular', label: 'Subescapular' },
      { key: 'sfAbdominal',    label: 'Abdominal' },
      { key: 'sfSuprailiaca',  label: 'Suprailíaca' },
      { key: 'sfCoxa',         label: 'Coxa' },
    ],
    F: [
      { key: 'sfPeitoral',     label: 'Peitoral' },
      { key: 'sfAxilarMedia',  label: 'Axilar média' },
      { key: 'sfTriceps',      label: 'Tríceps' },
      { key: 'sfSubescapular', label: 'Subescapular' },
      { key: 'sfAbdominal',    label: 'Abdominal' },
      { key: 'sfSuprailiaca',  label: 'Suprailíaca' },
      { key: 'sfCoxa',         label: 'Coxa' },
    ],
  },
  guedes: {
    M: [
      { key: 'sfTriceps',     label: 'Tríceps' },
      { key: 'sfAbdominal',   label: 'Abdominal' },
      { key: 'sfSuprailiaca', label: 'Suprailíaca' },
    ],
    F: [
      { key: 'sfTriceps',     label: 'Tríceps' },
      { key: 'sfSuprailiaca', label: 'Suprailíaca' },
      { key: 'sfCoxa',        label: 'Coxa' },
    ],
  },
};

export const PROTOCOL_LABELS: Record<Protocol, string> = {
  pollock3: 'Pollock 3',
  pollock7: 'Pollock 7',
  guedes:   'Guedes',
};

export type BodyComp = {
  fatPct:      number;
  musclePct:   number;
  residualPct: number;
  fatKg?:      number;
  leanKg?:     number;
};

// Drinkwater-Ross residual mass constants
const RESIDUAL_PCT: Record<Sex, number> = { M: 24.1, F: 20.9 };

function siri(density: number): number {
  return Math.max(1, Math.min(60, (495 / density) - 450));
}

function build(sex: Sex, fatPct: number, weightKg?: number): BodyComp {
  const residualPct = RESIDUAL_PCT[sex];
  const musclePct   = Math.max(0, 100 - fatPct - residualPct);
  const r: BodyComp = {
    fatPct:      +fatPct.toFixed(1),
    musclePct:   +musclePct.toFixed(1),
    residualPct,
  };
  if (weightKg) {
    r.fatKg  = +(weightKg * fatPct / 100).toFixed(1);
    r.leanKg = +(weightKg * (100 - fatPct) / 100).toFixed(1);
  }
  return r;
}

// Pollock 3 dobras — homens: peitoral+abdominal+coxa / mulheres: tríceps+suprailíaca+coxa
export function calcPollock3(
  sex: Sex, age: number, sf1: number, sf2: number, sf3: number, weightKg?: number
): BodyComp | null {
  const s = sf1 + sf2 + sf3;
  if (s <= 0 || age <= 0) return null;
  const density = sex === 'M'
    ? 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * age
    : 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * age;
  return build(sex, siri(density), weightKg);
}

// Pollock 7 dobras — peitoral, axilar média, tríceps, subescapular, abdominal, suprailíaca, coxa
export function calcPollock7(
  sex: Sex, age: number, sfs: number[], weightKg?: number
): BodyComp | null {
  const s = sfs.reduce((a, b) => a + b, 0);
  if (s <= 0 || age <= 0) return null;
  const density = sex === 'M'
    ? 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * age
    : 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * age;
  return build(sex, siri(density), weightKg);
}

// Guedes 3 dobras (sem idade) — homens: tríceps+abdominal+suprailíaca / mulheres: tríceps+suprailíaca+coxa
export function calcGuedes(
  sex: Sex, sf1: number, sf2: number, sf3: number, weightKg?: number
): BodyComp | null {
  const s = sf1 + sf2 + sf3;
  if (s <= 0) return null;
  const density = sex === 'M'
    ? 1.17136 - 0.06706 * Math.log10(s)
    : 1.16650 - 0.07063 * Math.log10(s);
  return build(sex, siri(density), weightKg);
}

export function calcRCQ(waistCm: number, hipCm: number): number {
  return +(waistCm / hipCm).toFixed(2);
}

export function calcICE(waistCm: number, heightCm: number): number {
  return +(waistCm / heightCm).toFixed(2);
}

export function rcqRisk(rcq: number, sex: Sex): string {
  if (sex === 'M') {
    if (rcq < 0.90) return 'Baixo';
    if (rcq < 0.95) return 'Moderado';
    if (rcq < 1.00) return 'Alto';
    return 'Muito alto';
  }
  if (rcq < 0.80) return 'Baixo';
  if (rcq < 0.85) return 'Moderado';
  if (rcq < 0.90) return 'Alto';
  return 'Muito alto';
}

export function iceRisk(ice: number): string {
  if (ice < 0.50) return 'Ideal';
  if (ice < 0.60) return 'Atenção';
  return 'Alto risco';
}

// Compute body composition from a saved assessment's skinfold fields
export function computeFromAssessment(a: {
  sex?: string | null;
  age_years?: number | null;
  skinfold_protocol?: string | null;
  sf_peitoral?: number | null;
  sf_axilar_media?: number | null;
  sf_triceps?: number | null;
  sf_subescapular?: number | null;
  sf_abdominal?: number | null;
  sf_suprailiaca?: number | null;
  sf_coxa?: number | null;
  weight_kg?: number | null;
}): BodyComp | null {
  const sex      = a.sex as Sex | null;
  const protocol = a.skinfold_protocol as Protocol | null;
  const w        = a.weight_kg ?? undefined;

  if (!sex || !protocol) return null;

  if (protocol === 'pollock3') {
    const age = a.age_years;
    if (!age) return null;
    if (sex === 'M') {
      const [s1, s2, s3] = [a.sf_peitoral, a.sf_abdominal, a.sf_coxa];
      if (!s1 || !s2 || !s3) return null;
      return calcPollock3(sex, age, s1, s2, s3, w);
    }
    const [s1, s2, s3] = [a.sf_triceps, a.sf_suprailiaca, a.sf_coxa];
    if (!s1 || !s2 || !s3) return null;
    return calcPollock3(sex, age, s1, s2, s3, w);
  }

  if (protocol === 'pollock7') {
    const age = a.age_years;
    if (!age) return null;
    const sfs = [a.sf_peitoral, a.sf_axilar_media, a.sf_triceps, a.sf_subescapular, a.sf_abdominal, a.sf_suprailiaca, a.sf_coxa];
    if (sfs.some(v => !v)) return null;
    return calcPollock7(sex, age, sfs as number[], w);
  }

  if (protocol === 'guedes') {
    if (sex === 'M') {
      const [s1, s2, s3] = [a.sf_triceps, a.sf_abdominal, a.sf_suprailiaca];
      if (!s1 || !s2 || !s3) return null;
      return calcGuedes(sex, s1, s2, s3, w);
    }
    const [s1, s2, s3] = [a.sf_triceps, a.sf_suprailiaca, a.sf_coxa];
    if (!s1 || !s2 || !s3) return null;
    return calcGuedes(sex, s1, s2, s3, w);
  }

  return null;
}

export function sfSigma(a: {
  skinfold_protocol?: string | null;
  sex?: string | null;
  sf_peitoral?: number | null;
  sf_axilar_media?: number | null;
  sf_triceps?: number | null;
  sf_subescapular?: number | null;
  sf_abdominal?: number | null;
  sf_suprailiaca?: number | null;
  sf_coxa?: number | null;
}): number | null {
  const sex      = a.sex as Sex | null;
  const protocol = a.skinfold_protocol as Protocol | null;
  if (!sex || !protocol) return null;
  const fields = PROTOCOL_FIELDS[protocol]?.[sex];
  if (!fields) return null;
  const keyMap: Record<SFKey, number | null | undefined> = {
    sfPeitoral:     a.sf_peitoral,
    sfAxilarMedia:  a.sf_axilar_media,
    sfTriceps:      a.sf_triceps,
    sfSubescapular: a.sf_subescapular,
    sfAbdominal:    a.sf_abdominal,
    sfSuprailiaca:  a.sf_suprailiaca,
    sfCoxa:         a.sf_coxa,
  };
  const vals = fields.map(f => keyMap[f.key] ?? 0);
  if (vals.some(v => v <= 0)) return null;
  return +vals.reduce((a, b) => a + b, 0).toFixed(1);
}
