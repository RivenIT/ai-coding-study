export type UserId = string

export type UserRole = 'user' | 'admin'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export interface LoginUserVO {
  id: UserId
  userAccount: string
  userName: string | null
  userAvatar: string | null
  userProfile: string | null
  userRole: UserRole
  createTime: string | null
  updateTime: string | null
}

export interface UserVO {
  id: UserId
  userAccount: string
  userName: string | null
  userAvatar: string | null
  userProfile: string | null
  userRole: UserRole
  createTime: string | null
}

export interface UserRegisterRequest {
  userAccount: string
  userPassword: string
  checkPassword: string
}

export interface UserLoginRequest {
  userAccount: string
  userPassword: string
}

export interface UserAddRequest {
  userAccount: string
  userName: string
  userAvatar?: string
  userProfile?: string
  userRole: UserRole
}

export interface UserUpdateRequest {
  id: UserId
  userName: string
  userAvatar?: string
  userProfile?: string
  userRole: UserRole
}

export interface UserQueryRequest {
  pageNum: number
  pageSize: number
  sortField: 'id' | 'userAccount' | 'userName' | 'userRole' | 'createTime'
  sortOrder: 'ascend' | 'descend'
  id?: UserId
  userAccount?: string
  userName?: string
  userProfile?: string
  userRole?: UserRole
}

export type UserQueryInput = Partial<UserQueryRequest>

export interface PageResult<T> {
  records: T[]
  totalRow: number
  pageNumber?: number
  pageSize?: number
}
