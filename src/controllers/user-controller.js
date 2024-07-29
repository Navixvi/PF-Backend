const { User } = require('../db')
const { Op } = require('sequelize')
const AppError = require('../utils/error-util')
const { getUserIncludes } = require('../utils/user-utils')
const { findOrCreateLinks } = require('../controllers/link-controller')
const bcrypt = require('bcrypt');

const getAllUsersController = async (search) => {
	try {
		let where = {}
		if (search)
			where[Op.or] = [
				{ userName: { [Op.iLike]: `%${search}%` } },
				{ email: { [Op.iLike]: `%${search}%` } },
			]
		const users = await User.findAll({ where, include: getUserIncludes() })
		return users
	} catch (error) {
		console.error('Error fetching users:', error)
		throw new Error(`Error fetching users: ${error.message}`)
	}
}

const getUserByIdController = async (id) => {
	try {
		const user = await User.findByPk(id, { include: getUserIncludes() })
		if (!user) throw new AppError('User not found', 404)
		return user
	} catch (error) {
		console.error(`Error fetching project with id ${id}`, error)
		throw new AppError(`Error fetching project with id ${id}`, 500)
	}
}

const updateUserProfileController = async (userData, user) => {
    const { currentPassword, newPassword, ...updateData } = userData;

    console.log('Datos recibidos en el backend:', userData); // Log para verificar los datos recibidos

    try {
        // Encuentra al usuario por su ID
        const userRecord = await User.findByPk(user.id);
        if (!userRecord) {
            console.log('Usuario no encontrado');
            return { status: 404, message: 'Usuario no encontrado' };
        }

        // Verifica y actualiza la contraseña si se proporciona
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, userRecord.password);
            if (!isMatch) {
                console.log('Contraseña actual incorrecta');
                return { status: 400, message: 'Contraseña actual incorrecta' };
            }

            // Hashea la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Actualiza el usuario con los datos proporcionados
        await userRecord.update(updateData);
        const updatedUser = await User.findByPk(user.id); // Obtener el usuario actualizado

        return { status: 200, message: 'Usuario actualizado exitosamente', user: updatedUser };
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        return { status: 500, message: 'Error al actualizar el usuario' };
    }
};


const updateUserByIdController = async (userData, id) => {
	try {
		const user = await User.findByPk(id)
		if (!user) {
			throw new AppError('User not found', 404)
		}
		await user.update({
			userName: userData.userName ?? user.userName,
			password: userData.password ?? user.password,
			bio: userData.bio ?? user.bio,
			aboutMe: userData.aboutMe ?? user.aboutMe,
			image: userData.image ?? user.image,
		})

		if (userData.links) {
			const linkInstances = await findOrCreateLinks(userData.links)
			await user.setLinks(linkInstances)
		}

		const updatedUser = await User.findByPk(userData.id)

		return updatedUser
	} catch (error) {
		console.error('Error updating project:', error)
		throw new AppError('Error updating project', 500)
	}
}

const deleteUserController = async (id) => {
	try {
		const userToDelete = await User.findByPk(id)
		if (!userToDelete) throw new AppError('User not found', 404)
		await userToDelete.destroy()
		return { message: 'User deleted successfully' }
	} catch (error) {
		console.error(`Error deleting user by Id: ${error.message}`)
		throw new AppError(`Error deleting user`, 500)
	}
}

const getDeletedUsersController = async () => {
	try {
		let where = { deletedAt: { [Op.not]: null } }

		const users = await User.findAll({
			where,
			paranoid: false,
			include: getUserIncludes(),
		})

		return users
	} catch (error) {
		console.error('Error getting deleted user:', error)
		throw new AppError('Error fetching deleted user', 500)
	}
}

const getDeletedUserByIdController = async (id) => {
	try {
		const user = await User.findOne({
			where: { id },
			paranoid: false,
			include: getUserIncludes(),
		})

		if (!user) throw new AppError('No user found with the given id', 404)

		return user
	} catch (error) {
		console.error('Error fetching deleted project by Id', error)
		throw new AppError('Error fetching deleted user', 500)
	}
}

const restoreUserController = async (id) => {
	try {
		const user = await User.findOne({
			where: { id },
			paranoid: false,
			include: getUserIncludes(),
		})

		if (!user) throw new AppError('No user found with the given id', 404)

		await user.restore()

		return { message: 'User restored successfully' }
	} catch (error) {
		console.error('Error restoring user', error)
		throw new AppError('Error restoring user', 500)
	}
}

module.exports = {
	getAllUsersController,
	getUserByIdController,
	updateUserProfileController,
	updateUserByIdController,
	deleteUserController,
	getDeletedUsersController,
	getDeletedUserByIdController,
	restoreUserController,
}
