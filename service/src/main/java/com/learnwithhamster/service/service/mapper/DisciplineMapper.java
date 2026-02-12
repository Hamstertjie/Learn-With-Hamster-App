package com.learnwithhamster.service.service.mapper;

import com.learnwithhamster.service.domain.Discipline;
import com.learnwithhamster.service.domain.Program;
import com.learnwithhamster.service.service.dto.DisciplineDTO;
import com.learnwithhamster.service.service.dto.ProgramDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Discipline} and its DTO {@link DisciplineDTO}.
 */
@Mapper(componentModel = "spring")
public interface DisciplineMapper extends EntityMapper<DisciplineDTO, Discipline> {
    @Mapping(target = "programs", source = "programs", qualifiedByName = "programIdSet")
    DisciplineDTO toDto(Discipline s);

    @Mapping(target = "removePrograms", ignore = true)
    Discipline toEntity(DisciplineDTO disciplineDTO);

    @Named("programId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ProgramDTO toDtoProgramId(Program program);

    @Named("programIdSet")
    default Set<ProgramDTO> toDtoProgramIdSet(Set<Program> program) {
        return program.stream().map(this::toDtoProgramId).collect(Collectors.toSet());
    }
}
