# LangChain4j Responses API Upgrade Design

## Goal

Upgrade LangChain4j so the application calls an OpenAI-compatible gateway that exposes only `/v1/responses`, while preserving all existing AI code-generation business behavior and public service APIs.

## Scope and constraints

- Preserve `AiCodeGeneratorService`, `AiCodeGeneratorFacade`, result objects, parsing, and file-saving behavior.
- Keep synchronous structured generation and streaming generation available through the existing service methods.
- Do not change controllers, generated-file formats, user-management code, or persistence behavior.
- Use the configured gateway base URL, key, and model name through configuration rather than hard-coding them in Java.
- Keep the real-provider test opt-in so normal builds do not spend API quota.

## Options considered

### A. Upgrade and configure LangChain4j Responses models directly (recommended)

Upgrade all LangChain4j artifacts to compatible current releases, then define `OpenAiResponsesChatModel` and `OpenAiResponsesStreamingChatModel` as the `ChatModel` and `StreamingChatModel` beans consumed by `AiServices`.

This retains the application-facing `AiCodeGeneratorService` interface because both Responses models implement the same LangChain4j model abstractions. It is the smallest change that matches a gateway exposing only `/v1/responses`.

### B. Add a gateway-side Chat Completions compatibility layer

Keep the current application configuration and translate `/v1/chat/completions` to `/v1/responses` outside the application. This avoids a Java dependency upgrade but requires infrastructure the gateway does not currently provide.

### C. Implement an application-local HTTP translation layer

Build a custom client that translates Chat Completions requests into Responses requests. This duplicates LangChain4j protocol handling and would create a maintenance surface without preserving more business behavior than option A.

## Chosen design

Use option A.

1. Align `langchain4j` and the existing Spring/reactor/Redis artifacts to the current compatible release set: core OpenAI artifact version `1.17.2` and Spring integration artifacts version `1.17.2-beta27`.
2. Move model endpoint settings to an application-owned configuration prefix so the OpenAI Spring starter does not create Chat Completions model beans from `langchain4j.open-ai.chat-model` settings.
3. Create two explicit beans named `chatModel` and `streamingChatModel` in `AiCodeGeneratorServiceFactory` using `OpenAiResponsesChatModel` and `OpenAiResponsesStreamingChatModel`.
4. Keep the existing `AiServices.builder(AiCodeGeneratorService.class)` construction unchanged, so callers continue using the same synchronous structured-return and `Flux<String>` streaming methods.
5. Add a non-network Spring context test asserting that both injected model beans are Responses API implementations. Retain the opt-in real-provider integration test to validate a non-empty structured response after a valid key is configured.

## Data flow

`AiCodeGeneratorFacade` → `AiCodeGeneratorService` → `AiServices` → `OpenAiResponsesChatModel` or `OpenAiResponsesStreamingChatModel` → gateway `/v1/responses`.

The facade, parsers, and savers receive exactly the same result types and text chunks as before; only the HTTP transport implementation changes.

## Compatibility and error handling

- A successful build proves source compatibility; the existing integration test proves real gateway compatibility.
- The gateway must accept Bearer-token authentication and support the requested model identifier.
- Structured results require the gateway/model to support the Responses API features LangChain4j uses for structured output. If it rejects them, the integration test will expose the provider error without changing business logic.
- Streaming requires the gateway to emit standard Responses API streaming events. The `Flux<String>` service signature remains unchanged.

## Verification

1. Run the new context test and the existing test suite after the dependency upgrade.
2. Run the real integration test only with `runAiIntegration=true` and a valid gateway key.
3. Confirm the model returns a non-empty `HtmlCodeResult.htmlCode`; this preserves the existing end-to-end contract.
