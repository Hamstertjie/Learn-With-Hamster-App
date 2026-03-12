package com.learnwithhamster.service.repository;

import com.learnwithhamster.service.domain.UserLessonProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the UserLessonProgress entity.
 */
@Repository
public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, Long> {
    List<UserLessonProgress> findByUserLoginAndCourseId(String userLogin, Long courseId);

    Optional<UserLessonProgress> findByUserLoginAndLessonId(String userLogin, Long lessonId);

    @Query("SELECT COALESCE(SUM(p.pointsEarned), 0) FROM UserLessonProgress p WHERE p.userLogin = :login AND p.completed = true")
    Integer sumPointsByUserLogin(@Param("login") String login);
}
