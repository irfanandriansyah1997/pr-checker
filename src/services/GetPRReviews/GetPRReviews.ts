import type { GetPrreviewsRootAPIResponseType } from './GetPrreviews.contract';
import type { GetPRReviewsFetchAPIFnType } from './GetPRReviews.types';

import { GITHUB_API_PER_PAGE } from '@/constants';
import type { GithubPRReviewType } from '@/entities/github';
import { GithubPRReviewStateEnum } from '@/entities/github';

const GITHUB_REVIEW_STATE_ENUM: Record<string, GithubPRReviewStateEnum> = {
  APPROVED: GithubPRReviewStateEnum.APPROVED,
  CHANGES_REQUESTED: GithubPRReviewStateEnum.CHANGES_REQUESTED,
  COMMENTED: GithubPRReviewStateEnum.COMMENTED,
  DISMISSED: GithubPRReviewStateEnum.DISMISSED,
  PENDING: GithubPRReviewStateEnum.PENDING
};

const GetPRReviews: GetPRReviewsFetchAPIFnType = async (args) => {
  const {
    accumulatedData = [],
    githubCredential: { githubToken, orgName, repositoryName },
    page = 1,
    prNumber
  } = args;

  try {
    const url = new URL(
      `https://api.github.com/repos/${orgName}/${repositoryName}/pulls/${prNumber}/reviews`
    );
    url.searchParams.set('per_page', GITHUB_API_PER_PAGE.toString());
    url.searchParams.set('page', page.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${githubToken}`
      }
    });

    const rawResponseAPI =
      (await response.json()) as GetPrreviewsRootAPIResponseType;

    if (
      typeof rawResponseAPI === 'object' &&
      rawResponseAPI !== null &&
      Array.isArray(rawResponseAPI)
    ) {
      const reviews = rawResponseAPI.reduce<GithubPRReviewType[]>(
        (acc, item) => {
          if (
            item &&
            typeof item.submitted_at === 'string' &&
            item.user &&
            item.user.login &&
            item.state
          ) {
            const {
              submitted_at,
              user: { login: reviewerName }
            } = item;

            const state = GITHUB_REVIEW_STATE_ENUM[item.state];
            if (!state) return acc;

            acc.push({
              reviewer: reviewerName,
              state,
              submittedAt: new Date(submitted_at)
            });
          }
          return acc;
        },
        []
      );

      if (reviews.length > 0) {
        return GetPRReviews({
          ...args,
          accumulatedData: [...accumulatedData, ...reviews],
          page: page + 1
        });
      }
    }

    throw new Error();
  } catch {
    return {
      data: accumulatedData
    };
  }
};

export default GetPRReviews;
