========================================
TRACEN BOT ARCHITECTURE
========================================

Project ini menggunakan sistem modular.

Seluruh fitur memiliki tanggung jawab masing-masing.

Sebelum mengubah source code, pahami hubungan antar file.

========================================
CORE
========================================

index.js
↓
Menjalankan Bot

naze.js
↓
Main Message Handler

settings.js
↓
Konfigurasi Bot

database/
↓
Penyimpanan Data

========================================
UMA SYSTEM
========================================

musume/

Berisi seluruh sistem Uma Musume.

Contoh:

• Race
• Economy
• Profile
• Shop
• AI 

========================================
SHOP SYSTEM
========================================

shop/

banner.js
↓
Main Gacha Engine

helper.js
↓
Shared Utility

character.js
↓
Character Pool

characterHelper.js
↓
Character Database

limited.js
↓
Limited Banner Manager

exchange.js
↓
Exchange Manager

========================================
RULE
========================================

Satu sistem hanya memiliki satu engine.

Gunakan helper yang sudah ada.

Gunakan database yang sudah ada.

Gunakan dokumentasi pada setiap file.

Jangan membuat duplicate helper.

Jangan membuat duplicate engine.

Jangan membuat duplicate database.

========================================
DEVELOPMENT
========================================

Project ini dirancang agar terus berkembang.

Jika suatu file belum lengkap,

lengkapi implementasinya.

Jangan membuat struktur baru tanpa alasan yang jelas.

Selalu pertahankan kompatibilitas dengan project yang sudah ada.