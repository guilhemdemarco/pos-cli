import { createHash } from "crypto";
import type { User } from "../models/User";

let loggedin_users: Map<String, User> = new Map<String, User>()
let loggedin_users_reverse: Map<User, String> = new Map<User, String>()

const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // TODO: replace with hashed passwords
    role: "admin"
  },
  {
    id: "2",
    username: "cashier1",
    password: "cashier123",
    role: "cashier"
  }
];

export function authenticate(username: string, password: string): User | null {
  const user = users.find(u => u.username === username && u.password === password);
  // if (user) {
  //   if (!loggedin_users_reverse.has(user)) {
  //     const session_id = createHash("sha256").update(user.id + user.username + new Date().getTime()).digest("hex")
  //     loggedin_users.set(session_id, user)
  //     loggedin_users_reverse.set(user, session_id)
  //   }
  //   return user
  // }
  return user ?? null;
}
