
const express = require("express");
const router = express.Router();

const showController = require("../controllers/showController");

router.post("/", showController.createShow);
router.get("/", showController.getShows);
router.get("/:id", showController.getShowById);
router.put("/:id", showController.updateShow);
router.delete("/:id", showController.deleteShow);

module.exports = router;
