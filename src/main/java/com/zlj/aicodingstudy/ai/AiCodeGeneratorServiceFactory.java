package com.zlj.aicodingstudy.ai;


import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI 代码生成服务工厂类
 * <p>通过 LangChain4j 的 {@link AiServices} 构建器，将 {@link AiCodeGeneratorService} 接口
 * 动态代理为 Bean 并注入到 Spring 容器中。
 * 代理对象会将接口方法调用自动转发给底层的大语言模型。</p>
 *
 * @see AiCodeGeneratorService
 * @see AiServices
 */

@Configuration(proxyBeanMethods = false)
public class AiCodeGeneratorServiceFactory {

    /** 同步聊天模型，用于非流式代码生成（如 generateHtmlCode、generateMultiFileCode） */
    @Resource
    private ChatModel chatModel;

    /** 流式聊天模型，用于流式代码生成（如 generateHtmlCodeStream、generateMultiFileCodeStream） */
    @Resource
    private StreamingChatModel streamingChatModel;

    /**
     * 创建 AI 代码生成服务的 Spring Bean
     * <p>使用 {@link AiServices#builder(Class)} 构建动态代理对象：
     * <ul>
     *     <li>{@code chatModel} —— 绑定同步聊天模型，支持返回结构化结果</li>
     *     <li>{@code streamingChatModel} —— 绑定流式聊天模型，支持返回 {@code Flux<String>} 流式结果</li>
     * </ul>
     * 接口中通过 {@code @SystemMessage} 注解指定的提示词模板会在调用时自动加载。
     *
     * @return AiCodeGeneratorService 的动态代理实例
     */
    @Bean
    public AiCodeGeneratorService aiCodeGeneratorService() {
        return AiServices.builder(AiCodeGeneratorService.class)
                .chatModel(chatModel)                    // 设置同步聊天模型
                .streamingChatModel(streamingChatModel)  // 设置流式聊天模型
                .build();                                // 构建并返回代理对象
    }

}
