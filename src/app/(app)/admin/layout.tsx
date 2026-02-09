import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    if (!sessionId) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionId },
        include: {
            role_rel: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    const permissions = user.permissions as any;
    const hasAdminAccess = !!permissions?.adminManage;

    if (!hasAdminAccess) {
        // Redirect unauthorized staff/users. Since AppLayout will handle 
        // the "Access Denied" UI, we can just let it through if we want, 
        // but it's safer to redirect to a known safe path or profile.
        redirect("/profile");
    }

    return <>{children}</>;
}
