package com.zlj.aicodingstudy.controller;
import com.zlj.aicodingstudy.common.BaseResponse;
import com.zlj.aicodingstudy.common.ResultUtils;
import com.zlj.aicodingstudy.constant.AppConstant;
import com.zlj.aicodingstudy.exception.ErrorCode;
import com.zlj.aicodingstudy.exception.ThrowUtils;
import com.zlj.aicodingstudy.model.dto.app.AppDeployRequest;
import com.zlj.aicodingstudy.model.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;
import java.io.File;


@RestController
@RequestMapping("/static")
public class StaticResourceController {


    // 应用生成根目录（用于浏览）
    private static final String PREVIEW_ROOT_DIR = AppConstant.CODE_OUTPUT_ROOT_DIR;


    /**
     * 提供静态资源访问，支持目录重定向
     * 访问格式：http://localhost:8081/api/static/{deployKey}[/{fileName}]
     */
    @GetMapping("/{deployKey}/**")
    public ResponseEntity<Resource> serveStaticResource(
            @PathVariable String deployKey,
            HttpServletRequest request) {
        try {
            // 获取当前请求 URL 中匹配 Controller 路径部分的完整路径。假设请求是：GET /api/static/multi_file_123456/css/style.css,
            // 由于 @RequestMapping("/static")，这行取到的值为：/static/multi_file_123456/css/style.css
            String resourcePath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
            //截掉前缀，去掉 /static/{deployKey} 部分，只保留后面的子路径, 截取后 resourcePath = css/style.css
            resourcePath = resourcePath.substring(("/static/" + deployKey).length());

            // 如果是目录访问（不带斜杠），重定向到带斜杠的URL
            if (resourcePath.isEmpty()) {
                HttpHeaders headers = new HttpHeaders();
                headers.add("Location", request.getRequestURI() + "/");
                return new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
            }
            // 默认返回 index.html
            if (resourcePath.equals("/")) {
                resourcePath = "/index.html";
            }

            // 构建文件路径
            String filePath = PREVIEW_ROOT_DIR + "/" + deployKey + resourcePath;
            File file = new File(filePath);
            // 检查文件是否存在
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            // 返回文件资源
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header("Content-Type", getContentTypeWithCharset(filePath))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 根据文件扩展名返回带字符编码的 Content-Type
     */
    private String getContentTypeWithCharset(String filePath) {
        if (filePath.endsWith(".html")) return "text/html; charset=UTF-8";
        if (filePath.endsWith(".css")) return "text/css; charset=UTF-8";
        if (filePath.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (filePath.endsWith(".png")) return "image/png";
        if (filePath.endsWith(".jpg")) return "image/jpeg";
        return "application/octet-stream";
    }


}
