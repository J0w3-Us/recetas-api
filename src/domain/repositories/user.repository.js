// src/domain/repositories/user.repository.js
class UserRepository {
    async findByEmail(email) {
        throw new Error('Método no implementado');
    }

    async create({ email, password }) {
        throw new Error('Método no implementado');
    }
}

module.exports = UserRepository;
