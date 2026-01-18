import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Image as ImageIcon, Plus, Download, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface Message {
  id: number;
  body: string;
  image_path?: string | null;
  image_batch_id?: string | null;
  sender: User;
  receiver: User;
  created_at: string;
  is_seen?: boolean;
  has_unread?: boolean;
  optimistic?: boolean;
  loadingImage?: boolean;
}

export default function Chat() {
  const { auth } = usePage().props as any;
  const authId = auth?.user?.id;

  const [inbox, setInbox] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [text, setText] = useState("");
  const [sendingCount, setSendingCount] = useState(0);
  const [showInbox, setShowInbox] = useState(true); // mobile
  const [contacts, setContacts] = useState<User[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const imageLoadedMap = useRef<Record<number, boolean>>({});
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const isPrependingRef = useRef(false);
  const isNearBottomRef = useRef(true);

  async function loadContacts() {
    const res = await fetch("/messages/contacts");
    const data = await res.json();
    setContacts(data);
  }

  function openViewer(src: string) {
    setViewerSrc(src);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerSrc(null);
  }

  function isNewDay(curr: Message, prev?: Message) {
    if (!prev) return true;

    const d1 = new Date(curr.created_at).toDateString();
    const d2 = new Date(prev.created_at).toDateString();

    return d1 !== d2;
  }

  function formatDayLabel(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();

    const diff =
      new Date(today.toDateString()).getTime() -
      new Date(date.toDateString()).getTime();

    const oneDay = 24 * 60 * 60 * 1000;

    if (diff === 0) return "Today";
    if (diff === oneDay) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeViewer();
    }

    if (viewerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);


  /* ================================
      Fetch inbox
  ================================= */
  async function loadInbox() {
    setLoadingInbox(true);
    try {
      const res = await fetch("/messages");
      const data = await res.json();
      setInbox(data);
    } finally {
      setLoadingInbox(false);
    }
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

  function forceScrollBottom() {
    if (!boxRef.current) return;

    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }

  function shouldShowTime(curr: Message, next?: Message) {
    if (!next) return true;

    const t1 = new Date(curr.created_at).getTime();
    const t2 = new Date(next.created_at).getTime();

    // show if more than 5 minutes gap
    return Math.abs(t2 - t1) > 5 * 60 * 1000;
  }

  /* ================================
      Fetch conversation
  ================================= */
  async function openConversation(user: User) {
    firstLoadRef.current = true;

    setActiveUser(user);
    setShowInbox(false);
    setHasMore(true);
    setLoadingConversation(true);

    const res = await fetch(`/messages/conversation/${user.id}`);
    const data = await res.json();

    imageLoadedMap.current = {};

    setMessages(
      data.map((m: Message) =>
        m.image_path
          ? { ...m, loadingImage: true }
          : m
      )
    );
    setLoadingConversation(false);

    // MARK AS SEEN IN DATABASE
    await fetch(`/messages/conversation/${user.id}/seen`, {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN":
          document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
      },
    });

    window.dispatchEvent(new Event("messages-seen"));

    // UI update (optional, for instant feedback)
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
    isPrependingRef.current = true; // tell auto-scroll we are prepending

    setLoadingOlder(true);

    const oldestId = messages[0].id;
    const prevHeight = boxRef.current?.scrollHeight || 0;

    const res = await fetch(
      `/messages/conversation/${activeUser.id}?before=${oldestId}`
    );

    const data: Message[] = await res.json();

    if (data.length === 0) {
      setHasMore(false);
      isPrependingRef.current = false; // reset
    } else {
      setMessages(prev => [...data, ...prev]);

      setTimeout(() => {
        const newHeight = boxRef.current?.scrollHeight || 0;
        boxRef.current?.scrollTo({
          top: newHeight - prevHeight,
        });

        isPrependingRef.current = false; // reset after restoring scroll
      }, 0);
    }

    setLoadingOlder(false);
  }

  const inboxUserIds = inbox.map(m => otherUser(m).id);

  const newContacts = contacts.filter(
    u => !inboxUserIds.includes(u.id)
  );

  function matches(user: User) {
    const q = search.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(q) ||
      user.last_name.toLowerCase().includes(q)
    );
  }

  const filteredInbox = inbox.filter(m => matches(otherUser(m)));
  const filteredNewContacts = newContacts.filter(u => matches(u));

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
        activeUser && msg.sender.id === activeUser.id;

      // If currently open, mark as seen instantly
      if (isActiveChat && msg.receiver.id === authId) {
        msg = { ...msg, is_seen: true, has_unread: false };

        fetch(`/messages/${msg.id}/seen`, {
          method: "POST",
          headers: {
            "X-CSRF-TOKEN":
              document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        });
      }

      // IMPORTANT PART
      if (!isActiveChat && msg.receiver.id === authId) {
        msg = { ...msg, has_unread: true };
      }

      if (isActiveChat) {
        setMessages(prev => {
          if (prev.some(p => p.id === msg.id)) return prev;
          return [...prev, msg];
        });
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
    window.Echo.leave(`chat.${authId}`);
  };
  }, [activeUser]);

  /* ================================
      Auto scroll
  ================================= */

  useEffect(() => {
  if (!boxRef.current) return;

  // always scroll on first open
  if (firstLoadRef.current) {
      scrollToBottom("auto");
      firstLoadRef.current = false;
      return;
    }

    // never scroll when loading older messages
    if (isPrependingRef.current) return;

    // only auto-scroll if user is near bottom
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages])

  async function sendImage(file: File, batchId: string) {
    if (!activeUser ) return;

    setSendingCount(c => c + 1);

    const tempId = Date.now() + Math.random();

    const optimisticMsg: Message = {
      id: tempId,
      body: "",
      image_path: URL.createObjectURL(file),
      image_batch_id: batchId,
      sender: auth.user,
      receiver: activeUser,
      created_at: new Date().toISOString(),
      is_seen: false,
      optimistic: true,
      loadingImage: true,
    };

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

    try {
      const formData = new FormData();
      formData.append("receiver_id", String(activeUser.id));
      formData.append("image", file);
      formData.append("image_batch_id", batchId);

      const res = await fetch("/messages", {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: formData,
      });

      const realMsg: Message = await res.json();

      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...realMsg, loadingImage: true }
            : m
        )
      );

      setInbox(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...realMsg, loadingImage: true }
            : m
        )
      );

    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSendingCount(c => Math.max(0, c - 1));
    }
  }

  /* ================================
      Send message
  ================================= */
  async function send() {
    if (!text.trim() || !activeUser) return;

    setSendingCount(c => c + 1);

    const tempId = Date.now();

    const optimisticMsg: Message = {
      id: tempId,
      body: text,
      image_path: null,
      sender: auth.user,
      receiver: activeUser,
      created_at: new Date().toISOString(),
      is_seen: false,
      optimistic: true,
    };

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

    try {
      const formData = new FormData();
      formData.append("receiver_id", String(activeUser.id));
      formData.append("body", text);

      const res = await fetch("/messages", {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: formData,
      });

      const realMsg: Message = await res.json();

      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...realMsg, loadingImage: true } // keep bubble alive
            : m
        )
      );

      setInbox(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...realMsg, loadingImage: true }
            : m
        )
      );

    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSendingCount(c => Math.max(0, c - 1));
    }
  }

  /* ================================
      Helpers
  ================================= */
  function otherUser(m: Message): User {
    return m.sender.id === authId ? m.receiver : m.sender;
  }

  console.log(messages);

  function groupMessages(messages: Message[]) {
    const result: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];

      // image with batch
      if (m.image_path && m.image_batch_id) {
        const last = result[result.length - 1];

        if (
          last &&
          last.type === "image-batch" &&
          last.batchId === m.image_batch_id
        ) {
          last.items.push(m);
        } else {
          result.push({
            type: "image-batch",
            batchId: m.image_batch_id,
            senderId: m.sender.id,
            items: [m],
          });
        }
      } else {
        result.push({
          type: "single",
          message: m,
        });
      }
    }

    return result;
  }

  function ImageGrid({
    images,
    onLastImageLoad,
  }: {
    images: Message[];
    onLastImageLoad?: () => void;
  }) {
    const [, forceUpdate] = useState(0);

    const count = images.length;

    const grid =
      count === 1
        ? "grid-cols-1"
        : count === 2
        ? "grid-cols-2"
        : count === 3
        ? "grid-cols-2 grid-rows-2"
        : "grid-cols-2";

    const wrapperSize =
      count === 1
        ? "max-w-[70%] sm:max-w-[260px] md:max-w-[320px]"
        : "max-w-[90%] sm:max-w-[320px] md:max-w-[360px]";

    return (
      <div className={`grid ${grid} gap-1.5 ${wrapperSize}`}>
        {images.map((img, i) => {
          const isLoaded =
            imageLoadedMap.current[img.id] === true &&
            img.loadingImage !== true;

          const isLastSingle =
            count > 1 && count % 2 === 1 && i === count - 1;

          const src = img.image_path!.startsWith("blob:")
            ? img.image_path!
            : `/storage/${img.image_path}`;

          return (
            <div
              key={img.id}
              className={`relative w-full aspect-square sm:aspect-[4/3]
                          min-h-[120px]
                          rounded-xl overflow-hidden
                          bg-gray-300 dark:bg-neutral-700
                          ${isLastSingle ? "md:col-start-2" : ""}`}
            >
              {/* PLACEHOLDER (only while loading) */}
              {!isLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-xs gap-2 bg-black/30 pointer-events-none">
                  <div className="w-7 h-7 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  <span className="opacity-90">Photo</span>
                </div>
              )}

              {/* IMAGE (fades in only when loaded) */}
              <img
                src={src}
                onClick={() => openViewer(src)}
                onLoad={() => {
                  if (!imageLoadedMap.current[img.id]) {
                    imageLoadedMap.current[img.id] = true;

                    if (img.optimistic && img.image_path?.startsWith("blob:")) {
                      setTimeout(() => {
                        URL.revokeObjectURL(img.image_path!);
                      }, 1000);
                    }

                    setMessages(prev =>
                      prev.map(m =>
                        m.id === img.id ? { ...m, loadingImage: false } : m
                      )
                    );

                    setInbox(prev =>
                      prev.map(m =>
                        m.id === img.id ? { ...m, loadingImage: false } : m
                      )
                    );

                    forceUpdate(n => n + 1);

                    if (onLastImageLoad && i === images.length - 1) {
                      requestAnimationFrame(() => {
                        requestAnimationFrame(onLastImageLoad);
                      });
                    }
                  }
                }}
                className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300
                            ${isLoaded ? "opacity-100" : "opacity-0"}`}
              />

              {/* Optimistic overlay */}
              {img.optimistic && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

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
            <div className="p-3 border-b dark:border-neutral-700">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                className="w-full px-3 py-2 text-sm rounded-lg border 
                          focus:outline-none focus:ring 
                          dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
              />
            </div>

            {loadingInbox && (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                Loading conversations...
              </div>
            )}

            {!loadingInbox && inbox.length === 0 && (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No conversations yet
              </p>
            )}

            {!loadingInbox && filteredInbox.map((m, i) => {
              if (!m.sender || !m.receiver) return null;

              const other = otherUser(m);
              const active = activeUser?.id === other.id;

              const isUnread = m.has_unread === true;

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
                    {m.body
                      ? m.body
                      : m.image_path
                        ? (m.sender.id === authId ? "You sent a photo" : "sent a photo")
                        : ""}
                  </div>
                </button>
              );
            })}

            {/* ===== New Contacts (no conversation yet) ===== */}
            {filteredNewContacts.length > 0 && (
              <div className="mt-4 border-t dark:border-neutral-700">
                <div className="p-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  New Message
                </div>

                {filteredNewContacts.map(user => {
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

                    // detect near bottom (within 120px)
                    const distanceFromBottom =
                      el.scrollHeight - el.scrollTop - el.clientHeight;

                    isNearBottomRef.current = distanceFromBottom < 120;

                    if (el.scrollTop < 50) {
                      loadOlderMessages();
                    }
                  }}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-neutral-800"
                >
                  {loadingConversation && (
                    <div className="flex flex-1 items-center justify-center text-sm text-gray-400 py-6">
                      Loading conversation...
                    </div>
                  )}
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
                  {!loadingConversation && groupMessages(messages).map((group, i, arr) => {

                    const current =
                      group.type === "single" ? group.message : group.items[0];

                    const prevGroup = i > 0 ? arr[i - 1] : null;
                    const prevMsg = prevGroup
                      ? prevGroup.type === "single"
                        ? prevGroup.message
                        : prevGroup.items[0]
                      : undefined;

                    const showDate = isNewDay(current, prevMsg);

                    if (group.type === "single") {
                      const m: Message = group.message;
                      const mine = m.sender.id === authId;
                      const nextGroup = arr[i + 1];
                      const next =
                        nextGroup
                          ? nextGroup.type === "single"
                            ? nextGroup.message
                            : nextGroup.items[0]
                          : undefined;

                      return (
                        <div key={m.id}>
                          
                          {/* DATE SEPARATOR */}
                          {showDate && (
                            <div className="text-center my-4 text-xs text-gray-500 dark:text-gray-400">
                              {formatDayLabel(current.created_at)}
                            </div>
                          )}

                          <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[75%]`}>
                              <div
                                className={`px-3 py-2 rounded-2xl text-sm shadow ${
                                  mine
                                    ? "bg-blue-600 text-white rounded-br-sm"
                                    : "bg-white text-gray-900 border dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700 rounded-bl-sm"
                                }`}
                              >
                                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}

                                {/* TIME (only when gap exists) */}
                                {shouldShowTime(m, next) && (
                                  <div className="mt-1 text-[10px] opacity-70 text-right">
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Seen */}
                              {isLastMineAndSeen(m, i) && (
                                <div className="mt-1 mr-1 text-[11px] text-gray-400">Seen</div>
                              )}

                              {/* Sending */}
                              {mine && m.optimistic && (
                                <div className="mt-1 mr-1 text-[11px] text-gray-400 flex items-center gap-1">
                                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  Sending…
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // IMAGE BATCH
                    const mine = group.senderId === authId;

                    return (
                      <div key={group.batchId + i}>
                        
                        {/* DATE SEPARATOR */}
                        {showDate && (
                          <div className="text-center my-4 text-xs text-gray-500 dark:text-gray-400">
                            {formatDayLabel(current.created_at)}
                          </div>
                        )}

                        <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[75%]`}>
                            <ImageGrid
                              images={group.items}
                              onLastImageLoad={() => {
                                if (isPrependingRef.current) return; // DO NOT jump when loading older
                                if (!isNearBottomRef.current) return;
                                scrollToBottom("auto");
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-3 border-t flex items-center gap-2 bg-white dark:bg-neutral-900 dark:border-neutral-700">
                  <label
                    htmlFor="chat-image"
                    className="flex items-center justify-center w-9 h-9 rounded-full 
                              hover:bg-gray-200 dark:hover:bg-neutral-700 
                              text-blue-600 dark:text-blue-500 transition cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </label>

                  <input
                    id="chat-image"
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      
                      if (files.length > 10) {
                        toast.error("You can only send up to 10 images at a time.");
                        return;
                      }

                      // limit to 10 images
                      const selected = files.slice(0, 10);
                      const batchId = crypto.randomUUID();

                      selected.forEach(file => {
                        sendImage(file, batchId);
                      });

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                    disabled={sendingCount > 0}
                  />
                  <button
                    onClick={send}
                    disabled={sendingCount > 0 || !text.trim()}
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

      {viewerOpen && viewerSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={closeViewer}
        >
          {/* Close */}
          <button
            onClick={closeViewer}
            className="
              absolute top-4 right-4 
              p-2 rounded-full 
              bg-white/10 hover:bg-white/20 backdrop-blur
              text-white
            "
          >
            <X className="w-6 h-6" />
          </button>

          {/* Download */}
          <a
            href={viewerSrc}
            download
            onClick={e => e.stopPropagation()}
            className="
              absolute top-4 left-4 
              p-2 rounded-full 
              bg-white/10 hover:bg-white/20 backdrop-blur
              text-white
            "
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>

          {/* Image */}
          <img
            src={viewerSrc}
            onClick={e => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </AppLayout>
  );
}
