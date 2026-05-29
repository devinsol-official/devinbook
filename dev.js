const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const includeMobile = args.includes('--all');

const services = [
    { name: 'client', cwd: path.join(__dirname, 'client'), cmd: 'npm', args: ['run', 'dev'] },
    { name: 'server', cwd: path.join(__dirname, 'server'), cmd: 'npm', args: ['run', 'dev'] },
];

if (includeMobile) {
    services.push({ name: 'mobile', cwd: path.join(__dirname, 'mobile'), cmd: 'npm', args: ['start'] });
}

const colors = ['\x1b[36m', '\x1b[33m', '\x1b[35m']; // cyan, yellow, magenta
const reset = '\x1b[0m';

services.forEach((svc, i) => {
    const color = colors[i % colors.length];
    const prefix = `${color}[${svc.name}]${reset} `;

    const proc = spawn(svc.cmd, svc.args, {
        cwd: svc.cwd,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (data) => {
        data.toString().split('\n').filter(Boolean).forEach(line => {
            process.stdout.write(prefix + line + '\n');
        });
    });

    proc.stderr.on('data', (data) => {
        data.toString().split('\n').filter(Boolean).forEach(line => {
            process.stderr.write(prefix + line + '\n');
        });
    });

    proc.on('close', (code) => {
        console.log(`${prefix}exited with code ${code}`);
    });

    proc.on('error', (err) => {
        console.error(`${prefix}failed to start: ${err.message}`);
    });
});

console.log(`🚀 Starting: ${services.map(s => s.name).join(', ')}...\n`);
