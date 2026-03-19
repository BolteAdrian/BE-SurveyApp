export interface IEmailContact {
  id: string;
  listId: string;
  email: string;
  name?: string;
  createdAt: Date;
}