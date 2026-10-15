"use client";
import Image from "next/image";
import { useState } from "react";
import type { MemeTemplate } from "@/src/lib/memes/types";
import { useLanguage } from "../language-provider";
export function MemeImage({ template }: { template: MemeTemplate }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  return (
    <div className="meme-image">
      {failed || template.imageError ? (
        <div className="image-error" role="status">
          <p>{t("imageMissing")}</p>
          {template.imageError ? <a className="secondary-button" href="">{t("retry")}</a> : <button className="secondary-button" onClick={() => setFailed(false)}>{t("retry")}</button>}
        </div>
      ) : (
        <Image
          src={template.imageUrl}
          width={template.width}
          height={template.height}
          alt={template.name}
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
