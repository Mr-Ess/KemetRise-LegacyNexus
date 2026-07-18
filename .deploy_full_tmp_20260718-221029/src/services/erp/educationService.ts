import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  price: number;
  max_students: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  schedule_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  tenant_id: string;
  course_id: string;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped' | 'suspended';
  paid_amount: number;
  balance_due: number;
  notes: string | null;
}

export interface CreateCourseDto {
  title: string;
  description?: string;
  instructor_name?: string;
  price?: number;
  max_students?: number;
  start_date?: string;
  end_date?: string;
  schedule_info?: string;
}

export interface CreateEnrollmentDto {
  course_id: string;
  student_name: string;
  student_email?: string;
  student_phone?: string;
  paid_amount?: number;
  balance_due?: number;
  notes?: string;
}

// ─── COURSES ──────────────────────────────────────────────────────────────

export async function listCourses(tenantId: string): Promise<Course[]> {
  const { data, error } = await db
    .from('edu_courses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCourse(tenantId: string, dto: CreateCourseDto): Promise<Course> {
  const { data, error } = await db
    .from('edu_courses')
    .insert({ tenant_id: tenantId, ...dto })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, patch: Partial<CreateCourseDto>): Promise<Course> {
  const { data, error } = await db
    .from('edu_courses')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await db.from('edu_courses').delete().eq('id', id);
  if (error) throw error;
}

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────

export async function listEnrollments(tenantId: string, courseId?: string): Promise<Enrollment[]> {
  let q = db.from('edu_enrollments').select('*').eq('tenant_id', tenantId);
  if (courseId) q = q.eq('course_id', courseId);
  const { data, error } = await q.order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEnrollment(tenantId: string, dto: CreateEnrollmentDto): Promise<Enrollment> {
  const { data, error } = await db
    .from('edu_enrollments')
    .insert({ tenant_id: tenantId, ...dto })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEnrollment(id: string, patch: Partial<Enrollment>): Promise<Enrollment> {
  const { data, error } = await db
    .from('edu_enrollments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEnrollment(id: string): Promise<void> {
  const { error } = await db.from('edu_enrollments').delete().eq('id', id);
  if (error) throw error;
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────

export async function getCourseAnalytics(tenantId: string) {
  const [courses, enrollments] = await Promise.all([
    listCourses(tenantId),
    listEnrollments(tenantId),
  ]);

  const activeCourses = courses.filter(c => c.is_active).length;
  const totalStudents = enrollments.filter(e => e.status === 'active').length;
  const totalRevenue = enrollments.reduce((s, e) => s + (e.paid_amount ?? 0), 0);
  const totalOutstanding = enrollments.reduce((s, e) => s + (e.balance_due ?? 0), 0);

  const perCourse = courses.map(c => {
    const enrolled = enrollments.filter(e => e.course_id === c.id);
    return {
      id: c.id,
      title: c.title,
      enrolled: enrolled.length,
      revenue: enrolled.reduce((s, e) => s + (e.paid_amount ?? 0), 0),
      occupancyPct: c.max_students ? Math.round((enrolled.length / c.max_students) * 100) : null,
    };
  });

  return { activeCourses, totalStudents, totalRevenue, totalOutstanding, perCourse };
}
