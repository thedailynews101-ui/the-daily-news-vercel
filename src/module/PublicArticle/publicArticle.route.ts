import { Router } from "express";

import * as publicArticleController from "./publicArticle.controller";
import optionalAuth from "../../middleware/optionalAuth";

const router = Router();

router.get("/home", publicArticleController.getHome);
router.get("/widgets", optionalAuth(), publicArticleController.getWidgets);
router.get("/debug-cookie-mode", publicArticleController.getDebugCookieMode);
router.get("/search", publicArticleController.search);
router.get("/articles/:slug", publicArticleController.getBySlug);

export default router;
