package com.learnwithhamster.service.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class DisciplineTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Discipline getDisciplineSample1() {
        return new Discipline()
            .id(1L)
            .disciplineName("disciplineName1")
            .disciplineDescription("disciplineDescription1")
            .disciplinePrice(1L);
    }

    public static Discipline getDisciplineSample2() {
        return new Discipline()
            .id(2L)
            .disciplineName("disciplineName2")
            .disciplineDescription("disciplineDescription2")
            .disciplinePrice(2L);
    }

    public static Discipline getDisciplineRandomSampleGenerator() {
        return new Discipline()
            .id(longCount.incrementAndGet())
            .disciplineName(UUID.randomUUID().toString())
            .disciplineDescription(UUID.randomUUID().toString())
            .disciplinePrice(longCount.incrementAndGet());
    }
}
