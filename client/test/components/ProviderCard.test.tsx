import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderCard } from "@/app/map/ProviderCard";
import type { Post, User } from "@/types";

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: "post-42",
  user_id: "user-1",
  name: "NOMBRE_AUTOR_COPIADO",
  description: "SOBRE_MI_PERFIL",
  tags: ["tag-uno", "tag-dos"],
  location: "Ubicacion Centro",
  latitude: 4.6,
  longitude: -74.1,
  post_image: null,
  created_at: "2025-01-01T00:00:00Z",
  offer: "Oferta de clases de guitarra",
  ...overrides,
});

const makeProvider = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  name: "Camilo Prestador",
  email: "camilo@example.com",
  profile_picture: null,
  age: 30,
  location: "Bogota",
  description: null,
  role: "user" as User["role"],
  latitude: null,
  longitude: null,
  ...overrides,
});

const header = () => screen.getByRole("heading", { name: "Camilo Prestador" }).parentElement as HTMLElement;

describe("ProviderCard subtitle", () => {
  it("shows the location when present", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(header().querySelectorAll("p")[0].textContent).toBe("Ubicacion Centro");
  });

  it("falls back to the first tag when location is empty", () => {
    render(<ProviderCard post={makePost({ location: "" })} provider={makeProvider()} />);

    expect(header().querySelectorAll("p")[0].textContent).toBe("tag-uno");
  });

  it("falls back to the first tag when location is only whitespace", () => {
    render(<ProviderCard post={makePost({ location: "   " })} provider={makeProvider()} />);

    expect(header().querySelectorAll("p")[0].textContent).toBe("tag-uno");
  });

  it("renders no subtitle when there is no location and no tags", () => {
    render(<ProviderCard post={makePost({ location: "", tags: [] })} provider={makeProvider()} />);

    expect(header().querySelectorAll("p").length).toBe(0);
  });

  it("renders only the heading in the header column when there is no subtitle or distance", () => {
    render(<ProviderCard post={makePost({ location: "", tags: [] })} provider={makeProvider()} />);

    expect(header().children.length).toBe(1);
  });

  it("keeps only the distance after the heading when there is no subtitle", () => {
    render(
      <ProviderCard post={makePost({ location: "", tags: [], distance_km: 1.5 })} provider={makeProvider()} />,
    );

    expect(header().querySelectorAll("p")[0].textContent).toBe("a 1.5 km");
  });
});

describe("ProviderCard offer", () => {
  it("shows the offer text", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.getByText("Oferta de clases de guitarra")).toBeTruthy();
  });

  it("clamps the offer to two lines", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.getByText("Oferta de clases de guitarra").className).toContain("line-clamp-2");
  });

  it("does not render an offer paragraph when offer is empty", () => {
    const { container } = render(<ProviderCard post={makePost({ offer: "" })} provider={makeProvider()} />);

    expect(container.querySelector("p.line-clamp-2")).toBeNull();
  });

  it("still renders the tags when offer is empty", () => {
    render(<ProviderCard post={makePost({ offer: "" })} provider={makeProvider()} />);

    expect(screen.getByText("tag-dos")).toBeTruthy();
  });

  it("does not render an offer paragraph when offer is only whitespace", () => {
    const { container } = render(<ProviderCard post={makePost({ offer: "   " })} provider={makeProvider()} />);

    expect(container.querySelector("p.line-clamp-2")).toBeNull();
  });

  it("does not render an offer paragraph when offer is undefined", () => {
    const { container } = render(
      <ProviderCard post={makePost({ offer: undefined })} provider={makeProvider()} />,
    );

    expect(container.querySelector("p.line-clamp-2")).toBeNull();
  });

  it("renders every tag as a pill", () => {
    render(<ProviderCard post={makePost({ location: "" })} provider={makeProvider()} />);

    expect(screen.getAllByText("tag-dos").length).toBe(1);
  });
});

describe("ProviderCard author data", () => {
  it("never renders post.name", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.queryByText("NOMBRE_AUTOR_COPIADO")).toBeNull();
  });

  it("never renders post.name even without location or tags", () => {
    const { container } = render(
      <ProviderCard post={makePost({ location: "", tags: [] })} provider={makeProvider()} />,
    );

    expect(container.textContent).not.toContain("NOMBRE_AUTOR_COPIADO");
  });

  it("never renders post.description", () => {
    const { container } = render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(container.textContent).not.toContain("SOBRE_MI_PERFIL");
  });
});

describe("ProviderCard link and distance", () => {
  it("links to the post detail page", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.getByRole("link", { name: "Ver publicación" }).getAttribute("href")).toBe("/post/post-42");
  });

  it("shows the distance when provided", () => {
    render(<ProviderCard post={makePost({ distance_km: 2.3 })} provider={makeProvider()} />);

    expect(screen.getByText("a 2.3 km")).toBeTruthy();
  });

  it("places the distance right after the subtitle", () => {
    render(<ProviderCard post={makePost({ distance_km: 2.3 })} provider={makeProvider()} />);

    expect(screen.getByText("Ubicacion Centro").nextElementSibling?.textContent).toBe("a 2.3 km");
  });

  it("shows no distance text when distance_km is undefined", () => {
    const { container } = render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(container.textContent).not.toContain("km");
  });
});

describe("ProviderCard header", () => {
  it("renders the provider name as a heading", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.getByRole("heading", { name: "Camilo Prestador" })).toBeTruthy();
  });

  it("renders the avatar image with the provider name as alt", () => {
    render(
      <ProviderCard
        post={makePost()}
        provider={makeProvider({ profile_picture: "https://example.com/camilo.png" })}
      />,
    );

    expect(screen.getByAltText("Camilo Prestador").getAttribute("src")).toContain("camilo.png");
  });

  it("renders the initial letter when there is no profile picture", () => {
    render(<ProviderCard post={makePost()} provider={makeProvider()} />);

    expect(screen.getByText("C")).toBeTruthy();
  });
});
