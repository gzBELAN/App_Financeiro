export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
};

export type CreateCategoryInput = {
  name: string;
  color: string;
  icon?: string;
};

export type UpdateCategoryInput = CreateCategoryInput & {
  id: string;
};

export interface CategoryRepository {
  list(): Promise<Category[]>;
  create(input: CreateCategoryInput): Promise<void>;
  update(input: UpdateCategoryInput): Promise<void>;
  delete(id: string): Promise<void>;
}