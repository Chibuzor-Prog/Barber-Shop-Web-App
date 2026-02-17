export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
};

export const users: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "1234567890", password: "123456", role: "user" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "0987654321", password: "123456", role: "user"},
  { id: 3, name: "Sammy Hansworth", email: "sammy@example.com", phone: "1234567890", password: "123456", role: "user" },
  { id: 4, name: "Juliet Jackson", email: "admin@salon.com", phone: "0987654321", password: "567890", role: "admin" },
];
