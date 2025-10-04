"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPythonExecutable = exports.setupPythonEnvironment = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const VENV_DIR = path_1.default.join(__dirname, '../../.venv');
const CHECK_FILE = path_1.default.join(VENV_DIR, '.python_deps_installed');
const REQUIREMENTS_FILE = path_1.default.join(__dirname, '../scripts/requirements.txt');
const PYTHON_EXEC = process.platform === 'win32'
    ? path_1.default.join(VENV_DIR, 'Scripts', 'python.exe')
    : path_1.default.join(VENV_DIR, 'bin', 'python');
const checkGlobalPython = () => {
    return new Promise((resolve) => {
        const pythonProcess = (0, child_process_1.spawn)('python', ['--version']);
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            }
            else {
                console.warn('Global Python is not installed or not in PATH. Please install Python 3.');
                resolve(false);
            }
        });
        pythonProcess.on('error', () => {
            console.warn('Global Python is not installed or not in PATH. Please install Python 3.');
            resolve(false);
        });
    });
};
const createVenv = () => {
    return new Promise((resolve, reject) => {
        console.log(`Creating Python virtual environment at ${VENV_DIR}...`);
        const venvProcess = (0, child_process_1.spawn)('python', ['-m', 'venv', VENV_DIR]);
        venvProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Virtual environment created.');
                resolve();
            }
            else {
                console.error('Failed to create virtual environment.');
                reject(new Error('venv creation failed'));
            }
        });
    });
};
const installDependencies = () => {
    return new Promise((resolve, reject) => {
        console.log('Installing Python dependencies into virtual environment...');
        const pipProcess = (0, child_process_1.spawn)(PYTHON_EXEC, ['-m', 'pip', 'install', '-r', REQUIREMENTS_FILE]);
        pipProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        pipProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
        pipProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Python dependencies installed successfully.');
                fs_1.default.writeFileSync(CHECK_FILE, 'installed');
                resolve();
            }
            else {
                console.error('Failed to install Python dependencies.');
                reject(new Error('pip install failed'));
            }
        });
    });
};
const setupPythonEnvironment = async () => {
    if (fs_1.default.existsSync(CHECK_FILE)) {
        return;
    }
    if (!fs_1.default.existsSync(VENV_DIR)) {
        const hasGlobalPython = await checkGlobalPython();
        if (!hasGlobalPython)
            return;
        await createVenv();
    }
    if (fs_1.default.existsSync(REQUIREMENTS_FILE)) {
        await installDependencies();
    }
};
exports.setupPythonEnvironment = setupPythonEnvironment;
const getPythonExecutable = () => {
    return fs_1.default.existsSync(PYTHON_EXEC) ? PYTHON_EXEC : 'python';
};
exports.getPythonExecutable = getPythonExecutable;
