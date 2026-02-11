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
    <div className="w-screen h-screen overflow-hidden bg-[#f8fafc]">
      {children}
    </div>
  );
}
