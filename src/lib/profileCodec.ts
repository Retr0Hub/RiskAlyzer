import type { UserProfile } from '../types/user'

export function parseUserProfileRecord(data: unknown): UserProfile | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  if (
    typeof o.displayName !== 'string' ||
    typeof o.age !== 'number' ||
    !['male', 'female', 'other'].includes(o.sex as string) ||
    typeof o.smoker !== 'boolean' ||
    typeof o.familyIllness !== 'boolean' ||
    typeof o.registeredAt !== 'string'
  ) {
    return null
  }
  return {
    displayName: o.displayName,
    age: o.age,
    sex: o.sex as UserProfile['sex'],
    smoker: o.smoker,
    familyIllness: o.familyIllness,
    registeredAt: o.registeredAt,
  }
}
