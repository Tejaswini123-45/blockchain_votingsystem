/**
 * Candidate Controller
 * @description Handles candidate CRUD operations
 * @version 1.0.0
 */

const Candidate = require('../models/Candidate');
const { errorResponse, successResponse } = require('../utils/response');

/**
 * GET /api/candidates
 * @description Get all candidates, optionally filtered by position
 * @access Public
 */
exports.getAllCandidates = async (req, res) => {
  try {
    const { position } = req.query;
    const filter = position ? { position } : {};
    
    const candidates = await Candidate.find(filter).sort({ position: 1, name: 1 });
    
    return successResponse(res, 200, 'Candidates retrieved successfully', {
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error('Get Candidates Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve candidates', 'SERVER_ERROR');
  }
};

/**
 * GET /api/candidates/:id
 * @description Get a single candidate by ID
 * @access Public
 */
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return errorResponse(res, 404, 'Candidate not found', 'NOT_FOUND');
    }
    
    return successResponse(res, 200, 'Candidate retrieved', { candidate });
  } catch (error) {
    console.error('Get Candidate Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve candidate', 'SERVER_ERROR');
  }
};

/**
 * POST /api/candidates
 * @description Create a new candidate (admin only)
 * @access Private (Admin)
 */
exports.createCandidate = async (req, res) => {
  try {
    const { name, position, department, description, image } = req.body;
    
    if (!name || !position || !department) {
      return errorResponse(res, 400, 'Name, position, and department are required', 'MISSING_FIELDS');
    }
    
    const candidate = await Candidate.create({
      name,
      position,
      department,
      description: description || '',
      image: image || '',
    });
    
    return successResponse(res, 201, 'Candidate created successfully', { candidate });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    return errorResponse(res, 500, 'Failed to create candidate', 'SERVER_ERROR');
  }
};

/**
 * PUT /api/candidates/:id
 * @description Update a candidate (admin only)
 * @access Private (Admin)
 */
exports.updateCandidate = async (req, res) => {
  try {
    const { name, position, department, description, image } = req.body;
    
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { name, position, department, description, image },
      { new: true, runValidators: true }
    );
    
    if (!candidate) {
      return errorResponse(res, 404, 'Candidate not found', 'NOT_FOUND');
    }
    
    return successResponse(res, 200, 'Candidate updated successfully', { candidate });
  } catch (error) {
    console.error('Update Candidate Error:', error);
    return errorResponse(res, 500, 'Failed to update candidate', 'SERVER_ERROR');
  }
};

/**
 * DELETE /api/candidates/:id
 * @description Delete a candidate (admin only)
 * @access Private (Admin)
 */
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return errorResponse(res, 404, 'Candidate not found', 'NOT_FOUND');
    }
    
    return successResponse(res, 200, 'Candidate deleted successfully');
  } catch (error) {
    console.error('Delete Candidate Error:', error);
    return errorResponse(res, 500, 'Failed to delete candidate', 'SERVER_ERROR');
  }
};

/**
 * GET /api/candidates/positions
 * @description Get all available positions
 * @access Public
 */
exports.getPositions = async (req, res) => {
  try {
    const positions = await Candidate.distinct('position');
    
    return successResponse(res, 200, 'Positions retrieved', { positions });
  } catch (error) {
    console.error('Get Positions Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve positions', 'SERVER_ERROR');
  }
};
