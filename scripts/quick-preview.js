const readline = require('readline');
const { spawnSync } = require('child_process');

const isWin = process.platform === 'win32';
const gitCmd = isWin ? 'git.exe' : 'git';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function runStep(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').trim();
}

function getCurrentBranch() {
  return runCapture(gitCmd, ['rev-parse', '--abbrev-ref', 'HEAD']);
}

function hasUncommittedChanges() {
  const status = runCapture(gitCmd, ['status', '--porcelain']);
  if (status === null) {
    return null;
  }
  return status.length > 0;
}

function hasOriginRemote() {
  const remoteUrl = runCapture(gitCmd, ['remote', 'get-url', 'origin']);
  return Boolean(remoteUrl);
}

function stageProjectFiles() {
  // Stage source files only to avoid committing build/cache folders.
  runStep(gitCmd, ['add', 'app', 'components', 'lib', 'scripts', 'package.json']);
}

function commitPushAndPreview(commitMessage, shouldCommit) {
  const branch = getCurrentBranch();
  if (!branch) {
    console.error('Could not determine current Git branch. Aborting.');
    process.exit(1);
  }

  if (shouldCommit) {
    stageProjectFiles();
    runStep(gitCmd, ['commit', '-m', commitMessage]);
    if (hasOriginRemote()) {
      runStep(gitCmd, ['push', '-u', 'origin', branch]);
    } else {
      console.log('No origin remote configured. Skipping push and continuing preview deploy.');
    }
  } else {
    console.log('No changes detected. Skipping commit and push.');
  }

  runStep(npmCmd, ['run', 'deploy:preview']);
}

function main() {
  const dirty = hasUncommittedChanges();
  if (dirty === null) {
    console.error('Could not read Git status. Aborting.');
    process.exit(1);
  }

  if (!dirty) {
    commitPushAndPreview('', false);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Commit message for preview: ', (message) => {
    const commitMessage = String(message || '').trim();

    if (!commitMessage) {
      console.log('Cancelled. Commit message is required when there are changes.');
      rl.close();
      process.exit(0);
    }

    rl.close();
    commitPushAndPreview(commitMessage, true);
  });
}

main();
