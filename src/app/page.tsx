import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";
async function createOrg(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  await prisma.organization.create({ data: { name, slug } });
  revalidatePath("/");
}

async function addMember(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const role = formData.get("role") as "ADMIN" | "MANAGER" | "MEMBER";
  const organizationId = formData.get("organizationId") as string;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  await prisma.membership.create({
    data: { userId: user.id, organizationId, role },
  });

  revalidatePath("/");
}

const roleBadge: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  MEMBER: "bg-gray-100 text-gray-700",
};

export default async function Home() {
  const organizations = await prisma.organization.findMany({
    include: { memberships: { include: { user: true } }, subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          SaaS Dashboard
        </h1>
        <p className="text-gray-500 mb-8">
          Multi-tenant organizations, members &amp; roles
        </p>

        <form action={createOrg} className="flex gap-2 mb-10">
          <input
            name="name"
            placeholder="Organization name"
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Create Organization
          </button>
        </form>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Organizations ({organizations.length})
        </h2>

        <div className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-900">
                  {org.name}
                </h3>
                <div className="flex items-center gap-2">
                  {org.subscription?.status === "active" ? (
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      {org.subscription.plan} plan
                    </span>
                  ) : (
                    <button
                      className="upgrade-btn px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                      data-org-id={org.id}
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>

              <ul className="mt-3 mb-4 space-y-1">
                {org.memberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span>{m.user.email}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        roleBadge[m.role]
                      }`}
                    >
                      {m.role}
                    </span>
                  </li>
                ))}
                {org.memberships.length === 0 && (
                  <li className="text-sm text-gray-400">No members yet</li>
                )}
              </ul>

              <form action={addMember} className="flex gap-2">
                <input type="hidden" name="organizationId" value={org.id} />
                <input
                  name="email"
                  placeholder="member@email.com"
                  required
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <select
                  name="role"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700"
                >
                  Add Member
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', async (e) => {
              const btn = e.target.closest('.upgrade-btn');
              if (!btn) return;
              const organizationId = btn.dataset.orgId;
              const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            });
          `,
        }}
      />
    </main>
  );
}
