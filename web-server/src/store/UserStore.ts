import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'user'
  canEditPublicKB?: boolean
  created_at: string
}

export interface UserSession {
  token: string
  userId: string
  created_at: string
}

const DB_FILE = path.join(process.cwd(), 'storage', 'users.json')
const SESSIONS_FILE = path.join(process.cwd(), 'storage', 'sessions.json')

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export class UserStore {
  private users: User[] = []
  private sessions: UserSession[] = []

  constructor() {
    this.load()
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        this.users = fs.readJsonSync(DB_FILE)
      } catch (e) {
        console.error('Failed to load users', e)
        this.users = []
      }
    }

    if (fs.existsSync(SESSIONS_FILE)) {
      try {
        this.sessions = fs.readJsonSync(SESSIONS_FILE)
      } catch (e) {
        this.sessions = []
      }
    }

    // Ensure default admin exists
    if (!this.users.find((u) => u.role === 'admin')) {
      this.users.push({
        id: uuidv4(),
        username: 'cowx',
        passwordHash: hashPassword('123456'),
        role: 'admin',
        created_at: new Date().toISOString()
      })
      this.saveUsers()
    }
  }

  saveUsers() {
    fs.outputJsonSync(DB_FILE, this.users, { spaces: 2 })
  }

  saveSessions() {
    fs.outputJsonSync(SESSIONS_FILE, this.sessions, { spaces: 2 })
  }

  // Auth
  authenticate(username: string, password: string): { user: User; token: string } | null {
    const user = this.users.find((u) => u.username === username && u.passwordHash === hashPassword(password))
    if (!user) return null

    const token = uuidv4() + '-' + uuidv4()
    this.sessions.push({
      token,
      userId: user.id,
      created_at: new Date().toISOString()
    })
    this.saveSessions()

    return { user, token }
  }

  getUserByToken(token: string): User | null {
    const session = this.sessions.find((s) => s.token === token)
    if (!session) return null
    return this.users.find((u) => u.id === session.userId) || null
  }

  logout(token: string) {
    this.sessions = this.sessions.filter((s) => s.token !== token)
    this.saveSessions()
  }

  // User management
  getAll(): Omit<User, 'passwordHash'>[] {
    return this.users.map(({ passwordHash, ...rest }) => rest)
  }

  createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): User | null {
    if (this.users.find((u) => u.username === username)) {
      return null // Username already exists
    }
    const user: User = {
      id: uuidv4(),
      username,
      passwordHash: hashPassword(password),
      role,
      created_at: new Date().toISOString()
    }
    this.users.push(user)
    this.saveUsers()
    return user
  }

  deleteUser(id: string): boolean {
    const user = this.users.find((u) => u.id === id)
    if (!user || user.role === 'admin') return false // Can't delete admin
    this.users = this.users.filter((u) => u.id !== id)
    this.sessions = this.sessions.filter((s) => s.userId !== id)
    this.saveUsers()
    this.saveSessions()
    return true
  }

  changePassword(userId: string, newPassword: string): boolean {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return false
    user.passwordHash = hashPassword(newPassword)
    this.saveUsers()
    return true
  }

  updateUser(id: string, updates: { canEditPublicKB?: boolean }): User | null {
    const user = this.users.find((u) => u.id === id)
    if (!user) return null
    if (typeof updates.canEditPublicKB === 'boolean') {
      user.canEditPublicKB = updates.canEditPublicKB
    }
    this.saveUsers()
    return user
  }
}

export const userStore = new UserStore()
