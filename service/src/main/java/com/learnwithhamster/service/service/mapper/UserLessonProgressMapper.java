package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.UserLessonProgress;
import com.learnwithhamster.service.service.dto.UserLessonProgressDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link UserLessonProgress} and its DTO {@link UserLessonProgressDTO}.
 */
@Mapper(componentModel = "spring")
public interface UserLessonProgressMapper extends EntityMapper<UserLessonProgressDTO, UserLessonProgress> {}
