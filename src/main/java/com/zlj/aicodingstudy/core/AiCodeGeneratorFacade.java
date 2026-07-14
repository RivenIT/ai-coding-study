package com.zlj.aicodingstudy.core;

import com.zlj.aicodingstudy.ai.AiCodeGeneratorService;
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
    private AiCodeGeneratorService aiCodeGeneratorService;

    /**
     * 同步生成代码并将生成结果保存到本地。
     *
     * <p>方法会按生成类型选择对应的 AI 生成接口，并将其结构化结果交给
     * {@link CodeFileSaverExecutor}。保存器会继续选择与生成类型匹配的实现，最终返回
     * 生成文件所在的目录。</p>
     *
     * @param userMessage 用户输入的需求描述或提示词
     * @param codeGenTypeEnum 目标代码的生成类型，用于决定模型调用方式和保存策略
     * @return 本次生成内容成功保存后的目录
     * @throws BusinessException 当生成类型为空或当前类型没有对应的处理逻辑时抛出
     */
    public File generateAndSaveCode(String userMessage, CodeGenTypeEnum codeGenTypeEnum) {
        // 在进入 switch 前校验，避免空值导致分发逻辑出现不可预期的异常。
        if (codeGenTypeEnum == null) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "生成类型为空");
        }
        return switch (codeGenTypeEnum) {
            case HTML -> {
                // HTML 类型的模型结果可直接交由对应保存器落盘。
                HtmlCodeResult result = aiCodeGeneratorService.generateHtmlCode(userMessage);
                yield CodeFileSaverExecutor.executeSaver(result, CodeGenTypeEnum.HTML);
            }
            case MULTI_FILE -> {
                // 多文件类型包含多个文件的结构化信息，由多文件保存器分别创建文件。
                MultiFileCodeResult result = aiCodeGeneratorService.generateMultiFileCode(userMessage);
                yield CodeFileSaverExecutor.executeSaver(result, CodeGenTypeEnum.MULTI_FILE);
            }
            default -> {
                // 枚举扩展新类型后，若未在此处显式实现，返回清晰的业务异常而非静默失败。
                String errorMessage = "不支持的生成类型：" + codeGenTypeEnum.getValue();
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, errorMessage);
            }
        };
    }

    /**
     * 流式生成代码，并在流正常结束后保存完整结果。
     *
     * <p>返回的 {@link Flux} 会将模型产生的每个文本片段立即传递给订阅方，避免客户端等待
     * 全部代码生成完成。与此同时，内部会收集这些片段；只有上游流发出完成信号后，才会解析
     * 汇总内容并保存文件。</p>
     *
     * @param userMessage 用户输入的需求描述或提示词
     * @param codeGenTypeEnum 目标代码的生成类型，用于决定流式模型调用和后续保存策略
     * @return 向调用方持续输出模型代码片段的响应流
     * @throws BusinessException 当生成类型为空或当前类型没有对应的处理逻辑时抛出
     */
    public Flux<String> generateAndSaveCodeStream(String userMessage, CodeGenTypeEnum codeGenTypeEnum) {
        // 与同步入口保持一致的前置校验，确保后续分发始终基于有效类型。
        if (codeGenTypeEnum == null) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "生成类型为空");
        }
        return switch (codeGenTypeEnum) {
            case HTML -> {
                // 获取 HTML 的流式输出，并附加统一的收集、解析和保存处理。
                Flux<String> codeStream = aiCodeGeneratorService.generateHtmlCodeStream(userMessage);
                yield processCodeStream(codeStream, CodeGenTypeEnum.HTML);
            }
            case MULTI_FILE -> {
                // 获取多文件代码的流式输出，并附加统一的收集、解析和保存处理。
                Flux<String> codeStream = aiCodeGeneratorService.generateMultiFileCodeStream(userMessage);
                yield processCodeStream(codeStream, CodeGenTypeEnum.MULTI_FILE);
            }
            default -> {
                // 防止未来新增枚举类型时被误当作已支持的生成方式。
                String errorMessage = "不支持的生成类型：" + codeGenTypeEnum.getValue();
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, errorMessage);
            }
        };
    }

    /**
     * 为模型输出流附加收集与落盘的后处理逻辑。
     *
     * <p>该方法不会订阅或阻塞传入的流，而是返回一个新的装饰流：每收到一个片段就在
     * {@code doOnNext} 中追加到缓冲区；当上游正常完成时，在 {@code doOnComplete} 中将完整
     * 文本解析为对应类型的结果对象，并调用保存器写入文件系统。原始片段仍会按原顺序继续
     * 传递给下游订阅者。</p>
     *
     * <p>解析或保存失败时仅记录错误日志，不向已经完成输出的客户端补发异常，以避免文件系统
     * 后处理问题影响流式代码展示。</p>
     *
     * @param codeStream 上游模型返回的代码片段流
     * @param codeGenType 当前片段对应的代码生成类型，用于选择解析器和保存器
     * @return 保留原始代码片段输出、且在完成时执行保存操作的流
     */
    private Flux<String> processCodeStream(Flux<String> codeStream, CodeGenTypeEnum codeGenType) {
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
                File savedDir = CodeFileSaverExecutor.executeSaver(parsedResult, codeGenType);
                log.info("保存成功，路径为：" + savedDir.getAbsolutePath());
            } catch (Exception e) {
                // 流已经输出完成，保存失败仅记录日志，避免改变已完成流的对外语义。
                log.error("保存失败: {}", e.getMessage());
            }
        });
    }
}
