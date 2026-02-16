export interface IUserCourseEnrollment {
  id: number;
  userLogin?: string | null;
  courseId?: number | null;
  enrolledAt?: string | null;
}
