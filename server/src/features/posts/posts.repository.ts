import { postsMock, tagsMock } from "./data.mock";

export const postsRepository = {
  findAll: async () => postsMock,
  findById: async (id: string) => postsMock.find((item) => item.id === id),
  findTags: async () => tagsMock,
};