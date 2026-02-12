package com.learnwithhamster.service.domain;

import static com.learnwithhamster.service.domain.CourseTestSamples.*;
import static com.learnwithhamster.service.domain.DisciplineTestSamples.*;
import static com.learnwithhamster.service.domain.LessonTestSamples.*;
import static com.learnwithhamster.service.domain.ProgramTestSamples.*;
import static com.learnwithhamster.service.domain.ResourceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ResourceTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Resource.class);
        Resource resource1 = getResourceSample1();
        Resource resource2 = new Resource();
        assertThat(resource1).isNotEqualTo(resource2);

        resource2.setId(resource1.getId());
        assertThat(resource1).isEqualTo(resource2);

        resource2 = getResourceSample2();
        assertThat(resource1).isNotEqualTo(resource2);
    }

    @Test
    void disciplineTest() {
        Resource resource = getResourceRandomSampleGenerator();
        Discipline disciplineBack = getDisciplineRandomSampleGenerator();

        resource.setDiscipline(disciplineBack);
        assertThat(resource.getDiscipline()).isEqualTo(disciplineBack);

        resource.discipline(null);
        assertThat(resource.getDiscipline()).isNull();
    }

    @Test
    void programTest() {
        Resource resource = getResourceRandomSampleGenerator();
        Program programBack = getProgramRandomSampleGenerator();

        resource.setProgram(programBack);
        assertThat(resource.getProgram()).isEqualTo(programBack);

        resource.program(null);
        assertThat(resource.getProgram()).isNull();
    }

    @Test
    void courseTest() {
        Resource resource = getResourceRandomSampleGenerator();
        Course courseBack = getCourseRandomSampleGenerator();

        resource.setCourse(courseBack);
        assertThat(resource.getCourse()).isEqualTo(courseBack);

        resource.course(null);
        assertThat(resource.getCourse()).isNull();
    }

    @Test
    void lessonTest() {
        Resource resource = getResourceRandomSampleGenerator();
        Lesson lessonBack = getLessonRandomSampleGenerator();

        resource.setLesson(lessonBack);
        assertThat(resource.getLesson()).isEqualTo(lessonBack);

        resource.lesson(null);
        assertThat(resource.getLesson()).isNull();
    }
}
