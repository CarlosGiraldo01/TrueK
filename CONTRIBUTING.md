# Guía de trabajo

Reglas mínimas para trabajar los tres sin pisarnos. Todos los comandos son para PowerShell, desde la raíz del proyecto.

## Reglas

1. Nadie trabaja directo en `main` ni en `develop`. Cada quien tiene su rama.
2. Todo entra a `develop` por Pull Request (PR), revisado por **otro integrante** del equipo. A `main` solo pasa lo que ya se probó en `develop`.
3. Los componentes compartidos no se cambian sin avisar (ver más abajo).
4. Cada vez que algo se une a `develop` o a `main`, se avisa por **WhatsApp**.

## Ramas

Hay dos ramas permanentes y una rama de trabajo por cada ciclo:

| Rama | Qué es | Quién la toca |
|---|---|---|
| `main` | La versión estable, la que se muestra y se entrega. Siempre tiene que correr bien | Nadie directamente. Solo recibe lo que ya se probó en `develop` |
| `develop` | Donde se juntan los ciclos de los tres y se comprueba que funcionan juntos. Es la rama por defecto del repositorio | Se actualiza por PR desde las ramas de cada ciclo |
| `feature/...` | La rama de trabajo de cada ciclo | La persona dueña de ese ciclo |

El camino de cualquier pantalla es siempre el mismo:

```
ciclo de la Persona 1 ─┐
ciclo de la Persona 2 ─┼─►  develop  ─►  main
ciclo de la Persona 3 ─┘
```

**Por qué `develop`:** un ciclo puede funcionar perfecto solo y romperse al juntarlo con los de los demás (dos personas usan la misma ruta, alguien cambia un componente que otra ya usaba, los datos simulados dejan de cuadrar). Con `develop` en el medio, esos problemas pasan ahí y no en `main`, y se prueba el recorrido completo antes de entregar.

Una rama por ciclo de pantallas (ver quién hace qué en el [README](./README.md)). El nombre es `feature/<tu-nombre>-<tema>`, con tu nombre en minúsculas. Carlos ya tiene el suyo; Dana y Ana reemplazan `<nombre>` cuando definan si son la Persona 1 o la 2:

| Persona | Rama | Pantallas |
|---|---|---|
| 1 | `feature/<nombre>-entrada-perfil` | Pantalla principal, Crear cuenta, Completar perfil, Iniciar sesión, Perfil cliente, Perfil prestador, Editar perfil |
| 1 | `feature/<nombre>-descubrir` | Feed cliente, Feed prestador, Buscar, Publicación, Crea un truek |
| 2 | `feature/<nombre>-pedir` | Agendar Servicio, Confirmar servicio, Servicio pedido, Servicios, Solicitud de servicio, y los 4 avisos con su contenedor |
| 2 | `feature/<nombre>-servicio-calificacion` | Servicio activo, Calificación, Servicio finalizado |
| 3 | `feature/carlos-pago` | Pagar, Pago exitoso, Pago recibido |
| 3 | `feature/carlos-chat-mapa` | Chat vista previa, Chat, Mapa de cercanía |

**Reparto:** Persona 1 se encarga de cuenta y descubrimiento, Persona 2 de solicitud, servicio y avisos, y Persona 3 de pago, chat y mapa.

Crear tu rama **a partir de `develop`**, no de `main` (una sola vez por ciclo; el ejemplo es de Carlos):

```powershell
git checkout develop
git pull
git checkout -b feature/carlos-pago
git push -u origin feature/carlos-pago
```

## Día a día

Guarda y sube tu trabajo seguido, aunque el PR sea al final. Así no pierdes nada.

```powershell
git add .
git commit -m "feat: add login screen"
git push
```

Commits in English, with a prefix: `feat:` (something new), `fix:` (a fix), `style:` (visual only), `docs:` (documentation).

## Traer lo nuevo de develop a tu rama

Como tu rama vive varios días, `develop` va a cambiar mientras trabajas, porque los otros van uniendo sus ciclos. Haz esto **al empezar cada día de trabajo**:

```powershell
git checkout develop
git pull
git checkout feature/carlos-pago
git merge develop
```

Si sale un conflicto, abre el archivo en VS Code, elige la versión correcta con los botones **Accept Current / Incoming / Both**, guarda y haz:

```powershell
git add .
git commit -m "fix: resolve conflict with develop"
```

Si no tienes claro cuál versión es la correcta, pregunta a quien tocó ese archivo. No borres su trabajo.

## Pull Request (cuando terminas tu ciclo de pantallas)

1. Trae lo último de `develop` a tu rama (sección anterior) y corre la lista de abajo.
2. En GitHub, pulsa **Compare & pull request**.
3. Revisa que arriba diga **base: develop**. Como `develop` es la rama por defecto, debería venir así; si dice `main`, cámbialo antes de crear el PR.
4. Título claro y una descripción corta de qué pantallas incluye.
5. Pide la revisión de **otro integrante** en *Reviewers*.
6. Con su aprobación, se une con **Merge pull request**.
7. Avisa por WhatsApp. Los demás hacen `git checkout develop`, `git pull` y `git merge develop` en su rama.

El PR se abre cuando termina el ciclo completo, no pantalla por pantalla, y siempre apunta a `develop`, nunca a `main`. Quien revisa busca sobre todo que no haya componentes duplicados ni cosas rotas, no que el código esté escrito a su manera.

Lista antes de abrir el PR:

- [ ] `npm run dev` corre sin errores (dentro de `client`)
- [ ] `npm run lint` sin errores
- [ ] Probé las pantallas en vista móvil (F12 y luego Ctrl+Shift+M)
- [ ] No dejé `console.log`, código comentado ni archivos de prueba
- [ ] No subí `.env` ni `node_modules`

## De develop a main

Cuando `develop` ya tiene varios ciclos y la app funciona completa, se abre un PR de `develop` hacia `main`. Lo revisan los tres, y antes de unirlo se corre `npm run dev` y `npm run lint` sobre `develop` para confirmar que todo está bien. Si `develop` se rompe, se avisa en el grupo y se arregla ahí antes de seguir; mientras tanto no se pasa nada a `main`.

## Dónde va cada cosa

```
client/src/
├─ app/<ruta>/page.tsx   → pantallas (crea solo las tuyas)
├─ components/ui/        → componentes compartidos (Button, NavBar, Logo...)
├─ context/              → contexts y Providers.tsx
└─ lib/mock/             → datos simulados compartidos
```

### Pantallas

En Next.js una carpeta es una ruta, y el `page.tsx` de esa carpeta es la pantalla:

```
src/app/
├─ login/page.tsx               → /login
├─ home/page.tsx                → /home
└─ publication/[id]/page.tsx    → /publication/5   ([id] es un dato que cambia)
```

- Para crear una pantalla, crea la carpeta con el nombre de la ruta y dentro un `page.tsx`.
- Nombres en minúsculas y en inglés.
- Las pantallas principales deben llamarse `/home`, `/search`, `/requests`, `/map` y `/profile`, porque la `NavBar` navega a esas rutas.
- Las pantallas **no** dibujan la columna del celular: eso ya lo hace `layout.tsx`. Solo devuelven su contenido.

Pantalla de entrada, con un botón que navega:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button, Logo, TextField } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-5 py-10">
      <Logo variant="vertical" height={140} />
      <TextField label="Email" placeholder="Correo@ejemplo.com" type="email" />
      <TextField label="Contraseña" placeholder="********" type="password" />
      <Button onClick={() => router.push("/home")}>Iniciar sesión</Button>
    </main>
  );
}
```

Pantalla principal, con encabezado y barra inferior:

```tsx
import { NavBar, TopHeader } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <TopHeader title="Inicio" hideBack />
      <main className="flex-1 px-5">{/* content */}</main>
      <NavBar />
    </>
  );
}
```

- `"use client"` va arriba solo si la pantalla usa estado, `onClick` o hooks (`useState`, `useRouter`...).
- Para ir a otra pantalla: `<Link href="/register">` o `router.push("/home")`.
- El `<main>` lleva `flex-1` y la `NavBar` va **fuera** de él, como último elemento, para que quede al fondo.

### Componentes de una pantalla

- **Solo lo usa tu pantalla:** créalo **al lado** de su `page.tsx` (`src/app/login/LoginForm.tsx`) e impórtalo con `import { LoginForm } from "./LoginForm"`.
- **Lo usan pantallas de varias personas:** se propone como componente compartido (ver siguiente sección).
- Ante la duda, empieza dentro de tu carpeta. Subirlo después a `components/ui` es fácil; retirarlo cuando otras ya lo usan, no.

## Componentes compartidos

Están en `client/src/components/ui` y se importan así:

```tsx
import { Button, TextField, NavBar } from "@/components/ui";
```

Los textos, tamaños e imágenes se cambian por **props**. No copies un componente para cambiarle un texto.

Para modificar uno o crear uno nuevo:

1. Avisa por WhatsApp antes de tocarlo.
2. Hazlo en una rama aparte (`feature/componente-<nombre>`), no mezclado con tus pantallas.
3. Abre PR y espera la revisión de las otras dos.

No se edita sin avisar: `layout.tsx`, `globals.css`, `package.json` y todo `components/ui`.

## Datos simulados y contexts

- Los datos de mentira viven en `client/src/lib/mock/`, **uno por tema** (`users.ts`, `posts.ts`...). Son los mismos para las tres, para que cada usuario y publicación sea consistente en todas las pantallas.
- Cada una crea sus propios contexts en `src/context/` para el estado de sus pantallas (por ejemplo `RequestsContext.tsx`). Los contexts **leen** de `lib/mock`; no inventes usuarios ni publicaciones propios.
- Para activar tu context, agrega **una línea** en `src/context/Providers.tsx`, dentro de la sección con tu número de persona. No edites `layout.tsx`.
- Puedes **agregar** datos a `lib/mock`. Si necesitas cambiar o borrar uno existente, avisa por WhatsApp: otra pantalla puede estar usándolo.
- No edites el context de otra persona.

### Contexts compartidos

Ya vienen creados. Se leen y no se editan.

- **`SessionContext`**: guarda quién está usando la app (usuario y rol). Se lee con `useSession()`:

```tsx
  const { user } = useSession();
```

  `login(id)` y `logout()` los conectan las pantallas de Iniciar sesión, Crear cuenta y Cerrar sesión (Persona 1). Para probar como prestadora, cambia `CURRENT_USER_ID` a `"u2"` en `lib/mock/users.ts`.
- **Avisos (notificaciones)**: la Persona 2 crea el contenedor que los muestra encima de cualquier pantalla. Los demás solo llaman "mostrar aviso" cuando les haga falta. Hasta que exista, no inventes uno propio.

En `Providers.tsx` hay una sección **Compartido** al inicio. No la toques; agrega tu línea solo en la sección de tu persona.

## Estilos

- Usa las clases de color del proyecto (`bg-truek-black`, `text-truek-lime`...). No pongas colores en hexadecimal sueltos.
- Textos visibles en español. Código y comentarios en inglés.

## Nunca se sube

- Archivos `.env` o `.env.local`. Si hace falta una variable nueva, se agrega a `.env.example` sin el valor real.
- La carpeta `node_modules`.

## Si algo sale mal

- Hice commit en `main` o en `develop` por error: no hagas push, avisa al grupo.
- No sé en qué rama estoy: `git branch` muestra la actual con un `*`.
- Evita `git push --force` y `git reset --hard`. Pueden borrar el trabajo de los demás.