import { redirect } from "next/navigation";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return (
    <div className="w-full h-dvh overflow-hidden bg-gradient-to-b from-[#0f1419] to-[#1e293b]">
      {children}
    </div>
  );
}
