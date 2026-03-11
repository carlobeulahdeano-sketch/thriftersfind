'use server'

import { prisma } from "@/lib/prisma"
import { SalesLog } from "@prisma/client"

export type SalesLogWithBranch = SalesLog & {
    branchName?: string | null;
}

export type GetSalesLogsResult = {
    logs: SalesLogWithBranch[]
    totalLogs: number
    totalPages: number
    currentPage: number
}

export async function getSalesLogs(
    page: number = 1,
    pageSize: number = 10
): Promise<GetSalesLogsResult> {
    try {
        const skip = (page - 1) * pageSize

        const [logs, totalLogs] = await prisma.$transaction([
            prisma.salesLog.findMany({
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.salesLog.count(),
        ])

        // Extract user IDs to fetch branches
        const userIds = new Set<number>();
        for (const log of logs) {
            let data: any = log.orders;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }
            if (data && data.createdBy && data.createdBy.uid) {
                userIds.add(Number(data.createdBy.uid));
            }
        }

        const users = await prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            include: { branch: true }
        });

        const userBranchMap = new Map<string, string | null>();
        for (const u of users) {
            userBranchMap.set(String(u.id), (u as any).branch?.name || null);
        }

        const logsWithBranch = logs.map(log => {
            let data: any = log.orders;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }
            const uid = data?.createdBy?.uid;
            const branchName = uid ? userBranchMap.get(uid) : null;
            return {
                ...log,
                branchName
            };
        });

        const totalPages = Math.ceil(totalLogs / pageSize)

        return {
            logs: logsWithBranch,
            totalLogs,
            totalPages,
            currentPage: page,
        }
    } catch (error) {
        console.error("Error fetching sales logs:", error)
        throw new Error("Failed to fetch sales logs")
    }
}
