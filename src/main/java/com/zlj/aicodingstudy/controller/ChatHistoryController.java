package com.zlj.aicodingstudy.controller;

import com.mybatisflex.core.paginate.Page;
import com.mybatisflex.core.query.QueryWrapper;

import com.zlj.aicodingstudy.annotation.AuthCheck;
import com.zlj.aicodingstudy.common.BaseResponse;
import com.zlj.aicodingstudy.common.ResultUtils;
import com.zlj.aicodingstudy.constant.UserConstant;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.exception.ThrowUtils;
import com.zlj.aicodingstudy.model.dto.chathistory.ChatHistoryQueryRequest;
import com.zlj.aicodingstudy.model.entity.ChatHistory;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.service.ChatHistoryService;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 对话历史控制器。
 *
 * <p>提供对话历史的查询接口，统一使用 {@link BaseResponse} 包装返回结果。
 * 应用历史查询采用基于创建时间的游标分页方式，适合在对话记录持续新增的
 * 情况下向更早的历史翻页；管理员查询则复用通用查询请求，支持按条件分页
 * 查看全部应用的历史记录。</p>
 *
 * <p>控制器负责请求参数绑定、登录用户获取和管理员注解鉴权，具体的资源级
 * 权限校验、查询条件构造和数据库访问由 {@link ChatHistoryService} 完成。</p>
 */
@RestController
@RequestMapping("/chatHistory")
public class ChatHistoryController {

    @Resource
    // 负责对话历史的资源权限校验、查询条件构造和分页查询。
    private ChatHistoryService chatHistoryService;

    @Resource
    // 从 HTTP 请求中解析当前登录用户，通常基于 Session 信息完成身份识别。
    private UserService userService;

    /**
     * 分页查询指定应用的对话历史。
     *
     * <p>接口路径为 {@code GET /chatHistory/app/{appId}}。首次查询时不传
     * {@code lastCreateTime}，服务层默认从最新记录开始查询；后续请求将上一页
     * 最后一条记录的创建时间作为游标，只获取该时间之前的历史记录。</p>
     *
     * <p>本方法先从请求中获取登录用户，再交由服务层校验其是否为应用创建者或
     * 管理员。分页大小由服务层限制在 1 到 50 之间，当前接口默认每页 10 条。</p>
     *
     * @param appId 应用 ID，由路径变量提供
     * @param pageSize 每页返回的记录数，缺省为 10
     * @param lastCreateTime 游标时间，查询创建时间早于该时间的记录，首次查询可为空
     * @param request HTTP 请求对象，用于获取当前登录用户
     * @return 包含对话历史分页数据的统一响应
     */
    @GetMapping("/app/{appId}")
    public BaseResponse<Page<ChatHistory>> listAppChatHistory(@PathVariable Long appId,
                                                              @RequestParam(defaultValue = "10") int pageSize,
                                                              @RequestParam(required = false) LocalDateTime lastCreateTime,
                                                              HttpServletRequest request) {
        // 身份识别在控制器完成，资源级权限判断由服务层结合应用所属用户统一处理。
        User loginUser = userService.getLoginUser(request);
        // 服务层负责校验 appId、pageSize、应用是否存在以及当前用户是否有查看权限。
        Page<ChatHistory> result = chatHistoryService.listAppChatHistoryByPage(appId, pageSize, lastCreateTime, loginUser);
        // 统一转换为成功响应，保持前端调用各接口时的响应结构一致。
        return ResultUtils.success(result);
    }

    /**
     * 管理员分页查询全部应用的对话历史。
     *
     * <p>接口路径为 {@code POST /chatHistory/admin/list/page/vo}。方法上的
     * {@link AuthCheck} 会在进入方法前校验当前用户必须具备管理员角色；请求体
     * 为空时直接返回参数错误。其余查询字段由服务层转换为 MyBatis-Flex 的
     * {@link QueryWrapper}，并根据请求中的页码和页大小执行分页查询。</p>
     *
     * <p>该接口返回 {@link ChatHistory} 分页数据，查询请求可以包含应用 ID、用户
     * ID、消息类型、消息内容、创建时间游标及排序信息等过滤条件。</p>
     *
     * @param chatHistoryQueryRequest 查询请求体，包含过滤、排序和分页参数
     * @return 包含全部匹配记录的对话历史分页统一响应
     */
    @PostMapping("/admin/list/page/vo")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<ChatHistory>> listAllChatHistoryByPageForAdmin(@RequestBody ChatHistoryQueryRequest chatHistoryQueryRequest) {
        // 请求体为空时无法确定分页和过滤条件，必须在访问查询服务前终止请求。
        ThrowUtils.throwIf(chatHistoryQueryRequest == null, ErrorCode.PARAMS_ERROR);
        long pageNum = chatHistoryQueryRequest.getPageNum();
        long pageSize = chatHistoryQueryRequest.getPageSize();
        // 将 DTO 中的过滤条件转换为统一查询包装器，避免控制器直接拼接数据库条件。
        QueryWrapper queryWrapper = chatHistoryService.getQueryWrapper(chatHistoryQueryRequest);
        // 使用请求中的页码和页大小执行分页查询，结果由统一响应工具包装后返回。
        Page<ChatHistory> result = chatHistoryService.page(Page.of(pageNum, pageSize), queryWrapper);
        return ResultUtils.success(result);
    }

}
