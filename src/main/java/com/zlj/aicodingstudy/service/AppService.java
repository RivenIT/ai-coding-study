package com.zlj.aicodingstudy.service;

import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;
import com.zlj.aicodingstudy.model.dto.app.AppQueryRequest;
import com.zlj.aicodingstudy.model.entity.App;
import com.zlj.aicodingstudy.model.entity.User;
import com.zlj.aicodingstudy.model.vo.AppVO;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

import java.util.List;

public interface AppService extends IService<App> {



    /**
     * 通过对话生成应用代码
     *
     * @param appId     应用 ID
     * @param message   提示词
     * @param loginUser 登录用户
     * @return
     */
    Flux<String> chatToGenCode(Long appId, String message, User loginUser);



    String deployApp(Long appId, User loginUser);


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

    /**
     * 获取应用封装类列表
     *
     * @param appList
     * @return
     */
    List<AppVO> getAppVOList(List<App> appList);


}
