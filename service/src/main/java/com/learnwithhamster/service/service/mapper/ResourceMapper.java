package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.domain.Lesson;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.domain.Resource;
import com.learnwithhamster.service.service.dto.CourseDTO;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
import com.learnwithhamster.service.service.dto.LessonDTO;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import com.learnwithhamster.service.service.dto.ResourceDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Resource} and its DTO {@link ResourceDTO}.
 */
@Mapper(componentModel = "spring")
public interface ResourceMapper extends EntityMapper<ResourceDTO, Resource> {
    @Mapping(target = "discipline", source = "discipline", qualifiedByName = "disciplineId")
    @Mapping(target = "program", source = "program", qualifiedByName = "programId")
    @Mapping(target = "course", source = "course", qualifiedByName = "courseId")
    @Mapping(target = "lesson", source = "lesson", qualifiedByName = "lessonId")
    ResourceDTO toDto(Resource s);

    @Named("disciplineId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    DisciplineDTO toDtoDisciplineId(Discipline discipline);

    @Named("programId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ProgramDTO toDtoProgramId(Program program);

    @Named("courseId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    CourseDTO toDtoCourseId(Course course);

    @Named("lessonId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    LessonDTO toDtoLessonId(Lesson lesson);
}
