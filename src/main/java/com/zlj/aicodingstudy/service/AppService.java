package com.zlj.aicodingstudy.service;

import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;
import com.zlj.aicodingstudy.model.dto.app.AppQueryRequest;
import com.zlj.aicodingstudy.model.entity.App;
import com.zlj.aicodingstudy.model.vo.AppVO;

import java.util.List;

public interface AppService extends IService<App> {
    boolean save(App app);

    /**
     * 获取应用封装类
     *
     * @param app
     * @return
     */
    AppVO getAppVO(App app);


    /**
     * 根据应用查询请求构造  查询条件
     * @param appQueryRequest 应用查询请求，包含筛选条件、分页参数及排序规则
     * @return 构造完成的 {@link QueryWrapper} 查询条件对象
     */
    QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest);


    List<AppVO> getAppVOList(List<App> appList);
}
