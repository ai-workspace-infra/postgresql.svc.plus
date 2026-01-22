# PostgreSQL HTTPS 隧道客户端部署指南

## 设计理念

**核心目标**: 让应用程序可以使用普通的 PostgreSQL 连接字符串,无需配置 SSL/TLS,stunnel 客户端自动处理所有加密通信。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│  应用服务器 (任意位置部署)                                      │
│                                                             │
│  ┌──────────────┐                                          │
│  │  应用程序     │                                          │
│  │  (DB/API/Web) │                                          │
│  └──────┬───────┘                                          │
│         │ 普通 PostgreSQL 连接                              │
│         │ localhost:15432                                  │
│         │ 无需 sslmode 配置                                 │
│         ↓                                                   │
│  ┌──────────────┐                                          │
│  │ stunnel 客户端│                                          │
│  │ (127.0.0.1:  │                                          │
│  │    15432)    │                                          │
│  └──────┬───────┘                                          │
└─────────┼─────────────────────────────────────────────────┘
          │
          │ HTTPS/TLS 加密
          │ (Internet)
          ↓
┌─────────────────────────────────────────────────────────────┐
│  数据库服务器 (db.example.com)                                │
│                                                             │
│  ┌──────────────┐                                          │
│  │ stunnel 服务端│                                          │
│  │ (0.0.0.0:    │                                          │
│  │    5433)     │                                          │
│  └──────┬───────┘                                          │
│         │ 解密后转发                                         │
│         │ 容器内部网络                                       │
│         ↓                                                   │
│  ┌──────────────┐                                          │
│  │  PostgreSQL  │                                          │
│  │ (127.0.0.1:  │                                          │
│  │    5432)     │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## 客户端部署

### 方式 1: Docker 容器 (推荐)

**docker-compose.yml** (应用服务器):

```yaml
version: '3.8'

services:
  # Stunnel 客户端 - 提供本地 PostgreSQL 端点
  stunnel-client:
    image: dweomer/stunnel
    container_name: stunnel-client
    restart: unless-stopped
    
    ports:
      # 本地 PostgreSQL 端点
      - "127.0.0.1:15432:15432"
    
    volumes:
      - ./stunnel-client.conf:/etc/stunnel/stunnel.conf:ro
      # 可选: CA 证书用于验证服务端
      # - ./ca-cert.pem:/etc/stunnel/certs/ca-cert.pem:ro
    
    networks:
      - app_network

  # 您的应用程序
  app:
    image: your-app:latest
    container_name: your-app
    
    environment:
      # 使用普通的 PostgreSQL 连接字符串
      DATABASE_URL: postgresql://postgres:password@stunnel-client:15432/dbname
      # 或者
      DB_HOST: stunnel-client
      DB_PORT: 15432
      DB_USER: postgres
      DB_PASSWORD: password
      DB_NAME: dbname
    
    depends_on:
      - stunnel-client
    
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
```

**stunnel-client.conf**:

```ini
[postgres-client]
client = yes
accept = 0.0.0.0:15432
connect = db.yourdomain.com:5433

; 生产环境建议启用证书验证
; verify = 2
; CAfile = /etc/stunnel/certs/ca-cert.pem

sslVersion = TLSv1.2
options = NO_SSLv2
options = NO_SSLv3
```

**启动**:

```bash
docker-compose up -d
```

### 方式 2: 系统服务 (Linux)

#### 安装 stunnel4

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install stunnel4
```

**CentOS/RHEL**:
```bash
sudo yum install stunnel
```

#### 配置

创建 `/etc/stunnel/postgres-client.conf`:

```ini
[postgres-client]
client = yes
accept = 127.0.0.1:15432
connect = db.yourdomain.com:5433

; 证书验证
verify = 2
CAfile = /etc/stunnel/certs/ca-cert.pem
checkHost = db.yourdomain.com

sslVersion = TLSv1.2
options = NO_SSLv2
options = NO_SSLv3

; 日志
debug = 5
output = /var/log/stunnel/postgres-client.log

; 性能
socket = l:TCP_NODELAY=1
socket = r:TCP_NODELAY=1
```

#### 启用和启动

**Ubuntu/Debian**:

编辑 `/etc/default/stunnel4`:
```bash
ENABLED=1
FILES="/etc/stunnel/postgres-client.conf"
```

启动服务:
```bash
sudo systemctl enable stunnel4
sudo systemctl start stunnel4
sudo systemctl status stunnel4
```

**CentOS/RHEL**:

```bash
sudo systemctl enable stunnel@postgres-client
sudo systemctl start stunnel@postgres-client
sudo systemctl status stunnel@postgres-client
```

### 方式 3: macOS

#### 安装

```bash
brew install stunnel
```

#### 配置

创建 `~/stunnel/postgres-client.conf`:

```ini
[postgres-client]
client = yes
accept = 127.0.0.1:15432
connect = db.yourdomain.com:5433

verify = 2
CAfile = /Users/yourname/stunnel/ca-cert.pem

sslVersion = TLSv1.2
```

#### 启动

```bash
stunnel ~/stunnel/postgres-client.conf
```

或创建 LaunchAgent 自动启动:

`~/Library/LaunchAgents/com.stunnel.postgres.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.stunnel.postgres</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/stunnel</string>
        <string>/Users/yourname/stunnel/postgres-client.conf</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

加载:
```bash
launchctl load ~/Library/LaunchAgents/com.stunnel.postgres.plist
```

## 应用程序连接示例

### Python (psycopg2)

```python
import psycopg2

# 普通连接 - 无需 sslmode
conn = psycopg2.connect(
    host="localhost",  # 或 stunnel-client (Docker)
    port=15432,
    user="postgres",
    password="your_password",
    database="dbname"
)

# 或使用连接字符串
conn = psycopg2.connect("postgresql://postgres:password@localhost:15432/dbname")
```

### Node.js (pg)

```javascript
const { Client } = require('pg');

// 普通连接 - 无需 SSL 配置
const client = new Client({
  host: 'localhost',  // 或 stunnel-client (Docker)
  port: 15432,
  user: 'postgres',
  password: 'your_password',
  database: 'dbname'
});

// 或使用连接字符串
const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:15432/dbname'
});
```

### Go (lib/pq)

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)

// 普通连接字符串
connStr := "host=localhost port=15432 user=postgres password=your_password dbname=dbname sslmode=disable"
db, err := sql.Open("postgres", connStr)
```

### Java (JDBC)

```java
String url = "jdbc:postgresql://localhost:15432/dbname";
Properties props = new Properties();
props.setProperty("user", "postgres");
props.setProperty("password", "your_password");
// 无需 SSL 配置
Connection conn = DriverManager.getConnection(url, props);
```

### PHP (PDO)

```php
<?php
$dsn = "pgsql:host=localhost;port=15432;dbname=dbname";
$username = "postgres";
$password = "your_password";

// 普通连接
$pdo = new PDO($dsn, $username, $password);
?>
```

### Ruby (pg gem)

```ruby
require 'pg'

# 普通连接
conn = PG.connect(
  host: 'localhost',
  port: 15432,
  dbname: 'dbname',
  user: 'postgres',
  password: 'your_password'
)
```

### .NET (Npgsql)

```csharp
using Npgsql;

var connString = "Host=localhost;Port=15432;Username=postgres;Password=your_password;Database=dbname";
using var conn = new NpgsqlConnection(connString);
conn.Open();
```

## 环境变量配置

### Docker Compose

```yaml
environment:
  DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@stunnel-client:15432/${DB_NAME}
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "stunnel-client"
  DB_PORT: "15432"
  DB_NAME: "dbname"
```

### 12-Factor App

```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:15432/dbname
```

## 验证连接

### 使用 psql

```bash
psql -h localhost -p 15432 -U postgres -d postgres
```

### 使用 telnet

```bash
telnet localhost 15432
```

### 使用 nc

```bash
nc -zv localhost 15432
```

### 检查 stunnel 日志

```bash
# Docker
docker logs stunnel-client

# 系统服务
sudo tail -f /var/log/stunnel/postgres-client.log
```

## 故障排查

### 连接被拒绝

```bash
# 检查 stunnel 是否运行
ps aux | grep stunnel

# 检查端口监听
netstat -tlnp | grep 15432
# 或
lsof -i :15432

# 测试到服务端的连接
telnet db.yourdomain.com 5433
```

### TLS 握手失败

```bash
# 测试 TLS 连接
openssl s_client -connect db.yourdomain.com:5433 -showcerts

# 检查证书
openssl verify -CAfile ca-cert.pem server-cert.pem
```

### 应用无法连接

```bash
# 从应用容器测试
docker exec your-app nc -zv stunnel-client 15432

# 检查网络
docker network inspect app_network
```

## 多环境配置

### 开发环境

```ini
; stunnel-client-dev.conf
[postgres-client]
client = yes
accept = 127.0.0.1:15432
connect = dev-db.example.com:5433
verify = 0  ; 开发环境可以跳过验证
```

### 测试环境

```ini
; stunnel-client-test.conf
[postgres-client]
client = yes
accept = 127.0.0.1:15432
connect = test-db.example.com:5433
verify = 2
CAfile = /etc/stunnel/certs/test-ca.pem
```

### 生产环境

```ini
; stunnel-client-prod.conf
[postgres-client]
client = yes
accept = 127.0.0.1:15432
connect = prod-db.example.com:5433
verify = 2
CAfile = /etc/stunnel/certs/prod-ca.pem
checkHost = prod-db.example.com
```

## 安全建议

1. **生产环境必须启用证书验证**:
   ```ini
   verify = 2
   CAfile = /path/to/ca-cert.pem
   checkHost = db.yourdomain.com
   ```

2. **限制监听地址**:
   ```ini
   accept = 127.0.0.1:15432  # 只监听本地
   ```

3. **使用强加密套件**:
   ```ini
   ciphers = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
   ```

4. **定期更新证书**

5. **监控连接日志**

## 优势总结

✅ **简化应用配置**: 无需在每个应用中配置 SSL/TLS  
✅ **统一管理**: 所有加密配置集中在 stunnel  
✅ **灵活部署**: 应用可以部署在任何位置  
✅ **透明加密**: 应用无感知的端到端加密  
✅ **易于迁移**: 更换数据库服务器只需修改 stunnel 配置  
✅ **多语言支持**: 所有 PostgreSQL 客户端库都支持  

## 参考

- [stunnel 官方文档](https://www.stunnel.org/docs.html)
- [PostgreSQL 连接字符串](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [12-Factor App](https://12factor.net/)
