"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const PRESET_PRICES = ["300", "500", "1000", "投げ銭"] as const;

type FormState = {
  title: string;
  maker: string;
  description: string;
  price: string;
};

type SuccessState = {
  productUrl: string;
};

type CreateResponse = {
  productUrl?: string;
  product_url?: string;
  url?: string;
  shareUrl?: string;
  share_url?: string;
  data?: {
    productUrl?: string;
    product_url?: string;
    url?: string;
    shareUrl?: string;
    share_url?: string;
  };
};

const INITIAL_FORM: FormState = {
  title: "",
  maker: "",
  description: "",
  price: "500",
};

function getProductUrl(payload: CreateResponse): string {
  return (
    payload.productUrl ??
    payload.product_url ??
    payload.url ??
    payload.shareUrl ??
    payload.share_url ??
    payload.data?.productUrl ??
    payload.data?.product_url ??
    payload.data?.url ??
    payload.data?.shareUrl ??
    payload.data?.share_url ??
    ""
  );
}

export default function Home() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleFieldChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageFile(event.target.files?.[0] ?? null);
  };

  const handleShare = async () => {
    if (!success?.productUrl) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: form.title || "きらきらあかりん食堂の新作",
        text: "きらきらあかりん食堂のビーズ作品はこちら",
        url: success.productUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(success.productUrl);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setErrorMessage("");
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setErrorMessage("作品名を入力してください。");
      return;
    }

    if (!imageFile) {
      setErrorMessage("作品写真を選択してください。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const body = new FormData();
      body.append("title", form.title.trim());
      body.append("maker", form.maker.trim());
      body.append("description", form.description.trim());
      body.append("price", form.price);
      body.append("image", imageFile);

      const response = await fetch("/api/products/create", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error("登録に失敗しました。通信状態とAPI設定を確認してください。");
      }

      const payload = (await response.json()) as CreateResponse;
      const productUrl = getProductUrl(payload);

      if (!productUrl) {
        throw new Error("APIレスポンスから商品URLを取得できませんでした。");
      }

      setSuccess({ productUrl });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "登録中に予期しないエラーが発生しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[#4f3140]">
        <section className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(255,107,157,0.18)] backdrop-blur">
          <p className="mb-2 text-sm font-bold tracking-[0.24em] text-[#ff6b9d]">
            KIRAKIRA AKARIN DINER
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[#7c3650]">
            登録できました
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#7c5a68]">
            Stripe決済リンクが作成されました。SNSシェアか、続けて次の作品を登録できます。
          </p>

          <a
            href={success.productUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block rounded-[24px] bg-[#fff1f6] px-4 py-4 text-sm font-bold break-all text-[#ff4f8d] shadow-[inset_0_0_0_1px_rgba(255,107,157,0.16)]"
          >
            {success.productUrl}
          </a>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full bg-[#ff6b9d] px-5 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(255,107,157,0.35)] transition active:scale-[0.98]"
            >
              SNSでシェア
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[#ffb6d0] bg-white px-5 py-4 text-base font-bold text-[#d74c81] transition active:scale-[0.98]"
            >
              次の作品を登録する
            </button>
            <Link
              href="/products"
              className="rounded-full border border-[#ffd3e4] bg-[#fff6fa] px-5 py-4 text-center text-base font-bold text-[#b04c73] transition active:scale-[0.98]"
            >
              作品一覧を見る
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[#4f3140]">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[32px] border border-white/70 bg-white/76 p-4 shadow-[0_24px_80px_rgba(255,107,157,0.2)] backdrop-blur sm:p-6">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(140deg,#ffd6e6_0%,#ffe8f3_50%,#fff7fb_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)]">
          <p className="text-xs font-bold tracking-[0.28em] text-[#ff6b9d]">
            きらきらあかりん食堂
          </p>
          <h1 className="mt-2 text-[2rem] font-bold leading-tight text-[#7c3650]">
            ビーズ作品を
            <br />
            かわいく登録
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#845564]">
            スタッフ用の当日登録フォームです。作品を撮って、そのまま販売ページへ送れます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#7c3650]">作品写真</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="rounded-[20px] border border-dashed border-[#ff9ec0] bg-[#fff6fa] px-4 py-4 text-sm text-[#7c5a68] file:mr-3 file:rounded-full file:border-0 file:bg-[#ff6b9d] file:px-4 file:py-2 file:font-bold file:text-white"
            />
          </label>

          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-[#fff8fb] shadow-[inset_0_0_0_1px_rgba(255,107,157,0.1)]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="作品プレビュー"
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#fff_0%,#fff4f8_52%,#ffe7f1_100%)] text-center text-sm text-[#946674]">
                <span className="text-5xl">✦</span>
                <p>ここに撮影した写真が表示されます</p>
              </div>
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#7c3650]">作品名 *</span>
            <input
              value={form.title}
              onChange={handleFieldChange("title")}
              placeholder="例: いちごミルクのキラキラリング"
              className="rounded-[20px] border border-[#ffd3e4] bg-[#fffafc] px-4 py-4 outline-none placeholder:text-[#c28fa1] focus:border-[#ff6b9d]"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#7c3650]">
              つくった人
            </span>
            <input
              value={form.maker}
              onChange={handleFieldChange("maker")}
              placeholder="任意のニックネーム"
              className="rounded-[20px] border border-[#ffd3e4] bg-[#fffafc] px-4 py-4 outline-none placeholder:text-[#c28fa1] focus:border-[#ff6b9d]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#7c3650]">
              ひとこと説明
            </span>
            <textarea
              value={form.description}
              onChange={handleFieldChange("description")}
              placeholder="おすすめポイント、色、モチーフなど"
              rows={4}
              className="rounded-[20px] border border-[#ffd3e4] bg-[#fffafc] px-4 py-4 outline-none placeholder:text-[#c28fa1] focus:border-[#ff6b9d]"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#7c3650]">価格</span>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_PRICES.map((price) => {
                const selected = form.price === price;

                return (
                  <button
                    key={price}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, price }))
                    }
                    className={`rounded-[20px] px-4 py-4 text-base font-bold transition ${
                      selected
                        ? "bg-[#ff6b9d] text-white shadow-[0_14px_30px_rgba(255,107,157,0.28)]"
                        : "bg-[#fff6fa] text-[#b04c73] shadow-[inset_0_0_0_1px_rgba(255,107,157,0.12)]"
                    }`}
                  >
                    {price}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-[20px] bg-[#fff0f4] px-4 py-3 text-sm font-medium text-[#c53b72]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#ff6b9d] px-5 py-4 text-base font-bold text-white shadow-[0_18px_36px_rgba(255,107,157,0.35)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "登録中..." : "作品を登録する"}
          </button>

          <p className="text-center text-xs leading-6 text-[#9c7380]">
            Stripe Payment Link で決済ページを自動作成します
          </p>

          <Link
            href="/products"
            className="mt-2 block text-center text-sm font-bold text-[#d74c81] underline underline-offset-4 transition hover:text-[#ff6b9d]"
          >
            作品一覧を見る
          </Link>
        </form>
      </section>
    </main>
  );
}
