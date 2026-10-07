/**
 * Typed helpers for the unit tests. A bare `jest.fn()` gives `any` for its
 * calls and for `expect.objectContaining(...)`, which the lint rules refuse
 * to let flow into typed code.
 */

/** Argument `arg` of call number `call` of a mock, typed by the caller. */
export function callArg<T>(fn: jest.Mock, call: number, arg: number): T {
  return (fn.mock.calls as unknown[][])[call][arg] as T;
}

/** `expect.objectContaining(...)` usable inside a typed object literal. */
export function containing(
  expected: Record<string, unknown>,
): Record<string, unknown> {
  return expect.objectContaining(expected) as Record<string, unknown>;
}
