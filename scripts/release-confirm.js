const readline = require('readline');
const { spawnSync } = require('child_process');

function getCurrentBranch() {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').trim();
}

function hasUncommittedChanges() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').trim().length > 0;
}

function runStep(command, args) {
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
  const result = spawnSync(executable, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const currentBranch = getCurrentBranch();

if (!currentBranch) {
  console.error('Could not determine current Git branch. Release blocked for safety.');
  process.exit(1);
}

if (currentBranch !== 'main') {
  console.error(`Release blocked. Current branch is "${currentBranch}". Switch to "main" to deploy production.`);
  process.exit(1);
}

const dirtyTree = hasUncommittedChanges();

if (dirtyTree === null) {
  console.error('Could not verify Git working tree status. Release blocked for safety.');
  process.exit(1);
}

if (dirtyTree) {
  console.error('Release blocked. You have uncommitted changes. Commit or stash changes before production deploy.');
  process.exit(1);
}

rl.question('Deploy to PRODUCTION now? (yes/no): ', (answer) => {
  const normalized = String(answer || '').trim().toLowerCase();

  if (normalized !== 'yes' && normalized !== 'y') {
    console.log('Release cancelled. No production deploy was made.');
    rl.close();
    process.exit(0);
  }

  rl.close();
  runStep('npm', ['run', 'build']);
  runStep('vercel', ['--prod', '--yes']);
});
