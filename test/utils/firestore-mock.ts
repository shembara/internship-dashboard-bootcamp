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
      doc: (id: string) => ({ _path: `${name}/${id}`, id, parent: { id: name }, get: async () => docSnapshot(mockStore[`${name}/${id}`] || mockStore[`${name}.${id}`]) }),
      orderBy: () => ({ limit: () => ({ get: async () => querySnapshot(mockStore[`${name}.__list__`] || []) }) }),
      get: async () => querySnapshot(mockStore[`${name}.__list__`] || []),
      where: (_field: string, _op: string, _val: string) => ({
        _path: `${name}`,
        _whereVal: _val,
        get: async () => {
          // If it's a teammateAssignments collection path like internships/{id}/teammateAssignments
          const m = name.match(/^internships\/([^\/]+)\/teammateAssignments$/);
          if (m) {
            const key = `internships/${m[1]}/teammateAssignments__query__${_val}`;
            return querySnapshot(mockStore[key] || []);
          }
          // generic query
          const key = `${name}.__query__${_val}`;
          return querySnapshot(mockStore[key] || []);
        },
      }),
    }),
    runTransaction: async (fn: any) => {
      // Debug logging to help test runs detect hangs
      // eslint-disable-next-line no-console
      console.debug("mock.runTransaction start");
      const transaction = {
        get: async (ref: any) => {
          // eslint-disable-next-line no-console
          console.debug('mock.transaction.get called for', ref && ref._path, 'whereVal=', ref && ref._whereVal);
          if (ref && ref._path && typeof ref._path === "string") {
            const path: string = ref._path;

            // Direct doc like internships/{id}
            const mIntern = path.match(/^internships\/([^\/]+)$/);
            if (mIntern) {
              const key = `internships/${mIntern[1]}`;
              return docSnapshot(mockStore[key]);
            }

            // Nested skillRatings doc: internships/{internshipId}/skillRatings/{weekKey}
            const mSkill = path.match(/^internships\/([^\/]+)\/skillRatings\/([^\/]+)$/);
            if (mSkill) {
              const key = `internships/${mSkill[1]}/skillRatings.${mSkill[2]}`;
              return docSnapshot(mockStore[key]);
            }

            // teammateAssignments collection query reference
            const mTA = path.match(/^internships\/([^\/]+)\/teammateAssignments$/);
            if (mTA) {
              const key = `internships/${mTA[1]}/teammateAssignments__query__${ref._whereVal}`;
              return querySnapshot(mockStore[key] || []);
            }

            const parts = path.split("/");
            if (parts.length === 2) {
              return docSnapshot(mockStore[`${parts[0]}/${parts[1]}`]);
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
      const res = await fn(transaction);
      // eslint-disable-next-line no-console
      console.debug("mock.runTransaction end");
      return res;
    },
  };

  return adminFirestore as unknown as FirebaseFirestore.Firestore;
}
