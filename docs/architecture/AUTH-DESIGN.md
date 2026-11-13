
# UMS Authentication Architecture

Path: docs/architecture/AUTH-DESIGN.md
Status: Active (Stage 05)
References: AUTHENTICO-API.md, LOCAL-AUTH-STRATEGY.md v3, DEC-002 (superseded), DEC-041, DEC-048, DEC-055, DEC-057, DEC-058
Rules: 15, 20, 25, 32, 39, 41
Author: Petro@ATG
Date: 2026-11-13
Signed off: Shaunpetro (2026-11-13)

---

## 1. Context

Stage 04 closed with the Company Profile modal, `globals.css` palette fix, and workspace-logo feature delivered. The app still authenticates against `MOCK_USERS` in `AuthContext.tsx`.

Stage 05 replaces `MOCK_USERS` with real Autentico-backed authentication across three UMS stages (05a, 05b, 05c) plus a separate Autentico server project (05p).

## 2. Scope split

| Stage | Deliverable | Owner | Ships |
| :--- | :--- | :--- | :--- |
| **05p - Autentico server** | Go IdP at `C:\ums-autentico`, separate repo | Petro | Autentico v0.1.0 |
| **05a - Auth Foundation (UMS)** | Login, RS256 verify, offline-tolerant boot, capability gating | Petro | UMS 0.2.3 |
| **05b - Revocation (UMS)** | Suspension protocol, quarantine uploads, sync_mode in memory | Petro | UMS 0.2.4 |
| **05c - Hardening (UMS)** | Key rotation, monotonic clock, remote wipe, password flows | Petro | backlog |

Rollback granularity is the reason for the split. A bug in 05b must not force reverting 05a.

## 3. Autentico API

The contract is `docs/architecture/AUTHENTICO-API.md`. It is the authority on endpoints, payloads, JWT claims, error codes, data model. This document covers only the UMS client side.

## 4. 05a UMS scope

### 4.1 Backend commands (Rust, `lib.rs`)

Seven commands. All `#[tauri::command] async fn` matching the existing pattern.

**`autentico_login(username, password) -> Result<AuthResponse, String>`**
- `POST {UMS_AUTENTICO_URL}/api/v1/auth/login` with `X-Autentico-API-Version: 1`
- Success: parse response, extract JWT, run `translate_to_user`, verify RS256 signature, `set_credential("autentico_jwt", &jwt)`, store `last_successful_validate_at` (from `server_time`), return `AuthResponse { token, user }`
- Error mapping per `AUTHENTICO-API.md` section 4.1

**`autentico_logout() -> Result<(), String>`**
- `delete_credential("autentico_jwt")`
- Best-effort `POST {url}/api/v1/auth/logout`. Ignore network errors.
- Always returns `Ok(())`

**`autentico_validate() -> Result<ValidateResult, String>`**
- Read `autentico_jwt` from keyring
- `POST {url}/api/v1/auth/validate` with JWT and version header
- Success: cache `server_time` to `last_successful_validate_at` file; return parsed status
- 401: `Err("Session invalid")`
- Network error: `Err("Cannot reach auth server")`

**`autentico_refresh() -> Result<AuthResponse, String>`**
- Read `autentico_jwt` from keyring
- `POST {url}/api/v1/auth/refresh` with JWT and version header
- Success: parse, `translate_to_user`, verify RS256, update keyring, update `last_successful_validate_at`, return `AuthResponse { token, user }`

**`get_cached_jwt() -> Result<Option<String>, String>`**
- Read `autentico_jwt` from keyring. Returns `Ok(None)` if absent.

**`is_jwt_expired(jwt) -> Result<bool, String>`**
- Decode JWT (base64 payload). Check `exp > now`. Returns bool. Does NOT verify signature (that's `verify_jwt`).

**`verify_jwt(jwt) -> Result<JwtClaims, String>`**
- Verify RS256 signature against pinned `autentico-public.pem` embedded in binary
- Verify `aud` claim matches `ums-desktop`
- Verify `iss` claim matches `autentico`
- Return parsed claims or error

Note: `get_cached_jwt`, `is_jwt_expired`, `verify_jwt` are small helpers. Implementation detail.

### 4.2 User shape

Frontend `User` unchanged from Stage 04. `capabilities` computed in Rust, never stored in Autentico.

```ts
interface User {
  id: string;
  name: string;
  role: string;
  org: string;
  orgs: string[];
  dept: string;
  path: string;
  email: string;
  capabilities: string[];
}
```

### 4.3 Role-to-capability mapping (`src-tauri/src/rbac.rs`)

See `rbac.rs` shipped in this stage. Convention: `read:X` / `write:X` matching existing codebase.

`translate_to_user` in `lib.rs`:
```rust
fn translate_to_user(claims: serde_json::Value) -> Result<User, String> {
    let meta = claims.get("user_metadata").ok_or("Missing user_metadata")?;
    let role = meta.get("role").and_then(|v| v.as_str()).ok_or("Missing role")?;
    Ok(User {
        id: claims.get("sub").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        name: meta.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        email: meta.get("email").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        role: role.to_string(),
        org: meta.get("org").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        orgs: meta.get("orgs").and_then(|v| v.as_array())
            .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default(),
        dept: meta.get("dept").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        path: meta.get("path").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        capabilities: crate::rbac::capabilities_for_role(role),
    })
}
```

### 4.4 Frontend `AuthContext.tsx`

Boot sequence follows `LOCAL-AUTH-STRATEGY.md` section 3. Key properties:

- `authState`: `'loading' | 'authenticated' | 'unauthenticated'`
- `login(username, password)`: calls `autentico_login`, sets user
- `logout()`: preserves `stop_sync_for_user`, calls `autentico_logout`, clears state
- Boot: `get_cached_jwt` -> `verify_jwt` -> `is_jwt_expired` -> clock-guard -> authenticated; background `validate`; on any failure, `unauthenticated`
- 6-hour validate interval while authenticated
- No `localStorage` user state (removed from Stage 04; JWT is the source of truth)

Full replacement in this stage.

### 4.5 Frontend `LoginScreen.tsx`

Full replacement. Replaces card-selector with username/password form. Error region. Retry.

### 4.6 `App.tsx`

Minor change: `ProtectedRoute` returns spinner when `authState === 'loading'`, redirects to `/login` when `'unauthenticated'`.

### 4.7 `AppShell.tsx` capability gating

- `canEditCompany`: `admin:profile || admin:finance` (unchanged)
- `canViewCompany`: `canEditCompany || read:profile` (new)
- Company Settings button uses `canViewCompany`
- Devops nav items (none exist today) gated by `read:devops || write:devops`
- Workspace logo feature (Stage 04) preserved

### 4.8 `CompanyProfile.tsx` banking gating

- `canEditBanking` changes from `admin:profile || admin:finance` to just `admin:finance`
- Banking section hidden entirely when `!admin:finance`
- Users with `admin:profile` only (Hector has both so unaffected; any future PM without finance loses banking view) can edit identity/compliance/email but not see banking

Rationale: loophole L9 mitigation (DEC-058).

## 5. Security

- JWT keyring only (DEC-041). RS256 signature verified on every read.
- JWT not logged.
- Password sent only to Autentico over LAN. Never stored client-side.
- CSP null in `tauri.conf.json`. HTTP to LAN works.
- Autentico LAN-only, not exposed to internet (DEC-048).
- Admin CLI requires bootstrap token (DEC-058 L7 mitigation).
- API version header (`X-Autentico-API-Version: 1`) prevents silent drift (DEC-058 L4 mitigation).

## 6. Rollback contracts

| Stage | Pre-tag | Revert |
| :--- | :--- | :--- |
| 05a | `pre-auth-mock-users` (at current HEAD) | `git reset --hard pre-auth-mock-users` restores MOCK_USERS |
| 05b | `post-auth-05a` | `git reset --hard post-auth-05a` |
| 05c | `post-auth-05b` | `git reset --hard post-auth-05b` |

Tags pushed to origin.

## 7. Test gate for 05a

Rule 17 plus auth-specific:

1. `cargo build` succeeds
2. `cargo clippy -- -D warnings` clean
3. `npx tsc --noEmit` clean
4. `npm run build` succeeds
5. No secrets in repo
6. Handover Section 12 SIG-1 through SIG-4
7. Rollback tested
8. `CURRENT.md` updated
9. Backlog updated
10. Login with valid creds against live Autentico succeeds
11. Login with invalid creds fails, no JWT written
12. Keyring shows `autentico_jwt` after login
13. Restart auto-restores (RS256 verify + local exp pass)
14. Forged JWT (payload edited) rejected by RS256 verify
15. Expired JWT (exp < now) forces login
16. Clock-guard: `last_successful_validate_at` > 30 days old forces login
17. Autentico offline + valid cached JWT -> user works
18. Autentico offline + expired JWT -> user must log in (fails gracefully)
19. `MOCK_USERS` symbol absent from `AuthContext.tsx` (grep)
20. Capability audit per role (spot check Shadrack, Edward, Angela)
21. Edward cannot see banking in Company Profile
22. Angela cannot edit identity but can edit banking
23. Hector can edit both
24. Edward sees no devops nav (when devops pages exist)

## 8. Sign-off

Signed: Shaunpetro     Date: 2026-11-13
```

---

# Autentico Go skeleton: `C:\ums-autentico`

Nine files. Paste each into a file at the indicated path.

### File: `C:\ums-autentico\go.mod`

```go
module autentico

go 1.22

require (
    github.com/golang-jwt/jwt/v5 v5.2.1
    github.com/google/uuid v1.6.0
    github.com/joho/godotenv v1.5.1
    golang.org/x/crypto v0.27.0
    modernc.org/sqlite v1.33.0
)
```

### File: `C:\ums-autentico\main.go`

```go
// Path: ums-autentico/main.go
// Purpose: Autentico entry point. CLI routing for serve, seed, hash-password, user subcommands.

package main

import (
    "fmt"
    "os"

    "autentico/internal/cmd"
    "autentico/internal/config"
    "autentico/internal/db"

    "github.com/joho/godotenv"
)

func usage() {
    fmt.Fprintln(os.Stderr, `Usage: autentico <command> [options]

Commands:
  serve              Start HTTP server
  seed <file>        Seed users from JSON (requires --bootstrap-token)
  hash-password      Hash a password (interactive)
  user <action>      Manage users: suspend, revoke, reactivate
`)
}

func main() {
    _ = godotenv.Load()

    if len(os.Args) < 2 {
        usage()
        os.Exit(1)
    }

    cfg, err := config.Load()
    if err != nil {
        fmt.Fprintf(os.Stderr, "config error: %v\n", err)
        os.Exit(1)
    }

    database, err := db.Open(cfg.DBPath)
    if err != nil {
        fmt.Fprintf(os.Stderr, "db error: %v\n", err)
        os.Exit(1)
    }
    defer database.Close()

    switch os.Args[1] {
    case "serve":
        if err := cmd.Serve(cfg, database); err != nil {
            fmt.Fprintf(os.Stderr, "serve error: %v\n", err)
            os.Exit(1)
        }
    case "seed":
        if err := cmd.Seed(cfg, database, os.Args[2:]); err != nil {
            fmt.Fprintf(os.Stderr, "seed error: %v\n", err)
            os.Exit(1)
        }
    case "hash-password":
        if err := cmd.HashPassword(); err != nil {
            fmt.Fprintf(os.Stderr, "hash-password error: %v\n", err)
            os.Exit(1)
        }
    case "user":
        if err := cmd.User(cfg, database, os.Args[2:]); err != nil {
            fmt.Fprintf(os.Stderr, "user error: %v\n", err)
            os.Exit(1)
        }
    default:
        usage()
        os.Exit(1)
    }
}
```

### File: `C:\ums-autentico\internal\config\config.go`

```go
// Path: ums-autentico/internal/config/config.go
// Purpose: Environment configuration loading and validation.

package config

import (
    "errors"
    "os"
    "path/filepath"
)

type Config struct {
    ListenAddr       string
    DBPath           string
    KeysDir          string
    AdminToken       string
    BootstrapToken   string
    APIversion       string
    JwtIssuer        string
    JwtAudience      string
    JwtTTLSeconds    int
}

func Load() (*Config, error) {
    programData := os.Getenv("PROGRAMDATA")
    if programData == "" {
        programData = "C:\\ProgramData"
    }
    defaultBase := filepath.Join(programData, "Autentico")

    cfg := &Config{
        ListenAddr:     getDefault("AUTENTICO_LISTEN_ADDR", ":8080"),
        DBPath:         getDefault("AUTENTICO_DB_PATH", filepath.Join(defaultBase, "autentico.db")),
        KeysDir:        getDefault("AUTENTICO_KEYS_DIR", filepath.Join(defaultBase, "keys")),
        AdminToken:     os.Getenv("AUTENTICO_ADMIN_TOKEN"),
        BootstrapToken: os.Getenv("AUTENTICO_BOOTSTRAP_TOKEN"),
        APIversion:     "1",
        JwtIssuer:      "autentico",
        JwtAudience:    "ums-desktop",
        JwtTTLSeconds:  30 * 24 * 60 * 60,
    }

    if cfg.AdminToken == "" {
        return nil, errors.New("AUTENTICO_ADMIN_TOKEN not set")
    }
    if cfg.BootstrapToken == "" {
        return nil, errors.New("AUTENTICO_BOOTSTRAP_TOKEN not set")
    }
    if len(cfg.AdminToken) < 32 {
        return nil, errors.New("AUTENTICO_ADMIN_TOKEN must be at least 32 chars")
    }
    if len(cfg.BootstrapToken) < 32 {
        return nil, errors.New("AUTENTICO_BOOTSTRAP_TOKEN must be at least 32 chars")
    }

    if err := os.MkdirAll(filepath.Dir(cfg.DBPath), 0o755); err != nil {
        return nil, err
    }
    if err := os.MkdirAll(cfg.KeysDir, 0o755); err != nil {
        return nil, err
    }
    return cfg, nil
}

func getDefault(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}
```

### File: `C:\ums-autentico\internal\db\db.go`

```go
// Path: ums-autentico/internal/db/db.go
// Purpose: SQLite connection, schema migrations, user and revocation queries.

package db

import (
    "database/sql"
    "errors"
    "time"

    "github.com/google/uuid"
    _ "modernc.org/sqlite"
)

type DB struct {
    *sql.DB
}

func Open(path string) (*DB, error) {
    conn, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)")
    if err != nil {
        return nil, err
    }
    db := &DB{conn}
    if err := db.migrate(); err != nil {
        conn.Close()
        return nil, err
    }
    return db, nil
}

func (d *DB) migrate() error {
    schema := `
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        suspended_at TEXT,
        revoked_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        user_metadata TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS revocation_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL,
        actor TEXT
    );

    CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
    `
    _, err := d.Exec(schema)
    return err
}

type User struct {
    ID           string
    Username     string
    PasswordHash string
    Status       string
    SuspendedAt  *string
    RevokedAt    *string
    CreatedAt    string
    UpdatedAt    string
    Metadata     string
}

func (d *DB) CreateUser(username, passwordHash, metadataJSON string) (*User, error) {
    id := uuid.NewString()
    now := time.Now().UTC().Format(time.RFC3339)
    _, err := d.Exec(
        `INSERT INTO users (id, username, password_hash, status, created_at, updated_at, user_metadata)
         VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        id, username, passwordHash, now, now, metadataJSON,
    )
    if err != nil {
        return nil, err
    }
    return d.GetUserByUsername(username)
}

func (d *DB) GetUserByUsername(username string) (*User, error) {
    row := d.QueryRow(
        `SELECT id, username, password_hash, status, suspended_at, revoked_at, created_at, updated_at, user_metadata
         FROM users WHERE username = ?`, username,
    )
    return scanUser(row)
}

func (d *DB) GetUserByID(id string) (*User, error) {
    row := d.QueryRow(
        `SELECT id, username, password_hash, status, suspended_at, revoked_at, created_at, updated_at, user_metadata
         FROM users WHERE id = ?`, id,
    )
    return scanUser(row)
}

func scanUser(row *sql.Row) (*User, error) {
    var u User
    var susp, rev sql.NullString
    err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Status, &susp, &rev, &u.CreatedAt, &u.UpdatedAt, &u.Metadata)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, nil
    }
    if err != nil {
        return nil, err
    }
    if susp.Valid { u.SuspendedAt = &susp.String }
    if rev.Valid { u.RevokedAt = &rev.String }
    return &u, nil
}

func (d *DB) SetSuspended(userID, reason, actor string) error {
    now := time.Now().UTC().Format(time.RFC3339)
    _, err := d.Exec(`UPDATE users SET status='suspended', suspended_at=?, updated_at=? WHERE id=?`, now, now, userID)
    if err != nil { return err }
    return d.logRevocation(userID, "suspend", reason, actor)
}

func (d *DB) SetRevoked(userID, reason, actor string) error {
    now := time.Now().UTC().Format(time.RFC3339)
    _, err := d.Exec(`UPDATE users SET status='revoked', revoked_at=?, updated_at=? WHERE id=?`, now, now, userID)
    if err != nil { return err }
    return d.logRevocation(userID, "revoke", reason, actor)
}

func (d *DB) SetActive(userID, reason, actor string) error {
    now := time.Now().UTC().Format(time.RFC3339)
    _, err := d.Exec(`UPDATE users SET status='active', suspended_at=NULL, revoked_at=NULL, updated_at=? WHERE id=?`, now, userID)
    if err != nil { return err }
    return d.logRevocation(userID, "reactivate", reason, actor)
}

func (d *DB) AutoRevokeExpiredSuspensions() error {
    cutoff := time.Now().UTC().Add(-48 * time.Hour).Format(time.RFC3339)
    _, err := d.Exec(`UPDATE users SET status='revoked', revoked_at=?, updated_at=?
                      WHERE status='suspended' AND suspended_at < ?`,
        time.Now().UTC().Format(time.RFC3339), time.Now().UTC().Format(time.RFC3339), cutoff)
    return err
}

func (d *DB) logRevocation(userID, action, reason, actor string) error {
    _, err := d.Exec(
        `INSERT INTO revocation_log (id, user_id, action, reason, timestamp, actor) VALUES (?, ?, ?, ?, ?, ?)`,
        uuid.NewString(), userID, action, reason, time.Now().UTC().Format(time.RFC3339), actor,
    )
    return err
}

func (d *DB) RevokeToken(jti string, expiresAt int64) error {
    _, err := d.Exec(`INSERT OR REPLACE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)`, jti, expiresAt)
    return err
}

func (d *DB) IsTokenRevoked(jti string) (bool, error) {
    var count int
    err := d.QueryRow(`SELECT COUNT(1) FROM revoked_tokens WHERE jti = ?`, jti).Scan(&count)
    return count > 0, err
}
```

### File: `C:\ums-autentico\internal\auth\auth.go`

```go
// Path: ums-autentico/internal/auth/auth.go
// Purpose: Password hashing (Argon2id), RS256 JWT signing/verification, keypair management.

package auth

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/base64"
    "encoding/pem"
    "errors"
    "fmt"
    "os"
    "path/filepath"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "golang.org/x/crypto/argon2"
)

// --- Argon2id ---

const (
    argonMemory  uint32 = 65536
    argonTime    uint32 = 3
    argonThreads uint8  = 4
    argonKeyLen  uint32 = 32
    saltLen             = 16
)

func HashPassword(password string) (string, error) {
    salt := make([]byte, saltLen)
    if _, err := rand.Read(salt); err != nil { return "", err }
    hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
    return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
        argonMemory, argonTime, argonThreads,
        base64.RawStdEncoding.EncodeToString(salt),
        base64.RawStdEncoding.EncodeToString(hash),
    ), nil
}

func VerifyPassword(encoded, password string) bool {
    var memory, iterations uint32
    var parallelism uint8
    var salt, hash string
    _, err := fmt.Sscanf(encoded, "$argon2id$v=19$m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
    if err != nil {
        // fallback: use proper parsing
        return verifyPasswordPHC(encoded, password)
    }
    return verifyPasswordPHC(encoded, password)
}

func verifyPasswordPHC(encoded, password string) bool {
    parts := splitPHC(encoded)
    if len(parts) != 6 { return false }
    var memory uint32
    var iterations uint32
    var parallelism uint8
    _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
    if err != nil { return false }
    salt, err := base64.RawStdEncoding.DecodeString(parts[4])
    if err != nil { return false }
    expected, err := base64.RawStdEncoding.DecodeString(parts[5])
    if err != nil { return false }
    actual := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(expected)))
    if len(actual) != len(expected) { return false }
    var diff byte
    for i := range actual { diff |= actual[i] ^ expected[i] }
    return diff == 0
}

func splitPHC(s string) []string {
    out := []string{}
    cur := ""
    for _, c := range s {
        if c == '$' { out = append(out, cur); cur = "" } else { cur += string(c) }
    }
    out = append(out, cur)
    return out
}

// --- RS256 JWT ---

type Claims struct {
    UserMetadata map[string]interface{} `json:"user_metadata"`
    jwt.RegisteredClaims
}

type Issuer struct {
    private *rsa.PrivateKey
    issuer  string
    audience string
    ttl     time.Duration
}

func LoadOrCreateKeys(keysDir string) (*Issuer, error) {
    privPath := filepath.Join(keysDir, "private.pem")
    pubPath := filepath.Join(keysDir, "public.pem")

    var priv *rsa.PrivateKey
    if _, err := os.Stat(privPath); errors.Is(err, os.ErrNotExist) {
        key, err := rsa.GenerateKey(rand.Reader, 2048)
        if err != nil { return nil, err }
        priv = key
        if err := writePEM(privPath, "RSA PRIVATE KEY", x509.MarshalPKCS1PrivateKey(priv)); err != nil { return nil, err }
        pubDER, err := x509.MarshalPKIXPublicKey(&priv.PublicKey)
        if err != nil { return nil, err }
        if err := writePEM(pubPath, "PUBLIC KEY", pubDER); err != nil { return nil, err }
    } else {
        data, err := os.ReadFile(privPath)
        if err != nil { return nil, err }
        block, _ := pem.Decode(data)
        if block == nil { return nil, errors.New("invalid private key PEM") }
        key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
        if err != nil { return nil, err }
        priv = key
    }

    return &Issuer{private: priv, issuer: "autentico", audience: "ums-desktop", ttl: 30 * 24 * time.Hour}, nil
}

func (i *Issuer) SetTTL(d time.Duration) { i.ttl = d }

func (i *Issuer) PublicKeyPEM() (string, error) {
    der, err := x509.MarshalPKIXPublicKey(&i.private.PublicKey)
    if err != nil { return "", err }
    return string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der})), nil
}

func (i *Issuer) Sign(userID, userMetadataJSON string) (string, string, error) {
    var meta map[string]interface{}
    if err := jsonUnmarshal([]byte(userMetadataJSON), &meta); err != nil { return "", "", err }
    now := time.Now()
    jti := uuid.NewString()
    claims := Claims{
        UserMetadata: meta,
        RegisteredClaims: jwt.RegisteredClaims{
            Subject: userID,
            ID: jti,
            Issuer: i.issuer,
            Audience: jwt.ClaimStrings{i.audience},
            IssuedAt: jwt.NewNumericDate(now),
            ExpiresAt: jwt.NewNumericDate(now.Add(i.ttl)),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    signed, err := token.SignedString(i.private)
    return signed, jti, err
}

func (i *Issuer) Verify(tokenStr string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        if t.Method.Alg() != "RS256" { return nil, fmt.Errorf("unexpected alg %s", t.Method.Alg()) }
        return &i.private.PublicKey, nil
    })
    if err != nil { return nil, err }
    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid { return nil, errors.New("invalid token") }
    return claims, nil
}

func writePEM(path, typ string, der []byte) error {
    return os.WriteFile(path, pem.EncodeToMemory(&pem.Block{Type: typ, Bytes: der}), 0o600)
}

// jsonUnmarshal is a tiny helper to avoid importing encoding/json across package boundaries.
func jsonUnmarshal(data []byte, v interface{}) error {
    return jsonUnmarshalImpl(data, v)
}
```

### File: `C:\ums-autentico\internal\auth\json.go`

```go
// Path: ums-autentico/internal/auth/json.go
// Purpose: JSON helper wrapper. Kept in separate file so auth.go stays focused.

package auth

import "encoding/json"

func jsonUnmarshalImpl(data []byte, v interface{}) error {
    return json.Unmarshal(data, v)
}
```

### File: `C:\ums-autentico\internal\handlers\handlers.go`

```go
// Path: ums-autentico/internal/handlers/handlers.go
// Purpose: HTTP handlers for login, validate, refresh, logout, public-key.

package handlers

import (
    "encoding/json"
    "net/http"
    "strings"
    "time"

    "autentico/internal/auth"
    "autentico/internal/db"

    "github.com/golang-jwt/jwt/v5"
)

type Handlers struct {
    DB     *db.DB
    Issuer *auth.Issuer
    AdminToken string
}

func (h *Handlers) Register(mux *http.ServeMux) {
    mux.HandleFunc("/api/v1/auth/login", h.withVersion(h.login))
    mux.HandleFunc("/api/v1/auth/validate", h.withVersion(h.validate))
    mux.HandleFunc("/api/v1/auth/refresh", h.withVersion(h.refresh))
    mux.HandleFunc("/api/v1/auth/logout", h.withVersion(h.logout))
    mux.HandleFunc("/api/v1/public-key", h.publicKey)
}

// --- Middleware ---

func (h *Handlers) withVersion(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Header.Get("X-Autentico-API-Version") != "1" {
            writeError(w, http.StatusBadRequest, "unsupported_api_version", "X-Autentico-API-Version must be '1'")
            return
        }
        next(w, r)
    }
}

func (h *Handlers) withBearer(next func(http.ResponseWriter, *http.Request, *auth.Claims)) http.HandlerFunc {
    return h.withVersion(func(w http.ResponseWriter, r *http.Request) {
        authz := r.Header.Get("Authorization")
        if !strings.HasPrefix(authz, "Bearer ") {
            writeError(w, http.StatusUnauthorized, "missing_token", "Bearer token required")
            return
        }
        tokenStr := strings.TrimPrefix(authz, "Bearer ")
        claims, err := h.Issuer.Verify(tokenStr)
        if err != nil {
            writeError(w, http.StatusUnauthorized, "invalid_token", "Token is invalid or expired.")
            return
        }
        next(w, r, claims)
    })
}

// --- Handlers ---

func (h *Handlers) login(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost { http.NotFound(w, r); return }
    var req struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_request", "Malformed JSON.")
        return
    }
    u, err := h.DB.GetUserByUsername(req.Username)
    if err != nil || u == nil {
        writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid username or password.")
        return
    }
    if !auth.VerifyPassword(u.PasswordHash, req.Password) {
        writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid username or password.")
        return
    }
    if u.Status == "suspended" || u.Status == "revoked" {
        suspendedAt := ""
        if u.SuspendedAt != nil { suspendedAt = *u.SuspendedAt }
        writeJSON(w, http.StatusForbidden, map[string]interface{}{
            "error": "account_" + u.Status,
            "message": "This account is " + u.Status + ". Contact your administrator.",
            "status": u.Status,
            "suspended_at": suspendedAt,
        })
        return
    }
    token, _, err := h.Issuer.Sign(u.ID, u.Metadata)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "server_error", err.Error())
        return
    }
    var meta interface{}
    json.Unmarshal([]byte(u.Metadata), &meta)
    writeJSON(w, http.StatusOK, map[string]interface{}{
        "token": token,
        "user": map[string]interface{}{
            "id": u.ID,
            "username": u.Username,
            "status": u.Status,
            "user_metadata": meta,
        },
    })
}

func (h *Handlers) validate(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost { http.NotFound(w, r); return }
    h.withBearer(func(w http.ResponseWriter, r *http.Request, claims *auth.Claims) {
        u, err := h.DB.GetUserByID(claims.Subject)
        if err != nil || u == nil {
            writeError(w, http.StatusUnauthorized, "invalid_token", "User not found.")
            return
        }
        serverTime := time.Now().UTC().Format(time.RFC3339)
        resp := map[string]interface{}{"status": u.Status, "server_time": serverTime}
        if u.Status == "suspended" && u.SuspendedAt != nil { resp["suspended_at"] = *u.SuspendedAt }
        if u.Status == "revoked" && u.RevokedAt != nil { resp["revoked_at"] = *u.RevokedAt }
        writeJSON(w, http.StatusOK, resp)
    })(w, r)
}

func (h *Handlers) refresh(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost { http.NotFound(w, r); return }
    h.withBearer(func(w http.ResponseWriter, r *http.Request, claims *auth.Claims) {
        u, err := h.DB.GetUserByID(claims.Subject)
        if err != nil || u == nil {
            writeError(w, http.StatusUnauthorized, "invalid_token", "User not found.")
            return
        }
        if u.Status != "active" {
            writeJSON(w, http.StatusForbidden, map[string]interface{}{
                "error": "account_" + u.Status,
                "status": u.Status,
            })
            return
        }
        // Revoke old jti
        if claims.ExpiresAt != nil {
            _ = h.DB.RevokeToken(claims.ID, claims.ExpiresAt.Unix())
        }
        token, _, err := h.Issuer.Sign(u.ID, u.Metadata)
        if err != nil {
            writeError(w, http.StatusInternalServerError, "server_error", err.Error())
            return
        }
        var meta interface{}
        json.Unmarshal([]byte(u.Metadata), &meta)
        writeJSON(w, http.StatusOK, map[string]interface{}{
            "token": token,
            "user": map[string]interface{}{
                "id": u.ID,
                "username": u.Username,
                "status": u.Status,
                "user_metadata": meta,
            },
        })
    })(w, r)
}

func (h *Handlers) logout(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost { http.NotFound(w, r); return }
    h.withBearer(func(w http.ResponseWriter, r *http.Request, claims *auth.Claims) {
        if claims.ExpiresAt != nil {
            _ = h.DB.RevokeToken(claims.ID, claims.ExpiresAt.Unix())
        }
        writeJSON(w, http.StatusOK, map[string]interface{}{"status": "logged_out"})
    })(w, r)
}

func (h *Handlers) publicKey(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet { http.NotFound(w, r); return }
    pem, err := h.Issuer.PublicKeyPEM()
    if err != nil {
        writeError(w, http.StatusInternalServerError, "server_error", err.Error())
        return
    }
    w.Header().Set("Content-Type", "application/x-pem-file")
    w.Write([]byte(pem))
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, body interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
    writeJSON(w, status, map[string]string{"error": code, "message": message})
}

// ensure jwt import used (golang-jwt/jwt/v5)
var _ = jwt.NewNumericDate
```

### File: `C:\ums-autentico\internal\cmd\serve.go`

```go
// Path: ums-autentico/internal/cmd/serve.go
// Purpose: HTTP server startup, routing, background tasks.

package cmd

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "autentico/internal/auth"
    "autentico/internal/config"
    "autentico/internal/db"
    "autentico/internal/handlers"
)

func Serve(cfg *config.Config, database *db.DB) error {
    issuer, err := auth.LoadOrCreateKeys(cfg.KeysDir)
    if err != nil { return fmt.Errorf("keypair: %w", err) }
    issuer.SetTTL(time.Duration(cfg.JwtTTLSeconds) * time.Second)

    h := &handlers.Handlers{DB: database, Issuer: issuer, AdminToken: cfg.AdminToken}
    mux := http.NewServeMux()
    h.Register(mux)
    mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("ok"))
    })

    srv := &http.Server{Addr: cfg.ListenAddr, Handler: mux}

    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    // Background: auto-revoke expired suspensions every 5 minutes
    go func() {
        ticker := time.NewTicker(5 * time.Minute)
        defer ticker.Stop()
        for {
            select {
            case <-ctx.Done(): return
            case <-ticker.C:
                if err := database.AutoRevokeExpiredSuspensions(); err != nil {
                    log.Printf("auto-revoke error: %v", err)
                }
            }
        }
    }()

    go func() {
        log.Printf("Autentico listening on %s", cfg.ListenAddr)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("http server error: %v", err)
        }
    }()

    <-ctx.Done()
    log.Println("shutting down...")
    shutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    _ = srv.Shutdown(shutCtx)
    return nil
}

// ensure unused imports do not break build
var _ = os.Exit
```

### File: `C:\ums-autentico\internal\cmd\seed.go`

```go
// Path: ums-autentico/internal/cmd/seed.go
// Purpose: Seed users from JSON. Generates passwords and prints them once.

package cmd

import (
    "crypto/rand"
    "encoding/json"
    "errors"
    "fmt"
    "math/big"
    "os"

    "autentico/internal/auth"
    "autentico/internal/config"
    "autentico/internal/db"
)

type SeedFile struct {
    Users []SeedUser `json:"users"`
}

type SeedUser struct {
    Username     string          `json:"username"`
    Password     string          `json:"password,omitempty"`
    UserMetadata json.RawMessage `json:"user_metadata"`
}

func Seed(cfg *config.Config, database *db.DB, args []string) error {
    var filePath, bootstrapToken string
    for i := 0; i < len(args); i++ {
        switch args[i] {
        case "--bootstrap-token":
            if i+1 < len(args) { bootstrapToken = args[i+1]; i++ }
        default:
            if filePath == "" && args[i][0] != '-' { filePath = args[i] }
        }
    }
    if bootstrapToken != cfg.BootstrapToken {
        return errors.New("invalid --bootstrap-token")
    }
    if filePath == "" {
        return errors.New("usage: autentico seed <file> --bootstrap-token <token>")
    }
    data, err := os.ReadFile(filePath)
    if err != nil { return err }

    var sf SeedFile
    if err := json.Unmarshal(data, &sf); err != nil { return err }

    fmt.Println("Seeding users:")
    for _, u := range sf.Users {
        pass := u.Password
        generated := false
        if pass == "" {
            pass, err = generatePassword(24)
            if err != nil { return err }
            generated = true
        }
        hash, err := auth.HashPassword(pass)
        if err != nil { return err }
        created, err := database.CreateUser(u.Username, hash, string(u.UserMetadata))
        if err != nil {
            fmt.Printf("  [skip] %s: %v\n", u.Username, err)
            continue
        }
        if generated {
            fmt.Printf("  [created] %s  password: %s\n", u.Username, pass)
        } else {
            fmt.Printf("  [created] %s  password: (from file)\n", u.Username)
        }
        _ = created
    }
    fmt.Println("\nStore generated passwords securely. They are NOT stored in the database in plaintext.")
    return nil
}

func generatePassword(length int) (string, error) {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    out := make([]byte, length)
    for i := range out {
        n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
        if err != nil { return "", err }
        out[i] = chars[n.Int64()]
    }
    return string(out), nil
}

func HashPassword() error {
    var pass string
    fmt.Print("Enter password: ")
    if _, err := fmt.Scanln(&pass); err != nil { return err }
    hash, err := auth.HashPassword(pass)
    if err != nil { return err }
    fmt.Println(hash)
    return nil
}
```

### File: `C:\ums-autentico\internal\cmd\user.go`

```go
// Path: ums-autentico/internal/cmd/user.go
// Purpose: User management CLI. suspend, revoke, reactivate.

package cmd

import (
    "errors"
    "flag"
    "fmt"

    "autentico/internal/config"
    "autentico/internal/db"
)

func User(cfg *config.Config, database *db.DB, args []string) error {
    if len(args) < 1 {
        return errors.New("usage: autentico user <suspend|revoke|reactivate|list> [flags]")
    }
    action := args[0]
    fs := flag.NewFlagSet("user "+action, flag.ExitOnError)
    username := fs.String("username", "", "target username")
    reason := fs.String("reason", "", "reason (optional)")
    actor := fs.String("actor", "cli", "who performed the action")
    bootstrap := fs.String("bootstrap-token", "", "required")
    _ = fs.Parse(args[1:])

    if *bootstrap != cfg.BootstrapToken {
        return errors.New("invalid --bootstrap-token")
    }

    if action == "list" {
        rows, err := database.Query(`SELECT username, status FROM users ORDER BY username`)
        if err != nil { return err }
        defer rows.Close()
        fmt.Printf("%-20s %s\n", "USERNAME", "STATUS")
        for rows.Next() {
            var u, s string
            rows.Scan(&u, &s)
            fmt.Printf("%-20s %s\n", u, s)
        }
        return nil
    }

    if *username == "" {
        return errors.New("--username required")
    }
    u, err := database.GetUserByUsername(*username)
    if err != nil { return err }
    if u == nil { return fmt.Errorf("user %s not found", *username) }

    switch action {
    case "suspend":
        return database.SetSuspended(u.ID, *reason, *actor)
    case "revoke":
        return database.SetRevoked(u.ID, *reason, *actor)
    case "reactivate":
        return database.SetActive(u.ID, *reason, *actor)
    default:
        return fmt.Errorf("unknown action: %s", action)
    }
}
```

### File: `C:\ums-autentico\users.json`

```json
{
  "users": [
    {
      "username": "shadrack",
      "user_metadata": {
        "name": "Shadrack",
        "email": "shadrack@vscmining.co.za",
        "role": "super_admin",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Executive",
        "path": "VSC Mining/Executive/Shadrack"
      }
    },
    {
      "username": "petro",
      "user_metadata": {
        "name": "Petro",
        "email": "petro@vscmining.co.za",
        "role": "devops_admin",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "DevOps",
        "path": "VSC Mining/DevOps/Petro"
      }
    },
    {
      "username": "palesa",
      "user_metadata": {
        "name": "Palesa",
        "email": "info@vscmining.co.za",
        "role": "pa",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Executive",
        "path": "VSC Mining/Executive/Palesa"
      }
    },
    {
      "username": "hector",
      "user_metadata": {
        "name": "Hector",
        "email": "bouwerh@vscmining.co.za",
        "role": "pm",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Management",
        "path": "VSC Mining/Management/Hector"
      }
    },
    {
      "username": "edward",
      "user_metadata": {
        "name": "Edward",
        "email": "e.holden-smith@vscmining.co.za",
        "role": "technical_manager",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Management",
        "path": "VSC Mining/Management/Edward"
      }
    },
    {
      "username": "marshall",
      "user_metadata": {
        "name": "Marshall",
        "email": "marshall.makina@vscmining.co.za",
        "role": "finance_manager",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Finance",
        "path": "VSC Mining/Finance/Marshall"
      }
    },
    {
      "username": "angela",
      "user_metadata": {
        "name": "Angela",
        "email": "a.leboa@vscmining.co.za",
        "role": "accountant",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "Finance",
        "path": "VSC Mining/Finance/Angela"
      }
    },
    {
      "username": "thapelo",
      "user_metadata": {
        "name": "Thapelo",
        "email": "dikobe.t@vscmining.co.za",
        "role": "hr",
        "org": "VSC Mining",
        "orgs": ["VSC Mining"],
        "dept": "HR",
        "path": "VSC Mining/HR/Thapelo"
      }
    }
  ]
}
```

### File: `C:\ums-autentico\README.md`

```markdown
# Autentico

LAN-hosted Go identity provider for the Ubuveil Management System.

## Build

```
cd C:\ums-autentico
go mod download
go build -o autentico.exe .
```

Produces a single executable with no external dependencies (SQLite is pure Go via modernc.org/sqlite).

## Configure

Create `.env` in `C:\ums-autentico\`:

```
AUTENTICO_LISTEN_ADDR=:8080
AUTENTICO_DB_PATH=C:\ProgramData\Autentico\autentico.db
AUTENTICO_KEYS_DIR=C:\ProgramData\Autentico\keys
AUTENTICO_ADMIN_TOKEN=<32+ random chars>
AUTENTICO_BOOTSTRAP_TOKEN=<32+ random chars>
```

Generate tokens:
```
powershell -c "[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"
```

## Seed users

```
.\autentico.exe seed users.json --bootstrap-token <AUTENTICO_BOOTSTRAP_TOKEN>
```

Passwords are generated per user and printed once to stdout. Copy them to a password manager immediately. They are not recoverable.

## Run

```
.\autentico.exe serve
```

Listens on `:8080`. Verify:
```
curl http://localhost:8080/healthz
```

## Public key

The RS256 public key is at `C:\ProgramData\Autentico\keys\public.pem` after first `serve` run. Copy it to `ums-app/src-tauri/keys/autentico-public.pem` so UMS 05a can verify JWT signatures.

## User management

```
.\autentico.exe user suspend --username angela --reason "left company" --actor petro --bootstrap-token <token>
.\autentico.exe user revoke --username angela --bootstrap-token <token>
.\autentico.exe user reactivate --username angela --bootstrap-token <token>
.\autentico.exe user list --bootstrap-token <token>
```

## Run as Windows service (via NSSM)

```
winget install NSSM.NSSM
nssm install Autentico "C:\ums-autentico\autentico.exe" serve
nssm set Autentico AppDirectory "C:\ums-autentico"
nssm set Autentico AppEnvironmentExtra AUTENTICO_ADMIN_TOKEN=<token> AUTENTICO_BOOTSTRAP_TOKEN=<token>
nssm start Autentico
```

## API

See `docs/architecture/AUTHENTICO-API.md` in the UMS repo for the full contract.

## Health check

```
curl http://localhost:8080/healthz
```

## Test login (once seeded)

```powershell
$body = '{"username":"petro","password":"<from-seed-output>"}'
$r = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/login" -Headers @{"X-Autentico-API-Version"="1"} -ContentType "application/json" -Body $body
$r.token
```
```

---

## What you do after this turn

1. **Create the 9 files** above at `C:\ums-autentico\` in the exact paths shown.
2. **Create `.env`** at `C:\ums-autentico\.env` with the two tokens (32+ chars each).
3. **Build:** `cd C:\ums-autentico; go mod download; go build -o autentico.exe .`
4. **Seed:** `.\autentico.exe seed users.json --bootstrap-token <token>`. Copy the 8 printed passwords immediately.
5. **Run:** `.\autentico.exe serve` in a terminal. Leave it running.
6. **Verify:** `curl http://localhost:8080/healthz` returns `ok`.
7. **Copy public key:** `C:\ProgramData\Autentico\keys\public.pem` to `ums-app/src-tauri/keys/autentico-public.pem` in the UMS repo (create the `keys/` folder if it does not exist).
8. **Paste the public.pem content back to me** so I can embed it in UMS 05a.

## What ships next turn

Once you have:
- Running `autentico.exe serve` at `localhost:8080`
- `autentico-public.pem` in place
- The public key content pasted to me

Then UMS 05a ships:

- `src-tauri/src/rbac.rs` (new)
- `src-tauri/src/lib.rs` (7 commands + `mod rbac` + RS256 verification)
- `src-tauri/Cargo.toml` (`jsonwebtoken`, `serde_json` already present)
- `src-tauri/keys/autentico-public.pem` (embedded at build)
- `src/context/AuthContext.tsx` (full replace)
- `src/components/Layout/LoginScreen.tsx` (full replace)
- `src/App.tsx` (patch, loading state)
- `src/components/Layout/AppShell.tsx` (read:profile gating)
- `src/components/Company/CompanyProfile.tsx` (banking gated by admin:finance)
- `tauri.conf.json` + `Cargo.toml` (root) + `package.json` (0.2.2 -> 0.2.3)
- `docs/dev/DEV-GUIDE.md` Autentico section
- `docs/handover/05a-auth-foundation.md`

Build and test Autentico first. If it compiles and login works against it (test with the PowerShell snippet in README), then next turn ships UMS 05a. No point shipping UMS code I cannot test against a real server.