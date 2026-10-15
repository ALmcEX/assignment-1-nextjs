"use client";
import Image from "next/image";
import { useLanguage } from "../language-provider";
const samples = [
  ["ramen", "samplesOne"],
  ["sunday", "samplesTwo"],
  ["moon", "samplesThree"],
  ["studio", "samplesFour"],
] as const;
export function CatSamples() {
  const { t } = useLanguage();
  return (
    <section aria-label={t("viewSamples")}>
      <p className="sample-notice">✦ {t("sampleNotice")}</p>
      <div className="cat-grid">
        {samples.map(([file, key], i) => (
          <article className="cat-card sample-card" key={file}>
            <div className="cat-card-art">
              <Image
                src={`/cat-samples/${file}.svg`}
                alt={t(key)}
                width={800}
                height={800}
                unoptimized
              />
              <span className="art-badge">{t("sampleLabel")}</span>
            </div>
            <div className="cat-card-content">
              <div className="sample-number">STUDY / 0{i + 1}</div>
              <h2>{t(key)}</h2>
              <p className="sample-vote">{t("sampleVote")}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
