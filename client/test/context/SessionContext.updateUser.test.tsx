import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "@/context/SessionContext";
import type { User } from "@/types";

const usersMock = vi.hoisted(() => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/context/UsersContext", () => ({ useUsers: () => usersMock }));

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

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe("SessionContext.updateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", memoryStorage());
    usersMock.getUserById.mockReturnValue(undefined);
  });

  it("delegates to UsersContext with the session user id", async () => {
    localStorage.setItem("truek_session_user_id", "session-user");
    const updated = { id: "session-user", name: "Nueva" } as User;
    usersMock.updateUser.mockResolvedValue(updated);
    const { result } = renderHook(() => useSession(), { wrapper });

    let returned: User | undefined;
    await act(async () => {
      returned = await result.current.updateUser({ name: "Nueva" });
    });

    expect(usersMock.updateUser).toHaveBeenCalledWith("session-user", { name: "Nueva" });
    expect(returned).toEqual(updated);
  });

  it("throws without calling the api when there is no session", async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => result.current.logout());

    await act(async () => {
      await expect(result.current.updateUser({ name: "x" })).rejects.toThrow(
        "Debes iniciar sesión para editar tu perfil",
      );
    });

    expect(usersMock.updateUser).not.toHaveBeenCalled();
  });
});
