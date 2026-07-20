package com.zlj.aicodingstudy;

import dev.langchain4j.community.store.embedding.redis.spring.RedisEmbeddingStoreAutoConfiguration;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.zlj.aicodingstudy.mapper")
@SpringBootApplication(exclude = {RedisEmbeddingStoreAutoConfiguration.class})

public class AiCodingStudyApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiCodingStudyApplication.class, args);
    }

}
