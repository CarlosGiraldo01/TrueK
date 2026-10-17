import { NotificationBase } from "./NotificationBase";

interface Props {
  name: string;
  avatarUrl?: string;
  message?: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationRequestRejected({ message = "Ha rechazado tu solicitud.", ...props }: Props) {
  return <NotificationBase tone="orange" message={message} {...props} />;
}