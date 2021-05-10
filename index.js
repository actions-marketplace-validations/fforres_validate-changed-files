const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");
const minimatch = require("minimatch");
const globby = require("globby");

const areSetsEqual = (a, b) =>
  a.size === b.size && [...a].every((value) => b.has(value));

const failModes = ["soft", "hard"];
const comparisonModes = ["contains", "exact"];
async function run() {
  // Variables
  const githubToken = core.getInput("token", { required: true });
  const filePatterns = JSON.parse(
    core.getInput("file-patterns", { required: true })
  );
  const comparisonMode =
    core.getInput("comparison-mode", { required: false }) || "contains";
  const failMode = core.getInput("fail-mode", { required: false }) || "soft";

  // Checks
  if (typeof filePatterns !== "object" || !filePatterns.length) {
    core.setFailed("Please fill in the correct file names");
  }
  if (!comparisonModes.includes(comparisonMode)) {
    core.setFailed(`Unsupported comparison mode "${comparisonMode}"`);
  }
  if (!failModes.includes(failMode)) {
    core.setFailed(`Unsupported fail mode "${failMode}"`);
  }

  const client = getOctokit(githubToken);

  const [base, head] = (() => {
    if (context.eventName === "pull_request") {
      const pr = context.payload.pull_request;

      return [pr.base.sha, pr.head.sha];
    } else {
      const compareURL = context.payload.compare;

      const endPoint = compareURL.lastIndexOf("/");

      if (endPoint === -1) {
        core.setFailed("Endpoint not found");
      }

      return compareURL.substring(endPoint + 1).split("...");
    }
  })();

  const changedFileNames = (
    await client.repos.compareCommits({
      ...context.repo,
      base,
      head,
    })
  ).data.files.map((f) => f.filename);

  const filesToCheck = await globby(filePatterns);

  if (comparisonMode === "exact") {
    const changedFilesNamesSet = new Set(changedFileNames);
    const filesToCheckSet = new Set(filesToCheck);
    if (areSetsEqual(changedFilesNamesSet, filesToCheckSet)) {
      core.setOutput("success", true);
    } else {
      if (failMode === "soft") {
        core.setOutput("success", false);
      } else {
        core.setFailed(`Please check your changed files.
  Expected: ${JSON.stringify(Array.from(changedFilesNamesSet), null, 2)}
  Actual: ${JSON.stringify(Array.from(changedFileNames), null, 2)}
  `);
      }
    }
  } else if (comparisonMode === "contains") {
    const isAllIncluded = filePatterns.every(
      (filePattern) =>
        !!changedFileNames.find((file) => minimatch(file, filePattern))
    );

    if (isAllIncluded) {
      core.setOutput("success", true);
    } else {
      if (failMode === "soft") {
        core.setOutput("success", false);
      } else {
        core.setFailed(`Please check your changed files
Expected: ${JSON.stringify(filePatterns, null, 2)}
Actual: ${JSON.stringify(changedFileNames, null, 2)}
`);
      }
    }
  }
}

run();
