# 接口与端口

## 数据库端口

| 入口 | 协议 | 默认端口 | 说明 |
| --- | --- | --- | --- |
| PostgreSQL 内部监听 | TCP | 5432 | 容器内部使用，不对外暴露 |
| stunnel TLS 入口 | TLS/TCP | 443 | 对外数据库连接入口（可配置为 5433） |

## Web 入口（可选）

| 入口 | 协议 | 默认端口 | 说明 |
| --- | --- | --- | --- |
| Caddy/Nginx | HTTPS | 443 | 证书管理与健康检查 |
| pgAdmin | HTTP | 5050 | 管理界面（Compose `--profile admin`） |

> 端口配置来源：`deploy/docker/.env` 与 Helm `values.yaml`。
