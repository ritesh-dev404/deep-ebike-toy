import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return res.json({ success: true, data: customers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerByPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
      include: {
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 5,
          select: {
            id: true,
            invoiceNumber: true,
            saleDate: true,
            grandTotal: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }

    const existing = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_CUSTOMER',
      entityName: 'Customer',
      entityId: customer.id,
      newValues: customer,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, address, phone } = req.body;

    if (phone?.trim()) {
      const existing = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, message: 'Phone number already registered to another customer' });
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        address: address !== undefined ? address.trim() : undefined,
      },
    });

    return res.json({ success: true, message: 'Customer updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
