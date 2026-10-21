import { Avatar } from "@/components/ui";
import type { User } from "@/lib/mock";

// Avatar, name and tags of the provider at the top of the "Agendar Servicio" card.
export function ProviderHeader({ provider, tags }: { provider: User | undefined; tags: string[] }) {
  const name = provider?.name ?? "Prestador";

  return (
    <div className="flex items-center gap-4">
      <Avatar src={provider?.profile_picture ?? undefined} name={name} size="md" />
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-white">{name}</h2>
        <ul className="mt-1.5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="whitespace-nowrap rounded-full border border-truek-line bg-black px-3 py-0.5 text-[11px] leading-3.5 text-white"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
