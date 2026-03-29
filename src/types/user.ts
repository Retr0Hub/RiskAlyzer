export type Sex = 'male' | 'female' | 'other'
export type SmokingStatus = 'never' | 'previously' | 'active'

export interface UserProfile {
  displayName: string
  age: number
  sex: Sex
  smokingStatus: SmokingStatus
  familyIllness: boolean
  registeredAt: string
  phoneNumber?: string
  twoFactorEnabled?: boolean
}
