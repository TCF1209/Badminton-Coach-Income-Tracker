'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  TrendingUp,
  Users,
  User,
  UserPlus,
  DollarSign,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Session, SessionType, SESSION_LABELS } from '@/lib/types'
import { formatDate, formatCurrency, getTodayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/page-transition'
import { CountUp } from '@/components/count-up'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

type ViewMode = 'daily' | 'monthly'

const SESSION_TYPE_ICONS: Record<SessionType, typeof User> = {
  '1-on-1': User,
  '1-on-2': UserPlus,
  'group': Users,
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

function getMonthRange(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number)
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const end = new Date(year, month, 0).toISOString().split('T')[0]
  return { start, end }
}

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

export default function ReportsPage() {
  const [view, setView] = useState<ViewMode>('monthly')
  const [selectedDate, setSelectedDate] = useState(getTodayISO())
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [animationKey, setAnimationKey] = useState(0)

  const monthOptions = useMemo(() => getMonthOptions(), [])

  const fetchDailySessions = useCallback(async (date: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (!error) {
      setSessions(data ?? [])
    }
    setLoading(false)
    setAnimationKey((k) => k + 1)
  }, [])

  const fetchMonthlySessions = useCallback(async (monthStr: string) => {
    setLoading(true)
    const { start, end } = getMonthRange(monthStr)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (!error) {
      setSessions(data ?? [])
    }
    setLoading(false)
    setAnimationKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (view === 'daily') {
      fetchDailySessions(selectedDate)
    } else {
      fetchMonthlySessions(selectedMonth)
    }
  }, [view, selectedDate, selectedMonth, fetchDailySessions, fetchMonthlySessions])

  // Computed summaries
  const summary = useMemo(() => {
    const totalEarnings = sessions.reduce((sum, s) => sum + s.amount, 0)
    const sessionCount = sessions.length
    const avgPerSession = sessionCount > 0 ? Math.round(totalEarnings / sessionCount) : 0

    const byType: Record<SessionType, { count: number; total: number }> = {
      '1-on-1': { count: 0, total: 0 },
      '1-on-2': { count: 0, total: 0 },
      'group': { count: 0, total: 0 },
    }
    sessions.forEach((s) => {
      byType[s.type].count++
      byType[s.type].total += s.amount
    })

    const paidTotal = sessions.filter((s) => s.paid).reduce((sum, s) => sum + s.amount, 0)
    const unpaidTotal = sessions.filter((s) => !s.paid).reduce((sum, s) => sum + s.amount, 0)
    const paidRatio = totalEarnings > 0 ? (paidTotal / totalEarnings) * 100 : 0

    return { totalEarnings, sessionCount, avgPerSession, byType, paidTotal, unpaidTotal, paidRatio }
  }, [sessions])

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-navy">Income Reports</h1>
        </div>

        {/* View Toggle */}
        <div className="mb-5 flex rounded-xl bg-navy/5 p-1">
          {(['daily', 'monthly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                'relative flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                view === mode
                  ? 'text-navy'
                  : 'text-muted-foreground hover:text-navy/70'
              )}
            >
              {view === mode && (
                <motion.div
                  layoutId="viewToggle"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 capitalize">{mode}</span>
            </button>
          ))}
        </div>

        {/* Selectors */}
        <div className="mb-6">
          {view === 'daily' ? (
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-teal" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-medium text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-teal" />
              <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
                <SelectTrigger className="flex-1 border-input text-sm font-medium text-navy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 py-16 px-6 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
              <FileText className="h-8 w-8 text-teal" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-navy">
              No data for this period
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === 'daily'
                ? 'No sessions were logged on this date.'
                : 'No sessions were logged this month. Start logging sessions to see your income reports.'}
            </p>
          </motion.div>
        )}

        {/* Daily View */}
        {!loading && sessions.length > 0 && view === 'daily' && (
          <div key={`daily-${animationKey}`}>
            {/* Daily summary */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <motion.div
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="border-0 bg-navy text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-teal" />
                      <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                        Earnings
                      </span>
                    </div>
                    <CountUp
                      end={summary.totalEarnings}
                      className="text-2xl font-bold font-heading text-teal"
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
                <Card className="border-0 bg-navy-light text-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-teal" />
                      <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                        Sessions
                      </span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-white">
                      {summary.sessionCount}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Daily session list */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Sessions on {formatDate(selectedDate)}
              </p>
              {sessions.map((session, index) => {
                const Icon = SESSION_TYPE_ICONS[session.type]
                return (
                  <motion.div
                    key={session.id}
                    custom={index + 2}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/10">
                              <Icon className="h-4 w-4 text-teal" />
                            </div>
                            <div>
                              <p className="font-heading font-semibold text-navy text-sm">
                                {SESSION_LABELS[session.type]}
                              </p>
                              {session.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-navy text-sm">
                              {formatCurrency(session.amount)}
                            </span>
                            <Badge
                              className={cn(
                                'text-xs',
                                session.paid
                                  ? 'bg-teal/10 text-teal border-teal/20'
                                  : 'bg-red-50 text-red-500 border-red-200'
                              )}
                              variant="outline"
                            >
                              {session.paid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {!loading && sessions.length > 0 && view === 'monthly' && (
          <div key={`monthly-${animationKey}`} className="space-y-3">
            {/* Total Earnings - Hero Card */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-0 bg-navy shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal/5 rounded-full translate-y-8 -translate-x-8" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/15">
                      <TrendingUp className="h-4 w-4 text-teal" />
                    </div>
                    <span className="text-sm font-medium text-white/50 uppercase tracking-wider">
                      Total Earnings
                    </span>
                  </div>
                  <CountUp
                    end={summary.totalEarnings}
                    className="text-4xl font-bold font-heading text-teal"
                  />
                  <div className="mt-3 flex items-center gap-4 text-sm text-white/40">
                    <span>{summary.sessionCount} sessions</span>
                    <span>Avg {formatCurrency(summary.avgPerSession)} / session</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="border-0 bg-navy-light shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-teal" />
                      <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Sessions
                      </span>
                    </div>
                    <p className="text-2xl font-bold font-heading text-white">
                      {summary.sessionCount}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="border-0 bg-navy-light shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-teal" />
                      <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Average
                      </span>
                    </div>
                    <CountUp
                      end={summary.avgPerSession}
                      className="text-2xl font-bold font-heading text-white"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Breakdown by Session Type */}
            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-0 bg-navy-mid shadow-lg">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-white/50 uppercase tracking-wider">
                    By Session Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {(Object.entries(summary.byType) as [SessionType, { count: number; total: number }][]).map(
                    ([type, data]) => {
                      const Icon = SESSION_TYPE_ICONS[type]
                      const widthPercent =
                        summary.totalEarnings > 0
                          ? (data.total / summary.totalEarnings) * 100
                          : 0
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/10">
                                <Icon className="h-3.5 w-3.5 text-teal" />
                              </div>
                              <span className="text-sm font-medium text-white/80">
                                {SESSION_LABELS[type]}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-white/40">{data.count} sessions</span>
                              <span className="font-semibold text-teal">
                                {formatCurrency(data.total)}
                              </span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-teal/60"
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    }
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Paid vs Unpaid */}
            <motion.div
              custom={4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-0 bg-navy-mid shadow-lg">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-white/50 uppercase tracking-wider">
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {/* Visual ratio bar */}
                  <div className="mb-4 h-3 w-full rounded-full bg-white/5 overflow-hidden flex">
                    <motion.div
                      className="h-full bg-teal rounded-l-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${summary.paidRatio}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="h-full bg-red-400/70"
                      style={{ borderTopRightRadius: summary.paidRatio < 100 ? '9999px' : 0, borderBottomRightRadius: summary.paidRatio < 100 ? '9999px' : 0 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - summary.paidRatio}%` }}
                      transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/15">
                        <CheckCircle2 className="h-4 w-4 text-teal" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Paid</p>
                        <p className="font-heading font-bold text-teal text-lg">
                          {formatCurrency(summary.paidTotal)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-400/15">
                        <Clock className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Unpaid</p>
                        <p className="font-heading font-bold text-red-400 text-lg">
                          {formatCurrency(summary.unpaidTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
