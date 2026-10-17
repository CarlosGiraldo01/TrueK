import { NotificationBase } from "./NotificationBase";

interface Props {
  name: string;
  avatarUrl?: string;
  message?: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationRequestAccepted({ message = "Ha aceptado tu solicitud!", ...props }: Props) {
  return <NotificationBase tone="lime" message={message} {...props} />;
}