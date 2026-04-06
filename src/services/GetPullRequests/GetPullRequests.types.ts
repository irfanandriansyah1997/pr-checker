import type {
  GithubCredentialType,
  GithubPRFilterExclusionType,
  GithubPullRequestType
} from '@/entities/github';

export interface GetPullRequestsFetchAPIArgs {
  accumulatedData?: GithubPullRequestType[];
  defaultReviewers: string[];
  excludedConfig: GithubPRFilterExclusionType;
  githubCredential: GithubCredentialType;
  page?: number;
}

export interface GetPullRequestsFetchAPIResponse {
  data: GithubPullRequestType[];
}

export type GetPullRequestsFetchAPIFnType = (
  args: GetPullRequestsFetchAPIArgs
) => Promise<GetPullRequestsFetchAPIResponse>;
