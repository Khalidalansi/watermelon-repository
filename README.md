

# 🍉 watermelon-repository

A lightweight **Repository Layer** for [WatermelonDB](https://github.com/Nozbe/WatermelonDB).  
Provides a **generic CRUD API**, `prepare*` helpers for batch writes, and follows the **Singleton Repository Pattern**.  


## ✨ Features
- ✅ Simple **CRUD** (`create`, `update`, `delete`, `destroy`)  
- ✅ Supports **prepareCreate / prepareUpdate / prepareDelete** for batch operations  
- ✅ **Singleton pattern** (only one repository instance per model)  
- ✅ **Static Database Injection** (set DB once at app bootstrap)  
- ✅ Works seamlessly with **React Native + WatermelonDB**  



## 📦 Installation

```bash
npm install watermelon-repository
# or
yarn add watermelon-repository
```


## 🚀 Usage

### 1. Setup Database at App Bootstrap

```ts
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { appSchema, tableSchema } from "@nozbe/watermelondb";
import BaseRepository from "watermelon-repository";
import { User } from "./models/User";

// Define adapter
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

// Initialize database
const database = new Database({
  adapter,
  modelClasses: [User],
});

// Inject DB globally (done once)
BaseRepository.setDatabase(database);
```


### 2. Create Your Repository

```ts
import BaseRepository from "watermelon-repository";
import { User } from "../models/User";

export default class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }
}
```



### 3. Use Repository Anywhere

```ts
import UserRepository from "../repositories/UserRepository";

async function demo() {
  const userRepo = UserRepository.instance(User);

  // CREATE
  const user = await userRepo.create({ name: "Ali" });

  // READ
  const users = await userRepo.getAll();

  // UPDATE
  await userRepo.update(user.id, { name: "Omar" });

  // DELETE (soft)
  await userRepo.delete(user.id);

  // DESTROY (hard)
  await userRepo.destroy(user.id);
}
```

---

## 🛠 API Reference

### Static

* `BaseRepository.setDatabase(db: Database)` → Set global DB instance
* `UserRepository.instance(ModelClass)` → Singleton instance

### CRUD

* `create(data: Partial<T>): Promise<T>`
* `update(id: string, data: Partial<T>): Promise<T | null>`
* `delete(id: string): Promise<void>` → Soft delete
* `destroy(id: string): Promise<void>` → Hard delete

### Prepare Methods (for batch writes)

* `prepareCreate(data: Partial<T>): T`
* `prepareUpdate(record: T, data: Partial<T>): T`
* `prepareDelete(record: T): T`
* `prepareDestroy(record: T): T`

### Helpers

* `getById(id: string): Promise<T | null>`
* `getAll(whereClause?: any[]): Promise<T[]>`

---

## 🧪 Testing

We use **Jest** for testing.

Run tests:

```bash
npm test
```

Example test:

```ts
it("should create a user", async () => {
  const user = await userRepo.create({ name: "Ali" } as any);
  expect(user.id).toBeTruthy();
});
```



### 4. Using `prepare*` Methods (Batch Writes)

WatermelonDB supports batching multiple operations into a single DB write.  
This library exposes **`prepare*` methods** for that.

```ts
import UserRepository from "../repositories/UserRepository";
import { database } from "../db"; // your global Database instance

async function batchExample() {
  const userRepo = UserRepository.instance(User);

  const newUser = userRepo.prepareCreate({ name: "Hasan" });

  const existingUsers = await userRepo.getAll();
  const updatedUser = userRepo.prepareUpdate(existingUsers[0], { name: "Updated Ali" });

  const deletedUser = userRepo.prepareDelete(existingUsers[1]);

  // 🚀 Commit all operations in ONE transaction
  await database.write(async () => {
    await database.batch(newUser, updatedUser, deletedUser);
  });
}

```

---

## 📜 License

MIT © 2025 – Built for React Native + WatermelonDB ❤️


