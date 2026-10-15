"use client";
import { useLanguage } from "../language-provider";
export function ReuseUnavailable() {
  const { t } = useLanguage();
  return (
    <p className="gallery-shell error-panel" role="alert">
      {t("reuseUnavailable")}
    </p>
  );
}
