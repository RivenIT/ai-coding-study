# 前端用户管理页面开发需求文档

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 适用前端 | Vue 3 + TypeScript + Ant Design Vue |
| 对接后端 | `ai-coding-study` 用户模块，接口前缀 `/user` |
| 登录机制 | 基于 HTTP Session Cookie，不使用 Bearer Token |
| 页面范围 | 注册、登录、登录态、管理员用户管理、当前用户展示 |

## 1. 目标与范围

前端需要提供完整的用户身份入口和管理员用户管理工作台：

- 访客可以注册、登录。
- 已登录用户可以查看当前登录信息并退出登录。
- 仅 `admin` 可以进入用户管理页面，检索、分页查看、新增、编辑、删除用户。
- 所有接口统一处理后端响应包装、Session Cookie、权限失效和错误提示。

当前后端**没有**“用户自行编辑资料、修改密码、找回密码、禁用用户、服务端导出”接口。本期前端不得伪造这些能力；相关入口不展示，或以“暂未开放”说明替代。

## 2. 全局约定

### 2.1 响应结构

所有接口均按以下结构返回：

```ts
interface BaseResponse<T> {
  code: number
  data: T
  message: string
}
```

- `code === 0`：成功，读取 `data`。
- `code !== 0`：业务失败，不使用 `data`，以 `message` 作为用户提示文本。
- HTTP 非 2xx、超时、网络中断：视为网络错误，统一由请求拦截器处理。

### 2.2 Session 与请求配置

- Axios 实例必须设置 `withCredentials: true`，浏览器才会携带、接收 Session Cookie。
- 请求基地址从 `VITE_API_BASE_URL` 读取；本地联调建议为 `http://localhost:8081`。
- 页面首次进入或刷新时调用 `GET /user/get/login` 恢复登录态。
- 应用内维护一个 Pinia `user` store，至少包含 `loginUser`、`initialized`、`loading` 和 `fetchLoginUser()`。
- 收到 `40100` 时：清空 store、关闭所有受保护弹窗、记录当前地址并跳转 `/login?redirect=<当前路由>`。
- 收到 `40101` 时：提示“无权限访问”，跳转首页；不反复重试请求。

### 2.3 用户 ID 精度约束

后端用户 ID 是 Snowflake `Long`。JavaScript 的安全整数上限是 `9007199254740991`，因此前端必须将所有 `id` 按字符串处理：

```ts
type UserId = string
```

**后端协作要求：**接口 JSON 中的 `id` 必须序列化为字符串。若当前接口返回 JSON number，前端无法在 JSON 解析后恢复已丢失的精度，后端必须先完成该契约调整。所有请求中的 `id` 均传字符串形式。

## 3. 路由、权限与整体布局

### 3.1 路由表

| 路由 | 页面 | 访问条件 | 行为 |
| --- | --- | --- | --- |
| `/login` | 登录页 | 访客 | 已登录时跳转首页或 `redirect` |
| `/register` | 注册页 | 访客 | 注册成功后跳转登录页 |
| `/user/manage` | 用户管理页 | `admin` | 路由守卫校验登录态和角色 |
| `/` | 首页 | 公开 | 顶部展示登录入口或用户菜单 |

不新增“个人资料编辑”路由，原因是当前后端未提供对应更新接口。

### 3.2 全局顶部栏

- 未登录：展示“登录”“注册”按钮；点击分别跳转 `/login`、`/register`。
- 已登录：展示头像（缺省时使用首字母头像）、昵称、角色标签和下拉菜单。
- 下拉菜单：`当前账号`（只读信息）、`退出登录`；`admin` 额外显示“用户管理”。
- 退出登录需二次确认；确认后调用登出接口，成功时清空本地用户状态并跳转首页。
- 角色显示：`admin` 显示“管理员”，`user` 显示“普通用户”；未知值显示“未知角色”，不得赋予管理入口。

### 3.3 用户管理页布局

页面采用管理后台的单页工作台布局，不使用嵌套卡片：

1. 顶部页面标题“用户管理”，右侧为“新增用户”和“导出”操作区。
2. 筛选区：两行以内的紧凑表单，包含账号、昵称、简介关键词、角色、用户 ID；右侧为“查询”“重置”。
3. 数据区：表格占满内容宽度，表头支持排序，行内提供“查看”“编辑”“删除”。
4. 底部：总条数、页码、每页条数、跳页控件。
5. 窄屏：筛选项自动换行，表格保持横向滚动；行操作收纳为下拉菜单。

## 4. 页面功能与交互逻辑

### 4.1 注册页

**字段与校验**

| 字段 | 前端字段 | 控件 | 必填 | 校验规则 | 后端字段 |
| --- | --- | --- | --- | --- | --- |
| 账号 | `userAccount` | 文本输入 | 是 | 去除首尾空格；4-32 位；建议仅字母、数字、下划线 | `userAccount` |
| 密码 | `userPassword` | 密码输入 | 是 | 8-64 位；不自动填充到日志或 URL | `userPassword` |
| 确认密码 | `checkPassword` | 密码输入 | 是 | 与密码完全一致 | `checkPassword` |

**交互流程**

1. 提交前执行前端校验；不通过时定位首个错误项。
2. 按钮进入 loading 状态并禁用重复提交。
3. 调用 `POST /user/register`。成功后提示“注册成功，请登录”，跳转 `/login`，并将账号预填到登录页。
4. 账号已存在或参数错误时保留表单内容，仅清空两项密码；展示后端 `message`。

### 4.2 登录页

**字段与校验**

| 字段 | 前端字段 | 控件 | 必填 | 校验规则 | 后端字段 |
| --- | --- | --- | --- | --- | --- |
| 账号 | `userAccount` | 文本输入 | 是 | 去除首尾空格；至少 4 位 | `userAccount` |
| 密码 | `userPassword` | 密码输入 | 是 | 至少 8 位 | `userPassword` |

**交互流程**

1. 调用 `POST /user/login`，请求须携带 Cookie 配置。
2. 成功后将返回的 `LoginUserVO` 写入 store；若 `userRole === 'admin'` 且存在合法 `redirect`，跳转 `redirect`，否则跳转首页。
3. 登录失败时不区分“账号不存在”和“密码错误”的前端文案，统一显示“账号或密码错误”；密码框清空、账号保留、焦点回到密码框。
4. 连续提交时只保留首次在途请求；网络错误允许用户手动重试。

### 4.3 当前用户与登出

**当前用户恢复**

- 应用初始化仅调用一次 `GET /user/get/login`。
- 成功：写入 `LoginUserVO`。
- `40100`：视为访客，不弹错误提示。
- 其他失败：不阻断公开页面；顶部显示登录按钮，并将错误写入开发日志。

**登出确认弹窗**

| 项 | 规则 |
| --- | --- |
| 标题 | `确认退出登录？` |
| 内容 | `退出后需要重新登录才能访问管理功能。` |
| 按钮 | 取消、确认退出 |
| 确认行为 | `POST /user/logout`，成功后清空 store 并跳转 `/` |
| 失败处理 | 保留当前登录态，提示后端消息；若返回 `40100`，仍清空本地状态 |

### 4.4 管理员用户列表

**表格字段**

| 列 | 数据字段 | 展示规则 |
| --- | --- | --- |
| 用户 ID | `id` | 字符串展示，不做数值计算或科学计数法格式化 |
| 账号 | `userAccount` | 单行省略，悬停显示完整值 |
| 昵称 | `userName` | 空值显示 `-` |
| 头像 | `userAvatar` | 圆形缩略图；URL 无效时展示缺省头像 |
| 简介 | `userProfile` | 单行省略，悬停显示全文 |
| 角色 | `userRole` | `admin` 红/橙色管理标签；`user` 蓝/灰色普通用户标签 |
| 创建时间 | `createTime` | `YYYY-MM-DD HH:mm:ss`，空值显示 `-` |
| 操作 | - | 查看、编辑、删除 |

**列表加载行为**

- 首次进入和筛选、翻页、排序均调用 `POST /user/list/page/vo`。
- 请求期间保留旧数据并显示表格 loading；不清空列表以避免跳动。
- 筛选条件变化后点击“查询”时强制将 `pageNum` 重置为 `1`。
- 点击“重置”后清空全部筛选、恢复默认排序，重新请求第 `1` 页。
- 表格空态文案为“暂无用户数据”；加载失败显示错误态和“重新加载”按钮。

### 4.5 用户详情抽屉

- 点击“查看”打开右侧详情抽屉，直接使用列表行的 `UserVO` 数据展示。
- 显示用户 ID、账号、昵称、头像、简介、角色、创建时间。
- **禁止调用 `GET /user/get` 用于页面详情。**该接口返回 `User` 实体，包含 `userPassword`，即使仅管理员可访问也不得向浏览器暴露密码哈希。
- 抽屉底部仅显示“关闭”和“编辑”按钮；“编辑”关闭抽屉后打开编辑弹窗。

### 4.6 新增用户弹窗

点击“新增用户”打开模态框。成功后关闭弹窗、提示“新增成功”、刷新当前筛选条件的第一页。

| 字段 | 前端字段 | 控件 | 必填 | 校验规则 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 账号 | `userAccount` | 文本输入 | 是 | 4-32 位；仅字母、数字、下划线；去除首尾空格 | 后端当前仅校验非空；前端按此规范约束 |
| 昵称 | `userName` | 文本输入 | 是 | 1-32 字符；去除首尾空格 | 不允许只含空白 |
| 头像地址 | `userAvatar` | URL 输入 | 否 | 合法 `http://` 或 `https://` URL；最长 512 字符 | 空值允许 |
| 个人简介 | `userProfile` | 多行文本 | 否 | 最长 500 字符 | 显示字数计数器 |
| 角色 | `userRole` | 下拉选择 | 是 | 仅允许 `user`、`admin` | 默认 `user` |

- 后端会为新增用户设置初始密码 `12345678`，前端弹窗确认区必须醒目提示“初始密码由后端统一设置，首次登录后应修改密码（当前后端尚未提供修改密码接口）”。
- 新增失败时弹窗不关闭，保留字段内容；若提示账号重复，账号输入框标红并聚焦。

### 4.7 编辑用户弹窗

点击“编辑”打开模态框，并以当前 `UserVO` 回填。账号、创建时间、密码均为只读或不展示，因为当前更新接口不支持修改账号和密码。

| 字段 | 前端字段 | 控件 | 必填 | 校验规则 | 后端字段 |
| --- | --- | --- | --- | --- | --- |
| 用户 ID | `id` | 隐藏字段 | 是 | 正整数字符串；不可编辑 | `id` |
| 账号 | `userAccount` | 只读文本 | - | 不提交 | 无 |
| 昵称 | `userName` | 文本输入 | 是 | 1-32 字符；去除首尾空格 | `userName` |
| 头像地址 | `userAvatar` | URL 输入 | 否 | 合法 HTTP(S) URL；最长 512 字符 | `userAvatar` |
| 个人简介 | `userProfile` | 多行文本 | 否 | 最长 500 字符 | `userProfile` |
| 角色 | `userRole` | 下拉选择 | 是 | 仅 `user`、`admin` | `userRole` |

- 当前管理员编辑自己的角色时，显示二次风险提示；不限制提交，最终以服务端权限结果为准。
- 成功后关闭弹窗、刷新当前页；若当前行因筛选条件不再匹配，刷新后其自然消失。
- 返回 `40400` 或“用户不存在”时，关闭弹窗、提示“该用户已不存在”，刷新列表。

### 4.8 删除确认弹窗

| 项 | 规则 |
| --- | --- |
| 标题 | `确认删除用户？` |
| 内容 | 展示账号与昵称，并提示该操作不可撤销（后端逻辑删除的实际策略由后端决定） |
| 危险样式 | 确认按钮使用 danger 样式 |
| 提交参数 | `{ id }` |
| 成功处理 | 提示“删除成功”；若删除页仅剩一条且当前页大于 1，页码减一后重查；否则刷新当前页 |
| 失败处理 | 弹窗保持打开，展示后端消息；不在前端乐观删除行 |

## 5. 后端接口与字段映射

### 5.1 接口总表

前端统一使用 `POST` 调用注册、登录接口，尽管当前控制器使用通用 `@RequestMapping`。请求 `Content-Type` 为 `application/json`。

| 功能 | 方法与路径 | 权限 | 请求 `data` | 成功 `data` |
| --- | --- | --- | --- | --- |
| 注册 | `POST /user/register` | 公开 | `UserRegisterRequest` | `string` 用户 ID |
| 登录 | `POST /user/login` | 公开 | `UserLoginRequest` | `LoginUserVO` |
| 当前登录用户 | `GET /user/get/login` | 已登录 | 无 | `LoginUserVO` |
| 退出登录 | `POST /user/logout` | 已登录 | 无 | `boolean` |
| 新增用户 | `POST /user/add` | `admin` | `UserAddRequest` | `string` 用户 ID |
| 管理员获取实体 | `GET /user/get?id=<id>` | `admin` | Query `id` | `User`，前端管理页禁用 |
| 获取脱敏用户 | `GET /user/get/vo?id=<id>` | 后端未限制 | Query `id` | `UserVO` |
| 更新用户 | `POST /user/update` | `admin` | `UserUpdateRequest` | `boolean` |
| 删除用户 | `POST /user/delete` | `admin` | `DeleteRequest` | `boolean` |
| 分页查询 | `POST /user/list/page/vo` | `admin` | `UserQueryRequest` | `Page<UserVO>` |

### 5.2 DTO 与前端类型

```ts
type UserRole = 'user' | 'admin'
type UserId = string

interface LoginUserVO {
  id: UserId
  userAccount: string
  userName: string | null
  userAvatar: string | null
  userProfile: string | null
  userRole: UserRole
  createTime: string | null
  updateTime: string | null
}

interface UserVO {
  id: UserId
  userAccount: string
  userName: string | null
  userAvatar: string | null
  userProfile: string | null
  userRole: UserRole
  createTime: string | null
}

interface UserRegisterRequest {
  userAccount: string
  userPassword: string
  checkPassword: string
}

interface UserLoginRequest {
  userAccount: string
  userPassword: string
}

interface UserAddRequest {
  userAccount: string
  userName: string
  userAvatar?: string
  userProfile?: string
  userRole: UserRole
}

interface UserUpdateRequest {
  id: UserId
  userName: string
  userAvatar?: string
  userProfile?: string
  userRole: UserRole
}
```

禁止向前端状态、日志、埋点或页面传递 `userPassword`。`/user/get` 的原始 `User` 响应不得定义为前端业务类型。

## 6. 分页、筛选、排序与导出规范

### 6.1 分页和筛选请求

列表请求体：

```ts
interface UserQueryRequest {
  pageNum: number       // 从 1 开始，默认 1
  pageSize: number      // 默认 10；前端仅允许 10、20、50、100
  sortField?: 'id' | 'userAccount' | 'userName' | 'userRole' | 'createTime'
  sortOrder?: 'ascend' | 'descend'
  id?: UserId
  userAccount?: string
  userName?: string
  userProfile?: string
  userRole?: UserRole
}
```

- 空字符串筛选值必须转换为 `undefined`，避免构造无意义的模糊查询。
- `id` 仅接受纯数字字符串；非法值阻止查询并给出字段错误。
- 账号、昵称、简介均为后端 `like` 查询；角色和 ID 为精确查询。
- 默认排序：`sortField: 'createTime'`、`sortOrder: 'descend'`。
- 表格排序只能从上述白名单中产生，禁止把任意列名或用户输入直接传入 `sortField`。
- 后端返回的分页对象按 MyBatis-Flex `Page` 读取：`records` 为数据行，`totalRow` 为总数；前端适配层应集中完成字段转换。

### 6.2 导出规范

当前后端**没有导出接口**，前端不得通过把 `pageSize` 设为超大值的方式导出全量数据，这会造成慢查询和内存风险。

本期“导出”按钮规范如下：

- 无服务端导出接口时：按钮禁用，Tooltip 显示“当前后端暂未提供导出服务”。
- 可选的临时能力：仅允许“导出当前页”，使用当前已加载的 `records` 在浏览器生成 CSV；按钮文案必须明确为“导出当前页”，不包含未加载数据。
- 全量导出需要后端新增 `POST /user/export`。建议请求体复用筛选字段并增加以下字段：

```ts
interface UserExportRequest extends Omit<UserQueryRequest, 'pageNum' | 'pageSize'> {
  columns: Array<'id' | 'userAccount' | 'userName' | 'userAvatar' | 'userProfile' | 'userRole' | 'createTime'>
  fileName?: string // 前端建议：users-YYYYMMDD-HHmmss.csv
}
```

导出内容不得包含密码哈希、Session、内部删除标记或管理员实体接口的其他敏感字段。

## 7. 异常、边界与状态处理

| 场景 | 判定 | 前端处理 |
| --- | --- | --- |
| 未登录 | `code = 40100` | 清空 store，跳转登录；登录态初始化时静默处理 |
| 无权限 | `code = 40101` | 显示“无权限访问”，关闭管理页弹窗并跳转首页 |
| 参数错误 | `code = 40000` | 表单级错误提示；尽量将错误定位至对应字段 |
| 数据不存在 | `code = 40400` | 提示“用户不存在或已删除”，刷新列表/关闭详情 |
| 操作失败 | `code = 50001` | 保留当前表单和选择状态，提示后端消息，允许重试 |
| 系统错误 | `code = 50000` | 通用错误提示，不展示堆栈或 SQL 信息 |
| 请求过频繁 | `code = 42900` | 提示稍后重试；登录、注册按钮按服务端提示短暂禁用 |
| 网络超时/断网 | Axios 异常 | 提示“网络异常，请检查连接后重试”；不清空表单 |
| 会话过期 | 管理接口返回 `40100` | 取消当前在途提交，保存当前路由为 `redirect`，跳转登录 |
| 列表空页 | 删除后当前页无记录 | 当前页大于 1 时回退一页并重查 |
| 头像加载失败 | 图片 `error` 事件 | 使用本地缺省头像，禁止无限重试 |
| 双击提交 | 在途请求 | 所有提交按钮进入 loading 和 disabled 状态 |
| 非法角色 | 非 `user/admin` | 前端展示“未知角色”；隐藏管理能力，记录开发日志 |

## 8. UI 与交互规范

- 使用 Ant Design Vue 的 `a-form`、`a-table`、`a-modal`、`a-drawer`、`a-popconfirm` 或 `Modal.confirm` 实现；保持现有项目组件风格。
- 所有必填标签带 `*`，错误文本显示在字段下方；提交后表单整体错误显示在表单顶部。
- 所有异步操作均有 loading、成功 toast、失败 toast 三种可感知状态。
- 删除、退出登录、变更管理员角色均为危险操作，必须二次确认；确认按钮使用 danger 样式。
- 弹窗宽度：新增/编辑 `560px`，详情抽屉 `480px`；移动端占满可视宽度并保留 16px 边距。
- 模态框点击遮罩不关闭；取消按钮和右上角关闭按钮可关闭，并在表单已修改时提示“未保存的内容将丢失”。
- 键盘：`Enter` 在登录/注册页提交；`Esc` 关闭未提交弹窗；焦点始终落在打开弹窗后的第一个可编辑字段。
- 文本、图片缺失统一使用 `-` 或缺省头像，不显示 `null`、`undefined`。
- 日期统一以浏览器本地时区格式化，格式 `YYYY-MM-DD HH:mm:ss`；格式化失败时显示 `-`。
- 不在前端判断最终权限或成功结果；前端控制入口可见性，后端响应才是授权和操作结果的唯一依据。

## 9. 前端验收清单

- [ ] 登录、注册、登录态恢复、登出均使用 Cookie 联调成功。
- [ ] 非管理员无法通过路由或直接 URL 进入 `/user/manage`。
- [ ] 管理员可按账号、昵称、角色、ID 筛选，且翻页、排序、重置行为符合本文规范。
- [ ] 新增、编辑、删除均包含字段校验、loading、防重复提交和成功后刷新。
- [ ] 列表、详情、日志和导出内容均不包含 `userPassword`。
- [ ] 所有用户 ID 按字符串传递和显示；后端 JSON 返回字符串 ID 后再进行端到端验证。
- [ ] `40100`、`40101`、`40000`、`40400`、`42900`、`50000`、网络错误均有可验证的交互反馈。
- [ ] 无后端全量导出接口时，全量导出按钮处于禁用状态或仅提供明确标识的“导出当前页”。
