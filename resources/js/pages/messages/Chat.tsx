import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
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
  is_seen?: boolean;
}

export default function Chat() {
  const { auth } = usePage().props as any;
  const authId = auth?.user?.id;

  const [inbox, setInbox] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showInbox, setShowInbox] = useState(true); // mobile
  const [contacts, setContacts] = useState<User[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  async function loadContacts() {
    const res = await fetch("/messages/contacts");
    const data = await res.json();
    setContacts(data);
  }

  function isLastMineAndSeen(m: Message, index: number) {
    if (m.sender.id !== authId) return false;
    if (!m.is_seen) return false;

    // last message sent by me
    for (let i = messages.length - 1; i > index; i--) {
      if (messages[i].sender.id === authId) return false;
    }

    return true;
  }

  function initials(user: User) {
    return (
      (user.first_name?.[0] || "") +
      (user.last_name?.[0] || "")
    ).toUpperCase();
  }


  /* ================================
      Fetch inbox
  ================================= */
  async function loadInbox() {
    const res = await fetch("/messages");
    const data = await res.json();
    setInbox(data);
  }

  const boxRef = useRef<HTMLDivElement>(null);
  const firstLoadRef = useRef(true);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    if (!boxRef.current) return;

    boxRef.current.scrollTo({
      top: boxRef.current.scrollHeight + 5,
      behavior,
    });
  }

  /* ================================
      Fetch conversation
  ================================= */
  async function openConversation(user: User) {
    firstLoadRef.current = true;

    setActiveUser(user);
    setShowInbox(false);
    setHasMore(true);

    const res = await fetch(`/messages/conversation/${user.id}`);
    const data = await res.json();

    setMessages(data);

    setInbox(prev =>
      prev.map(m =>
        otherUser(m).id === user.id
          ? { ...m, is_seen: true }
          : m
      )
    );
  }

  async function loadOlderMessages() {
    if (!activeUser || loadingOlder || !hasMore || messages.length === 0) return;

    firstLoadRef.current = false;
    
    setLoadingOlder(true);

    const oldestId = messages[0].id;
    const prevHeight = boxRef.current?.scrollHeight || 0;

    const res = await fetch(
      `/messages/conversation/${activeUser.id}?before=${oldestId}`
    );

    const data: Message[] = await res.json();

    if (data.length === 0) {
      setHasMore(false);
    } else {
      setMessages(prev => [...data, ...prev]);

      // keep scroll position
      setTimeout(() => {
        const newHeight = boxRef.current?.scrollHeight || 0;
        boxRef.current?.scrollTo({
          top: newHeight - prevHeight,
        });
      }, 0);
    }

    setLoadingOlder(false);
  }

  const inboxUserIds = inbox.map(m => otherUser(m).id);

  const newContacts = contacts.filter(
    u => !inboxUserIds.includes(u.id)
  );

  /* ================================
      Realtime listener
  ================================= */
  useEffect(() => {
    if (!authId) return;

    loadInbox();
    loadContacts();

    //const channel = window.Echo.private(`chat.${authId}`);
    const channelName = `chat.${authId}`;
    console.log("Subscribing to:", channelName);

    const channel = window.Echo.private(channelName);


    channel.listen(".MessageSent", (e: any) => {
      let msg: Message = e.message;

      const isActiveChat =
        activeUser &&
        (msg.sender.id === activeUser.id ||
        msg.receiver.id === activeUser.id);

      // If currently open, mark as seen instantly (UI side)
      if (isActiveChat && msg.receiver.id === authId) {
        msg = { ...msg, is_seen: true };
      }

      if (isActiveChat) {
        setMessages(prev => [...prev, msg]);
      }

      setInbox(prev => {
        const filtered = prev.filter(
          m =>
            !(
              (m.sender.id === msg.sender.id &&
                m.receiver.id === msg.receiver.id) ||
              (m.sender.id === msg.receiver.id &&
                m.receiver.id === msg.sender.id)
            )
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
    if (!boxRef.current) return;

    // first load of a conversation → jump
    if (firstLoadRef.current) {
      scrollToBottom("auto");
      firstLoadRef.current = false;
    } else {
      // new messages → smooth
      scrollToBottom("smooth");
    }
  }, [messages]);

  /* ================================
      Send message
  ================================= */
  async function send() {
    if (!text.trim() || !activeUser || sending) return;

    const tempId = Date.now(); // temp key
    const tempText = text;

    // create instant fake message
    const optimisticMsg: Message = {
      id: tempId,
      body: tempText,
      sender: auth.user,
      receiver: activeUser,
      created_at: new Date().toISOString(),
      is_seen: false,
    };

    // show instantly
    setMessages(prev => [...prev, optimisticMsg]);

    setInbox(prev => {
      const filtered = prev.filter(
        m =>
          !(
            (m.sender.id === optimisticMsg.sender.id &&
              m.receiver.id === optimisticMsg.receiver.id) ||
            (m.sender.id === optimisticMsg.receiver.id &&
              m.receiver.id === optimisticMsg.sender.id)
          )
      );

      return [optimisticMsg, ...filtered];
    });

    setText("");
    setSending(true);

    try {
      const res = await fetch("/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify({
          receiver_id: activeUser.id,
          body: tempText,
        }),
      });

      const realMsg: Message = await res.json();

      // replace fake with real
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? realMsg : m))
      );

      setInbox(prev =>
        prev.map(m => (m.id === tempId ? realMsg : m))
      );

    } catch {
      // remove fake if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  /* ================================
      Helpers
  ================================= */
  function otherUser(m: Message): User {
    return m.sender.id === authId ? m.receiver : m.sender;
  }

  console.log(messages);

  /* ================================
      UI
  ================================= */
  return (
    <AppLayout
    >
      <Head title="Messages" />

      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Messages
        </h1>

        <div className="flex h-[calc(100vh-10rem)] border rounded-xl overflow-hidden bg-white dark:bg-neutral-900">

          {/* ================= Inbox ================= */}
          <div
            className={`border-r overflow-y-auto w-full md:w-80 dark:border-neutral-700 dark:bg-neutral-900 ${
              showInbox ? "block" : "hidden md:block"
            }`}
          >

            {inbox.length === 0 && (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No conversations yet
              </p>
            )}

            {inbox.map((m, i) => {
              if (!m.sender || !m.receiver) return null;

              const other = otherUser(m);
              const active = activeUser?.id === other.id;

              const isUnread =
                m.receiver.id === authId && m.is_seen === false;

              return (
                <button
                  key={i}
                  onClick={() => openConversation(other)}
                  className={`w-full text-left p-3 border-b dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 ${
                    active ? "bg-gray-100 dark:bg-neutral-800" : ""
                  }`}
                >
                  <div className={`font-medium text-gray-900 dark:text-gray-100 ${isUnread ? "font-bold" : ""}`}>
                    {other.first_name} {other.last_name}
                  </div>

                  <div
                    className={`text-xs truncate ${
                      isUnread
                        ? "font-semibold text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {m.body}
                  </div>
                </button>
              );
            })}

            {/* ===== New Contacts (no conversation yet) ===== */}
            {newContacts.length > 0 && (
              <div className="mt-4 border-t dark:border-neutral-700">
                <div className="p-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  New Message
                </div>

                {newContacts.map(user => {
                  const active = activeUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => openConversation(user)}
                      className={`w-full text-left p-3 border-b dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 ${
                        active ? "bg-gray-100 dark:bg-neutral-800" : ""
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Start new conversation
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= Chat ================= */}
          <div
            className={`flex-1 flex flex-col ${
              showInbox ? "hidden md:flex" : "flex"
            }`}
          >
            {!activeUser && (
              <div className="flex flex-1 items-center justify-center text-gray-400">
                Select a conversation
              </div>
            )}

            {activeUser && (
              <>
                {/* Header */}
                <div className="p-4 border-b font-semibold flex items-center gap-2 dark:border-neutral-700 text-gray-900 dark:text-gray-100">
                  <button
                    className="md:hidden text-sm text-gray-500 dark:text-gray-400"
                    onClick={() => {
                      setShowInbox(true);
                      setActiveUser(null);
                      setMessages([]);
                    }}
                  >
                    ← Back
                  </button>
                  {activeUser.first_name} {activeUser.last_name}
                </div>

                {/* Messages */}
                <div
                  ref={boxRef}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    if (el.scrollTop < 50) {
                      loadOlderMessages();
                    }
                  }}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-neutral-800"
                >
                  {loadingOlder && (
                    <div className="text-center text-xs text-gray-400 py-2">
                      Loading older messages...
                    </div>
                  )}

                  {!hasMore && messages.length > 0 && (
                    <div className="text-center text-xs text-gray-400 py-2">
                      No more messages
                    </div>
                  )}
                  {messages.map((m, i) => {
                    if (!m.sender || !m.receiver) return null;

                    const mine = m.sender.id === authId;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        {/* wrapper so Seen can sit under bubble */}
                        <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[75%]`}>

                          {/* bubble */}
                          <div
                            className={`
                              px-3 py-2 rounded-2xl text-sm shadow
                              ${
                                mine
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 border dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700 rounded-bl-sm"
                              }
                            `}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>

                            <div className="mt-1 text-[10px] opacity-70 text-right">
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          {/* Seen text (outside bubble) */}
                          {isLastMineAndSeen(m, i) && (
                            <div className="mt-1 mr-1 text-[11px] text-gray-400">
                              Seen
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="ml-auto text-xs text-gray-400">
                      Sending…
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t flex items-center gap-2 bg-white dark:bg-neutral-900 dark:border-neutral-700">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                    disabled={sending}
                  />
                  <button
                    onClick={send}
                    disabled={sending || !text.trim()}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
