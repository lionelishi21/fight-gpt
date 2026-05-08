"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArtistController = void 0;
const BaseController_1 = require("./BaseController");
class AdminArtistController extends BaseController_1.BaseController {
    service;
    constructor(service) {
        super();
        this.service = service;
    }
    // GET /api/admin/artists?status=pending_review&limit=20&offset=0
    listArtists = async (req, res) => {
        try {
            const { status, limit = '20', offset = '0' } = req.query;
            const result = await this.service.listArtists(status, parseInt(limit), parseInt(offset));
            res.json({ success: true, ...result });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to list artists');
        }
    };
    // GET /api/admin/artists/queue?status=queued&limit=50
    getQueue = async (req, res) => {
        try {
            const status = req.query.status || 'queued';
            const limit = parseInt(req.query.limit) || 50;
            const queue = await this.service.getQueue(status, limit);
            res.json({ success: true, data: queue });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get queue');
        }
    };
    // GET /api/admin/artists/reviews/:reviewId
    getReviewDetail = async (req, res) => {
        try {
            const detail = await this.service.getReviewDetail(req.params.reviewId);
            res.json({ success: true, data: detail });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get review');
        }
    };
    // POST /api/admin/artists/reviews/:reviewId/assign
    assignReview = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const review = await this.service.assignReview(req.params.reviewId, adminId);
            res.json({ success: true, data: review });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to assign review');
        }
    };
    // POST /api/admin/artists/reviews/:reviewId/comment
    addComment = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const { text, isInternal = true } = req.body;
            if (!text) {
                res.status(400).json({ success: false, error: 'text required' });
                return;
            }
            const review = await this.service.addComment(req.params.reviewId, adminId, text, isInternal);
            res.json({ success: true, data: review });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add comment');
        }
    };
    // PATCH /api/admin/artists/reviews/:reviewId/checklist/:index
    updateChecklist = async (req, res) => {
        try {
            const index = parseInt(req.params.index);
            const { passed, notes } = req.body;
            if (typeof passed !== 'boolean') {
                res.status(400).json({ success: false, error: 'passed (boolean) required' });
                return;
            }
            const review = await this.service.updateChecklist(req.params.reviewId, index, passed, notes);
            res.json({ success: true, data: review });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update checklist');
        }
    };
    // POST /api/admin/artists/reviews/:reviewId/approve
    approveArtist = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const { notes } = req.body;
            const profile = await this.service.approveArtist(req.params.reviewId, adminId, notes);
            res.json({ success: true, data: profile });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to approve artist');
        }
    };
    // POST /api/admin/artists/reviews/:reviewId/reject
    rejectArtist = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const { reason } = req.body;
            if (!reason) {
                res.status(400).json({ success: false, error: 'reason required' });
                return;
            }
            const profile = await this.service.rejectArtist(req.params.reviewId, adminId, reason);
            res.json({ success: true, data: profile });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to reject artist');
        }
    };
    // POST /api/admin/artists/reviews/:reviewId/more-info
    requestMoreInfo = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const { notes } = req.body;
            if (!notes) {
                res.status(400).json({ success: false, error: 'notes required' });
                return;
            }
            const review = await this.service.requestMoreInfo(req.params.reviewId, adminId, notes);
            res.json({ success: true, data: review });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to request more info');
        }
    };
    // GET /api/admin/artists/tracks/pending
    getPendingTracks = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const tracks = await this.service.getPendingTracks(limit);
            res.json({ success: true, data: tracks });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get pending tracks');
        }
    };
    // POST /api/admin/artists/tracks/:trackId/approve
    approveTrack = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const track = await this.service.approveTrack(req.params.trackId, adminId);
            res.json({ success: true, data: track });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to approve track');
        }
    };
    // POST /api/admin/artists/tracks/:trackId/reject
    rejectTrack = async (req, res) => {
        try {
            const adminId = req.user._id.toString();
            const { reason } = req.body;
            if (!reason) {
                res.status(400).json({ success: false, error: 'reason required' });
                return;
            }
            const track = await this.service.rejectTrack(req.params.trackId, adminId, reason);
            res.json({ success: true, data: track });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to reject track');
        }
    };
}
exports.AdminArtistController = AdminArtistController;
//# sourceMappingURL=AdminArtistController.js.map