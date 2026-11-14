import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersProvider, useUsers } from "@/context/UsersContext";
import { api } from "@/lib/api";
import type { User } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

// Node reciente define un localStorage global sin API que tapa al de jsdom; se reemplaza por uno en memoria.
const memoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => store.get(k) ?? null,
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
};

const mockedApi = vi.mocked(api, true);

const makeUser = (over: Partial<User> = {}): User => ({
  id: "u1",
  name: "Ana",
  email: "a@b.c",
  profile_picture: null,
  age: 30,
  location: "Cali",
  description: null,
  role: "client",
  latitude: null,
  longitude: null,
  ...over,
});

const u1 = makeUser();
const u2 = makeUser({ id: "u2", name: "Beto" });

const wrapper = ({ children }: { children: ReactNode }) => <UsersProvider>{children}</UsersProvider>;

const renderLoaded = async () => {
  const hook = renderHook(() => useUsers(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe("UsersContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", memoryStorage());
    mockedApi.get.mockResolvedValue({ data: [u1, u2] });
  });

  it("loads users from GET /users as-is, ignoring a stale truek_users_edits value", async () => {
    localStorage.setItem("truek_users_edits", JSON.stringify({ u1: { name: "Hackeado" } }));
    const { result } = await renderLoaded();

    expect(result.current.users).toEqual([u1, u2]);
  });

  it("updateUser patches /users/<id> with user_id and the data", async () => {
    mockedApi.patch.mockResolvedValue({ data: makeUser({ name: "Nueva" }) });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.updateUser("u1", { name: "Nueva" });
    });

    expect(mockedApi.patch).toHaveBeenCalledWith("/users/u1", { user_id: "u1", name: "Nueva" });
  });

  it("updateUser replaces only that user with the server response", async () => {
    const updated = makeUser({ name: "Nueva", age: 40 });
    mockedApi.patch.mockResolvedValue({ data: updated });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.updateUser("u1", { name: "Nueva" });
    });

    expect(result.current.users).toEqual([updated, u2]);
  });

  it("updateUser returns the updated user", async () => {
    const updated = makeUser({ name: "Nueva" });
    mockedApi.patch.mockResolvedValue({ data: updated });
    const { result } = await renderLoaded();

    let returned: User | undefined;
    await act(async () => {
      returned = await result.current.updateUser("u1", { name: "Nueva" });
    });

    expect(returned).toEqual(updated);
  });

  it("updateUser does not write edits to localStorage", async () => {
    mockedApi.patch.mockResolvedValue({ data: makeUser({ name: "Nueva" }) });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.updateUser("u1", { name: "Nueva" });
    });

    expect(localStorage.getItem("truek_users_edits")).toBeNull();
  });

  it("updateUser rethrows the error and leaves users unchanged", async () => {
    mockedApi.patch.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.updateUser("u1", { name: "Nueva" })).rejects.toThrow("boom");
    });

    expect(result.current.users).toEqual([u1, u2]);
  });
});
