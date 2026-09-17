import { Request, Response } from "express";

import * as publicArticleService from "./publicArticle.service";
import { searchQuerySchema } from "./publicArticle.validation";
import sendResponse from "../../utils/sendResponse";

export const getHome = async (_req: Request, res: Response) => {
  const layout = await publicArticleService.getHomeLayout();

  sendResponse(res, {
    statusCode: 200,
    message: "Homepage layout retrieved successfully.",
    data: layout,
  });
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
