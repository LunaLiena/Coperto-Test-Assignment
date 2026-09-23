// jsdom не во всех версиях реализует crypto.randomUUID — он используется
// в ui-store.ts для id тостов. Полифилл нужен только в тестовой среде.
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — минимальный полифилл только для тестовой среды
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () =>
    `test-${Math.random().toString(36).slice(2)}` as `${string}-${string}-${string}-${string}-${string}`;
}
