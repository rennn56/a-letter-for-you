/**
 * A Letter For You — main.js
 * Tahap 1-3: Animasi amplop & interaksi dasar
 * Tahap 4: Animasi surat terbuka, stagger reveal isi teks, partikel hati, dan respons
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   KONFIGURASI WHATSAPP
   PENTING: Ganti nilai placeholder '628XXXXXXXXXX' di bawah
   dengan nomor WhatsApp pembuat website.
   Format:
     - Menggunakan kode negara '62' (Indonesia)
     - Tanpa tanda tambah (+), tanpa spasi, dan tanpa tanda hubung (-)
     - Contoh: '6281234567890'
══════════════════════════════════════════════════════════ */
const WHATSAPP_CONFIG = {
  // Ganti placeholder ini dengan nomor WhatsApp asli pemilik website:
  phoneNumber: '...',

  // Pesan otomatis yang akan disiapkan di kolom chat WhatsApp:
  // Menggunakan Unicode escape sequence (\u{1F497} = 💗, \u{1F97A} = 🥺, \u2764\uFE0F = ❤️)
  // agar 100% aman dan kebal terhadap masalah encoding file/OS saat dibuka di WhatsApp:
  defaultMessage:
    `Hai sayanggg! \u{1F497}\n\n` +
    `Aku sudah membaca surat kamu. Makasih ya sudah mau menyampaikan semuanya dengan tulus.\n\n` +
    `Aku sayang kamu! \u{1F97A}\u2764\uFE0F`
};

/* ── ELEMEN DOM ─────────────────────────────────────────── */
const envelope        = document.getElementById('envelope');
const envelopeSeal    = document.getElementById('envelopeSeal');
const envelopeFlap    = document.getElementById('envelopeFlap');
const letterPreview   = document.getElementById('letterPreview');
const letterHint      = document.getElementById('letterHint');
const btnOpen         = document.getElementById('btnOpen');

/* Overlay surat & isinya */
const letterOverlay   = document.getElementById('letterOverlay');
const letterPaper     = document.getElementById('letterPaper');
const letterParticles = document.getElementById('letterParticles');
const letterDecoTop   = document.querySelector('.letter-deco-top');
const letterGreeting  = document.querySelector('.letter-greeting');
const letterLines     = Array.from(document.querySelectorAll('.letter-line'));
const letterSign      = document.querySelector('.letter-sign');
const letterDecoBottom= document.querySelector('.letter-deco-bottom');
const letterActions   = document.getElementById('letterActions');
const btnForgive      = document.getElementById('btnForgive');
const btnLater        = document.getElementById('btnLater');

/* Layar respons */
const screenForgiven  = document.getElementById('screenForgiven');
const screenLater     = document.getElementById('screenLater');
const btnBackForgiven = document.getElementById('btnBackForgiven');
const btnBackLater    = document.getElementById('btnBackLater');
const btnWhatsapp     = document.getElementById('btnWhatsapp');
const responseBurst   = document.getElementById('responseBurst');

/* ── STATE ──────────────────────────────────────────────── */
// 'idle' | 'opening' | 'opened' | 'letter-open' | 'response'
let envelopeState  = 'idle';
let letterRevealed = false;
let isAnimating    = false;

/* Deteksi reduced motion */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* Durasi animasi amplop (ms) */
const DUR = prefersReducedMotion
  ? { sealFade: 0, flapOpen: 0, letterRise: 0, hint: 0 }
  : { sealFade: 300, flapOpen: 650, letterRise: 700, hint: 400 };

/* ── FUNGSI: TAHAP 3 (AMPLOP) ────────────────────────────── */

/**
 * openEnvelope()
 * Urutan: seal pudar → flap terbuka → surat mengintip naik → hint muncul
 */
function openEnvelope() {
  if (envelopeState !== 'idle') return;
  envelopeState = 'opening';

  disableEnvelopeInteraction();
  envelope.classList.add('is-opening');

  setTimeout(() => {
    envelope.classList.remove('is-opening');
    envelope.classList.add('is-opened');

    setTimeout(() => {
      letterPreview.setAttribute('aria-hidden', 'false');
      letterPreview.setAttribute('tabindex', '0');

      setTimeout(() => {
        letterHint.classList.add('is-visible');
        envelopeState = 'opened';
      }, DUR.letterRise);

    }, DUR.flapOpen);

  }, DUR.sealFade + 50);
}

function disableEnvelopeInteraction() {
  btnOpen.disabled = true;
  btnOpen.style.opacity = '0.5';
  btnOpen.style.cursor  = 'default';
  btnOpen.style.transform = 'none';

  envelope.style.cursor = 'default';
  envelope.removeEventListener('click',   onEnvelopeActivate);
  envelope.removeEventListener('keydown', onEnvelopeKeydown);
}

/* ── FUNGSI: TAHAP 4 (SURAT & STAGGER REVEAL) ────────────── */

/**
 * createLetterParticles()
 * Menghasilkan partikel hati lembut yang melayang pelan saat surat dibuka.
 */
function createLetterParticles() {
  if (letterParticles.children.length > 0) return; // hanya buat sekali

  const symbols = ['♡', '✿', '♡', '✦', '♡', '🌸', '♡'];
  const count = prefersReducedMotion ? 0 : 8;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'letter-particle';
    p.textContent = symbols[i % symbols.length];
    p.style.left = `${10 + Math.random() * 80}%`;
    p.style.fontSize = `${12 + Math.random() * 8}px`;
    p.style.animationDuration = `${10 + Math.random() * 8}s`;
    p.style.animationDelay = `${Math.random() * 4}s`;
    letterParticles.appendChild(p);
  }
}

/**
 * openLetter()
 * Membuka overlay surat dan memulai animasi stagger kalimat demi kalimat.
 */
function openLetter() {
  if (envelopeState !== 'opened' && envelopeState !== 'response') return;
  envelopeState = 'letter-open';

  letterHint.classList.remove('is-visible');

  /* Buka overlay surat */
  letterOverlay.classList.add('is-open');
  letterOverlay.setAttribute('aria-hidden', 'false');
  letterOverlay.focus({ preventScroll: true });

  /* Tampilkan partikel hati */
  createLetterParticles();

  /* Jalankan stagger isi surat jika belum pernah dijalankan */
  if (!letterRevealed) {
    animateLetterContent();
  } else {
    /* Reset scroll posisi ke atas jika dibuka kembali dari respons */
    if (letterPaper) {
      letterPaper.scrollTop = 0;
    }
  }
}

/**
 * animateLetterContent()
 * Memunculkan teks baris per baris secara bertahap (stagger).
 */
function animateLetterContent() {
  if (isAnimating) return;
  isAnimating = true;

  const stepDelay = prefersReducedMotion ? 0 : 450;
  const initialDelay = prefersReducedMotion ? 0 : 250;

  // Urutan elemen yang akan ditampilkan
  const sequence = [
    letterDecoTop,
    letterGreeting,
    ...letterLines,
    letterSign,
    letterDecoBottom,
    letterActions
  ];

  sequence.forEach((elem, index) => {
    if (!elem) return;
    setTimeout(() => {
      elem.classList.add('is-visible');

      // Jika tombol actions sudah tampil
      if (elem === letterActions) {
        letterActions.setAttribute('aria-hidden', 'false');
        isAnimating = false;
        letterRevealed = true;
      }

      // Auto-scroll halus di layar kecil jika konten panjang
      if (!prefersReducedMotion && index > 3 && letterPaper.scrollHeight > letterPaper.clientHeight) {
        letterPaper.scrollTo({
          top: letterPaper.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, initialDelay + (index * stepDelay));
  });
}

/* ── FUNGSI: RESPON TOMBOL ───────────────────────────────── */

/**
 * createResponseBurst()
 * Efek partikel hati kecil memancar saat tombol dimaafkan diklik.
 */
function createResponseBurst() {
  if (!responseBurst || prefersReducedMotion) return;
  responseBurst.innerHTML = '';

  for (let i = 0; i < 12; i++) {
    const heart = document.createElement('span');
    heart.textContent = '💖';
    heart.style.position = 'absolute';
    heart.style.left = '50%';
    heart.style.top = '50%';
    heart.style.fontSize = `${16 + Math.random() * 12}px`;
    heart.style.pointerEvents = 'none';

    const angle = (i / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;

    heart.animate([
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1 },
      { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(1.1)`, opacity: 0 }
    ], {
      duration: 900,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    responseBurst.appendChild(heart);
  }
}

/**
 * showResponse(screenElement)
 * Menampilkan layar respons (A atau B) secara mulus.
 */
function showResponse(screenElement) {
  if (isAnimating) return;
  envelopeState = 'response';

  // Tutup overlay surat
  letterOverlay.classList.remove('is-open');
  letterOverlay.setAttribute('aria-hidden', 'true');

  // Buka layar respons
  screenElement.classList.add('is-open');
  screenElement.setAttribute('aria-hidden', 'false');

  // Fokus ke tombol kembali di layar respons
  const backBtn = screenElement.querySelector('.btn-back');
  if (backBtn) {
    backBtn.focus({ preventScroll: true });
  }
}

function onBtnForgive() {
  createResponseBurst();
  showResponse(screenForgiven);
}

/**
 * openWhatsApp()
 * Membuka WhatsApp dengan URL dan metode navigasi yang disesuaikan:
 * - Mobile / Android: https://wa.me/NOMOR?text=PESAN menggunakan window.location.href
 *   agar browser mobile langsung mendelegasikan URL ke aplikasi native WhatsApp (App Links).
 * - Desktop: https://web.whatsapp.com/send?phone=NOMOR&text=PESAN menggunakan window.open
 *   dengan target _blank dan rel="noopener,noreferrer" menuju WhatsApp Web di tab baru.
 */
function openWhatsApp() {
  const defaultMessage = WHATSAPP_CONFIG.defaultMessage;
  const encodedMessage = encodeURIComponent(defaultMessage);
  const decodedMessage = decodeURIComponent(encodedMessage);

  // Pemeriksaan code points & validasi karakter
  const codePoints = Array.from(defaultMessage).map(char => char.codePointAt(0).toString(16));
  const hasFFFD = defaultMessage.includes('\uFFFD') || decodedMessage.includes('\uFFFD') || codePoints.includes('fffd');

  console.group('🔍 Validasi Pesan & URL WhatsApp');
  console.log('1. defaultMessage:\n', defaultMessage);
  console.log('2. encodedMessage:\n', encodedMessage);
  console.log('3. decodeURIComponent(encodedMessage):\n', decodedMessage);
  console.log('4. Apakah hasil decode sama persis dengan pesan awal:', decodedMessage === defaultMessage);
  console.log('5. Mengandung karakter U+FFFD:', hasFFFD ? '❌ YA (Karakter rusak)' : '✅ TIDAK (Bersih)');
  console.log('6. Code point emoji:', codePoints);
  console.log('   - Emoji hati pertama (1f497):', codePoints.includes('1f497') ? '✅ OK' : '❌ TIDAK DITEMUKAN');
  console.log('   - Emoji wajah (1f97a):', codePoints.includes('1f97a') ? '✅ OK' : '❌ TIDAK DITEMUKAN');
  console.log('   - Emoji hati terakhir (2764 & fe0f):', (codePoints.includes('2764') && codePoints.includes('fe0f')) ? '✅ OK' : '❌ TIDAK DITEMUKAN');
  console.groupEnd();

  const phoneNumber = WHATSAPP_CONFIG.phoneNumber;

  // Deteksi apakah pengguna mengakses dari perangkat mobile atau desktop
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '') ||
    (Boolean(navigator.userAgentData && navigator.userAgentData.mobile));

  if (isMobile) {
    // Mobile / Android: Gunakan navigasi langsung window.location.href
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    console.log('📱 Mengarahkan WhatsApp Mobile (wa.me via window.location.href):', waUrl);
    window.location.href = waUrl;
  } else {
    // Desktop: Gunakan window.open() menuju WhatsApp Web di tab baru
    const waUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    console.log('💻 Mengarahkan WhatsApp Desktop (web.whatsapp.com via window.open):', waUrl);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }
}

function onBtnLater() {
  showResponse(screenLater);
}

function onBackToLetter(screenElement) {
  screenElement.classList.remove('is-open');
  screenElement.setAttribute('aria-hidden', 'true');

  // Buka kembali surat
  openLetter();
}

/* ── EVENT HANDLERS ─────────────────────────────────────── */

function onEnvelopeActivate() {
  openEnvelope();
}

function onEnvelopeKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openEnvelope();
  }
}

function onLetterPreviewActivate(e) {
  if (envelopeState !== 'opened') return;
  openLetter();
}

function onLetterPreviewKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onLetterPreviewActivate(e);
  }
}

/* ── PASANG EVENT LISTENERS ─────────────────────────────── */

/* Amplop */
envelope.addEventListener('click',   onEnvelopeActivate);
envelope.addEventListener('keydown', onEnvelopeKeydown);
btnOpen.addEventListener('click',    openEnvelope);

/* Surat peek */
letterPreview.addEventListener('click',   onLetterPreviewActivate);
letterPreview.addEventListener('keydown', onLetterPreviewKeydown);
letterPreview.addEventListener('touchend', (e) => {
  e.preventDefault();
  onLetterPreviewActivate(e);
}, { passive: false });

/* Tombol Respons */
btnForgive.addEventListener('click', onBtnForgive);
btnLater.addEventListener('click',   onBtnLater);

/* Tombol WhatsApp di Layar Dimaafkan */
if (btnWhatsapp) {
  btnWhatsapp.addEventListener('click', openWhatsApp);
}

/* Tombol Kembali dari respon */
btnBackForgiven.addEventListener('click', () => onBackToLetter(screenForgiven));
btnBackLater.addEventListener('click',    () => onBackToLetter(screenLater));

/* Tutup overlay dengan tombol Escape jika diinginkan */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && envelopeState === 'letter-open') {
    // Opsional: esc bisa menutup overlay jika sudah dibuka
  }
});

/* ── INIT ───────────────────────────────────────────────── */
console.log('💌 A Letter For You — Siap.');
