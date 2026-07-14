package com.zlj.aicodingstudy.aop;

import cn.hutool.core.util.StrUtil;
import com.zlj.aicodingstudy.annotation.AuthCheck;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.enums.UserRoleEnum;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 权限校验切面。
 *
 * <p>拦截所有标记了 {@link AuthCheck} 的方法，在目标方法执行前完成登录和角色校验。</p>
 */
@Aspect
@Component
public class AuthInterceptor {

    @Resource
    private UserService userService;

    /**
     * 执行权限校验。
     *
     * @param joinPoint 切入点
     * @param authCheck 权限校验注解
     * @return 原方法执行结果
     * @throws Throwable 原方法抛出的异常
     */
    @Around("@annotation(authCheck)")
    public Object doInterceptor(ProceedingJoinPoint joinPoint, AuthCheck authCheck) throws Throwable {
        // 获取注解中声明的必须角色，例如 admin；为空表示只要求登录
        String mustRole = authCheck.mustRole();

        // 从当前线程绑定的请求上下文中获取本次 HTTP 请求对象
        RequestAttributes requestAttributes = RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();

        // 获取当前登录用户；未登录时 getLoginUser 会直接抛出 NOT_LOGIN_ERROR
        User loginUser = userService.getLoginUser(request);

        // 将注解中的角色字符串转换为角色枚举，便于后续判断
        UserRoleEnum mustRoleEnum = UserRoleEnum.getEnumByValue(mustRole);

        if (mustRoleEnum == null) {
            // 如果 mustRole 不为空但无法识别，说明注解角色写错了，不能直接放行
            if (StrUtil.isNotBlank(mustRole)) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
            // 没有指定角色时，只要求用户已登录，直接放行
            return joinPoint.proceed();
        }

        // 获取当前登录用户的实际角色
        UserRoleEnum userRoleEnum = UserRoleEnum.getEnumByValue(loginUser.getUserRole());
        if (userRoleEnum == null) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }

        // 当前只处理管理员权限：要求 admin，但登录用户不是 admin，则拒绝访问
        if (UserRoleEnum.ADMIN.equals(mustRoleEnum) && !UserRoleEnum.ADMIN.equals(userRoleEnum)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }

        // 权限校验通过，继续执行原接口方法
        return joinPoint.proceed();
    }
}
