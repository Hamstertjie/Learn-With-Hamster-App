package com.learnwithhamster.service.service.mapper;

import static com.learnwithhamster.service.domain.ProgramAsserts.*;
import static com.learnwithhamster.service.domain.ProgramTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProgramMapperTest {

    private ProgramMapper programMapper;

    @BeforeEach
    void setUp() {
        programMapper = new ProgramMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getProgramSample1();
        var actual = programMapper.toEntity(programMapper.toDto(expected));
        assertProgramAllPropertiesEquals(expected, actual);
    }
}
