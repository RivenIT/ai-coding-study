package com.zlj.aicodingstudy.controller;

import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.service.AppService;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppControllerTest {

    @Mock
    private AppService appService;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AppController appController;

    @Test
    void emitsBusinessErrorAndDoneWhenGenerationStreamFails() {
        User loginUser = new User();
        when(userService.getLoginUser(request)).thenReturn(loginUser);
        when(appService.chatToGenCode(1L, "生成一个页面", loginUser))
                .thenReturn(Flux.error(new IllegalStateException("Redis authentication failed")));

        List<ServerSentEvent<String>> events = appController.chatToGenCode(1L, "生成一个页面", request)
                .onErrorResume(error -> Mono.just(ServerSentEvent.<String>builder()
                        .event("unhandled")
                        .data(error.getMessage())
                        .build()))
                .collectList()
                .block();

        assertThat(events).extracting(ServerSentEvent::event)
                .containsExactly("business-error", "done");
    }
}
