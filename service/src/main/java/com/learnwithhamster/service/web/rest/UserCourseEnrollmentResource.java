package com.learnwithhamster.service.web.rest;

import com.learnwithhamster.service.service.UserCourseEnrollmentService;
import com.learnwithhamster.service.service.dto.UserCourseEnrollmentDTO;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing user course enrollments.
 */
@RestController
@RequestMapping("/api/user-course-enrollment")
public class UserCourseEnrollmentResource {

    private static final Logger LOG = LoggerFactory.getLogger(UserCourseEnrollmentResource.class);

    private final UserCourseEnrollmentService userCourseEnrollmentService;

    public UserCourseEnrollmentResource(UserCourseEnrollmentService userCourseEnrollmentService) {
        this.userCourseEnrollmentService = userCourseEnrollmentService;
    }

    /**
     * {@code POST  /user-course-enrollment/enroll} : Enroll in a course (idempotent).
     *
     * @param request the enroll request containing courseId.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the enrollment record.
     */
    @PostMapping("/enroll")
    public ResponseEntity<UserCourseEnrollmentDTO> enroll(@RequestBody EnrollRequest request) {
        LOG.debug("REST request to enroll in course: {}", request);
        UserCourseEnrollmentDTO result = userCourseEnrollmentService.enroll(request.courseId());
        return ResponseEntity.ok(result);
    }

    /**
     * {@code DELETE  /user-course-enrollment/:courseId} : Unenroll from a course.
     *
     * @param courseId the course ID.
     * @return the {@link ResponseEntity} with status {@code 204 (No Content)}.
     */
    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> unenroll(@PathVariable("courseId") Long courseId) {
        LOG.debug("REST request to unenroll from course: {}", courseId);
        userCourseEnrollmentService.unenroll(courseId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET  /user-course-enrollment} : Get all enrollments for the current user.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of enrollments.
     */
    @GetMapping
    public ResponseEntity<List<UserCourseEnrollmentDTO>> getEnrollments() {
        LOG.debug("REST request to get all enrollments");
        List<UserCourseEnrollmentDTO> result = userCourseEnrollmentService.getEnrollments();
        return ResponseEntity.ok(result);
    }

    /**
     * {@code GET  /user-course-enrollment/check/:courseId} : Check if enrolled in a course.
     *
     * @param courseId the course ID.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and boolean result.
     */
    @GetMapping("/check/{courseId}")
    public ResponseEntity<Boolean> isEnrolled(@PathVariable("courseId") Long courseId) {
        LOG.debug("REST request to check enrollment for course: {}", courseId);
        boolean enrolled = userCourseEnrollmentService.isEnrolled(courseId);
        return ResponseEntity.ok(enrolled);
    }

    /**
     * Request body for enrolling in a course.
     */
    public record EnrollRequest(Long courseId) {}
}
