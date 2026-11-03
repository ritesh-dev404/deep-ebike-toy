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
    const msg = error?.message || 'Unknown database error';
    let userHint = msg;
    if (msg.includes('the URL must start with the protocol') || msg.includes('NEON_DATABASE_URL')) {
      userHint = 'Database connection URL is missing or invalid. Please verify NEON_DATABASE_URL is set in Render Environment Variables with format postgresql://...';
    }
    return res.status(500).json({ success: false, message: userHint, error: msg });
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
 * Login handler supporting both Owner and Employee accounts with role verification
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, expectedRole } = req.body;

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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Role verification if specified by client login tab
    if (expectedRole === 'OWNER' && user.role.name !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This login is for Store Owners only. Please switch to the Employee Login tab.',
      });
    }

    if (expectedRole === 'EMPLOYEE' && user.role.name !== 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This login is for Employees only. Please switch to the Owner Login tab.',
      });
    }

    // Check account status & owner approval
    if (!user.isActive) {
      if (!user.lastLogin) {
        return res.status(403).json({
          success: false,
          message: 'Your registration is pending approval by the Store Owner. Please contact the owner to activate your account.',
          status: 'PENDING_APPROVAL',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact store owner.',
        status: 'DEACTIVATED',
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
 * Self-registration for new Employees
 * Creates an account in PENDING_APPROVAL status (isActive: false).
 * Store Owner must approve in Employee Management before the employee can log in.
 */
export const registerEmployee = async (req: Request, res: Response) => {
  try {
    const { fullName, username, phone, password, confirmPassword } = req.body;

    if (!fullName || !username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, unique username, mobile number, and password are required.',
      });
    }

    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.trim().replace(/[\s\-()]/g, '');

    if (trimmedFullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long.',
      });
    }

    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.',
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores.',
      });
    }

    if (trimmedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify your password.',
      });
    }

    // Check if username or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { phone: trimmedPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === trimmedUsername) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken. Please choose another username.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered.',
      });
    }

    // Ensure EMPLOYEE role exists
    const { employeeRole } = await ensureSystemRolesAndPermissions();

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const newEmployee = await prisma.user.create({
      data: {
        fullName: trimmedFullName,
        username: trimmedUsername,
        phone: trimmedPhone,
        passwordHash,
        roleId: employeeRole.id,
        isActive: false, // PENDING APPROVAL: requires owner approval
      },
      include: {
        role: true,
      },
    });

    await logAudit({
      userId: newEmployee.id,
      action: 'REGISTER_EMPLOYEE_PENDING',
      entityName: 'User',
      entityId: newEmployee.id,
      newValues: {
        username: newEmployee.username,
        fullName: newEmployee.fullName,
        phone: newEmployee.phone,
        status: 'PENDING_APPROVAL',
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee registration submitted successfully! Your account is pending Owner approval before you can log in.',
      data: {
        id: newEmployee.id,
        username: newEmployee.username,
        fullName: newEmployee.fullName,
        phone: newEmployee.phone,
        role: newEmployee.role.name,
        status: 'PENDING_APPROVAL',
      },
    });
  } catch (error: any) {
    console.error('registerEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process employee registration.',
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
