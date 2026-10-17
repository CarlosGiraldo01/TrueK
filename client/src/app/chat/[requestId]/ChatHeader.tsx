import { Avatar } from "@/components/ui";

interface ChatHeaderProps {
  name: string;
  picture?: string;
}

export function ChatHeader({ name, picture }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-4 border-b border-truek-field px-5 py-4">
      <Avatar src={picture} name={name} size={48} />
      <p className="truncate text-base font-medium text-white">{name}</p>
    </div>
  );
}