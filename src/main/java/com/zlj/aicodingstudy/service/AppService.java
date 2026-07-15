package com.zlj.aicodingstudy.service;

import com.mybatisflex.core.service.IService;
import com.zlj.aicodingstudy.model.entity.App;

public interface AppService extends IService<App> {
    boolean save(App app);
}
