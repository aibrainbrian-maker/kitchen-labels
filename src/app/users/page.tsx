import { format } from "date-fns";
import { db } from "@/db";
import { auth } from "@/auth";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { addUser, resetPassword, deleteUser } from "./actions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string; reset?: string }>;
}) {
  const { error, added, reset } = await searchParams;
  const [session, allUsers] = await Promise.all([
    auth(),
    db.query.users.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Users</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Staff logins for this app. Anyone here can sign in with their email and
        password.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {added && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Login added.
        </p>
      )}
      {reset && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Password updated.
        </p>
      )}

      <ul className="mb-10 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {allUsers.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900">
                {u.name}
                {currentUserId === u.id && (
                  <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                    you
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-neutral-500">
                {u.email} · added {format(u.createdAt, "d MMM yyyy")}
              </p>
            </div>

            {/* Reset password */}
            <form
              action={resetPassword.bind(null, u.id)}
              className="flex items-center gap-2"
            >
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="New password"
                autoComplete="new-password"
                className="w-40 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Set password
              </button>
            </form>

            {currentUserId === u.id ? (
              <span className="w-8 text-center text-neutral-300" title="You can't delete your own login">
                —
              </span>
            ) : (
              <ConfirmDeleteButton
                label={u.name}
                action={async () => {
                  "use server";
                  await deleteUser(u.id);
                }}
              />
            )}
          </li>
        ))}
      </ul>

      <section className="rounded-lg border border-dashed border-neutral-300 p-4">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Add a login</h2>
        <form action={addUser} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Name
            </label>
            <input
              name="name"
              required
              placeholder="Full name"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Password (min 8 characters)
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Add login
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
