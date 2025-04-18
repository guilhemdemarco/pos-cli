export type UserRole = 'admin' | 'cashier'

export interface User {
    id: string
    username: string
    password: string // todo: hash the password
    role: UserRole
}