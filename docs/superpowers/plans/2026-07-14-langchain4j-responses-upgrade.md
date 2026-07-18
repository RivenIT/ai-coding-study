# LangChain4j Responses API Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Upgrade LangChain4j and use /v1/responses without changing the public AI service, facade, parsers, savers, result types, or controllers.

**Architecture:** Remove the Chat Completions Spring starter, bind gateway settings under app.ai.responses, and define named ChatModel and StreamingChatModel beans backed by the LangChain4j Responses implementations. AiServices and all business callers keep their existing interfaces.

**Tech Stack:** Java 21, Spring Boot 3.5.15, LangChain4j 1.17.2 / 1.17.2-beta27, JUnit 5, Reactor.

---

## Files

- Modify: pom.xml
- Create: src/main/java/com/zlj/aicodingstudy/config/AiResponsesProperties.java
- Modify: src/main/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorServiceFactory.java
- Modify: src/main/resources/application.yaml
- Modify: src/main/resources/application-local.yaml
- Create: src/test/java/com/zlj/aicodingstudy/ai/AiResponsesModelConfigurationTest.java
- Retain: src/test/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorIntegrationTest.java

### Task 1: Add the red regression test

**Files:**

- Create: src/test/java/com/zlj/aicodingstudy/ai/AiResponsesModelConfigurationTest.java

- [ ] **Step 1: Write this test before changing production code**

~~~
package com.zlj.aicodingstudy.ai;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "app.ai.responses.base-url=https://gateway.example.test/v1",
        "app.ai.responses.api-key=test-key",
        "app.ai.responses.model-name=test-model",
        "app.ai.responses.max-output-tokens=81920",
        "app.ai.responses.log-requests=false",
        "app.ai.responses.log-responses=false"
})
class AiResponsesModelConfigurationTest {

    @Resource(name = "chatModel")
    private ChatModel chatModel;

    @Resource(name = "streamingChatModel")
    private StreamingChatModel streamingChatModel;

    @Test
    void configuresResponsesApiModelsForExistingAiService() {
        assertEquals(
                "dev.langchain4j.model.openai.OpenAiResponsesChatModel",
                chatModel.getClass().getName()
        );
        assertEquals(
                "dev.langchain4j.model.openai.OpenAiResponsesStreamingChatModel",
                streamingChatModel.getClass().getName()
        );
    }
}
~~~

- [ ] **Step 2: Verify the test is red**

Run:

~~~
cmd.exe /d /s /c "set OPENAI_API_KEY=test-key&& mvn -Dtest=AiResponsesModelConfigurationTest test"
~~~

Expected: FAIL because the current named beans are Chat Completions models.

### Task 2: Upgrade and configure Responses models

**Files:**

- Modify: pom.xml
- Create: src/main/java/com/zlj/aicodingstudy/config/AiResponsesProperties.java
- Modify: src/main/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorServiceFactory.java
- Modify: src/main/resources/application.yaml
- Modify: src/main/resources/application-local.yaml

- [ ] **Step 1: Replace only the four LangChain4j dependency blocks in pom.xml**

~~~
<!-- LangChain4j -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.17.2</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.17.2</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
    <version>1.17.2-beta27</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-redis-spring-boot-starter</artifactId>
    <version>1.17.2-beta27</version>
</dependency>
~~~

Remove langchain4j-open-ai-spring-boot-starter. Its auto-configuration creates Chat Completions model beans, which cannot target a responses-only gateway.

- [ ] **Step 2: Create the settings record**

Create src/main/java/com/zlj/aicodingstudy/config/AiResponsesProperties.java:

~~~
package com.zlj.aicodingstudy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.responses")
public record AiResponsesProperties(
        String baseUrl,
        String apiKey,
        String modelName,
        Integer maxOutputTokens,
        boolean logRequests,
        boolean logResponses
) {
}
~~~

- [ ] **Step 3: Replace the factory with named Responses model beans**

Replace src/main/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorServiceFactory.java:

~~~
package com.zlj.aicodingstudy.ai;

import com.zlj.aicodingstudy.config.AiResponsesProperties;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.openai.OpenAiResponsesChatModel;
import dev.langchain4j.model.openai.OpenAiResponsesStreamingChatModel;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.Resource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AiResponsesProperties.class)
public class AiCodeGeneratorServiceFactory {

    @Resource
    private ChatModel chatModel;

    @Resource
    private StreamingChatModel streamingChatModel;

    @Bean
    public ChatModel chatModel(AiResponsesProperties properties) {
        return OpenAiResponsesChatModel.builder()
                .baseUrl(properties.baseUrl())
                .apiKey(properties.apiKey())
                .modelName(properties.modelName())
                .maxOutputTokens(properties.maxOutputTokens())
                .logRequests(properties.logRequests())
                .logResponses(properties.logResponses())
                .build();
    }

    @Bean
    public StreamingChatModel streamingChatModel(AiResponsesProperties properties) {
        return OpenAiResponsesStreamingChatModel.builder()
                .baseUrl(properties.baseUrl())
                .apiKey(properties.apiKey())
                .modelName(properties.modelName())
                .maxOutputTokens(properties.maxOutputTokens())
                .logRequests(properties.logRequests())
                .logResponses(properties.logResponses())
                .build();
    }

    @Bean
    public AiCodeGeneratorService aiCodeGeneratorService() {
        return AiServices.builder(AiCodeGeneratorService.class)
                .chatModel(chatModel)
                .streamingChatModel(streamingChatModel)
                .build();
    }
}
~~~

- [ ] **Step 4: Replace the model configuration in application.yaml**

Keep langchain4j.community.redis.enabled: false. Remove the langchain4j.open-ai section and add:

~~~
app:
  ai:
    responses:
      base-url: ${OPENAI_BASE_URL:https://vip.j3gb.com/v1}
      api-key: ${OPENAI_API_KEY}
      model-name: ${OPENAI_MODEL_NAME:gpt-5.6-terra}
      max-output-tokens: 81920
      log-requests: false
      log-responses: false
~~~

- [ ] **Step 5: Replace the local streaming-only override in application-local.yaml**

Remove the langchain4j.open-ai block and add:

~~~
app:
  ai:
    responses:
      base-url: ${OPENAI_BASE_URL:https://vip.j3gb.com/v1}
      api-key: ${OPENAI_API_KEY}
      model-name: ${OPENAI_MODEL_NAME:gpt-5.6-terra}
      max-output-tokens: 81920
      log-requests: true
      log-responses: true
~~~

- [ ] **Step 6: Verify the regression test turns green**

Run:

~~~
cmd.exe /d /s /c "set OPENAI_API_KEY=test-key&& mvn -Dtest=AiResponsesModelConfigurationTest test"
~~~

Expected: BUILD SUCCESS, without an HTTP request.

### Task 3: Verify compatibility and gateway behavior

**Files:**

- Test: src/test/java/com/zlj/aicodingstudy/ai/AiResponsesModelConfigurationTest.java
- Test: src/test/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorIntegrationTest.java

- [ ] **Step 1: Run all non-network tests**

~~~
cmd.exe /d /s /c "set OPENAI_API_KEY=test-key&& mvn test"
~~~

Expected: BUILD SUCCESS. The existing integration test remains skipped without runAiIntegration=true.

- [ ] **Step 2: Run the existing opt-in provider test**

~~~
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}
cmd.exe /d /s /c "mvn -DrunAiIntegration=true -Dtest=AiCodeGeneratorIntegrationTest test"
~~~

Expected: BUILD SUCCESS and a non-blank HtmlCodeResult.htmlCode. A failure here is a gateway capability or credential problem, not a change to application business logic.

- [ ] **Step 3: Confirm no business-logic files changed**

~~~
git diff --check
git diff -- pom.xml src/main/java/com/zlj/aicodingstudy/config/AiResponsesProperties.java src/main/java/com/zlj/aicodingstudy/ai/AiCodeGeneratorServiceFactory.java src/main/resources/application.yaml src/main/resources/application-local.yaml src/test/java/com/zlj/aicodingstudy/ai/AiResponsesModelConfigurationTest.java
~~~

Expected: no whitespace errors and no changes to AiCodeGeneratorService, AiCodeGeneratorFacade, parsers, savers, controllers, or result models.
