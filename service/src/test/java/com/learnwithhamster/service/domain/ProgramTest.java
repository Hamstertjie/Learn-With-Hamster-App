package com.learnwithhamster.service.domain;

import static com.learnwithhamster.service.domain.CourseTestSamples.*;
import static com.learnwithhamster.service.domain.DisciplineTestSamples.*;
import static com.learnwithhamster.service.domain.ProgramTestSamples.*;
import static com.learnwithhamster.service.domain.ResourceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProgramTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Program.class);
        Program program1 = getProgramSample1();
        Program program2 = new Program();
        assertThat(program1).isNotEqualTo(program2);

        program2.setId(program1.getId());
        assertThat(program1).isEqualTo(program2);

        program2 = getProgramSample2();
        assertThat(program1).isNotEqualTo(program2);
    }

    @Test
    void resourcesTest() {
        Program program = getProgramRandomSampleGenerator();
        Resource resourceBack = getResourceRandomSampleGenerator();

        program.addResources(resourceBack);
        assertThat(program.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getProgram()).isEqualTo(program);

        program.removeResources(resourceBack);
        assertThat(program.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getProgram()).isNull();

        program.resources(new HashSet<>(Set.of(resourceBack)));
        assertThat(program.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getProgram()).isEqualTo(program);

        program.setResources(new HashSet<>());
        assertThat(program.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getProgram()).isNull();
    }

    @Test
    void coursesTest() {
        Program program = getProgramRandomSampleGenerator();
        Course courseBack = getCourseRandomSampleGenerator();

        program.addCourses(courseBack);
        assertThat(program.getCourses()).containsOnly(courseBack);

        program.removeCourses(courseBack);
        assertThat(program.getCourses()).doesNotContain(courseBack);

        program.courses(new HashSet<>(Set.of(courseBack)));
        assertThat(program.getCourses()).containsOnly(courseBack);

        program.setCourses(new HashSet<>());
        assertThat(program.getCourses()).doesNotContain(courseBack);
    }

    @Test
    void disciplinesTest() {
        Program program = getProgramRandomSampleGenerator();
        Discipline disciplineBack = getDisciplineRandomSampleGenerator();

        program.addDisciplines(disciplineBack);
        assertThat(program.getDisciplines()).containsOnly(disciplineBack);
        assertThat(disciplineBack.getPrograms()).containsOnly(program);

        program.removeDisciplines(disciplineBack);
        assertThat(program.getDisciplines()).doesNotContain(disciplineBack);
        assertThat(disciplineBack.getPrograms()).doesNotContain(program);

        program.disciplines(new HashSet<>(Set.of(disciplineBack)));
        assertThat(program.getDisciplines()).containsOnly(disciplineBack);
        assertThat(disciplineBack.getPrograms()).containsOnly(program);

        program.setDisciplines(new HashSet<>());
        assertThat(program.getDisciplines()).doesNotContain(disciplineBack);
        assertThat(disciplineBack.getPrograms()).doesNotContain(program);
    }
}
