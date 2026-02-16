package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.UserCourseEnrollmentDTO;
import java.util.List;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.UserCourseEnrollment}.
 */
public interface UserCourseEnrollmentService {
    /**
     * Idempotently enroll the current user in a course.
     *
     * @param courseId the course ID.
     * @return the enrollment record.
     */
    UserCourseEnrollmentDTO enroll(Long courseId);

    /**
     * Unenroll the current user from a course.
     *
     * @param courseId the course ID.
     */
    void unenroll(Long courseId);

    /**
     * Get all enrollments for the current user.
     *
     * @return list of enrollment records.
     */
    List<UserCourseEnrollmentDTO> getEnrollments();

    /**
     * Check if the current user is enrolled in a course.
     *
     * @param courseId the course ID.
     * @return true if enrolled.
     */
    boolean isEnrolled(Long courseId);
}
