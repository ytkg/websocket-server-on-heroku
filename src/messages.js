import { parseEmojiCommand, parseSuperchatText } from "./commands.js";

export const createMessageRenderer = ({ messagesEl, onEmoji }) => {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const appendMessage = (payload) => {
    const emoji = parseEmojiCommand(payload.text || "");
    if (emoji) {
      onEmoji(emoji);
      return;
    }

    const card = document.createElement("div");
    card.className = "message";
    const parsed = parseSuperchatText(payload.text || "");
    const superchat = payload.superchat || parsed.superchat;
    const messageText = parsed.text;
    if (superchat) {
      card.classList.add("superchat");
      card.dataset.band = superchat.band || "100";
    }

    const header = document.createElement("div");
    header.className = "message-header";

    const nameWrap = document.createElement("div");
    nameWrap.className = "message-meta";

    const name = document.createElement("strong");
    name.textContent = payload.name || "guest";
    nameWrap.appendChild(name);

    if (superchat) {
      const chip = document.createElement("span");
      chip.className = "superchip";
      chip.textContent = `Superchat ¥${superchat.amount}`;
      nameWrap.appendChild(chip);
    }

    const time = document.createElement("span");
    time.textContent = formatTime(payload.at);

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.appendChild(time);

    header.appendChild(nameWrap);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.textContent = messageText;

    card.appendChild(header);
    card.appendChild(body);
    messagesEl.appendChild(card);
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  };

  const renderBacklog = (messages) => {
    messagesEl.innerHTML = "";
    messages.forEach(appendMessage);
  };

  return {
    appendMessage,
    renderBacklog
  };
};
