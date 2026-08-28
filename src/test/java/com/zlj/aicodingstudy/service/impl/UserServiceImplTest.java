package com.zlj.aicodingstudy.service.impl;

import com.mybatisflex.core.query.QueryWrapper;
import com.zlj.aicodingstudy.constant.UserConstant;
import com.zlj.aicodingstudy.exception.BusinessException;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.mapper.UserMapper;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.vo.LoginUserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceImplTest {

    private static final String ACCOUNT = "testuser";
    private static final String RAW_PASSWORD = "password123";
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    private UserServiceImpl userService;
    private UserMapper userMapper;
    /** 模拟数据库回填自增 id 的同时捕获 insert 的实体 */
    private final java.util.List<User> inserted = new java.util.ArrayList<>();

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl();
        userMapper = mock(UserMapper.class);
        ReflectionTestUtils.setField(userService, "mapper", userMapper);
        // 覆盖 IService 默认方法可能调用的各 mapper 变体
        org.mockito.stubbing.Answer<Integer> insertAnswer = inv -> {
            User user = inv.getArgument(0, User.class);
            user.setId(100L);
            inserted.add(user);
            return 1;
        };
        when(userMapper.insert(any(User.class))).thenAnswer(insertAnswer);
        when(userMapper.insert(any(User.class), anyBoolean())).thenAnswer(insertAnswer);
        when(userMapper.update(any(User.class))).thenReturn(1);
        when(userMapper.update(any(User.class), anyBoolean())).thenReturn(1);
    }

    @Test
    void encryptPasswordProducesBcryptHash() {
        String hash = userService.getEncryptPassword(RAW_PASSWORD);
        assertTrue(hash.startsWith("$2"));
        assertTrue(ENCODER.matches(RAW_PASSWORD, hash));
    }

    @Test
    void loginWithBcryptPasswordSucceedsWithoutRewrite() {
        User user = storedUser(ENCODER.encode(RAW_PASSWORD));
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(user);
        MockHttpServletRequest request = new MockHttpServletRequest();

        LoginUserVO result = userService.userLogin(ACCOUNT, RAW_PASSWORD, request);

        assertEquals(user.getId(), result.getId());
        assertEquals(user.getUserAccount(), result.getUserAccount());
        assertEquals(user, request.getSession().getAttribute(UserConstant.USER_LOGIN_STATE));
        verify(userMapper, never()).update(any(User.class), anyBoolean());
        verify(userMapper, never()).update(any(User.class));
    }

    @Test
    void loginUpgradesLegacyMd5PasswordToBcrypt() {
        String legacyHash = DigestUtils.md5DigestAsHex((RAW_PASSWORD + "zlj").getBytes(StandardCharsets.UTF_8));
        User user = storedUser(legacyHash);
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(user);
        MockHttpServletRequest request = new MockHttpServletRequest();

        LoginUserVO result = userService.userLogin(ACCOUNT, RAW_PASSWORD, request);

        assertEquals(user.getId(), result.getId());
        assertTrue(user.getUserPassword().startsWith("$2"));
        assertTrue(ENCODER.matches(RAW_PASSWORD, user.getUserPassword()));
        // 存量 MD5 口令应在登录成功后被覆写为 BCrypt
        verify(userMapper).update(any(User.class), anyBoolean());
    }

    @Test
    void loginWithWrongPasswordReturnsUnifiedMessage() {
        User user = storedUser(ENCODER.encode(RAW_PASSWORD));
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(user);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.userLogin(ACCOUNT, "wrong-password", new MockHttpServletRequest()));
        assertEquals("账号或密码错误", exception.getMessage());
    }

    @Test
    void loginWithUnknownAccountReturnsSameMessageAsWrongPassword() {
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.userLogin("nobody", RAW_PASSWORD, new MockHttpServletRequest()));
        assertEquals("账号或密码错误", exception.getMessage());
    }

    @Test
    void registerRejectsExistingAccountBeforeInsert() {
        when(userMapper.selectCountByQuery(any(QueryWrapper.class))).thenReturn(1L);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.userRegister(ACCOUNT, RAW_PASSWORD, RAW_PASSWORD));
        assertEquals("用户已存在", exception.getMessage());
        assertTrue(inserted.isEmpty());
    }

    @Test
    void registerTranslatesDuplicateKeyToDuplicateAccountError() {
        // 模拟并发竞态：查重时 count=0，插入时撞唯一索引
        when(userMapper.selectCountByQuery(any(QueryWrapper.class))).thenReturn(0L);
        when(userMapper.insert(any(User.class))).thenThrow(new DuplicateKeyException("dup"));
        when(userMapper.insert(any(User.class), anyBoolean())).thenThrow(new DuplicateKeyException("dup"));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.userRegister(ACCOUNT, RAW_PASSWORD, RAW_PASSWORD));
        assertEquals("用户已存在", exception.getMessage());
        assertEquals(ErrorCode.PARAMS_ERROR.getCode(), exception.getCode());
    }

    @Test
    void registerSavesBcryptPassword() {
        when(userMapper.selectCountByQuery(any(QueryWrapper.class))).thenReturn(0L);

        long id = userService.userRegister(ACCOUNT, RAW_PASSWORD, RAW_PASSWORD);

        assertEquals(100L, id);
        assertEquals(1, inserted.size());
        User saved = inserted.get(0);
        assertTrue(saved.getUserPassword().startsWith("$2"));
        assertTrue(ENCODER.matches(RAW_PASSWORD, saved.getUserPassword()));
    }

    private User storedUser(String passwordHash) {
        User user = new User();
        user.setId(1L);
        user.setUserAccount(ACCOUNT);
        user.setUserPassword(passwordHash);
        user.setUserRole("user");
        return user;
    }
}
