import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    user: {
        id: string;
    };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        res.status(401).json({ success: false, error: 'No token, authorization denied' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // @ts-ignore
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Token is not valid' });
    }
};
