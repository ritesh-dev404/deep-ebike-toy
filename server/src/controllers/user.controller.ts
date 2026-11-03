import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';
import { SYSTEM_PERMISSIONS } from '../services/setup.service';

/**
 * List all users with their roles, sales count, and total revenue
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate sales revenue per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const salesRevenue = await prisma.sale.aggregate({
          where: { createdById: u.id, status: 'COMPLETED' },
          _sum: { grandTotal: true },
        });

        const { passwordHash, ...safeUser } = u;
        const status = !u.isActive && !u.lastLogin ? 'PENDING' : u.isActive ? 'ACTIVE' : 'DEACTIVATED';
        return {
          ...safeUser,
          status,
          totalSalesAmount: Math.round((salesRevenue._sum.grandTotal || 0) * 100) / 100,
          permissions: u.role.permissions.map((p) => p.permission.name),
        };
      })
    );

    return res.json({ success: true, data: usersWithStats });
  } catch (error: any) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { passwordHash, ...safeUser } = user;
    const status = !user.isActive && !user.lastLogin ? 'PENDING' : user.isActive ? 'ACTIVE' : 'DEACTIVATED';
    return res.json({
      success: true,
      data: {
        ...safeUser,
        status,
        permissions: user.role.permissions.map((p) => p.permission.name),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new employee or user account (Owner only)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, phone, roleName = 'EMPLOYEE' } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and full name are required',
      });
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check for existing username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { email: email?.trim() ? email.trim() : undefined },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this username or email already exists',
      });
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: `Role '${roleName}' does not exist`,
      });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        passwordHash,
        fullName: fullName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        roleId: role.id,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_USER',
      entityName: 'User',
      entityId: user.id,
      newValues: { username: user.username, fullName: user.fullName, role: role.name },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      data: safeUser,
    });
  } catch (error: any) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update user details (Owner only)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, roleName, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Self-protection: Prevent owner from deactivating own account
    if (req.user?.id === id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own Owner account.',
      });
    }

    // Self-protection: Prevent sole owner from changing own role
    if (req.user?.id === id && roleName && roleName !== 'OWNER') {
      const ownerCount = await prisma.user.count({
        where: { role: { name: 'OWNER' }, isActive: true },
      });
      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security protection: Cannot remove role from the sole active Store Owner.',
        });
      }
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        updateData.roleId = role.id;
      }
    }

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_USER',
      entityName: 'User',
      entityId: id,
      newValues: {
        fullName: updated.fullName,
        isActive: updated.isActive,
        role: updated.role.name,
      },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = updated;
    return res.json({
      success: true,
      message: 'User updated successfully',
      data: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle user active/deactivated status
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    if (req.user?.id === id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own account.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: { role: true },
    });

    await logAudit({
      userId: req.user?.id,
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityName: 'User',
      entityId: id,
      newValues: { isActive: updated.isActive },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = updated;
    return res.json({
      success: true,
      message: `Account for ${updated.fullName} has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
      data: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset employee password by Owner
 */
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'RESET_USER_PASSWORD',
      entityName: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Password for ${user.fullName} (@${user.username}) has been reset successfully.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * View employee performance, sales metrics, and activity logs
 */
export const getUserPerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Completed sales created by this user
    const totalSalesCount = await prisma.sale.count({
      where: { createdById: id, status: 'COMPLETED' },
    });

    const revenueAgg = await prisma.sale.aggregate({
      where: { createdById: id, status: 'COMPLETED' },
      _sum: { grandTotal: true },
    });

    const totalRevenue = Math.round((revenueAgg._sum.grandTotal || 0) * 100) / 100;
    const averageOrderValue = totalSalesCount > 0 ? Math.round((totalRevenue / totalSalesCount) * 100) / 100 : 0;

    // Today's metrics
    const todaySalesCount = await prisma.sale.count({
      where: { createdById: id, status: 'COMPLETED', saleDate: { gte: startOfToday } },
    });

    const todayRevenueAgg = await prisma.sale.aggregate({
      where: { createdById: id, status: 'COMPLETED', saleDate: { gte: startOfToday } },
      _sum: { grandTotal: true },
    });
    const todayRevenue = Math.round((todayRevenueAgg._sum.grandTotal || 0) * 100) / 100;

    // Recent 10 sales
    const recentSales = await prisma.sale.findMany({
      where: { createdById: id },
      orderBy: { saleDate: 'desc' },
      take: 10,
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    // Recent 15 audit logs for this user
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      success: true,
      data: {
        user: safeUser,
        metrics: {
          totalSalesCount,
          totalRevenue,
          averageOrderValue,
          todaySalesCount,
          todayRevenue,
        },
        recentSales,
        recentAuditLogs,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all roles and system permissions
 */
export const getRolesAndPermissions = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });

    return res.json({
      success: true,
      data: {
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.permissions.map((p) => p.permission.name),
        })),
        systemPermissions: permissions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update permissions assigned to a role
 */
export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleName } = req.params;
    const { permissionNames } = req.body;

    if (!Array.isArray(permissionNames)) {
      return res.status(400).json({
        success: false,
        message: 'permissionNames array is required',
      });
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: `Role '${roleName}' not found` });
    }

    // Owner role must always retain core administrative permissions
    if (role.name === 'OWNER') {
      const requiredOwnerPerms = ['USERS_MANAGE', 'SETTINGS_MANAGE'];
      for (const reqPerm of requiredOwnerPerms) {
        if (!permissionNames.includes(reqPerm)) {
          return res.status(400).json({
            success: false,
            message: `Cannot remove critical permission '${reqPerm}' from OWNER role.`,
          });
        }
      }
    }

    // Find permissions to connect
    const targetPerms = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Insert new role permissions
    for (const p of targetPerms) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entityName: 'Role',
      entityId: role.id,
      newValues: { role: role.name, permissions: permissionNames },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Permissions updated for role ${role.name}`,
      data: {
        roleName: role.name,
        permissions: permissionNames,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
