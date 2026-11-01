// 程式畫的三隻貓（SVG）。之後有 AI 插畫會替換，這份留著當備用
const INK = "#3a2e2a";

function catFace(c, { x = 60, y = 48, r = 28, closed = false } = {}) {
  const s = [];
  // 耳朵
  s.push(`<path d="M${x - 24} ${y - 12} L${x - 30} ${y - 40} L${x - 6} ${y - 24} Z" fill="${c.fur}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  s.push(`<path d="M${x + 24} ${y - 12} L${x + 30} ${y - 40} L${x + 6} ${y - 24} Z" fill="${c.fur}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  s.push(`<path d="M${x - 22} ${y - 17} L${x - 26} ${y - 33} L${x - 12} ${y - 23} Z" fill="${c.ear}"/>`);
  s.push(`<path d="M${x + 22} ${y - 17} L${x + 26} ${y - 33} L${x + 12} ${y - 23} Z" fill="${c.ear}"/>`);
  // 頭
  s.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>`);
  if (c.accessory !== "cap") {
    s.push(`<path d="M${x - 8} ${y - 26} q2 7 0 12 M${x} ${y - 28} q2 8 0 13 M${x + 8} ${y - 26} q2 7 0 12" stroke="${c.stripe}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  }
  // 臉頰、眼睛、鼻子、嘴巴
  s.push(`<ellipse cx="${x - 16}" cy="${y + 8}" rx="5" ry="3" fill="#ffb3b3" opacity=".7"/><ellipse cx="${x + 16}" cy="${y + 8}" rx="5" ry="3" fill="#ffb3b3" opacity=".7"/>`);
  if (closed) {
    s.push(`<path d="M${x - 15} ${y - 2} q5 5 10 0 M${x + 5} ${y - 2} q5 5 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  } else {
    s.push(`<circle cx="${x - 10}" cy="${y - 2}" r="3.6" fill="${INK}"/><circle cx="${x + 10}" cy="${y - 2}" r="3.6" fill="${INK}"/>`);
    s.push(`<circle cx="${x - 9}" cy="${y - 3.5}" r="1.2" fill="#fff"/><circle cx="${x + 11}" cy="${y - 3.5}" r="1.2" fill="#fff"/>`);
  }
  s.push(`<path d="M${x - 3} ${y + 5} h6 l-3 3 z" fill="#f08a8a" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`);
  s.push(`<path d="M${x - 7} ${y + 11} q3.5 4 7 0 q3.5 4 7 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  // 鬍鬚
  s.push(`<path d="M${x - 18} ${y + 6} h-14 M${x - 18} ${y + 11} l-13 3 M${x + 18} ${y + 6} h14 M${x + 18} ${y + 11} l13 3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`);
  // 配件
  if (c.accessory === "glasses") {
    s.push(`<g fill="none" stroke="${INK}" stroke-width="2.4"><circle cx="${x - 10}" cy="${y - 2}" r="8"/><circle cx="${x + 10}" cy="${y - 2}" r="8"/><path d="M${x - 2} ${y - 2} h4"/></g>`);
  } else if (c.accessory === "headset") {
    s.push(`<path d="M${x - 27} ${y - 2} q0 -36 27 -36 q27 0 27 36" fill="none" stroke="${INK}" stroke-width="3.5"/>`);
    s.push(`<rect x="${x - 32}" y="${y - 8}" width="9" height="14" rx="4" fill="#5b6bff" stroke="${INK}" stroke-width="2.4"/>`);
    s.push(`<path d="M${x - 27} ${y + 6} q4 12 16 10" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="${x - 10}" cy="${y + 16}" r="3" fill="${INK}"/>`);
  } else if (c.accessory === "cap") {
    s.push(`<path d="M${x - 22} ${y - 16} q22 -26 44 0 z" fill="#ffd43b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
    s.push(`<path d="M${x + 14} ${y - 17} q14 -2 20 4 q-10 3 -22 1" fill="#ffd43b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
    s.push(`<circle cx="${x}" cy="${y - 28}" r="3" fill="#ff8a3d" stroke="${INK}" stroke-width="2"/>`);
  }
  return s.join("");
}

function catSVG(id, pose = "sit") {
  const c = CATS[id];
  const svg = inner => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  if (pose === "sit") {
    return svg(`
      <path d="M86 98 q26 -4 18 -30" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M86 98 q26 -4 18 -30" fill="none" stroke="${c.fur}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="60" cy="88" rx="30" ry="25" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="60" cy="92" rx="16" ry="15" fill="${c.belly}"/>
      <ellipse cx="46" cy="110" rx="9" ry="6" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="74" cy="110" rx="9" ry="6" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      ${catFace(c)}`);
  }
  if (pose === "lie") {
    return svg(`
      <g fill="#d9ab6f" stroke="${INK}" stroke-width="1.5">
        <rect x="8" y="104" width="22" height="6" rx="2" transform="rotate(-8 19 107)"/><rect x="34" y="106" width="26" height="6" rx="2" transform="rotate(5 47 109)"/>
        <rect x="64" y="104" width="22" height="6" rx="2" transform="rotate(-4 75 107)"/><rect x="88" y="106" width="24" height="6" rx="2" transform="rotate(9 100 109)"/>
      </g>
      <ellipse cx="68" cy="90" rx="38" ry="18" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="70" cy="86" rx="22" ry="9" fill="${c.belly}"/>
      <path d="M58 74 q-4 -14 4 -18 M80 74 q4 -14 -4 -18" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 74 q-4 -14 4 -18 M80 74 q4 -14 -4 -18" fill="none" stroke="${c.fur}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M104 92 q14 6 10 -12" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M104 92 q14 6 10 -12" fill="none" stroke="${c.fur}" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(-20 30) rotate(-12 60 48) scale(.8)">${catFace(c, { closed: true })}</g>
      <text x="86" y="40" font-size="16" fill="${INK}" font-family="sans-serif">z</text><text x="96" y="28" font-size="12" fill="${INK}" font-family="sans-serif">z</text>`);
  }
  if (pose === "lick") {
    return svg(`
      <ellipse cx="60" cy="90" rx="28" ry="24" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="60" cy="94" rx="15" ry="14" fill="${c.belly}"/>
      <path d="M86 100 q22 0 16 -24" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M86 100 q22 0 16 -24" fill="none" stroke="${c.fur}" stroke-width="5" stroke-linecap="round"/>
      ${catFace(c, { closed: true })}
      <ellipse cx="44" cy="64" rx="8" ry="10" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
      <path d="M52 62 q4 4 2 8" fill="#f08a8a" stroke="${INK}" stroke-width="1.5"/>`);
  }
  // box：鑽進紙箱（小弟只露尾巴）
  const box = `<path d="M18 70 h84 v44 h-84 z" fill="#c9965a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M18 70 l-10 -12 h40 l10 12 M102 70 l10 -12 h-40 l-10 12" fill="#ddb07a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 90 h40" stroke="#a87a44" stroke-width="3"/>`;
  if (id === "white") {
    return svg(`${box}<path d="M62 72 q-4 -30 14 -40 q8 -4 6 6" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M62 72 q-4 -30 14 -40 q8 -4 6 6" fill="none" stroke="${c.fur}" stroke-width="5" stroke-linecap="round"/>
      <path d="M78 34 q6 -3 5 3" fill="none" stroke="${c.stripe}" stroke-width="5" stroke-linecap="round"/>`);
  }
  return svg(`<g transform="translate(0 30)">${catFace(c)}</g>
    <ellipse cx="44" cy="70" rx="8" ry="6" fill="${c.fur}" stroke="${INK}" stroke-width="3"/><ellipse cx="76" cy="70" rx="8" ry="6" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
    ${box}`);
}

// 第一人稱的貓掌：玩家的手指就是貓手。按下去爪子伸出來（out），抬起來收回去
// 總編：橘色條紋掌；架構師：銀灰掌；小弟：白色小掌、粉色肉球
function pawSVG(id, out = false) {
  const c = CATS[id];
  const small = id === "white";
  const s = small ? .86 : 1;
  const claws = out
    ? `<g stroke="${INK}" stroke-width="2" stroke-linecap="round"><path d="M14 18 l-4 -14 M24 11 l-1 -11 M36 11 l1 -11 M46 18 l4 -14" stroke="#fff" stroke-width="3.4"/><path d="M14 18 l-4 -14 M24 11 l-1 -11 M36 11 l1 -11 M46 18 l4 -14"/></g>`
    : "";
  const stripes = id === "orange"
    ? `<path d="M10 52 q8 -3 14 2 M36 54 q8 -5 14 -2 M18 64 q12 -4 24 0" stroke="${c.stripe}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : "";
  return `<svg viewBox="0 0 60 92" xmlns="http://www.w3.org/2000/svg"><g transform="translate(${30 - 30 * s} 0) scale(${s})">
    ${claws}
    <path d="M8 60 q0 24 6 32 h32 q6 -8 6 -32 z" fill="${c.fur}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="30" cy="44" rx="24" ry="24" fill="${c.fur}" stroke="${INK}" stroke-width="3"/>
    ${stripes}
    <g fill="${id === "white" ? "#ffb3c6" : "#f6a5a5"}" stroke="${INK}" stroke-width="1.5">
      <ellipse cx="30" cy="50" rx="10" ry="8"/>
      <ellipse cx="14" cy="35" rx="5" ry="6"/><ellipse cx="24" cy="27" rx="5" ry="6"/><ellipse cx="36" cy="27" rx="5" ry="6"/><ellipse cx="46" cy="35" rx="5" ry="6"/>
    </g>
  </g></svg>`;
}
