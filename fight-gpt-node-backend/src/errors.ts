export class GeminiCreditExhaustedError extends Error {
  readonly isQuotaError = true;
  readonly spentUsd: number;
  readonly budgetUsd: number;

  constructor(spentUsd: number, budgetUsd: number) {
    super(`Monthly Gemini budget exhausted ($${spentUsd.toFixed(2)} / $${budgetUsd.toFixed(2)})`);
    this.name = 'GeminiCreditExhaustedError';
    this.spentUsd = spentUsd;
    this.budgetUsd = budgetUsd;
  }
}
