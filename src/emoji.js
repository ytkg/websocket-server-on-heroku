export const createEmojiRenderer = (canvas) => {
  const ctx = canvas.getContext("2d");
  const EMOJI_SIZES = [24, 28, 32, 36, 40];
  const emojiCache = new Map();
  const emojiMeasure = document.createElement("canvas").getContext("2d");

  const state = {
    particles: [],
    animation: null,
    lastFrame: 0
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
  };

  const getEmojiSprite = (emoji, size) => {
    const key = `${emoji}:${size}`;
    const cached = emojiCache.get(key);
    if (cached) return cached;

    const font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    emojiMeasure.font = font;
    const width = Math.ceil(emojiMeasure.measureText(emoji).width) + 4;
    const height = Math.ceil(size * 1.4);
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = width;
    spriteCanvas.height = height;
    const spriteCtx = spriteCanvas.getContext("2d");
    spriteCtx.font = font;
    spriteCtx.textBaseline = "bottom";
    spriteCtx.textAlign = "center";
    spriteCtx.fillText(emoji, Math.floor(width / 2), height);

    const sprite = { canvas: spriteCanvas, width, height };
    emojiCache.set(key, sprite);
    return sprite;
  };

  const render = (timestamp) => {
    if (!state.lastFrame) state.lastFrame = timestamp;
    const elapsed = timestamp - state.lastFrame;
    if (elapsed < 33) {
      state.animation = requestAnimationFrame(render);
      return;
    }
    const delta = elapsed / 1000;
    state.lastFrame = timestamp;

    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    let writeIndex = 0;
    for (let i = 0; i < state.particles.length; i += 1) {
      const particle = state.particles[i];
      particle.age += delta * 1000;
      particle.y += particle.vy * delta;
      const progress = particle.age / particle.life;
      if (progress >= 1) {
        continue;
      }

      const alpha = 1 - progress;
      ctx.globalAlpha = alpha;
      const sizeIndex = Math.min(
        EMOJI_SIZES.length - 1,
        Math.floor(progress * EMOJI_SIZES.length)
      );
      const sprite = particle.sprites[sizeIndex];
      ctx.drawImage(
        sprite.canvas,
        particle.x - sprite.width / 2,
        particle.y - sprite.height
      );

      state.particles[writeIndex] = particle;
      writeIndex += 1;
    }
    state.particles.length = writeIndex;

    ctx.globalAlpha = 1;

    if (state.particles.length > 0) {
      state.animation = requestAnimationFrame(render);
    } else {
      state.animation = null;
      state.lastFrame = 0;
    }
  };

  const launch = (emoji) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = Math.round(width * (0.1 + Math.random() * 0.8));
    const y = height - 90;
    const sprites = EMOJI_SIZES.map((size) => getEmojiSprite(emoji, size));
    state.particles.push({
      emoji,
      x,
      y,
      vy: -120 - Math.random() * 80,
      sprites,
      age: 0,
      life: 3500 + Math.random() * 800
    });

    if (!state.animation) {
      state.lastFrame = 0;
      state.animation = requestAnimationFrame(render);
    }
  };

  const handleVisibility = (hidden) => {
    if (hidden && state.animation) {
      cancelAnimationFrame(state.animation);
      state.animation = null;
      state.lastFrame = 0;
      return;
    }

    if (!hidden && state.particles.length > 0 && !state.animation) {
      state.animation = requestAnimationFrame(render);
    }
  };

  return {
    launch,
    resize,
    handleVisibility
  };
};
