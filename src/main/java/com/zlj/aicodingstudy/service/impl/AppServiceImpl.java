package com.zlj.aicodingstudy.service.impl;

import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.mybatisflex.core.util.SqlUtil;
import com.zlj.aicodingstudy.mapper.AppMapper;
import com.zlj.aicodingstudy.model.entity.App;
import com.zlj.aicodingstudy.service.AppService;
import org.springframework.stereotype.Service;

@Service
public class AppServiceImpl extends ServiceImpl<AppMapper, App> implements AppService {

    @Override
    public boolean save(App app) {
        return SqlUtil.toBool(getMapper().insert(app, true));
    }
}
