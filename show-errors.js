const fs = require('fs');
const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
} catch (e) {
  const lines = e.stdout.split('\n');
  for (const line of lines) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS/);
    if (match) {
      const file = match[1];
      const lineNum = parseInt(match[2], 10) - 1;
      const colNum = parseInt(match[3], 10) - 1;
      try {
        const content = fs.readFileSync(file, 'utf8').split('\n');
        console.log(`[${file}:${lineNum+1}] ${content[lineNum].trim()}`);
      } catch (err) {}
    }
  }
}
