import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useERP } from "@/context/ERPContext";
import {
  listCourses, createCourse, updateCourse, deleteCourse,
  listEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,
  getCourseAnalytics,
  type Course, type Enrollment, type CreateCourseDto,
} from "@/services/erp/educationService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GraduationCap, Users, TrendingUp, BookOpen, Plus, Pencil, Trash2, DollarSign } from "lucide-react";

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
}

export default function EducationModule() {
  const { activeTenant } = useERP();
  const qc = useQueryClient();
  const tid = activeTenant?.id;

  const { data: courses = [], isLoading: loadCourses } = useQuery<Course[]>({
    queryKey: ['edu-courses', tid],
    queryFn: () => listCourses(tid!),
    enabled: !!tid,
  });

  const { data: enrollments = [], isLoading: loadEnr } = useQuery<Enrollment[]>({
    queryKey: ['edu-enrollments', tid],
    queryFn: () => listEnrollments(tid!),
    enabled: !!tid,
  });

  const { data: analytics } = useQuery({
    queryKey: ['edu-analytics', tid],
    queryFn: () => getCourseAnalytics(tid!),
    enabled: !!tid,
  });

  if (!activeTenant) return (
    <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-muted-foreground/20">
      <p className="text-sm text-muted-foreground">Select a tenant to view Education Module</p>
    </div>
  );

  const cur = activeTenant.default_currency;

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Courses',  val: String(analytics?.activeCourses ?? 0),           icon: <BookOpen className="h-4 w-4"/>,       col: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Total Students',  val: String(analytics?.totalStudents ?? 0),            icon: <Users className="h-4 w-4"/>,          col: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Revenue',         val: fmt(analytics?.totalRevenue ?? 0, cur),           icon: <DollarSign className="h-4 w-4"/>,     col: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Outstanding',     val: fmt(analytics?.totalOutstanding ?? 0, cur),       icon: <TrendingUp className="h-4 w-4"/>,     col: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
        ].map(s => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg mb-2 ${s.bg} ${s.col}`}>{s.icon}</div>
              <p className="text-xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="courses"     className="gap-1 text-xs"><BookOpen className="h-3.5 w-3.5"/>Courses</TabsTrigger>
          <TabsTrigger value="enrollments" className="gap-1 text-xs"><Users className="h-3.5 w-3.5"/>Students</TabsTrigger>
          <TabsTrigger value="analytics"   className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5"/>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          <CoursesTab
            courses={courses} isLoading={loadCourses} tenantId={tid!}
            onRefresh={() => { qc.invalidateQueries({ queryKey: ['edu-courses', tid] }); qc.invalidateQueries({ queryKey: ['edu-analytics', tid] }); }}
          />
        </TabsContent>
        <TabsContent value="enrollments" className="mt-4">
          <EnrollmentsTab
            enrollments={enrollments} courses={courses} isLoading={loadEnr} tenantId={tid!}
            onRefresh={() => { qc.invalidateQueries({ queryKey: ['edu-enrollments', tid] }); qc.invalidateQueries({ queryKey: ['edu-analytics', tid] }); }}
          />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab analytics={analytics} currency={cur} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── COURSES TAB ──────────────────────────────────────────────────────────
function CoursesTab({ courses, isLoading, tenantId, onRefresh }: {
  courses: Course[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CreateCourseDto & { is_active?: boolean }>({
    title: '', description: '', instructor_name: '', price: 0, max_students: 30,
    start_date: '', end_date: '', schedule_info: '',
  });

  const reset = () => { setEditing(null); setForm({ title: '', description: '', instructor_name: '', price: 0, max_students: 30, start_date: '', end_date: '', schedule_info: '' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => editing ? updateCourse(editing.id, form) : createCourse(tenantId, form),
    onSuccess: () => { toast.success(editing ? 'Course updated' : 'Course created'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => { toast.success('Course deleted'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{courses.length} courses</p>
        <Button size="sm" className="gap-1.5" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>New Course</Button>
      </div>
      <div className="space-y-2">
        {courses.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border-2 border-dashed">No courses yet</div>}
        {courses.map(c => (
          <div key={c.id} className={`rounded-xl border p-4 flex items-center gap-4 ${!c.is_active ? 'opacity-60' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{c.title}</p>
                <Badge variant={c.is_active ? 'default' : 'outline'} className="text-xs">{c.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.instructor_name ?? 'No instructor'} · Max {c.max_students ?? '∞'} students</p>
              {c.schedule_info && <p className="text-xs text-muted-foreground">{c.schedule_info}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">{c.price > 0 ? `${c.price.toLocaleString()}` : 'Free'}</p>
              <p className="text-xs text-muted-foreground">{c.start_date ?? 'No date'}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setForm({ title: c.title, description: c.description ?? '', instructor_name: c.instructor_name ?? '', price: c.price, max_students: c.max_students ?? 30, start_date: c.start_date ?? '', end_date: c.end_date ?? '', schedule_info: c.schedule_info ?? '' }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Delete course?')) remove(c.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Course' : 'New Course'}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1"><Label className="text-xs">Course Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Instructor</Label><Input value={form.instructor_name ?? ''} onChange={e => setForm(f => ({...f, instructor_name: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={form.price ?? 0} onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value) || 0}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Max Students</Label><Input type="number" value={form.max_students ?? 30} onChange={e => setForm(f => ({...f, max_students: parseInt(e.target.value) || 30}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date ?? ''} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Schedule Info</Label><Input value={form.schedule_info ?? ''} onChange={e => setForm(f => ({...f, schedule_info: e.target.value}))} placeholder="e.g. Mon/Wed 6–8PM" /></div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={form.description ?? ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.title || isPending}>{isPending ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── ENROLLMENTS TAB ──────────────────────────────────────────────────────
function EnrollmentsTab({ enrollments, courses, isLoading, tenantId, onRefresh }: {
  enrollments: Enrollment[]; courses: Course[]; isLoading: boolean; tenantId: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [form, setForm] = useState({ course_id: '', student_name: '', student_email: '', student_phone: '', paid_amount: '', balance_due: '', status: 'active' });

  const reset = () => { setEditing(null); setForm({ course_id: courses[0]?.id ?? '', student_name: '', student_email: '', student_phone: '', paid_amount: '', balance_due: '', status: 'active' }); };

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const dto = { ...form, paid_amount: parseFloat(form.paid_amount) || 0, balance_due: parseFloat(form.balance_due) || 0 };
      return editing ? updateEnrollment(editing.id, dto) : createEnrollment(tenantId, dto);
    },
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Student enrolled'); onRefresh(); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => { toast.success('Removed'); onRefresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c.title]));

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">{enrollments.length} enrollments</p>
        <Button size="sm" className="gap-1.5" disabled={courses.length === 0} onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4"/>Enroll Student</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{['Student','Course','Paid','Balance','Status',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {enrollments.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No enrollments yet</td></tr>}
            {enrollments.map(e => (
              <tr key={e.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{e.student_name}</p>
                  <p className="text-xs text-muted-foreground">{e.student_email ?? e.student_phone ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{courseMap[e.course_id] ?? '—'}</td>
                <td className="px-4 py-3 font-semibold text-green-600">{e.paid_amount.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-amber-600">{e.balance_due > 0 ? e.balance_due.toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.status === 'active' ? 'bg-green-100 text-green-700' :
                    e.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>{e.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(e); setForm({ course_id: e.course_id, student_name: e.student_name, student_email: e.student_email ?? '', student_phone: e.student_phone ?? '', paid_amount: String(e.paid_amount), balance_due: String(e.balance_due), status: e.status }); setOpen(true); }}><Pencil className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('Remove?')) remove(e.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Enrollment' : 'Enroll Student'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Course *</Label>
              <Select value={form.course_id} onValueChange={v => setForm(f => ({...f, course_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select course…"/></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Student Name *</Label><Input value={form.student_name} onChange={e => setForm(f => ({...f, student_name: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={form.student_email} onChange={e => setForm(f => ({...f, student_email: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={form.student_phone} onChange={e => setForm(f => ({...f, student_phone: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Paid Amount</Label><Input type="number" value={form.paid_amount} onChange={e => setForm(f => ({...f, paid_amount: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">Balance Due</Label><Input type="number" value={form.balance_due} onChange={e => setForm(f => ({...f, balance_due: e.target.value}))} /></div>
            </div>
            {editing && (
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{['active','completed','dropped','suspended'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save()} disabled={!form.course_id || !form.student_name || isPending}>{isPending ? 'Saving…' : editing ? 'Update' : 'Enroll'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────
function AnalyticsTab({ analytics, currency }: { analytics: Awaited<ReturnType<typeof getCourseAnalytics>> | undefined; currency: string }) {
  if (!analytics) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.perCourse.map(c => (
          <div key={c.id} className="rounded-xl border p-4">
            <div className="flex justify-between items-start mb-3">
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="font-bold text-sm">{fmt(c.revenue, currency)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.enrolled} students</span>
                {c.occupancyPct !== null && <span>{c.occupancyPct}% full</span>}
              </div>
              {c.occupancyPct !== null && <Progress value={c.occupancyPct} className="h-1.5" />}
            </div>
          </div>
        ))}
        {analytics.perCourse.length === 0 && (
          <div className="col-span-2 text-center py-10 text-muted-foreground text-sm rounded-xl border-2 border-dashed">Add courses and enroll students to see analytics</div>
        )}
      </div>
    </div>
  );
}
