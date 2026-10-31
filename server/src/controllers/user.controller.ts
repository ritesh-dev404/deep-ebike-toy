import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: { select: { id: true, name: true, description: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map((u) => {
      const { passwordHash, ...safe } = u;
      return safe;
    });

    return res.json({ success: true, data: safeUsers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, phone, roleName } = req.body;

    if (!username || !password || !fullName || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Username, Password, Full Name, and Role are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: email?.trim() || undefined }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email is already registered' });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ success: false, message: `Role '${roleName}' does not exist` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        roleId: role.id,
        isActive: true,
      },
      include: { role: true },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_USER',
      entityName: 'User',
      entityId: user.id,
      newValues: { username: user.username, role: role.name },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({ success: true, message: 'User created successfully', data: safeUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, roleName, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) updateData.roleId = role.id;
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
      newValues: { fullName: updated.fullName, isActive: updated.isActive },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = updated;
    return res.json({ success: true, message: 'User updated successfully', data: safeUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
