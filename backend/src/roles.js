// Katalog semua role yang didukung backend.
// team: 'werewolf' | 'villager' | 'vampire'  (tim 'lovers' ditentukan runtime lewat Cupid, bukan role tersendiri)
// hasNightAction: apakah role ini submit aksi tiap malam lewat event 'night:action'
// nightOnce: aksi hanya berlaku 1x di malam pertama (Cupid, Troublemaker, Thief)
// appearsAsWerewolf: hasil cek Seer akan menunjukkan 'werewolf' walau role aslinya bukan (Lycan)

export const ROLES = {
  WEREWOLF: {
    name: 'Werewolf',
    team: 'werewolf',
    description: 'Kamu adalah Werewolf. Setiap malam, pilih satu pemain untuk dibunuh bersama Werewolf lain.',
    hasNightAction: true
  },
  ALPHA_WEREWOLF: {
    name: 'Alpha Werewolf',
    team: 'werewolf',
    description: 'Kamu adalah Alpha Werewolf. Suaramu jadi penentu kalau sesama Werewolf beda pilihan target.',
    hasNightAction: true
  },
  VAMPIRE: {
    name: 'Vampire',
    team: 'vampire',
    description: 'Kamu adalah Vampire. Setiap malam gigit satu pemain untuk mengubahnya jadi Vampire juga.',
    hasNightAction: true
  },
  CURSED: {
    name: 'Cursed',
    team: 'villager',
    description: 'Kamu tampak seperti Villager biasa. Tapi kalau Werewolf menyerangmu malam ini, kamu berubah jadi Werewolf, bukan mati.',
    hasNightAction: false
  },
  LYCAN: {
    name: 'Lycan',
    team: 'villager',
    description: 'Kamu sebenarnya di pihak Villager, tapi kalau dicek Seer, kamu akan terlihat sebagai Werewolf. Manfaatkan kebingungan ini!',
    hasNightAction: false,
    appearsAsWerewolf: true
  },
  STRONG_VILLAGER: {
    name: 'Strong Villager',
    team: 'villager',
    description: 'Kamu adalah Villager yang kuat. Kamu akan selamat dari 1x serangan Werewolf di malam hari (hanya sekali).',
    hasNightAction: false
  },
  GUARDIAN: {
    name: 'Guardian',
    team: 'villager',
    description: 'Kamu adalah Guardian. Setiap malam kamu bisa melindungi satu pemain dari serangan Werewolf.',
    hasNightAction: true
  },
  SEER: {
    name: 'Seer',
    team: 'villager',
    description: 'Kamu adalah Seer. Setiap malam kamu bisa mengintip identitas satu pemain.',
    hasNightAction: true
  },
  WITCH: {
    name: 'Witch',
    team: 'villager',
    description: 'Kamu adalah Witch. Kamu punya 1 ramuan penyembuh dan 1 ramuan racun, masing-masing hanya bisa dipakai sekali seumur hidup (permainan).',
    hasNightAction: true
  },
  HUNTER: {
    name: 'Hunter',
    team: 'villager',
    description: 'Kamu adalah Hunter. Kalau kamu mati (dibunuh malam atau divoting), kamu masih bisa menembak mati satu pemain lain sebelum benar-benar tumbang.',
    hasNightAction: false
  },
  CUPID: {
    name: 'Cupid',
    team: 'villager',
    description: 'Kamu adalah Cupid. Malam pertama, pilih dua pemain (boleh salah satunya dirimu sendiri) untuk dijadikan sepasang kekasih. Kalau salah satu mati, yang lain ikut mati patah hati.',
    hasNightAction: true,
    nightOnce: true
  },
  KING: {
    name: 'King',
    team: 'villager',
    description: 'Kamu adalah King. Suara votingmu dihitung 2x lipat.',
    hasNightAction: false
  },
  TROUBLEMAKER: {
    name: 'Troublemaker',
    team: 'villager',
    description: 'Kamu adalah Troublemaker. Malam pertama, kamu bisa menukar role dua pemain lain secara diam-diam (kamu sendiri tidak tahu hasil tukarannya).',
    hasNightAction: true,
    nightOnce: true
  },
  THIEF: {
    name: 'Thief',
    team: 'villager',
    description: 'Kamu adalah Thief. Malam pertama kamu akan diperlihatkan 2 role cadangan dan boleh menukar role-mu dengan salah satunya.',
    hasNightAction: false // aksi dikirim lewat event khusus thief:choice, bukan night:action
  },
  VILLAGER: {
    name: 'Villager',
    team: 'villager',
    description: 'Kamu adalah Villager biasa. Cari tahu siapa Werewolf-nya lewat diskusi & voting!',
    hasNightAction: false
  }
};

// Role acak yang bisa jadi "kartu cadangan" buat Thief kalau dia terpilih.
const THIEF_EXTRA_CARD_POOL = ['WEREWOLF', 'SEER', 'VILLAGER', 'GUARDIAN'];

/**
 * Tentukan role apa saja & berapa jumlahnya berdasarkan jumlah pemain.
 * Role "seru" makin banyak terbuka seiring jumlah pemain makin banyak,
 * biar game kecil (7-9 orang) tetap sederhana dan game besar (20-30 orang) makin variatif.
 */
function getRoleCounts(playerCount) {
  const counts = {};
  let remaining = playerCount;

  // Werewolf: wajib ada, kira-kira 1 per 4 pemain.
  const werewolfCount = Math.max(1, Math.floor(playerCount / 4));
  counts.WEREWOLF = werewolfCount;
  remaining -= werewolfCount;

  // Role opsional, dibuka bertahap sesuai jumlah pemain minimum.
  const unlocks = [
    { role: 'SEER', min: 5 },
    { role: 'GUARDIAN', min: 7 },
    { role: 'WITCH', min: 8 },
    { role: 'HUNTER', min: 9 },
    { role: 'STRONG_VILLAGER', min: 9 },
    { role: 'CUPID', min: 10 },
    { role: 'KING', min: 12 },
    { role: 'CURSED', min: 12 },
    { role: 'TROUBLEMAKER', min: 14 },
    { role: 'LYCAN', min: 14 },
    { role: 'VAMPIRE', min: 16 },
    { role: 'THIEF', min: 16 }
  ];

  for (const { role, min } of unlocks) {
    if (playerCount >= min && remaining > 0) {
      counts[role] = (counts[role] || 0) + 1;
      remaining -= 1;
    }
  }

  // Alpha Werewolf: ganti satu slot Werewolf biasa jadi Alpha (tidak menambah slot baru).
  if (playerCount >= 10 && counts.WEREWOLF >= 1) {
    counts.WEREWOLF -= 1;
    counts.ALPHA_WEREWOLF = 1;
  }

  counts.VILLAGER = Math.max(0, remaining);
  return counts;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {string[]} playerIds
 * @returns {{ assignment: Map<string,string>, extraCards: string[] }}
 *   assignment: playerId -> role key
 *   extraCards: 2 role key cadangan untuk Thief (kosong kalau tidak ada Thief di game ini)
 */
export function assignRoles(playerIds) {
  const counts = getRoleCounts(playerIds.length);

  const pool = [];
  for (const [role, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) pool.push(role);
  }

  const shuffledPlayers = shuffle(playerIds);
  const shuffledRoles = shuffle(pool);

  const assignment = new Map();
  shuffledPlayers.forEach((playerId, i) => {
    assignment.set(playerId, shuffledRoles[i]);
  });

  let extraCards = [];
  if (counts.THIEF) {
    extraCards = shuffle(THIEF_EXTRA_CARD_POOL).slice(0, 2);
  }

  return { assignment, extraCards };
}
