import { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface Message {
  id: number;
  body: string;
  sender: User;
  receiver: User;
  created_at: string;
}

export default function Chat() {
  const { auth } = usePage().props as any;
  const authId = auth?.user?.id;

  const [inbox, setInbox] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [text, setText] = useState("");

  const boxRef = useRef<HTMLDivElement>(null);

  /* ================================
      Fetch inbox
  ================================= */
  async function loadInbox() {
    const res = await fetch("/messages");
    const data = await res.json();
    setInbox(data);
  }

  /* ================================
      Fetch conversation
  ================================= */
  async function openConversation(user: User) {
    setActiveUser(user);

    const res = await fetch(`/messages/conversation/${user.id}`);
    const data = await res.json();
    setMessages(data);
  }

  /* ================================
      Realtime listener
  ================================= */
  useEffect(() => {
    if (!authId) return;

    loadInbox();

    const channel = window.Echo.private(`chat.${authId}`);

    channel.listen(".MessageSent", (e: any) => {
      const msg: Message = e.message;

      // push message if current chat is open
      if (
        activeUser &&
        (msg.sender.id === activeUser.id ||
          msg.receiver.id === activeUser.id)
      ) {
        setMessages(prev => [...prev, msg]);
      }

      // move conversation to top
      setInbox(prev => {
        const filtered = prev.filter(
          m =>
            m.sender.id !== msg.sender.id &&
            m.receiver.id !== msg.sender.id
        );
        return [msg, ...filtered];
      });
    });

    return () => {
      window.Echo.leave(`private-chat.${authId}`);
    };
  }, [activeUser]);

  /* ================================
      Auto scroll
  ================================= */
  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  /* ================================
      Send message
  ================================= */
  async function send() {
    if (!text.trim() || !activeUser) return;

    await fetch("/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN":
          document.querySelector('meta[name="csrf-token"]')?.getAttribute(
            "content"
          ) || "",
      },
      body: JSON.stringify({
        receiver_id: activeUser.id,
        body: text,
      }),
    });

    setText("");
  }

  /* ================================
      Helpers
  ================================= */
  function otherUser(m: Message): User {
    return m.sender.id === authId ? m.receiver : m.sender;
  }

  /* ================================
      UI
  ================================= */
  return (
    <div className="flex h-[calc(100vh-4rem)] border rounded overflow-hidden bg-white">

      {/* ================= Inbox ================= */}
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-4 font-semibold text-lg border-b">Messages</div>

        {inbox.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No conversations yet</p>
        )}

        {inbox.map((m, i) => {
          const other = otherUser(m);
          const active = activeUser?.id === other.id;

          return (
            <button
              key={i}
              onClick={() => openConversation(other)}
              className={`w-full text-left p-3 border-b hover:bg-gray-100 ${
                active ? "bg-gray-100" : ""
              }`}
            >
              <div className="font-medium">
                {other.first_name} {other.last_name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {m.body}
              </div>
            </button>
          );
        })}
      </div>

      {/* ================= Chat ================= */}
      <div className="flex-1 flex flex-col">

        {!activeUser && (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}

        {activeUser && (
          <>
            {/* Header */}
            <div className="p-4 border-b font-semibold">
              {activeUser.first_name} {activeUser.last_name}
            </div>

            {/* Messages */}
            <div
              ref={boxRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
            >
              {messages.map(m => {
                const mine = m.sender.id === authId;

                return (
                  <div
                    key={m.id}
                    className={`max-w-xs px-3 py-2 rounded text-sm ${
                      mine
                        ? "ml-auto bg-blue-600 text-white"
                        : "mr-auto bg-white border"
                    }`}
                  >
                    {m.body}
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={send}
                className="px-4 py-2 rounded bg-black text-white text-sm"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
