const router = require("express").Router();
const ctrl = require("../controllers/comment.controller");
const { requireAuth } = require("../middleware/auth");

router.delete("/:id", requireAuth, ctrl.deleteComment);

module.exports = router;
