import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: suppliers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, phone, email, address, gstNumber, outstandingBalance } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Supplier name and phone are required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson?.trim(),
        phone: phone.trim(),
        email: email?.trim(),
        address: address?.trim(),
        gstNumber: gstNumber?.trim(),
        outstandingBalance: outstandingBalance ? parseFloat(outstandingBalance) : 0,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_SUPPLIER',
      entityName: 'Supplier',
      entityId: supplier.id,
      newValues: supplier,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Supplier added successfully', data: supplier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, gstNumber, outstandingBalance, status } = req.body;

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        contactPerson: contactPerson !== undefined ? contactPerson.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        address: address !== undefined ? address.trim() : undefined,
        gstNumber: gstNumber !== undefined ? gstNumber.trim() : undefined,
        outstandingBalance: outstandingBalance !== undefined ? parseFloat(outstandingBalance) : undefined,
        status: status || undefined,
      },
    });

    return res.json({ success: true, message: 'Supplier updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
