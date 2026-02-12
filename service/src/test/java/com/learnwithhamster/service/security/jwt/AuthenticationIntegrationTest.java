package com.learnwithhamster.service.security.jwt;

import com.learnwithhamster.service.config.SecurityConfiguration;
import com.learnwithhamster.service.config.SecurityJwtConfiguration;
import com.learnwithhamster.service.config.WebConfigurer;
import com.learnwithhamster.service.management.SecurityMetersService;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;
import tech.jhipster.config.JHipsterProperties;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(
    classes = {
        JHipsterProperties.class,
        WebConfigurer.class,
        SecurityConfiguration.class,
        SecurityJwtConfiguration.class,
        SecurityMetersService.class,
        JwtAuthenticationTestUtils.class,
    }
)
public @interface AuthenticationIntegrationTest {
}
