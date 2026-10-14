import { Request, Response } from "express";

import * as publicOpinionService from "./publicOpinion.service";
import sendResponse from "../../utils/sendResponse";
import { ensureVoterKey } from "../../utils/voterKey";

export const listPublicOpinions = async (_req: Request, res: Response) => {
  const opinions = await publicOpinionService.listPublicOpinions();

  sendResponse(res, {
    statusCode: 200,
    message: "Public opinions retrieved successfully.",
    data: opinions,
  });
};

export const createPublicOpinion = async (req: Request, res: Response) => {
  const opinion = await publicOpinionService.createPublicOpinion(req.body, req.user!.id);

  sendResponse(res, {
    statusCode: 201,
    message: "Public opinion created successfully.",
    data: opinion,
  });
};

export const updatePublicOpinion = async (req: Request, res: Response) => {
  const opinion = await publicOpinionService.updatePublicOpinion(
    req.params["id"] as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Public opinion updated successfully.",
    data: opinion,
  });
};

export const deletePublicOpinion = async (req: Request, res: Response) => {
  await publicOpinionService.deletePublicOpinion(req.params["id"] as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Public opinion deleted successfully.",
  });
};

export const getActivePublicOpinion = async (req: Request, res: Response) => {
  const voterKey = ensureVoterKey(req, res);
  const opinion = await publicOpinionService.getActivePublicOpinion(voterKey, req.user?.id);

  sendResponse(res, {
    statusCode: 200,
    message: "Active public opinion retrieved successfully.",
    data: opinion,
  });
};

export const votePublicOpinion = async (req: Request, res: Response) => {
  const voterKey = ensureVoterKey(req, res);
  const result = await publicOpinionService.votePublicOpinion(
    req.params["id"] as string,
    req.body,
    voterKey,
    req.user?.id
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Vote recorded successfully.",
    data: result,
  });
};
