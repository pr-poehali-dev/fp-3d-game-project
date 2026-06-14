 
import Icon from "@/components/ui/icon";
import { GamePhase, Enemy } from "./types";

interface Agent {
  name: string;
  role: string;
  color: string;
  ability: string;
  ult: string;
}

interface GameHUDProps {
  // canvas
  mountLocked: boolean;
  onRequestPointerLock: () => void;
  // game state
  phase: GamePhase;
  hp: number;
  armor: number;
  ammo: number;
  money: number;
  kills: number;
  roundTime: number;
  bombTimer: number;
  plantProgress: number;
  defuseProgress: number;
  nearSite: "A" | "B" | null;
  bombSite: "A" | "B" | null;
  score: { ct: number; t: number };
  killfeed: { text: string; color: string }[];
  crosshairHit: boolean;
  abilityReady: boolean;
  ultReady: boolean;
  fps: number;
  agent: Agent;
  agentId: string;
  enemies: Enemy[];
  // actions
  onBack: () => void;
  onOpenShop: () => void;
  onAction: () => void;
  onResetAndShop: () => void;
  onResetAndBack: () => void;
}

export default function GameHUD({
  mountLocked,
  onRequestPointerLock,
  phase,
  hp,
  armor,
  ammo,
  money,
  kills,
  roundTime,
  bombTimer,
  plantProgress,
  defuseProgress,
  nearSite,
  bombSite,
  score,
  killfeed,
  crosshairHit,
  abilityReady,
  ultReady,
  fps,
  agent,
  agentId,
  enemies,
  onBack,
  onOpenShop,
  onAction,
  onResetAndShop,
  onResetAndBack,
}: GameHUDProps) {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <>
      {/* POINTER LOCK OVERLAY */}
      {!mountLocked && phase !== "round_won" && phase !== "round_lost" && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40 bg-black/50"
          onClick={onRequestPointerLock}
        >
          <div className="game-panel p-10 flex flex-col items-center gap-4 animate-fade-in text-center">
            <div className="w-14 h-14 border-2 border-yellow-500/50 flex items-center justify-center">
              <Icon name="MousePointer" size={24} className="text-yellow-400" />
            </div>
            <div className="orbitron text-white font-bold text-xl">НАЖМИ ДЛЯ ИГРЫ</div>
            <div className="rajdhani text-white/50 text-base">Кликни чтобы захватить мышь и начать</div>
            <div className="mono text-white/30 text-xs mt-2">ESC — выйти из режима  |  WASD — движение  |  ЛКМ — выстрел</div>
            <div className="mono text-yellow-400/60 text-xs">F — закладка/дефуз бомбы  |  B — магазин</div>
          </div>
        </div>
      )}

      {/* CROSSHAIR */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className={`relative transition-all duration-75 ${crosshairHit ? "scale-150" : "scale-100"}`}>
          <div className={`absolute w-px h-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ top: -14, left: 0 }} />
          <div className={`absolute w-px h-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ bottom: -14, left: 0 }} />
          <div className={`absolute h-px w-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ left: -14, top: 0 }} />
          <div className={`absolute h-px w-3 ${crosshairHit ? "bg-red-400" : "bg-white"} opacity-90`} style={{ right: -14, top: 0 }} />
          <div className={`w-1 h-1 rounded-full ${crosshairHit ? "bg-red-400" : "bg-white/60"}`} />
        </div>
      </div>

      {/* ── HUD TOP ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-4 pt-3 pointer-events-none">
        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-2 h-3.5 bg-blue-400" />)}
            </div>
            <span className="orbitron font-bold text-white text-2xl">{score.ct}</span>
          </div>
          <div className="game-panel px-4 py-1.5 flex flex-col items-center min-w-16">
            {phase === "planted" ? (
              <>
                <span className={`orbitron font-black text-2xl ${bombTimer <= 10 ? "text-red-400 animate-pulse-gold" : "text-red-300"}`}>{bombTimer}</span>
                <span className="mono text-red-400/50 text-xs">💣</span>
              </>
            ) : (
              <>
                <span className={`orbitron font-bold text-xl ${roundTime <= 30 ? "text-red-400" : "text-white"}`}>{fmt(roundTime)}</span>
                <span className="mono text-white/25 text-xs">РНД 10</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="orbitron font-bold text-white text-2xl">{score.t}</span>
            <div className="flex gap-0.5">
              {enemies.map((e, i) => (
                <div key={i} className={`w-2 h-3.5 ${e.alive ? "bg-red-400" : "bg-red-400/20"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Bomb planted indicator */}
        {phase === "planted" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 game-panel px-4 py-1.5 border-red-500/40 flex items-center gap-2">
            <span className="text-base animate-pulse-gold">💣</span>
            <span className="orbitron text-red-400 text-xs font-bold tracking-widest">БОМБА НА ТОЧКЕ {bombSite}</span>
          </div>
        )}

        {/* Kill feed */}
        <div className="flex flex-col gap-1">
          {killfeed.map((k, i) => (
            <div key={i} className="game-panel flex items-center gap-2 px-2.5 py-1 max-w-xs">
              <span className="rajdhani text-xs truncate" style={{ color: k.color }}>{k.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HUD BOTTOM ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Plant/Defuse progress */}
        {(phase === "planting" || phase === "defusing") && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-8 py-3 flex flex-col items-center gap-2">
              <div className={`orbitron text-sm font-bold ${phase === "planting" ? "text-yellow-400" : "text-green-400"}`}>
                {phase === "planting" ? "ЗАКЛАДКА БОМБЫ" : "ДЕФУЗИРОВАНИЕ"}
              </div>
              <div className="w-56 h-2 bg-white/10 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${phase === "planting" ? "bg-yellow-400" : "bg-green-400"}`}
                  style={{ width: `${phase === "planting" ? plantProgress : defuseProgress}%` }}
                />
              </div>
              <div className="mono text-white/35 text-xs">
                {phase === "planting" ? "УДЕРЖИВАЙТЕ F..." : "НЕ ОТПУСКАЙТЕ F!"}
              </div>
            </div>
          </div>
        )}

        {/* Near site prompt */}
        {nearSite && phase === "playing" && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-4 py-2 border-yellow-500/40 flex items-center gap-2 animate-fade-in-fast">
              <span className="text-yellow-400">💣</span>
              <span className="orbitron text-yellow-400 text-xs font-bold">ТОЧКА {nearSite} — [F] ЗАЛОЖИТЬ БОМБУ</span>
            </div>
          </div>
        )}
        {nearSite && phase === "planted" && bombSite === nearSite && (
          <div className="flex justify-center mb-4">
            <div className="game-panel px-4 py-2 border-green-500/40 flex items-center gap-2 animate-fade-in-fast">
              <span className="text-green-400">🔧</span>
              <span className="orbitron text-green-400 text-xs font-bold">ТОЧКА {nearSite} — [F] ДЕФУЗИРОВАТЬ БОМБУ</span>
            </div>
          </div>
        )}

        {/* Main HUD bar */}
        <div className="flex items-end justify-between px-4 pb-4">
          {/* Agent + Stats */}
          <div className="flex items-end gap-4">
            <div className="game-panel p-2 flex flex-col items-center gap-1" style={{ borderColor: agent.color + "60" }}>
              <div className="w-10 h-10 rounded flex items-center justify-center text-xl font-bold" style={{ background: agent.color + "30", color: agent.color }}>
                {agent.name[0]}
              </div>
              <div className="mono text-xs" style={{ color: agent.color }}>{agent.role}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={12} className="text-red-400" />
                <div className="w-28 progress-bar">
                  <div className="progress-fill" style={{ width: `${hp}%`, background: hp > 50 ? "linear-gradient(90deg,#22c55e,#4ade80)" : hp > 25 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)" }} />
                </div>
                <span className="orbitron font-bold text-white text-lg">{hp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={12} className="text-blue-400" />
                <div className="w-28 progress-bar">
                  <div className="progress-fill" style={{ width: `${armor}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)" }} />
                </div>
                <span className="orbitron font-bold text-blue-400 text-sm">{armor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="DollarSign" size={11} className="text-yellow-400/60" />
                <span className="orbitron text-yellow-400 text-sm">${money.toLocaleString()}</span>
                <div className="w-px h-3 bg-white/15" />
                <Icon name="Target" size={11} className="text-white/40" />
                <span className="orbitron text-white/60 text-sm">{kills} убийств</span>
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 flex items-center justify-center border text-xs orbitron font-bold transition-all ${abilityReady ? "border-yellow-500/60 text-yellow-400 bg-yellow-500/10" : "border-white/15 text-white/25"}`}>
                Q
              </div>
              <div className="mono text-white/30 text-xs max-w-20">{agent.ability}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 flex items-center justify-center border text-xs orbitron font-bold transition-all ${ultReady ? "border-red-500/60 text-red-400 bg-red-500/10 animate-pulse-gold" : "border-white/10 text-white/20"}`}>
                X
              </div>
              <div className="mono text-white/30 text-xs max-w-20">{agent.ult}</div>
            </div>
          </div>

          {/* Ammo */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-end gap-2">
              <span className="orbitron font-black text-white text-4xl">{ammo}</span>
              <span className="orbitron text-white/25 text-xl mb-1">/ 90</span>
            </div>
            <div className="flex gap-0.5 flex-wrap justify-end max-w-32">
              {[...Array(30)].map((_, i) => (
                <div key={i} className={`w-1 h-3.5 ${i < ammo ? "bg-yellow-400" : "bg-white/8"}`} />
              ))}
            </div>
            <div className="rajdhani text-white/45 text-sm tracking-wider">
              {agentId === "ghost" ? "M4A4" : agentId === "ironwall" ? "AUG" : "AK-47"}
            </div>
          </div>
        </div>
      </div>

      {/* FPS counter */}
      <div className="absolute top-3 right-4 z-30 mono text-white/25 text-xs pointer-events-none">
        {fps} FPS
      </div>

      {/* Back button */}
      <div className="absolute top-14 left-4 z-30 pointer-events-auto">
        <button
          className="game-panel px-3 py-1.5 flex items-center gap-2 text-white/35 hover:text-white transition-colors"
          onClick={onBack}
        >
          <Icon name="ChevronLeft" size={14} />
          <span className="mono text-xs">МЕНЮ</span>
        </button>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            style={{ clipPath: "none", padding: "5px 12px", fontSize: 10 }}
            onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); onOpenShop(); }}
          >
            [B] МАГАЗИН
          </button>
          <button
            className="btn-secondary"
            style={{ clipPath: "none", padding: "5px 12px", fontSize: 10 }}
            onClick={onAction}
          >
            [F] ДЕЙСТВИЕ
          </button>
        </div>
      </div>

      {/* ── ROUND END ── */}
      {(phase === "round_won" || phase === "round_lost") && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="game-panel p-10 flex flex-col items-center gap-5 animate-fade-in text-center max-w-md">
            <div className={`orbitron font-black text-3xl ${phase === "round_won" ? "text-yellow-400" : "text-red-400"}`}>
              {phase === "round_won" ? "КТ ПОБЕДИЛИ!" : "ТЕРРОРИСТЫ ПОБЕДИЛИ!"}
            </div>
            <div className="flex gap-8">
              <div>
                <div className="orbitron text-white text-2xl">{kills}</div>
                <div className="mono text-white/35 text-xs">УБИЙСТВ</div>
              </div>
              <div>
                <div className="orbitron text-yellow-400 text-2xl">${money.toLocaleString()}</div>
                <div className="mono text-white/35 text-xs">ДЕНЬГИ</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" onClick={onResetAndShop}>СЛЕД. РАУНД →</button>
              <button className="btn-secondary" onClick={onResetAndBack}>МЕНЮ</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
