"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  title: string;
  price: number;
  maker: string;
  description: string;
  paymentLink: string;
  imageUrl: string;
  createdAt: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setProducts(data.products ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 text-[#4f3140]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 rounded-[28px] bg-[linear-gradient(140deg,#ffd6e6_0%,#ffe8f3_50%,#fff7fb_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)]">
          <p className="text-xs font-bold tracking-[0.28em] text-[#ff6b9d]">
            KIRAKIRA AKARIN DINER
          </p>
          <h1 className="mt-2 text-[2rem] font-bold leading-tight text-[#7c3650]">
            ビーズ作品一覧
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#845564]">
            きらきらあかりん食堂のビーズ作品です。気に入った作品はそのまま購入できます。
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full border border-[#ffb6d0] bg-white px-4 py-2 text-sm font-bold text-[#d74c81] transition active:scale-[0.98]"
          >
            作品を登録する
          </Link>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-lg font-bold text-[#c28fa1]">読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="rounded-[20px] bg-[#fff0f4] px-6 py-4 text-sm font-medium text-[#c53b72]">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="text-5xl">&#10022;</span>
            <p className="text-lg font-bold text-[#c28fa1]">
              まだ作品がありません
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/80 shadow-[0_12px_40px_rgba(255,107,157,0.12)] backdrop-blur transition hover:shadow-[0_16px_48px_rgba(255,107,157,0.2)]"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_top,#fff_0%,#fff4f8_52%,#ffe7f1_100%)]">
                    <span className="text-5xl text-[#ffc0d8]">&#10022;</span>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="text-lg font-bold text-[#7c3650]">
                    {product.title}
                  </h2>

                  {product.maker && (
                    <p className="text-xs text-[#9c7380]">
                      by {product.maker}
                    </p>
                  )}

                  {product.description && (
                    <p className="flex-1 text-sm leading-6 text-[#845564]">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xl font-bold text-[#ff6b9d]">
                      {product.price > 0
                        ? `${product.price.toLocaleString()}円`
                        : "投げ銭"}
                    </span>

                    {product.paymentLink ? (
                      <a
                        href={product.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[#ff6b9d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,107,157,0.3)] transition active:scale-[0.98]"
                      >
                        購入する
                      </a>
                    ) : (
                      <span className="rounded-full bg-[#f0e0e8] px-5 py-2.5 text-sm font-bold text-[#b08898]">
                        準備中
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
