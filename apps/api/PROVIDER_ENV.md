# Provider Management - Environment Variables

## Required Environment Variables

Add these to your `.env` file:

```bash
# Encryption Key for Provider API Keys (MUST be exactly 32 bytes!)
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Example (generate your own!):
# ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## Generating a Secure Encryption Key

### Linux/Mac/WSL:

```bash
openssl rand -hex 16
```

### Or use this one-liner in Go:

```bash
go run -c 'import ("crypto/rand"; "encoding/hex"); b := make([]byte, 16); rand.Read(b); fmt.Println(hex.EncodeToString(b))'
```

### Manual (not recommended for production):

Just create a random 32-character string using letters and numbers.

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **Never commit the ENCRYPTION_KEY to git!**
2. The encryption key MUST be exactly 32 bytes (32 characters)
3. If you change the encryption key, all existing encrypted API keys will be unrecoverable
4. Store the encryption key securely (use secrets manager in production)

---

## Example .env

```bash
APP_ENV=development
APP_PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatpro_hub
REDIS_URL=redis://localhost:6379
CHATWOOT_URL=http://localhost:8080
CHATWOOT_API_KEY=your_chatwoot_api_key
JWT_SECRET=your_jwt_secret_key
CORS_ORIGINS=*

# Provider Management
ENCRYPTION_KEY=12345678901234567890123456789012
```
