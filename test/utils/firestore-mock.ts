import { vi } from "vitest";

type MockStore = Record<string, unknown>;

function docSnapshot(data: unknown) {
  return {
    exists: data !== undefined,
    data: () => data,
  } as unknown as FirebaseFirestore.DocumentSnapshot;
}

function querySnapshot(docs: unknown[]) {
  return {
    docs: docs.map((d) => ({ data: () => d })),
    empty: docs.length === 0,
  } as unknown as FirebaseFirestore.QuerySnapshot;
}

/**
 * Minimal Firestore-like mock supporting arbitrary collection/doc nesting.
 * Data is looked up from `mockStore` using these conventions:
 * - Documents: the full slash-joined path, e.g. "internships/abc/skillRatings/2026-W31".
 * - Collection listings (`.get()` or `.orderBy().limit().get()` with no `.where()`):
 *   `${collectionPath}.__list__`.
 * - `.where(field, op, value).get()`: `${collectionPath}__query__${value}`.
 */
export function createAdminFirestoreMock(mockStore: MockStore) {
  function makeDocRef(path: string): FirebaseFirestore.DocumentReference {
    const segments = path.split("/");
    return {
      _path: path,
      id: segments[segments.length - 1],
      parent: { id: segments[segments.length - 2] },
      get: async () => docSnapshot(mockStore[path]),
      collection: (name: string) => makeCollectionRef(`${path}/${name}`),
    } as unknown as FirebaseFirestore.DocumentReference;
  }

  function makeCollectionRef(path: string): FirebaseFirestore.CollectionReference {
    return {
      _path: path,
      doc: (id: string) => makeDocRef(`${path}/${id}`),
      get: async () => querySnapshot((mockStore[`${path}.__list__`] as unknown[]) || []),
      orderBy: () => ({
        limit: () => ({
          get: async () =>
            querySnapshot((mockStore[`${path}.__list__`] as unknown[]) || []),
        }),
      }),
      where: (_field: string, _op: string, value: string) => ({
        _path: path,
        _whereVal: value,
        get: async () =>
          querySnapshot((mockStore[`${path}__query__${value}`] as unknown[]) || []),
      }),
    } as unknown as FirebaseFirestore.CollectionReference;
  }

  const adminFirestore = {
    collection: (name: string) => makeCollectionRef(name),
    getAll: async (...refs: { _path: string }[]) =>
      refs.map((ref) => docSnapshot(mockStore[ref._path])),
    runTransaction: async <T>(
      fn: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
    ) => {
      const transaction = {
        get: async (ref: { _path?: string; _whereVal?: string }) => {
          if (ref && ref._whereVal !== undefined) {
            return querySnapshot(
              (mockStore[`${ref._path}__query__${ref._whereVal}`] as unknown[]) || [],
            );
          }
          if (ref && typeof ref._path === "string") {
            return docSnapshot(mockStore[ref._path]);
          }
          return docSnapshot(undefined);
        },
        set: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      } as unknown as FirebaseFirestore.Transaction;
      return fn(transaction);
    },
  };

  return adminFirestore as unknown as FirebaseFirestore.Firestore;
}
