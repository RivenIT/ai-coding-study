package com.zlj.aicodingstudy.core;

import com.zlj.aicodingstudy.ai.AiCodeGeneratorService;
import com.zlj.aicodingstudy.ai.AiCodeGeneratorServiceFactory;
import com.zlj.aicodingstudy.ai.model.HtmlCodeResult;
import com.zlj.aicodingstudy.ai.model.MultiFileCodeResult;
import com.zlj.aicodingstudy.core.parser.CodeParserExecutor;
import com.zlj.aicodingstudy.core.saver.CodeFileSaverExecutor;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.model.enums.CodeGenTypeEnum;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.io.File;

/**
 * AI 代码生成门面。
 *
 * <p>该类向上层调用方提供统一的代码生成入口，隐藏不同生成类型在
 * {@link AiCodeGeneratorService}、代码解析器和文件保存器之间的编排细节。调用方只需提供
 * 用户提示词和生成类型，即可完成“生成代码 → 解析结果 → 保存到本地”的完整流程。</p>
 *
 * <p>同步入口在生成完成后直接返回保存目录；流式入口则先将模型输出原样转发给客户端，
 * 同时在流结束时汇总完整内容并执行解析与保存。因此，流式保存失败不会中断已经发送的
 * 内容，失败原因会记录在日志中。</p>
 */
@Service
@Slf4j
public class AiCodeGeneratorFacade {

    /**
     * AI 代码生成服务，负责根据用户提示词调用对应的模型生成能力。
     */
    @Resource
    private AiCodeGeneratorServiceFactory aiCodeGeneratorServiceFactory;

    /**
     * 同步生成代码并保存到本地文件系统。
     *
     * <p>该方法首先根据应用 ID 获取对应的 AI 代码生成服务，然后按照生成类型调用相应的
     * 代码生成方法，并将结构化结果交给文件保存执行器。当前支持单文件 HTML 和多文件两种
     * 生成类型。</p>
     *
     * @param userMessage 用户输入的代码生成需求或提示词
     * @param codeGenTypeEnum 代码生成类型，用于选择生成方法和文件保存策略
     * @param appId 应用 ID，用于获取该应用对应的 AI 代码生成服务及确定保存目录
     * @return 生成代码成功保存后的目录
     * @throws BusinessException 当生成类型为空或不受支持时抛出
     */
    public File generateAndSaveCode(String userMessage, CodeGenTypeEnum codeGenTypeEnum,Long appId) {
        // 在进入 switch 前校验，避免空值导致分发逻辑出现不可预期的异常。
        if (codeGenTypeEnum == null) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "生成类型为空");
        }
        //根据appId获取相应的ai服务实例
        AiCodeGeneratorService aiCodeGeneratorService =
                aiCodeGeneratorServiceFactory.getAiCodeGeneratorService(appId);
        return switch (codeGenTypeEnum) {
            case HTML -> {
                // HTML 类型的模型结果可直接交由对应保存器落盘。
                HtmlCodeResult result = aiCodeGeneratorService.generateHtmlCode(userMessage);
                yield CodeFileSaverExecutor.executeSaver(result, CodeGenTypeEnum.HTML,appId);
            }
            case MULTI_FILE -> {
                // 多文件类型包含多个文件的结构化信息，由多文件保存器分别创建文件。
                MultiFileCodeResult result = aiCodeGeneratorService.generateMultiFileCode(userMessage);
                yield CodeFileSaverExecutor.executeSaver(result, CodeGenTypeEnum.MULTI_FILE,appId);
            }
            default -> {
                // 枚举扩展新类型后，若未在此处显式实现，返回清晰的业务异常而非静默失败。
                String errorMessage = "不支持的生成类型：" + codeGenTypeEnum.getValue();
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, errorMessage);
            }
        };
    }

    /**
     * 流式生成代码，并在模型输出正常结束后保存完整结果。
     *
     * <p>该方法根据应用 ID 获取对应的 AI 代码生成服务，再按照生成类型创建代码输出流。
     * 返回的 {@link Flux} 会实时向订阅方发送模型生成的代码片段，同时通过
     * {@link #processCodeStream(Flux, CodeGenTypeEnum, Long)} 收集完整内容，并在流结束后解析、
     * 保存到本地文件系统。</p>
     *
     * @param userMessage 用户输入的代码生成需求或提示词
     * @param codeGenTypeEnum 代码生成类型，用于选择流式生成方法和后续保存策略
     * @param appId 应用 ID，用于获取该应用对应的 AI 代码生成服务及确定保存目录
     * @return 持续输出代码文本片段的响应流
     * @throws BusinessException 当生成类型为空或不受支持时抛出
     */
    public Flux<String> generateAndSaveCodeStream(String userMessage, CodeGenTypeEnum codeGenTypeEnum,
                                                  Long appId) {
        // 与同步入口保持一致的前置校验，确保后续分发始终基于有效类型。
        if (codeGenTypeEnum == null) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "生成类型为空");
        }
        AiCodeGeneratorService aiCodeGeneratorService =
                aiCodeGeneratorServiceFactory.getAiCodeGeneratorService(appId);
        return switch (codeGenTypeEnum) {
            case HTML -> {
                // 获取 HTML 的流式输出，并附加统一的收集、解析和保存处理。
                Flux<String> codeStream = aiCodeGeneratorService.generateHtmlCodeStream(userMessage);
                yield processCodeStream(codeStream, CodeGenTypeEnum.HTML, appId);
            }
            case MULTI_FILE -> {
                // 获取多文件代码的流式输出，并附加统一的收集、解析和保存处理。
                Flux<String> codeStream = aiCodeGeneratorService.generateMultiFileCodeStream(userMessage);
                yield processCodeStream(codeStream, CodeGenTypeEnum.MULTI_FILE, appId);
            }
            default -> {
                // 防止未来新增枚举类型时被误当作已支持的生成方式。
                String errorMessage = "不支持的生成类型：" + codeGenTypeEnum.getValue();
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, errorMessage);
            }
        };
    }

    /**
     * 为代码输出流附加内容收集、解析和文件保存处理。
     *
     * <p>每收到一个代码片段，就按原始顺序追加到缓冲区；当上游流正常完成时，将汇总后的
     * 完整文本解析成对应类型的代码结果并保存到本地。该方法不会主动订阅或阻塞原始流，
     * 返回值仍会向下游原样传递所有代码片段。</p>
     *
     * <p>如果解析或保存失败，只记录错误日志，不改变已经输出的流式响应。</p>
     *
     * @param codeStream AI 模型输出的代码片段流
     * @param codeGenType 代码生成类型，用于选择对应的解析器和文件保存器
     * @param appId 应用 ID，用于确定生成代码的保存目录
     * @return 附加了流结束后解析和保存逻辑的代码输出流
     */
    private Flux<String> processCodeStream(Flux<String> codeStream, CodeGenTypeEnum codeGenType, Long appId) {
        // StringBuilder 仅服务于当前一次方法调用，用来还原被拆分发送的完整生成结果。
        StringBuilder codeBuilder = new StringBuilder();
        return codeStream.doOnNext(chunk -> {
            // 模型输出可能被拆为多个 chunk，必须按接收顺序拼接，才能交给解析器处理。
            codeBuilder.append(chunk);
        }).doOnComplete(() -> {
            // 只有收到正常完成信号，才说明已获得可供解析的完整代码。
            try {
                String completeCode = codeBuilder.toString();
                // 执行器根据类型选择对应解析器，将文本转换为保存器所需的结果对象。
                Object parsedResult = CodeParserExecutor.executeParser(completeCode, codeGenType);
                // 执行器再根据类型选择保存器，创建目录和文件并返回保存位置。
                File savedDir = CodeFileSaverExecutor.executeSaver(parsedResult, codeGenType, appId);
                log.info("保存成功，路径为：" + savedDir.getAbsolutePath());
            } catch (Exception e) {
                // 流已经输出完成，保存失败仅记录日志，避免改变已完成流的对外语义。
                log.error("保存失败: {}", e.getMessage());
            }
        });
    }
}
