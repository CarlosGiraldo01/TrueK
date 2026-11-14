import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapPage from "@/app/map/page";
import { FALLBACK_POSITION } from "@/app/map/constants";
import { getNearbyPosts } from "@/lib/posts";
import type { Post, User } from "@/types";

interface GeoState {
  position: { latitude: number; longitude: number } | null;
  error: string | null;
  isLoading: boolean;
}

const mapProps = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const geo = vi.hoisted(() => ({
  value: { position: null, error: null, isLoading: false } as GeoState,
}));
const session = vi.hoisted(() => ({ user: null as User | null }));

vi.mock("next/dynamic", () => ({
  default: () => (props: Record<string, unknown>) => {
    mapProps.current = props;
    return <div data-testid="nearby-map" />;
  },
}));
vi.mock("@/app/map/MapControls", () => ({ MapControls: () => null }));
vi.mock("@/app/map/ProviderCard", () => ({ ProviderCard: () => null }));
// StatusMessage se usa real (no se simula) para que el test siga viendo el role="status" y el texto de verdad.
vi.mock("@/components/ui", async () => ({
  NavBar: () => null,
  TopHeader: () => null,
  StatusMessage: (await vi.importActual<typeof import("@/components/ui/StatusMessage")>("@/components/ui/StatusMessage"))
    .StatusMessage,
}));
vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: session.user }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: () => undefined }) }));
vi.mock("@/hooks/useGeolocation", () => ({ useGeolocation: () => geo.value }));
vi.mock("@/lib/posts", () => ({ getNearbyPosts: vi.fn() }));

const mockedFetch = vi.mocked(getNearbyPosts);
const post = (id: string, userId: string) => ({ id, user_id: userId }) as unknown as Post;
const makeUser = (lat: number | null, lng: number | null) =>
  ({ id: "me", name: "Ana", latitude: lat, longitude: lng }) as unknown as User;

const EMPTY = "No hay servicios cerca de ti en este momento";
const HINT = "Toca un punto para ver el servicio";
const browser: GeoState = { position: { latitude: 3.5, longitude: -76.4 }, error: null, isLoading: false };
const denied = "No diste permiso para usar tu ubicación";

beforeEach(() => {
  vi.clearAllMocks();
  mapProps.current = null;
  geo.value = { position: null, error: null, isLoading: false };
  session.user = makeUser(null, null);
  mockedFetch.mockResolvedValue([post("p1", "other")]);
});

describe("MapPage", () => {
  it("uses the browser position without an approximate notice", async () => {
    geo.value = browser;
    render(<MapPage />);
    await screen.findByTestId("nearby-map");
    expect(mapProps.current?.userPosition).toEqual([3.5, -76.4]);
    expect(screen.queryByText(/Ubicación aproximada/)).toBeNull();
  });

  it("passes source browser to the map when the browser position is used", async () => {
    geo.value = browser;
    render(<MapPage />);
    await screen.findByTestId("nearby-map");
    expect(mapProps.current?.source).toBe("browser");
  });

  it("uses the profile position when geolocation fails", async () => {
    geo.value = { position: null, error: denied, isLoading: false };
    session.user = makeUser(3.9, -76.1);
    render(<MapPage />);
    expect(await screen.findByText("Usando la ubicación de tu perfil")).toBeTruthy();
    expect(mapProps.current?.userPosition).toEqual([3.9, -76.1]);
  });

  it("falls back to Cali and shows the geolocation error without a profile position", async () => {
    geo.value = { position: null, error: denied, isLoading: false };
    render(<MapPage />);
    expect(await screen.findByText(`Ubicación aproximada (Cali). ${denied}`)).toBeTruthy();
    expect(mapProps.current?.userPosition).toEqual(FALLBACK_POSITION);
  });

  it("shows the locating status while geolocation loads without a profile position", () => {
    geo.value = { position: null, error: null, isLoading: true };
    render(<MapPage />);
    expect(screen.getByRole("status").textContent).toBe("Obteniendo tu ubicación…");
  });

  it("does not fetch while geolocation loads without a profile position", () => {
    geo.value = { position: null, error: null, isLoading: true };
    render(<MapPage />);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("shows the empty state when the fetch returns nothing", async () => {
    mockedFetch.mockResolvedValue([]);
    geo.value = browser;
    render(<MapPage />);
    expect(await screen.findByText(EMPTY)).toBeTruthy();
  });

  it("hides the hint when the fetch returns nothing", async () => {
    mockedFetch.mockResolvedValue([]);
    geo.value = browser;
    render(<MapPage />);
    await screen.findByText(EMPTY);
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it("shows the empty state when only the user's own posts come back", async () => {
    mockedFetch.mockResolvedValue([post("mine", "me")]);
    geo.value = browser;
    render(<MapPage />);
    expect(await screen.findByText(EMPTY)).toBeTruthy();
  });

  it("passes only other users' posts to the map", async () => {
    mockedFetch.mockResolvedValue([post("mine", "me"), post("p2", "other")]);
    geo.value = browser;
    render(<MapPage />);
    await waitFor(() =>
      expect((mapProps.current?.posts as Post[]).map((p) => p.id)).toEqual(["p2"]),
    );
  });

  it("shows the hint when there are services nearby", async () => {
    geo.value = browser;
    render(<MapPage />);
    expect(await screen.findByText(HINT)).toBeTruthy();
  });

  it("shows an alert when the fetch fails", async () => {
    mockedFetch.mockRejectedValue(new Error("boom"));
    geo.value = browser;
    render(<MapPage />);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudieron cargar los servicios cercanos",
    );
  });
});

describe("MapPage under React StrictMode", () => {
  it("passes the nearby posts to the map", async () => {
    mockedFetch.mockResolvedValue([post("p9", "other")]);
    geo.value = browser;
    render(
      <StrictMode>
        <MapPage />
      </StrictMode>,
    );
    await waitFor(() =>
      expect((mapProps.current?.posts as Post[]).map((p) => p.id)).toEqual(["p9"]),
    );
  });
});
