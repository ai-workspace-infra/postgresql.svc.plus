# API Endpoints

This document describes the HTTP endpoints provided by the XControl platform. Each entry lists the request method and path, required parameters, and a sample curl command for verification.

## Authentication Gateway (Next.js)

The XControl web frontend exposes authentication APIs under `dashboard/app/api/auth`. These endpoints act as a secure gateway that proxies requests to the shared Account Service (`/api/auth/register`, `/api/auth/register/send`, `/api/auth/register/verify`, `/api/auth/login`, `/api/auth/mfa/setup`, `/api/auth/mfa/verify`). Responses always include `{ "success": boolean, "error": string | null, "needMfa": boolean }` so that multiple frontends can share the same Account Service behaviour.

Gateway-managed session cookies (`xc_session`) and MFA challenge cookies (`xc_mfa_challenge`) are issued with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes. Cookies are HTTPS-only and never expose raw secrets to JavaScript.

### POST /api/auth/register
- **Description:** Register a new account through the gateway. The Account Service creates the pending user and sends a verification code via email.
- **Body Parameters (JSON):**
  - `name` – Optional display name.
  - `email` – Required email address; normalized to lowercase.
  - `password` / `confirmPassword` – Required password fields. Values must match before proxying.
- **Response:** `{ "success": true, "error": null, "needMfa": false }` on success. On failure `error` contains the Account Service error code.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"demo","email":"demo@example.com","password":"Secret123","confirmPassword":"Secret123"}'
  ```

### POST /api/auth/register/send
- **Description:** Trigger a verification email for an existing pending registration. This endpoint may be used to send the initial code when the frontend wants to separate registration from verification, or to resend a code if the user did not receive the previous email.
- **Body Parameters (JSON):**
  - `email` – The pending account email address.
- **Response:** `{ "success": true, "error": null, "needMfa": false }` on success. On failure `error` contains the Account Service error code.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/register/send \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com"}'
  ```

### POST /api/auth/verify-email
- **Description:** Confirm the 6-digit email verification code issued during registration. Activates the account when the code matches and has not expired.
- **Body Parameters (JSON):**
  - `email` – Registered email address.
  - `code` – Verification code from the email message.
- **Response:** `{ "success": true, "error": null, "needMfa": false }` once the account transitions to `active`.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/verify-email \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","code":"123456"}'
  ```

### POST /api/auth/login
- **Description:** Authenticate email + password credentials. When MFA is enabled the response sets `needMfa: true` and stores the temporary challenge token in an HttpOnly cookie.
- **Body Parameters (JSON):**
  - `email` – Account email.
  - `password` – Password. Never logged or stored in plaintext.
  - `totp` *(optional)* – 6-digit TOTP if already known (legacy compatibility when `mfa_enabled=false`).
  - `remember` *(optional)* – Extends the session cookie lifetime to 30 days.
- **Response:**
  - `{ "success": true, "needMfa": false }` and a `xc_session` cookie when MFA succeeds or is disabled.
  - `{ "success": false, "needMfa": true }` and a `xc_mfa_challenge` cookie when additional MFA verification is required.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -c cookies.txt \
    -d '{"email":"demo@example.com","password":"Secret123"}'
  ```

### POST /api/auth/mfa/setup
- **Description:** Generate a TOTP secret and provisioning URI for the authenticated challenge token. The challenge token is read from the `xc_mfa_challenge` cookie or the JSON payload.
- **Body Parameters (JSON):**
  - `token` *(optional)* – MFA challenge token override. Defaults to the cookie value.
  - `issuer` *(optional)* – Overrides the issuer label in authenticator apps.
  - `account` *(optional)* – Overrides the account label.
- **Response:** `{ "success": true, "needMfa": true, "data": { ... } }` with the Account Service payload (e.g., `otpauth` URI, recovery codes). Errors keep `needMfa: true` and include `error` codes from the backend.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/mfa/setup \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{}'
  ```

### POST /api/auth/mfa/verify
- **Description:** Validate the 6-digit TOTP code. On success the gateway issues the final session cookie and removes the MFA challenge cookie.
- **Body Parameters (JSON):**
  - `token` *(optional)* – MFA challenge token override.
  - `code` – 6-digit TOTP value.
- **Response:** `{ "success": true, "needMfa": false }` with `xc_session` cookie on success. Errors reuse the challenge token and return `{ "success": false, "needMfa": true }`.
- **Test:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/mfa/verify \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"code":"123456"}'
  ```

### Session Lookup
- **GET /api/auth/session** – Returns `{ "user": { ... } }` when the `xc_session` cookie is present. The payload now mirrors the Account Service metadata and exposes the `role`, `groups`, and `permissions` arrays that are derived from the server-side `level` field. Clears the cookie automatically if the Account Service rejects the session.
- **Test:**
  ```bash
  curl -b cookies.txt http://localhost:3000/api/auth/session | jq
  ```
  Example response after a successful login:
  ```json
  {
    "user": {
      "uuid": "72c70df9-b7b6-4e81-84ef-5f0e5b1fc7c6",
      "name": "demo",
      "email": "demo@example.com",
      "role": "user",
      "groups": ["User"],
      "permissions": ["session:read"]
    }
  }
  ```
- **DELETE /api/auth/session** – Revokes the active session both at the gateway and the Account Service.

> **TLS note:** Deploy the frontend behind HTTPS so that `Secure` cookies are accepted by browsers. When testing with curl, add `-k` only if using a self-signed development certificate.

> Unless otherwise noted, the examples below target the RAG server listening on
> `127.0.0.1:8090`. The default base URL for local testing is
> `http://localhost:8090`.

## GET /api/users
- **Description:** Return all users.
- **Parameters:** None.
- **Test:**
  ```bash
  curl -s http://localhost:8090/api/users
  ```

## GET /api/nodes
- **Description:** Return all nodes.
- **Parameters:** None.
- **Test:**
  ```bash
  curl -s http://localhost:8090/api/nodes
  ```

## POST /api/sync
- **Description:** Clone or update a knowledge repository.
- **Body Parameters (JSON):**
  - `repo_url` – Git repository URL.
  - `local_path` – Destination directory on the server.
- **Test:**
  ```bash
  curl -X POST http://localhost:8090/api/sync \
    -H "Content-Type: application/json" \
    -d '{"repo_url": "https://github.com/example/repo.git", "local_path": "/tmp/repo"}'
  ```

## POST /api/rag/sync
- **Description:** Trigger RAG background synchronization. The endpoint streams
  plain-text progress logs during the sync.
- **Parameters:** None.
- **Test:**
  ```bash
  curl -N -X POST http://localhost:8090/api/rag/sync
  ```
- **Notes:** A future evolution could expose this operation via a gRPC
  streaming RPC. That approach would allow high-speed synchronization, rate
  limiting, and resumable transfers over long-lived connections while
  supporting dynamic, lossless queues for weak networks.

## POST /api/rag/upsert
- **Description:** Upsert pre-embedded document chunks into the RAG database.
- **Body Parameters (JSON):**
  - `docs` – Array of documents each containing `repo`, `path`, `chunk_id`, `content`, `embedding`, `metadata`, and `content_sha`.
- **Test:**

curl -X POST http://localhost:8090/api/rag/upsert \
     -H "Content-Type: application/json" --data-binary @/Users/shenlan/workspaces/XControl/docs/upsert_1024.json
  ```bash
Expected response on success: `{"rows":1}`. If the vector database is unavailable, the endpoint returns `{"rows":0,"error":"..."}`.

## POST /api/rag/query
- **Description:** Query the RAG service.
- **Body Parameters (JSON):**
  - `question` – Query text.
- **Test:**
  ```bash
  curl -X POST http://localhost:8090/api/rag/query \
    -H "Content-Type: application/json" \
    -d '{"question": "What is XControl?"}'
  ```
  When copying the multi-line example above, ensure your shell treats the trailing
  `\` characters as line continuations. Copying literal `\n` sequences will cause
  `curl: (3) URL rejected: Bad hostname` errors. You can also run the command on a
  single line without the backslashes:

  ```bash
  curl -X POST http://localhost:8090/api/rag/query -H "Content-Type: application/json" -d '{"question": "What is XControl?"}'
  ```

## POST /api/askai
- **Description:** Ask the AI service for an answer. The endpoint uses [LangChainGo](https://github.com/tmc/langchaingo) to communicate with the configured model provider (e.g., OpenAI-compatible services or a local Ollama instance). Ensure the server configuration includes the proper token or local server URL.
- **Body Parameters (JSON):**
  - `question` – Question text.
**Configuration:** In `rag-server/config/server.yaml` the `models` section selects the LLM and embedding providers.
For local debugging with HuggingFace and Ollama:

```yaml
models:
  embedder:
    models: "bge-m3"
    endpoint: "http://127.0.0.1:9000/v1/embeddings"
  generator:
    models:
      - 'llama2:13b'
    endpoint: "http://127.0.0.1:11434"
```

For online services using Chutes:

```yaml
#models:
#  embedder:
#    models: "bge-m3"
#    endpoint: "https://chutes-baai-bge-m3.chutes.ai/embed"
#    token: "cpk_xxxx"
#  generator:
#    models:
#      - 'moonshotai/Kimi-K2-Instruct'
#    endpoint: "https://llm.chutes.ai/v1"
#    token: "cpk_xxxx"
```

The `api.askai` section controls request behaviour:

```yaml
api:
  askai:
    timeout: 60   # seconds
    retries: 3    # retry attempts
```

- **Test:**
  ```bash
  curl -X POST http://localhost:8090/api/askai \
    -H "Content-Type: application/json" \
    -d '{"question": "Hello"}'
  ```

## GET Localhost embeddings API

1. 运行（首次会自动下载模型）
python offline_embed_server.py
2. 测试接口

1) 健康检查（端口就绪即返回 ok） curl -v http://127.0.0.1:9000/healthz
2) 就绪检查（模型加载完成后返回 ready） curl -v http://127.0.0.1:9000/readyz
3) 调用 embeddings

curl http://127.0.0.1:9000/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"BAAI/bge-m3","input":["你好","PGVector 怎么建 HNSW？"]}'

如果你要把 DEVICE 固定为 mps 并行内核，保留默认即可；如需落回 CPU：DEVICE=cpu python docs/offline_embed_server.py。

## GET Localhost Ollama API

用流式接收（推荐）：

curl http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss:20b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Tell me three tips for optimizing HNSW in PostgreSQL."}
    ],
    "max_tokens": 512,
    "stream": true
  }'
这样会实时输出分块数据

curl http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3:latest",
    "messages": [{"role":"user","content":"你好，简要介绍一下自己"}],
    "max_tokens": 200,
    "temperature": 0.7
  }'

