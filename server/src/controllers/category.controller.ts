import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Category name and code are required' });
    }

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name or code already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim(),
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_CATEGORY',
      entityName: 'Category',
      entityId: category.id,
      newValues: category,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim(),
        code: code?.trim().toUpperCase(),
        description: description?.trim(),
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
