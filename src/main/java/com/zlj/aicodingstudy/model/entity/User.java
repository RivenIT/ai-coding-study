package com.zlj.aicodingstudy.model.entity;

import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import com.mybatisflex.core.keygen.KeyGenerators;

import java.io.Serializable;

/**
 *  实体用户
 */
@Table("user")
public class User implements Serializable {

    /**
     * 主键ID，使用雪花算法生成
     */
    @Id(keyType = KeyType.Generator, value = KeyGenerators.snowFlakeId)
    private Long id;
}
