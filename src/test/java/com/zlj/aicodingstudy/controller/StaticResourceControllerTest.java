package com.zlj.aicodingstudy.controller;

import com.zlj.aicodingstudy.constant.AppConstant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;

class StaticResourceControllerTest {

    private final String deployKey = "vue_project_static-preview-" + System.nanoTime();
    private final Path projectDir = Path.of(AppConstant.CODE_OUTPUT_ROOT_DIR, deployKey);

    @AfterEach
    void cleanUp() throws IOException {
        if (Files.notExists(projectDir)) {
            return;
        }

        try (var paths = Files.walk(projectDir)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.delete(path);
                } catch (IOException exception) {
                    throw new IllegalStateException(exception);
                }
            });
        }
    }

    @Test
    void servesBuiltVueIndexWhenDistExists() throws IOException {
        Files.createDirectories(projectDir.resolve("dist"));
        Files.writeString(projectDir.resolve("index.html"), "source index", StandardCharsets.UTF_8);
        Files.writeString(projectDir.resolve("dist/index.html"), "built index", StandardCharsets.UTF_8);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/static/" + deployKey + "/");
        request.setAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE,
                "/static/" + deployKey + "/"
        );

        ResponseEntity<Resource> response = new StaticResourceController().serveStaticResource(deployKey, request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(new String(response.getBody().getInputStream().readAllBytes(), StandardCharsets.UTF_8))
                .isEqualTo("built index");
    }
}
