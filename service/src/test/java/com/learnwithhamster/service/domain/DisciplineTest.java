package com.learnwithhamster.service.domain;

import static com.learnwithhamster.service.domain.DisciplineTestSamples.*;
import static com.learnwithhamster.service.domain.ProgramTestSamples.*;
import static com.learnwithhamster.service.domain.ResourceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class DisciplineTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Discipline.class);
        Discipline discipline1 = getDisciplineSample1();
        Discipline discipline2 = new Discipline();
        assertThat(discipline1).isNotEqualTo(discipline2);

        discipline2.setId(discipline1.getId());
        assertThat(discipline1).isEqualTo(discipline2);

        discipline2 = getDisciplineSample2();
        assertThat(discipline1).isNotEqualTo(discipline2);
    }

    @Test
    void resourcesTest() {
        Discipline discipline = getDisciplineRandomSampleGenerator();
        Resource resourceBack = getResourceRandomSampleGenerator();

        discipline.addResources(resourceBack);
        assertThat(discipline.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getDiscipline()).isEqualTo(discipline);

        discipline.removeResources(resourceBack);
        assertThat(discipline.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getDiscipline()).isNull();

        discipline.resources(new HashSet<>(Set.of(resourceBack)));
        assertThat(discipline.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getDiscipline()).isEqualTo(discipline);

        discipline.setResources(new HashSet<>());
        assertThat(discipline.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getDiscipline()).isNull();
    }

    @Test
    void programsTest() {
        Discipline discipline = getDisciplineRandomSampleGenerator();
        Program programBack = getProgramRandomSampleGenerator();

        discipline.addPrograms(programBack);
        assertThat(discipline.getPrograms()).containsOnly(programBack);

        discipline.removePrograms(programBack);
        assertThat(discipline.getPrograms()).doesNotContain(programBack);

        discipline.programs(new HashSet<>(Set.of(programBack)));
        assertThat(discipline.getPrograms()).containsOnly(programBack);

        discipline.setPrograms(new HashSet<>());
        assertThat(discipline.getPrograms()).doesNotContain(programBack);
    }
}
