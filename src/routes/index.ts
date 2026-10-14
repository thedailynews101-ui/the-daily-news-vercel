import { Router } from "express";

import ArticleRoutes from "../module/Article/article.route";
import AuthRoutes from "../module/Auth/auth.route";
import CategoryRoutes from "../module/Category/category.route";
import EventRoutes from "../module/Event/event.route";
import PublicArticleRoutes from "../module/PublicArticle/publicArticle.route";
import UserRoutes from "../module/User/user.route";

const router = Router();

const routerManager = [
  {
    path: "/api/auth",
    route: AuthRoutes,
  },
  {
    path: "/api/public",
    route: PublicArticleRoutes,
  },
  {
    path: "/api/articles",
    route: ArticleRoutes,
  },
  {
    path: "/api/categories",
    route: CategoryRoutes,
  },
  {
    path: "/api/users",
    route: UserRoutes,
  },
  {
    path: "/api/events",
    route: EventRoutes,
  },
];

routerManager.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
