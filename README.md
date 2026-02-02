# PSOH Offline - Tanda Pokok

Aplikasi desktop untuk perekodan data penandaan pokok secara luar talian (offline).

## Keperluan Sistem

- Node.js 18+
- pnpm 8.15+

## Pemasangan

```bash
# Install pnpm (jika belum dipasang)
npm install -g pnpm

# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Build for production
pnpm run build

# Build for specific platform
pnpm run build:win   # Windows
pnpm run build:mac   # macOS
pnpm run build:linux # Linux
```

## Ciri-ciri

- **Mod Luar Talian**: Rekod data di kawasan hutan tanpa liputan internet
- **Sinkronisasi Automatik**: Data dihantar secara automatik apabila sambungan internet tersedia
- **Storan Selamat**: Token API disimpan dengan enkripsi peringkat OS
- **Antara Muka Familiar**: Reka bentuk sama dengan aplikasi web PSOH
- **Mesra Skrin Sentuh**: UI dioptimumkan untuk penggunaan tablet di lapangan
- **Pemulihan Data**: Auto-save draf dan backup automatik untuk mengelakkan kehilangan data

## Ciri Keselamatan Data

### Pencegahan Kehilangan Data
- **WAL Mode**: SQLite menggunakan Write-Ahead Logging untuk ketahanan data
- **Auto-Checkpoint**: Data ditulis ke pangkalan data utama setiap 5 minit
- **Auto-Save Draf**: Borang disimpan secara automatik setiap 10 saat
- **Backup Automatik**: Pangkalan data disandarkan semasa penutupan aplikasi
- **Retry Sync**: Rekod yang gagal disinkronkan akan dicuba semula

### Storan Data
- Pangkalan data disimpan di: `%APPDATA%/psoh-offline/database/` (Windows) atau `~/Library/Application Support/psoh-offline/database/` (macOS)
- Backup disimpan di: `%APPDATA%/psoh-offline/backups/`

## Antara Muka Mesra Sentuh

- Sasaran sentuh minimum 48x48 piksel
- Butang dan kawalan diperbesar untuk jari
- Jarak yang lebih luas antara elemen
- Maklum balas visual semasa sentuhan
- Tiada zum automatik pada input (iOS)

## Konfigurasi

1. Dapatkan Token API dari Pentadbir Sistem (Utiliti > Token API Offline)
2. Buka aplikasi dan pergi ke Tetapan
3. Masukkan URL pelayan dan Token API
4. Klik "Uji Sambungan" untuk mengesahkan
5. Simpan tetapan

## Pembangunan

Struktur projek:

```
src/
├── main/           # Electron main process
│   ├── services/   # Database, Network, Sync services
│   └── ipc/        # IPC handlers
├── preload/        # Context bridge
└── renderer/       # Vue.js frontend
    ├── components/ # UI components
    ├── views/      # Page views
    ├── stores/     # Pinia stores
    └── assets/     # CSS, images
```

## Lesen

Hakcipta © JPSM. Hak cipta terpelihara.
