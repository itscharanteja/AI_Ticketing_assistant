const express = require("express");
const router = express.Router();
const { Ticket } = require("../models");

// Get all tickets
router.get("/", async (req, res, next) => {
  try {
    const tickets = await Ticket.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

// Get a specific ticket
router.get("/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Create a new ticket
router.post("/", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const ticket = await Ticket.create({
      title,
      description,
      status: "open",
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

// Update a ticket
router.put("/:id", async (req, res, next) => {
  try {
    const { title, description, status, ai_response } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticket.update({
      title: title || ticket.title,
      description: description || ticket.description,
      status: status || ticket.status,
      ai_response: ai_response || ticket.ai_response,
    });

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Delete a ticket
router.delete("/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticket.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
