export const parseSuperchatText = (rawText) => {
  const text = String(rawText);
  const bracketMatch = text.match(/^\[SC:(\d+)\]\s*/);
  const slashMatch = text.match(/^\/sc(\d+)\s+/i);
  const match = bracketMatch || slashMatch;
  if (!match) {
    return { text, superchat: null };
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { text, superchat: null };
  }

  const band = amount >= 50000
    ? "50000"
    : amount >= 40000
      ? "40000"
      : amount >= 30000
        ? "30000"
        : amount >= 20000
          ? "20000"
          : amount >= 10000
            ? "10000"
            : amount >= 5000
              ? "5000"
              : amount >= 2000
                ? "2000"
                : amount >= 1000
                  ? "1000"
                  : amount >= 500
                    ? "500"
                    : amount >= 200
                      ? "200"
                      : "100";
  return {
    text: text.replace(/^\[SC:\d+\]\s*/i, "").replace(/^\/sc\d+\s+/i, ""),
    superchat: { amount, band }
  };
};

export const parseEmojiCommand = (rawText) => {
  const text = String(rawText);
  const match = text.match(/^\/e\s+(.+)$/i);
  if (!match) return null;
  const emoji = match[1].trim();
  if (!emoji) return null;
  return emoji;
};
