package com.zlj.aicodingstudy.service.impl;


import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.mapper.UserMapper;
import com.zlj.aicodingstudy.model.dto.user.UserQueryRequest;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.enums.UserRoleEnum;
import com.zlj.aicodingstudy.model.vo.LoginUserVO;
import com.zlj.aicodingstudy.model.vo.UserVO;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.zlj.aicodingstudy.constant.UserConstant.USER_LOGIN_STATE;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    /**
     * 用户注册
     * @param userAccount   用户账户
     * @param userPassword  用户密码
     * @param checkPassword 校验密码
     * @return 新用户 id
     */
    @Override
    public long userRegister(String userAccount, String userPassword, String checkPassword) {
        //1.校验参数
        if (StrUtil.hasBlank(userAccount,userPassword,checkPassword)){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"参数为空");
        }
        if (userAccount.length()<4){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"用户账户过短");
        }

        if (userPassword.length()<8||checkPassword.length()<8){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"密码过短");
        }
        if (!userPassword.equals(checkPassword)){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"两次输入密码不一致");
        }
        //2.查询用户是否存在
        QueryWrapper queryWrapper = new QueryWrapper();
        queryWrapper.eq("userAccount",userAccount);
        long count = this.mapper.selectCountByQuery(queryWrapper);
        if (count>0){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"用户已存在");
        }

        //3.加密密码
        String encryptPassword = getEncryptPassword(userPassword);
        //4.创建用户
        User user = new User();
        user.setUserAccount(userAccount);
        user.setUserPassword(encryptPassword);
        user.setUserName(userAccount);
        user.setUserRole(UserRoleEnum.USER.getValue());
        boolean result =this.save(user);
        if (!result){
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,"注册失败,数据库错误");
        }
        return user.getId();
    }

    /**
     * 获取脱敏的用户信息
     */
    @Override
    public LoginUserVO getLoginUserVO(User user) {
        if (user == null) {
            return null;
        }
        LoginUserVO loginUserVO = new LoginUserVO();
        BeanUtil.copyProperties(user, loginUserVO);
        return loginUserVO;
    }

    /**
     *
     * 用户登录
     * @param userAccount  用户账户
     * @param userPassword 用户密码
     * @param request      请求
     * @return
     */
    @Override
    public LoginUserVO userLogin(String userAccount, String userPassword, HttpServletRequest request) {
        //1.校验参数
        if (StrUtil.hasBlank(userAccount,userPassword)){
            throw  new BusinessException(ErrorCode.PARAMS_ERROR,"参数为空");
        }
        if (userAccount.length() < 4){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"用户账户过短");
        }
        if (userPassword.length() < 8){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"密码过短");
        }
        //2.加密密码
        String encryptPassword = getEncryptPassword(userPassword);
        //3.查询用户是否存在
        QueryWrapper queryWrapper = new QueryWrapper();
        queryWrapper.eq("userAccount",userAccount);
        queryWrapper.eq("userPassword",encryptPassword);
        User user = this.mapper.selectOneByQuery(queryWrapper);
        if (user==null)
        {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"用户不存在");
        }
        // 4. 如果用户存在，记录用户的登录态
        request.getSession().setAttribute(USER_LOGIN_STATE, user);
        // 5. 返回脱敏的用户信息
        return this.getLoginUserVO(user);



    }

    /**
     * 获取当前登录用户
     * @param request
     * @return
     */
    @Override
    public User getLoginUser(HttpServletRequest request) {
        // 先判断用户是否登录
        Object userObj = request.getSession().getAttribute(USER_LOGIN_STATE);
        User currentUser = (User) userObj;
        if (currentUser == null || currentUser.getId() == null) {
            throw new BusinessException(ErrorCode.NOT_LOGIN_ERROR);
        }
        // 从数据库查询当前用户信息
        long userId = currentUser.getId();
        currentUser = this.getById(userId);
        if (currentUser == null) {
            throw new BusinessException(ErrorCode.NOT_LOGIN_ERROR);
        }
        return currentUser;
    }

    /**
     * 获取加密密码
     * @param userPassword 密码
     * @return  加密后的密码
     */
    public String getEncryptPassword(String userPassword) {
        // 盐值，混淆密码
        final String SALT = "zlj";
        return DigestUtils.md5DigestAsHex((userPassword + SALT).getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 根据用户信息获取用户视图层信息
     * 将 User 实体对象转换为 UserVO 视图对象，过滤掉不需要暴露给前端的敏感字段
     * @param user 用户信息
     * @return 视图层用户信息，若传入为 null 则返回 null
     */
    @Override
    public UserVO getUserVO(User user) {
        // 空值校验，避免空指针异常
        if (user == null) {
            return null;
        }
        UserVO userVO = new UserVO();
        // 使用 Hutool 工具类拷贝同名属性
        BeanUtil.copyProperties(user, userVO);
        return userVO;
    }

    /**
     * 根据用户列表获取用户视图层信息
     * 批量将 User 实体对象列表转换为 UserVO 视图对象列表
     * @param userList 用户列表
     * @return 视图层用户列表信息，若传入列表为空则返回空列表
     */
    @Override
    public List<UserVO> getUserVOList(List<User> userList) {
        // 集合空值校验，避免空指针异常
        if (CollUtil.isEmpty(userList)) {
            return new ArrayList<>();
        }
        // 使用 Stream API 逐个转换并收集为列表
        return userList.stream()
                .map(this::getUserVO)
                .collect(Collectors.toList());
    }

    /**
     * 用户登出
     * @param request 登出请求
     * @return 是否登出成功
     */
    @Override
    public boolean userLogout(HttpServletRequest request) {
        // 先判断用户是否登录
        Object userObj = request.getSession().getAttribute(USER_LOGIN_STATE);
        if (userObj == null) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "用户未登录");
        }
        // 移除登录态
        request.getSession().removeAttribute(USER_LOGIN_STATE);
        return true;
    }

    /**
     * 根据查询参数构建 MyBatis-Flex 查询条件
     * 支持的查询方式：
     * - id、userRole：精确匹配（eq）
     * - userAccount、userName、userProfile：模糊匹配（like）
     * - sortField + sortOrder：排序（默认升序）
     *
     * @param userQueryRequest 查询参数
     * @return 查询条件 QueryWrapper
     * @throws BusinessException 当请求参数为空时抛出参数错误
     */
    @Override
    public QueryWrapper getQueryWrapper(UserQueryRequest userQueryRequest) {
        // 参数非空校验
        if (userQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数为空");
        }
        // 解构查询参数
        Long id = userQueryRequest.getId();
        String userAccount = userQueryRequest.getUserAccount();
        String userName = userQueryRequest.getUserName();
        String userProfile = userQueryRequest.getUserProfile();
        String userRole = userQueryRequest.getUserRole();
        String sortField = userQueryRequest.getSortField();
        String sortOrder = userQueryRequest.getSortOrder();
        // 链式构建查询条件，各字段为 null 时自动跳过
        return QueryWrapper.create()
                .eq("id", id) // where id = ${id}
                .eq("userRole", userRole) // and userRole = ${userRole}
                .like("userAccount", userAccount) // and userAccount like '%${userAccount}%'
                .like("userName", userName) // and userName like '%${userName}%'
                .like("userProfile", userProfile) // and userProfile like '%${userProfile}%'
                .orderBy(sortField, "ascend".equals(sortOrder)); // order by ${sortField} asc/desc
    }
}
