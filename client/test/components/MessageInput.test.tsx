import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MessageInput } from "@/app/chat/[requestId]/MessageInput";
import type { Message } from "@/types";

const createMessage = vi.hoisted(() => vi.fn());

vi.mock("@/context/ChatContext", () => ({
  MESSAGE_MAX_LENGTH: 1000,
  useChat: () => ({ createMessage }),
}));

const sent: Message = {
  id: "m1",
  service_request_id: "req-1",
  sender_id: "u1",
  content: "hola",
  created_at: "2026-01-01T00:00:00Z",
};

const input = () => screen.getByPlaceholderText("Envía un mensaje aquí");
const sendButton = () => screen.getByRole("button", { name: "Enviar mensaje" });

describe("MessageInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMessage.mockResolvedValue(sent);
  });

  it("sends the trimmed text on submit", async () => {
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "  hola  ");
    await user.click(sendButton());

    expect(createMessage).toHaveBeenCalledWith("hola");
  });

  it("clears the input after a successful send", async () => {
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "hola");
    await user.click(sendButton());

    await waitFor(() => expect(input()).toHaveValue(""));
  });

  it("shows the server message in an alert and keeps the text when sending fails", async () => {
    createMessage.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "No participaste en esta solicitud" } },
    });
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "hola");
    await user.click(sendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("No participaste en esta solicitud");
  });

  it("keeps the typed text when sending fails", async () => {
    createMessage.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "hola");
    await user.click(sendButton());

    await screen.findByRole("alert");
    expect(input()).toHaveValue("hola");
  });

  it("shows a generic message when the error is not from the server", async () => {
    createMessage.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "hola");
    await user.click(sendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo enviar el mensaje. Intenta de nuevo.");
  });

  it("does not call createMessage for whitespace-only text", async () => {
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "   ");
    await user.click(sendButton());

    expect(createMessage).not.toHaveBeenCalled();
  });

  it("does not call createMessage for an empty input", async () => {
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.click(sendButton());

    expect(createMessage).not.toHaveBeenCalled();
  });

  it("disables the button while the message is being sent", async () => {
    let resolveSend: (m: Message) => void = () => {};
    createMessage.mockReturnValue(
      new Promise<Message>((resolve) => {
        resolveSend = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<MessageInput />);

    await user.type(input(), "hola");
    await user.click(sendButton());

    expect(sendButton()).toBeDisabled();
    resolveSend(sent);
    await waitFor(() => expect(sendButton()).toBeEnabled());
  });
});
