import { NotificationBase } from "./NotificationBase";

interface Props {
  name: string;
  avatarUrl?: string;
  message?: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationServiceFinished({ message = "Tu servicio ha terminado!", ...props }: Props) {
  return <NotificationBase tone="lime" message={message} {...props} />;
}