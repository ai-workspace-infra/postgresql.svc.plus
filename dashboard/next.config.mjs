import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // ===============================
  // 🚀 生产优化 —— 最关键的三行
  // ===============================
  output: "standalone",   // 让 Next.js 生成可独立运行的最小产物（大幅减小 Docker 镜像）
  compress: true,         // Gzip 压缩输出（确保小体积网络传输）

  // 配置允许的外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dl.svc.plus',
      },
      {
        protocol: 'https',
        hostname: 'www.svc.plus',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  webpack: (config) => {
    // 添加 YAML 文件支持
    config.module.rules.push({
      test: /\.ya?ml$/i,
      type: 'asset/source',
    });

    // 显式 alias，保证 Turbopack 也能解析
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@components": path.join(__dirname, "src", "components"),
      "@i18n": path.join(__dirname, "src", "i18n"),
      "@lib": path.join(__dirname, "src", "lib"),
      "@types": path.join(__dirname, "types"),
      "@server": path.join(__dirname, "src", "server"),
      "@modules": path.join(__dirname, "src", "modules"),
      "@extensions": path.join(__dirname, "src", "modules", "extensions"),
      "@theme": path.join(__dirname, "src", "components", "theme"),
      "@templates": path.join(__dirname, "src", "modules", "templates"),
      "@src": path.join(__dirname, "src"),
    };

    // 添加模块搜索路径
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      __dirname,
      path.join(__dirname, "src"),
    ];

    return config;
  },
  reactStrictMode: true,
  typedRoutes: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export async function redirects() {
  return [
    {
      source: '/XStream',
      destination: '/xstream',
      permanent: true,
    },
    {
      source: '/Xstream',
      destination: '/xstream',
      permanent: true,
    },
    {
      source: '/XScopeHub',
      destination: '/xscopehub',
      permanent: true,
    },
    {
      source: '/XCloudFlow',
      destination: '/xcloudflow',
      permanent: true,
    },
  ];
}

export default nextConfig;
