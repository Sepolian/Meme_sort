"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setTagRoutes;
const express_1 = require("express");
const tagController_1 = __importDefault(require("../controllers/tagController"));
const router = (0, express_1.Router)();
router.post('/', tagController_1.default.createTag.bind(tagController_1.default));
router.get('/', tagController_1.default.getTags.bind(tagController_1.default));
function setTagRoutes(app) {
    app.use('/api/tags', router);
}
