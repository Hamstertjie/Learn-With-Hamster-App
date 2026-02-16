package com.learnwithhamster.service.repository;

import com.learnwithhamster.service.domain.UserCourseEnrollment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the UserCourseEnrollment entity.
 */
@Repository
public interface UserCourseEnrollmentRepository extends JpaRepository<UserCourseEnrollment, Long> {
    List<UserCourseEnrollment> findByUserLogin(String userLogin);

    Optional<UserCourseEnrollment> findByUserLoginAndCourseId(String userLogin, Long courseId);

    void deleteByUserLoginAndCourseId(String userLogin, Long courseId);
}
