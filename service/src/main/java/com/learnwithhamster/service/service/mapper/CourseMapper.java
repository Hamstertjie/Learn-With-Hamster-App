package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.domain.Lesson;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.service.dto.CourseDTO;
import com.learnwithhamster.service.service.dto.LessonDTO;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Course} and its DTO {@link CourseDTO}.
 */
@Mapper(componentModel = "spring")
public interface CourseMapper extends EntityMapper<CourseDTO, Course> {
    @Mapping(target = "lessons", source = "lessons", qualifiedByName = "lessonIdSet")
    @Mapping(target = "programs", source = "programs", qualifiedByName = "programIdSet")
    CourseDTO toDto(Course s);

    @Mapping(target = "removeLessons", ignore = true)
    @Mapping(target = "programs", ignore = true)
    @Mapping(target = "removePrograms", ignore = true)
    Course toEntity(CourseDTO courseDTO);

    @Named("lessonId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    LessonDTO toDtoLessonId(Lesson lesson);

    @Named("lessonIdSet")
    default Set<LessonDTO> toDtoLessonIdSet(Set<Lesson> lesson) {
        return lesson.stream().map(this::toDtoLessonId).collect(Collectors.toSet());
    }

    @Named("programId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ProgramDTO toDtoProgramId(Program program);

    @Named("programIdSet")
    default Set<ProgramDTO> toDtoProgramIdSet(Set<Program> program) {
        return program.stream().map(this::toDtoProgramId).collect(Collectors.toSet());
    }
}
