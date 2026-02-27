// ─── Game Balance Constants ───────────────────────────────────────────────

export const GRID = {
  COLS: 25,
  ROWS: 25,
  TILE_SIZE: 32,
}

export const ACHIEVEMENTS = [
  { score: 1000, title: "Degen Newbie" },
  { score: 5000, title: "Diamond Hands" },
  { score: 10000, title: "Whale Hunter" },
  { score: 15000, title: "DeFi Architect" },
  { score: 20000, title: "Bull Market Legend" },
  { score: 25000, title: "Cyber Security Guru" },
  { score: 30000, title: "To The Moon!" }
]

export const GAME = {
  WIDTH: GRID.COLS * GRID.TILE_SIZE,   // 800
  HEIGHT: GRID.ROWS * GRID.TILE_SIZE,  // 800
  BG_COLOR: 0x0a0a1a,
  STARTING_SOL: 100,
  BASE_HP: 20,
  HIGH_SCORE_KEY: 'crypto_defense_high_score',
}

// ─── Wave System ──────────────────────────────────────────────────────────

export const WAVE = {
  HP_BASE: 60,
  HP_GROWTH_RATE: 1.15,       // +15% per wave (harder)
  SPAWN_INTERVAL_MS: 600,     // ms between enemy spawns within a wave (faster)
  BASE_ENEMIES_COUNT: 5,      // enemies in wave 1
  ENEMIES_GROWTH: 3,          // +3 enemies per wave (larger swarms)
  DELAY_BETWEEN_WAVES_MS: 3000,
  BOSS_EVERY_N_WAVES: 10,
}

// ─── Score System ─────────────────────────────────────────────────────────

export const SCORE = {
  PER_KILL: 10,
  PER_WAVE: 100,
}

// ─── SOL Rewards ──────────────────────────────────────────────────────────

export const REWARDS = {
  PAPER_HANDS: 4,
  FUD_SPREADER: 7,
  RUG_PULL: 25,
  BOT_FARM: 3,
  SHORT_SELLER: 10,
  INFLATION_CLOUD: 12,
  SEC_REGULATOR: 35,
  SHITCOIN_RAIN: 6,
  HACK_ATTACK: 15,
  FOMO_BUYER: 8,
  DEAD_CAT_BOUNCE: 10,
  LAUNDERING_MIXER: 14,
  CENTRAL_BANK_WHALE: 150,
}

// ─── Enemy Stats ──────────────────────────────────────────────────────────
// hp is a multiplier applied to wave-scaled base HP
// speed is pixels/sec

export const ENEMIES = {
  PAPER_HANDS: { key: 'paper_hands', hp: 0.5, speed: 130, reward: REWARDS.PAPER_HANDS, color: 0x55ff55 },
  FUD_SPREADER: { key: 'fud_spreader', hp: 1.2, speed: 85, reward: REWARDS.FUD_SPREADER, color: 0xffaa00 },
  RUG_PULL: { key: 'rug_pull', hp: 2.5, speed: 65, reward: REWARDS.RUG_PULL, color: 0xff0055 },
  BOT_FARM: { key: 'bot_farm', hp: 0.35, speed: 100, reward: REWARDS.BOT_FARM, color: 0x888888 },
  SHORT_SELLER: { key: 'short_seller', hp: 1.2, speed: 90, reward: REWARDS.SHORT_SELLER, color: 0xff4444 },
  INFLATION_CLOUD: { key: 'inflation_cloud', hp: 0.8, speed: 75, reward: REWARDS.INFLATION_CLOUD, color: 0xcc66ff },
  SEC_REGULATOR: { key: 'sec_regulator', hp: 6.0, speed: 45, reward: REWARDS.SEC_REGULATOR, color: 0x3333ff },
  SHITCOIN_RAIN: { key: 'shitcoin_rain', hp: 0.7, speed: 100, reward: REWARDS.SHITCOIN_RAIN, color: 0xffff00 },
  HACK_ATTACK: { key: 'hack_attack', hp: 1.5, speed: 80, reward: REWARDS.HACK_ATTACK, color: 0x00ffcc },
  FOMO_BUYER: { key: 'fomo_buyer', hp: 1.0, speed: 70, reward: REWARDS.FOMO_BUYER, color: 0xff8800 },
  DEAD_CAT_BOUNCE: { key: 'dead_cat_bounce', hp: 1.4, speed: 75, reward: REWARDS.DEAD_CAT_BOUNCE, color: 0x66ff66 },
  LAUNDERING_MIXER: { key: 'laundering_mixer', hp: 2.0, speed: 65, reward: REWARDS.LAUNDERING_MIXER, color: 0xaaaaff },
  CENTRAL_BANK_WHALE: { key: 'central_bank_whale', hp: 20.0, speed: 30, reward: REWARDS.CENTRAL_BANK_WHALE, color: 0xff0000 },
}

// ─── Tower Stats ──────────────────────────────────────────────────────────
// upgrade multiplier: damage & range +15% per level

export const TOWER_UPGRADE_MULT = 1.15

export const TOWERS = {
  HODL_TOWER: { key: 'hodl_tower', projectile: 'proj_arrow', cost: 15, damage: 12, range: 175, fireRate: 350, color: 0x00ff88, special: null, desc: 'Basic rapid-fire defense. Reliable and cheap.' },
  STAKING_LASER: { key: 'staking_laser', projectile: 'proj_laser', cost: 25, damage: 18, range: 160, fireRate: 700, color: 0x00ccff, special: 'slow_30', desc: 'Fires chilling lasers that slow enemies by 30%.' },
  DEX_CANNON: { key: 'dex_cannon', projectile: 'proj_bomb', cost: 35, damage: 25, range: 165, fireRate: 1100, color: 0xff6600, special: 'splash', desc: 'Heavy decentralized artillery with splash damage.' },
  AIRDROP_DRONE: { key: 'airdrop_drone', projectile: 'proj_orb', cost: 40, damage: 8, range: 180, fireRate: 400, color: 0xcc00ff, special: 'sticky_zone', desc: 'Drops sticky payloads slowing enemies in a zone.' },
  TOKEN_BURNER: { key: 'token_burner', projectile: 'proj_fire', cost: 50, damage: 20, range: 140, fireRate: 200, color: 0xff3300, special: 'ignore_armor', desc: 'High pierce burn rate. Ignores enemy armor.' },
  NFT_GALLERY: { key: 'nft_gallery', projectile: 'proj_magic', cost: 65, damage: 15, range: 170, fireRate: 600, color: 0xff00ff, special: 'blind_10', desc: 'Flashy jpegs with a chance to blind enemies.' },
  STABLECOIN_SHIELD: { key: 'stablecoin_shield', projectile: null, cost: 80, damage: 0, range: 150, fireRate: 0, color: 0xffffff, special: 'buff_20', desc: 'Pegged defense. Buffs nearby tower damage by 20%.' },
  WHALE_HARPOON: { key: 'whale_harpoon', projectile: 'proj_spear', cost: 100, damage: 150, range: 230, fireRate: 2000, color: 0x0066ff, special: 'single_target', desc: 'Massive single-target damage for hunting big game.' },
  FLASH_LOAN_BOLT: { key: 'flash_loan_bolt', projectile: 'proj_lightning', cost: 120, damage: 45, range: 200, fireRate: 1200, color: 0x66ffff, special: 'chain_5', desc: 'Lightning chains up to 5 nearby targets.' },
  MINING_RIG: { key: 'mining_rig', projectile: null, cost: 150, damage: 0, range: 0, fireRate: 0, color: 0xffcc00, special: 'generate_sol', desc: 'Provides passive income. Generates $SOL over time.' }
}

// ─── Waypoints (pixel coords) ────────────────────────────────────────────
// Complex winding snake path for Phase 3

export const WAYPOINTS = [
  { x: 2, y: 114 },
  { x: 675, y: 118 },
  { x: 678, y: 283 },
  { x: 290, y: 295 },
  { x: 292, y: 488 },
  { x: 678, y: 497 },
  { x: 684, y: 685 },
  { x: 3, y: 692 }
]
