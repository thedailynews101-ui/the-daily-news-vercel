import { Request, Response } from "express";

import * as publicArticleService from "./publicArticle.service";
import * as publicWidgetsService from "./publicWidgets.service";
import { searchQuerySchema } from "./publicArticle.validation";
import config from "../../config";
import sendResponse from "../../utils/sendResponse";
import { ensureVoterKey } from "../../utils/voterKey";

export const getHome = async (_req: Request, res: Response) => {
  const layout = await publicArticleService.getHomeLayout();

  sendResponse(res, {
    statusCode: 200,
    message: "Homepage layout retrieved successfully.",
    data: layout,
  });
};

export const getWidgets = async (req: Request, res: Response) => {
  const voterKey = ensureVoterKey(req, res);
  const widgets = await publicWidgetsService.getPublicWidgets(voterKey, req.user?.id);

  sendResponse(res, {
    statusCode: 200,
    message: "Homepage widgets retrieved successfully.",
    data: widgets,
  });
};

/** Temporary debug endpoint for production cookie-mode checks. No secrets. */
export const getDebugCookieMode = async (_req: Request, res: Response) => {
  // #region agent log
  sendResponse(res, {
    statusCode: 200,
    message: "Cookie mode debug.",
    data: {
      nodeEnv: config.env,
      isProduction: config.isProduction,
      clientUrl: config.clientUrl,
      cookieSecure: config.isProduction,
      cookieSameSite: config.isProduction ? "none" : "lax",
      hasCookieHeader: Boolean(_req.headers.cookie),
      cookieHeaderLength: _req.headers.cookie?.length ?? 0,
      hasAccessTokenCookie: Boolean(_req.cookies?.accessToken),
      hasRefreshTokenCookie: Boolean(_req.cookies?.refreshToken),
    },
  });
  // #endregion
};

export const getBySlug = async (req: Request, res: Response) => {
  const article = await publicArticleService.getPublishedBySlug(req.params["slug"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Article retrieved successfully.",
    data: article,
  });
};

export const search = async (req: Request, res: Response) => {
  const query = searchQuerySchema.parse(req.query);
  const result = await publicArticleService.searchPublished(query);

  sendResponse(res, {
    statusCode: 200,
    message: "Search completed.",
    data: result,
  });
};
