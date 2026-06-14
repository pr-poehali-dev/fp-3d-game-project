/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import Game3D, { AGENTS } from "@/components/Game3D";

type Screen = "menu" | "mode-select" | "agent-select" | "shop" | "game" | "game3d" | "settings" | "scoreboard";
type GamePhase = "playing" | "planting" | "planted" | "defusing" | "round-end";

const WEAPONS = {
  pistols: [
    { id: "glock", name: "Glock-18", price: 0, damage: 28, rof: 90, accuracy: 72, ammo: 20, category: "pistol", team: "T" },
    { id: "usp", name: "USP-S", price: 0, damage: 35, rof: 65, accuracy: 85, ammo: 12, category: "pistol", team: "CT" },
    { id: "deagle", name: "Desert Eagle", price: 700, damage: 98, rof: 45, accuracy: 78, ammo: 7, category: "pistol", team: null },
    { id: "p250", name: "P250", price: 300, damage: 38, rof: 75, accuracy: 77, ammo: 13, category: "pistol", team: null },
  ],
  rifles: [
    { id: "ak47", name: "AK-47", price: 2700, damage: 86, rof: 73, accuracy: 76, ammo: 30, category: "rifle", team: "T" },
    { id: "m4a4", name: "M4A4", price: 3100, damage: 80, rof: 78, accuracy: 80, ammo: 30, category: "rifle", team: "CT" },
    { id: "awp", name: "AWP", price: 4750, damage: 115, rof: 25, accuracy: 98, ammo: 10, category: "sniper", team: null },
    { id: "sg553", name: "SG 553", price: 3000, damage: 81, rof: 72, accuracy: 79, ammo: 30, category: "rifle", team: "T" },
    { id: "aug", name: "AUG", price: 3300, damage: 78, rof: 74, accuracy: 82, ammo: 30, category: "rifle", team: "CT" },
    { id: "famas", name: "FAMAS", price: 2050, damage: 75, rof: 80, accuracy: 76, ammo: 25, category: "rifle", team: "CT" },
  ],
  smgs: [
    { id: "mp5", name: "MP5-SD", price: 1500, damage: 52, rof: 85, accuracy: 74, ammo: 30, category: "smg", team: null },
    { id: "mac10", name: "MAC-10", price: 1050, damage: 45, rof: 92, accuracy: 64, ammo: 30, category: "smg", team: "T" },
    { id: "mp9", name: "MP9", price: 1250, damage: 49, rof: 88, accuracy: 68, ammo: 30, category: "smg", team: "CT" },
    { id: "ump45", name: "UMP-45", price: 1200, damage: 58, rof: 74, accuracy: 76, ammo: 25, category: "smg", team: null },
  ],
  equipment: [
    { id: "armor", name: "Бронежилет", price: 650, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: null },
    { id: "helmet", name: "Шлем + броня", price: 1000, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: null },
    { id: "grenade_frag", name: "Граната HE", price: 300, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: null },
    { id: "flashbang", name: "Флэшбэнг", price: 200, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: null },
    { id: "smoke", name: "Дымовая граната", price: 300, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: null },
    { id: "kit", name: "Набор сапёра", price: 400, damage: 0, rof: 0, accuracy: 0, ammo: 0, category: "eq", team: "CT" },
  ]
};

const PLAYERS_CT = [
  { id: 1, name: "Ghost_Alpha", hp: 100, kills: 3, deaths: 1, money: 4200, weapon: "M4A4", alive: true },
  { id: 2, name: "ShadowKnight", hp: 85, kills: 2, deaths: 2, money: 3100, weapon: "AWP", alive: true },
  { id: 3, name: "NightOwl", hp: 60, kills: 1, deaths: 1, money: 2800, weapon: "MP9", alive: true },
  { id: 4, name: "IronFist", hp: 0, kills: 0, deaths: 2, money: 1900, weapon: "USP-S", alive: false },
  { id: 5, name: "YOU", hp: 100, kills: 5, deaths: 0, money: 5400, weapon: "M4A4", alive: true },
];

const PLAYERS_T = [
  { id: 6, name: "VoidHunter", hp: 90, kills: 2, deaths: 1, money: 3800, weapon: "AK-47", alive: true },
  { id: 7, name: "BloodRaven", hp: 0, kills: 1, deaths: 2, money: 2200, weapon: "Glock-18", alive: false },
  { id: 8, name: "SteelWolf", hp: 75, kills: 3, deaths: 0, money: 4500, weapon: "AWP", alive: true },
  { id: 9, name: "PhantomX", hp: 45, kills: 1, deaths: 1, money: 2900, weapon: "SG 553", alive: true },
  { id: 10, name: "DeathBringer", hp: 100, kills: 4, deaths: 1, money: 5100, weapon: "AK-47", alive: true },
];

// ===================== MENU =====================
function MenuScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [hover, setHover] = useState<string | null>(null);

  const menuItems = [
    { id: "play", label: "Играть", icon: "Play", action: () => onNavigate("mode-select") },
    { id: "settings", label: "Настройки", icon: "Settings", action: () => onNavigate("settings") },
    { id: "scoreboard", label: "Статистика", icon: "BarChart2", action: () => onNavigate("scoreboard") },
    { id: "exit", label: "Выход", icon: "LogOut", action: () => {} },
  ];

  return (
    <div className="menu-bg scanlines noise w-full h-screen flex flex-col relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-40" />

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: (i % 3 === 0 ? 2 : 1.5) + 'px',
              height: (i % 3 === 0 ? 2 : 1.5) + 'px',
              opacity: 0.15,
              background: i % 3 === 0 ? '#f5a623' : i % 3 === 1 ? '#e02020' : '#ffffff',
              left: (i * 5.5) % 100 + '%',
              top: (i * 7.3) % 100 + '%',
              animation: `pulse-gold ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: (i * 0.3) + 's'
            }} />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border border-yellow-500/60 rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-yellow-500 rotate-45" />
          </div>
          <span className="mono text-white/25 text-xs tracking-widest">PHANTOM OPS // v1.0.0</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="mono text-xs"><span className="text-green-400">●</span><span className="text-white/30 ml-2">СЕРВЕРЫ ОНЛАЙН</span></span>
          <span className="mono text-white/30 text-xs">ИГРОКОВ: <span className="text-yellow-400">48,291</span></span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1">
        {/* Left side */}
        <div className="flex flex-col justify-center px-16 flex-1">
          {/* Logo */}
          <div className="mb-14 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-14 bg-gradient-to-r from-transparent to-yellow-500/50" />
              <span className="mono text-yellow-500/50 text-xs tracking-widest">TACTICAL FIRST PERSON SHOOTER</span>
            </div>
            <h1 className="orbitron font-black text-white leading-none" style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              PHANTOM
            </h1>
            <div className="flex items-center gap-4">
              <h1 className="orbitron font-black leading-none" style={{ fontSize: 'clamp(44px, 6vw, 80px)', color: '#f5a623' }}>
                OPS
              </h1>
              <div className="flex flex-col gap-1 mt-1">
                <div className="h-1 w-10 bg-red-500" />
                <div className="h-1 w-7 bg-yellow-500" />
                <div className="h-1 w-4 bg-white/30" />
              </div>
            </div>
            <p className="rajdhani text-white/35 text-base tracking-widest mt-2">ОНЛАЙН ТАКТИЧЕСКИЙ ШУТЕР</p>
          </div>

          {/* Menu items */}
          <div className="flex flex-col gap-1">
            {menuItems.map((item, i) => (
              <button
                key={item.id}
                className="group flex items-center gap-5 py-3 text-left transition-all duration-200 animate-slide-right"
                style={{ animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: 'forwards' }}
                onMouseEnter={() => setHover(item.id)}
                onMouseLeave={() => setHover(null)}
                onClick={item.action}
              >
                <div className={`w-px h-7 transition-all duration-200 ${hover === item.id ? 'bg-yellow-500 shadow-[0_0_8px_#f5a623]' : 'bg-white/15'}`} />
                <div className={`transition-all duration-200 ${hover === item.id ? 'text-yellow-500' : 'text-white/35'}`}>
                  <Icon name={item.icon as any} size={16} />
                </div>
                <span className={`rajdhani font-semibold text-xl tracking-wider transition-all duration-200 ${
                  hover === item.id ? 'text-white translate-x-1' : 'text-white/55'
                } ${item.id === 'exit' ? '!text-red-400/50 hover:!text-red-400' : ''}`}>
                  {item.label.toUpperCase()}
                </span>
                {hover === item.id && item.id === 'play' && (
                  <span className="mono text-yellow-500/60 text-xs ml-1">→ НАЖМИТЕ</span>
                )}
              </button>
            ))}
          </div>

          {/* Player card */}
          <div className="mt-10 animate-fade-in delay-500" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="game-panel inline-flex items-center gap-4 px-4 py-2.5">
              <div className="w-7 h-7 bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                <Icon name="User" size={13} className="text-yellow-400" />
              </div>
              <div>
                <div className="orbitron text-white text-sm font-bold">COMMANDER_X</div>
                <div className="mono text-white/35 text-xs">LVL 42 · РАНГ: ЗОЛОТО III</div>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <div>
                <div className="orbitron text-yellow-400 text-sm">K/D: 1.87</div>
                <div className="mono text-white/35 text-xs">ВИН РЕЙТ: 61%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - visual */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-80 h-80 relative flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 320 320">
              <circle cx="160" cy="160" r="150" fill="none" stroke="#f5a623" strokeWidth="0.5" strokeDasharray="8 4" />
              <circle cx="160" cy="160" r="110" fill="none" stroke="#f5a623" strokeWidth="0.5" strokeDasharray="4 8" />
              <circle cx="160" cy="160" r="70" fill="none" stroke="#e02020" strokeWidth="0.5" />
              <line x1="10" y1="160" x2="310" y2="160" stroke="#f5a623" strokeWidth="0.3" />
              <line x1="160" y1="10" x2="160" y2="310" stroke="#f5a623" strokeWidth="0.3" />
              {[0,45,90,135,180,225,270,315].map(a => (
                <line key={a}
                  x1={160 + 65 * Math.cos(a * Math.PI / 180)}
                  y1={160 + 65 * Math.sin(a * Math.PI / 180)}
                  x2={160 + 155 * Math.cos(a * Math.PI / 180)}
                  y2={160 + 155 * Math.sin(a * Math.PI / 180)}
                  stroke="#f5a623" strokeWidth="0.5" opacity="0.6" />
              ))}
            </svg>

            {[
              { label: "УБИЙСТВ", val: "1,247", pos: "top-0 left-0" },
              { label: "МАТЧЕЙ", val: "342", pos: "top-0 right-0 text-right" },
              { label: "МЕДАЛЕЙ", val: "18", pos: "bottom-0 left-0" },
              { label: "УРОВЕНЬ", val: "42", pos: "bottom-0 right-0 text-right" },
            ].map(s => (
              <div key={s.label} className={`absolute ${s.pos} p-3`}>
                <div className="orbitron text-yellow-400 text-xl font-bold">{s.val}</div>
                <div className="mono text-white/25 text-xs">{s.label}</div>
              </div>
            ))}

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 border-2 border-yellow-500/35 rotate-45 flex items-center justify-center">
                <div className="w-13 h-13 border border-yellow-500/15 flex items-center justify-center bg-black/40">
                  <div className="-rotate-45">
                    <Icon name="Target" size={28} className="text-yellow-500 opacity-70" />
                  </div>
                </div>
              </div>
              <div className="mt-4 mono text-yellow-500/50 text-xs tracking-widest">ТАКТИКА · ТОЧНОСТЬ · ПОБЕДА</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/5 px-8 py-2.5 flex items-center justify-between">
        <div className="flex gap-6">
          {["ЕЖЕДНЕВНЫЕ ЗАДАНИЯ: 2/3", "БОЕВОЙ ПАС: 67%", "AK-47 | URBAN — СКОРО"].map((t, i) => (
            <span key={i} className="mono text-white/20 text-xs">{t}</span>
          ))}
        </div>
        <span className="mono text-white/15 text-xs">© 2025 PHANTOM OPS</span>
      </div>
    </div>
  );
}

// ===================== MODE SELECT =====================
function ModeSelectScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const modes = [
    {
      id: "bomb", name: "Закладка бомбы", subtitle: "5 против 5",
      desc: "Террористы закладывают бомбу на точках A или B, контртеррористы дефузят. Классика тактического шутера.",
      detail: "30 РАУНДОВ · 1:55 НА РАУНД · 0:40 ЗАКУПКА",
      icon: "Bomb", color: "#e02020", badge: "ПОПУЛЯРНЫЙ",
      badgeColor: "bg-red-500/15 text-red-400 border-red-500/25"
    },
    {
      id: "dm", name: "Дефматч", subtitle: "Свободный бой",
      desc: "Неограниченные возрождения. Идеально для тренировки прицеливания и рефлексов.",
      detail: "10 МИН · БЕСКОНЕЧНЫЕ ЖИЗНИ · БЕЗ ЭКОНОМИКИ",
      icon: "Zap", color: "#f5a623", badge: "ТРЕНИРОВКА",
      badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
    },
    {
      id: "1v1", name: "Дуэль 1v1", subtitle: "Один на один",
      desc: "Прямое противостояние. Докажите превосходство в честном рейтинговом поединке.",
      detail: "BEST OF 15 · СЛУЧАЙНОЕ ОРУЖИЕ · РЕЙТИНГОВЫЙ",
      icon: "Swords", color: "#4a9eff", badge: "РЕЙТИНГ",
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/25"
    },
  ];

  return (
    <div className="menu-bg scanlines noise w-full h-screen flex flex-col relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-25" />
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <button onClick={() => onNavigate("menu")} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={16} />
          <span className="rajdhani text-sm tracking-wider">НАЗАД</span>
        </button>
        <span className="orbitron text-white/70 text-sm tracking-widest">ВЫБОР РЕЖИМА</span>
        <div className="w-20" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-12 py-8">
        <div className="mb-7 animate-fade-in">
          <h2 className="orbitron text-white font-bold text-3xl mb-1">РЕЖИМЫ ИГРЫ</h2>
          <p className="rajdhani text-white/35 text-base">Выберите режим и отправляйтесь в бой</p>
        </div>

        <div className="grid grid-cols-3 gap-5 flex-1">
          {modes.map((mode, i) => (
            <div
              key={mode.id}
              className={`mode-card game-panel p-6 flex flex-col cursor-pointer animate-fade-in ${selected === mode.id ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
              onClick={() => setSelected(mode.id)}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`border text-xs px-2 py-0.5 mono tracking-wider ${mode.badgeColor}`}>{mode.badge}</div>
                <div className="w-9 h-9 border flex items-center justify-center" style={{ borderColor: mode.color + '30' }}>
                  <Icon name={mode.icon as any} size={18} style={{ color: mode.color }} />
                </div>
              </div>
              <h3 className="orbitron font-bold text-white text-lg mb-0.5">{mode.name}</h3>
              <div className="mono text-xs mb-3" style={{ color: mode.color }}>{mode.subtitle}</div>
              <p className="rajdhani text-white/45 text-sm flex-1 leading-relaxed">{mode.desc}</p>
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="mono text-white/20 text-xs mb-3">{mode.detail}</div>
                {selected === mode.id ? (
                  <button className="btn-primary w-full" onClick={e => { e.stopPropagation(); onNavigate("shop"); }}>
                    НАЧАТЬ БОЙ
                  </button>
                ) : (
                  <div className="mono text-white/20 text-xs text-center">НАЖМИТЕ ДЛЯ ВЫБОРА</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 animate-fade-in delay-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="mono text-white/20 text-xs mb-2 tracking-widest">ДОСТУПНЫЕ КАРТЫ</div>
          <div className="flex gap-2">
            {[
              { name: "DUST II", type: "Классика", active: true },
              { name: "MIRAGE", type: "Конкурс", active: false },
              { name: "INFERNO", type: "Профи", active: false },
              { name: "NUKE", type: "Конкурс", active: false },
              { name: "OVERPASS", type: "Резерв", active: false },
            ].map(map => (
              <div key={map.name} className={`px-4 py-2 border cursor-pointer transition-all ${map.active ? 'border-yellow-500/50 bg-yellow-500/8' : 'border-white/8 hover:border-white/15'}`}>
                <div className={`rajdhani font-semibold text-sm ${map.active ? 'text-yellow-400' : 'text-white/35'}`}>{map.name}</div>
                <div className="mono text-white/20 text-xs">{map.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== SHOP =====================
function ShopScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [money, setMoney] = useState(5400);
  const [cart, setCart] = useState<string[]>([]);
  const [tab, setTab] = useState<"pistols" | "rifles" | "smgs" | "equipment">("rifles");
  const [notification, setNotification] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); onNavigate("game"); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onNavigate]);

  const buy = (weapon: { id: string; name: string; price: number }) => {
    if (money < weapon.price) {
      setNotification("❌ Недостаточно средств!");
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    if (cart.includes(weapon.id)) {
      setNotification("⚠️ Уже куплено!");
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    setMoney(m => m - weapon.price);
    setCart(c => [...c, weapon.id]);
    setNotification(`✓ ${weapon.name} куплено!`);
    setTimeout(() => setNotification(null), 2000);
  };

  const currentWeapons = WEAPONS[tab];
  const totalSpent = 5400 - money;

  return (
    <div className="bg-[#080808] scanlines w-full h-screen flex flex-col relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-15" />

      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 game-panel px-5 py-2.5 animate-fade-in-fast">
          <span className="rajdhani text-white text-base">{notification}</span>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="orbitron text-white/70 font-bold tracking-widest text-sm">МАГАЗИН СНАРЯЖЕНИЯ</span>
          <span className="mono text-white/20 text-xs">// ЗАКУПОЧНАЯ ФАЗА</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={13} className={timeLeft <= 10 ? 'text-red-400 animate-pulse-gold' : 'text-white/35'} />
            <span className={`orbitron font-bold text-lg ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
              0:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="game-panel flex items-center gap-2.5 px-4 py-2">
            <Icon name="DollarSign" size={13} className="text-yellow-400" />
            <div>
              <div className="orbitron text-yellow-400 font-bold">${money.toLocaleString()}</div>
              <div className="mono text-white/25 text-xs">БАЛАНС</div>
            </div>
          </div>
          <button className="btn-primary" style={{ padding: '9px 20px', clipPath: 'none', fontSize: 11 }} onClick={() => onNavigate("game")}>
            В БОЙ →
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Categories */}
        <div className="w-44 border-r border-white/5 flex flex-col py-3">
          <div className="mono text-white/20 text-xs px-4 mb-2 tracking-widest">КАТЕГОРИИ</div>
          {(["rifles", "pistols", "smgs", "equipment"] as const).map(cat => {
            const labels = { rifles: "ВИНТОВКИ", pistols: "ПИСТОЛЕТЫ", smgs: "ПП", equipment: "СНАРЯЖЕНИЕ" };
            const icons = { rifles: "Crosshair", pistols: "Target", smgs: "Zap", equipment: "Shield" };
            return (
              <button key={cat} onClick={() => setTab(cat)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition-all ${tab === cat ? 'bg-yellow-500/8 border-l-2 border-yellow-500 text-yellow-400' : 'text-white/35 hover:text-white/60'}`}>
                <Icon name={icons[cat] as any} size={13} />
                <span className="rajdhani font-semibold text-sm">{labels[cat]}</span>
              </button>
            );
          })}

          <div className="mt-auto px-4 pt-3 border-t border-white/5">
            <div className="mono text-white/20 text-xs mb-2">КУПЛЕНО</div>
            <div className="space-y-1">
              {cart.map(id => {
                const all = [...WEAPONS.rifles, ...WEAPONS.pistols, ...WEAPONS.smgs, ...WEAPONS.equipment];
                const w = all.find(x => x.id === id);
                return w ? (
                  <div key={id} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                    <span className="rajdhani text-white/50 text-xs">{w.name}</span>
                  </div>
                ) : null;
              })}
            </div>
            {totalSpent > 0 && <div className="mt-2 mono text-red-400/50 text-xs">-${totalSpent.toLocaleString()}</div>}
          </div>
        </div>

        {/* Weapons */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-3">
            {currentWeapons.map(weapon => {
              const owned = cart.includes(weapon.id);
              const canAfford = money >= weapon.price;
              return (
                <div key={weapon.id}
                  className={`weapon-card p-4 ${owned ? 'selected' : ''} ${!canAfford && !owned ? 'opacity-35' : ''}`}
                  onClick={() => buy(weapon)}>
                  <div className="h-12 flex items-center justify-center mb-3 border border-white/4 bg-white/1">
                    <div className="mono text-white/15 text-xs tracking-widest">
                      [{weapon.category.toUpperCase()}]
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="rajdhani font-bold text-white text-sm">{weapon.name}</div>
                      {weapon.team && (
                        <div className={`mono text-xs ${weapon.team === 'CT' ? 'text-blue-400' : 'text-red-400'}`}>{weapon.team}</div>
                      )}
                    </div>
                    <div className={`orbitron font-bold text-sm ${canAfford ? 'text-yellow-400' : 'text-white/25'}`}>
                      {weapon.price === 0 ? 'БЕСП.' : `$${weapon.price}`}
                    </div>
                  </div>
                  {weapon.damage > 0 && (
                    <div className="space-y-1 mt-2">
                      {[
                        { label: "УРН", val: weapon.damage, max: 120 },
                        { label: "СКР", val: weapon.rof, max: 100 },
                        { label: "ТЧН", val: weapon.accuracy, max: 100 },
                      ].map(stat => (
                        <div key={stat.label} className="flex items-center gap-1.5">
                          <span className="mono text-white/20 text-xs w-6">{stat.label}</span>
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{ width: `${(stat.val / stat.max) * 100}%` }} />
                          </div>
                          <span className="mono text-white/35 text-xs w-5 text-right">{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {weapon.ammo > 0 && <div className="mt-1.5 mono text-white/20 text-xs">{weapon.ammo} патронов</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team panel */}
        <div className="w-44 border-l border-white/5 flex flex-col py-3">
          <div className="mono text-white/20 text-xs px-4 mb-2 tracking-widest">КОМАНДА КТ</div>
          {PLAYERS_CT.map(p => (
            <div key={p.id} className={`px-4 py-2 flex items-center gap-2 ${p.name === 'YOU' ? 'bg-yellow-500/8' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${p.alive ? 'bg-green-400' : 'bg-red-500/30'}`} />
              <div className="flex-1 min-w-0">
                <div className={`rajdhani text-xs font-semibold truncate ${p.name === 'YOU' ? 'text-yellow-400' : 'text-white/55'}`}>{p.name}</div>
                <div className="mono text-white/20 text-xs">${p.money.toLocaleString()}</div>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="mono text-white/20 text-xs px-4 mb-2 tracking-widest">КОМАНДА Т</div>
            {PLAYERS_T.map(p => (
              <div key={p.id} className="px-4 py-2 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${p.alive ? 'bg-red-400' : 'bg-red-500/15'}`} />
                <div className="rajdhani text-xs text-white/30 truncate">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== GAME =====================
function GameScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [bombTimer, setBombTimer] = useState(40);
  const [plantProgress, setPlantProgress] = useState(0);
  const [defuseProgress, setDefuseProgress] = useState(0);
  const [roundTime, setRoundTime] = useState(115);
  const [hp] = useState(100);
  const [armor] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [money, setMoney] = useState(5400);
  const [score, setScore] = useState({ ct: 5, t: 4 });
  const [killfeed, setKillfeed] = useState([
    { killer: "YOU", victim: "VoidHunter", weapon: "M4A4", headshot: true },
    { killer: "SteelWolf", victim: "IronFist", weapon: "AWP", headshot: true },
  ]);
  const [bombSite, setBombSite] = useState<"A" | "B" | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "playing" && phase !== "planted") return;
    const t = setInterval(() => {
      if (phase === "planted") {
        setBombTimer(p => { if (p <= 1) { clearInterval(t); setPhase("round-end"); return 0; } return p - 1; });
      } else {
        setRoundTime(p => { if (p <= 1) { clearInterval(t); setPhase("round-end"); return 0; } return p - 1; });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const startPlant = (zone: string) => {
    if (phase !== "playing") return;
    setPhase("planting");
    let prog = 0;
    progressRef.current = setInterval(() => {
      prog += 3;
      setPlantProgress(prog);
      if (prog >= 100) {
        clearInterval(progressRef.current!);
        setPhase("planted");
        setBombSite(zone as "A" | "B");
        setPlantProgress(0);
        setBombTimer(40);
        setKillfeed(prev => [{ killer: "YOU", victim: "БОМБА ЗАЛОЖЕНА", weapon: "💣", headshot: false }, ...prev].slice(0, 4));
      }
    }, 100);
  };

  const startDefuse = () => {
    if (phase !== "planted") return;
    setPhase("defusing");
    let prog = 0;
    progressRef.current = setInterval(() => {
      prog += 2;
      setDefuseProgress(prog);
      if (prog >= 100) {
        clearInterval(progressRef.current!);
        setPhase("round-end");
        setDefuseProgress(0);
        setScore(s => ({ ...s, ct: s.ct + 1 }));
        setMoney(m => m + 3500);
        setKillfeed(prev => [{ killer: "YOU", victim: "БОМБА ДЕФУЗИРОВАНА", weapon: "🔧", headshot: false }, ...prev].slice(0, 4));
      }
    }, 80);
  };

  const stopAction = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (phase === "planting") { setPhase("playing"); setPlantProgress(0); }
    if (phase === "defusing") { setPhase("planted"); setDefuseProgress(0); }
  };

  const shoot = () => {
    if (ammo <= 0) return;
    setAmmo(a => Math.max(0, a - 1));
    if (Math.random() > 0.55) {
      const tAlive = PLAYERS_T.filter(p => p.alive);
      if (tAlive.length > 0) {
        const victim = tAlive[Math.floor(Math.random() * tAlive.length)];
        const hs = Math.random() > 0.65;
        setMoney(m => m + (hs ? 350 : 300));
        setKillfeed(prev => [{ killer: "YOU", victim: victim.name, weapon: "M4A4", headshot: hs }, ...prev].slice(0, 4));
      }
    }
  };

  const zones = [
    { id: "A", label: "Точка A", x: 20, y: 38 },
    { id: "B", label: "Точка B", x: 76, y: 57 },
  ];

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-[#0a0a0a] w-full h-screen flex flex-col overflow-hidden relative select-none" style={{ cursor: 'crosshair' }}>

      {/* WORLD */}
      <div className="absolute inset-0" onClick={shoot}>
        {/* Sky */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #6b9fd4 0%, #87CEEB 35%, #8B7355 35%, #7a6545 100%)' }} />
        
        {/* Sun */}
        <div className="absolute" style={{ top: '5%', left: '30%', width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(255,200,60,0.4) 50%, transparent 70%)' }} />

        {/* Far buildings */}
        {[
          { l: '3%', w: 75, h: 200, c: '#2d2820' }, { l: '10%', w: 55, h: 160, c: '#252015' },
          { l: '16%', w: 95, h: 240, c: '#2d2820' }, { l: '61%', w: 85, h: 220, c: '#252015' },
          { l: '72%', w: 65, h: 185, c: '#2d2820' }, { l: '80%', w: 105, h: 260, c: '#1e1a10' },
          { l: '89%', w: 60, h: 175, c: '#2d2820' },
        ].map((b, i) => (
          <div key={i} className="absolute" style={{
            left: b.l, bottom: '38%', width: b.w, height: b.h, backgroundColor: b.c,
            boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.4)'
          }}>
            <div className="absolute inset-1 opacity-30" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
              {[...Array(9)].map((_, j) => (
                <div key={j} style={{ background: j % 3 === 0 ? 'rgba(245,166,35,0.25)' : 'rgba(0,0,0,0.5)', height: 10, borderRadius: 1 }} />
              ))}
            </div>
          </div>
        ))}

        {/* Near buildings */}
        <div className="absolute" style={{ bottom: '38%', left: '9%', width: 130, height: 150, background: '#3d3525', boxShadow: '5px 0 15px rgba(0,0,0,0.6)' }}>
          <div className="absolute top-6 left-3 w-9 h-12 bg-black/70 border border-yellow-900/20" />
          <div className="absolute top-6 right-3 w-9 h-12 border border-yellow-500/10" style={{ background: 'rgba(245,166,35,0.08)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/20" />
        </div>
        <div className="absolute" style={{ bottom: '38%', right: '7%', width: 160, height: 185, background: '#302820', boxShadow: '-5px 0 15px rgba(0,0,0,0.6)' }}>
          <div className="absolute inset-2 grid grid-cols-2 gap-1.5 opacity-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: '#0a0800', border: '1px solid rgba(0,0,0,0.3)', height: 22 }} />
            ))}
          </div>
        </div>

        {/* Crates */}
        <div className="absolute flex gap-2 items-end" style={{ bottom: '38%', left: '31%' }}>
          {[52, 44, 50, 40].map((h, i) => (
            <div key={i} style={{ width: 34, height: h, background: '#7a6030', boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)' }}>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.3)', marginTop: 8 }} />
              <div style={{ height: 1, background: 'rgba(0,0,0,0.2)', marginTop: 8 }} />
            </div>
          ))}
        </div>
        <div className="absolute flex gap-2 items-end" style={{ bottom: '38%', right: '24%' }}>
          {[48, 58, 42].map((h, i) => (
            <div key={i} style={{ width: 38, height: h, background: '#604828', boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.4)' }} />
          ))}
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '38%', background: 'linear-gradient(180deg, #7a6545 0%, #6a5535 50%, #5a4525 100%)' }}>
          {[10,20,30,40,50,60,70,80,90].map(x => (
            <div key={x} className="absolute top-0 bottom-0 opacity-8" style={{ left: x + '%', width: 1, background: 'rgba(0,0,0,0.5)' }} />
          ))}
        </div>

        {/* Atmosphere vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 55%, transparent 30%, rgba(10,8,5,0.35) 100%)' }} />

        {/* BOMB SITES */}
        {zones.map(zone => (
          <div key={zone.id} className="absolute" style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%,-50%)' }}
            onMouseEnter={() => setActiveZone(zone.id)}
            onMouseLeave={() => { setActiveZone(null); stopAction(); }}>
            <div className="flex flex-col items-center">
              <div
                className={`w-14 h-14 flex items-center justify-center cursor-pointer transition-all duration-200 ${phase === "planted" && bombSite === zone.id ? 'animate-bomb-pulse border-red-500 bg-red-500/15' : activeZone === zone.id ? 'border-yellow-400 bg-yellow-500/12 scale-110' : 'border-yellow-500/50 bg-yellow-500/5'}`}
                style={{ border: '2px solid', clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}
                onMouseDown={() => {
                  if (activeZone === zone.id && phase === "playing") startPlant(zone.id);
                  if (activeZone === zone.id && phase === "planted" && bombSite === zone.id) startDefuse();
                }}
                onMouseUp={stopAction}
              >
                {phase === "planted" && bombSite === zone.id
                  ? <span className="text-xl">💣</span>
                  : <span className={`orbitron font-black text-xl ${activeZone === zone.id ? 'text-yellow-300' : 'text-yellow-500/70'}`}>{zone.id}</span>
                }
              </div>
              <div className={`mono text-xs mt-1 tracking-wider ${activeZone === zone.id ? 'text-yellow-300' : 'text-yellow-500/50'}`}>{zone.label}</div>
              {activeZone === zone.id && phase === "playing" && <div className="mono text-white/50 text-xs">ЗАЖМИ</div>}
              {activeZone === zone.id && phase === "planted" && bombSite === zone.id && <div className="mono text-green-400 text-xs animate-pulse-gold">ДЕФУЗ</div>}
            </div>
          </div>
        ))}

        {/* Action overlays */}
        {(phase === "planting" || phase === "defusing") && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20">
            <div className="game-panel px-8 py-5 flex flex-col items-center gap-3">
              <div className={`orbitron text-sm tracking-widest font-bold ${phase === "planting" ? 'text-yellow-400' : 'text-green-400'}`}>
                {phase === "planting" ? "ЗАКЛАДКА БОМБЫ" : "ДЕФУЗИРОВАНИЕ..."}
              </div>
              <div className="w-48 h-2 bg-white/10 rounded overflow-hidden">
                <div className={`h-full rounded transition-all ${phase === "planting" ? 'bg-yellow-400' : 'bg-green-400'}`}
                  style={{ width: `${phase === "planting" ? plantProgress : defuseProgress}%` }} />
              </div>
              <div className="mono text-white/35 text-xs">
                {phase === "planting" ? "УДЕРЖИВАЙТЕ..." : "НЕ ОТПУСКАЙТЕ!"}
              </div>
            </div>
          </div>
        )}

        {/* Round end */}
        {phase === "round-end" && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/65">
            <div className="game-panel p-10 flex flex-col items-center gap-5 animate-fade-in">
              <div className={`orbitron font-black text-3xl ${bombTimer <= 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {bombTimer <= 0 ? 'ТЕРРОРИСТЫ ПОБЕДИЛИ' : 'КТ ПОБЕДИЛИ'}
              </div>
              <div className="mono text-white/35 text-sm">{bombTimer <= 0 ? 'Бомба взорвалась' : 'Бомба дефузирована'}</div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => onNavigate("shop")}>СЛЕДУЮЩИЙ РАУНД</button>
                <button className="btn-secondary" onClick={() => onNavigate("menu")}>МЕНЮ</button>
              </div>
            </div>
          </div>
        )}

        {/* Crosshair */}
        <div className="crosshair z-10 pointer-events-none"><span /></div>
      </div>

      {/* HUD TOP */}
      <div className="relative z-20 flex items-start justify-between px-4 pt-3 pointer-events-none">
        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {PLAYERS_CT.map(p => <div key={p.id} className={`w-2 h-3.5 ${p.alive ? 'bg-blue-400' : 'bg-blue-400/20'}`} />)}
            </div>
            <span className="orbitron font-bold text-white text-2xl">{score.ct}</span>
          </div>
          <div className="game-panel px-4 py-1.5 flex flex-col items-center min-w-16">
            {phase === "planted" ? (
              <>
                <span className={`orbitron font-black text-xl ${bombTimer <= 10 ? 'text-red-400 animate-pulse-gold' : 'text-red-300'}`}>{bombTimer}</span>
                <span className="mono text-red-400/50 text-xs">💣</span>
              </>
            ) : (
              <>
                <span className={`orbitron font-bold text-lg ${roundTime <= 30 ? 'text-red-400' : 'text-white'}`}>{fmt(roundTime)}</span>
                <span className="mono text-white/25 text-xs">РНД 10</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="orbitron font-bold text-white text-2xl">{score.t}</span>
            <div className="flex gap-0.5">
              {PLAYERS_T.map(p => <div key={p.id} className={`w-2 h-3.5 ${p.alive ? 'bg-red-400' : 'bg-red-400/20'}`} />)}
            </div>
          </div>
        </div>

        {/* Bomb indicator */}
        {phase === "planted" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 game-panel px-3 py-1 border-red-500/35 flex items-center gap-2">
            <span className="text-sm animate-pulse-gold">💣</span>
            <span className="orbitron text-red-400 text-xs font-bold tracking-widest">БОМБА НА {bombSite}</span>
          </div>
        )}

        {/* Killfeed */}
        <div className="flex flex-col gap-1">
          {killfeed.map((k, i) => (
            <div key={i} className="game-panel flex items-center gap-2 px-2.5 py-1">
              <span className={`rajdhani text-xs font-semibold ${k.killer === 'YOU' ? 'text-yellow-400' : 'text-white/60'}`}>{k.killer}</span>
              {k.headshot && <div className="w-1.5 h-1.5 bg-red-400 rotate-45" />}
              <span className="mono text-white/25 text-xs">{k.weapon}</span>
              <span className="rajdhani text-xs text-white/45">{k.victim}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HUD BOTTOM */}
      <div className="relative z-20 mt-auto pointer-events-none">
        <div className="flex items-end justify-between px-4 pb-4">
          {/* Stats */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Icon name="Heart" size={12} className="text-red-400" />
              <div className="w-28 progress-bar">
                <div className="progress-fill" style={{ width: `${hp}%`, background: 'linear-gradient(90deg,#22c55e,#4ade80)' }} />
              </div>
              <span className="orbitron font-bold text-white text-lg">{hp}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="Shield" size={12} className="text-blue-400" />
              <div className="w-28 progress-bar">
                <div className="progress-fill" style={{ width: `${armor}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
              </div>
              <span className="orbitron font-bold text-blue-400 text-sm">{armor}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon name="DollarSign" size={11} className="text-yellow-400/50" />
              <span className="orbitron text-yellow-400 text-sm">${money.toLocaleString()}</span>
            </div>
          </div>

          {/* Ammo */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-end gap-1.5">
              <span className="orbitron font-black text-white text-4xl">{ammo}</span>
              <span className="orbitron text-white/25 text-xl mb-0.5">/ 90</span>
            </div>
            <div className="flex gap-0.5">
              {[...Array(30)].map((_, i) => (
                <div key={i} className={`w-1 h-3.5 ${i < ammo ? 'bg-yellow-400' : 'bg-white/8'}`} />
              ))}
            </div>
            <div className="rajdhani text-white/45 text-sm tracking-wider">M4A4</div>
          </div>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
          <button className="btn-secondary" style={{ clipPath: 'none', padding: '6px 14px', fontSize: 10 }} onClick={() => onNavigate("shop")}>[B] МАГАЗИН</button>
          <button className="btn-secondary" style={{ clipPath: 'none', padding: '6px 14px', fontSize: 10 }} onClick={() => setShowMap(v => !v)}>[M] КАРТА</button>
          <button className="btn-secondary" style={{ clipPath: 'none', padding: '6px 14px', fontSize: 10 }} onClick={shoot}>[LMB] ВЫСТРЕЛ</button>
        </div>
      </div>

      {/* Minimap */}
      {showMap && (
        <div className="absolute bottom-14 right-4 z-30 game-panel w-44 h-44 overflow-hidden pointer-events-none animate-fade-in-fast">
          <svg className="w-full h-full" viewBox="0 0 180 180">
            <rect x="0" y="0" width="180" height="180" fill="#0a0a0a" />
            <rect x="8" y="8" width="164" height="164" fill="none" stroke="#f5a623" strokeWidth="0.8" opacity="0.25" />
            <rect x="25" y="25" width="45" height="35" fill="#1a1510" stroke="#444" strokeWidth="0.5" />
            <rect x="105" y="110" width="55" height="45" fill="#1a1510" stroke="#444" strokeWidth="0.5" />
            <rect x="70" y="70" width="35" height="28" fill="#111" stroke="#333" strokeWidth="0.5" />
            <rect x="12" y="58" width="18" height="18" fill="#f5a62315" stroke="#f5a623" strokeWidth="0.8" />
            <text x="21" y="71" textAnchor="middle" fill="#f5a623" fontSize="9" fontFamily="monospace">A</text>
            <rect x="145" y="108" width="18" height="18" fill="#f5a62315" stroke="#f5a623" strokeWidth="0.8" />
            <text x="154" y="121" textAnchor="middle" fill="#f5a623" fontSize="9" fontFamily="monospace">B</text>
            {PLAYERS_CT.filter(p => p.alive).map((p, i) => (
              <circle key={p.id} cx={72 + i * 7} cy={82 + i * 4} r={p.name === 'YOU' ? 4.5 : 3} fill={p.name === 'YOU' ? '#f5a623' : '#4a9eff'} />
            ))}
            {PLAYERS_T.filter(p => p.alive).map((p, i) => (
              <circle key={p.id} cx={108 + i * 6} cy={100 + i * 3} r="3" fill="#e02020" />
            ))}
            {bombSite === "A" && <circle cx="21" cy="67" r="3.5" fill="#e02020" opacity="0.9" />}
            {bombSite === "B" && <circle cx="154" cy="117" r="3.5" fill="#e02020" opacity="0.9" />}
          </svg>
          <div className="absolute top-1 left-2 mono text-white/25 text-xs">КАРТА</div>
        </div>
      )}
    </div>
  );
}

// ===================== SETTINGS =====================
function SettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [sens, setSens] = useState(2.5);
  const [vol, setVol] = useState(80);
  const [fov, setFov] = useState(90);
  const [res, setRes] = useState("1920x1080");

  return (
    <div className="menu-bg scanlines noise w-full h-screen flex flex-col overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-25" />
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <button onClick={() => onNavigate("menu")} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={16} />
          <span className="rajdhani text-sm tracking-wider">НАЗАД</span>
        </button>
        <span className="orbitron text-white/70 text-sm tracking-widest">НАСТРОЙКИ</span>
        <div className="w-20" />
      </div>
      <div className="relative z-10 flex flex-1 gap-8 px-12 py-8 overflow-y-auto">
        <div className="flex-1">
          <div className="mono text-yellow-500/50 text-xs tracking-widest mb-4">УПРАВЛЕНИЕ И ИЗОБРАЖЕНИЕ</div>
          {[
            { label: "Чувствительность мыши", val: sens, set: setSens, min: 0.5, max: 10, step: 0.5, fmt: (v: number) => v.toFixed(1) },
            { label: "FOV камеры", val: fov, set: setFov, min: 60, max: 120, step: 5, fmt: (v: number) => v + '°' },
            { label: "Громкость игры", val: vol, set: setVol, min: 0, max: 100, step: 5, fmt: (v: number) => v + '%' },
          ].map(item => (
            <div key={item.label} className="game-panel p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="rajdhani text-white/65">{item.label}</span>
                <span className="orbitron text-yellow-400 text-sm">{item.fmt(item.val)}</span>
              </div>
              <input type="range" min={item.min} max={item.max} step={item.step} value={item.val}
                onChange={e => item.set(Number(e.target.value))} className="w-full accent-yellow-400" />
            </div>
          ))}
          <div className="game-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="rajdhani text-white/65">Разрешение</span>
              <span className="orbitron text-yellow-400 text-sm">{res}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["1280x720", "1920x1080", "2560x1440", "3840x2160"].map(r => (
                <button key={r} onClick={() => setRes(r)} className={`px-3 py-1 mono text-xs border transition-all ${res === r ? 'border-yellow-500 text-yellow-400 bg-yellow-500/8' : 'border-white/10 text-white/35 hover:border-white/25'}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="mono text-yellow-500/50 text-xs tracking-widest mb-4">УПРАВЛЕНИЕ</div>
          {[
            ["Вперёд", "W"], ["Назад", "S"], ["Влево", "A"], ["Вправо", "D"],
            ["Прыжок", "SPACE"], ["Приседание", "CTRL"], ["Магазин", "B"],
            ["Карта", "M"], ["Огонь", "LMB"], ["Прицел", "RMB"],
          ].map(([action, key]) => (
            <div key={action} className="flex items-center justify-between py-2 border-b border-white/4">
              <span className="rajdhani text-white/45 text-sm">{action}</span>
              <div className="game-panel px-3 py-0.5 mono text-white/60 text-xs">{key}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== SCOREBOARD =====================
function ScoreboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="menu-bg scanlines noise w-full h-screen flex flex-col overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-25" />
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <button onClick={() => onNavigate("menu")} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={16} />
          <span className="rajdhani text-sm tracking-wider">НАЗАД</span>
        </button>
        <span className="orbitron text-white/70 text-sm tracking-widest">СТАТИСТИКА МАТЧА</span>
        <div className="w-20" />
      </div>
      <div className="relative z-10 flex flex-col flex-1 px-12 py-6 overflow-y-auto gap-5">
        <div className="flex items-center justify-center gap-8 animate-fade-in">
          <div className="text-center">
            <div className="mono text-blue-400/50 text-xs tracking-widest mb-1">КТ · КОНТРТЕРРОРИСТЫ</div>
            <div className="orbitron font-black text-blue-400 text-6xl">5</div>
          </div>
          <div className="mono text-white/15 text-2xl">:</div>
          <div className="text-center">
            <div className="mono text-red-400/50 text-xs tracking-widest mb-1">Т · ТЕРРОРИСТЫ</div>
            <div className="orbitron font-black text-red-400 text-6xl">4</div>
          </div>
        </div>
        {[
          { team: "КТ", color: "text-blue-400", players: PLAYERS_CT },
          { team: "Т", color: "text-red-400", players: PLAYERS_T }
        ].map(side => (
          <div key={side.team} className="animate-fade-in">
            <div className={`mono text-xs tracking-widest mb-2 ${side.color}`}>{side.team} КОМАНДА</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["ИГРОК", "К", "С", "K/D", "ДЕНЬГИ", "ОРУЖИЕ"].map(h => (
                    <th key={h} className="mono text-white/20 text-xs text-left py-2 px-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...side.players].sort((a, b) => b.kills - a.kills).map(p => (
                  <tr key={p.id} className={`border-b border-white/4 ${p.name === 'YOU' ? 'bg-yellow-500/4' : ''} ${!p.alive ? 'opacity-35' : ''}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.alive ? 'bg-green-400' : 'bg-red-500/40'}`} />
                        <span className={`rajdhani font-semibold ${p.name === 'YOU' ? 'text-yellow-400' : 'text-white/75'}`}>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 orbitron text-white font-bold text-sm">{p.kills}</td>
                    <td className="py-2 px-3 orbitron text-white/45 text-sm">{p.deaths}</td>
                    <td className="py-2 px-3 orbitron text-sm" style={{ color: p.deaths === 0 ? '#f5a623' : p.kills / p.deaths > 1 ? '#4ade80' : '#f87171' }}>
                      {p.deaths === 0 ? '∞' : (p.kills / p.deaths).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 orbitron text-yellow-400 text-sm">${p.money.toLocaleString()}</td>
                    <td className="py-2 px-3 rajdhani text-white/45 text-sm">{p.weapon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== AGENT SELECT =====================
function AgentSelectScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const display = hovered || selected || AGENTS[0].id;
  const agent = AGENTS.find(a => a.id === display) || AGENTS[0];

  return (
    <div className="menu-bg scanlines noise w-full h-screen flex flex-col relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-25" />
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <button onClick={() => onNavigate("mode-select")} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={16} />
          <span className="rajdhani text-sm tracking-wider">НАЗАД</span>
        </button>
        <span className="orbitron text-white/70 text-sm tracking-widest">ВЫБОР АГЕНТА</span>
        <div className="w-20" />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Agent list */}
        <div className="w-72 border-r border-white/5 flex flex-col py-4 gap-2 px-4 overflow-y-auto">
          <div className="mono text-white/25 text-xs tracking-widest mb-2">АГЕНТЫ</div>
          {AGENTS.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-3 cursor-pointer border transition-all duration-200 ${selected === a.id ? 'border-yellow-500/60 bg-yellow-500/8' : 'border-white/5 hover:border-white/15'}`}
              onMouseEnter={() => setHovered(a.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(a.id)}
            >
              <div className="w-10 h-10 flex items-center justify-center text-lg font-black border" style={{ background: a.color + '20', borderColor: a.color + '50', color: a.color }}>
                {a.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`rajdhani font-bold text-sm ${selected === a.id ? 'text-yellow-400' : 'text-white/80'}`}>{a.name}</div>
                <div className="mono text-xs" style={{ color: a.color }}>{a.role}</div>
              </div>
              {selected === a.id && <Icon name="Check" size={14} className="text-yellow-400" />}
            </div>
          ))}
        </div>

        {/* Agent preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 gap-6">
          {/* Big avatar */}
          <div className="relative w-40 h-40 flex items-center justify-center animate-fade-in" key={agent.id}>
            {/* Rings */}
            <div className="absolute inset-0 rounded-full border opacity-20" style={{ borderColor: agent.color }} />
            <div className="absolute inset-4 rounded-full border opacity-30" style={{ borderColor: agent.color }} />
            <div className="absolute inset-8 rounded-full border opacity-50" style={{ borderColor: agent.color }} />
            {/* Avatar */}
            <div className="w-24 h-24 flex items-center justify-center text-5xl font-black border-2 rounded-sm" style={{ background: agent.color + '15', borderColor: agent.color + '60', color: agent.color }}>
              {agent.name[0]}
            </div>
          </div>

          <div className="text-center">
            <div className="orbitron font-black text-white text-3xl mb-1">{agent.name}</div>
            <div className="mono text-sm mb-3" style={{ color: agent.color }}>{agent.role.toUpperCase()}</div>
            <p className="rajdhani text-white/50 text-base max-w-sm leading-relaxed">{agent.desc}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="orbitron font-bold text-white">{agent.hp}</div>
              <div className="mono text-white/30 text-xs">ЗДОРОВЬЕ</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="orbitron font-bold text-white">{Math.round(agent.speed * 100)}%</div>
              <div className="mono text-white/30 text-xs">СКОРОСТЬ</div>
            </div>
          </div>

          {/* Abilities */}
          <div className="flex gap-4">
            <div className="game-panel p-4 flex flex-col items-center gap-2 w-40">
              <div className="orbitron text-xs border border-yellow-500/40 px-2 py-0.5 text-yellow-400">Q</div>
              <div className="rajdhani text-white/70 text-sm text-center">{agent.ability}</div>
              <div className="mono text-white/25 text-xs">СПОСОБНОСТЬ</div>
            </div>
            <div className="game-panel p-4 flex flex-col items-center gap-2 w-40">
              <div className="orbitron text-xs border border-red-500/40 px-2 py-0.5 text-red-400">X</div>
              <div className="rajdhani text-white/70 text-sm text-center">{agent.ult}</div>
              <div className="mono text-white/25 text-xs">УЛЬТИМЕЙТ</div>
            </div>
          </div>

          <button
            className={`btn-primary ${!selected ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={!selected}
            onClick={() => selected && onNavigate("game3d")}
          >
            {selected ? `ИГРАТЬ ЗА ${agent.name.toUpperCase()} →` : 'ВЫБЕРИТЕ АГЕНТА'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== ROOT =====================
export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedAgent, setSelectedAgent] = useState("ghost");

  // Wrapper for agent select that stores choice
  const AgentSelectWithStore = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
    const [sel, setSel] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const display = hovered || sel || AGENTS[0].id;
    const agent = AGENTS.find(a => a.id === display) || AGENTS[0];

    return (
      <div className="menu-bg scanlines noise w-full h-screen flex flex-col relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-25" />
        <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
          <button onClick={() => onNavigate("mode-select")} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={16} />
            <span className="rajdhani text-sm tracking-wider">НАЗАД</span>
          </button>
          <span className="orbitron text-white/70 text-sm tracking-widest">ВЫБОР АГЕНТА</span>
          <div className="w-20" />
        </div>
        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Agent list */}
          <div className="w-72 border-r border-white/5 flex flex-col py-4 gap-2 px-4 overflow-y-auto">
            <div className="mono text-white/25 text-xs tracking-widest mb-2">АГЕНТЫ</div>
            {AGENTS.map((a) => (
              <div key={a.id}
                className={`flex items-center gap-3 p-3 cursor-pointer border transition-all duration-200 ${sel === a.id ? 'border-yellow-500/60 bg-yellow-500/8' : 'border-white/5 hover:border-white/15'}`}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSel(a.id)}
              >
                <div className="w-10 h-10 flex items-center justify-center text-lg font-black border" style={{ background: a.color + '20', borderColor: a.color + '50', color: a.color }}>{a.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className={`rajdhani font-bold text-sm ${sel === a.id ? 'text-yellow-400' : 'text-white/80'}`}>{a.name}</div>
                  <div className="mono text-xs" style={{ color: a.color }}>{a.role}</div>
                </div>
                {sel === a.id && <Icon name="Check" size={14} className="text-yellow-400" />}
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-5">
            <div className="relative w-36 h-36 flex items-center justify-center animate-fade-in" key={agent.id}>
              <div className="absolute inset-0 rounded-full border opacity-15" style={{ borderColor: agent.color }} />
              <div className="absolute inset-4 rounded-full border opacity-25" style={{ borderColor: agent.color }} />
              <div className="w-20 h-20 flex items-center justify-center text-4xl font-black border-2" style={{ background: agent.color + '15', borderColor: agent.color + '60', color: agent.color }}>{agent.name[0]}</div>
            </div>
            <div className="text-center">
              <div className="orbitron font-black text-white text-3xl mb-0.5">{agent.name}</div>
              <div className="mono text-sm mb-3" style={{ color: agent.color }}>{agent.role.toUpperCase()}</div>
              <p className="rajdhani text-white/45 text-base max-w-sm leading-relaxed">{agent.desc}</p>
            </div>
            <div className="flex gap-5">
              <div className="text-center"><div className="orbitron font-bold text-white">{agent.hp}</div><div className="mono text-white/25 text-xs">ЗДОРОВЬЕ</div></div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center"><div className="orbitron font-bold text-white">{Math.round(agent.speed * 100)}%</div><div className="mono text-white/25 text-xs">СКОРОСТЬ</div></div>
            </div>
            <div className="flex gap-3">
              <div className="game-panel p-3 flex flex-col items-center gap-1.5 w-36">
                <div className="orbitron text-xs border border-yellow-500/40 px-2 py-0.5 text-yellow-400">Q</div>
                <div className="rajdhani text-white/65 text-sm text-center">{agent.ability}</div>
                <div className="mono text-white/20 text-xs">СПОСОБНОСТЬ</div>
              </div>
              <div className="game-panel p-3 flex flex-col items-center gap-1.5 w-36">
                <div className="orbitron text-xs border border-red-500/40 px-2 py-0.5 text-red-400">X</div>
                <div className="rajdhani text-white/65 text-sm text-center">{agent.ult}</div>
                <div className="mono text-white/20 text-xs">УЛЬТИМЕЙТ</div>
              </div>
            </div>
            <button
              className={`btn-primary ${!sel ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!sel}
              onClick={() => {
                if (sel) {
                  setSelectedAgent(sel);
                  onNavigate("game3d");
                }
              }}
            >
              {sel ? `ИГРАТЬ ЗА ${agent.name.toUpperCase()} →` : 'ВЫБЕРИТЕ АГЕНТА'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      {screen === "menu" && <MenuScreen onNavigate={setScreen} />}
      {screen === "mode-select" && <ModeSelectScreen onNavigate={(s) => {
        if (s === "shop") setScreen("agent-select");
        else setScreen(s);
      }} />}
      {screen === "agent-select" && <AgentSelectWithStore onNavigate={setScreen} />}
      {screen === "shop" && <ShopScreen onNavigate={setScreen} />}
      {screen === "game" && <GameScreen onNavigate={setScreen} />}
      {screen === "game3d" && (
        <Game3D
          agentId={selectedAgent}
          onBack={() => setScreen("menu")}
          onOpenShop={() => setScreen("shop")}
        />
      )}
      {screen === "settings" && <SettingsScreen onNavigate={setScreen} />}
      {screen === "scoreboard" && <ScoreboardScreen onNavigate={setScreen} />}
    </div>
  );
}