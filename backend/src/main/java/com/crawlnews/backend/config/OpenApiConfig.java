package com.crawlnews.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI crawlNewsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CrawlNews API")
                        .description("Vietnam News Crawling Platform - REST API")
                        .version("1.0.0")
                        .contact(new Contact().name("CrawlNews Team")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local"),
                        new Server().url("https://staging.crawlnews.example.com").description("Staging")
                ));
    }
}
