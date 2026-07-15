package com.zlj.aicodingstudy.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.mybatisflex.core.util.SqlUtil;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.mapper.AppMapper;
import com.zlj.aicodingstudy.model.dto.app.AppQueryRequest;
import com.zlj.aicodingstudy.model.entity.App;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.vo.AppVO;
import com.zlj.aicodingstudy.model.vo.UserVO;
import com.zlj.aicodingstudy.service.AppService;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AppServiceImpl extends ServiceImpl<AppMapper, App> implements AppService {

    @Resource
    private UserService userService;

    @Override
    public boolean save(App app) {
        return SqlUtil.toBool(getMapper().insert(app, true));
    }


    /**
     * 根据 App 实体对象获取 AppVO 视图对象
     * 包含关联查询用户信息并转换为 UserVO
     *
     * @param app App 实体对象
     * @return 转换后的 AppVO 视图对象，如果传入的 app 为 null，则返回 null
     */
    @Override
    public AppVO getAppVO(App app) {
        // 如果传入的 app 对象为空，直接返回 null
        if (app == null) {
            return null;
        }
        // 创建 AppVO 对象并拷贝 app 的基础属性
        AppVO appVO = new AppVO();
        BeanUtil.copyProperties(app, appVO);

        // 关联查询用户信息
        Long userId = app.getUserId();
        if (userId != null) {
            // 根据用户 ID 获取 User 实体对象
            User user = userService.getById(userId);
            // 将 User 实体转换为 UserVO 视图对象
            UserVO userVO = userService.getUserVO(user);
            // 将用户视图对象设置到 AppVO 中
            appVO.setUser(userVO);
        }
        // 返回组装完成的 AppVO 对象
        return appVO;
    }

    /**
     * 根据应用查询请求构造 MyBatis-Flex 查询条件
     *
     * @param appQueryRequest 应用查询请求，包含筛选条件与排序参数
     * @return 返回查询条件对象
     * @throws BusinessException 当请求参数为 null 时抛出参数错误异常
     */
    @Override
    public QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest) {
        // 参数非空校验
        if (appQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数为空");
        }
        // 提取各筛选字段
        Long id = appQueryRequest.getId();
        String appName = appQueryRequest.getAppName();
        String cover = appQueryRequest.getCover();
        String initPrompt = appQueryRequest.getInitPrompt();
        String codeGenType = appQueryRequest.getCodeGenType();
        String deployKey = appQueryRequest.getDeployKey();
        Integer priority = appQueryRequest.getPriority();
        Long userId = appQueryRequest.getUserId();
        // 提取排序参数
        String sortField = appQueryRequest.getSortField();
        String sortOrder = appQueryRequest.getSortOrder();
        // 构建查询条件：字符串字段使用模糊匹配，其他字段使用精确匹配
        return QueryWrapper.create()
                // 按 id 精确匹配
                .eq("id", id)
                // 按应用名称模糊匹配
                .like("appName", appName)
                // 按应用封面模糊匹配
                .like("cover", cover)
                // 按初始化 prompt 模糊匹配
                .like("initPrompt", initPrompt)
                // 按代码生成类型精确匹配
                .eq("codeGenType", codeGenType)
                // 按部署标识精确匹配
                .eq("deployKey", deployKey)
                // 按优先级精确匹配
                .eq("priority", priority)
                // 按创建用户 id 精确匹配
                .eq("userId", userId)
                // 按指定字段排序，sortOrder 为 "ascend" 时升序，否则降序
                .orderBy(sortField, "ascend".equals(sortOrder));
    }


    /**
     * 批量将 App 实体列表转换为 AppVO 视图对象列表
     *
     * @param appList App 实体列表
     * @return 转换后的 AppVO 视图对象列表；若传入列表为空则返回空列表
     */
    @Override
    public List<AppVO> getAppVOList(List<App> appList) {
        // 空列表直接返回，避免后续无效处理
        if (CollUtil.isEmpty(appList)) {
            return new ArrayList<>();
        }
        // 收集所有不重复的用户 id，用于批量查询用户信息，避免 N+1 查询问题
        Set<Long> userIds = appList.stream()
                .map(App::getUserId)
                .collect(Collectors.toSet());
        // 批量查询用户并构建 userId -> UserVO 的映射，便于后续 O(1) 快速查找
        Map<Long, UserVO> userVOMap = userService.listByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, userService::getUserVO));
        // 遍历 App 列表，逐一转换为 AppVO 并填充关联的用户信息
        return appList.stream().map(app -> {
            // 将 App 实体基础属性拷贝到 AppVO
            AppVO appVO = getAppVO(app);
            // 从预查询的用户 Map 中取出对应的用户视图对象（避免再次查库）
            UserVO userVO = userVOMap.get(app.getUserId());
            // 将用户信息设置到 AppVO 中
            appVO.setUser(userVO);
            return appVO;
        }).collect(Collectors.toList());
    }
}
