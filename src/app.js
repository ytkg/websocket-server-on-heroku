import { createEmojiRenderer } from "./emoji.js";
import { createMessageRenderer } from "./messages.js";
import { createWebSocketClient } from "./ws.js";

const ENDPOINT = "wss://websocket-server-on-heroku-ec91325c1c49.herokuapp.com/";

const elements = {
  messages: document.getElementById("messages"),
  emojiCanvas: document.getElementById("emoji-canvas"),
  nameInput: document.getElementById("name"),
  textInput: document.getElementById("text"),
  reactions: document.getElementById("reactions")
};

const state = {
  isComposing: false
};

const urlParams = new URLSearchParams(window.location.search);
const isViewMode = urlParams.get("mode") === "view";

if (isViewMode) {
  const composer = document.querySelector(".composer");
  if (composer) composer.style.display = "none";
}

const emojiRenderer = createEmojiRenderer(elements.emojiCanvas);
const messageRenderer = createMessageRenderer({
  messagesEl: elements.messages,
  onEmoji: emojiRenderer.launch
});

const handleMessage = (event) => {
  let payload = null;
  try {
    payload = JSON.parse(event.data);
  } catch (_error) {
    return;
  }

  if (!payload || typeof payload !== "object") return;

  if (payload.type === "backlog" && Array.isArray(payload.messages)) {
    messageRenderer.renderBacklog(payload.messages);
    return;
  }

  if (payload.type === "message") {
    messageRenderer.appendMessage(payload);
  }
};

const wsClient = createWebSocketClient({
  endpoint: ENDPOINT,
  onMessage: handleMessage
});

const sendMessage = () => {
  if (isViewMode || !wsClient.isOpen()) return;

  const name = elements.nameInput.value.trim() || "guest";
  const text = elements.textInput.value.trim();

  if (!text) return;

  wsClient.send({ name, text });
  elements.textInput.value = "";
};

const sendEmoji = (emoji) => {
  if (isViewMode || !wsClient.isOpen()) return;
  wsClient.send({ name: "guest", text: `/e ${emoji}` });
};

const bindEvents = () => {
  elements.textInput.addEventListener("keydown", (event) => {
    if (isViewMode) return;
    if (event.key === "Enter" && !event.shiftKey) {
      if (state.isComposing) return;
      event.preventDefault();
      sendMessage();
    }
  });

  if (!isViewMode) {
    elements.textInput.addEventListener("compositionstart", () => {
      state.isComposing = true;
    });

    elements.textInput.addEventListener("compositionend", () => {
      state.isComposing = false;
    });
  }

  if (elements.reactions) {
    elements.reactions.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-emoji]");
      if (!button) return;
      sendEmoji(button.dataset.emoji);
    });
  }

  document.addEventListener("visibilitychange", () => {
    emojiRenderer.handleVisibility(document.hidden);
  });

  window.addEventListener("resize", emojiRenderer.resize);
};

bindEvents();
emojiRenderer.resize();
wsClient.connect();
