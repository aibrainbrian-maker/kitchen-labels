import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/print", label: "Print" },
    { href: "/products", label: "Products" },
    { href: "/ingredients", label: "Ingredients" },
    { href: "/labels/template", label: "Template" },
    { href: "/labels/sizes", label: "Label sizes" },
  ];

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-neutral-900">
            Kitchen Labels
          </Link>
          <div className="flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
