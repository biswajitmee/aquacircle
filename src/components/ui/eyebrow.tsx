export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      {children}
      <span aria-hidden="true" />
    </p>
  );
}
