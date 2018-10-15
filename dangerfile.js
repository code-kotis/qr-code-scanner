const { readFileSync } = require('fs');
import { fail, message, danger, markdown, warn } from 'danger';

const { additions = 0, deletions = 0 } = danger.github.pr;

const currentBuildResults = JSON.parse(readFileSync('./stats.json'));

// For quick info, show how much changes this PR has
message(`:tada: The PR added ${additions} and removed ${deletions} lines. \n`);

// Show PR Changes
const modifiedFiles = danger.git.modified_files.join('\n - ');
message('Changed Files in this PR: \n - ' + modifiedFiles + '\n');

// Show warnings
warn(currentBuildResults.warnings);

// If build has error show errors
if (currentBuildResults.errors.length > 0) {
  currentBuildResults.errors.forEach(error => {
    fail(error);
  });
}
