package com.zlj.aicodingstudy.controller;

import cn.hutool.core.bean.BeanUtil;
import com.mybatisflex.core.paginate.Page;
import com.zlj.aicodingstudy.annotation.AuthCheck;
import com.zlj.aicodingstudy.common.BaseResponse;
import com.zlj.aicodingstudy.common.DeleteRequest;
import com.zlj.aicodingstudy.common.ResultUtils;
import com.zlj.aicodingstudy.constant.UserConstant;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.exception.ThrowUtils;
import com.zlj.aicodingstudy.model.dto.user.*;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.vo.LoginUserVO;
import com.zlj.aicodingstudy.model.vo.UserVO;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {
    @Resource
    private UserService userService;

    /**
     * 用户注册
     *
     * @param userRegisterRequest 用户注册请求体
     * @return 新用户id
     */
    @RequestMapping("/register")
    public BaseResponse<Long> userRegister(@RequestBody UserRegisterRequest userRegisterRequest) {
        //1.校验参数
        ThrowUtils.throwIf(userRegisterRequest == null, ErrorCode.PARAMS_ERROR);
        String userAccount = userRegisterRequest.getUserAccount();
        String userPassword = userRegisterRequest.getUserPassword();
        String checkPassword = userRegisterRequest.getCheckPassword();
        long result = userService.userRegister(userAccount, userPassword, checkPassword);
        return ResultUtils.success(result);
    }

    /**
     * 用户登录
     *
     * @param userLoginRequest 用户登录请求体
     * @param request          请求对象
     * @return 脱敏后的用户登录信息
     */
    @RequestMapping("/login")
    public BaseResponse<LoginUserVO> userLogin(@RequestBody UserLoginRequest userLoginRequest,
                                               HttpServletRequest request) {
        ThrowUtils.throwIf(userLoginRequest == null, ErrorCode.PARAMS_ERROR);//参数校验
        String userAccount = userLoginRequest.getUserAccount();
        String userPassword = userLoginRequest.getUserPassword();
        LoginUserVO loginUserVO = userService.userLogin(userAccount, userPassword, request);
        return ResultUtils.success(loginUserVO);
    }

    /**
     * 获取当前登录用户信息
     *
     * @param request HTTP 请求对象，用于从 Session 中获取登录用户
     * @return 脱敏后的登录用户信息
     */
    @GetMapping("/get/login")
    public BaseResponse<LoginUserVO> getLoginUser(HttpServletRequest request) {
        // 从 Session 中获取当前登录用户
        User loginUser = userService.getLoginUser(request);
        // 转换为脱敏的登录用户视图对象
        return ResultUtils.success(userService.getLoginUserVO(loginUser));
    }


    /**
     * 用户注销（登出）
     *
     * @param request HTTP 请求对象，用于清除 Session 中的登录信息
     * @return 注销是否成功
     */
    @PostMapping("/logout")
    public BaseResponse<Boolean> userLogout(HttpServletRequest request) {
        ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);
        // 清除 Session 中的登录用户信息
        boolean result = userService.userLogout(request);
        return ResultUtils.success(result);
    }

    /**
     * 创建用户（仅管理员）
     * <p>管理员手动创建新用户，默认密码为 12345678</p>
     *
     * @param userAddRequest 用户创建请求，包含用户名、账号等信息
     * @return 创建成功后返回新用户 id
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addUser(@RequestBody UserAddRequest userAddRequest) {
        ThrowUtils.throwIf(userAddRequest == null, ErrorCode.PARAMS_ERROR);
        User user = new User();
        // 将请求属性复制到用户实体
        BeanUtil.copyProperties(userAddRequest, user);
        // 设置默认密码并进行加密处理
        final String DEFAULT_PASSWORD = "12345678";
        String encryptPassword = userService.getEncryptPassword(DEFAULT_PASSWORD);
        // 将加密后的密码赋值给用户实体
        user.setUserPassword(encryptPassword);

        // 将新用户持久化到数据库，save 成功返回 true，失败返回 false
        boolean result = userService.save(user);
        // 若保存失败则抛出操作异常
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        // 保存成功后返回新创建的用户 id
        return ResultUtils.success(user.getId());
    }

    /**
     * 根据 id 获取用户完整信息（仅管理员）
     * <p>返回完整的 User 实体，包含敏感信息，仅限管理员调用</p>
     *
     * @param id 用户 id，必须大于 0
     * @return 用户完整信息
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<User> getUserById(long id) {
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        User user = userService.getById(id);
        ThrowUtils.throwIf(user == null, ErrorCode.NOT_FOUND_ERROR, "用户不存在");
        return ResultUtils.success(user);
    }

    /**
     * 根据 id 获取用户脱敏包装类
     * <p>返回脱敏后的 UserVO，适用于非管理员场景</p>
     *
     * @param id 用户 id，必须大于 0
     * @return 脱敏后的用户信息
     */
    @GetMapping("/get/vo")
    public BaseResponse<UserVO> getUserVOById(long id) {
        // 先获取完整用户信息（内部已做权限和参数校验）
        BaseResponse<User> response = getUserById(id);
        User user = response.getData();
        // 转换为脱敏视图对象
        return ResultUtils.success(userService.getUserVO(user));
    }

    /**
     * 删除用户（仅管理员）
     * <p>根据用户 id 物理删除用户记录</p>
     *
     * @param deleteRequest 删除请求，包含待删除的用户 id
     * @return 删除是否成功
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteUser(@RequestBody DeleteRequest deleteRequest) {
        // 校验请求参数
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean b = userService.removeById(deleteRequest.getId());
        return ResultUtils.success(b);
    }

    /**
     * 更新用户信息（仅管理员）
     *
     * @param userUpdateRequest 用户更新请求，包含用户 id 及待更新的字段
     * @return 更新是否成功
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateUser(@RequestBody UserUpdateRequest userUpdateRequest) {
        // 校验请求参数
        if (userUpdateRequest == null || userUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = new User();
        // 将请求属性复制到用户实体
        BeanUtil.copyProperties(userUpdateRequest, user);
        boolean result = userService.updateById(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 分页获取用户封装列表（仅管理员）
     * <p>按条件分页查询用户，返回脱敏后的用户视图对象列表</p>
     *
     * @param userQueryRequest 查询请求参数，包含分页信息和查询条件
     * @return 分页的用户脱敏列表
     */
    @PostMapping("/list/page/vo")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<UserVO>> listUserVOByPage(@RequestBody UserQueryRequest userQueryRequest) {
        // 校验请求参数非空
        ThrowUtils.throwIf(userQueryRequest == null, ErrorCode.PARAMS_ERROR);
        // 获取分页参数：当前页码和每页大小
        long pageNum = userQueryRequest.getPageNum();
        long pageSize = userQueryRequest.getPageSize();
        // 根据查询条件构建 QueryWrapper，并执行分页查询，获取原始 User 实体分页结果
        Page<User> userPage = userService.page(Page.of(pageNum, pageSize),
                userService.getQueryWrapper(userQueryRequest));
        // 构造脱敏后的分页对象，保留总记录数
        Page<UserVO> userVOPage = new Page<>(pageNum, pageSize, userPage.getTotalRow());
        // 将 User 实体列表批量转换为脱敏的 UserVO 视图对象列表
        List<UserVO> userVOList = userService.getUserVOList(userPage.getRecords());
        // 将脱敏后的数据设置到分页结果中
        userVOPage.setRecords(userVOList);
        return ResultUtils.success(userVOPage);
    }




}
