import { VERDICT_STYLES } from "../lib/verdict";
import { useLanguage } from "../i18n/LanguageContext";

export default function VerdictBadge({ verdict, size = "md" }) {
  const { tEnum } = useLanguage();
  const sizes = { md: "px-3 py-1 text-sm", sm: "px-2 py-0.5 text-xs" };
  return (
    <span
      className={`inline-block rounded font-bold text-white ${
        VERDICT_STYLES[verdict] ?? "bg-slate-400"
      } ${sizes[size] ?? sizes.md}`}
    >
      {tEnum("verdict", verdict)}
    </span>
  );
}
