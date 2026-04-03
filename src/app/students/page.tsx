'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Phone, Trash2, Pencil, User, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { Student, Session, SESSION_LABELS, PAYMENT_LABELS } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/page-transition'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Record<string, Session[]>>({})
  const [sessionsLoading, setSessionsLoading] = useState<string | null>(null)

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name')

    if (error) {
      toast.error('Failed to load students')
      console.error(error)
    } else {
      setStudents(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchSessionsForStudent = async (studentId: string) => {
    if (sessions[studentId]) return
    setSessionsLoading(studentId)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .contains('student_ids', [studentId])
      .order('date', { ascending: false })
      .limit(10)

    if (error) {
      toast.error('Failed to load sessions')
      console.error(error)
    } else {
      setSessions((prev) => ({ ...prev, [studentId]: data ?? [] }))
    }
    setSessionsLoading(null)
  }

  const handleExpand = (studentId: string) => {
    if (expandedId === studentId) {
      setExpandedId(null)
    } else {
      setExpandedId(studentId)
      fetchSessionsForStudent(studentId)
    }
  }

  const handleAdd = async () => {
    if (!addName.trim()) return
    setAddSaving(true)

    const { error } = await supabase
      .from('students')
      .insert({ name: addName.trim(), phone: addPhone.trim() || null })

    if (error) {
      toast.error('Failed to add student')
      console.error(error)
    } else {
      toast.success('Student added')
      setAddName('')
      setAddPhone('')
      setAddOpen(false)
      fetchStudents()
    }
    setAddSaving(false)
  }

  const handleEdit = async () => {
    if (!editStudent || !editName.trim()) return
    setEditSaving(true)

    const { error } = await supabase
      .from('students')
      .update({ name: editName.trim(), phone: editPhone.trim() || null })
      .eq('id', editStudent.id)

    if (error) {
      toast.error('Failed to update student')
      console.error(error)
    } else {
      toast.success('Student updated')
      setEditOpen(false)
      setEditStudent(null)
      fetchStudents()
      // Clear cached sessions for this student
      setSessions((prev) => {
        const next = { ...prev }
        delete next[editStudent.id]
        return next
      })
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteStudent) return
    setDeleting(true)

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', deleteStudent.id)

    if (error) {
      toast.error('Failed to delete student')
      console.error(error)
    } else {
      toast.success('Student deleted')
      setDeleteOpen(false)
      setDeleteStudent(null)
      if (expandedId === deleteStudent.id) setExpandedId(null)
      fetchStudents()
    }
    setDeleting(false)
  }

  const openEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditStudent(student)
    setEditName(student.name)
    setEditPhone(student.phone ?? '')
    setEditOpen(true)
  }

  const openDelete = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteStudent(student)
    setDeleteOpen(true)
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-navy">Students</h1>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={<Button className="bg-teal text-navy hover:bg-teal/90 font-semibold" />}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Student
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-navy">Add Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name *</Label>
                  <Input
                    id="add-name"
                    placeholder="Student name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input
                    id="add-phone"
                    placeholder="Phone number (optional)"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  className="bg-teal text-navy hover:bg-teal/90 font-semibold"
                  onClick={handleAdd}
                  disabled={!addName.trim() || addSaving}
                >
                  {addSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!loading && students.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 py-16 px-6 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
              <User className="h-8 w-8 text-teal" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-navy">No students yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your students to start tracking sessions and income.
            </p>
            <Button
              className="mt-6 bg-teal text-navy hover:bg-teal/90 font-semibold"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first student
            </Button>
          </motion.div>
        )}

        {/* Student list */}
        {!loading && students.length > 0 && (
          <div className="space-y-3">
            {students.map((student, index) => {
              const isExpanded = expandedId === student.id
              const studentSessions = sessions[student.id]
              const isLoadingSessions = sessionsLoading === student.id

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-shadow hover:shadow-md',
                      isExpanded && 'ring-2 ring-teal/30'
                    )}
                    onClick={() => handleExpand(student.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10">
                            <User className="h-5 w-5 text-teal" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading font-semibold text-navy truncate">
                              {student.name}
                            </p>
                            {student.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{student.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-navy"
                            onClick={(e) => openEdit(student, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={(e) => openDelete(student, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                          />
                        </div>
                      </div>

                      {/* Expanded session history */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator className="my-3" />

                            {isLoadingSessions && (
                              <div className="flex justify-center py-4">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                              </div>
                            )}

                            {!isLoadingSessions && studentSessions && studentSessions.length === 0 && (
                              <p className="py-3 text-center text-sm text-muted-foreground">
                                No sessions yet
                              </p>
                            )}

                            {!isLoadingSessions && studentSessions && studentSessions.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Recent Sessions
                                </p>
                                {studentSessions.map((session) => (
                                  <div
                                    key={session.id}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-navy font-medium">
                                        {formatDate(session.date)}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {SESSION_LABELS[session.type]}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-navy">
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
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-navy">Edit Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Student name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="Phone number (optional)"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                className="bg-teal text-navy hover:bg-teal/90 font-semibold"
                onClick={handleEdit}
                disabled={!editName.trim() || editSaving}
              >
                {editSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-navy">Delete Student</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-navy">{deleteStudent?.name}</span>? This action
              cannot be undone.
            </p>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
