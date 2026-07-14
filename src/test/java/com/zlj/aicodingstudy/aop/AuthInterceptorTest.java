package com.zlj.aicodingstudy.aop;

import com.zlj.aicodingstudy.annotation.AuthCheck;
import com.zlj.aicodingstudy.constant.UserConstant;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.enums.UserRoleEnum;
import com.zlj.aicodingstudy.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthInterceptorTest {

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void allowsAdminWhenAdminRoleRequired() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        UserService userService = mock(UserService.class);
        when(userService.getLoginUser(request)).thenReturn(userWithRole(UserRoleEnum.ADMIN.getValue()));
        AuthInterceptor authInterceptor = authInterceptor(userService);
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = authInterceptor.doInterceptor(joinPoint, authCheck(UserConstant.ADMIN_ROLE));

        assertEquals("ok", result);
        verify(joinPoint).proceed();
    }

    @Test
    void rejectsUserWhenAdminRoleRequired() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        UserService userService = mock(UserService.class);
        when(userService.getLoginUser(request)).thenReturn(userWithRole(UserRoleEnum.USER.getValue()));
        AuthInterceptor authInterceptor = authInterceptor(userService);
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authInterceptor.doInterceptor(joinPoint, authCheck(UserConstant.ADMIN_ROLE)));

        assertEquals(ErrorCode.NO_AUTH_ERROR.getCode(), exception.getCode());
        verify(joinPoint, never()).proceed();
    }

    @Test
    void allowsLoggedInUserWhenNoRoleRequired() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        UserService userService = mock(UserService.class);
        when(userService.getLoginUser(request)).thenReturn(userWithRole(UserRoleEnum.USER.getValue()));
        AuthInterceptor authInterceptor = authInterceptor(userService);
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = authInterceptor.doInterceptor(joinPoint, authCheck(""));

        assertEquals("ok", result);
        verify(joinPoint).proceed();
    }

    @Test
    void rejectsUnknownRequiredRole() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        UserService userService = mock(UserService.class);
        when(userService.getLoginUser(request)).thenReturn(userWithRole(UserRoleEnum.ADMIN.getValue()));
        AuthInterceptor authInterceptor = authInterceptor(userService);
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authInterceptor.doInterceptor(joinPoint, authCheck("admn")));

        assertEquals(ErrorCode.NO_AUTH_ERROR.getCode(), exception.getCode());
        verify(joinPoint, never()).proceed();
    }

    private AuthInterceptor authInterceptor(UserService userService) {
        AuthInterceptor authInterceptor = new AuthInterceptor();
        ReflectionTestUtils.setField(authInterceptor, "userService", userService);
        return authInterceptor;
    }

    private AuthCheck authCheck(String mustRole) {
        AuthCheck authCheck = mock(AuthCheck.class);
        when(authCheck.mustRole()).thenReturn(mustRole);
        return authCheck;
    }

    private User userWithRole(String userRole) {
        User user = new User();
        user.setUserRole(userRole);
        return user;
    }
}
