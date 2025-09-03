import { Database } from "@nozbe/watermelondb";
import { appSchema, tableSchema } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { Model } from "@nozbe/watermelondb";
import BaseRepository from "../src/BaseRepository";

class User extends Model {
  static table = "users";
}

describe("BaseRepository", () => {
  let database: Database;
  let userRepo: BaseRepository<User>;

  beforeAll(() => {
    const adapter = new SQLiteAdapter({
      schema: appSchema({
        version: 1,
        tables: [
          tableSchema({
            name: "users",
            columns: [{ name: "name", type: "string" }],
          }),
        ],
      }),
    });

    database = new Database({
      adapter,
      modelClasses: [User],
    });

    BaseRepository.setDatabase(database);
    userRepo = BaseRepository.instance.call(BaseRepository, User);
  });

  it("should create a user", async () => {
    const user = await userRepo.create({ name: "Ali" } as any);
    expect(user.id).toBeTruthy();
  });

  it("should fetch all users", async () => {
    const users = await userRepo.getAll();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it("should update a user", async () => {
    const users = await userRepo.getAll();
    const user = users[0];
    const updated = await userRepo.update(user.id, { name: "Omar" } as any);
    expect(updated?.name).toBe("Omar");
  });

  it("should delete a user (soft)", async () => {
    const users = await userRepo.getAll();
    const user = users[0];
    await userRepo.delete(user.id);
    const deletedUser = await userRepo.getById(user.id);
    expect(deletedUser).toBeNull();
  });
});
