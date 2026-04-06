export interface GithubPRFilterExclusionType {
  excludedLabels: string[];
  excludedReviewers: string[];
}

export interface GithubCredentialType {
  githubToken: string;
  orgName: string;
  repositoryName: string;
}

export interface GithubPullRequestType {
  author: string;
  createdDate: Date;
  labels: string[];
  number: number;
  requestedReviewers: string[];
  title: string;
  url: string;
}

export enum GithubPRReviewStateEnum {
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  COMMENTED = 'COMMENTED',
  DISMISSED = 'DISMISSED',
  PENDING = 'PENDING'
}

export interface GithubPRReviewType {
  reviewer: string;
  state: GithubPRReviewStateEnum;
  submittedAt: Date;
}

export interface GithubPRReviewResultType {
  approvers: string[];
  reviews: GithubPRReviewType[];
}

export interface GithubReviewedPRType extends GithubPullRequestType {
  ageDays: string;
  approvers: string[];
}
