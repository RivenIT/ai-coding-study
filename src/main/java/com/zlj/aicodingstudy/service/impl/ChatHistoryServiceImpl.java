package com.zlj.aicodingstudy.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.mybatisflex.core.paginate.Page;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.zlj.aicodingstudy.constant.UserConstant;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.exception.ThrowUtils;
import com.zlj.aicodingstudy.mapper.ChatHistoryMapper;
import com.zlj.aicodingstudy.model.dto.chathistory.ChatHistoryQueryRequest;
import com.zlj.aicodingstudy.model.entity.App;
import com.zlj.aicodingstudy.model.entity.ChatHistory;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.enums.ChatHistoryMessageTypeEnum;
import com.zlj.aicodingstudy.service.AppService;
import com.zlj.aicodingstudy.service.ChatHistoryService;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 对话历史服务实现。
 *
 * <p>该类负责对话历史的持久化和查询，并负责将数据库中的历史消息恢复到
 * LangChain4j 的 {@link MessageWindowChatMemory} 中。对话历史以应用 ID 作为
 * 主要归属维度，消息类型通过 {@link ChatHistoryMessageTypeEnum} 区分用户消息
 * 和 AI 消息。</p>
 *
 * <p>需要注意的是，管理端或应用创建者才能查看指定应用的历史记录；而将历史
 * 加载到会话记忆属于内部上下文恢复流程，加载失败时会记录日志并返回 0，避免
 * 因历史数据异常阻断当前对话请求。</p>
 *
 * @author <a href="https://github.com/liyupi">程序员鱼皮</a>
 */
@Service
@Slf4j
public class ChatHistoryServiceImpl extends ServiceImpl<ChatHistoryMapper, ChatHistory> implements ChatHistoryService {

    @Resource
    @Lazy
    // 查询应用信息并校验应用创建者权限。使用懒加载可以降低服务之间发生循环依赖时的初始化风险。
    private AppService appService;

    /**
     * 保存一条对话消息。
     *
     * <p>方法会先校验应用、用户、消息内容和消息类型，确保写入的数据具备完整
     * 的关联关系，并且消息类型只能是 {@code user} 或 {@code ai}。校验通过后，
     * 由父类的 {@code save} 方法执行实际的数据库插入。</p>
     *
     * @param appId 应用 ID
     * @param message 消息文本
     * @param messageType 消息类型，取值为 {@code user} 或 {@code ai}
     * @param userId 创建这条历史记录的用户 ID
     * @return 是否保存成功
     */
    @Override
    public boolean addChatMessage(Long appId, String message, String messageType, Long userId) {
        // 应用 ID 和用户 ID 同时承担关联关系和权限判断依据，必须是正数。
        ThrowUtils.throwIf(appId == null || appId <= 0, ErrorCode.PARAMS_ERROR, "应用ID不能为空");
        ThrowUtils.throwIf(StrUtil.isBlank(message), ErrorCode.PARAMS_ERROR, "消息内容不能为空");
        ThrowUtils.throwIf(StrUtil.isBlank(messageType), ErrorCode.PARAMS_ERROR, "消息类型不能为空");
        ThrowUtils.throwIf(userId == null || userId <= 0, ErrorCode.PARAMS_ERROR, "用户ID不能为空");
        // 通过枚举统一约束消息类型，避免数据库中出现无法恢复为聊天消息的未知类型。
        ChatHistoryMessageTypeEnum messageTypeEnum = ChatHistoryMessageTypeEnum.getEnumByValue(messageType);
        ThrowUtils.throwIf(messageTypeEnum == null, ErrorCode.PARAMS_ERROR, "不支持的消息类型");
        // 只组装当前方法负责的字段，主键和创建/更新时间由实体配置或持久化框架处理。
        ChatHistory chatHistory = ChatHistory.builder()
                .appId(appId)
                .message(message)
                .messageType(messageType)
                .userId(userId)
                .build();
        return this.save(chatHistory);
    }

    /**
     * 删除指定应用下的全部对话历史。
     *
     * <p>删除条件只使用应用 ID，因此该方法适用于应用被删除或需要清理应用
     * 全量上下文的场景。{@code remove} 会沿用 MyBatis-Flex 对实体配置的处理，
     * 包括 {@link ChatHistory} 上配置的逻辑删除行为。</p>
     *
     * @param appId 应用 ID
     * @return 是否删除成功
     */
    @Override
    public boolean deleteByAppId(Long appId) {
        ThrowUtils.throwIf(appId == null || appId <= 0, ErrorCode.PARAMS_ERROR, "应用ID不能为空");
        // 使用应用 ID 作为唯一过滤条件，确保不会误删其他应用的历史记录。
        QueryWrapper queryWrapper = QueryWrapper.create()
                .eq("appId", appId);
        return this.remove(queryWrapper);
    }

    /**
     * 按游标分页查询指定应用的对话历史。
     *
     * <p>调用方传入上一页最后一条记录的创建时间后，查询条件会筛选出创建时间
     * 更早的记录，从而实现向更早历史翻页。查询前会校验登录状态，并且只允许
     * 应用创建者或管理员访问，避免仅凭应用 ID 泄露对话内容。</p>
     *
     * @param appId 应用 ID
     * @param pageSize 每页数量，范围为 1 到 50
     * @param lastCreateTime 上一页最后一条记录的创建时间，首次查询可为空
     * @param loginUser 当前登录用户
     * @return 当前游标位置对应的一页对话历史
     */
    @Override
    public Page<ChatHistory> listAppChatHistoryByPage(Long appId, int pageSize,
                                                      LocalDateTime lastCreateTime,
                                                      User loginUser) {
        // 校验参数
        ThrowUtils.throwIf(appId == null || appId <= 0, ErrorCode.PARAMS_ERROR, "应用ID不能为空");
        ThrowUtils.throwIf(pageSize <= 0 || pageSize > 50, ErrorCode.PARAMS_ERROR, "页面大小必须在1-50之间");
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NOT_LOGIN_ERROR);

        // 先读取应用并确认资源存在，再根据应用创建者和管理员身份进行资源级鉴权。
        App app = appService.getById(appId);
        ThrowUtils.throwIf(app == null, ErrorCode.NOT_FOUND_ERROR, "应用不存在");
        boolean isAdmin = UserConstant.ADMIN_ROLE.equals(loginUser.getUserRole());
        boolean isCreator = app.getUserId().equals(loginUser.getId());
        ThrowUtils.throwIf(!isAdmin && !isCreator, ErrorCode.NO_AUTH_ERROR, "无权查看该应用的对话历史");

        // 复用统一查询构造逻辑，使应用过滤、游标过滤和默认排序保持一致。
        ChatHistoryQueryRequest queryRequest = new ChatHistoryQueryRequest();
        queryRequest.setAppId(appId);
        queryRequest.setLastCreateTime(lastCreateTime);
        QueryWrapper queryWrapper = this.getQueryWrapper(queryRequest);

        // 使用固定的第一页配合 createTime 游标，而不是依赖 offset，避免历史数据新增或删除造成分页漂移。
        return this.page(Page.of(1, pageSize), queryWrapper);

    }

    /**
     * 将指定应用的最近历史消息加载到聊天记忆中。
     *
     * <p>数据库查询先按创建时间倒序取最近 {@code maxCount} 条记录，随后将结果
     * 反转为正序再写入记忆，保证模型看到的消息顺序与真实对话顺序一致。写入前
     * 会清空已有记忆，避免同一会话重复加载导致上下文重复。</p>
     *
     * <p>该方法用于恢复上下文而不是核心数据写入：查询、消息转换或记忆写入任一
     * 环节失败时都会记录完整异常并返回 0，让上层可以继续进行没有历史上下文的
     * 新对话。</p>
     *
     * @param appId 应用 ID
     * @param chatMemory 待填充的窗口型聊天记忆
     * @param maxCount 最多加载的历史消息数量
     * @return 实际加载到记忆中的消息数量，失败或没有历史记录时返回 0
     */
    @Override
    public int  loadChatHistoryToMemory(Long appId, MessageWindowChatMemory chatMemory, int maxCount) {
        try {
            // 先取最新消息以限制查询量；数据库结果是倒序的，便于直接获得最近的 maxCount 条记录。
            QueryWrapper queryWrapper = QueryWrapper.create()
                    .eq(ChatHistory::getAppId, appId)
                    .orderBy(ChatHistory::getCreateTime, false)
                    .limit(1, maxCount);
            List<ChatHistory> historyList = this.list(queryWrapper);
            // 没有找到历史记录时直接返回 0
            if (CollUtil.isEmpty(historyList)) {
                return 0;
            }
            // 记忆必须按时间正序接收消息：旧消息先加入，新消息后加入。
            historyList = historyList.reversed();
            int loadedCount = 0;
            // 先清理历史缓存，防止在重试或重新进入会话时出现重复上下文。
            chatMemory.clear();
            for (ChatHistory history : historyList) {
                // 将持久化层的消息类型转换为 LangChain4j 的消息对象，才能参与后续模型调用。
                if (ChatHistoryMessageTypeEnum.USER.getValue().equals(history.getMessageType())) {
                    chatMemory.add(UserMessage.from(history.getMessage()));
                } else if (ChatHistoryMessageTypeEnum.AI.getValue().equals(history.getMessageType())) {
                    chatMemory.add(AiMessage.from(history.getMessage()));
                }
                // 当前数据由写入方法校验过消息类型，因此每条记录都计入加载数量。
                loadedCount++;
            }
            log.info("成功为 appId: {} 加载 {} 条历史消息", appId, loadedCount);
            return loadedCount;
        } catch (Exception e) {
            log.error("加载历史对话失败，appId: {}, error: {}", appId, e.getMessage(), e);
            // 加载失败不影响系统运行，只是当前请求没有历史上下文可用。
            return 0;
        }
    }

    /**
     * 根据查询请求构造 MyBatis-Flex 查询条件。
     *
     * <p>该方法集中处理对话历史的通用过滤条件：主键精确匹配、消息内容模糊
     * 匹配、消息类型、应用 ID 和用户 ID 精确匹配。若传入游标，则只查询创建
     * 时间早于游标的记录；若未指定排序字段，则默认按创建时间倒序，优先返回
     * 最新记录。</p>
     *
     * <p>查询请求为空时返回不带条件的包装类，由调用方决定是否允许执行该查询。</p>
     *
     * @param chatHistoryQueryRequest 对话历史查询请求，可为空
     * @return 已拼装过滤条件和排序规则的查询包装类
     */
    @Override
    public QueryWrapper getQueryWrapper(ChatHistoryQueryRequest chatHistoryQueryRequest) {
        QueryWrapper queryWrapper = QueryWrapper.create();
        if (chatHistoryQueryRequest == null) {
            // 保持通用 IService 查询接口的兼容性：没有请求对象时返回空包装类。
            return queryWrapper;
        }
        Long id = chatHistoryQueryRequest.getId();
        String message = chatHistoryQueryRequest.getMessage();
        String messageType = chatHistoryQueryRequest.getMessageType();
        Long appId = chatHistoryQueryRequest.getAppId();
        Long userId = chatHistoryQueryRequest.getUserId();
        LocalDateTime lastCreateTime = chatHistoryQueryRequest.getLastCreateTime();
        String sortField = chatHistoryQueryRequest.getSortField();
        String sortOrder = chatHistoryQueryRequest.getSortOrder();
        // QueryWrapper 会根据各字段值拼接对应条件；空值条件由框架按其默认规则处理。
        queryWrapper.eq("id", id)
                .like("message", message)
                .eq("messageType", messageType)
                .eq("appId", appId)
                .eq("userId", userId);
        // 游标只使用创建时间，并查询更早的数据，配合默认倒序实现稳定的历史翻页。
        if (lastCreateTime != null) {
            queryWrapper.lt("createTime", lastCreateTime);
        }
        // 允许后台按请求指定字段和方向排序；未指定时统一按创建时间倒序。
        if (StrUtil.isNotBlank(sortField)) {
            queryWrapper.orderBy(sortField, "ascend".equals(sortOrder));
        } else {
            queryWrapper.orderBy("createTime", false);
        }
        return queryWrapper;
    }
}
