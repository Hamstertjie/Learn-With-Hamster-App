package com.learnwithhamster.service.service;

import com.learnwithhamster.service.service.dto.UserLessonProgressDTO;
import java.util.List;

/**
 * Service Interface for managing {@link com.learnwithhamster.service.domain.UserLessonProgress}.
 */
public interface UserLessonProgressService {
    /**
     * Idempotently mark a lesson as visited for the current user.
     *
     * @param lessonId the lesson ID.
     * @param courseId the course ID (optional context).
     * @return the progress record.
     */
    UserLessonProgressDTO markProgress(Long lessonId, Long courseId);

    /**
     * Get all progress entries for the current user in a given course.
     *
     * @param courseId the course ID.
     * @return list of progress entries.
     */
    List<UserLessonProgressDTO> getCourseProgress(Long courseId);
}
