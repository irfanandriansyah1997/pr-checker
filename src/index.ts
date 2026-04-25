import { formatDistanceToNow } from 'date-fns';

import type {
  GithubCredentialType,
  GithubPRReviewType,
  GithubReviewedPRType
} from './entities/github';
import { GithubPRReviewStateEnum } from './entities/github';
import GetPRReviews from './services/GetPRReviews/GetPRReviews';
import { GetPullRequests } from './services/GetPullRequests/GetPullRequests';

console.log('pr-checker 123');

interface GetApprovalInfoArgs {
  excludedReviewers: string[];
  reviews: GithubPRReviewType[];
}

function getApprovalInfo(args: GetApprovalInfoArgs): string[] {
  const { excludedReviewers, reviews } = args;
  const latestByUser = new Map<string, GithubPRReviewStateEnum>();

  for (const r of reviews) {
    if (excludedReviewers.includes(r.reviewer)) continue;

    if (r.state === 'COMMENTED') continue;

    if (r.state === 'DISMISSED') {
      latestByUser.clear();
      continue;
    }

    latestByUser.set(r.reviewer, r.state);
  }

  const approvers: string[] = [];
  for (const [login, state] of latestByUser.entries()) {
    if (state === 'APPROVED') approvers.push(login);
  }

  return approvers;
}

interface PendingPRConfigType {
  approvedNotMergedDeadline?: number;
  escalationReviewDeadline?: number;
  needReviewDeadline?: number;
}

interface GetPendingPRsArgs {
  defaultReviewers: string[];
  excludedLabels: string[];
  excludedReviewers: string[];
  githubCredential: GithubCredentialType;
  pendingPRConfig?: PendingPRConfigType;
}

interface GetPendingPRsResultType {
  approvedNotMerged: GithubReviewedPRType[];
  escalationReview: GithubReviewedPRType[];
  needsReview: GithubReviewedPRType[];
}

export const getPendingPRs = async (
  args: GetPendingPRsArgs
): Promise<GetPendingPRsResultType> => {
  const {
    defaultReviewers,
    excludedLabels,
    excludedReviewers,
    githubCredential,
    pendingPRConfig: {
      approvedNotMergedDeadline = 2,
      escalationReviewDeadline = 3,
      needReviewDeadline = 1
    } = {}
  } = args;
  const eligiblePRs = await GetPullRequests({
    defaultReviewers,
    excludedConfig: { excludedLabels, excludedReviewers },
    githubCredential
  });

  const reviewsByPR = await Promise.all(
    eligiblePRs.data.map((pr) =>
      GetPRReviews({ githubCredential, prNumber: pr.number })
    )
  );

  const needsReview: GithubReviewedPRType[] = [];
  const escalationReview: GithubReviewedPRType[] = [];
  const approvedNotMerged: GithubReviewedPRType[] = [];

  for (let i = 0; i < eligiblePRs.data.length; i++) {
    const currentPR = eligiblePRs.data[i];
    const currentPRReviews = reviewsByPR[i].data;

    const createdAt = currentPR.createdDate;
    const now = new Date();
    // @ts-expect-error irfanandriansyah10@gmail.com expected error for date difference
    const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    const approvers = getApprovalInfo({
      excludedReviewers,
      reviews: currentPRReviews
    });
    const reviewed = currentPRReviews.some((r) => {
      const isCommented = r.state === GithubPRReviewStateEnum.COMMENTED;
      const isApproved = r.state === GithubPRReviewStateEnum.APPROVED;
      return isCommented || isApproved;
    });

    const formattedPR: GithubReviewedPRType = {
      ...currentPR,
      ageDays: formatDistanceToNow(createdAt, {
        addSuffix: true
      }),
      approvers
    };

    const needToFollowUp = !reviewed || approvers.length < 2;

    if (needToFollowUp && ageDays > (escalationReviewDeadline ?? 3))
      escalationReview.push(formattedPR);
    else if (needToFollowUp && ageDays > (needReviewDeadline ?? 1))
      needsReview.push(formattedPR);

    if (approvers.length >= approvedNotMergedDeadline)
      approvedNotMerged.push(formattedPR);
  }

  return { approvedNotMerged, escalationReview, needsReview };
};
