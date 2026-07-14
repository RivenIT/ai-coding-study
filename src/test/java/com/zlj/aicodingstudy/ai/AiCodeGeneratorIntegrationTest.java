package com.zlj.aicodingstudy.ai;

import com.zlj.aicodingstudy.ai.model.HtmlCodeResult;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * 真实模型连通性测试。
 * 默认跳过，仅在 Maven 参数 runAiIntegration=true 时执行，避免日常测试产生模型调用费用。
 */
@SpringBootTest
@EnabledIfSystemProperty(named = "runAiIntegration", matches = "true")
class AiCodeGeneratorIntegrationTest {

    @Resource
    private AiCodeGeneratorService aiCodeGeneratorService;

    @Test
    void generatesNonEmptyHtmlFromTheConfiguredModel() {
        HtmlCodeResult result = aiCodeGeneratorService.generateHtmlCode(
                "生成一个完整的 HTML 页面，页面中必须包含标题“AI 集成测试成功”。"
        );

        assertNotNull(result, "模型应返回结构化 HTML 结果");
        assertNotNull(result.getHtmlCode(), "模型返回的 HTML 不能为空");
        assertFalse(result.getHtmlCode().isBlank(), "模型返回的 HTML 不能为空白");
    }
}
