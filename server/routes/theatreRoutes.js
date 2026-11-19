
const express = require("express");
const router = express.Router();

const theatreController = require("../controllers/theatreController");

router.post("/", theatreController.createTheatre);
router.get("/", theatreController.getTheatres);
router.get("/:id", theatreController.getTheatreById);
router.put("/:id", theatreController.updateTheatre);
router.delete("/:id", theatreController.deleteTheatre);

module.exports = router;
