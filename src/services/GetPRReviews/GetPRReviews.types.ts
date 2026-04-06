import type {
  GithubCredentialType,
  GithubPRReviewType
} from '@/entities/github';

export interface GetPRReviewsFetchAPIArgs {
  accumulatedData?: GithubPRReviewType[];
  githubCredential: GithubCredentialType;
  page?: number;
  prNumber: number;
}

export interface GetPRReviewsFetchAPIResponse {
  data: GithubPRReviewType[];
}

export type GetPRReviewsFetchAPIFnType = (
  args: GetPRReviewsFetchAPIArgs
) => Promise<GetPRReviewsFetchAPIResponse>;
