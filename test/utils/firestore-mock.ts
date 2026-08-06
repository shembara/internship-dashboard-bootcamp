import { Timestamp } from "firebase-admin/firestore";
import { vi } from "vitest";

export function createAdminFirestoreMock(mockStore: Record<string, any>) {
  function docSnapshot(data: unknown) {
    return {
      exists: data !== undefined,
      data: () => data,
    } as unknown as FirebaseFirestore.DocumentSnapshot;
  }

  function querySnapshot(docs: unknown[]) {
    return {
      docs: docs.map((d) => ({ data: () => d })),
    } as unknown as FirebaseFirestore.QuerySnapshot;
  }

  const adminFirestore = {
    collection: (name: string) => ({
      doc: (id: string) => ({ _path: `${name}/${id}`, id, parent: { id: name } }),
      orderBy: () => ({ limit: () => ({ get: async () => querySnapshot(mockStore[`${name}.__list__`] || []) }) }),
      get: async () => querySnapshot(mockStore[`${name}.__list__`] || []),
      where: (_field: string, _op: string, _val: string) => ({ _path: `${name}`, _whereVal: _val }),
    }),
    runTransaction: async (fn: any) => {
      const transaction = {
        get: async (ref: any) => {
          if (ref && ref._path && typeof ref._path === "string") {
            const parts = ref._path.split("/");
            if (parts.length === 2) {
              return docSnapshot(mockStore[`${parts[0]}/${parts[1]}`]);
            }
            if (parts.length === 3 && parts[2] === "teammateAssignments") {
              const key = `internships/${parts[1]}/teammateAssignments__query__${ref._whereVal}`;
              return querySnapshot(mockStore[key] || []);
            }
          }

          if (ref && ref._whereVal) {
            const key = `internships/__query__${ref._whereVal}`;
            return querySnapshot(mockStore[key] || []);
          }

          return docSnapshot(undefined);
        },
        set: vi.fn(),
        update: vi.fn(),
      };
      return fn(transaction);
    },
  };

  return adminFirestore as unknown as FirebaseFirestore.Firestore;
}
