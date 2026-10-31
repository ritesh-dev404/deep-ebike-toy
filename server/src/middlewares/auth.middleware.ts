import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import prisma from '../config/prisma';

export interface TokenPayload {
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
  roleId: string;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;

    // Verify user is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated or does not exist.',
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      roleName: user.role.name,
      roleId: user.roleId,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.roleName !== 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This action requires OWNER authorization.',
    });
  }
  next();
};

export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.roleName === 'OWNER') {
      return next(); // Owner has all permissions
    }

    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: req.user.roleId,
        permission: {
          name: permissionName,
        },
      },
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Missing required permission: ${permissionName}`,
      });
    }

    next();
  };
};
