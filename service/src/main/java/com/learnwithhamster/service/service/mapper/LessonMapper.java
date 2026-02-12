package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.domain.Lesson;
import com.learnwithhamster.service.service.dto.CourseDTO;
import com.learnwithhamster.service.service.dto.LessonDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Lesson} and its DTO {@link LessonDTO}.
 */
@Mapper(componentModel = "spring")
public interface LessonMapper extends EntityMapper<LessonDTO, Lesson> {
    @Mapping(target = "courses", source = "courses", qualifiedByName = "courseIdSet")
    LessonDTO toDto(Lesson s);

    @Mapping(target = "courses", ignore = true)
    @Mapping(target = "removeCourses", ignore = true)
    Lesson toEntity(LessonDTO lessonDTO);

    @Named("courseId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    CourseDTO toDtoCourseId(Course course);

    @Named("courseIdSet")
    default Set<CourseDTO> toDtoCourseIdSet(Set<Course> course) {
        return course.stream().map(this::toDtoCourseId).collect(Collectors.toSet());
    }
}
