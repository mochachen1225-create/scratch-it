const rand2 = (a, b) => a + Math.random() * (b - a);
// 聲音與震動：全部用 Web Audio 現場合成，不用音檔
const FX = {
  ctx: null, noise: null, scratchGain: null, filter: null, muted: false, mat: null,
  init(muted) { this.muted = muted; },
  // 背景音樂：音量壓低、循環；靜音時一起停
  bgm: {}, track: null,
  music(name) {
    this.wantTrack = name;
    if (this.muted || !this.unlocked || typeof MUSIC === "undefined") { for (const a of Object.values(this.bgm)) a.pause(); return; }
    for (const [k, a] of Object.entries(this.bgm)) if (k !== name) a.pause();
    let a = this.bgm[name];
    if (!a) { a = this.bgm[name] = new Audio(MUSIC[name]); a.loop = true; a.volume = 0.22; }
    if (a.paused) a.play().catch(() => {});
    this.track = name;
  },
  unlock() {
    if (!this.unlocked) { this.unlocked = true; if (this.wantTrack) setTimeout(() => this.music(this.wantTrack), 0); }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      // 2 秒白噪音，循環播放，當作「沙沙聲」的原料
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    // iPhone 側邊靜音開關打開時 Web Audio 會沒聲音：Safari 16.4 起可以設成「播放」類別，就跟音樂一樣會響
    try { if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback"; } catch {}
  },
  // 開始一局：接好「噪音 → 濾波 → 音量」，音量平常是 0，抓的時候才打開
  start(mat) {
    this.stop(); this.unlock(); if (!this.ctx) return;
    const c = this.ctx; this.mat = mat;
    this.noise = c.createBufferSource(); this.noise.buffer = this.noiseBuf; this.noise.loop = true;
    this.filter = c.createBiquadFilter(); this.filter.type = mat.sound.type; this.filter.frequency.value = mat.sound.freq; this.filter.Q.value = mat.sound.q;
    this.scratchGain = c.createGain(); this.scratchGain.gain.value = 0;
    this.noise.connect(this.filter).connect(this.scratchGain).connect(c.destination);
    this.noise.start();
  },
  stop() {
    try { this.noise && this.noise.stop(); } catch {}
    this.noise = null; this.scratchGain = null;
  },
  // 手指速度 → 音量（越快越大聲），頻率跟著速度微微上下
  scratch(speed) {
    if (!this.scratchGain || this.muted) { if (this.scratchGain) this.scratchGain.gain.value = 0; return; }
    const t = this.ctx.currentTime, v = Math.min(1, speed / 1.6) * this.mat.sound.gain;
    this.scratchGain.gain.setTargetAtTime(v, t, 0.03);
    this.filter.frequency.setTargetAtTime(this.mat.sound.freq * (0.8 + Math.min(0.6, speed / 4)), t, 0.05);
    if (this.mat.sound.crackle && Math.random() < this.mat.sound.crackle * Math.min(1, speed)) this.click(0.05 + Math.random() * 0.05);
  },
  quiet() { if (this.scratchGain) this.scratchGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); },
  burst(dur, f0, f1, vol, type = "bandpass") {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = 2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  },
  tone(f, d, { type = "sine", vol = 0.15, at = 0, to = null } = {}) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  },
  click(vol) { this.burst(0.03, 4000, 2500, vol, "highpass"); },
  rip() { this.burst(0.28, 3000, 500, 0.5); },           // 打洞：嘶啦
  boing() { this.tone(180, 0.35, { type: "triangle", vol: 0.18, to: 520 }); this.tone(520, 0.3, { type: "triangle", vol: 0.12, at: 0.25, to: 260 }); },
  tap() { this.tone(600, 0.06, { type: "triangle", vol: 0.08 }); },
  // 一整塊碎掉的「啵」：連鎖越多聲音越高
  pop(chain = 0) {
    const f = 520 * Math.pow(1.12, Math.min(chain, 8));
    this.tone(f, 0.13, { type: "sine", vol: 0.2, to: f / 2.6 }); this.burst(0.09, 2600, 900, 0.25);
  },
  // 泡泡紙的小泡泡
  popSmall() { this.bubblePop(); },
  // 泡泡紙的「啵」：很短的高頻塑膠爆裂聲＋低音「噗」當身體；每顆音高音色隨機一點
  // 同一瞬間最多 4 聲（不會糊成一團）；cat 決定個性：小弟亂、架構師一顆一顆飽滿、總編沿著一排音越來越高
  popTimes: [],
  bubblePop(cat = "orange", seq = 0) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime; this.popTimes = this.popTimes.filter(t => now - t < 0.05);
    if (this.popTimes.length >= 4) return;
    this.popTimes.push(now);
    const c = this.ctx, t = now + Math.random() * 0.012;
    const hi = cat === "orange" ? 3200 * Math.pow(1.03, Math.min(seq, 16)) : cat === "grey" ? rand2(2400, 3200) : rand2(2600, 5200);
    // 爆裂：高通噪音 15～30 毫秒
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = hi; f.Q.value = 1.4;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.75, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + rand2(0.015, 0.03));
    src.connect(f).connect(g).connect(c.destination); src.start(t, Math.random() * 1.5); src.stop(t + 0.05);
    // 身體：低音的「噗」
    const body = cat === "grey" ? rand2(170, 210) : rand2(190, 280);
    this.tone(body, cat === "grey" ? 0.09 : 0.06, { type: "sine", vol: 0.32, to: body * .45 });
  },
  // 偶爾一顆特別大的「啪！」
  bigPop() {
    if (this.muted || !this.ctx) return;
    this.burst(0.09, 1800, 500, 0.9); this.burst(0.03, 6000, 3000, 0.6, "highpass");
    this.tone(120, 0.16, { type: "sine", vol: 0.45, to: 55 });
  },
  plop() { this.tone(240, 0.18, { type: "sine", vol: 0.18, to: 90 }); this.burst(0.25, 1200, 300, 0.3); },
  sneeze() { this.tone(900, 0.08, { type: "square", vol: 0.06, to: 1400 }); this.burst(0.35, 2000, 600, 0.45); },
  unlockChime() { [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.25, { type: "triangle", vol: 0.13, at: i * 0.1 })); },
  // 呼嚕聲：低頻噪音，每秒開關 24 次左右
  purr(sec = 2.6) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 260;
    const g = c.createGain(); g.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = 24; const lg = c.createGain(); lg.gain.value = 0.35;
    lfo.connect(lg).connect(g.gain);
    const env = c.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1, t + 0.4); env.gain.setValueAtTime(1, t + sec - 0.6); env.gain.exponentialRampToValueAtTime(0.0001, t + sec);
    src.connect(lp).connect(g).connect(env).connect(c.destination);
    src.start(t); lfo.start(t); src.stop(t + sec + 0.1); lfo.stop(t + sec + 0.1);
  },
  // 肉球印章：軟軟的「噗」，越蓋越高一點
  stamp(n = 0) { const f = 260 * Math.pow(1.015, Math.min(n, 60)); this.tone(f, 0.09, { type: "sine", vol: 0.14, to: f * .6 }); this.burst(0.05, 900, 400, 0.12, "lowpass"); },
  // 整排清光：往上掃的嘩～＋一串亮亮的音
  sweep() { this.burst(0.5, 400, 5000, 0.35); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, { type: "triangle", vol: 0.12, at: 0.05 + i * 0.07 })); },
  // 暴衝完喘氣：呼…呼…
  pant() { for (let i = 0; i < 4; i++) setTimeout(() => this.burst(0.22, 1400, 700, 0.22), i * 320); },
  // 跳舞音樂：〈Zoomies〉68 秒後最熱鬧的一段，放幾秒就淡出
  danceMusic(sec) {
    if (this.muted || !this.unlocked || typeof MUSIC === "undefined") return;
    for (const a of Object.values(this.bgm)) a.pause();
    const a = this.danceA || (this.danceA = new Audio(MUSIC.busy));
    a.volume = 0.4;
    const go = () => { try { a.currentTime = 68; } catch {} a.play().catch(() => {}); };
    if (a.readyState >= 1) go(); else a.addEventListener("loadedmetadata", go, { once: true });
    clearTimeout(this.danceT); this.danceT = setTimeout(() => this.danceStop(), sec * 1000);
  },
  danceStop() {
    const a = this.danceA; clearTimeout(this.danceT);
    if (a && !a.paused) {
      const fade = setInterval(() => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume <= 0) { clearInterval(fade); a.pause(); if (this.wantTrack) this.music(this.wantTrack); } }, 40);
    }
  },
  // 找到驚喜插畫：越稀有音越多
  reveal(rarity = 1) {
    const notes = [523, 659, 784, 1047, 1319, 1568].slice(0, 2 + rarity * 1.5 | 0);
    notes.forEach((f, i) => this.tone(f, 0.3, { type: "triangle", vol: 0.14, at: i * 0.09 }));
    if (rarity >= 3) this.burst(0.8, 3000, 9000, 0.12, "highpass");
  },
  // 喵：每隻貓音高不一樣（小弟最高）
  meow(id) {
    const p = id === "white" ? 1.3 : id === "grey" ? .85 : 1;
    this.tone(480 * p, 0.16, { type: "triangle", vol: 0.16, to: 820 * p });
    this.tone(820 * p, 0.32, { type: "triangle", vol: 0.14, at: 0.13, to: 420 * p });
  },
  // 送貓窩被無視：洩氣的下降音
  sad() { [392, 370, 349, 262].forEach((f, i) => this.tone(f, i === 3 ? 0.6 : 0.28, { type: "triangle", vol: 0.13, at: i * 0.3, to: i === 3 ? 230 : null })); },
  // 整人卡：低低的「噗～」
  pfft() { this.tone(110, 0.45, { type: "sawtooth", vol: 0.1, to: 70 }); this.burst(0.4, 500, 160, 0.4, "lowpass"); },
  // 沙發勾到線頭：「嘣」
  twang(v = 1) { const f = rand2(220, 300); this.tone(f, 0.16, { type: "triangle", vol: 0.09 * v, to: f * .55 }); },
  // 沙發裂開：「啪嘶」＋棉花「噗」
  tear() { this.burst(0.12, 2600, 700, 0.32); this.tone(150, 0.12, { type: "sine", vol: 0.12, to: 80, at: 0.04 }); },
  vibrate(ms) { if (!this.muted && navigator.vibrate) try { navigator.vibrate(ms); } catch {} }
};
