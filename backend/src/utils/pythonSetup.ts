import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const VENV_DIR = path.join(__dirname, '../../.venv');
const CHECK_FILE = path.join(VENV_DIR, '.python_deps_installed');
const REQUIREMENTS_FILE = path.join(__dirname, '../scripts/requirements.txt');
const PYTHON_EXEC = process.platform === 'win32' 
    ? path.join(VENV_DIR, 'Scripts', 'python.exe') 
    : path.join(VENV_DIR, 'bin', 'python');

const checkGlobalPython = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const pythonProcess = spawn('python', ['--version']);
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
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

const createVenv = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.log(`Creating Python virtual environment at ${VENV_DIR}...`);
        const venvProcess = spawn('python', ['-m', 'venv', VENV_DIR]);
        venvProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Virtual environment created.');
                resolve();
            } else {
                console.error('Failed to create virtual environment.');
                reject(new Error('venv creation failed'));
            }
        });
    });
};

const installDependencies = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.log('Installing Python dependencies into virtual environment...');
        const pipProcess = spawn(PYTHON_EXEC, ['-m', 'pip', 'install', '-r', REQUIREMENTS_FILE]);

        pipProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        pipProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        pipProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Python dependencies installed successfully.');
                fs.writeFileSync(CHECK_FILE, 'installed');
                resolve();
            } else {
                console.error('Failed to install Python dependencies.');
                reject(new Error('pip install failed'));
            }
        });
    });
};

export const setupPythonEnvironment = async () => {
    if (fs.existsSync(CHECK_FILE)) {
        return;
    }

    if (!fs.existsSync(VENV_DIR)) {
        const hasGlobalPython = await checkGlobalPython();
        if (!hasGlobalPython) return;
        await createVenv();
    }

    if (fs.existsSync(REQUIREMENTS_FILE)) {
        await installDependencies();
    }
};

export const getPythonExecutable = () => {
    return fs.existsSync(PYTHON_EXEC) ? PYTHON_EXEC : 'python';
};