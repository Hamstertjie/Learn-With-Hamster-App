package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.UserCourseEnrollment;
import com.learnwithhamster.service.repository.UserCourseEnrollmentRepository;
import com.learnwithhamster.service.security.SecurityUtils;
import com.learnwithhamster.service.service.UserCourseEnrollmentService;
import com.learnwithhamster.service.service.dto.UserCourseEnrollmentDTO;
import com.learnwithhamster.service.service.mapper.UserCourseEnrollmentMapper;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.UserCourseEnrollment}.
 */
@Service
@Transactional
public class UserCourseEnrollmentServiceImpl implements UserCourseEnrollmentService {

    private static final Logger LOG = LoggerFactory.getLogger(UserCourseEnrollmentServiceImpl.class);

    private final UserCourseEnrollmentRepository userCourseEnrollmentRepository;
    private final UserCourseEnrollmentMapper userCourseEnrollmentMapper;

    public UserCourseEnrollmentServiceImpl(
        UserCourseEnrollmentRepository userCourseEnrollmentRepository,
        UserCourseEnrollmentMapper userCourseEnrollmentMapper
    ) {
        this.userCourseEnrollmentRepository = userCourseEnrollmentRepository;
        this.userCourseEnrollmentMapper = userCourseEnrollmentMapper;
    }

    @Override
    public UserCourseEnrollmentDTO enroll(Long courseId) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        LOG.debug("Request to enroll user {} in course {}", userLogin, courseId);

        UserCourseEnrollment enrollment = userCourseEnrollmentRepository
            .findByUserLoginAndCourseId(userLogin, courseId)
            .orElseGet(() -> {
                UserCourseEnrollment newEnrollment = new UserCourseEnrollment();
                newEnrollment.setUserLogin(userLogin);
                newEnrollment.setCourseId(courseId);
                newEnrollment.setEnrolledAt(Instant.now());
                return newEnrollment;
            });

        enrollment = userCourseEnrollmentRepository.save(enrollment);
        return userCourseEnrollmentMapper.toDto(enrollment);
    }

    @Override
    public void unenroll(Long courseId) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        LOG.debug("Request to unenroll user {} from course {}", userLogin, courseId);
        userCourseEnrollmentRepository.deleteByUserLoginAndCourseId(userLogin, courseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserCourseEnrollmentDTO> getEnrollments() {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        LOG.debug("Request to get enrollments for user {}", userLogin);
        return userCourseEnrollmentMapper.toDto(
            userCourseEnrollmentRepository.findByUserLogin(userLogin)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEnrolled(Long courseId) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        return userCourseEnrollmentRepository.findByUserLoginAndCourseId(userLogin, courseId).isPresent();
    }
}
