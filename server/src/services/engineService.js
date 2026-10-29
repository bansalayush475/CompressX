const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const ENGINE_BIN = path.resolve(__dirname, '..', '..', '..', 'bin', 'compressx.exe');

function runEngine(args) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(ENGINE_BIN)) {
      return reject(new Error(`CompressX engine binary not found at ${ENGINE_BIN}`));
    }

    execFile(ENGINE_BIN, args, { maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (stdout) {
        try {
          const parsed = JSON.parse(stdout.trim());
          if (error && !parsed.success) {
            return resolve(parsed);
          }
          return resolve(parsed);
        } catch (e) {
          // If stdout is not JSON, check stderr
          if (error) {
            return reject(new Error(stderr || stdout || error.message));
          }
          return resolve({ rawOutput: stdout });
        }
      }

      if (error) {
        return reject(new Error(stderr || error.message));
      }

      resolve({ success: true });
    });
  });
}

async function compress(inputPath, outputPath, algorithm = 'auto', originalFilename = '') {
  const args = [
    'compress',
    '--input', inputPath,
    '--output', outputPath,
    '--algo', algorithm.toLowerCase()
  ];
  if (originalFilename) {
    args.push('--filename', originalFilename);
  }
  return await runEngine(args);
}

async function decompress(inputPath, outputPath) {
  const args = ['decompress', '--input', inputPath, '--output', outputPath];
  return await runEngine(args);
}

async function compare(inputPath) {
  const args = ['compare', '--input', inputPath];
  return await runEngine(args);
}

async function visualize({ inputPath, rawText } = {}) {
  const args = ['visualize'];
  if (inputPath) {
    args.push('--input', inputPath);
  } else if (rawText) {
    args.push('--text', rawText);
  } else {
    throw new Error('Either inputPath or rawText must be supplied for visualizer');
  }
  return await runEngine(args);
}

async function getContainerInfo(inputPath) {
  const args = ['info', '--input', inputPath];
  return await runEngine(args);
}

module.exports = {
  ENGINE_BIN,
  compress,
  decompress,
  compare,
  visualize,
  getContainerInfo
};
