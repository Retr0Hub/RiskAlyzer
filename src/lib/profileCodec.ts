import type { UserProfile, SmokingStatus } from '../types/user'

export function parseUserProfileRecord(data: unknown): UserProfile | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  
  // Validate required fields
  if (
    typeof o.displayName !== 'string' ||
    typeof o.age !== 'number' ||
    !['male', 'female', 'other'].includes(o.sex as string) ||
    typeof o.familyIllness !== 'boolean' ||
    typeof o.registeredAt !== 'string'
  ) {
    return null
  }

  // Handle smoking status migration: old 'smoker' boolean -> new 'smokingStatus' string
  let smokingStatus: SmokingStatus = 'never'
  if ('smokingStatus' in o && typeof o.smokingStatus === 'string') {
    // New format
    if (['never', 'previously', 'active'].includes(o.smokingStatus)) {
      smokingStatus = o.smokingStatus as SmokingStatus
    }
  } else if ('smoker' in o && typeof o.smoker === 'boolean') {
    // Old format - migrate boolean to enum
    smokingStatus = o.smoker ? 'active' : 'never'
  }

  return {
    displayName: o.displayName,
    age: o.age,
    sex: o.sex as UserProfile['sex'],
    smokingStatus,
    familyIllness: o.familyIllness,
    registeredAt: o.registeredAt,
    phoneNumber: typeof o.phoneNumber === 'string' ? o.phoneNumber : undefined,
    twoFactorEnabled: typeof o.twoFactorEnabled === 'boolean' ? o.twoFactorEnabled : undefined,
  }
}
