const { execSync } = require('child_process');
const net = require('net');

async function checkNetwork() {
    console.log('--- Tailscale Network Connectivity Check ---');

    // 1. Check Tailscale Status
    try {
        const status = execSync('tailscale status', { encoding: 'utf8' });
        console.log('✅ Tailscale is running.');
    } catch (error) {
        console.log('❌ Tailscale is NOT running or not installed.');
        return;
    }

    // 2. Check Database Node (Server)
    const serverIP = '100.101.241.108';
    const serverPort = 3308;

    console.log(`Checking connectivity to Database Server (${serverIP}:${serverPort})...`);

    const checkPort = (ip, port) => {
        return new Promise((resolve) => {
            const client = new net.Socket();
            client.setTimeout(5000);
            client.connect(port, ip, () => {
                client.destroy();
                resolve(true);
            }).on('error', () => {
                client.destroy();
                resolve(false);
            }).on('timeout', () => {
                client.destroy();
                resolve(false);
            });
        });
    };

    const isConnected = await checkPort(serverIP, serverPort);

    if (isConnected) {
        console.log('✅ Success: Database server is reachable over Tailscale.');
    } else {
        console.log('❌ Failure: Could not reach database server. Check your Tailscale connection or server status.');
    }
}

checkNetwork();
