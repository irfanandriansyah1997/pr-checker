# PR Checker

A configurable tool to fetch and monitor pull requests, detect unreviewed and stale PRs, and help teams prioritize reviews and merges.

## Installation

```bash
pnpm add @darth_sith_99/pr-checker $(pnpm info @darth_sith_99/pr-checker peerDependencies --json  | jq -r 'keys[]')
```

## Usage

```typescript
import { getPendingPRs } from "@darth_sith_99/pr-checker";

const result = await getPendingPRs({
  githubCredential: {
    githubToken: "ghp_xxxxxxxxxxxx",
    orgName: "your-org",
    repositoryName: "your-repo",
  },
  defaultReviewers: ["reviewer-1", "reviewer-2"],
  excludedLabels: ["draft", "still-in-progress", "skip-pr-checker"],
  excludedReviewers: ["cursor[bot]"],
  pendingPRConfig: {
    needReviewDeadline: 1, // days (default: 1)
    escalationReviewDeadline: 3, // days (default: 3)
    approvedNotMergedDeadline: 2, // min approvals (default: 2)
  },
});
```

## Arguments

`getPendingPRs` accepts a single object with the following properties:

| Argument            | Type                   | Required | Description                                                                       |
| ------------------- | ---------------------- | -------- | --------------------------------------------------------------------------------- |
| `githubCredential`  | `GithubCredentialType` | Yes      | GitHub authentication and repository info                                         |
| `defaultReviewers`  | `string[]`             | Yes      | List of default reviewer usernames to assign when a PR has no requested reviewers |
| `excludedLabels`    | `string[]`             | Yes      | PRs with any of these labels will be skipped entirely                             |
| `excludedReviewers` | `string[]`             | Yes      | Reviews from these users (e.g. bots) are ignored when counting approvals          |
| `pendingPRConfig`   | `PendingPRConfigType`  | No       | Custom thresholds for categorizing PRs (see below)                                |

### `githubCredential`

| Field            | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `githubToken`    | `string` | GitHub personal access token with repo read access |
| `orgName`        | `string` | GitHub organization or user name                   |
| `repositoryName` | `string` | Repository name                                    |

### `pendingPRConfig`

All fields are optional and fall back to sensible defaults if not provided.

| Field                       | Type     | Default | Description                                                               |
| --------------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| `needReviewDeadline`        | `number` | `1`     | Minimum age in days before a PR appears in `needsReview`                  |
| `escalationReviewDeadline`  | `number` | `3`     | Minimum age in days before a PR appears in `escalationReview`             |
| `approvedNotMergedDeadline` | `number` | `2`     | Minimum number of approvals required for a PR to appear in `approvedNotMerged` |

## Output

`getPendingPRs` returns a `Promise` that resolves to an object with three categorized arrays:

```typescript
interface GetPendingPRsResultType {
  needsReview: GithubReviewedPRType[];
  escalationReview: GithubReviewedPRType[];
  approvedNotMerged: GithubReviewedPRType[];
}
```

### Categories

| Category            | Condition                                                                                                    | Description                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `needsReview`       | Age > `needReviewDeadline` days (default 1), not yet commented/approved, or fewer than required approvals     | PRs that need attention from reviewers. Either no engineer has reviewed yet, or the PR hasn't reached the minimum approval threshold.                                   |
| `escalationReview`  | Age > `escalationReviewDeadline` days (default 3), not yet commented/approved, or fewer than required approvals | Same criteria as `needsReview` but the PR has been open longer and requires escalation. Takes priority over `needsReview` (a PR appears in one or the other, not both). |
| `approvedNotMerged` | Has >= `approvedNotMergedDeadline` approvals (default 2) but still open                                       | PRs that have met the approval threshold and should be merged.                                                                                                          |

### PR Item Shape

Each item in the output arrays has the following shape:

| Field                | Type       | Description                                                                      |
| -------------------- | ---------- | -------------------------------------------------------------------------------- |
| `title`              | `string`   | PR title                                                                         |
| `url`                | `string`   | Link to the PR on GitHub                                                         |
| `author`             | `string`   | GitHub username of the PR author                                                 |
| `createdDate`        | `Date`     | When the PR was created                                                          |
| `ageDays`            | `string`   | Human-readable age (e.g. `"2 days ago"`, `"about 1 month ago"`)                  |
| `labels`             | `string[]` | Labels attached to the PR                                                        |
| `number`             | `number`   | PR number                                                                        |
| `requestedReviewers` | `string[]` | Reviewers who haven't taken action yet (already-reviewed users are filtered out) |
| `approvers`          | `string[]` | Usernames of engineers whose latest review state is `APPROVED`                   |

## Approval Logic

- Only **unique approvers** are counted (one approval per engineer).
- A reviewer's approval is invalidated if their latest review state is `CHANGES_REQUESTED`.
- If any review has state `DISMISSED`, **all prior approvals are reset to zero**. Approvals submitted after the dismissal still count.
- Reviews from users in `excludedReviewers` (e.g. `cursor[bot]`) are completely ignored for both approval counting and review detection.
- `COMMENTED` reviews do not change a reviewer's approval state.
