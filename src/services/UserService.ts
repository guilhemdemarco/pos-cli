import type { User } from "../models/User";

let loggedin_users: Map<String, User> = new Map<String, User>()

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
  return user ?? null;
}
