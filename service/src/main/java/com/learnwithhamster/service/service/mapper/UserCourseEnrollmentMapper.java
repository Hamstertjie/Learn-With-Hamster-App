package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.UserCourseEnrollment;
import com.learnwithhamster.service.service.dto.UserCourseEnrollmentDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link UserCourseEnrollment} and its DTO {@link UserCourseEnrollmentDTO}.
 */
@Mapper(componentModel = "spring")
public interface UserCourseEnrollmentMapper extends EntityMapper<UserCourseEnrollmentDTO, UserCourseEnrollment> {}
