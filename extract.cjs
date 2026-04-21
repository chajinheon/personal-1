const fs = require('fs');

const logPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\676c9cca-6e21-450a-b16a-e33ae06b4440\\.system_generated\\logs\\overview.txt';
const content = fs.readFileSync(logPath, 'utf8');

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'write_to_file' && call.args && call.args.TargetFile && call.args.TargetFile.includes('overview\\page.tsx') && data.created_at === '2026-04-20T12:49:01Z') {
          fs.writeFileSync('C:\\Users\\User\\Downloads\\jules_session_10722919624485643969\\overview_hardcoded.tsx', call.args.CodeContent);
          console.log('Saved to overview_hardcoded.tsx');
        }
      }
    }
  } catch (e) {}
}
