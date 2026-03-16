"use client";

import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DragState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  moved: boolean;
};

const POSITION_KEY = "shopnet-kee-tech-position";

function createMessage(role: AssistantMessage["role"], content: string): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function KEETechAssistant() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createMessage(
      "assistant",
      "Hi, I am K.E.E Tech. I can guide products, cart, chat, orders, profile, admin pages, and assistant tasks."
    )
  ]);
  const drag = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    moved: false
  });
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POSITION_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setOffset({ x: parsed.x, y: parsed.y });
      }
    } catch {
      // Ignore malformed localStorage values.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(offset));
  }, [offset]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, open]);

  const launcherStyle = useMemo(
    () => ({ transform: `translate(${offset.x}px, ${offset.y}px)` }),
    [offset.x, offset.y]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) {
      return;
    }

    const nextMessages = [...messages, createMessage("user", trimmed)];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      const data = await response.json().catch(() => ({}));
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          typeof data?.reply === "string" && data.reply.trim()
            ? data.reply
            : "I could not complete that action right now."
        )
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Network error. Please try again.")
      ]);
    } finally {
      setPending(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.current.moved = true;
    }

    const maxX = Math.max(80, window.innerWidth * 0.45);
    const maxY = Math.max(80, window.innerHeight * 0.45);

    setOffset({
      x: clamp(drag.current.baseX + dx, -maxX, maxX),
      y: clamp(drag.current.baseY + dy, -maxY, maxY)
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current.pointerId !== event.pointerId) {
      return;
    }

    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    const shouldToggle = !drag.current.moved;
    drag.current.pointerId = null;
    if (shouldToggle) {
      setOpen((current) => !current);
    }
  }

  return (
    <div className="kee-tech-launcher" style={launcherStyle}>
      {open ? (
        <section className="kee-tech-panel" aria-label="K.E.E Tech assistant">
          <header className="kee-tech-panel-head">
            <div>
              <strong>K.E.E Tech</strong>
              <p>Smart ShopNet assistant</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
              ×
            </button>
          </header>

          <div className="kee-tech-thread" ref={threadRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "user" ? "kee-tech-msg mine" : "kee-tech-msg"}
              >
                <strong>{message.role === "user" ? "You" : "K.E.E Tech"}</strong>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="kee-tech-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything about ShopNet..."
              disabled={pending}
            />
            <button type="submit" disabled={pending || !input.trim()}>
              {pending ? "..." : "Send"}
            </button>
          </form>

          <div className="kee-tech-foot">
            <Link href="/assistant">Open full assistant</Link>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="kee-tech-fab"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Open K.E.E Tech assistant"
      >
        <span className="kee-tech-fab-icon">AI</span>
        <span className="kee-tech-fab-label">K.E.E Tech</span>
      </button>
    </div>
  );
}
