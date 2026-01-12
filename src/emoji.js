export const createEmojiRenderer = (canvas) => {
  const ctx = canvas.getContext("2d");
  const EMOJI_SIZES = [24, 28, 32, 36, 40];
  const emojiCache = new Map();
  const emojiMeasure = document.createElement("canvas").getContext("2d");

  const state = {
    particles: [],
    particlePool: [],
    pendingEmojis: [],
    pendingIndex: 0,
    animation: null,
    lastFrame: 0,
    width: window.innerWidth,
    height: window.innerHeight
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
    state.width = window.innerWidth;
    state.height = window.innerHeight;
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

  const getEmojiSprites = (emoji) => {
    const key = `${emoji}:sprites`;
    const cached = emojiCache.get(key);
    if (cached) return cached;

    const sprites = EMOJI_SIZES.map((size) => getEmojiSprite(emoji, size));
    emojiCache.set(key, sprites);
    return sprites;
  };

  const enqueue = (emoji) => {
    state.pendingEmojis.push(emoji);
    if (!state.animation) {
      state.lastFrame = 0;
      state.animation = requestAnimationFrame(render);
    }
  };

  const spawnParticle = (emoji) => {
    const x = Math.round(state.width * (0.1 + Math.random() * 0.8));
    const y = state.height - 90;
    const particle = state.particlePool.pop() || {};
    particle.emoji = emoji;
    particle.x = x;
    particle.y = y;
    particle.vy = -120 - Math.random() * 80;
    particle.sprites = getEmojiSprites(emoji);
    particle.age = 0;
    particle.life = 3500 + Math.random() * 800;
    particle.lifeInv = 1 / particle.life;
    state.particles.push(particle);
  };

  const render = (timestamp) => {
    if (!state.lastFrame) state.lastFrame = timestamp;
    const elapsed = timestamp - state.lastFrame;
    const particleCount = state.particles.length;
    const frameBudget = particleCount > 160 ? 66 : particleCount > 80 ? 50 : 33;
    if (elapsed < frameBudget) {
      state.animation = requestAnimationFrame(render);
      return;
    }
    const delta = elapsed / 1000;
    state.lastFrame = timestamp;

    ctx.clearRect(0, 0, state.width, state.height);

    while (state.pendingIndex < state.pendingEmojis.length) {
      spawnParticle(state.pendingEmojis[state.pendingIndex]);
      state.pendingIndex += 1;
    }
    if (state.pendingIndex > 0) {
      state.pendingEmojis.length = 0;
      state.pendingIndex = 0;
    }

    let writeIndex = 0;
    for (let i = 0; i < state.particles.length; i += 1) {
      const particle = state.particles[i];
      particle.age += delta * 1000;
      particle.y += particle.vy * delta;
      const progress = particle.age * particle.lifeInv;
      if (progress >= 1) {
        state.particlePool.push(particle);
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
    enqueue(emoji);
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
