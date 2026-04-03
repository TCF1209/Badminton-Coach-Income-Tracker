'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  Session,
  Student,
  SessionType,
  SESSION_LABELS,
  PAYMENT_LABELS,
  SESSION_RATES,
  PaymentMethod,
} from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/page-transition'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CalendarIcon,
  FilterIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
  SearchIcon,
  ClockIcon,
} from 'lucide-react'
import { toast } from 'sonner'

type FilterType = 'all' | SessionType
type PaymentFilter = 'all' | 'paid' | 'unpaid'

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  '1-on-1': 'bg-blue-500/10 text-blue-600',
  '1-on-2': 'bg-purple-500/10 text-purple-600',
  'group': 'bg-teal/10 text-teal',
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Edit dialog
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editType, setEditType] = useState<SessionType>('1-on-1')
  const [editAmount, setEditAmount] = useState('')
  const [editPaid, setEditPaid] = useState(false)
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('tng')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteSession, setDeleteSession] = useState<Session | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [sessionsRes, studentsRes] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }),
        supabase.from('students').select('*'),
      ])
      if (sessionsRes.data) setSessions(sessionsRes.data)
      if (studentsRes.data) setStudents(studentsRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>()
    students.forEach((s) => map.set(s.id, s))
    return map
  }, [students])

  function getStudentNames(ids: string[]): string {
    return ids
      .map((id) => studentMap.get(id)?.name ?? 'Unknown')
      .join(', ')
  }

  // Apply filters
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (typeFilter !== 'all' && session.type !== typeFilter) return false
      if (paymentFilter === 'paid' && !session.paid) return false
      if (paymentFilter === 'unpaid' && session.paid) return false
      if (startDate) {
        const sessionDate = new Date(session.date + 'T00:00:00')
        if (sessionDate < startDate) return false
      }
      if (endDate) {
        const sessionDate = new Date(session.date + 'T00:00:00')
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (sessionDate > endOfDay) return false
      }
      return true
    })
  }, [sessions, typeFilter, paymentFilter, startDate, endDate])

  const hasActiveFilters =
    typeFilter !== 'all' ||
    paymentFilter !== 'all' ||
    startDate !== undefined ||
    endDate !== undefined

  function clearFilters() {
    setTypeFilter('all')
    setPaymentFilter('all')
    setStartDate(undefined)
    setEndDate(undefined)
  }

  // Edit handlers
  function openEdit(session: Session) {
    setEditSession(session)
    setEditType(session.type)
    setEditAmount(String(session.amount))
    setEditPaid(session.paid)
    setEditPaymentMethod(session.payment_method)
    setEditNotes(session.notes ?? '')
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editSession) return
    setSaving(true)
    const { error } = await supabase
      .from('sessions')
      .update({
        type: editType,
        amount: Number(editAmount),
        paid: editPaid,
        payment_method: editPaymentMethod,
        notes: editNotes || null,
      })
      .eq('id', editSession.id)

    if (error) {
      toast.error('Failed to update session')
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editSession.id
            ? {
                ...s,
                type: editType,
                amount: Number(editAmount),
                paid: editPaid,
                payment_method: editPaymentMethod,
                notes: editNotes || undefined,
              }
            : s
        )
      )
      toast.success('Session updated')
      setEditOpen(false)
    }
    setSaving(false)
  }

  // Delete handlers
  async function handleDelete() {
    if (!deleteSession) return
    setDeleting(true)
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', deleteSession.id)

    if (error) {
      toast.error('Failed to delete session')
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== deleteSession.id))
      toast.success('Session deleted')
      setDeleteOpen(false)
    }
    setDeleting(false)
  }

  function formatFilterDate(date: Date | undefined): string {
    if (!date) return ''
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-navy">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">
            Session History
          </h1>
          <p className="mt-1 text-sm text-white/50">
            View and manage past sessions
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="mb-4 border-white/5 bg-white/5">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/60">
              <FilterIcon className="size-3.5" />
              Filters
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1 text-teal hover:text-teal/80"
                >
                  <XIcon className="size-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Type & Payment filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as FilterType)}>
                <SelectTrigger className="h-10 w-full border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Session Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="1-on-1">1-on-1</SelectItem>
                  <SelectItem value="1-on-2">1-on-2</SelectItem>
                  <SelectItem value="group">Group Class</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter(val as PaymentFilter)}>
                <SelectTrigger className="h-10 w-full border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger
                  render={
                    <button className="flex h-10 w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white" />
                  }
                >
                  <CalendarIcon className="size-3.5 text-white/40" />
                  {startDate ? formatFilterDate(startDate) : 'Start date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="bottom" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date ?? undefined)
                      setStartDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger
                  render={
                    <button className="flex h-10 w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white" />
                  }
                >
                  <CalendarIcon className="size-3.5 text-white/40" />
                  {endDate ? formatFilterDate(endDate) : 'End date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="bottom" align="center">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date ?? undefined)
                      setEndDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {!loading && (
          <p className="mb-3 text-xs text-white/40">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-teal" />
            <p className="mt-3 text-sm text-white/40">Loading sessions...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 py-16"
          >
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white/5">
              {hasActiveFilters ? (
                <SearchIcon className="size-5 text-white/30" />
              ) : (
                <ClockIcon className="size-5 text-white/30" />
              )}
            </div>
            <p className="font-heading text-base font-medium text-white/70">
              No sessions found
            </p>
            <p className="mt-1 text-xs text-white/40">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Sessions you log will appear here'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-teal hover:text-teal/80"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Session list */}
        <div className="space-y-2">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <Card
                className="cursor-pointer border-white/5 bg-white/5 transition-colors hover:bg-white/[0.07] active:bg-white/[0.09]"
                onClick={() => openEdit(session)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1.5">
                      {/* Date + Type badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">
                          {formatDate(session.date)}
                        </span>
                        <Badge
                          className={cn(
                            'rounded-full border-0 px-2 py-0.5 text-[10px] font-medium',
                            SESSION_TYPE_COLORS[session.type]
                          )}
                        >
                          {SESSION_LABELS[session.type]}
                        </Badge>
                      </div>

                      {/* Student names */}
                      <p className="text-sm font-medium text-white">
                        {getStudentNames(session.student_ids)}
                      </p>

                      {/* Payment method */}
                      {session.paid && (
                        <p className="text-[10px] text-white/30">
                          {PAYMENT_LABELS[session.payment_method]}
                        </p>
                      )}
                    </div>

                    {/* Amount + payment status */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-heading text-base font-semibold text-white">
                        {formatCurrency(session.amount)}
                      </span>
                      <Badge
                        className={cn(
                          'rounded-full border-0 px-2 py-0.5 text-[10px] font-medium',
                          session.paid
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        )}
                      >
                        {session.paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="border-white/10 bg-navy text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Session</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Session type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Session Type</Label>
                <Select value={editType} onValueChange={(val) => setEditType(val as SessionType)}>
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-on-1">1-on-1</SelectItem>
                    <SelectItem value="1-on-2">1-on-2</SelectItem>
                    <SelectItem value="group">Group Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Amount (RM)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="0"
                />
              </div>

              {/* Paid status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Payment Status</Label>
                <Select
                  value={editPaid ? 'paid' : 'unpaid'}
                  onValueChange={(val) => setEditPaid(val === 'paid')}
                >
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment method */}
              {editPaid && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">Payment Method</Label>
                  <Select
                    value={editPaymentMethod}
                    onValueChange={(val) => setEditPaymentMethod(val as PaymentMethod)}
                  >
                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tng">TNG</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="min-h-[80px] border-white/10 bg-white/5 text-white"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <DialogFooter className="border-white/5 bg-white/5">
              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                className="mr-auto"
                onClick={() => {
                  setDeleteSession(editSession)
                  setEditOpen(false)
                  setDeleteOpen(true)
                }}
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
              <DialogClose render={<Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/10" />}>
                Cancel
              </DialogClose>
              <Button
                size="sm"
                className="bg-teal text-navy hover:bg-teal/90"
                onClick={handleSaveEdit}
                disabled={saving || !editAmount}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="border-white/10 bg-navy text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Session</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-white/60">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            {deleteSession && (
              <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                <p className="text-xs text-white/40">{formatDate(deleteSession.date)}</p>
                <p className="text-sm font-medium text-white">
                  {getStudentNames(deleteSession.student_ids)}
                </p>
                <p className="text-xs text-white/50">
                  {SESSION_LABELS[deleteSession.type]} &middot;{' '}
                  {formatCurrency(deleteSession.amount)}
                </p>
              </div>
            )}
            <DialogFooter className="border-white/5 bg-white/5">
              <DialogClose render={<Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/10" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </PageTransition>
  )
}
