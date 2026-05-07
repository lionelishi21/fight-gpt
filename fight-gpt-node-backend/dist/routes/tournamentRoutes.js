"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournamentController_1 = require("../controllers/tournamentController");
const router = (0, express_1.Router)();
router.get('/', tournamentController_1.getUpcomingTournaments);
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map