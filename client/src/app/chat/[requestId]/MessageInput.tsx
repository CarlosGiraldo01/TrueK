"use client";

import { useState } from "react";
import axios from "axios";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { MESSAGE_MAX_LENGTH, useChat } from "@/context/ChatContext";

export function MessageInput() {
  const { createMessage } = useChat();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    const content = text.trim();
    if (!content) return;
    if (content.length > MESSAGE_MAX_LENGTH) {
      setErrorMessage(`El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres`);
      return;
    }

    setErrorMessage("");
    setIsSending(true);
    try {
      await createMessage(content);
      setText("");
    } catch (err) {
      const serverMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setErrorMessage(
        typeof serverMessage === "string" && serverMessage
          ? serverMessage
          : "No se pudo enviar el mensaje. Intenta de nuevo."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
      <div className="flex items-center gap-3 rounded-2xl bg-truek-input px-5 py-3 focus-within:ring-1 focus-within:ring-white/40">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (errorMessage) setErrorMessage("");
          }}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Envía un mensaje aquí"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-truek-placeholder"
        />
        <button
          type="submit"
          disabled={isSending}
          aria-label="Enviar mensaje"
          className="shrink-0 text-white transition-opacity active:opacity-60 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="size-6" strokeWidth={1.5} />
        </button>
      </div>
      {errorMessage && (
        <p role="alert" className="mt-2 px-1 text-xs font-medium text-red-400">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
