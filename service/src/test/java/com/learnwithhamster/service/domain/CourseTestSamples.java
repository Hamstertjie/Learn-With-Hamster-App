package com.learnwithhamster.service.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class CourseTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Course getCourseSample1() {
        return new Course().id(1L).courseTitle("courseTitle1").courseDescription("courseDescription1").coursePrice(1L);
    }

    public static Course getCourseSample2() {
        return new Course().id(2L).courseTitle("courseTitle2").courseDescription("courseDescription2").coursePrice(2L);
    }

    public static Course getCourseRandomSampleGenerator() {
        return new Course()
            .id(longCount.incrementAndGet())
            .courseTitle(UUID.randomUUID().toString())
            .courseDescription(UUID.randomUUID().toString())
            .coursePrice(longCount.incrementAndGet());
    }
}
