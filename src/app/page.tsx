'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Session, Student, SessionType, SESSION_LABELS } from '@/lib/types'
import { formatDate, formatCurrency, getTodayISO, getCurrentMonthRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/count-up'
import { PageTransition } from '@/components/page-transition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
}

function getSessionBadgeClasses(type: SessionType) {
  switch (type) {
    case '1-on-1':
      return 'bg-teal/15 text-teal border-teal/30'
    case '1-on-2':
      return 'bg-navy/15 text-navy border-navy/30 dark:bg-navy/30 dark:text-blue-200'
    case 'group':
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [monthSessions, setMonthSessions] = useState<Session[]>([])
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const today = getTodayISO()
        const { start, end } = getCurrentMonthRange()

        const [todayRes, monthRes, recentRes, studentsRes] = await Promise.all([
          supabase
            .from('sessions')
            .select('*')
            .eq('date', today)
            .order('created_at', { ascending: false }),
          supabase
            .from('sessions')
            .select('*')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: false }),
          supabase
            .from('sessions')
            .select('*')
            .order('date', { ascending: false })
            .limit(5),
          supabase.from('students').select('*'),
        ])

        if (todayRes.data) setTodaySessions(todayRes.data)
        if (monthRes.data) setMonthSessions(monthRes.data)
        if (recentRes.data) setRecentSessions(recentRes.data)

        if (studentsRes.data) {
          const map: Record<string, Student> = {}
          studentsRes.data.forEach((s: Student) => {
            map[s.id] = s
          })
          setStudents(map)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const todayEarnings = todaySessions.reduce((sum, s) => sum + s.amount, 0)
  const monthEarnings = monthSessions.reduce((sum, s) => sum + s.amount, 0)
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function getStudentNames(studentIds: string[]) {
    if (!studentIds || studentIds.length === 0) return 'No students'
    return studentIds
      .map((id) => students[id]?.name ?? 'Unknown')
      .join(', ')
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-8 pt-4 sm:px-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-navy px-5 py-6 text-white sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy/80" />
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal/10 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal/5 blur-xl" />

          <div className="relative z-10">
            <p className="text-sm font-medium text-teal">
              {todayFormatted}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting()}, Coach
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Here&apos;s your performance overview
            </p>
          </div>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="relative overflow-hidden border-teal/20">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-teal/5" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10">
                    <Zap className="h-4 w-4 text-teal" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Earnings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CountUp
                  end={todayEarnings}
                  prefix="RM"
                  className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="relative overflow-hidden border-navy/10">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-navy/5" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10">
                    <TrendingUp className="h-4 w-4 text-navy dark:text-blue-300" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month&apos;s Total
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CountUp
                  end={monthEarnings}
                  prefix="RM"
                  className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10">
                  <Clock className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">{todaySessions.length}</p>
                  <p className="text-xs text-muted-foreground">Sessions Today</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10">
                  <CalendarDays className="h-5 w-5 text-navy dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">{monthSessions.length}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">
                      No sessions yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start tracking your coaching sessions to see your earnings grow!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {recentSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.08, duration: 0.3 }}
                      className={cn(
                        'flex items-center justify-between gap-3 py-3',
                        index === 0 && 'pt-0'
                      )}
                    >
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={cn(
                              'text-[10px] font-semibold uppercase tracking-wide',
                              getSessionBadgeClasses(session.type)
                            )}
                          >
                            {SESSION_LABELS[session.type]}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px] font-semibold',
                              session.paid
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                            )}
                          >
                            {session.paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {getStudentNames(session.student_ids)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.date)}
                        </p>
                      </div>
                      <p className="font-heading text-base font-bold text-foreground whitespace-nowrap">
                        {formatCurrency(session.amount)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
