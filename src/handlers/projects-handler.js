const {
	getAllProjectsController,
	getProjectByIdController,
	createProjectController,
	updateProjectController,
	deleteProjectController,
} = require('../controllers/projects-controller')

const getAllProjects = async (req, res) => {
	const queries = req.query
	try {
		const response = await getAllProjectsController(queries)
		res.status(200).json(response)
	} catch (error) {
		res.status(500).send(error.message)
	}
}

const getProjectById = async (req, res) => {
	try {
		const { id } = req.params
		const response = await getProjectByIdController(id)
		res.status(200).json(response)
	} catch (error) {
		res.status(500).send(error.message)
	}
}

const createProject = async (req, res) => {
	const projectData = req.body
	try {
		const user = req.user
		const project = await createProjectController(projectData, user)
		res.status(201).json({ project: project })
	} catch (error) {
		res.status(400).json({ error: error.message })
	}
}

const updateProject = async (req, res) => {
	try {
		const { id } = req.params
		const projectData = req.body
		const response = await updateProjectController(projectData, id)
		res.status(200).json(response)
	} catch (error) {
		res.status(500).send(error.message)
	}
}

const deleteProject = async (req, res) => {
	try {
		const { id } = req.params
		const user = req.user
		const response = await deleteProjectController(id, user)
		res.status(200).json(response)
	} catch (error) {
		res.status(500).send(error.message)
	}
}

module.exports = {
	getAllProjects,
	getProjectById,
	createProject,
	updateProject,
	deleteProject,
}
