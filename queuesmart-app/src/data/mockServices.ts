export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  priority: "low" | "medium" | "high";
};

export const services: Service[] = [
  { id: 1, name: "Haircut (Men)", description: "Standard haircut", duration: 30, priority: "medium" },
  { id: 2, name: "Haircut & Beard", description: "Haircut and beard trim", duration: 45, priority: "high" },
  { id: 3, name: "Shampoo", description: "Hair wash and shampoo", duration: 20, priority: "low" },
  { id: 4, name: "Haircut (Women)", description: "Women's haircut", duration: 40, priority: "medium" },
];
