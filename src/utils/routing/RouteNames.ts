/**
 * `coerceId` exists to defend against backends that hand us an `_id` that
 * isn't a string (Mongo `ObjectId` instance, BSON `{ buffer: Buffer }` left
 * over from `class-transformer.classToPlain`, etc.). Without this, template
 * literals collapse the value to the string `"[object Object]"` and the
 * resulting URL — `/users/[object Object]` — 404s on the detail endpoint.
 *
 * The backend now normalises ObjectIds globally
 * (`MongoIdNormalizerInterceptor`) but this guard stays as belt-and-braces
 * so a stale build of either side can't reintroduce the same bug.
 */
function coerceId(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "string") return id;
  if (typeof id === "number" || typeof id === "bigint") return String(id);
  if (typeof id === "object") {
    const obj = id as Record<string, unknown> & {
      toHexString?: () => string;
      $oid?: string;
      _id?: unknown;
    };
    if (typeof obj.toHexString === "function") return obj.toHexString();
    if (typeof obj.$oid === "string") return obj.$oid;
    if (obj._id !== undefined && obj._id !== id) return coerceId(obj._id);
  }
  return String(id);
}

class RouteNames {
  static readonly LOGIN = "/login";
  static readonly DASHBOARD = "/";
  static readonly USERS = "/users";
  static readonly USER_DETAIL = (id: unknown) => `/users/${coerceId(id)}`;
  static readonly PROJECTS = "/projects";
  static readonly PROJECT_DETAIL = (id: unknown) => `/projects/${coerceId(id)}`;
  static readonly CREDITS = "/credits";
  static readonly MODELS = "/models";
  static readonly TASK_ROUTES = "/task-routes";
  static readonly PROVIDER_KEYS = "/provider-keys";
  static readonly AUDIT = "/audit";
  static readonly SETTINGS = "/settings";
}

export default RouteNames;
