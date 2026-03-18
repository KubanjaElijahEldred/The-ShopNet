"use client";

import { useState, useRef, useEffect } from "react";
import { AssistantClient } from "./AssistantClient";

export function DraggableAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initialize position after mount to avoid hydration mismatch
    const saved = localStorage.getItem("ai-assistant-position");
    if (saved) {
      setPosition(JSON.parse(saved));
    } else {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80
      });
    }
    setIsMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return; // Don't drag when modal is open
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep button within viewport bounds
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem("ai-assistant-position", JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  const handleClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={`ai-assistant-fab ${isDragging ? "dragging" : ""}`}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab"
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        aria-label="AI Shopping Assistant"
        title="AI Shopping Assistant"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v4" />
          <path d="M12 17v4" />
          <path d="m5.6 5.6 2.8 2.8" />
          <path d="m15.6 15.6 2.8 2.8" />
          <path d="M3 12h4" />
          <path d="M17 12h4" />
          <path d="m5.6 18.4 2.8-2.8" />
          <path d="m15.6 8.4 2.8-2.8" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      </button>

      {isOpen && (
        <div className="ai-assistant-modal">
          <div className="ai-assistant-modal-content">
            <div className="ai-assistant-header">
              <h3>AI Shopping Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="ai-assistant-close"
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>
            <div className="ai-assistant-body">
              <AssistantClient />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
