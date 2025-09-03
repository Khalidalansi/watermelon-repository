
import { Database, Collection, Model } from "@nozbe/watermelondb";
/**
 * BaseRepository<T>
 *
 * Generic Repository Layer for WatermelonDB
 * -----------------------------------------
 * - Provides CRUD (create, update, delete, destroy) methods
 * - Supports prepare* methods for batch writes
 * - Singleton pattern per repository class
 * - Database injected statically at app bootstrap
 *
 * Example:
 *   BaseRepository.setDatabase(database);
 *   const userRepo = UserRepository.instance(User);
 *   await userRepo.create({ name: "Mohammed" });
 */

export default class BaseRepository<T extends Model> {
  // =========
  // STATIC
  // =========
  private static db: Database | null = null;
  private static instances: Map<string, BaseRepository<any>> = new Map();

  protected modelClass: new (...args: any[]) => T;

  protected constructor(modelClass: new (...args: any[]) => T) {
    if (!BaseRepository.db) {
      throw new Error("Database not initialized. Call BaseRepository.setDatabase(db) first.");
    }
    this.modelClass = modelClass;
  }

  // Inject DB once at app start
  static setDatabase(db: Database) {
    BaseRepository.db = db;
  }

  // Singleton instance
  static instance<R extends BaseRepository<any>>(this: new () => R): R {
    const className = this.name;

    if (!BaseRepository.instances.has(className)) {
      BaseRepository.instances.set(className, new this());
    }

    return BaseRepository.instances.get(className) as R;
  }

  // Access DB
  protected get db(): Database {
    if (!BaseRepository.db) {
      throw new Error("Database not initialized");
    }
    return BaseRepository.db;
  }

  // =========
  // CORE
  // =========
  getTableName(): string {
    return (this.modelClass as any).table;
  }

  getCollection(): Collection<T> {
    return this.db.get<T>(this.getTableName());
  }

  // =========
  // CREATE
  // =========
  async create(data: Partial<T>): Promise<T> {
    return this.db.write(async () => {
      return await this.getCollection().create((record: any) => {
        Object.assign(record, data);
      });
    });
  }

  prepareCreate(data: Partial<T>): T {
    return this.getCollection().prepareCreate((record: any) => {
      Object.assign(record, data);
    });
  }

  // =========
  // UPDATE
  // =========
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const record = await this.getById(id);
    if (!record) return null;

    await this.db.write(async () => {
      await record.update((r: any) => Object.assign(r, data));
    });

    return record;
  }

  prepareUpdate(record: T, data: Partial<T>): T {
    return record.prepareUpdate((r: any) => {
      Object.assign(r, data);
    });
  }

  // =========
  // DELETE (soft)
  // =========
  async delete(id: string): Promise<void> {
    const record = await this.getById(id);
    if (!record) return;
    await this.db.write(async () => {
      await record.markAsDeleted();
    });
  }

  prepareDelete(record: T): T {
    return record.prepareMarkAsDeleted();
  }

  // =========
  // DESTROY (hard)
  // =========
  async destroy(id: string): Promise<void> {
    const record = await this.getById(id);
    if (!record) return;
    await this.db.write(async () => {
      await record.destroyPermanently();
    });
  }

  prepareDestroy(record: T): T {
    return record.prepareDestroyPermanently();
  }

  // =========
  // HELPERS
  // =========
  async getById(id: string): Promise<T | null> {
    try {
      return await this.getCollection().find(id);
    } catch {
      return null;
    }
  }

  async getAll(whereClause: any[] = []): Promise<T[]> {
    let query = this.getCollection().query();
    if (whereClause.length > 0) {
      query = this.getCollection().query(...whereClause);
    }
    return query.fetch();
  }
}
