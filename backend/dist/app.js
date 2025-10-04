"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const images_1 = __importDefault(require("./routes/images"));
const tags_1 = __importDefault(require("./routes/tags"));
const database_1 = require("./config/database");
const pythonSetup_1 = require("./utils/pythonSetup");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await (0, pythonSetup_1.setupPythonEnvironment)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
    (0, database_1.connectDatabase)();
    (0, images_1.default)(app);
    (0, tags_1.default)(app);
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};
startServer();
