import Link from "next/link";
import { Avatar } from "@/components/ui";
import type { Post, User } from "@/types";

interface ProviderCardProps {
  post: Post;
  provider: User;
}

export function ProviderCard({ post, provider }: ProviderCardProps) {
  return (
    <div className="rounded-3xl border border-truek-lime bg-truek-card p-4 shadow-xl">
      <div className="flex items-center gap-4">
        <Avatar src={provider.profile_picture ?? undefined} name={provider.name} size="md" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-white">{provider.name}</h2>
          <p className="truncate text-sm text-truek-placeholder">{post.name}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-truek-line bg-truek-surface px-3 py-1 text-xs text-white"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/80">{post.description}</p>

      <Link
        href={`/post/${post.id}`}
        className="mt-4 block rounded-xl bg-truek-lime py-2.5 text-center text-sm font-semibold text-truek-black active:opacity-80"
      >
        Ver publicación
      </Link>
    </div>
  );
}
