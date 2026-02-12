package com.learnwithhamster.service.service.mapper;

import static com.learnwithhamster.service.domain.DisciplineAsserts.*;
import static com.learnwithhamster.service.domain.DisciplineTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DisciplineMapperTest {

    private DisciplineMapper disciplineMapper;

    @BeforeEach
    void setUp() {
        disciplineMapper = new DisciplineMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getDisciplineSample1();
        var actual = disciplineMapper.toEntity(disciplineMapper.toDto(expected));
        assertDisciplineAllPropertiesEquals(expected, actual);
    }
}
