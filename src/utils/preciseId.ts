export function toPreciseId(id: number | string): string {
  const normalized = String(id).trim();

  if (!normalized) {
    throw new Error('ID 不能为空');
  }

  return normalized;
}
