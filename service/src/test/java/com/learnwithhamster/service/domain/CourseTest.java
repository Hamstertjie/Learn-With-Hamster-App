package com.learnwithhamster.service.domain;

import static com.learnwithhamster.service.domain.CourseTestSamples.*;
import static com.learnwithhamster.service.domain.LessonTestSamples.*;
import static com.learnwithhamster.service.domain.ProgramTestSamples.*;
import static com.learnwithhamster.service.domain.ResourceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CourseTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Course.class);
        Course course1 = getCourseSample1();
        Course course2 = new Course();
        assertThat(course1).isNotEqualTo(course2);

        course2.setId(course1.getId());
        assertThat(course1).isEqualTo(course2);

        course2 = getCourseSample2();
        assertThat(course1).isNotEqualTo(course2);
    }

    @Test
    void resourcesTest() {
        Course course = getCourseRandomSampleGenerator();
        Resource resourceBack = getResourceRandomSampleGenerator();

        course.addResources(resourceBack);
        assertThat(course.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getCourse()).isEqualTo(course);

        course.removeResources(resourceBack);
        assertThat(course.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getCourse()).isNull();

        course.resources(new HashSet<>(Set.of(resourceBack)));
        assertThat(course.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getCourse()).isEqualTo(course);

        course.setResources(new HashSet<>());
        assertThat(course.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getCourse()).isNull();
    }

    @Test
    void lessonsTest() {
        Course course = getCourseRandomSampleGenerator();
        Lesson lessonBack = getLessonRandomSampleGenerator();

        course.addLessons(lessonBack);
        assertThat(course.getLessons()).containsOnly(lessonBack);

        course.removeLessons(lessonBack);
        assertThat(course.getLessons()).doesNotContain(lessonBack);

        course.lessons(new HashSet<>(Set.of(lessonBack)));
        assertThat(course.getLessons()).containsOnly(lessonBack);

        course.setLessons(new HashSet<>());
        assertThat(course.getLessons()).doesNotContain(lessonBack);
    }

    @Test
    void programsTest() {
        Course course = getCourseRandomSampleGenerator();
        Program programBack = getProgramRandomSampleGenerator();

        course.addPrograms(programBack);
        assertThat(course.getPrograms()).containsOnly(programBack);
        assertThat(programBack.getCourses()).containsOnly(course);

        course.removePrograms(programBack);
        assertThat(course.getPrograms()).doesNotContain(programBack);
        assertThat(programBack.getCourses()).doesNotContain(course);

        course.programs(new HashSet<>(Set.of(programBack)));
        assertThat(course.getPrograms()).containsOnly(programBack);
        assertThat(programBack.getCourses()).containsOnly(course);

        course.setPrograms(new HashSet<>());
        assertThat(course.getPrograms()).doesNotContain(programBack);
        assertThat(programBack.getCourses()).doesNotContain(course);
    }
}
