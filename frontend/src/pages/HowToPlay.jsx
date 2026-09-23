import { useNavigate } from 'react-router-dom';
import { getRoleImage } from '../roleImages';

const PHASES = [
  {
    icon: '🌙',
    title: 'Malam',
    desc: 'Semua pemain "tidur" (chat umum terkunci). Role dengan aksi malam (Werewolf, Seer, Guardian, dst) diam-diam memilih target lewat tombol "Aksi". Tim jahat (Werewolf, Alpha Werewolf, Vampire) punya chat rahasia sendiri yang anonim buat koordinasi target.'
  },
  {
    icon: '☀️',
    title: 'Diskusi',
    desc: 'Hasil malam diumumkan (siapa yang mati). Semua pemain yang masih hidup bebas chat buat saling curiga, bela diri, atau cari petunjuk siapa Werewolf-nya.'
  },
  {
    icon: '🗳️',
    title: 'Voting',
    desc: 'Tiap pemain hidup memilih satu orang yang dicurigai lewat tombol "Vote". Suara King dihitung 2x. Pemain dengan suara terbanyak akan dieliminasi.'
  },
  {
    icon: '⏳',
    title: 'Eliminasi',
    desc: 'Hasil voting diungkap — role pemain yang tereliminasi ditampilkan ke semua orang. Kalau dia Hunter, dia masih sempat menembak satu pemain lain sebelum benar-benar keluar. Siklus balik lagi ke Malam.'
  }
];

const TEAMS = [
  { key: 'werewolf', label: '🐺 Tim Werewolf', color: '#EF4444', desc: 'Menang kalau jumlah Werewolf sama atau lebih banyak dari sisa Villager.' },
  { key: 'vampire', label: '🧛 Tim Vampire', color: '#A855F7', desc: 'Menang kalau berhasil mengubah/menyisakan cukup banyak pemain jadi Vampire.' },
  { key: 'villager', label: '🏘️ Tim Villager', color: '#10B981', desc: 'Menang kalau berhasil menghabisi semua Werewolf (dan ancaman lain) lewat voting.' }
];

const ROLES_INFO = [
  { name: 'Werewolf', team: 'werewolf', desc: 'Setiap malam, pilih satu pemain untuk dibunuh bersama Werewolf lain.' },
  { name: 'Alpha Werewolf', team: 'werewolf', desc: 'Suaranya jadi penentu kalau sesama Werewolf beda pilihan target.' },
  { name: 'Vampire', team: 'vampire', desc: 'Setiap malam gigit satu pemain untuk mengubahnya jadi Vampire juga.' },
  { name: 'Cursed', team: 'villager', desc: 'Terlihat seperti Villager biasa, tapi kalau diserang Werewolf malam ini, berubah jadi Werewolf, bukan mati.' },
  { name: 'Lycan', team: 'villager', desc: 'Sebenarnya Villager, tapi kalau dicek Seer akan terlihat sebagai Werewolf. Biang kebingungan!' },
  { name: 'Strong Villager', team: 'villager', desc: 'Selamat dari 1x serangan Werewolf di malam hari (hanya sekali seumur permainan).' },
  { name: 'Guardian', team: 'villager', desc: 'Setiap malam bisa melindungi satu pemain dari serangan Werewolf.' },
  { name: 'Seer', team: 'villager', desc: 'Setiap malam bisa mengintip identitas (tim) satu pemain.' },
  { name: 'Witch', team: 'villager', desc: 'Punya 1 ramuan penyembuh & 1 ramuan racun, masing-masing cuma bisa dipakai sekali seumur permainan.' },
  { name: 'Hunter', team: 'villager', desc: 'Kalau mati (dibunuh malam atau divoting), masih bisa menembak mati satu pemain lain sebelum tumbang.' },
  { name: 'Cupid', team: 'villager', desc: 'Malam pertama, pilih dua pemain jadi sepasang kekasih. Kalau salah satu mati, pasangannya ikut mati patah hati.' },
  { name: 'King', team: 'villager', desc: 'Suara votingnya dihitung 2x lipat.' },
  { name: 'Troublemaker', team: 'villager', desc: 'Malam pertama, diam-diam bisa menukar role dua pemain lain (dia sendiri tidak tahu hasil tukarannya).' },
  { name: 'Thief', team: 'villager', desc: 'Malam pertama diperlihatkan 2 role cadangan dan boleh menukar role-nya dengan salah satu.' },
  { name: 'Villager', team: 'villager', desc: 'Villager biasa. Cari tahu siapa Werewolf-nya lewat diskusi & voting!' }
];

const TEAM_BADGE_COLOR = { werewolf: '#EF4444', vampire: '#A855F7', villager: '#10B981' };

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '20px', width: 'auto', padding: '8px 14px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <path d="m15 18-6-6 6-6"></path>
        </svg>
        Kembali
      </button>

      <h1 style={{ marginBottom: '8px' }}>📖 Cara Main</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Werewolf MBTI itu game sosial-deduksi: satu tim rahasia berusaha menghabisi Villager diam-diam,
        sisanya berusaha nemuin siapa musuh sebelum kalah jumlah.
      </p>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🔄 Alur Permainan</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {PHASES.map((ph, i) => (
          <div key={ph.title} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{ph.icon}</div>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{i + 1}. {ph.title}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ph.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🏆 Tim & Kemenangan</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {TEAMS.map(t => (
          <div key={t.key} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `3px solid ${t.color}` }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>{t.label}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.desc}</span>
          </div>
        ))}
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '3px solid #F472B6' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>💘 Sepasang Kekasih (Lovers)</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bukan tim tetap — ditentukan Cupid pas malam pertama. Kalau salah satu pasangan mati, yang lain ikut mati patah hati, apapun timnya.</span>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🎭 Daftar Role (15)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ROLES_INFO.map(r => (
          <div key={r.name} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <img src={getRoleImage(r.name)} alt={r.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong>{r.name}</strong>
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: `${TEAM_BADGE_COLOR[r.team]}22`, color: TEAM_BADGE_COLOR[r.team], textTransform: 'capitalize' }}>
                  {r.team}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: '28px' }}>
        Oke, Paham!
      </button>
    </div>
  );
}
