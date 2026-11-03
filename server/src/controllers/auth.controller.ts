import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { ENV } from '../config/env';
import { logAudit } from '../services/audit.service';
import { ensureSystemRolesAndPermissions } from '../services/setup.service';

/**
 * Check whether the system needs initial first-time owner setup
 */
export const getSetupStatus = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    return res.json({
      success: true,
      data: {
        setupRequired: userCount === 0,
        userCount,
      },
    });
  } catch (error: any) {
    console.error('getSetupStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initial first-time setup for the Store Owner account.
 * Only permitted when 0 users exist in the database.
 */
export const initialSetup = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'First-time setup has already been completed. An Owner account already exists.',
      });
    }

    const { username, password, fullName, email, phone } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and full name are required for initial Owner setup.',
      });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Ensure system roles, permissions, and basic settings exist
    const { ownerRole } = await ensureSystemRolesAndPermissions();

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        passwordHash,
        fullName: fullName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        roleId: ownerRole.id,
        isActive: true,
        lastLogin: new Date(),
      },
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
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        roleName: user.role.name,
        roleId: user.roleId,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'SETUP_INITIAL_OWNER',
      entityName: 'User',
      entityId: user.id,
      newValues: { username: user.username, role: user.role.name },
      ipAddress: req.ip,
    });

    const permissions = user.role.permissions.map((p) => p.permission.name);

    return res.status(201).json({
      success: true,
      message: 'Store Owner account initialized successfully.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          permissions,
        },
      },
    });
  } catch (error: any) {
    console.error('initialSetup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize store owner account.',
      error: error.message,
    });
  }
};

/**
 * Login handler supporting both Owner and Employee accounts
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const trimmedIdentifier = username.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: trimmedIdentifier }, { email: trimmedIdentifier }],
      },
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
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact store owner.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        roleName: user.role.name,
        roleId: user.roleId,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entityName: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    const permissions = user.role.permissions.map((p) => p.permission.name);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          permissions,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message,
    });
  }
};

/**
 * Secure logout with audit logging
 */
export const logout = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'LOGOUT',
        entityName: 'User',
        entityId: req.user.id,
        ipAddress: req.ip,
      });
    }
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get profile of current logged-in user
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const permissions = user.role.permissions.map((p) => p.permission.name);

    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        permissions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Self-service password change for logged-in user
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await logAudit({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entityName: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
