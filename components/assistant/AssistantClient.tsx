"use client";

import { FormEvent, useState } from "react";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createMessage(
  role: AssistantMessage["role"],
  content: string,
  id?: string
): AssistantMessage {
  return {
    id: id || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
  };
}

export function AssistantClient() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createMessage(
      "assistant",
      "I am K.E.E Tech. I can help with products, cart, chat, orders, profile, admin pages, and assistant actions.",
      "assistant-welcome"
    )
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const nextMessages = [...messages, createMessage("user", input)];
    setMessages(nextMessages);
    setPending(true);
    setInput("");

    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages })
    });

    const data = await response.json();
    setPending(false);

    setMessages((current) => [
      ...current,
      createMessage("assistant", data.reply || "I could not complete that request.")
    ]);
  }

  return (
    <section className="assistant-layout">
      <div className="stack-card">
        <span className="eyebrow">K.E.E Tech</span>
        <h1>Smart system assistant</h1>
        <div className="assistant-thread">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={message.role === "user" ? "message-bubble mine" : "message-bubble"}
            >
              <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
              <p>{message.content}</p>
            </div>
          ))}
        </div>
      </div>

      <form className="stack-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Ask for help</span>
        <p className="muted">
          Try: "Find sneakers under 100000", "Add the classic sneaker to my cart",
          "Message the seller about size", or "Place my order with Airtel Money".
        </p>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={5}
          placeholder="Tell the assistant what you want to do"
        />
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Thinking..." : "Send"}
        </button>
      </form>
    </section>
  );
}
