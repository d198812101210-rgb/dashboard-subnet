export function SectionHead({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-3 md:px-6">
      <h2 className="label">{title}</h2>
      {aside}
    </div>
  );
}
