const Resource = require('../models/Resource');
const path = require('path');
const fs = require('fs');

exports.uploadResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { title, description, type, category } = req.body;
    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required.' });
    }

    const resourceId = await Resource.create({
      title,
      description,
      type,
      category,
      file_path: `/uploads/resources/${req.file.filename}`,
      file_size: req.file.size,
      uploaded_by: req.user.id
    });

    const resource = await Resource.findById(resourceId);
    res.status(201).json({ message: 'Resource uploaded.', resource });
  } catch (error) {
    next(error);
  }
};

exports.getAllResources = async (req, res, next) => {
  try {
    const { type, category, page, limit } = req.query;
    const result = await Resource.findAll({
      type: type || null,
      category: category || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    res.json(resource);
  } catch (error) {
    next(error);
  }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.delete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    const filePath = path.join(__dirname, '..', resource.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ message: 'Resource deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Resource.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
