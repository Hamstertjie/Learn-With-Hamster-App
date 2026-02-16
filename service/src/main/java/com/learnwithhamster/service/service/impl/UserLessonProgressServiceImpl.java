package com.learnwithhamster.service.service.impl;

import com.learnwithhamster.service.domain.UserLessonProgress;
import com.learnwithhamster.service.repository.UserLessonProgressRepository;
import com.learnwithhamster.service.security.SecurityUtils;
import com.learnwithhamster.service.service.UserLessonProgressService;
import com.learnwithhamster.service.service.dto.UserLessonProgressDTO;
import com.learnwithhamster.service.service.mapper.UserLessonProgressMapper;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.learnwithhamster.service.domain.UserLessonProgress}.
 */
@Service
@Transactional
public class UserLessonProgressServiceImpl implements UserLessonProgressService {

    private static final Logger LOG = LoggerFactory.getLogger(UserLessonProgressServiceImpl.class);

    private final UserLessonProgressRepository userLessonProgressRepository;
    private final UserLessonProgressMapper userLessonProgressMapper;

    public UserLessonProgressServiceImpl(
        UserLessonProgressRepository userLessonProgressRepository,
        UserLessonProgressMapper userLessonProgressMapper
    ) {
        this.userLessonProgressRepository = userLessonProgressRepository;
        this.userLessonProgressMapper = userLessonProgressMapper;
    }

    @Override
    public UserLessonProgressDTO markProgress(Long lessonId, Long courseId) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        LOG.debug("Request to mark progress for user {} on lesson {}", userLogin, lessonId);

        UserLessonProgress progress = userLessonProgressRepository
            .findByUserLoginAndLessonId(userLogin, lessonId)
            .orElseGet(() -> {
                UserLessonProgress newProgress = new UserLessonProgress();
                newProgress.setUserLogin(userLogin);
                newProgress.setLessonId(lessonId);
                newProgress.setCourseId(courseId);
                newProgress.setStartedAt(Instant.now());
                newProgress.setCompleted(true);
                return newProgress;
            });

        // Update course context if it was null before
        if (progress.getCourseId() == null && courseId != null) {
            progress.setCourseId(courseId);
        }
        progress.setCompleted(true);

        progress = userLessonProgressRepository.save(progress);
        return userLessonProgressMapper.toDto(progress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserLessonProgressDTO> getCourseProgress(Long courseId) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("User not authenticated"));
        LOG.debug("Request to get course progress for user {} on course {}", userLogin, courseId);

        return userLessonProgressMapper.toDto(
            userLessonProgressRepository.findByUserLoginAndCourseId(userLogin, courseId)
        );
    }
}
