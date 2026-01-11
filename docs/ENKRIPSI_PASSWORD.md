# Dokumentasi Enkripsi Password
## Portal Berita PBD

---

## 1. Metode Enkripsi yang Digunakan

### 1.1 Algoritma: SHA-256 dengan Salt

| Komponen | Nilai |
|----------|-------|
| **Algoritma Hash** | SHA-256 (Secure Hash Algorithm 256-bit) |
| **Library** | `@oslojs/crypto/sha2` |
| **Salt Length** | 16 bytes (128-bit) |
| **Salt Generator** | `node:crypto.randomBytes()` |
| **Output Encoding** | Hexadecimal lowercase |
| **Format Output** | `salt:hash` |

### 1.2 Spesifikasi Output

| Bagian | Panjang | Contoh |
|--------|---------|--------|
| Salt | 32 karakter hex | `a1b2c3d4e5f6789012345678abcdef01` |
| Separator | 1 karakter | `:` |
| Hash | 64 karakter hex | `e3b0c44298fc1c149afbf4c8996fb924...` |
| **Total** | **97 karakter** | `salt:hash` |

---

## 2. Implementasi Kode

### 2.1 Fungsi hashPassword()

```typescript
// File: src/lib/server/auth.ts (Line 30-35)

import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { randomBytes as cryptoRandomBytes } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
    // Step 1: Generate random salt (16 bytes = 128 bits)
    const salt = cryptoRandomBytes(16);

    // Step 2: Convert salt to hex string
    const saltHex = encodeHexLowerCase(salt);

    // Step 3: Concatenate password + salt, then hash with SHA-256
    const hash = await sha256(new TextEncoder().encode(password + saltHex));

    // Step 4: Return format "salt:hash"
    return saltHex + ':' + encodeHexLowerCase(hash);
}
```

### 2.2 Fungsi verifyPassword()

```typescript
// File: src/lib/server/auth.ts (Line 37-42)

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    // Step 1: Split stored hash into salt and hash parts
    const [saltHex, hashHex] = passwordHash.split(':');

    // Step 2: Validate format
    if (!saltHex || !hashHex) return false;

    // Step 3: Recompute hash with same salt
    const hash = await sha256(new TextEncoder().encode(password + saltHex));

    // Step 4: Compare computed hash with stored hash
    return encodeHexLowerCase(hash) === hashHex;
}
```

---

## 3. Alur Proses Hashing

### 3.1 Proses Hashing (Registrasi)

```
Input: "MyPassword123"
            │
            ▼
┌──────────────────────────────────┐
│ 1. Generate Random Salt          │
│    cryptoRandomBytes(16)         │
│    Result: <16 random bytes>     │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 2. Encode Salt to Hex            │
│    encodeHexLowerCase(salt)      │
│    Result: "f7a8b9c0d1e2f3a4..." │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 3. Concatenate Password + Salt   │
│    "MyPassword123" + "f7a8b9..." │
│    Result: "MyPassword123f7a8b9.."│
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 4. Apply SHA-256 Hash            │
│    sha256(concatenated)          │
│    Result: <32 bytes hash>       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 5. Encode Hash to Hex            │
│    encodeHexLowerCase(hash)      │
│    Result: "2c5d8e9f0a1b2c3d..." │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 6. Format Output                 │
│    salt + ":" + hash             │
│    "f7a8b9...:2c5d8e9f..."       │
└──────────────────────────────────┘

Output: "f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2:2c5d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0"
```

### 3.2 Proses Verifikasi (Login)

```
Input: password = "MyPassword123"
       storedHash = "f7a8b9...:2c5d8e9f..."
            │
            ▼
┌──────────────────────────────────┐
│ 1. Split Stored Hash             │
│    storedHash.split(':')         │
│    salt = "f7a8b9..."            │
│    hash = "2c5d8e9f..."          │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 2. Validate Format               │
│    if (!salt || !hash)           │
│       return false               │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 3. Recompute Hash                │
│    sha256(password + salt)       │
│    newHash = "2c5d8e9f..."       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 4. Compare Hashes                │
│    newHash === storedHash?       │
│    "2c5d8e9f..." === "2c5d8e9f.."│
└──────────────┬───────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
     MATCH         NO MATCH
        │             │
        ▼             ▼
   return true   return false
   (Login OK)    (Login Failed)
```

---

## 4. Keamanan

### 4.1 Mengapa Menggunakan Salt?

| Tanpa Salt | Dengan Salt |
|------------|-------------|
| Password sama → Hash sama | Password sama → Hash berbeda |
| Rentan rainbow table attack | Aman dari rainbow table |
| Rentan precomputation attack | Setiap hash unik |

### 4.2 Contoh Perbedaan

```
Password: "password123"

Tanpa Salt:
  User A: sha256("password123") = "ef92b7..."
  User B: sha256("password123") = "ef92b7..."  ← SAMA!

Dengan Salt:
  User A: sha256("password123" + "abc123...") = "7f8e9d..."
  User B: sha256("password123" + "xyz789...") = "2a3b4c..."  ← BERBEDA!
```

### 4.3 Catatan Keamanan

⚠️ **Peringatan**: SHA-256 **bukan algoritma yang optimal** untuk password hashing di production karena:

| Masalah | Penjelasan |
|---------|------------|
| **Terlalu Cepat** | GPU modern dapat menghitung miliaran SHA-256 hash per detik |
| **Rentan Brute Force** | Kecepatan tinggi memungkinkan serangan brute force |
| **Tidak Ada Work Factor** | Tidak bisa disesuaikan tingkat kesulitannya |

### 4.4 Rekomendasi untuk Production

| Algoritma | Keterangan |
|-----------|------------|
| **Argon2id** | Rekomendasi terbaik (OWASP 2023) |
| **bcrypt** | Standar industri, banyak digunakan |
| **scrypt** | Memory-hard, aman untuk password |

---

## 5. File Paling Krusial: `auth.ts`

### 5.1 Mengapa auth.ts Paling Krusial?

File `src/lib/server/auth.ts` adalah file **paling krusial** dalam project ini karena:

| Alasan | Penjelasan |
|--------|------------|
| **Security Core** | Menangani semua aspek keamanan autentikasi |
| **Password Handling** | Menyimpan dan memverifikasi password user |
| **Session Management** | Mengontrol akses user ke sistem |
| **Data Sensitivity** | Vulnerability di sini = kebocoran data user |

### 5.2 Fungsi-fungsi dalam auth.ts

| Fungsi | Kegunaan | Risiko jika Error |
|--------|----------|-------------------|
| `generateSessionToken()` | Generate token sesi | Session hijacking |
| `createSession()` | Buat sesi baru | Unauthorized access |
| `validateSessionToken()` | Validasi token | Bypass authentication |
| `hashPassword()` | Hash password | Password leak |
| `verifyPassword()` | Verifikasi login | Authentication bypass |
| `createUser()` | Registrasi user | Data integrity |
| `invalidateSession()` | Logout | Session persistence |

### 5.3 Statistik Testing auth.ts

```
┌─────────────────────────────────────────┐
│         auth.ts TEST COVERAGE           │
├─────────────────────────────────────────┤
│ Total Test Cases     : 58               │
│ Tests Passed         : 58 (100%)        │
│                                         │
│ Fungsi yang Diuji:                      │
│ ├── generateSessionToken() : 8 tests    │
│ ├── hashPassword()         : 25 tests   │
│ └── verifyPassword()       : 25 tests   │
│                                         │
│ Kategori Test:                          │
│ ├── Happy Path      : 12 tests          │
│ ├── Edge Cases      : 18 tests          │
│ ├── Boundary        : 8 tests           │
│ ├── Security        : 10 tests          │
│ └── Robustness      : 10 tests          │
└─────────────────────────────────────────┘
```

### 5.4 Source Code auth.ts

```typescript
// src/lib/server/auth.ts

import type { RequestEvent } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { randomBytes as cryptoRandomBytes } from 'node:crypto';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

// Generate secure session token (18 random bytes → 24 base64url chars)
export function generateSessionToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = encodeBase64url(bytes);
    return token;
}

// Hash password with random salt
export async function hashPassword(password: string): Promise<string> {
    const salt = cryptoRandomBytes(16);
    const saltHex = encodeHexLowerCase(salt);
    const hash = await sha256(new TextEncoder().encode(password + saltHex));
    return saltHex + ':' + encodeHexLowerCase(hash);
}

// Verify password against stored hash
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    const [saltHex, hashHex] = passwordHash.split(':');
    if (!saltHex || !hashHex) return false;
    const hash = await sha256(new TextEncoder().encode(password + saltHex));
    return encodeHexLowerCase(hash) === hashHex;
}
```

---

## 6. Kesimpulan

| Aspek | Detail |
|-------|--------|
| **Algoritma** | SHA-256 dengan Salt |
| **Salt** | 16 bytes random per password |
| **Output** | 97 karakter (salt:hash) |
| **File Krusial** | `src/lib/server/auth.ts` |
| **Test Coverage** | 58 test cases, 100% pass |

---

*Dokumentasi ini dibuat untuk keperluan akademik mata kuliah Rekayasa Perangkat Lunak*
