# Laporan White Box Testing
## Portal Berita PBD

**Tanggal**: Januari 2026
**Testing Framework**: Vitest 4.0.16
**Coverage Tool**: V8 Coverage

---

## 1. Pendahuluan

### 1.1 Definisi White Box Testing

White Box Testing (juga dikenal sebagai Clear Box Testing, Glass Box Testing, atau Structural Testing) adalah metode pengujian perangkat lunak yang menguji struktur internal, desain, dan implementasi kode. Berbeda dengan Black Box Testing yang hanya menguji fungsionalitas tanpa melihat kode, White Box Testing memerlukan pengetahuan tentang struktur internal program.

### 1.2 Karakteristik White Box Testing

| Aspek | Deskripsi |
|-------|-----------|
| **Fokus** | Struktur internal kode |
| **Pengetahuan** | Memerlukan akses ke source code |
| **Tujuan** | Memverifikasi jalur eksekusi, kondisi, dan loop |
| **Level** | Unit testing, integration testing |

### 1.3 Tujuan Pengujian

1. Memastikan semua jalur kode (code paths) dieksekusi minimal sekali
2. Menguji semua kondisi logika (true/false branches)
3. Memvalidasi boundary conditions dan edge cases
4. Menemukan dead code dan unreachable statements
5. Memverifikasi penanganan error dan exception

### 1.4 Tools yang Digunakan

| Tool | Versi | Fungsi |
|------|-------|--------|
| **Vitest** | 4.0.16 | Test runner dan assertion library |
| **V8 Coverage** | Built-in | Code coverage measurement |
| **SvelteKit** | 2.43.2 | Framework yang diuji |
| **TypeScript** | 5.9.2 | Bahasa pemrograman |

---

## 2. Coverage Report

### 2.1 Summary Coverage

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CODE COVERAGE SUMMARY                           │
├─────────────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Metric          │ Coverage │ Covered  │ Total    │ Status          │
├─────────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Statements      │  45.07%  │   ---    │   ---    │ ⚠️ Partial      │
│ Branches        │  57.29%  │   ---    │   ---    │ ⚠️ Partial      │
│ Functions       │  53.33%  │   ---    │   ---    │ ⚠️ Partial      │
│ Lines           │  45.10%  │   ---    │   ---    │ ⚠️ Partial      │
└─────────────────┴──────────┴──────────┴──────────┴─────────────────┘
```

### 2.2 Coverage per File

| File | Statements | Branches | Functions | Lines | Status |
|------|------------|----------|-----------|-------|--------|
| **toastStore.ts** | 100% | 100% | 100% | 100% | ✅ Complete |
| **slug.ts** | 100% | 100% | 100% | 100% | ✅ Complete |
| **validation.ts** | 100% | 100% | 100% | 100% | ✅ Complete |
| **auth.ts** | 20% | 20% | 20% | 20% | ⚠️ Partial |
| **image-utils.ts** | 21.05% | 20% | 28.57% | 21.05% | ⚠️ Partial |

### 2.3 Analisis Coverage

#### Files dengan 100% Coverage

Tiga file mencapai coverage sempurna karena semua fungsi yang diekspor dapat diuji secara isolated (pure functions):

1. **toastStore.ts** - Svelte store untuk toast notifications
2. **slug.ts** - Fungsi untuk menghasilkan URL slug dari judul
3. **validation.ts** - Fungsi validasi form (email, username, password, dll)

#### Files dengan Partial Coverage

Dua file memiliki coverage rendah karena mengandung fungsi yang memerlukan:
- **auth.ts** (20%) - Fungsi database (createSession, createUser, dll) memerlukan database connection
- **image-utils.ts** (21.05%) - Fungsi file processing (processImage, resizeImage) memerlukan actual file I/O

### 2.4 Uncovered Lines

| File | Uncovered Lines | Alasan |
|------|-----------------|--------|
| auth.ts | 20-27, 45-187 | Database operations (createSession, validateSessionToken, createUser, getUserBy*) |
| image-utils.ts | 24-28, 66-175 | File I/O operations (ensureUploadDir, processImage, resizeImage, uploadAndOptimizeImage) |

---

## 3. Teknik White Box Testing yang Digunakan

### 3.1 Statement Coverage Testing

**Definisi**: Memastikan setiap statement (baris kode) dieksekusi minimal sekali.

**Implementasi dalam proyek**:

```typescript
// Contoh: validation.ts - validateEmail()
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {           // Statement 1
    return { valid: false, error: '...' };       // Statement 2
  }
  if (!EMAIL_REGEX.test(email)) {                // Statement 3
    return { valid: false, error: '...' };       // Statement 4
  }
  return { valid: true };                        // Statement 5
}
```

**Test cases untuk statement coverage**:
```typescript
it('should accept valid email')        // Covers: 1, 3, 5
it('should reject empty email')        // Covers: 1, 2
it('should reject invalid format')     // Covers: 1, 3, 4
```

### 3.2 Branch Coverage Testing

**Definisi**: Memastikan setiap branch (cabang kondisional) dieksekusi untuk nilai true dan false.

**Implementasi dalam proyek**:

```typescript
// Contoh: slug.ts - generateSlug()
export function generateSlug(title: string): string {
  return title
    .toLowerCase()                    // Branch: always executed
    .trim()                          // Branch: always executed
    .replace(/[^\w\s-]/g, '')        // Branch: match/no-match
    .replace(/[\s_-]+/g, '-')        // Branch: match/no-match
    .replace(/^-+|-+$/g, '');        // Branch: match/no-match
}
```

**Test cases untuk branch coverage**:
```typescript
// True branch: ada karakter yang di-replace
it('should replace spaces with hyphens')     // regex matches
it('should remove special characters')        // regex matches

// False branch: tidak ada karakter yang di-replace
it('should handle single word')              // minimal replacement
it('should handle already clean slug')       // no replacement needed
```

### 3.3 Boundary Value Analysis (BVA)

**Definisi**: Menguji nilai pada batas-batas domain input (minimum, maximum, just below, just above).

**Implementasi dalam proyek**:

| Validator | Min | Max | Boundary Tests |
|-----------|-----|-----|----------------|
| Username | 3 | 20 | 2 (fail), 3 (pass), 20 (pass), 21 (fail) |
| Password | 6 | - | 5 (fail), 6 (pass) |
| Article Title | 5 | - | 4 (fail), 5 (pass) |
| Article Content | 50 | - | 49 (fail), 50 (pass) |
| File Size | 0 | 5MB | 5MB (pass), 5MB+1 (fail) |

**Contoh test cases**:
```typescript
// validation.test.ts
it('should accept exactly 3 characters (minimum)')      // boundary: min
it('should reject 2 characters (below minimum)')        // boundary: min-1
it('should accept exactly 20 characters (maximum)')     // boundary: max
it('should reject 21 characters (above maximum)')       // boundary: max+1

// image-utils.test.ts
it('should accept exactly MAX_FILE_SIZE (5MB)')         // boundary: max
it('should reject MAX_FILE_SIZE + 1 byte')              // boundary: max+1
```

### 3.4 Equivalence Partitioning

**Definisi**: Membagi domain input menjadi kelas-kelas ekuivalen dimana semua nilai dalam satu kelas diperlakukan sama.

**Implementasi dalam proyek**:

| Input Domain | Valid Partition | Invalid Partitions |
|--------------|-----------------|-------------------|
| Email | user@domain.com | (kosong), (tanpa @), (tanpa domain) |
| MIME Type | image/jpeg, image/png, image/webp, image/gif | image/bmp, video/mp4, text/plain |
| Toast Type | success, error, warning, info | (other values) |
| Category | Olahraga, Budaya, Teknologi, Kesehatan, Bencana, Lainnya | Random, Invalid |

**Contoh test cases**:
```typescript
// Valid partition
it('should accept image/jpeg')
it('should accept image/png')
it('should accept image/webp')

// Invalid partition
it('should reject image/bmp')
it('should reject video/mp4')
it('should reject application/pdf')
```

### 3.5 Path Testing

**Definisi**: Menguji semua jalur eksekusi yang mungkin melalui kode.

**Contoh Path Analysis - validateImageFile()**:

```
                    START
                      │
                      ▼
              ┌───────────────┐
              │ Check Size    │
              └───────┬───────┘
                      │
            ┌─────────┴─────────┐
            │                   │
        size > 5MB          size ≤ 5MB
            │                   │
            ▼                   ▼
      Return Error      ┌───────────────┐
      (Path 1)          │ Check MIME    │
                        └───────┬───────┘
                                │
                      ┌─────────┴─────────┐
                      │                   │
                 Invalid MIME        Valid MIME
                      │                   │
                      ▼                   ▼
                Return Error        Return Valid
                (Path 2)            (Path 3)
```

**Test cases untuk setiap path**:
```typescript
it('should reject file over 5MB')           // Path 1
it('should reject invalid MIME type')        // Path 2
it('should accept valid file')               // Path 3
```

---

## 4. Test Cases per Module

### 4.1 auth.ts (58 Test Cases)

**File**: `src/lib/server/auth.ts`
**Test File**: `src/lib/server/auth.test.ts`

#### Fungsi yang Diuji

| Fungsi | Jumlah Tests | Coverage |
|--------|--------------|----------|
| generateSessionToken() | 8 | 100% |
| hashPassword() | 25 | 100% |
| verifyPassword() | 25 | 100% |

#### Kategori Test Cases

| Kategori | Jumlah | Contoh Test Case |
|----------|--------|------------------|
| **Happy Path** | 12 | should generate a base64url encoded token |
| **Edge Cases** | 18 | should handle emoji passwords |
| **Boundary** | 8 | should handle very long passwords (10,000 characters) |
| **Security** | 10 | should have astronomically low collision probability |
| **Robustness** | 10 | should handle concurrent verifications |

#### Detail Test Cases

**generateSessionToken() - 8 tests**
```
✓ should generate a base64url encoded token
✓ should have correct length of 24 characters
✓ should generate unique tokens on each call
✓ should generate tokens with consistent format across multiple calls
✓ should never generate tokens with invalid base64url characters
✓ should generate cryptographically random tokens (statistical test)
✓ should be safe to use in URLs without encoding
✓ should have astronomically low collision probability
```

**hashPassword() - 25 tests**
```
Happy Path:
✓ should return a hash in format "salt:hash"
✓ should generate different hashes for the same password due to random salt
✓ should generate consistent hash length regardless of password length

Edge Cases - Empty and Whitespace:
✓ should handle empty password
✓ should handle password with only spaces
✓ should handle password with tabs and newlines
✓ should distinguish between different whitespace passwords

Edge Cases - Long Passwords:
✓ should handle very long passwords (10,000 characters)
✓ should handle extremely long passwords (100,000 characters)
✓ should correctly verify very long passwords

Edge Cases - Special Characters:
✓ should handle ASCII special characters
✓ should handle unicode characters
✓ should handle emoji passwords
✓ should handle null bytes in password
✓ should handle combining unicode characters
✓ should handle RTL characters (Arabic/Hebrew)

Hash Format Verification:
✓ should always use lowercase hex characters
✓ should have exactly one colon separator
✓ should have salt of exactly 32 hex characters
✓ should have hash of exactly 64 hex characters (SHA-256)

Security Properties:
✓ should produce different salts for each hash
✓ should not leak password in hash output
```

**verifyPassword() - 25 tests**
```
Happy Path:
✓ should return true for correct password
✓ should return false for incorrect password
✓ should work correctly multiple times with same hash

Malformed Hash Handling:
✓ should return false for hash without colon
✓ should return false for empty hash
✓ should return false for hash with empty salt
✓ should return false for hash with empty hash part
✓ should return false for hash with multiple colons
✓ should return false for hash with non-hex salt
✓ should return false for hash with wrong salt length
✓ should return false for hash with wrong hash length
✓ should handle only colon as hash
✓ should handle whitespace-only hash

Edge Cases - Empty and Whitespace Passwords:
✓ should handle empty password correctly
✓ should distinguish empty from whitespace password
✓ should be sensitive to trailing/leading whitespace

Case Sensitivity:
✓ should be case-sensitive for passwords
✓ should distinguish similar looking characters

Special Characters Handling:
✓ should handle ASCII special characters
✓ should handle unicode passwords
✓ should handle null bytes correctly
✓ should handle backslash characters
✓ should handle quote characters

Boundary Conditions:
✓ should verify single character password
✓ should verify very long password (10,000 chars)
✓ should correctly reject password that differs by one character

Robustness Tests:
✓ should handle rapid sequential verifications
✓ should handle concurrent verifications with different passwords
```

---

### 4.2 slug.ts (89 Test Cases)

**File**: `src/lib/utils/slug.ts`
**Test File**: `src/lib/utils/slug.test.ts`

#### Fungsi yang Diuji

| Fungsi | Jumlah Tests | Coverage |
|--------|--------------|----------|
| generateSlug() | 89 | 100% |

#### Kategori Test Cases

| Kategori | Jumlah | Contoh Test Case |
|----------|--------|------------------|
| **Happy Path** | 8 | should convert title to lowercase |
| **Whitespace** | 10 | should handle multiple consecutive spaces |
| **Special Characters** | 15 | should replace underscores with hyphens |
| **Unicode/International** | 11 | should handle Chinese characters |
| **Emoji** | 8 | should handle emoji in text |
| **Boundary** | 12 | should handle very long string (10,000 characters) |
| **Real-world** | 10 | should handle news headline with date |
| **HTML/Code** | 7 | should handle HTML tags |
| **Idempotency** | 4 | should be idempotent |

#### Detail Test Cases

**Happy Path - Basic Transformations (8 tests)**
```
✓ should convert title to lowercase
✓ should replace spaces with hyphens
✓ should remove special characters
✓ should handle Indonesian text
✓ should preserve numbers
✓ should handle single word
✓ should handle numbers at start
✓ should handle hyphens in input
```

**Edge Cases - Whitespace (10 tests)**
```
✓ should handle multiple consecutive spaces
✓ should trim leading and trailing whitespace
✓ should handle only whitespace
✓ should handle tab characters
✓ should handle newline characters
✓ should handle carriage return
✓ should handle mixed whitespace types
✓ should handle non-breaking space (\u00A0)
✓ should handle zero-width space (\u200B)
```

**Edge Cases - Special Characters (15 tests)**
```
✓ should replace underscores with hyphens
✓ should remove leading hyphens
✓ should remove trailing hyphens
✓ should handle mixed special characters and spaces
✓ should handle string with only special characters
✓ should handle ampersand
✓ should handle plus sign
✓ should handle at symbol
✓ should handle dollar sign
✓ should handle percent sign
✓ should handle parentheses
✓ should handle brackets
✓ should handle curly braces
✓ should handle quotes
✓ should handle apostrophe
✓ should handle colon and semicolon
✓ should handle forward slash
✓ should handle backslash
✓ should handle pipe character
```

**Edge Cases - Unicode and International (11 tests)**
```
✓ should handle accented Latin characters
✓ should handle German umlauts
✓ should handle Spanish characters
✓ should handle Chinese characters
✓ should handle Japanese characters
✓ should handle Korean characters
✓ should handle Arabic characters
✓ should handle Russian Cyrillic
✓ should handle Greek characters
✓ should handle Hebrew characters
✓ should handle Thai characters
✓ should handle mixed ASCII and Unicode
```

**Edge Cases - Emoji (8 tests)**
```
✓ should handle single emoji
✓ should handle emoji in text
✓ should handle multiple emojis
✓ should handle emoji at start
✓ should handle emoji at end
✓ should handle complex emoji (skin tones)
✓ should handle emoji sequences (flags)
✓ should handle only emojis
```

**Boundary Conditions (12 tests)**
```
✓ should handle empty string
✓ should handle single character - letter
✓ should handle single character - number
✓ should handle single character - special
✓ should handle single character - space
✓ should handle two characters
✓ should handle long string (1,000 characters)
✓ should handle very long string (10,000 characters)
✓ should handle extremely long string (100,000 characters)
✓ should handle string with only numbers
✓ should handle string with only hyphens
✓ should handle string with only underscores
```

**Real-world Examples (10 tests)**
```
✓ should handle news headline with date
✓ should handle title with abbreviations
✓ should handle title with numbers and units
✓ should handle question titles
✓ should handle title with quotes
✓ should handle Indonesian news title
✓ should handle sports score
✓ should handle currency in title
✓ should handle percentage in title
✓ should handle hashtags
```

---

### 4.3 validation.ts (176 Test Cases)

**File**: `src/lib/utils/validation.ts`
**Test File**: `src/lib/utils/validation.test.ts`

#### Fungsi yang Diuji

| Fungsi | Jumlah Tests | Coverage |
|--------|--------------|----------|
| validateEmail() | 32 | 100% |
| validateUsername() | 30 | 100% |
| validatePassword() | 26 | 100% |
| validateArticleTitle() | 26 | 100% |
| validateArticleContent() | 26 | 100% |
| validateCategory() | 20 | 100% |
| validatePasswordMatch() | 16 | 100% |

#### Kategori Test Cases

| Kategori | Jumlah | Deskripsi |
|----------|--------|-----------|
| **Happy Path** | 35 | Input valid yang seharusnya diterima |
| **Boundary Values** | 40 | Nilai pada batas min/max |
| **Edge Cases** | 45 | Karakter unicode, whitespace, special chars |
| **Failure Cases** | 40 | Input invalid yang seharusnya ditolak |
| **Error Messages** | 16 | Verifikasi pesan error dalam bahasa Indonesia |

#### Contoh Test Cases per Fungsi

**validateEmail() - 32 tests**
```
Happy Path:
✓ should accept standard email format (user@example.com)
✓ should accept email with subdomain
✓ should accept email with plus tag

Boundary/Edge Cases:
✓ should accept minimal valid email (a@b.co)
✓ should handle email with leading/trailing spaces

Failure Cases:
✓ should reject email without @
✓ should reject email without domain
✓ should reject empty email

Error Messages:
✓ should return "wajib" for empty email
✓ should return "tidak valid" for invalid format
```

**validateUsername() - 30 tests**
```
Happy Path:
✓ should accept alphanumeric username
✓ should accept username with underscores
✓ should accept username with hyphens

Boundary Values:
✓ should accept exactly 3 characters (minimum)
✓ should reject 2 characters (below minimum)
✓ should accept exactly 20 characters (maximum)
✓ should reject 21 characters (above maximum)

Failure Cases:
✓ should reject username with spaces
✓ should reject username with special chars
✓ should reject empty username
```

**validatePassword() - 26 tests**
```
Happy Path:
✓ should accept password of 6+ characters

Boundary Values:
✓ should accept exactly 6 characters (minimum)
✓ should reject 5 characters (below minimum)

Edge Cases:
✓ should accept password with only spaces (6+ chars)
✓ should accept unicode characters in password
✓ should accept emoji in password
```

---

### 4.4 image-utils.ts (106 Test Cases)

**File**: `src/lib/server/image-utils.ts`
**Test File**: `src/lib/server/image-utils.test.ts`

#### Fungsi yang Diuji

| Fungsi | Jumlah Tests | Coverage |
|--------|--------------|----------|
| validateImageFile() | 65 | 100% |
| generateFilename() | 35 | 100% |
| Constants (MAX_FILE_SIZE, etc) | 6 | 100% |

#### Kategori Test Cases

| Kategori | Jumlah | Deskripsi |
|----------|--------|-----------|
| **Constants Verification** | 13 | Memverifikasi nilai konstanta |
| **File Size Validation** | 20 | Boundary testing untuk ukuran file |
| **MIME Type Validation** | 25 | Valid/invalid MIME types |
| **Filename Generation** | 35 | Uniqueness, format, unicode handling |
| **Integration Scenarios** | 13 | Real-world upload scenarios |

#### Detail Test Cases

**Constants Verification (13 tests)**
```
MAX_FILE_SIZE:
✓ should be exactly 5MB in bytes
✓ should equal 5242880 bytes

ALLOWED_MIME_TYPES:
✓ should contain 5 allowed MIME types
✓ should include image/jpeg
✓ should include image/jpg
✓ should include image/png
✓ should include image/webp
✓ should include image/gif
✓ should NOT include image/bmp
✓ should NOT include image/svg+xml
✓ should be readonly array

UPLOAD_DIR:
✓ should be static/uploads
✓ should not start with slash
```

**validateImageFile() - File Size (20 tests)**
```
Happy Path:
✓ should accept file under 5MB
✓ should accept file exactly at 5MB
✓ should accept 1KB file
✓ should accept 1MB file
✓ should accept 2.5MB file

Boundary Conditions:
✓ should accept exactly MAX_FILE_SIZE (5MB)
✓ should reject MAX_FILE_SIZE + 1 byte
✓ should accept MAX_FILE_SIZE - 1 byte
✓ should accept 0 bytes (empty file)
✓ should accept 1 byte file

Edge Cases:
✓ should reject file double the max size
✓ should reject 100MB file
✓ should reject 1GB file
✓ should accept file at 99.99% of max size
```

**validateImageFile() - MIME Types (25 tests)**
```
Valid MIME Types:
✓ should accept image/jpeg
✓ should accept image/jpg
✓ should accept image/png
✓ should accept image/webp
✓ should accept image/gif

Invalid MIME Types:
✓ should reject BMP (image/bmp)
✓ should reject TIFF (image/tiff)
✓ should reject SVG (image/svg+xml)
✓ should reject HEIC (image/heic)
✓ should reject PDF (application/pdf)
✓ should reject MP4 Video (video/mp4)
✓ should reject Text (text/plain)
✓ should reject empty MIME type
✓ should reject uppercase MIME type (case sensitive)
✓ should reject MIME type with leading/trailing space
```

**generateFilename() (35 tests)**
```
Happy Path:
✓ should generate filename with timestamp prefix
✓ should preserve file extension in lowercase
✓ should include random component

Uniqueness:
✓ should generate unique filenames for same input
✓ should generate unique filenames across 100 calls

Unicode Handling:
✓ should handle Chinese characters in filename
✓ should handle emoji in filename
✓ should handle Arabic characters in filename

Format Verification:
✓ should follow pattern: timestamp-randomId.extension
✓ should have consistent random ID length (16 chars)
✓ should produce URL-safe filenames
```

---

### 4.5 toastStore.ts (82 Test Cases)

**File**: `src/lib/components/Toast/toastStore.ts`
**Test File**: `src/lib/components/Toast/toastStore.test.ts`

#### Fungsi yang Diuji

| Fungsi | Jumlah Tests | Coverage |
|--------|--------------|----------|
| toastStore.add() | 28 | 100% |
| toastStore.remove() | 12 | 100% |
| showSuccess() | 5 | 100% |
| showError() | 5 | 100% |
| showWarning() | 4 | 100% |
| showInfo() | 4 | 100% |
| showNotification() | 6 | 100% |
| Store Subscription | 4 | 100% |
| ID Generation | 4 | 100% |
| Stress Tests | 6 | 100% |
| Real-world Scenarios | 5 | 100% |

#### Kategori Test Cases

| Kategori | Jumlah | Deskripsi |
|----------|--------|-----------|
| **Happy Path** | 15 | Operasi normal yang berhasil |
| **Edge Cases - Message** | 12 | Empty, long, unicode messages |
| **Edge Cases - Duration** | 5 | Zero, negative, infinity duration |
| **Store Operations** | 16 | Add, remove, subscribe |
| **Stress Tests** | 6 | Rapid operations, 1000+ toasts |
| **Real-world** | 5 | Indonesian messages, workflows |

#### Detail Test Cases

**toastStore.add() - Happy Path (6 tests)**
```
✓ should add a toast with default type and duration
✓ should add a toast with custom type
✓ should add a toast with custom duration
✓ should return unique IDs for each toast
✓ should add multiple toasts
✓ should preserve toast order (FIFO)
```

**Edge Cases - Message Content (12 tests)**
```
✓ should handle empty message
✓ should handle whitespace-only message
✓ should handle very long message (1000 chars)
✓ should handle very long message (10000 chars)
✓ should handle message with newlines
✓ should handle message with tabs
✓ should handle Unicode characters
✓ should handle emoji in message
✓ should handle special characters
✓ should handle HTML entities
✓ should handle Indonesian special characters
```

**Edge Cases - Duration (5 tests)**
```
✓ should handle zero duration
✓ should handle negative duration
✓ should handle very large duration
✓ should handle float duration
✓ should handle Infinity duration
```

**Stress Tests (6 tests)**
```
✓ should handle rapid add operations (100 toasts)
✓ should handle rapid add/remove operations
✓ should handle add-remove-add cycle
✓ should handle interleaved add and remove
✓ should handle removing all toasts one by one
✓ should handle 1000 toasts
```

---

## 5. Hasil Pengujian

### 5.1 Summary Statistik

```
┌────────────────────────────────────────────────────────────┐
│                    TEST EXECUTION SUMMARY                   │
├────────────────────────────────────────────────────────────┤
│  Total Test Files    : 5                                   │
│  Total Test Cases    : 511                                 │
│  Tests Passed        : 511 (100%)                          │
│  Tests Failed        : 0 (0%)                              │
│  Tests Skipped       : 0 (0%)                              │
│  Execution Time      : ~500ms                              │
├────────────────────────────────────────────────────────────┤
│  Statement Coverage  : 45.07%                              │
│  Branch Coverage     : 57.29%                              │
│  Function Coverage   : 53.33%                              │
│  Line Coverage       : 45.10%                              │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Test Results per File

| Test File | Tests | Passed | Failed | Time |
|-----------|-------|--------|--------|------|
| auth.test.ts | 58 | 58 | 0 | 90ms |
| slug.test.ts | 89 | 89 | 0 | 5ms |
| validation.test.ts | 176 | 176 | 0 | 9ms |
| image-utils.test.ts | 106 | 106 | 0 | 10ms |
| toastStore.test.ts | 82 | 82 | 0 | 21ms |
| **TOTAL** | **511** | **511** | **0** | **~135ms** |

### 5.3 Coverage Analysis

#### High Coverage Files (100%)

| File | Alasan Coverage Tinggi |
|------|------------------------|
| toastStore.ts | Pure functions, no external dependencies |
| slug.ts | Single pure function, easily testable |
| validation.ts | All functions are pure validators |

#### Lower Coverage Files

| File | Coverage | Alasan Coverage Rendah |
|------|----------|------------------------|
| auth.ts | 20% | Contains database operations that require mocking DB connection |
| image-utils.ts | 21.05% | Contains file I/O operations (fs, sharp library) |

---

## 6. Kesimpulan

### 6.1 Ringkasan Pengujian

Pengujian white box testing pada Portal Berita PBD telah dilakukan dengan hasil:

1. **511 test cases** berhasil dijalankan dengan **100% pass rate**
2. **3 dari 5 file** mencapai **100% coverage** (toastStore.ts, slug.ts, validation.ts)
3. Semua teknik white box testing utama telah diterapkan:
   - Statement Coverage
   - Branch Coverage
   - Boundary Value Analysis
   - Equivalence Partitioning
   - Path Testing

### 6.2 Kelebihan Pengujian

| Aspek | Deskripsi |
|-------|-----------|
| **Comprehensive** | Mencakup happy path, edge cases, boundary values, dan failure cases |
| **Documented** | Setiap test memiliki deskripsi yang jelas |
| **Localized** | Pesan error diverifikasi dalam bahasa Indonesia |
| **Stress Tested** | Pengujian dengan 1000+ operasi untuk robustness |

### 6.3 Rekomendasi Peningkatan

1. **Meningkatkan coverage auth.ts** dengan mocking database
2. **Meningkatkan coverage image-utils.ts** dengan mocking file system dan sharp library
3. **Menambahkan integration tests** untuk alur end-to-end

### 6.4 Referensi

- Vitest Documentation: https://vitest.dev/
- V8 Coverage: https://v8.dev/blog/javascript-code-coverage
- White Box Testing Techniques: IEEE Standard 829

---

*Dokumen ini dibuat sebagai bagian dari tugas mata kuliah Rekayasa Perangkat Lunak*
