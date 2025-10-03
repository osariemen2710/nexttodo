export interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  // Optional long-form details for the todo
  detail?: string;
}
