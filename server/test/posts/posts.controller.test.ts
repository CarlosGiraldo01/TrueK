import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

// Importar el controller carga el service y el repository (pool/config); los reemplazamos.
mock.module("../../src/features/posts/posts.repository", {
  exports: { postsRepository: {} },
});
mock.module("../../src/features/users/users.service", {
  exports: { usersService: {} },
});

let parseCreatePostBody: typeof import("../../src/features/posts/posts.controller").parseCreatePostBody;

before(async () => {
  ({ parseCreatePostBody } = await import("../../src/features/posts/posts.controller"));
});

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";

const validBody = (): Record<string, unknown> => ({
  description: "  Clases de guitarra ",
  offer: " Guitarra ",
  location: " Medellín ",
  latitude: 6.2,
  longitude: -75.5,
  price: 1000,
  tags: ["Conversar", "Música"],
});

const assertBadRequest = (fn: () => unknown, message: string): void => {
  assert.throws(fn, (err: unknown) => {
    const e = err as { isBoom?: boolean; output?: { statusCode: number }; message: string };
    return e.isBoom === true && e.output?.statusCode === 400 && e.message === message;
  });
};

test("parseCreatePostBody trims strings and returns the input without post_image", () => {
  const result = parseCreatePostBody(validBody(), USER_ID);

  assert.deepEqual(result, {
    user_id: USER_ID,
    description: "Clases de guitarra",
    offer: "Guitarra",
    location: "Medellín",
    latitude: 6.2,
    longitude: -75.5,
    price: 1000,
    tags: ["Conversar", "Música"],
  });
});

test("parseCreatePostBody omits post_image when it is null", () => {
  const result = parseCreatePostBody({ ...validBody(), post_image: null }, USER_ID);

  assert.equal("post_image" in result, false);
});

test("parseCreatePostBody keeps post_image when it is a string", () => {
  const result = parseCreatePostBody({ ...validBody(), post_image: "data:abc" }, USER_ID);

  assert.equal(result.post_image, "data:abc");
});

test("parseCreatePostBody rejects a non-UUID user id", () => {
  assertBadRequest(() => parseCreatePostBody(validBody(), "nope"), "user_id inválido");
});

for (const bad of [null, [], "text", 5]) {
  test(`parseCreatePostBody rejects body ${JSON.stringify(bad)}`, () => {
    assertBadRequest(
      () => parseCreatePostBody(bad, USER_ID),
      "Cuerpo de la solicitud inválido"
    );
  });
}

for (const field of ["description", "offer", "location"]) {
  test(`parseCreatePostBody rejects missing ${field}`, () => {
    const body = validBody();
    delete body[field];
    assertBadRequest(
      () => parseCreatePostBody(body, USER_ID),
      `El campo ${field} es obligatorio`
    );
  });

  test(`parseCreatePostBody rejects blank ${field}`, () => {
    assertBadRequest(
      () => parseCreatePostBody({ ...validBody(), [field]: "   " }, USER_ID),
      `El campo ${field} es obligatorio`
    );
  });

  test(`parseCreatePostBody rejects non-string ${field}`, () => {
    assertBadRequest(
      () => parseCreatePostBody({ ...validBody(), [field]: 7 }, USER_ID),
      `El campo ${field} es obligatorio`
    );
  });
}

for (const field of ["latitude", "longitude"]) {
  for (const bad of ["6.2", null, NaN, Infinity]) {
    test(`parseCreatePostBody rejects ${field} = ${String(bad)}`, () => {
      assertBadRequest(
        () => parseCreatePostBody({ ...validBody(), [field]: bad }, USER_ID),
        `El campo ${field} debe ser un número válido`
      );
    });
  }
}

const priceMessage = "El campo price debe ser un entero entre 100 y 50000";

for (const bad of [99, 50001, 100.5, "500", undefined]) {
  test(`parseCreatePostBody rejects price ${String(bad)}`, () => {
    assertBadRequest(
      () => parseCreatePostBody({ ...validBody(), price: bad }, USER_ID),
      priceMessage
    );
  });
}

for (const ok of [100, 50000]) {
  test(`parseCreatePostBody accepts price ${ok}`, () => {
    assert.equal(parseCreatePostBody({ ...validBody(), price: ok }, USER_ID).price, ok);
  });
}

for (const bad of [undefined, "Conversar", [1], [""], ["  "]]) {
  test(`parseCreatePostBody rejects tags ${JSON.stringify(bad)}`, () => {
    assertBadRequest(
      () => parseCreatePostBody({ ...validBody(), tags: bad }, USER_ID),
      "El campo tags debe ser una lista de textos no vacíos"
    );
  });
}

test("parseCreatePostBody rejects an empty tags list", () => {
  assertBadRequest(
    () => parseCreatePostBody({ ...validBody(), tags: [] }, USER_ID),
    "Debes seleccionar entre 1 y 3 categorías"
  );
});

test("parseCreatePostBody rejects four distinct tags", () => {
  assertBadRequest(
    () => parseCreatePostBody({ ...validBody(), tags: ["a", "b", "c", "d"] }, USER_ID),
    "Debes seleccionar entre 1 y 3 categorías"
  );
});

test("parseCreatePostBody collapses duplicate tags into one", () => {
  const result = parseCreatePostBody(
    { ...validBody(), tags: ["Conversar", "Conversar"] },
    USER_ID
  );

  assert.deepEqual(result.tags, ["Conversar"]);
});

test("parseCreatePostBody rejects a non-string post_image", () => {
  assertBadRequest(
    () => parseCreatePostBody({ ...validBody(), post_image: 5 }, USER_ID),
    "El campo post_image debe ser un texto"
  );
});
