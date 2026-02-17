import { Service } from "./data/mockServices";
import { User } from "./data/mockUsers";

export type QueueItem = {
  id: number;
  user: User;
  service: Service;
  status: "waiting" | "almost ready" | "served";
  ticketNumber: number;
};
