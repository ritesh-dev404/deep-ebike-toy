import { User, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        fullName: string;
        roleName: string;
        roleId: string;
      };
    }
  }
}
