import prisma from '../config/prisma';

export interface AuditLogParams {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

export const logAudit = async (params: AuditLogParams) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
