const { User, Technology, Tag, Like } = require('../db')
const { Op } = require('sequelize')

const getProjectIncludes = (queries = {}) => {
	let includes = [
		{ model: User, as: 'user' },
		{
			model: Technology,
			as: 'technologies',
			through: { attributes: [] },
			required: !!queries.technologies,
		},
		{
			model: Tag,
			as: 'tags',
			through: { attributes: [] },
			required: !!queries.tags,
		},
		{
			model: Like,
			as: 'likes',
			attributes: ['userId'],
			required: false,
		},
	];

	if (queries.exclude) {
		const excludeModels = queries.exclude.split(',');
		includes = includes.filter(include => !excludeModels.includes(include.as));
	}

	if (queries.technologies) {
		const technologyInclude = includes.find(include => include.as === 'technologies');
		if (technologyInclude) {
			technologyInclude.where = { name: { [Op.in]: queries.technologies.split(',') } };
		}
	}

	if (queries.tags) {
		const tagInclude = includes.find(include => include.as === 'tags');
		if (tagInclude) {
			tagInclude.where = { tagName: { [Op.iLike]: `%${queries.tags.split(',').join('%')}%` } };
		}
	}

	return includes;
};

const getProjectOrder = (queries) => {
	switch (queries.sort) {
		case 'a-z':
			return [['title', 'ASC']]
		case 'z-a':
			return [['title', 'DESC']]
		case 'new':
			return [['createdAt', 'DESC']]
		case 'old':
			return [['createdAt', 'ASC']]
		default:
			return []
	}
}

const getWhereCondition = (queries) => {
	let where = { deletedAt: null }

	if (queries.title) {
		where[Op.or] = [{ title: { [Op.iLike]: `%${queries.title}%` } }]
	}

	return where
}

const getPagination = async ({ page = 1, pageSize = 10 }, currentUser) => {
	const offset = (page - 1) * parseInt(pageSize, 10)
	let limit = parseInt(pageSize, 10)
	if (currentUser) {
		const user = await User.findByPk(currentUser.id, {
			include: [{ model: Plan, as: 'plan' }],
		})
		if (user && user.dataValues.planName === 'Free') {
			limit = 20
		}
	}
	return { offset, limit }
}

module.exports = { getProjectIncludes, getProjectOrder, getWhereCondition, getPagination }
