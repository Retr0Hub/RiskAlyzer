export type Sex = 'male' | 'female' | 'other'

export interface UserProfile {
  displayName: string
  age: number
  sex: Sex
  smoker: boolean
  familyIllness: boolean
  registeredAt: string
}
