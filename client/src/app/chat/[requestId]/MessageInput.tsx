"use client";

import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useChat } from "@/context/ChatContext";

export function MessageInput() {
  const { createMessage } = useChat();
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    createMessage(content);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
      <div className="flex items-center gap-3 rounded-2xl bg-truek-input px-5 py-3 focus-within:ring-1 focus-within:ring-white/40">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Envía un mensaje aquí"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-truek-placeholder"
        />
        <button
          type="submit"
          aria-label="Enviar mensaje"
          className="shrink-0 text-white transition-opacity active:opacity-60"
        >
          <PaperAirplaneIcon className="size-6" strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}