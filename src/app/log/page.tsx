'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CalendarIcon, Check, Plus, Users, User, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { supabase } from '@/lib/supabase'
import {
  SessionType,
  PaymentMethod,
  Student,
  SESSION_RATES,
  SESSION_LABELS,
  PAYMENT_LABELS,
} from '@/lib/types'
import { getTodayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/page-transition'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const SESSION_TYPE_ICONS: Record<SessionType, typeof User> = {
  '1-on-1': User,
  '1-on-2': UserPlus,
  'group': Users,
}

export default function LogSessionPage() {
  const router = useRouter()

  const [sessionType, setSessionType] = useState<SessionType | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [date, setDate] = useState<Date>(new Date())
  const [paid, setPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tng')
  const [notes, setNotes] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })
      if (data) setStudents(data)
    }
    fetchStudents()
  }, [])

  // Reset student selection when session type changes
  useEffect(() => {
    setSelectedStudentIds([])
  }, [sessionType])

  function handleStudentToggle(studentId: string) {
    if (!sessionType) return

    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      }

      if (sessionType === '1-on-1') {
        return [studentId]
      }

      if (sessionType === '1-on-2' && prev.length >= 2) {
        return [...prev.slice(1), studentId]
      }

      return [...prev, studentId]
    })
  }

  function getStudentSelectionHint(): string {
    if (!sessionType) return ''
    if (sessionType === '1-on-1') return 'Select 1 student'
    if (sessionType === '1-on-2') return 'Select exactly 2 students'
    return 'Select students'
  }

  async function handleSubmit() {
    if (!sessionType) {
      toast.error('Please select a session type')
      return
    }
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student')
      return
    }
    if (sessionType === '1-on-2' && selectedStudentIds.length !== 2) {
      toast.error('Please select exactly 2 students for 1-on-2 session')
      return
    }

    setLoading(true)

    const dateStr = date.toISOString().split('T')[0]
    const amount = SESSION_RATES[sessionType]

    const { error } = await supabase.from('sessions').insert({
      date: dateStr,
      type: sessionType,
      student_ids: selectedStudentIds,
      amount,
      paid,
      payment_method: paid ? paymentMethod : 'tng',
      notes: notes.trim() || null,
    })

    setLoading(false)

    if (error) {
      toast.error('Failed to log session. Please try again.')
      return
    }

    setSubmitted(true)
    toast.success('Session logged successfully!')

    setTimeout(() => {
      router.push('/')
    }, 1500)
  }

  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-teal"
        >
          <Check className="h-10 w-10 text-navy" strokeWidth={3} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 font-heading text-lg font-medium text-navy"
        >
          Session logged!
        </motion.p>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 pb-8 pt-6">
        {/* Header */}
        <h1 className="mb-6 font-heading text-2xl font-semibold text-navy">
          Log Session
        </h1>

        {/* Session Type Selector */}
        <div className="mb-6">
          <Label className="mb-2 block text-sm font-medium text-navy/70">
            Session Type
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(SESSION_LABELS) as SessionType[]).map((type) => {
              const Icon = SESSION_TYPE_ICONS[type]
              const isSelected = sessionType === type
              return (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSessionType(type)}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors',
                    isSelected
                      ? 'border-teal bg-teal/10'
                      : 'border-foreground/10 bg-card hover:border-foreground/20'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="session-type-indicator"
                      className="absolute inset-0 rounded-xl border-2 border-teal"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-teal' : 'text-navy/50'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isSelected ? 'text-teal' : 'text-navy/70'
                    )}
                  >
                    {SESSION_LABELS[type]}
                  </span>
                  <span
                    className={cn(
                      'text-[10px]',
                      isSelected ? 'text-teal/80' : 'text-navy/40'
                    )}
                  >
                    RM {SESSION_RATES[type]}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Student Selector */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-medium text-navy/70">
              Students
            </Label>
            {sessionType && (
              <span className="text-xs text-navy/40">
                {getStudentSelectionHint()}
              </span>
            )}
          </div>

          {students.length === 0 ? (
            <Link
              href="/students/add"
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-foreground/10 p-4 text-sm text-navy/50 transition-colors hover:border-teal/40 hover:text-teal"
            >
              <Plus className="h-4 w-4" />
              Add your first student
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              {students.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id)
                return (
                  <motion.button
                    key={student.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleStudentToggle(student.id)}
                    disabled={!sessionType}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-teal bg-teal text-navy'
                        : 'border-foreground/10 bg-card text-navy/70 hover:border-foreground/20',
                      !sessionType && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, width: 0 }}
                        animate={{ scale: 1, width: 'auto' }}
                        exit={{ scale: 0, width: 0 }}
                      >
                        <Check className="h-3 w-3" />
                      </motion.span>
                    )}
                    {student.name}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <Label className="mb-2 block text-sm font-medium text-navy/70">
            Date
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              className={cn(
                'flex h-10 w-full items-center gap-2 rounded-xl border border-foreground/10 bg-card px-3 text-sm text-navy transition-colors hover:border-foreground/20'
              )}
            >
              <CalendarIcon className="h-4 w-4 text-navy/40" />
              {formattedDate}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d)
                    setCalendarOpen(false)
                  }
                }}
                defaultMonth={date}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Payment Status Toggle */}
        <div className="mb-6">
          <Label className="mb-2 block text-sm font-medium text-navy/70">
            Payment Status
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {[false, true].map((isPaid) => (
              <motion.button
                key={String(isPaid)}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPaid(isPaid)}
                className={cn(
                  'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  paid === isPaid
                    ? isPaid
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-amber-400 bg-amber-400/10 text-amber-600'
                    : 'border-foreground/10 bg-card text-navy/60 hover:border-foreground/20'
                )}
              >
                {isPaid ? 'Paid' : 'Unpaid'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment Method (only when Paid) */}
        <AnimatePresence>
          {paid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden"
            >
              <Label className="mb-2 block text-sm font-medium text-navy/70">
                Payment Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(
                  (method) => (
                    <motion.button
                      key={method}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                        paymentMethod === method
                          ? 'border-teal bg-teal/10 text-teal'
                          : 'border-foreground/10 bg-card text-navy/60 hover:border-foreground/20'
                      )}
                    >
                      {PAYMENT_LABELS[method]}
                    </motion.button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div className="mb-8">
          <Label className="mb-2 block text-sm font-medium text-navy/70">
            Notes (optional)
          </Label>
          <Textarea
            placeholder="Any notes about this session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] resize-none rounded-xl border-foreground/10 bg-card"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !sessionType || selectedStudentIds.length === 0}
          className="h-12 w-full rounded-xl bg-teal text-base font-semibold text-navy hover:bg-teal/90 disabled:opacity-50"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-5 w-5 rounded-full border-2 border-navy/20 border-t-navy"
            />
          ) : (
            'Log Session'
          )}
        </Button>
      </div>
    </PageTransition>
  )
}
