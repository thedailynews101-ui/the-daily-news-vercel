import { Router } from "express";

import AuthRoutes from "../module/Auth/auth.route";

const router = Router();

const routerManager = [
  {
    path: "/api/auth",
    route: AuthRoutes,
  },
];

routerManager.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
