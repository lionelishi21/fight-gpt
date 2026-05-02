import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
export interface IPaymentService {
    createCheckoutSession(userId: string, priceId: string): Promise<ApiResponse<{
        url: string;
    }>>;
    handleWebhook(payload: any, sig: string): Promise<ApiResponse<boolean>>;
}
export declare class PaymentService extends BaseService implements IPaymentService {
    private stripe;
    constructor();
    createCheckoutSession(userId: string, priceId: string): Promise<ApiResponse<{
        url: string;
    }>>;
    handleWebhook(payload: any, sig: string): Promise<ApiResponse<boolean>>;
}
//# sourceMappingURL=PaymentService.d.ts.map