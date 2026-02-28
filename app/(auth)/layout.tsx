export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-primary-50/30">
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
