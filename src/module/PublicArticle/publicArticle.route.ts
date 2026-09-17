import { Router } from "express";

import * as publicArticleController from "./publicArticle.controller";

const router = Router();

router.get("/home", publicArticleController.getHome);
router.get("/search", publicArticleController.search);
router.get("/articles/:slug", publicArticleController.getBySlug);

export default router;
