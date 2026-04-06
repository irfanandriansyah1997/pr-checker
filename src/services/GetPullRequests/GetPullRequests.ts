import type { GetPullrequestsRootAPIResponseType } from './GetPullrequests.contract';
import type { GetPullRequestsFetchAPIFnType } from './GetPullRequests.types';

import { GITHUB_API_PER_PAGE } from '@/constants';
import type { GithubPullRequestType } from '@/entities/github';

export const GetPullRequests: GetPullRequestsFetchAPIFnType = async (args) => {
  const {
    accumulatedData = [],
    defaultReviewers,
    excludedConfig: { excludedLabels, excludedReviewers },
    githubCredential: { githubToken, orgName, repositoryName },
    page = 1
  } = args;

  try {
    const url = new URL(
      `https://api.github.com/repos/${orgName}/${repositoryName}/pulls`
    );
    url.searchParams.set('state', 'open');
    url.searchParams.set('per_page', GITHUB_API_PER_PAGE.toString());
    url.searchParams.set('page', page.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${githubToken}`
      }
    });

    const rawResponseAPI =
      (await response.json()) as GetPullrequestsRootAPIResponseType;

    if (
      typeof rawResponseAPI === 'object' &&
      rawResponseAPI !== null &&
      Array.isArray(rawResponseAPI)
    ) {
      const pullRequests = rawResponseAPI.reduce<GithubPullRequestType[]>(
        (acc, item) => {
          if (
            item &&
            item.user &&
            item.user.login &&
            item.created_at &&
            item.labels &&
            item.number &&
            item.title &&
            Array.isArray(item.labels) &&
            Array.isArray(item.requested_reviewers) &&
            item.html_url
          ) {
            const {
              created_at,
              html_url,
              labels,
              number,
              title,
              user: { login: author }
            } = item;

            let formattedRequestedReviewers = item.requested_reviewers.reduce<
              string[]
            >((result, reviewer) => {
              if (
                reviewer &&
                reviewer.login &&
                !excludedReviewers.includes(reviewer.login)
              ) {
                result.push(reviewer.login);
              }
              return result;
            }, []);

            formattedRequestedReviewers = defaultReviewers.reduce<string[]>(
              (result, user) => {
                if (!result.includes(user) && author !== user) {
                  result.push(user);
                }
                return result;
              },
              formattedRequestedReviewers
            );

            const formattedLabels = labels.reduce<string[]>((result, label) => {
              if (label && label.name && !excludedLabels.includes(label.name)) {
                result.push(label.name);
              }
              return result;
            }, []);

            acc.push({
              author,
              createdDate: new Date(created_at),
              labels: formattedLabels,
              number: Number(number),
              requestedReviewers: formattedRequestedReviewers,
              title,
              url: new URL(html_url).toString()
            });
          }
          return acc;
        },
        []
      );

      if (pullRequests.length > 0) {
        return GetPullRequests({
          ...args,
          accumulatedData: [...accumulatedData, ...pullRequests],
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
