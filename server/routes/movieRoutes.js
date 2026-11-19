
const express = require("express");
const router = express.Router();

const movieController = require("../controllers/movieController");
const upload = require("../middleware/uploadMiddleware");

router.post("/", upload.single("poster"), movieController.createMovie);

router.get("/", movieController.getMovies);

router.get("/:id", movieController.getMovieById);

router.put("/:id", upload.single("poster"), movieController.updateMovie);

router.delete("/:id", movieController.deleteMovie);

module.exports = router;
