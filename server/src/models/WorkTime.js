import { getFirestore } from '../config/firebase.js';

const workTimesCollection = 'workTimes';

// Lazy getter
const db = () => getFirestore();

export class WorkTime {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId;
    this.date = data.date;
    this.startTime = data.startTime || '';
    this.endTime = data.endTime || '';
    this.workHours = data.workHours || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Save work time
  async save() {
    const data = {
      userId: this.userId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      workHours: this.workHours,
      updatedAt: new Date().toISOString()
    };

    const docId = `${this.userId}_${this.date}`;
    
    if (this.id) {
      await db().collection(workTimesCollection).doc(this.id).set(data);
    } else {
      await db().collection(workTimesCollection).doc(docId).set({
        ...data,
        createdAt: this.createdAt
      });
      this.id = docId;
    }

    return this;
  }

  // Find by user and date
  static async findByUserIdAndDate(userId, date) {
    const docId = `${userId}_${date}`;
    const doc = await db().collection(workTimesCollection).doc(docId).get();
    
    if (!doc.exists) return null;
    
    return new WorkTime({ id: doc.id, ...doc.data() });
  }

  // Find all work times for a user
  static async findByUserId(userId) {
    const snapshot = await db().collection(workTimesCollection)
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => new WorkTime({ id: doc.id, ...doc.data() }));
  }

  toJSON() {
    return { ...this };
  }
}

export default WorkTime;
