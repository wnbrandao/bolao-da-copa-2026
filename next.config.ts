import type { NextConfig } from "next";

// Site 100% estático pro GitHub Pages. `basePath` precisa bater com o nome do
// repositório (servido em usuario.github.io/<repo>/). Imagens sem otimização
// porque não há servidor (usamos <img> direto pro flagcdn).
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/bolao-da-copa-2026",
  trailingSlash: true,
  images: { unoptimized: true },
  // Fixa a raiz no projeto (há outros lockfiles na máquina).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
