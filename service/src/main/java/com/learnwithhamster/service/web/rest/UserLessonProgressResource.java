package com.learnwithhamster.service.web.rest;

import com.learnwithhamster.service.service.UserLessonProgressService;
import com.learnwithhamster.service.service.dto.UserLessonProgressDTO;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing user lesson progress.
 */
@RestController
@RequestMapping("/api/user-lesson-progress")
public class UserLessonProgressResource {

    private static final Logger LOG = LoggerFactory.getLogger(UserLessonProgressResource.class);

    private final UserLessonProgressService userLessonProgressService;

    public UserLessonProgressResource(UserLessonProgressService userLessonProgressService) {
        this.userLessonProgressService = userLessonProgressService;
    }

    /**
     * {@code POST  /user-lesson-progress/mark} : Mark a lesson as visited.
     *
     * @param request the mark request containing lessonId and courseId.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the progress record.
     */
    @PostMapping("/mark")
    public ResponseEntity<UserLessonProgressDTO> markProgress(@RequestBody MarkProgressRequest request) {
        LOG.debug("REST request to mark lesson progress: {}", request);
        UserLessonProgressDTO result = userLessonProgressService.markProgress(request.lessonId(), request.courseId());
        return ResponseEntity.ok(result);
    }

    /**
     * {@code GET  /user-lesson-progress/course/:courseId} : Get progress for a course.
     *
     * @param courseId the course ID.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of progress entries.
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<UserLessonProgressDTO>> getCourseProgress(@PathVariable("courseId") Long courseId) {
        LOG.debug("REST request to get course progress for course: {}", courseId);
        List<UserLessonProgressDTO> result = userLessonProgressService.getCourseProgress(courseId);
        return ResponseEntity.ok(result);
    }

    /**
     * Request body for marking lesson progress.
     */
    public record MarkProgressRequest(Long lessonId, Long courseId) {}
}
