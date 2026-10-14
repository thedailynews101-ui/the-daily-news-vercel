import { Router } from "express";

import * as eventController from "./event.controller";
import {
  createEventGroupSchema,
  createEventItemSchema,
  updateEventGroupSchema,
  updateEventItemSchema,
} from "./event.validation";
import { UserRole } from "../../generated/prisma/enums";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";

const router = Router();

const STAFF = [UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

router.get("/", auth(...STAFF), eventController.listEventGroups);
router.post(
  "/groups",
  auth(...STAFF),
  validateRequest(createEventGroupSchema),
  eventController.createEventGroup
);
router.patch(
  "/groups/:id",
  auth(...STAFF),
  validateRequest(updateEventGroupSchema),
  eventController.updateEventGroup
);
router.delete("/groups/:id", auth(...STAFF), eventController.deleteEventGroup);
router.post(
  "/groups/:groupId/items",
  auth(...STAFF),
  validateRequest(createEventItemSchema),
  eventController.createEventItem
);
router.patch(
  "/items/:id",
  auth(...STAFF),
  validateRequest(updateEventItemSchema),
  eventController.updateEventItem
);
router.delete("/items/:id", auth(...STAFF), eventController.deleteEventItem);

export default router;
