package com.learnwithhamster.service;

import com.learnwithhamster.service.config.AsyncSyncConfiguration;
import com.learnwithhamster.service.config.EmbeddedElasticsearch;
import com.learnwithhamster.service.config.EmbeddedSQL;
import com.learnwithhamster.service.config.JacksonConfiguration;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Base composite annotation for integration tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = { ServiceApp.class, JacksonConfiguration.class, AsyncSyncConfiguration.class })
@EmbeddedElasticsearch
@EmbeddedSQL
public @interface IntegrationTest {
}
