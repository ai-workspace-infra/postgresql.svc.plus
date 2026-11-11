# Helm Chart 部署

> Chart 不在本仓库维护，统一位于 [ai-workspace-infra/artifacts](https://github.com/ai-workspace-infra/artifacts) `oci/charts/infra-platform/standalone/postgresql`。下文 `ARTIFACTS_CHARTS` 指向 artifacts 仓库的 `oci/charts` 目录（例如 `export ARTIFACTS_CHARTS=../artifacts/oci/charts`）。

推荐阅读：`docs/usage/deployment.md`

## 安装

```bash
helm install postgresql ${ARTIFACTS_CHARTS}/infra-platform/standalone/postgresql \
  --set auth.password=your-secure-password \
  --set persistence.size=10Gi
```

## 启用 stunnel sidecar

```bash
helm install postgresql ${ARTIFACTS_CHARTS}/infra-platform/standalone/postgresql \
  --set auth.password=your-secure-password \
  --set stunnel.enabled=true \
  --set stunnel.certificatesSecret=stunnel-certs
```

默认配置详见 ai-workspace-infra/artifacts `oci/charts/infra-platform/standalone/postgresql/values.yaml`。
