import { getFirestore } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

const usersCollection = 'users';

// Lazy getter to avoid accessing Firestore before initialization
const db = () => getFirestore();

export class User {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Save user to Firestore
  async save() {
    await this.hashPassword();
    const userData = {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString()
    };

    if (this.id) {
      // Update existing user
      await db().collection(usersCollection).doc(this.id).update(userData);
    } else {
      // Create new user
      const docRef = await db().collection(usersCollection).add(userData);
      this.id = docRef.id;
    }

    return this;
  }

  // Find user by ID
  static async findById(id) {
    const doc = await db().collection(usersCollection).doc(id).get();
    if (!doc.exists) return null;
    
    return new User({ id: doc.id, ...doc.data() });
  }

  // Find user by email
  static async findByEmail(email) {
    const snapshot = await db().collection(usersCollection)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  // Find user by username
  static async findByUsername(username) {
    const snapshot = await db().collection(usersCollection)
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  // Find user by email or username
  static async findByEmailOrUsername(email, username) {
    const emailUser = await this.findByEmail(email);
    if (emailUser) return emailUser;
    
    return await this.findByUsername(username);
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export default User;
