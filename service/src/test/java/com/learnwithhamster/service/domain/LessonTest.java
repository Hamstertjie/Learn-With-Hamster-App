package com.learnwithhamster.service.domain;

import static com.learnwithhamster.service.domain.CourseTestSamples.*;
import static com.learnwithhamster.service.domain.LessonTestSamples.*;
import static com.learnwithhamster.service.domain.ResourceTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.learnwithhamster.service.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class LessonTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Lesson.class);
        Lesson lesson1 = getLessonSample1();
        Lesson lesson2 = new Lesson();
        assertThat(lesson1).isNotEqualTo(lesson2);

        lesson2.setId(lesson1.getId());
        assertThat(lesson1).isEqualTo(lesson2);

        lesson2 = getLessonSample2();
        assertThat(lesson1).isNotEqualTo(lesson2);
    }

    @Test
    void resourcesTest() {
        Lesson lesson = getLessonRandomSampleGenerator();
        Resource resourceBack = getResourceRandomSampleGenerator();

        lesson.addResources(resourceBack);
        assertThat(lesson.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getLesson()).isEqualTo(lesson);

        lesson.removeResources(resourceBack);
        assertThat(lesson.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getLesson()).isNull();

        lesson.resources(new HashSet<>(Set.of(resourceBack)));
        assertThat(lesson.getResources()).containsOnly(resourceBack);
        assertThat(resourceBack.getLesson()).isEqualTo(lesson);

        lesson.setResources(new HashSet<>());
        assertThat(lesson.getResources()).doesNotContain(resourceBack);
        assertThat(resourceBack.getLesson()).isNull();
    }

    @Test
    void coursesTest() {
        Lesson lesson = getLessonRandomSampleGenerator();
        Course courseBack = getCourseRandomSampleGenerator();

        lesson.addCourses(courseBack);
        assertThat(lesson.getCourses()).containsOnly(courseBack);
        assertThat(courseBack.getLessons()).containsOnly(lesson);

        lesson.removeCourses(courseBack);
        assertThat(lesson.getCourses()).doesNotContain(courseBack);
        assertThat(courseBack.getLessons()).doesNotContain(lesson);

        lesson.courses(new HashSet<>(Set.of(courseBack)));
        assertThat(lesson.getCourses()).containsOnly(courseBack);
        assertThat(courseBack.getLessons()).containsOnly(lesson);

        lesson.setCourses(new HashSet<>());
        assertThat(lesson.getCourses()).doesNotContain(courseBack);
        assertThat(courseBack.getLessons()).doesNotContain(lesson);
    }
}
