import { Router } from "express";

import ArticleRoutes from "../module/Article/article.route";
import AuthRoutes from "../module/Auth/auth.route";
import CategoryRoutes from "../module/Category/category.route";
import EventRoutes from "../module/Event/event.route";
import PublicArticleRoutes from "../module/PublicArticle/publicArticle.route";
import PublicOpinionRoutes from "../module/PublicOpinion/publicOpinion.route";
import QuoteRoutes from "../module/Quote/quote.route";
import UserRoutes from "../module/User/user.route";
import WidgetSettingRoutes from "../module/WidgetSetting/widgetSetting.route";

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
  {
    path: "/api/quotes",
    route: QuoteRoutes,
  },
  {
    path: "/api/public-opinions",
    route: PublicOpinionRoutes,
  },
  {
    path: "/api/widget-settings",
    route: WidgetSettingRoutes,
  },
];

routerManager.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
