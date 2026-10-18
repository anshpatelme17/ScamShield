import { useLanguage } from "../i18n/LanguageContext";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
      <div className="mt-4 h-16 w-full rounded bg-slate-100" />
    </div>
  );
}

export default function Skeletons() {
  const { t } = useLanguage();
  return (
    <section className="mt-6 space-y-4" aria-hidden="true">
      <SkeletonCard />
      <SkeletonCard />
      <p className="text-center text-xs text-slate-500">{t("skeleton.loading")}</p>
    </section>
  );
}
