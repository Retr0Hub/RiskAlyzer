import type { UserProfile } from '../types/user'

/**
 * Simplified illustrative model for the dashboard only — not medical advice.
 */
export function estimateLifeExpectancyYears(
  profile: UserProfile,
  options?: { airQualityAqi?: number | null }
): {
  baselineYears: number
  adjustedYears: number
  adjustments: { label: string; years: number }[]
} {
  const adjustments: { label: string; years: number }[] = []

  let baseline = 79
  if (profile.sex === 'female') {
    baseline += 4
    adjustments.push({ label: 'Sex (population avg.)', years: 4 })
  } else if (profile.sex === 'male') {
    adjustments.push({ label: 'Sex (population avg.)', years: 0 })
  }

  if (profile.smokingStatus === 'active') {
    const y = -8
    adjustments.push({ label: 'Smoking (active)', years: y })
  } else if (profile.smokingStatus === 'previously') {
    const y = -2
    adjustments.push({ label: 'Smoking (previously)', years: y })
  }
  if (profile.familyIllness) {
    const y = -3
    adjustments.push({ label: 'Family illness history', years: y })
  }

  const aqi = options?.airQualityAqi
  if (aqi != null && !Number.isNaN(aqi)) {
    let env = 0
    if (aqi > 150) env = -2.5
    else if (aqi > 100) env = -1.5
    else if (aqi > 50) env = -0.5
    if (env !== 0) {
      adjustments.push({ label: 'Recent air quality (local)', years: env })
    }
  }

  const sumAdj = adjustments.reduce((s, a) => s + a.years, 0)
  const adjustedYears = Math.max(45, Math.min(110, baseline + sumAdj))

  return {
    baselineYears: baseline,
    adjustedYears,
    adjustments,
  }
}

export function yearsRemaining(profile: UserProfile, adjustedExpectancy: number): number {
  return Math.max(0, Math.round((adjustedExpectancy - profile.age) * 10) / 10)
}
