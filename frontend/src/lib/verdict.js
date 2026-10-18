export const VERDICT_STYLES = {
  highly_suspicious: "bg-red-600",
  suspicious: "bg-amber-500",
  no_strong_warning_signs_found: "bg-slate-500",
  unable_to_determine: "bg-slate-400",
};

export const VERDICT_LABELS = {
  highly_suspicious: "HIGHLY SUSPICIOUS",
  suspicious: "SUSPICIOUS",
  no_strong_warning_signs_found: "NO STRONG WARNING SIGNS FOUND",
  unable_to_determine: "UNABLE TO DETERMINE",
};

export const STATUS_STYLES = {
  rule_match: "bg-emerald-100 text-emerald-800",
  observed: "bg-slate-100 text-slate-700",
  unverified: "bg-amber-100 text-amber-800",
  check_failed: "bg-red-100 text-red-800",
  not_applicable: "bg-slate-100 text-slate-500",
};

export const SOURCE_LABELS = {
  submitted_input: "input",
  local_rule: "local rule",
  external_intel: "external intel",
};
