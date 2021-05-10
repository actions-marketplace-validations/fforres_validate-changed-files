# Check Exact Files Changed

This action checks that a pull requests contain changes to the files listed in
the `file-patterns` array specified.

It adds an option for "exact" comparison type, that will fail if the files changed do not match the `file-patterns` option

### `file-patterns`

A `JSON stringified` array of possible files. Supports [minimatch](https://github.com/isaacs/minimatch)

### `comparison-type`

- `exact`. If the files changed on the PR must exactly match the list of files provided on `file-patterns`
- `contains`. If the files changed on the PR only has to contain the list of files provided on `file-patterns`

### `token`

The current github token

Credit to [syeutyu/validate-changed-files](https://github.com/syeutyu/validate-changed-files) for providing the base code

## Example

```yml
name: "build-test"
on:
  pull_request:
  push:
    branches:
      - "master"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Exact Files Changed
        uses: fforres/validate-changed-files@v1.0.3
        with:
          file-patterns: '["package.json"]'
          comparison-type: "exact"
          token: ${{ secrets.GITHUB_TOKEN }}
```
