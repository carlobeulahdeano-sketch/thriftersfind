'use server'

import { prisma } from "@/lib/prisma"
import { AdminLog } from "@prisma/client"

export type GetAdminLogsResult = {
    logs: AdminLog[]
    totalLogs: number
    totalPages: number
    currentPage: number
}

export async function getAdminLogs(
    page: number = 1,
    pageSize: number = 10,
    action?: string
): Promise<GetAdminLogsResult> {
    try {
        const skip = (page - 1) * pageSize

        const where = action && action !== "all" ? { action } : {}

        const [logs, totalLogs] = await prisma.$transaction([
            prisma.adminLog.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.adminLog.count({ where }),
        ])

        const totalPages = Math.ceil(totalLogs / pageSize)

        return {
            logs,
            totalLogs,
            totalPages,
            currentPage: page,
        }
    } catch (error) {
        console.error("Error fetching admin logs:", error)
        throw new Error("Failed to fetch admin logs")
    }
}

export async function getAdminLogActions(): Promise<string[]> {
    try {
        const actions = await prisma.adminLog.findMany({
            select: { action: true },
            distinct: ['action'],
            orderBy: { action: 'asc' }
        })
        return actions.map(a => a.action)
    } catch (error) {
        console.error("Error fetching admin log actions:", error)
        return []
    }
}
