// src/domain/entities/user.entity.js
class User {
    constructor({ id, email, passwordHash, createdAt }) {
        if (!email) {
            throw new Error('El email del usuario es obligatorio.');
        }
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }
}

module.exports = User;
