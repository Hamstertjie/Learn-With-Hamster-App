package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.service.dto.CourseDTO;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Program} and its DTO {@link ProgramDTO}.
 */
@Mapper(componentModel = "spring")
public interface ProgramMapper extends EntityMapper<ProgramDTO, Program> {
    @Mapping(target = "courses", source = "courses", qualifiedByName = "courseIdSet")
    @Mapping(target = "disciplines", source = "disciplines", qualifiedByName = "disciplineIdSet")
    ProgramDTO toDto(Program s);

    @Mapping(target = "removeCourses", ignore = true)
    @Mapping(target = "disciplines", ignore = true)
    @Mapping(target = "removeDisciplines", ignore = true)
    Program toEntity(ProgramDTO programDTO);

    @Named("courseId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    CourseDTO toDtoCourseId(Course course);

    @Named("courseIdSet")
    default Set<CourseDTO> toDtoCourseIdSet(Set<Course> course) {
        return course.stream().map(this::toDtoCourseId).collect(Collectors.toSet());
    }

    @Named("disciplineId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    DisciplineDTO toDtoDisciplineId(Discipline discipline);

    @Named("disciplineIdSet")
    default Set<DisciplineDTO> toDtoDisciplineIdSet(Set<Discipline> discipline) {
        return discipline.stream().map(this::toDtoDisciplineId).collect(Collectors.toSet());
    }
}
