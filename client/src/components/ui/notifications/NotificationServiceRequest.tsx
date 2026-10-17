import { NotificationBase } from "./NotificationBase";

interface Props {
  name: string;
  avatarUrl?: string;
  tag?: string;
  message?: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationServiceRequest({ message = "Solicita tus servicios de:", ...props }: Props) {
  return <NotificationBase tone="orange" message={message} {...props} />;
}