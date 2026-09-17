import { Request, Response } from "express";

import * as articleService from "./article.service";
import { ActingUser } from "./article.service";
import { listArticlesQuerySchema, mineArticlesQuerySchema } from "./article.validation";
import * as publicArticleService from "../PublicArticle/publicArticle.service";
import sendResponse from "../../utils/sendResponse";

const actingUser = (req: Request): ActingUser => ({
  id: req.user!.id,
  role: req.user!.role,
});

export const createArticle = async (req: Request, res: Response) => {
  const article = await articleService.createArticle(actingUser(req), req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Article created successfully.",
    data: article,
  });
};

export const getMine = async (req: Request, res: Response) => {
  const query = mineArticlesQuerySchema.parse(req.query);
  const result = await articleService.listMine(actingUser(req), query);

  sendResponse(res, {
    statusCode: 200,
    message: "Your articles retrieved successfully.",
    data: result,
  });
};

export const getMineSummary = async (req: Request, res: Response) => {
  const summary = await articleService.getMySummary(actingUser(req));

  sendResponse(res, {
    statusCode: 200,
    message: "Article status summary retrieved successfully.",
    data: summary,
  });
};

export const getArticleById = async (req: Request, res: Response) => {
  const article = await articleService.getArticleById(actingUser(req), req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Article retrieved successfully.",
    data: article,
  });
};

export const updateArticle = async (req: Request, res: Response) => {
  const article = await articleService.updateArticle(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article updated successfully.",
    data: article,
  });
};

export const deleteArticle = async (req: Request, res: Response) => {
  await articleService.deleteArticle(actingUser(req), req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Article deleted successfully.",
  });
};

export const submitArticle = async (req: Request, res: Response) => {
  const article = await articleService.submitArticle(actingUser(req), req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Article submitted for review.",
    data: article,
  });
};

export const withdrawArticle = async (req: Request, res: Response) => {
  const article = await articleService.withdrawArticle(
    actingUser(req),
    req.params["id"] as string
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article withdrawn back to draft.",
    data: article,
  });
};

export const listAllArticles = async (req: Request, res: Response) => {
  const query = listArticlesQuerySchema.parse(req.query);
  const result = await articleService.listAll(query);

  sendResponse(res, {
    statusCode: 200,
    message: "Articles retrieved successfully.",
    data: result,
  });
};

export const listQueue = async (_req: Request, res: Response) => {
  const items = await articleService.listQueue();

  sendResponse(res, {
    statusCode: 200,
    message: "Pending articles retrieved successfully.",
    data: items,
  });
};

export const approveArticle = async (req: Request, res: Response) => {
  const article = await articleService.approveArticle(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article approved and published.",
    data: article,
  });
};

export const publishDraft = async (req: Request, res: Response) => {
  const article = await articleService.publishDraft(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Draft published successfully.",
    data: article,
  });
};

export const rejectArticle = async (req: Request, res: Response) => {
  const article = await articleService.rejectArticle(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article rejected.",
    data: article,
  });
};

export const archiveArticle = async (req: Request, res: Response) => {
  const article = await articleService.archiveArticle(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article archived.",
    data: article,
  });
};

export const restoreArticle = async (req: Request, res: Response) => {
  const article = await articleService.restoreArticle(
    actingUser(req),
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Article restored to approved.",
    data: article,
  });
};

export const getHomeLayout = async (_req: Request, res: Response) => {
  const layout = await publicArticleService.getHomeLayout();

  sendResponse(res, {
    statusCode: 200,
    message: "Homepage layout retrieved successfully.",
    data: layout,
  });
};

export const listPublishedForPlacement = async (req: Request, res: Response) => {
  const page = Number(req.query["page"] ?? 1) || 1;
  const limit = Number(req.query["limit"] ?? 20) || 20;
  const q = typeof req.query["q"] === "string" ? req.query["q"] : undefined;

  const result = await publicArticleService.listPublishedForPlacement({ q, page, limit });

  sendResponse(res, {
    statusCode: 200,
    message: "Published articles retrieved successfully.",
    data: result,
  });
};

export const setHomePlacement = async (req: Request, res: Response) => {
  const article = await publicArticleService.setHomePlacement(
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Homepage placement updated.",
    data: article,
  });
};
