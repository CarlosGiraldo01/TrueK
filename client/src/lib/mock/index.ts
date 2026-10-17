import { POSTS } from "./posts";
import { RATINGS } from "./ratings";
import { USERS } from "./users";

export * from "./types";
export { placeholderImage } from "./images";
export { NOTIFICATIONS } from "./notifications";
export { POSTS, TAGS } from "./posts";
export { RATINGS } from "./ratings";
export { SERVICE_REQUESTS } from "./requests";
export { CURRENT_USER_ID, USERS } from "./users";

export function getUserById(id: string) {
  return USERS.find((user) => user.id === id);
}

export function getPostById(id: string) {
  return POSTS.find((post) => post.id === id);
}

export function getUserRating(userId: string) {
  const received = RATINGS.filter((r) => r.rated_user_id === userId);
  if (received.length === 0) return 0;
  return received.reduce((sum, r) => sum + r.rating, 0) / received.length;
}