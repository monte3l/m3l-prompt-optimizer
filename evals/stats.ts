/**
 * One-sided 95% upper confidence limit for a rate of `k` events in `n` samples (the exact
 * binomial, or Clopper-Pearson, limit). A bar on this limit instead of on the raw count
 * keeps a run that got lucky from passing: 8 worse samples in 400 is 2.0%, but the rate
 * could plausibly be 3.6%.
 */
export const upperBound = (k: number, n: number, alpha = 0.05): number => {
  if (n <= 0) return 1
  if (k >= n) return 1

  const logFactorial = [0]
  for (let i = 1; i <= n; i += 1) logFactorial.push((logFactorial[i - 1] ?? 0) + Math.log(i))
  const logChoose = (i: number): number => (logFactorial[n] ?? 0) - (logFactorial[i] ?? 0) - (logFactorial[n - i] ?? 0)

  /** P(X <= k) for X ~ Binomial(n, p). */
  const cdf = (p: number): number => {
    let sum = 0
    for (let i = 0; i <= k; i += 1) sum += Math.exp(logChoose(i) + i * Math.log(p) + (n - i) * Math.log1p(-p))
    return sum
  }

  let low = k / n
  let high = 1
  for (let step = 0; step < 80; step += 1) {
    const mid = (low + high) / 2
    if (cdf(mid) > alpha) low = mid
    else high = mid
  }
  return high
}

/** P(X <= k) for X ~ Binomial(n, p), summed in log space so a few hundred trials stay exact enough. */
export const binomialCdf = (k: number, n: number, p = 0.5): number => {
  if (k < 0) return 0
  if (k >= n) return 1
  const logFactorial = [0]
  for (let i = 1; i <= n; i += 1) logFactorial.push((logFactorial[i - 1] ?? 0) + Math.log(i))
  let sum = 0
  for (let i = 0; i <= k; i += 1) {
    const logChoose = (logFactorial[n] ?? 0) - (logFactorial[i] ?? 0) - (logFactorial[n - i] ?? 0)
    sum += Math.exp(logChoose + i * Math.log(p) + (n - i) * Math.log1p(-p))
  }
  return Math.min(1, sum)
}

/**
 * One-sided exact McNemar test on paired samples. `onlyA` counts pairs where only arm A had the event
 * (for example "judged worse") and `onlyB` pairs where only arm B did. The result is the probability of
 * seeing at most `onlyB` of the `onlyA + onlyB` discordant pairs fall on B's side if the two arms were
 * equally likely to have it: a small value says B has the event less often than A.
 */
export const mcnemarOneSided = (onlyA: number, onlyB: number): number => {
  const discordant = onlyA + onlyB
  return discordant === 0 ? 1 : binomialCdf(onlyB, discordant, 0.5)
}
