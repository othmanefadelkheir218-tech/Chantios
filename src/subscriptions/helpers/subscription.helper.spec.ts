import { computeOverageAmount } from './subscription.helper';

describe('computeOverageAmount', () => {
  it('bills the units over the allowance (7 workers, 5 included, 2.00 each)', () => {
    expect(computeOverageAmount(7, 5, '2.00').toFixed(2)).toBe('4.00');
  });

  it('is zero at or under the allowance', () => {
    expect(computeOverageAmount(5, 5, '2.00').toFixed(2)).toBe('0.00');
    expect(computeOverageAmount(3, 5, '2.00').toFixed(2)).toBe('0.00');
  });

  it('handles decimal usage such as storage', () => {
    expect(computeOverageAmount(21.5, 20, '0.50').toFixed(2)).toBe('0.75');
  });
});
