export type SessionType = '1-on-1' | '1-on-2' | 'group'
export type PaymentMethod = 'tng' | 'bank'

export type Student = {
  id: string
  name: string
  phone?: string
  created_at: string
}

export type Session = {
  id: string
  date: string
  type: SessionType
  student_ids: string[]
  amount: number
  paid: boolean
  payment_method: PaymentMethod
  notes?: string
  created_at: string
}

export const SESSION_RATES: Record<SessionType, number> = {
  '1-on-1': 80,
  '1-on-2': 80,
  'group': 60,
}

export const SESSION_LABELS: Record<SessionType, string> = {
  '1-on-1': '1-on-1',
  '1-on-2': '1-on-2',
  'group': 'Group Class',
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  'tng': 'TNG',
  'bank': 'Bank Transfer',
}
