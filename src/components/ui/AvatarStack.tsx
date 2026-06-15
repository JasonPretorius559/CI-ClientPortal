type AvatarStackProps = {
  names: string[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AvatarStack({ names }: AvatarStackProps) {
  const visible = names.slice(0, 3);
  const extra = Math.max(0, names.length - visible.length);

  return (
    <div className="flex items-center">
      {visible.map((name, index) => (
        <div
          key={`${name}-${index}`}
          className="-ml-2 first:ml-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-50 text-[11px] font-semibold text-brand-700"
          title={name}
        >
          {initials(name) || "CI"}
        </div>
      ))}
      {extra > 0 ? (
        <div className="-ml-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-surface-muted text-[11px] font-semibold text-ink-600">
          +{extra}
        </div>
      ) : null}
    </div>
  );
}
