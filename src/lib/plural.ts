/**
 * Русские окончания при числительных.
 *
 * forms — три формы: [1 урок, 2 урока, 5 уроков].
 */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** «3 урока» */
export function lessonsLabel(n: number): string {
  return `${n} ${plural(n, ['урок', 'урока', 'уроков'])}`;
}
