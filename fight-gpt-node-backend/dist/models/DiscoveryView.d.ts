import mongoose, { Document } from 'mongoose';
export interface IDiscoveryView extends Document {
    user_id: string;
    analysis_id: string;
    last_viewed_at: Date;
}
export declare const DiscoveryView: mongoose.Model<IDiscoveryView, {}, {}, {}, mongoose.Document<unknown, {}, IDiscoveryView, {}, {}> & IDiscoveryView & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DiscoveryView.d.ts.map