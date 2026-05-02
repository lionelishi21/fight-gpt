import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
export declare class AdminRoutes {
    private readonly adminController;
    private router;
    constructor(adminController: AdminController);
    private setupRoutes;
    getRouter(): Router;
}
//# sourceMappingURL=adminRoutes.d.ts.map