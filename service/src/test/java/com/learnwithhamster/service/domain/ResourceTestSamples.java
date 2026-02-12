package com.learnwithhamster.service.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class ResourceTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static Resource getResourceSample1() {
        return new Resource()
            .id(1L)
            .resourceName("resourceName1")
            .resourceDescription("resourceDescription1")
            .resourceURL("resourceURL1")
            .resourcePreviewImage("resourcePreviewImage1")
            .weight(1);
    }

    public static Resource getResourceSample2() {
        return new Resource()
            .id(2L)
            .resourceName("resourceName2")
            .resourceDescription("resourceDescription2")
            .resourceURL("resourceURL2")
            .resourcePreviewImage("resourcePreviewImage2")
            .weight(2);
    }

    public static Resource getResourceRandomSampleGenerator() {
        return new Resource()
            .id(longCount.incrementAndGet())
            .resourceName(UUID.randomUUID().toString())
            .resourceDescription(UUID.randomUUID().toString())
            .resourceURL(UUID.randomUUID().toString())
            .resourcePreviewImage(UUID.randomUUID().toString())
            .weight(intCount.incrementAndGet());
    }
}
