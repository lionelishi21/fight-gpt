import { Router } from 'express';
import { UserController } from '../controllers/UserController';
export declare class UserRoutes {
    private readonly userController;
    private router;
    constructor(userController: UserController);
    private setupRoutes;
    getRouter(): Router;
}
export default UserRoutes;
//# sourceMappingURL=userRoutes.d.ts.map