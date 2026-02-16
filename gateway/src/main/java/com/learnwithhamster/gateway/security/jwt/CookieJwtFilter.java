package com.learnwithhamster.gateway.security.jwt;

import static com.learnwithhamster.gateway.security.jwt.JwtCookieConstants.JWT_COOKIE_NAME;

import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * WebFilter that extracts JWT from an HttpOnly cookie and injects it
 * as an Authorization Bearer header so the existing Spring Security
 * JWT resource server filter can validate it.
 */
@Component
public class CookieJwtFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (!StringUtils.hasText(authHeader)) {
            HttpCookie cookie = exchange.getRequest().getCookies().getFirst(JWT_COOKIE_NAME);
            if (cookie != null && StringUtils.hasText(cookie.getValue())) {
                ServerWebExchange mutatedExchange = exchange
                    .mutate()
                    .request(r -> r.headers(headers -> headers.setBearerAuth(cookie.getValue())))
                    .build();
                return chain.filter(mutatedExchange);
            }
        }

        return chain.filter(exchange);
    }
}
