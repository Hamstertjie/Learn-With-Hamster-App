package com.learnwithhamster.service.repository;

import com.learnwithhamster.service.domain.UserLessonProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the UserLessonProgress entity.
 */
@Repository
public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, Long> {
    List<UserLessonProgress> findByUserLoginAndCourseId(String userLogin, Long courseId);

    Optional<UserLessonProgress> findByUserLoginAndLessonId(String userLogin, Long lessonId);
}
